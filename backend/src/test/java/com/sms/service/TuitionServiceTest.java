package com.sms.service;

import com.sms.dto.response.TuitionOverviewResponse;
import com.sms.entity.*;
import com.sms.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TuitionServiceTest {

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
    private com.sms.service.rule.CrossCuttingRuleEngine crossCuttingRuleEngine;

    @InjectMocks
    private TuitionService tuitionService;

    private Semester mockSemester;
    private Student mockStudent;
    private StudentInvoice mockInvoice;

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
        mockStudent.setStudentCode("2300001");
        mockStudent.setFullName("Nguyễn Văn A");

        mockInvoice = new StudentInvoice();
        mockInvoice.setId(100L);
        mockInvoice.setStudent(mockStudent);
        mockInvoice.setCredits(3);
        mockInvoice.setAmount(new BigDecimal("1350000"));
        mockInvoice.setStatus(StudentInvoice.InvoiceStatus.UNPAID);
    }

    @Test
    void testGetTuitionOverview_Success() {
        when(semesterRepository.findById(1)).thenReturn(Optional.of(mockSemester));
        when(enrollmentRepository.findActiveBySemesterId(1)).thenReturn(Collections.emptyList());
        when(invoiceRepository.findBySemesterIdWithDetails(1)).thenReturn(List.of(mockInvoice));

        TuitionOverviewResponse response = tuitionService.getTuitionOverview(1);

        assertNotNull(response);
        assertEquals(1, response.getTotalStudents());
        assertEquals(new BigDecimal("1350000"), response.getTotalTuition());
        assertEquals(BigDecimal.ZERO, response.getTotalCollected());
        assertEquals(new BigDecimal("1350000"), response.getTotalDebt());
        assertEquals(1, response.getStudents().size());

        TuitionOverviewResponse.StudentTuitionItemDto item = response.getStudents().get(0);
        assertEquals("2300001", item.getStudentCode());
        assertEquals("Nguyễn Văn A", item.getFullName());
        assertEquals("UNPAID", item.getStatus());
        assertEquals(new BigDecimal("1350000"), item.getUnpaidAmount());
    }

    @Test
    void testCollectCashPayment_Requires100Percent() {
        StudentInvoice invoice2 = new StudentInvoice();
        invoice2.setId(101L);
        invoice2.setStudent(mockStudent);
        invoice2.setStatus(StudentInvoice.InvoiceStatus.UNPAID);
        invoice2.setAmount(new BigDecimal("1350000"));

        when(studentRepository.findById(10L)).thenReturn(Optional.of(mockStudent));
        when(semesterRepository.findById(1)).thenReturn(Optional.of(mockSemester));
        when(invoiceRepository.findByIdInWithDetails(List.of(100L))).thenReturn(List.of(mockInvoice));
        when(invoiceRepository.findByStudentIdAndSemesterId(10L, 1)).thenReturn(List.of(mockInvoice, invoice2));

        com.sms.dto.request.TuitionPaymentRequest request = new com.sms.dto.request.TuitionPaymentRequest();
        request.setStudentId(10L);
        request.setSemesterId(1);
        request.setInvoiceIds(List.of(100L)); // Chỉ gửi 1 trong 2 môn unpaid

        assertThrows(com.sms.exception.BadRequestException.class, () -> {
            tuitionService.collectCashPayment(request, 1L);
        });
    }

    @Test
    void testExtendTuitionDeadline_Success() {
        when(studentRepository.findById(10L)).thenReturn(Optional.of(mockStudent));
        when(semesterRepository.findById(1)).thenReturn(Optional.of(mockSemester));
        when(invoiceRepository.findByStudentIdAndSemesterId(10L, 1)).thenReturn(List.of(mockInvoice));

        com.sms.dto.request.TuitionExtensionRequest request = new com.sms.dto.request.TuitionExtensionRequest();
        request.setStudentId(10L);
        request.setSemesterId(1);
        request.setDays(7);
        request.setReason("Đơn xin hoãn học phí");

        tuitionService.extendTuitionDeadline(request, 1L);

        assertEquals(LocalDate.now().plusDays(7), mockInvoice.getExtendedDeadline());
        assertEquals("Đơn xin hoãn học phí", mockInvoice.getExtensionReason());
        verify(invoiceRepository, times(1)).save(mockInvoice);
        verify(notificationService, times(1)).createNotification(eq(10L), any(), any(), any(), eq(10L));
    }

    @Test
    void testCollectBatchCashPayment_Success() {
        when(semesterRepository.findById(1)).thenReturn(Optional.of(mockSemester));
        when(studentRepository.findById(10L)).thenReturn(Optional.of(mockStudent));
        when(invoiceRepository.findByStudentIdAndSemesterId(10L, 1)).thenReturn(List.of(mockInvoice));

        com.sms.dto.request.TuitionBatchPaymentRequest request = com.sms.dto.request.TuitionBatchPaymentRequest.builder()
                .semesterId(1)
                .studentIds(List.of(10L))
                .note("Thu tiền mặt hàng loạt tại PĐT")
                .build();

        com.sms.dto.response.TuitionBatchPaymentResponse response = tuitionService.collectBatchCashPayment(request, 1L);

        assertNotNull(response);
        assertEquals(1, response.getTotalSuccessStudents());
        assertEquals(new BigDecimal("1350000"), response.getTotalAmount());
        assertEquals(1, response.getReceipts().size());
        assertEquals("TIỀN MẶT (CASH)", response.getReceipts().get(0).getPaymentMethod());
        assertEquals(StudentInvoice.InvoiceStatus.PAID, mockInvoice.getStatus());
        assertEquals("CASH", mockInvoice.getPaidMethod());
        assertNotNull(mockInvoice.getReceiptNumber());
        verify(invoiceRepository, times(1)).save(mockInvoice);
        verify(notificationService, times(1)).createNotification(eq(10L), any(), any(), any(), eq(10L));
    }

    @Test
    void testCollectBatchCashPayment_NoUnpaidStudents_ThrowsException() {
        when(semesterRepository.findById(1)).thenReturn(Optional.of(mockSemester));
        when(studentRepository.findById(10L)).thenReturn(Optional.of(mockStudent));
        mockInvoice.setStatus(StudentInvoice.InvoiceStatus.PAID);
        when(invoiceRepository.findByStudentIdAndSemesterId(10L, 1)).thenReturn(List.of(mockInvoice));

        com.sms.dto.request.TuitionBatchPaymentRequest request = com.sms.dto.request.TuitionBatchPaymentRequest.builder()
                .semesterId(1)
                .studentIds(List.of(10L))
                .build();

        assertThrows(com.sms.exception.BadRequestException.class, () -> {
            tuitionService.collectBatchCashPayment(request, 1L);
        });
    }

    @Test
    void testSimulateStudentPayment_Success() {
        when(studentRepository.findById(10L)).thenReturn(Optional.of(mockStudent));
        when(semesterRepository.findByIsCurrentTrue()).thenReturn(Optional.of(mockSemester));
        when(invoiceRepository.findByStudentIdAndStatus(10L, StudentInvoice.InvoiceStatus.UNPAID))
                .thenReturn(List.of(mockInvoice));

        com.sms.dto.request.SimulatePayRequest request = new com.sms.dto.request.SimulatePayRequest(null, "Test simulate pay");
        com.sms.dto.response.ReceiptResponse res = tuitionService.simulateStudentPayment(10L, request);

        assertNotNull(res);
        assertTrue(res.getReceiptNumber().startsWith("REC-MOCK-"));
        assertEquals(new BigDecimal("1350000"), res.getTotalAmount());
        assertEquals(StudentInvoice.InvoiceStatus.PAID, mockInvoice.getStatus());
        assertEquals("ONLINE_MOCK", mockInvoice.getPaidMethod());
        verify(invoiceRepository, times(1)).save(mockInvoice);
        verify(crossCuttingRuleEngine, times(1)).releaseFinancialHoldIfDebtCleared(10L);
        verify(notificationService, times(1)).createNotification(eq(10L), any(), any(), any(), eq(10L));
    }
}
