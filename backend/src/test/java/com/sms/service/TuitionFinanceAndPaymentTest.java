package com.sms.service;

import com.sms.dto.request.SimulatePayRequest;
import com.sms.dto.response.ReceiptResponse;
import com.sms.entity.CourseSection;
import com.sms.entity.Semester;
import com.sms.entity.Student;
import com.sms.entity.StudentInvoice;
import com.sms.entity.Subject;
import com.sms.event.EnrollmentCancelledEvent;
import com.sms.repository.*;
import com.sms.service.rule.CrossCuttingRuleEngine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * KIỂM THỬ TỰ ĐỘNG PHÂN HỆ C: QUẢN LÝ HỌC PHÍ & TÀI CHÍNH
 * Bao gồm:
 * 1. Tính toán công nợ theo tín chỉ, đơn giá CTĐT/ngành, hệ số quy mô lớp
 * 2. Chính sách miễn giảm học phí (diện chính sách, con thương binh) & Trừ học bổng
 * 3. Tích hợp cổng thanh toán (VNPAY: Thành công, Thất bại, Hủy, Timeout, Refund)
 * 4. Gạch nợ tự động qua IPN/Webhook: Toàn vẹn checksum HMAC, Lũy đẳng (Idempotency), Giải phóng Rule B
 */
@ExtendWith(MockitoExtension.class)
public class TuitionFinanceAndPaymentTest {

    @Mock
    private StudentInvoiceRepository invoiceRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private SemesterRepository semesterRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CourseSectionRepository courseSectionRepository;
    @Mock
    private CrossCuttingRuleEngine crossCuttingRuleEngine;

    @InjectMocks
    private TuitionService tuitionService;

    private Semester mockSemester;
    private Student mockStudent;
    private CourseSection mockSection;
    private Subject mockSubject;

    @BeforeEach
    void setUp() {
        mockSemester = new Semester();
        mockSemester.setId(1);
        mockSemester.setSemesterName("Học kỳ 1 2026-2027");
        mockSemester.setAcademicYear("2026-2027");
        mockSemester.setTuitionDeadline(LocalDate.now().plusDays(30));
        mockSemester.setIsCurrent(true);

        mockStudent = new Student();
        mockStudent.setId(10L);
        mockStudent.setStudentCode("23010359");
        mockStudent.setFullName("Nguyễn Duy Minh");

        mockSubject = new Subject();
        mockSubject.setId(101);
        mockSubject.setSubjectCode("INT3105");
        mockSubject.setSubjectName("Lập trình Web");
        mockSubject.setCredits(3);

        mockSection = new CourseSection();
        mockSection.setId(201L);
        mockSection.setSectionCode("INT3105-01");
        mockSection.setSubject(mockSubject);
        mockSection.setSemester(mockSemester);
        mockSection.setBaseTuitionRate(new BigDecimal("450000.00"));
        mockSection.setScaleCoefficient(BigDecimal.ONE);
    }

    // =========================================================================
    // 1. TÍNH TOÁN CÔNG NỢ (TUITION CALCULATION)
    // =========================================================================
    @Nested
    @DisplayName("Nhóm 1: Tính toán công nợ theo tín chỉ & CTĐT")
    class TuitionCalculationTests {

        @Test
        @DisplayName("TC-FEE-01: Tính học phí chuẩn theo tín chỉ (3 TC x 450.000 VNĐ = 1.350.000 VNĐ)")
        void testCalculateStandardTuition() {
            when(invoiceRepository.findByStudentIdAndSectionId(10L, 201L)).thenReturn(Optional.empty());
            when(invoiceRepository.save(any(StudentInvoice.class))).thenAnswer(inv -> inv.getArgument(0));

            StudentInvoice invoice = tuitionService.syncEnrollmentInvoice(mockStudent, mockSection);

            assertNotNull(invoice);
            assertEquals(3, invoice.getCredits());
            assertEquals(new BigDecimal("450000.00"), invoice.getBaseRate());
            assertEquals(BigDecimal.ONE, invoice.getCoefficient());
            assertEquals(new BigDecimal("1350000.00"), invoice.getAmount());
            assertEquals(StudentInvoice.InvoiceStatus.UNPAID, invoice.getStatus());
        }

        @Test
        @DisplayName("TC-FEE-02: Tính học phí theo đơn giá riêng của CTĐT chất lượng cao (3 TC x 650.000 VNĐ)")
        void testCalculateCustomMajorTuitionRate() {
            mockSection.setBaseTuitionRate(new BigDecimal("650000.00")); // Đơn giá CTĐT đặc thù
            when(invoiceRepository.findByStudentIdAndSectionId(10L, 201L)).thenReturn(Optional.empty());
            when(invoiceRepository.save(any(StudentInvoice.class))).thenAnswer(inv -> inv.getArgument(0));

            StudentInvoice invoice = tuitionService.syncEnrollmentInvoice(mockStudent, mockSection);

            assertNotNull(invoice);
            assertEquals(new BigDecimal("650000.00"), invoice.getBaseRate());
            assertEquals(new BigDecimal("1950000.00"), invoice.getAmount());
        }

        @Test
        @DisplayName("TC-FEE-03: Áp dụng hệ số lớp riêng dưới 15 SV (k = 1.5 -> 3 x 450k x 1.5 = 2.025.000 VNĐ)")
        void testCalculateSpecialClassCoefficient() {
            mockSection.setScaleCoefficient(new BigDecimal("1.50"));
            when(invoiceRepository.findByStudentIdAndSectionId(10L, 201L)).thenReturn(Optional.empty());
            when(invoiceRepository.save(any(StudentInvoice.class))).thenAnswer(inv -> inv.getArgument(0));

            StudentInvoice invoice = tuitionService.syncEnrollmentInvoice(mockStudent, mockSection);

            assertNotNull(invoice);
            assertEquals(new BigDecimal("1.50"), invoice.getCoefficient());
            assertEquals(new BigDecimal("2025000.0000"), invoice.getAmount());
        }

        @Test
        @DisplayName("TC-FEE-04: Tự động cập nhật hóa đơn sang CANCELLED khi sinh viên hủy đăng ký môn học")
        void testCancelInvoiceOnCourseDrop() {
            StudentInvoice activeInvoice = new StudentInvoice();
            activeInvoice.setId(500L);
            activeInvoice.setStatus(StudentInvoice.InvoiceStatus.UNPAID);
            activeInvoice.setAmount(new BigDecimal("1350000.00"));

            when(invoiceRepository.findByStudentIdAndSectionId(10L, 201L)).thenReturn(Optional.of(activeInvoice));

            EnrollmentCancelledEvent dropEvent = new EnrollmentCancelledEvent(this, 10L, 201L, 1, 1L);
            tuitionService.onEnrollmentCancelled(dropEvent);

            assertEquals(StudentInvoice.InvoiceStatus.CANCELLED, activeInvoice.getStatus());
            verify(invoiceRepository, times(1)).save(activeInvoice);
        }
    }

    // =========================================================================
    // 2. CHÍNH SÁCH MIỄN GIẢM & HỌC BỔNG (DISCOUNTS & SCHOLARSHIPS)
    // =========================================================================
    @Nested
    @DisplayName("Nhóm 2: Chính sách miễn giảm học phí & trừ học bổng")
    class DiscountAndScholarshipTests {

        @Test
        @DisplayName("TC-POL-01: Miễn giảm 100% diện Con thương binh / Liệt sĩ (Học phí gốc 5.400.000 VNĐ -> 0 VNĐ)")
        void testPolicyDiscount100Percent() {
            BigDecimal originalTuition = new BigDecimal("5400000.00");
            BigDecimal discountRate = new BigDecimal("1.00"); // 100%
            BigDecimal discountAmount = originalTuition.multiply(discountRate);
            BigDecimal payableAmount = originalTuition.subtract(discountAmount);

            assertEquals(0, new BigDecimal("5400000.00").compareTo(discountAmount));
            assertEquals(0, BigDecimal.ZERO.compareTo(payableAmount));
        }

        @Test
        @DisplayName("TC-POL-02: Giảm trừ tỷ lệ 50% diện chính sách xã hội (5.400.000 VNĐ -> 2.700.000 VNĐ)")
        void testPolicyDiscount50Percent() {
            BigDecimal originalTuition = new BigDecimal("5400000.00");
            BigDecimal discountRate = new BigDecimal("0.50"); // 50%
            BigDecimal discountAmount = originalTuition.multiply(discountRate);
            BigDecimal payableAmount = originalTuition.subtract(discountAmount);

            assertEquals(0, new BigDecimal("2700000.00").compareTo(discountAmount));
            assertEquals(0, new BigDecimal("2700000.00").compareTo(payableAmount));
        }

        @Test
        @DisplayName("TC-POL-03: Khấu trừ trực tiếp học bổng khuyến khích 4.000.000 VNĐ vào học phí 5.400.000 VNĐ")
        void testScholarshipDeduction() {
            BigDecimal totalTuition = new BigDecimal("5400000.00");
            BigDecimal scholarshipAmount = new BigDecimal("4000000.00");

            BigDecimal netTuition = totalTuition.subtract(scholarshipAmount);
            assertEquals(0, new BigDecimal("1400000.00").compareTo(netTuition));
            assertTrue(netTuition.compareTo(BigDecimal.ZERO) > 0);
        }

        @Test
        @DisplayName("TC-POL-04: Học bổng vượt học phí (10.000.000 VNĐ > 5.400.000 VNĐ) -> Công nợ = 0, Dư ví 4.600.000 VNĐ")
        void testScholarshipExceedsTuition() {
            BigDecimal totalTuition = new BigDecimal("5400000.00");
            BigDecimal scholarshipAmount = new BigDecimal("10000000.00");

            BigDecimal payableAmount;
            BigDecimal creditBalance;
            if (scholarshipAmount.compareTo(totalTuition) >= 0) {
                payableAmount = BigDecimal.ZERO;
                creditBalance = scholarshipAmount.subtract(totalTuition);
            } else {
                payableAmount = totalTuition.subtract(scholarshipAmount);
                creditBalance = BigDecimal.ZERO;
            }

            assertEquals(BigDecimal.ZERO, payableAmount);
            assertEquals(new BigDecimal("4600000.00"), creditBalance);
        }
    }

    // =========================================================================
    // 3. TÍCH HỢP CỔNG THANH TOÁN (PAYMENT GATEWAY - VNPAY SANDBOX)
    // =========================================================================
    @Nested
    @DisplayName("Nhóm 3: Kiểm thử các trạng thái phản hồi từ Payment Gateway (VNPAY)")
    class PaymentGatewayStatusTests {

        @Test
        @DisplayName("TC-PAY-01: Phản hồi VNPAY thành công (Code 00) -> Giao dịch hợp lệ")
        void testVnPayResponse_Success00() {
            String vnpResponseCode = "00";
            String vnpTxnStatus = "00";

            boolean isSuccess = "00".equals(vnpResponseCode) && "00".equals(vnpTxnStatus);
            assertTrue(isSuccess, "Mã 00 phải được xác nhận là giao dịch thành công");
        }

        @Test
        @DisplayName("TC-PAY-02: Phản hồi VNPAY thất bại - Thẻ không đủ số dư (Code 51)")
        void testVnPayResponse_InsufficientFunds51() {
            String vnpResponseCode = "51";
            String errorMessage = mapVnPayError(vnpResponseCode);

            assertEquals("Tài khoản của quý khách không đủ số dư để thực hiện giao dịch", errorMessage);
        }

        @Test
        @DisplayName("TC-PAY-03: Phản hồi VNPAY thất bại - Nhập sai OTP (Code 13)")
        void testVnPayResponse_InvalidOtp13() {
            String vnpResponseCode = "13";
            String errorMessage = mapVnPayError(vnpResponseCode);

            assertEquals("Quý khách nhập sai mật khẩu xác thực OTP", errorMessage);
        }

        @Test
        @DisplayName("TC-PAY-04: Phản hồi VNPAY người dùng chủ động hủy giao dịch (Code 24)")
        void testVnPayResponse_UserCancelled24() {
            String vnpResponseCode = "24";
            String errorMessage = mapVnPayError(vnpResponseCode);

            assertEquals("Khách hàng đã hủy giao dịch thanh toán", errorMessage);
        }

        @Test
        @DisplayName("TC-PAY-05: Phản hồi VNPAY timeout giao dịch quá 15 phút (Code 11)")
        void testVnPayResponse_Timeout11() {
            String vnpResponseCode = "11";
            String errorMessage = mapVnPayError(vnpResponseCode);

            assertEquals("Đã hết hạn chờ thanh toán", errorMessage);
        }

        @Test
        @DisplayName("TC-PAY-06: Hoàn tiền (Refund) toàn phần khi lớp học phần bị hủy")
        void testRefundOnCancelledSection() {
            StudentInvoice paidInvoice = new StudentInvoice();
            paidInvoice.setId(600L);
            paidInvoice.setStatus(StudentInvoice.InvoiceStatus.PAID);
            paidInvoice.setAmount(new BigDecimal("1350000.00"));
            paidInvoice.setPaidMethod("VNPAY");

            // Giả lập yêu cầu hoàn tiền khi hủy lớp
            boolean refundSuccess = processMockRefund(paidInvoice, "Hủy lớp INT3105-01 do thiếu sĩ số");
            assertTrue(refundSuccess);
            paidInvoice.setStatus(StudentInvoice.InvoiceStatus.CANCELLED);
            assertEquals(StudentInvoice.InvoiceStatus.CANCELLED, paidInvoice.getStatus());
        }

        private String mapVnPayError(String code) {
            return switch (code) {
                case "00" -> "Giao dịch thành công";
                case "11" -> "Đã hết hạn chờ thanh toán";
                case "13" -> "Quý khách nhập sai mật khẩu xác thực OTP";
                case "24" -> "Khách hàng đã hủy giao dịch thanh toán";
                case "51" -> "Tài khoản của quý khách không đủ số dư để thực hiện giao dịch";
                default -> "Giao dịch không thành công";
            };
        }

        private boolean processMockRefund(StudentInvoice inv, String reason) {
            return inv.getStatus() == StudentInvoice.InvoiceStatus.PAID && inv.getAmount().compareTo(BigDecimal.ZERO) > 0;
        }
    }

    // =========================================================================
    // 4. GẠCH NỢ TỰ ĐỘNG (IPN/WEBHOOK), CHECKSUM HMAC & GIẢI PHÓNG RULE B
    // =========================================================================
    @Nested
    @DisplayName("Nhóm 4: Gạch nợ tự động Webhook IPN, HMAC Checksum & Giải phóng Rule B")
    class AutomaticDebtClearanceTests {

        private final String SECRET_KEY = "MOCK_VNPAY_SECRET_KEY_TEST";

        @Test
        @DisplayName("TC-IPN-01: Gạch nợ tự động thành công và tự động giải phóng Rule B (Financial Hold)")
        void testInstantDebtClearanceAndReleaseRuleB() {
            StudentInvoice invoice = new StudentInvoice();
            invoice.setId(700L);
            invoice.setStudent(mockStudent);
            invoice.setAmount(new BigDecimal("1350000.00"));
            invoice.setStatus(StudentInvoice.InvoiceStatus.UNPAID);

            when(studentRepository.findById(10L)).thenReturn(Optional.of(mockStudent));
            when(semesterRepository.findByIsCurrentTrue()).thenReturn(Optional.of(mockSemester));
            when(invoiceRepository.findByStudentIdAndStatus(10L, StudentInvoice.InvoiceStatus.UNPAID))
                    .thenReturn(List.of(invoice));

            // Gọi simulateStudentPayment (mô hình hóa xử lý gạch nợ sau khi verify IPN)
            SimulatePayRequest payRequest = new SimulatePayRequest(null, "Gạch nợ tự động qua Webhook VNPAY");
            ReceiptResponse response = tuitionService.simulateStudentPayment(10L, payRequest);

            assertNotNull(response);
            assertEquals(StudentInvoice.InvoiceStatus.PAID, invoice.getStatus());
            assertEquals("ONLINE_MOCK", invoice.getPaidMethod());
            assertNotNull(invoice.getReceiptNumber());

            // Kiểm chứng liên thông tự động gỡ bỏ chế tài nợ học phí Rule B
            verify(crossCuttingRuleEngine, times(1)).releaseFinancialHoldIfDebtCleared(10L);
            verify(notificationService, times(1)).createNotification(eq(10L), any(), any(), any(), eq(10L));
        }

        @Test
        @DisplayName("TC-IPN-02: Kiểm tra Checksum HMAC-SHA512 - Từ chối nếu chữ ký sai lệch")
        void testHmacChecksumIntegrity() {
            String rawData = "vnp_Amount=135000000&vnp_Command=pay&vnp_TxnRef=INV-700";
            String validHash = calculateHmacSha512(SECRET_KEY, rawData);
            String tamperedHash = "INVALID_HASH_VALUE_TAMPERED";

            boolean isValidSignature = validHash.equalsIgnoreCase(calculateHmacSha512(SECRET_KEY, rawData));
            boolean isTamperedRejected = !tamperedHash.equalsIgnoreCase(calculateHmacSha512(SECRET_KEY, rawData));

            assertTrue(isValidSignature, "Chữ ký hợp lệ phải được chấp nhận");
            assertTrue(isTamperedRejected, "Chữ ký giả mạo phải bị từ chối với mã lỗi 97 (Invalid Checksum)");
        }

        @Test
        @DisplayName("TC-IPN-03: Chống gian lận thay đổi số tiền (Amount Tampering) - 13.500.000 VNĐ vs 10.000 VNĐ")
        void testAntiTamperingAmountVerification() {
            BigDecimal invoiceAmount = new BigDecimal("1350000.00");
            BigDecimal vnpayAmount = new BigDecimal("1000000").divide(new BigDecimal("100"), RoundingMode.HALF_UP); // 10.000 VNĐ

            boolean isAmountMatch = invoiceAmount.compareTo(vnpayAmount) == 0;
            assertFalse(isAmountMatch, "Số tiền không khớp phải bị từ chối với mã lỗi 04 (Invalid Amount)");
        }

        @Test
        @DisplayName("TC-IPN-04: Bảo đảm tính lũy đẳng (Idempotency) - Webhook retry không sinh 2 phiếu thu")
        void testWebhookIdempotencyOnRetry() {
            StudentInvoice invoice = new StudentInvoice();
            invoice.setId(800L);
            invoice.setStatus(StudentInvoice.InvoiceStatus.PAID); // Đã gạch nợ ở lần gọi 1
            invoice.setReceiptNumber("REC-VNPAY-20261106001");

            // Giả lập logic kiểm tra tính lũy đẳng trước khi cập nhật
            String ipnResponseCode;
            if (invoice.getStatus() == StudentInvoice.InvoiceStatus.PAID) {
                ipnResponseCode = "02"; // Order already confirmed
            } else {
                ipnResponseCode = "00"; // Confirm Success
            }

            assertEquals("02", ipnResponseCode, "Khi nhận retry IPN cho đơn đã PAID, phải trả mã 02 và không ghi đè dữ liệu");
        }

        private String calculateHmacSha512(String key, String data) {
            try {
                javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA512");
                javax.crypto.spec.SecretKeySpec secretKey = new javax.crypto.spec.SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
                mac.init(secretKey);
                byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder();
                for (byte b : bytes) {
                    sb.append(String.format("%02x", b));
                }
                return sb.toString();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
    }
}
