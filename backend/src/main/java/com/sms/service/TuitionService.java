package com.sms.service;

import com.sms.dto.request.TuitionBatchPaymentRequest;
import com.sms.dto.request.TuitionExtensionRequest;
import com.sms.dto.request.TuitionPaymentRequest;
import com.sms.dto.response.OverdueStudentDto;
import com.sms.dto.response.ReceiptResponse;
import com.sms.dto.response.TuitionBatchPaymentResponse;
import com.sms.dto.response.TuitionOverviewResponse;
import com.sms.dto.response.TuitionSummaryResponse;
import com.sms.entity.*;
import com.sms.event.EnrollmentCancelledEvent;
import com.sms.event.EnrollmentCreatedEvent;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TuitionService {

    private final StudentInvoiceRepository invoiceRepository;
    private final StudentRepository studentRepository;
    private final SemesterRepository semesterRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final com.sms.service.rule.CrossCuttingRuleEngine crossCuttingRuleEngine;

    private static final BigDecimal DEFAULT_BASE_TUITION_RATE = new BigDecimal("450000.00");

    private StudentInvoice createUnpaidInvoice(Student student, CourseSection section) {
        StudentInvoice invoice = new StudentInvoice();
        invoice.setStudent(student);
        invoice.setSection(section);
        int credits = (section.getSubject() != null && section.getSubject().getCredits() != null)
                ? section.getSubject().getCredits() : 3;
        BigDecimal baseRate = (section.getBaseTuitionRate() != null && section.getBaseTuitionRate().compareTo(BigDecimal.ZERO) > 0)
                ? section.getBaseTuitionRate() : DEFAULT_BASE_TUITION_RATE;
        BigDecimal coefficient = section.getScaleCoefficient() != null
                ? section.getScaleCoefficient() : BigDecimal.ONE;

        invoice.setCredits(credits);
        invoice.setBaseRate(baseRate);
        invoice.setCoefficient(coefficient);
        invoice.setAmount(baseRate.multiply(BigDecimal.valueOf(credits)).multiply(coefficient));
        invoice.setStatus(StudentInvoice.InvoiceStatus.UNPAID);
        return invoice;
    }

    @Transactional
    public StudentInvoice syncEnrollmentInvoice(Student student, CourseSection section) {
        if (student == null || section == null) {
            return null;
        }

        Optional<StudentInvoice> existingOpt = invoiceRepository.findByStudentIdAndSectionId(student.getId(), section.getId());
        if (existingOpt.isPresent()) {
            StudentInvoice invoice = existingOpt.get();
            if (invoice.getStatus() == StudentInvoice.InvoiceStatus.CANCELLED) {
                invoice.setStatus(StudentInvoice.InvoiceStatus.UNPAID);
                StudentInvoice saved = invoiceRepository.save(invoice);
                log.info("Đã khôi phục hóa đơn học phí sang UNPAID: invoiceId={}", saved.getId());
                return saved;
            }
            return invoice;
        } else {
            StudentInvoice invoice = createUnpaidInvoice(student, section);
            StudentInvoice saved = invoiceRepository.save(invoice);
            log.info("Đã tạo mới hóa đơn học phí UNPAID: invoiceId={}, amount={}", saved.getId(), saved.getAmount());
            return saved;
        }
    }

    @Transactional
    @EventListener
    public void onEnrollmentCreated(EnrollmentCreatedEvent event) {
        log.info("Xử lý sự kiện đăng ký học phần: studentId={}, sectionId={}", event.getStudentId(), event.getSectionId());
        Student student = studentRepository.findById(event.getStudentId()).orElse(null);
        CourseSection section = courseSectionRepository.findById(event.getSectionId()).orElse(null);
        syncEnrollmentInvoice(student, section);
    }

    @Transactional
    @EventListener
    public void onEnrollmentCancelled(EnrollmentCancelledEvent event) {
        log.info("Xử lý sự kiện hủy học phần: studentId={}, sectionId={}", event.getStudentId(), event.getSectionId());
        invoiceRepository.findByStudentIdAndSectionId(event.getStudentId(), event.getSectionId())
                .ifPresent(invoice -> {
                    if (invoice.getStatus() == StudentInvoice.InvoiceStatus.UNPAID) {
                        invoice.setStatus(StudentInvoice.InvoiceStatus.CANCELLED);
                        invoiceRepository.save(invoice);
                        log.info("Đã cập nhật hóa đơn học phí sang CANCELLED: invoiceId={}", invoice.getId());
                    }
                });
    }

    private record InvoiceMetrics(
            int totalCredits,
            int totalCourses,
            BigDecimal totalAmount,
            BigDecimal paidAmount,
            BigDecimal unpaidAmount,
            LocalDate maxDeadline,
            String extensionReason,
            String status
    ) {}

    private InvoiceMetrics calculateMetrics(List<StudentInvoice> invoices) {
        int totalCredits = 0;
        int totalCourses = 0;
        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal paidAmount = BigDecimal.ZERO;
        BigDecimal unpaidAmount = BigDecimal.ZERO;
        LocalDate maxDeadline = null;
        String extReason = null;

        for (StudentInvoice inv : invoices) {
            if (inv.getStatus() != StudentInvoice.InvoiceStatus.CANCELLED) {
                if (inv.getExtendedDeadline() != null && (maxDeadline == null || inv.getExtendedDeadline().isAfter(maxDeadline))) {
                    maxDeadline = inv.getExtendedDeadline();
                    extReason = inv.getExtensionReason();
                }
                totalCredits += inv.getCredits() != null ? inv.getCredits() : 0;
                totalCourses++;
                BigDecimal amt = inv.getAmount() != null ? inv.getAmount() : BigDecimal.ZERO;
                totalAmount = totalAmount.add(amt);
                if (inv.getStatus() == StudentInvoice.InvoiceStatus.PAID) {
                    paidAmount = paidAmount.add(amt);
                } else {
                    unpaidAmount = unpaidAmount.add(amt);
                }
            }
        }
        String status = unpaidAmount.compareTo(BigDecimal.ZERO) <= 0 ? "PAID"
                : (paidAmount.compareTo(BigDecimal.ZERO) > 0 ? "PARTIAL" : "UNPAID");
        return new InvoiceMetrics(totalCredits, totalCourses, totalAmount, paidAmount, unpaidAmount, maxDeadline, extReason, status);
    }

    private TuitionSummaryResponse.InvoiceItemDto mapToInvoiceDto(StudentInvoice inv) {
        return TuitionSummaryResponse.InvoiceItemDto.builder()
                .invoiceId(inv.getId())
                .sectionId(inv.getSection() != null ? inv.getSection().getId() : null)
                .sectionCode(inv.getSection() != null ? inv.getSection().getSectionCode() : "")
                .subjectCode(inv.getSection() != null && inv.getSection().getSubject() != null ? inv.getSection().getSubject().getSubjectCode() : "")
                .subjectName(inv.getSection() != null && inv.getSection().getSubject() != null ? inv.getSection().getSubject().getSubjectName() : "")
                .credits(inv.getCredits())
                .baseRate(inv.getBaseRate())
                .coefficient(inv.getCoefficient())
                .amount(inv.getAmount())
                .status(inv.getStatus().name())
                .paidAt(inv.getPaidAt())
                .receiptNumber(inv.getReceiptNumber())
                .extendedDeadline(inv.getExtendedDeadline())
                .extensionReason(inv.getExtensionReason())
                .build();
    }

    /**
     * Đồng bộ các môn học đã đăng ký trong học kỳ sang hóa đơn học phí nếu chưa tồn tại
     */
    @Transactional
    public void syncInvoicesForStudentSemester(Student student, Semester semester) {
        List<Enrollment> enrollments = enrollmentRepository.findActiveByStudentId(student.getId()).stream()
                .filter(e -> e.getSection() != null && e.getSection().getSemester() != null
                        && e.getSection().getSemester().getId().equals(semester.getId()))
                .toList();

        List<StudentInvoice> existing = invoiceRepository.findByStudentIdAndSemesterId(student.getId(), semester.getId());
        Set<Long> activeSectionIds = enrollments.stream()
                .filter(e -> e.getSection() != null)
                .map(e -> e.getSection().getId())
                .collect(Collectors.toSet());

        Set<Long> existingSectionIds = existing.stream()
                .filter(i -> i.getSection() != null)
                .map(i -> i.getSection().getId())
                .collect(Collectors.toSet());

        // Tự động hủy hóa đơn UNPAID của các học phần sinh viên đã hủy đăng ký,
        // và tự động khôi phục hóa đơn UNPAID nếu sinh viên đăng ký lại học phần từng bị CANCELLED
        for (StudentInvoice inv : existing) {
            if (inv.getSection() == null) continue;
            Long secId = inv.getSection().getId();
            if (inv.getStatus() == StudentInvoice.InvoiceStatus.UNPAID && !activeSectionIds.contains(secId)) {
                inv.setStatus(StudentInvoice.InvoiceStatus.CANCELLED);
                invoiceRepository.save(inv);
            } else if (inv.getStatus() == StudentInvoice.InvoiceStatus.CANCELLED && activeSectionIds.contains(secId)) {
                inv.setStatus(StudentInvoice.InvoiceStatus.UNPAID);
                invoiceRepository.save(inv);
            }
        }

        List<StudentInvoice> toSave = enrollments.stream()
                .map(Enrollment::getSection)
                .filter(sec -> sec != null && !existingSectionIds.contains(sec.getId()))
                .map(sec -> createUnpaidInvoice(student, sec))
                .toList();

        if (!toSave.isEmpty()) {
            invoiceRepository.saveAll(toSave);
        }
    }

    /**
     * Lấy danh sách tổng quan học phí và công nợ toàn trường trong một học kỳ
     */
    @Transactional
    public TuitionOverviewResponse getTuitionOverview(Integer semesterId) {
        Semester semester = semesterId != null
                ? semesterRepository.findById(semesterId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học kỳ"))
                : semesterRepository.findByIsCurrentTrue().orElseGet(() -> semesterRepository.findAllByOrderByStartDateDesc().stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Chưa thiết lập học kỳ nào")));

        // Tải danh sách hóa đơn hiện có kèm chi tiết
        List<StudentInvoice> invoices = new ArrayList<>(invoiceRepository.findBySemesterIdWithDetails(semester.getId()));

        // Tự động đồng bộ các hóa đơn còn thiếu (batch in-memory để chống N+1 bottleneck)
        try {
            Set<String> existingKeys = invoices.stream()
                    .filter(inv -> inv.getStudent() != null && inv.getSection() != null)
                    .map(inv -> inv.getStudent().getId() + "_" + inv.getSection().getId())
                    .collect(Collectors.toSet());

            List<Enrollment> activeEnrollments = enrollmentRepository.findActiveBySemesterId(semester.getId());
            List<StudentInvoice> missingInvoices = new ArrayList<>();
            for (Enrollment enr : activeEnrollments) {
                Student st = enr.getStudent();
                CourseSection sec = enr.getSection();
                if (st != null && sec != null && !existingKeys.contains(st.getId() + "_" + sec.getId())) {
                    missingInvoices.add(createUnpaidInvoice(st, sec));
                    existingKeys.add(st.getId() + "_" + sec.getId());
                }
            }
            if (!missingInvoices.isEmpty()) {
                invoiceRepository.saveAll(missingInvoices);
                invoices.addAll(missingInvoices);
            }
        } catch (Exception e) {
            log.warn("Không thể đồng bộ tự động hóa đơn cho kỳ {}: {}", semester.getId(), e.getMessage());
        }

        // Gom nhóm hóa đơn theo sinh viên
        Map<Student, List<StudentInvoice>> grouped = invoices.stream()
                .filter(inv -> inv.getStudent() != null)
                .collect(Collectors.groupingBy(StudentInvoice::getStudent));

        List<TuitionOverviewResponse.StudentTuitionItemDto> studentItems = new ArrayList<>();
        BigDecimal totalTuition = BigDecimal.ZERO;
        BigDecimal totalCollected = BigDecimal.ZERO;
        BigDecimal totalDebt = BigDecimal.ZERO;

        for (Map.Entry<Student, List<StudentInvoice>> entry : grouped.entrySet()) {
            Student st = entry.getKey();
            InvoiceMetrics m = calculateMetrics(entry.getValue());
            if (m.totalCourses() == 0) continue;

            totalTuition = totalTuition.add(m.totalAmount());
            totalCollected = totalCollected.add(m.paidAmount());
            totalDebt = totalDebt.add(m.unpaidAmount());

            boolean isExtended = m.maxDeadline() != null && !LocalDate.now().isAfter(m.maxDeadline());

            String className = (st.getClassEntity() != null) ? st.getClassEntity().getName() : "";
            Long classId = (st.getClassEntity() != null && st.getClassEntity().getId() != null)
                    ? st.getClassEntity().getId().longValue() : null;
            String deptName = (st.getClassEntity() != null && st.getClassEntity().getDepartment() != null)
                    ? st.getClassEntity().getDepartment().getName() : "";
            Long deptId = (st.getClassEntity() != null && st.getClassEntity().getDepartment() != null && st.getClassEntity().getDepartment().getId() != null)
                    ? st.getClassEntity().getDepartment().getId().longValue() : null;

            studentItems.add(TuitionOverviewResponse.StudentTuitionItemDto.builder()
                    .studentId(st.getId())
                    .studentCode(st.getStudentCode())
                    .fullName(st.getFullName())
                    .classId(classId)
                    .className(className)
                    .departmentId(deptId)
                    .departmentName(deptName)
                    .phone(st.getPhone())
                    .email(st.getEmail())
                    .totalCredits(m.totalCredits())
                    .totalCourses(m.totalCourses())
                    .totalAmount(m.totalAmount())
                    .paidAmount(m.paidAmount())
                    .unpaidAmount(m.unpaidAmount())
                    .status(m.status())
                    .extendedDeadline(m.maxDeadline())
                    .extensionReason(m.extensionReason())
                    .isExtended(isExtended)
                    .build());
        }

        // Sắp xếp: sinh viên có công nợ nhiều nhất lên đầu, tiếp theo là theo MSSV
        studentItems.sort((a, b) -> {
            int cmp = b.getUnpaidAmount().compareTo(a.getUnpaidAmount());
            if (cmp != 0) return cmp;
            return a.getStudentCode().compareToIgnoreCase(b.getStudentCode());
        });

        return TuitionOverviewResponse.builder()
                .semesterId(semester.getId())
                .semesterName(semester.getSemesterName())
                .academicYear(semester.getAcademicYear())
                .tuitionDeadline(semester.getTuitionDeadline())
                .isRegistrationOpen(semester.isRegistrationOpen())
                .totalStudents(studentItems.size())
                .totalTuition(totalTuition)
                .totalCollected(totalCollected)
                .totalDebt(totalDebt)
                .students(studentItems)
                .build();
    }

    /**
     * Lấy bảng kê tổng quan học phí của sinh viên trong một học kỳ cụ thể
     */
    @Transactional
    public TuitionSummaryResponse getStudentTuitionSummary(Long studentId, Integer semesterId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));

        Semester semester = semesterId != null
                ? semesterRepository.findById(semesterId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học kỳ"))
                : semesterRepository.findByIsCurrentTrue().orElseGet(() -> semesterRepository.findAllByOrderByStartDateDesc().stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Chưa thiết lập học kỳ nào")));

        // Tự động tạo hóa đơn cho các môn đăng ký còn thiếu
        syncInvoicesForStudentSemester(student, semester);

        List<StudentInvoice> invoices = invoiceRepository.findByStudentIdAndSemesterId(student.getId(), semester.getId());
        InvoiceMetrics m = calculateMetrics(invoices);
        List<TuitionSummaryResponse.InvoiceItemDto> itemDtos = invoices.stream()
                .map(this::mapToInvoiceDto)
                .toList();

        boolean isExtended = m.maxDeadline() != null && !LocalDate.now().isAfter(m.maxDeadline());

        return TuitionSummaryResponse.builder()
                .studentId(student.getId())
                .studentCode(student.getStudentCode())
                .fullName(student.getFullName())
                .className(student.getClassEntity() != null ? student.getClassEntity().getName() : "")
                .majorName(student.getClassEntity() != null && student.getClassEntity().getMajor() != null ? student.getClassEntity().getMajor().getName() : "")
                .departmentName(student.getClassEntity() != null && student.getClassEntity().getDepartment() != null ? student.getClassEntity().getDepartment().getName() : "")
                .semesterId(semester.getId())
                .semesterCode(semester.getSemesterCode())
                .semesterName(semester.getSemesterName())
                .tuitionDeadline(semester.getTuitionDeadline())
                .isRegistrationOpen(semester.isRegistrationOpen())
                .totalCredits(m.totalCredits())
                .totalAmount(m.totalAmount())
                .paidAmount(m.paidAmount())
                .unpaidAmount(m.unpaidAmount())
                .balance(student.getBalance() != null ? student.getBalance() : BigDecimal.ZERO)
                .isTuitionOverdue(isTuitionOverdue(student.getId()))
                .financialHold(student.isFinancialHold())
                .overallStatus(m.status())
                .extendedDeadline(m.maxDeadline())
                .extensionReason(m.extensionReason())
                .isExtended(isExtended)
                .items(itemDtos)
                .build();
    }

    /**
     * Giả lập thanh toán nhanh học phí cho Sinh viên (1-Click Pay)
     */
    @Transactional
    public ReceiptResponse simulateStudentPayment(Long studentId, com.sms.dto.request.SimulatePayRequest request) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));

        Semester semester = null;
        if (request != null && request.getSemesterId() != null) {
            semester = semesterRepository.findById(request.getSemesterId()).orElse(null);
        }
        if (semester == null) {
            semester = semesterRepository.findByIsCurrentTrue().orElseGet(() ->
                    semesterRepository.findAllByOrderByStartDateDesc().stream().findFirst().orElse(null));
        }

        if (semester != null) {
            syncInvoicesForStudentSemester(student, semester);
        }

        List<StudentInvoice> unpaidInvoices;
        if (request != null && request.getSemesterId() != null) {
            unpaidInvoices = invoiceRepository.findByStudentIdAndSemesterId(student.getId(), request.getSemesterId()).stream()
                    .filter(i -> i.getStatus() == StudentInvoice.InvoiceStatus.UNPAID)
                    .toList();
        } else {
            unpaidInvoices = invoiceRepository.findByStudentIdAndStatus(student.getId(), StudentInvoice.InvoiceStatus.UNPAID);
        }

        if (unpaidInvoices.isEmpty()) {
            throw new BadRequestException("Tất cả học phí của bạn đã được thanh toán, không có công nợ cần hoàn tất.");
        }

        LocalDateTime now = LocalDateTime.now();
        String receiptNumber = "REC-MOCK-" + DateTimeFormatter.ofPattern("yyMMddHHmmss").format(now)
                + "-" + (100 + new Random().nextInt(900));

        BigDecimal totalPaid = BigDecimal.ZERO;
        List<ReceiptResponse.ReceiptItemDto> receiptItems = new ArrayList<>();

        for (StudentInvoice inv : unpaidInvoices) {
            inv.setStatus(StudentInvoice.InvoiceStatus.PAID);
            inv.setPaidAt(now);
            inv.setPaidMethod("ONLINE_MOCK");
            inv.setReceiptNumber(receiptNumber);
            inv.setCashierUserId(null);
            invoiceRepository.save(inv);

            String subCode = inv.getSection() != null && inv.getSection().getSubject() != null
                    ? inv.getSection().getSubject().getSubjectCode() : "";
            String subName = inv.getSection() != null && inv.getSection().getSubject() != null
                    ? inv.getSection().getSubject().getSubjectName() : "";

            receiptItems.add(ReceiptResponse.ReceiptItemDto.builder()
                    .subjectCode(subCode)
                    .subjectName(subName)
                    .credits(inv.getCredits())
                    .amount(inv.getAmount())
                    .build());
            totalPaid = totalPaid.add(inv.getAmount());
        }

        if (crossCuttingRuleEngine != null) {
            crossCuttingRuleEngine.releaseFinancialHoldIfDebtCleared(student.getId());
        }

        String semName = semester != null ? semester.getSemesterName() : "Học kỳ hiện tại";
        String note = request != null && request.getNotes() != null && !request.getNotes().isBlank()
                ? request.getNotes() : "Thanh toán giả lập trực tuyến (Cổng Sinh viên)";

        notificationService.createNotification(
                student.getId(),
                "Biên lai thanh toán trực tuyến",
                "Bạn đã thanh toán thành công số tiền " + String.format("%,.0f VNĐ", totalPaid)
                        + ". Mã biên lai: " + receiptNumber,
                Notification.NotificationType.SYSTEM,
                student.getId()
        );

        return ReceiptResponse.builder()
                .receiptNumber(receiptNumber)
                .paidAt(now)
                .cashierName("Cổng thông tin Sinh viên (Trực tuyến)")
                .studentCode(student.getStudentCode())
                .studentName(student.getFullName())
                .className(student.getClassEntity() != null ? student.getClassEntity().getName() : "")
                .semesterName(semName)
                .paymentMethod("THANH TOÁN TRỰC TUYẾN (ONLINE MOCK)")
                .items(receiptItems)
                .totalAmount(totalPaid)
                .note(note)
                .build();
    }

    /**
     * Xác nhận thu tiền mặt cho các hóa đơn được chọn
     */
    @Transactional
    public ReceiptResponse collectCashPayment(TuitionPaymentRequest request, Long cashierUserId) {
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));
        Semester semester = semesterRepository.findById(request.getSemesterId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học kỳ"));

        List<StudentInvoice> invoices = invoiceRepository.findByIdInWithDetails(request.getInvoiceIds());
        if (invoices.isEmpty()) {
            throw new BadRequestException("Không tìm thấy hóa đơn nào để thanh toán");
        }

        // BR-TUITION-100: Bắt buộc hoàn thành 100% học phí, không cho đóng từng phần
        List<StudentInvoice> currentUnpaid = invoiceRepository.findByStudentIdAndSemesterId(student.getId(), semester.getId()).stream()
                .filter(i -> i.getStatus() == StudentInvoice.InvoiceStatus.UNPAID)
                .toList();

        Set<Long> unpaidIds = currentUnpaid.stream().map(StudentInvoice::getId).collect(Collectors.toSet());
        Set<Long> requestedIds = new HashSet<>(request.getInvoiceIds());
        if (!requestedIds.containsAll(unpaidIds)) {
            throw new BadRequestException("Quy chế tài chính yêu cầu hoàn thành 100% học phí toàn bộ các học phần trong kỳ. Không áp dụng đóng một phần.");
        }

        String cashierName = "Thủ quỹ PĐT";
        if (cashierUserId != null) {
            cashierName = userRepository.findById(cashierUserId).map(User::getUsername).orElse("Thủ quỹ PĐT");
        }

        String receiptNumber = "PT-" + student.getStudentCode() + "-" + DateTimeFormatter.ofPattern("yyMMdd").format(LocalDate.now())
                + "-" + (System.currentTimeMillis() % 10000);

        LocalDateTime now = LocalDateTime.now();
        BigDecimal totalPaid = BigDecimal.ZERO;
        List<ReceiptResponse.ReceiptItemDto> receiptItems = new ArrayList<>();

        for (StudentInvoice inv : invoices) {
            if (!inv.getStudent().getId().equals(student.getId())) {
                throw new BadRequestException("Hóa đơn #" + inv.getId() + " không thuộc về sinh viên này");
            }
            if (inv.getStatus() == StudentInvoice.InvoiceStatus.PAID) {
                continue;
            }
            receiptItems.add(markInvoicePaid(inv, receiptNumber, now, cashierUserId));
            totalPaid = totalPaid.add(inv.getAmount());
        }

        if (totalPaid.compareTo(BigDecimal.ZERO) == 0 && !invoices.isEmpty()) {
            throw new BadRequestException("Tất cả các học phần được chọn đã được thanh toán trước đó");
        }

        BigDecimal walletBalance = student.getBalance() != null ? student.getBalance() : BigDecimal.ZERO;
        BigDecimal walletDeduction = BigDecimal.ZERO;
        if (walletBalance.compareTo(BigDecimal.ZERO) > 0) {
            walletDeduction = walletBalance.min(totalPaid);
            student.setBalance(walletBalance.subtract(walletDeduction));
            studentRepository.save(student);
            log.info("Cấn trừ {} đ từ tài khoản tích lũy của sinh viên {}", walletDeduction, student.getStudentCode());
        }

        String baseNote = request.getNote() != null ? request.getNote() : "Thu học phí trực tiếp tại quầy Phòng Đào tạo";
        String noteWithWallet = walletDeduction.compareTo(BigDecimal.ZERO) > 0
                ? baseNote + " (Đã cấn trừ " + walletDeduction + " đ từ tài khoản tích lũy)"
                : baseNote;

        // Quy tắc liên thông B: Tự động gỡ bỏ FINANCIAL_HOLD nếu sinh viên đã giải quyết hết nợ quá hạn
        if (crossCuttingRuleEngine != null) {
            crossCuttingRuleEngine.releaseFinancialHoldIfDebtCleared(student.getId());
        }

        return buildCashReceipt(receiptNumber, now, cashierName, student, semester, totalPaid,
                receiptItems, noteWithWallet);
    }

    /**
     * Xác nhận thu tiền mặt hàng loạt cho danh sách nhiều sinh viên
     */
    @Transactional
    public TuitionBatchPaymentResponse collectBatchCashPayment(TuitionBatchPaymentRequest request, Long cashierUserId) {
        Semester semester = semesterRepository.findById(request.getSemesterId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học kỳ"));

        if (request.getStudentIds() == null || request.getStudentIds().isEmpty()) {
            throw new BadRequestException("Danh sách sinh viên thanh toán không được rỗng");
        }

        String cashierName = "Thủ quỹ PĐT";
        if (cashierUserId != null) {
            cashierName = userRepository.findById(cashierUserId).map(User::getUsername).orElse("Thủ quỹ PĐT");
        }

        String defaultNote = (request.getNote() != null && !request.getNote().isBlank())
                ? request.getNote().trim() : "Thu tiền mặt hàng loạt tại Phòng Đào tạo";

        LocalDateTime now = LocalDateTime.now();
        BigDecimal grandTotal = BigDecimal.ZERO;
        List<ReceiptResponse> receipts = new ArrayList<>();
        int studentSuccessCount = 0;

        for (Long studentId : request.getStudentIds()) {
            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (studentOpt.isEmpty()) {
                continue;
            }
            Student student = studentOpt.get();

            // Tìm tất cả hóa đơn UNPAID trong kỳ của sinh viên này
            List<StudentInvoice> unpaidInvoices = invoiceRepository.findByStudentIdAndSemesterId(student.getId(), semester.getId()).stream()
                    .filter(i -> i.getStatus() == StudentInvoice.InvoiceStatus.UNPAID)
                    .toList();

            if (unpaidInvoices.isEmpty()) {
                continue; // Sinh viên đã nộp đủ hoặc không có nợ
            }

            String receiptNumber = "PT-" + student.getStudentCode() + "-" + DateTimeFormatter.ofPattern("yyMMdd").format(LocalDate.now())
                    + "-" + (System.currentTimeMillis() % 10000) + (studentSuccessCount % 100);

            BigDecimal studentTotalPaid = BigDecimal.ZERO;
            List<ReceiptResponse.ReceiptItemDto> receiptItems = new ArrayList<>();

            for (StudentInvoice inv : unpaidInvoices) {
                receiptItems.add(markInvoicePaid(inv, receiptNumber, now, cashierUserId));
                studentTotalPaid = studentTotalPaid.add(inv.getAmount());
            }

            if (studentTotalPaid.compareTo(BigDecimal.ZERO) > 0) {
                // Quy tắc liên thông B: Tự động gỡ bỏ FINANCIAL_HOLD nếu sinh viên đã giải quyết hết nợ quá hạn
                if (crossCuttingRuleEngine != null) {
                    crossCuttingRuleEngine.releaseFinancialHoldIfDebtCleared(student.getId());
                }
                grandTotal = grandTotal.add(studentTotalPaid);
                studentSuccessCount++;
                receipts.add(buildCashReceipt(receiptNumber, now, cashierName, student, semester,
                        studentTotalPaid, receiptItems, defaultNote));
            }
        }

        if (studentSuccessCount == 0) {
            throw new BadRequestException("Không có sinh viên nào có học phí chưa nộp để thu tiền mặt");
        }

        return TuitionBatchPaymentResponse.builder()
                .totalSuccessStudents(studentSuccessCount)
                .totalAmount(grandTotal)
                .receipts(receipts)
                .build();
    }

    /**
     * BR-Tuition & Quy tắc B: Kiểm tra sinh viên có đang nợ học phí quá hạn quy định hay không.
     * Quá hạn được tính khi sinh viên đang bị FINANCIAL_HOLD hoặc có hóa đơn UNPAID mà ngày hiện tại đã vượt quá
     * hạn nộp học phí của học kỳ (hoặc vượt quá hạn được gia hạn).
     */
    public boolean isTuitionOverdue(Long studentId) {
        if (studentId == null) return false;
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student != null && student.isFinancialHold()) {
            return true;
        }

        List<StudentInvoice> unpaidInvoices = invoiceRepository.findByStudentId(studentId).stream()
                .filter(i -> i.getStatus() == StudentInvoice.InvoiceStatus.UNPAID)
                .toList();
        if (unpaidInvoices.isEmpty()) return false;

        LocalDate today = LocalDate.now();
        for (StudentInvoice inv : unpaidInvoices) {
            LocalDate baseDeadline = (inv.getSection() != null && inv.getSection().getSemester() != null)
                    ? inv.getSection().getSemester().getTuitionDeadline() : null;
            LocalDate effectiveDeadline = (inv.getExtendedDeadline() != null)
                    ? inv.getExtendedDeadline() : baseDeadline;

            if (effectiveDeadline != null && today.isAfter(effectiveDeadline)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Quy tắc B: Kích hoạt quét và đánh giá FINANCIAL_HOLD theo yêu cầu của Quản trị viên
     */
    @Transactional
    public int triggerFinancialHoldEvaluation() {
        if (crossCuttingRuleEngine == null) return 0;
        return crossCuttingRuleEngine.evaluateFinancialHolds();
    }

    /**
     * Quét danh sách sinh viên nợ học phí quá hạn trong học kỳ
     */
    public List<OverdueStudentDto> scanOverdueStudents(Integer semesterId, String customDeadlineStr) {
        Semester semester = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học kỳ"));

        LocalDate deadline = null;
        if (customDeadlineStr != null && !customDeadlineStr.isBlank()) {
            deadline = LocalDate.parse(customDeadlineStr);
        } else if (semester.getTuitionDeadline() != null) {
            deadline = semester.getTuitionDeadline();
        } else if (semester.getRegistrationEnd() != null) {
            deadline = semester.getRegistrationEnd().plusDays(7);
        } else {
            deadline = LocalDate.now();
        }
        final LocalDate baseDeadline = deadline;

        List<StudentInvoice> unpaidInvoices = invoiceRepository.findUnpaidBySemesterId(semester.getId());

        LocalDate today = LocalDate.now();
        List<StudentInvoice> overdueInvoices = new ArrayList<>();
        for (StudentInvoice inv : unpaidInvoices) {
            LocalDate effectiveDeadline = (inv.getExtendedDeadline() != null)
                    ? inv.getExtendedDeadline() : baseDeadline;
            if (today.isAfter(effectiveDeadline)) {
                overdueInvoices.add(inv);
            }
        }

        // Gom nhóm theo sinh viên
        Map<Student, List<StudentInvoice>> grouped = overdueInvoices.stream()
                .collect(Collectors.groupingBy(StudentInvoice::getStudent));

        List<OverdueStudentDto> results = new ArrayList<>();

        for (Map.Entry<Student, List<StudentInvoice>> entry : grouped.entrySet()) {
            Student st = entry.getKey();
            List<StudentInvoice> invs = entry.getValue();

            BigDecimal totalAmount = invs.stream()
                    .map(StudentInvoice::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            List<Long> ids = invs.stream().map(StudentInvoice::getId).toList();
            List<String> sectionCodes = invs.stream()
                    .map(i -> i.getSection() != null && i.getSection().getSubject() != null
                            ? i.getSection().getSubject().getSubjectName() + " (" + i.getSection().getSectionCode() + ")"
                            : "HP #" + i.getId())
                    .toList();

            long overdueDays = invs.stream()
                    .map(i -> (i.getExtendedDeadline() != null) ? i.getExtendedDeadline() : baseDeadline)
                    .filter(today::isAfter)
                    .mapToLong(eff -> ChronoUnit.DAYS.between(eff, today))
                    .max().orElse(0);

            results.add(OverdueStudentDto.builder()
                    .studentId(st.getId())
                    .studentCode(st.getStudentCode())
                    .fullName(st.getFullName())
                    .className(st.getClassEntity() != null ? st.getClassEntity().getName() : "")
                    .phone(st.getPhone())
                    .email(st.getEmail())
                    .overdueInvoiceCount(invs.size())
                    .totalOverdueAmount(totalAmount)
                    .overdueDays(overdueDays)
                    .financialHold(st.isFinancialHold())
                    .invoiceIds(ids)
                    .overdueSections(sectionCodes)
                    .build());
        }

        results.sort(Comparator.comparing(OverdueStudentDto::getTotalOverdueAmount).reversed());
        return results;
    }

    /**
     * Gia hạn thời hạn nộp học phí cho sinh viên trong học kỳ (mặc định 1 tuần / 7 ngày)
     */
    @Transactional
    public void extendTuitionDeadline(TuitionExtensionRequest request, Long adminUserId) {
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));
        Semester semester = semesterRepository.findById(request.getSemesterId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học kỳ"));

        List<StudentInvoice> unpaidInvoices = invoiceRepository.findByStudentIdAndSemesterId(student.getId(), semester.getId()).stream()
                .filter(i -> i.getStatus() == StudentInvoice.InvoiceStatus.UNPAID)
                .toList();

        if (unpaidInvoices.isEmpty()) {
            throw new BadRequestException("Sinh viên không có học phí chưa nộp để gia hạn");
        }

        int days = (request.getDays() != null && request.getDays() > 0) ? request.getDays() : 7;
        LocalDate newDeadline = LocalDate.now().plusDays(days);
        String reason = (request.getReason() != null && !request.getReason().isBlank())
                ? request.getReason().trim() : "Đơn xin hoãn nộp học phí (gia hạn " + days + " ngày)";

        for (StudentInvoice inv : unpaidInvoices) {
            inv.setExtendedDeadline(newDeadline);
            inv.setExtensionReason(reason);
            invoiceRepository.save(inv);
        }

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        notificationService.createNotification(
                student.getId(),
                "Phê duyệt gia hạn nộp học phí",
                "Phòng Đào tạo đã phê duyệt gia hạn nộp học phí học kỳ " + semester.getSemesterName()
                        + ". Hạn chót nộp 100% học phí mới là: " + newDeadline.format(dtf) + " (" + days + " ngày). Lý do: " + reason,
                Notification.NotificationType.SYSTEM,
                student.getId()
        );
    }

    /**
     * Hủy đăng ký các học phần nợ học phí quá hạn, giải phóng slot lớp học phần
     */
    @Transactional
    public int cancelOverdueInvoices(List<Long> invoiceIds) {
        if (invoiceIds == null || invoiceIds.isEmpty()) {
            return 0;
        }

        List<StudentInvoice> invoices = invoiceRepository.findByIdInWithDetails(invoiceIds);
        int cancelCount = 0;

        for (StudentInvoice inv : invoices) {
            if (inv.getStatus() == StudentInvoice.InvoiceStatus.UNPAID) {
                inv.setStatus(StudentInvoice.InvoiceStatus.CANCELLED);
                invoiceRepository.save(inv);

                // Tìm và hủy enrollment tương ứng
                if (inv.getStudent() != null && inv.getSection() != null) {
                    Optional<Enrollment> opt = enrollmentRepository
                            .findByStudentIdAndSectionId(inv.getStudent().getId(), inv.getSection().getId());
                    if (opt.isPresent() && opt.get().getStatus() == Enrollment.EnrollmentStatus.ENROLLED) {
                        Enrollment enrollment = opt.get();
                        enrollment.setStatus(Enrollment.EnrollmentStatus.CANCELLED);
                        enrollmentRepository.save(enrollment);
                        cancelCount++;

                        // Giải phóng sĩ số lớp học phần (decrement current_students)
                        CourseSection section = inv.getSection();
                        if (section != null) {
                            section.decrementCurrentStudents();
                            courseSectionRepository.save(section);
                        }

                        String subName = inv.getSection().getSubject() != null
                                ? inv.getSection().getSubject().getSubjectName() : "học phần";

                        notificationService.createNotification(
                                inv.getStudent().getId(),
                                "Hủy đăng ký học phần do nợ học phí",
                                "Học phần " + subName + " (" + inv.getSection().getSectionCode()
                                        + ") đã bị hủy do quá hạn nộp học phí.",
                                Notification.NotificationType.SYSTEM,
                                inv.getSection().getId()
                        );
                    }
                }
            }
        }
        return cancelCount;
    }

    private ReceiptResponse.ReceiptItemDto markInvoicePaid(StudentInvoice inv, String receiptNumber, LocalDateTime now, Long cashierUserId) {
        inv.setStatus(StudentInvoice.InvoiceStatus.PAID);
        inv.setPaidAt(now);
        inv.setPaidMethod("CASH");
        inv.setReceiptNumber(receiptNumber);
        inv.setCashierUserId(cashierUserId);
        invoiceRepository.save(inv);

        String subCode = inv.getSection() != null && inv.getSection().getSubject() != null
                ? inv.getSection().getSubject().getSubjectCode() : "";
        String subName = inv.getSection() != null && inv.getSection().getSubject() != null
                ? inv.getSection().getSubject().getSubjectName() : "";

        return ReceiptResponse.ReceiptItemDto.builder()
                .subjectCode(subCode)
                .subjectName(subName)
                .credits(inv.getCredits())
                .amount(inv.getAmount())
                .build();
    }

    private ReceiptResponse buildCashReceipt(String receiptNumber, LocalDateTime now, String cashierName,
                                             Student student, Semester semester, BigDecimal totalPaid,
                                             List<ReceiptResponse.ReceiptItemDto> items, String note) {
        String formattedAmount = String.format("%,.0f VNĐ", totalPaid);
        notificationService.createNotification(
                student.getId(),
                "Biên lai thu học phí tiền mặt",
                "Phòng Đào tạo đã xác nhận thu tiền mặt số tiền " + formattedAmount + " cho học kỳ " + semester.getSemesterName()
                        + ". Mã phiếu thu: " + receiptNumber,
                Notification.NotificationType.SYSTEM,
                student.getId()
        );

        return ReceiptResponse.builder()
                .receiptNumber(receiptNumber)
                .paidAt(now)
                .cashierName(cashierName)
                .studentCode(student.getStudentCode())
                .studentName(student.getFullName())
                .className(student.getClassEntity() != null ? student.getClassEntity().getName() : "")
                .semesterName(semester.getSemesterName())
                .paymentMethod("TIỀN MẶT (CASH)")
                .items(items)
                .totalAmount(totalPaid)
                .note(note)
                .build();
    }
}
