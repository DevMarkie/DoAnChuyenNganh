package com.sms.service.rule;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sms.entity.AttendanceRecord;
import com.sms.entity.AttendanceSession;
import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.entity.Grade;
import com.sms.entity.Notification;
import com.sms.entity.Schedule;
import com.sms.entity.Semester;
import com.sms.entity.Student;
import com.sms.entity.StudentInvoice;
import com.sms.entity.Subject;
import com.sms.event.AttendanceSavedEvent;
import com.sms.repository.AttendanceRecordRepository;
import com.sms.repository.AttendanceSessionRepository;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.EnrollmentRepository;
import com.sms.repository.ExamRosterRepository;
import com.sms.repository.GradeRepository;
import com.sms.repository.ScheduleRepository;
import com.sms.repository.SemesterRepository;
import com.sms.repository.StudentInvoiceRepository;
import com.sms.repository.StudentRepository;
import com.sms.service.EmailService;
import com.sms.service.NotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * LUỒNG 3: Bộ máy Kích hoạt Tự động liên thông (Cross-cutting Rule Engine)
 * Quy tắc liên thông A: Điểm danh -> Cấm thi tự động
 * Quy tắc liên thông B: Hạn học phí -> Đóng băng dịch vụ học vụ (FINANCIAL_HOLD)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CrossCuttingRuleEngine {

    private final CourseSectionRepository courseSectionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final ScheduleRepository scheduleRepository;
    private final ExamRosterRepository examRosterRepository;
    private final GradeRepository gradeRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final StudentRepository studentRepository;
    private final StudentInvoiceRepository invoiceRepository;
    private final SemesterRepository semesterRepository;

    public static final double DISQUALIFICATION_THRESHOLD = 0.20; // 20% thời lượng môn học

    /**
     * Lắng nghe sự kiện lưu điểm danh từ AttendanceService.
     */
    @EventListener
    @Transactional
    public void onAttendanceSaved(AttendanceSavedEvent event) {
        if (event.getSectionId() == null) {
            return;
        }
        log.info("CrossCuttingRuleEngine: Nhận sự kiện lưu điểm danh sectionId={}", event.getSectionId());
        evaluateAttendanceRule(event.getSectionId());
    }

    /**
     * Quy tắc liên thông A:
     * 1. Tính tổng số tiết vắng của sinh viên: Absent_Rate = Total_Absent_Periods / Total_Course_Periods
     * 2. Nếu Absent_Rate >= 0.20:
     *    - attendance_status = 'DISQUALIFIED'
     *    - Tự động xóa khỏi danh sách phòng thi cuối kỳ (exam_rosters)
     *    - Gán cứng điểm điều kiện / chuyên cần = 0, CK = 0, letterGrade = 'F'
     *    - Bắn thông báo và email cảnh báo
     * 3. Nếu Absent_Rate < 0.20 và trước đó bị cấm thi:
     *    - Tự động phục hồi attendance_status = 'QUALIFIED'
     *    - Gỡ điểm 0 ép buộc và gửi thông báo dỡ bỏ
     */
    @Transactional
    public void evaluateAttendanceRule(Long sectionId) {
        CourseSection section = courseSectionRepository.findById(sectionId).orElse(null);
        if (section == null) {
            log.warn("CrossCuttingRuleEngine: Không tìm thấy CourseSection với id={}", sectionId);
            return;
        }

        Subject subject = section.getSubject();
        int credits = (subject != null && subject.getCredits() != null && subject.getCredits() > 0)
                ? subject.getCredits() : 3;
        int totalCoursePeriods = credits * 15; // Quy chuẩn tín chỉ 1 tín = 15 tiết

        List<Schedule> schedules = scheduleRepository.findBySectionId(section.getId());
        List<AttendanceSession> sessions = attendanceSessionRepository.findBySectionIdOrderBySessionDateDesc(section.getId());
        if (sessions.isEmpty()) {
            return;
        }

        // Ánh xạ từng session -> số tiết của buổi học đó
        Map<Long, Integer> sessionPeriods = new HashMap<>();
        for (AttendanceSession sess : sessions) {
            sessionPeriods.put(sess.getId(), calculateSessionPeriods(sess.getSessionDate(), schedules));
        }

        List<Long> sessionIds = sessions.stream().map(AttendanceSession::getId).toList();
        List<AttendanceRecord> records = attendanceRecordRepository.findBySessionIdIn(sessionIds);

        // Thống kê số tiết vắng theo từng enrollment
        Map<Long, Integer> absentPeriodsByEnrollment = new HashMap<>();
        for (AttendanceRecord record : records) {
            if (Boolean.FALSE.equals(record.getIsPresent()) && record.getEnrollment() != null) {
                Long enrollmentId = record.getEnrollment().getId();
                int periods = sessionPeriods.getOrDefault(record.getSession().getId(), 3);
                absentPeriodsByEnrollment.merge(enrollmentId, periods, Integer::sum);
            }
        }

        List<Enrollment> enrollments = enrollmentRepository.findActiveBySectionId(section.getId());
        for (Enrollment enrollment : enrollments) {
            Student student = enrollment.getStudent();
            if (student == null) {
                continue;
            }

            int absentPeriods = absentPeriodsByEnrollment.getOrDefault(enrollment.getId(), 0);
            double absentRate = (double) absentPeriods / totalCoursePeriods;
            enrollment.setAbsenceCount(absentPeriods);
            enrollment.setAbsentRate(absentRate);

            boolean isDisqualifiedNow = (absentRate >= DISQUALIFICATION_THRESHOLD);

            if (isDisqualifiedNow) {
                applyDisqualification(enrollment, student, section, subject, absentPeriods, totalCoursePeriods, absentRate);
            } else if (enrollment.getAttendanceStatus() == Enrollment.AttendanceStatus.DISQUALIFIED) {
                applyRestoration(enrollment, student, section, subject, absentPeriods, totalCoursePeriods, absentRate);
            }
        }
    }

    private void applyDisqualification(Enrollment enrollment, Student student, CourseSection section,
                                       Subject subject, int absentPeriods, int totalCoursePeriods, double absentRate) {
        boolean alreadyDisqualified = (enrollment.getAttendanceStatus() == Enrollment.AttendanceStatus.DISQUALIFIED);

        enrollment.setAttendanceStatus(Enrollment.AttendanceStatus.DISQUALIFIED);
        enrollmentRepository.save(enrollment);

        // 1. Tự động xóa tên sinh viên khỏi danh sách phòng thi cuối kỳ của học phần
        examRosterRepository.findByEnrollmentId(enrollment.getId()).ifPresent(roster -> {
            log.info("CrossCuttingRuleEngine: Đã xóa sinh viên {} khỏi phòng thi {} do cấm thi",
                    student.getStudentCode(),
                    roster.getExamRoom() != null ? roster.getExamRoom().getRoomCode() : "N/A");
            examRosterRepository.delete(roster);
        });

        // 2. Gán cứng điểm điều kiện thi = 0 và điểm CK = 0, letterGrade = F
        Grade grade = gradeRepository.findByEnrollmentId(enrollment.getId()).orElseGet(() -> {
            Grade g = new Grade();
            g.setEnrollment(enrollment);
            return g;
        });
        grade.setCc1Score(BigDecimal.ZERO);
        grade.setFinalScore(BigDecimal.ZERO);
        grade.setTotalScore(BigDecimal.ZERO);
        grade.setLetterGrade("F");
        grade.setGpaPoint(BigDecimal.ZERO);
        gradeRepository.save(grade);

        // 3. Bắn email / thông báo hệ thống nếu chưa gửi trước đó
        if (!alreadyDisqualified) {
            String subjectCode = subject != null ? subject.getSubjectCode() : "";
            String subjectName = subject != null ? subject.getSubjectName() : "";
            String title = "Cảnh báo cấm thi: " + subjectCode;
            String message = String.format(
                    "Bạn đã nghỉ quá 20%% số tiết môn %s - %s (%d/%d tiết, %.1f%%) và bị cấm thi theo quy chế.",
                    subjectCode, subjectName, absentPeriods, totalCoursePeriods, absentRate * 100);

            try {
                notificationService.createNotification(
                        student.getId(), title, message,
                        Notification.NotificationType.ATTENDANCE_WARNING, section.getId());
            } catch (Exception ex) {
                log.warn("Không thể tạo thông báo chuông cho SV {}: {}", student.getStudentCode(), ex.getMessage());
            }

            if (student.getEmail() != null && !student.getEmail().isBlank()) {
                try {
                    emailService.sendAttendanceDisqualificationEmail(
                            student.getEmail(), student.getFullName(), student.getStudentCode(),
                            subjectCode, subjectName, absentPeriods, totalCoursePeriods, absentRate * 100);
                } catch (Exception ex) {
                    log.warn("Không thể gửi email cấm thi cho SV {}: {}", student.getStudentCode(), ex.getMessage());
                }
            }

            log.warn("CrossCuttingRuleEngine: Sinh viên {} (MSSV: {}) bị CẤM THI môn {} ({}/{} tiết, {:.1f}%)",
                    student.getFullName(), student.getStudentCode(), subjectCode,
                    absentPeriods, totalCoursePeriods, absentRate * 100);
        }
    }

    private void applyRestoration(Enrollment enrollment, Student student, CourseSection section,
                                  Subject subject, int absentPeriods, int totalCoursePeriods, double absentRate) {
        log.info("CrossCuttingRuleEngine: Phục hồi điều kiện dự thi cho SV {} môn {} ({}/{} tiết, {:.1f}%)",
                student.getStudentCode(),
                subject != null ? subject.getSubjectCode() : "",
                absentPeriods, totalCoursePeriods, absentRate * 100);

        enrollment.setAttendanceStatus(Enrollment.AttendanceStatus.QUALIFIED);
        enrollmentRepository.save(enrollment);

        // Gỡ bỏ điểm 0 ép buộc nếu trước đó được gán tự động
        gradeRepository.findByEnrollmentId(enrollment.getId()).ifPresent(grade -> {
            if (BigDecimal.ZERO.equals(grade.getCc1Score()) && BigDecimal.ZERO.equals(grade.getFinalScore())
                    && "F".equals(grade.getLetterGrade())) {
                grade.setCc1Score(null);
                grade.setFinalScore(null);
                grade.setTotalScore(null);
                grade.setLetterGrade(null);
                grade.setGpaPoint(null);
                gradeRepository.save(grade);
            }
        });

        String subjectCode = subject != null ? subject.getSubjectCode() : "";
        String subjectName = subject != null ? subject.getSubjectName() : "";
        String title = "Dỡ bỏ cấm thi: " + subjectCode;
        String message = String.format(
                "Trạng thái cấm thi môn %s - %s của bạn đã được dỡ bỏ sau khi giảng viên cập nhật lại điểm danh (%d/%d tiết, %.1f%%).",
                subjectCode, subjectName, absentPeriods, totalCoursePeriods, absentRate * 100);

        try {
            notificationService.createNotification(
                    student.getId(), title, message,
                    Notification.NotificationType.ATTENDANCE_WARNING, section.getId());
        } catch (Exception ex) {
            log.warn("Không thể tạo thông báo chuông phục hồi cho SV {}: {}", student.getStudentCode(), ex.getMessage());
        }
    }

    /**
     * Xác định số tiết của một buổi học dựa trên thời khóa biểu.
     */
    private int calculateSessionPeriods(LocalDate sessionDate, List<Schedule> schedules) {
        if (schedules == null || schedules.isEmpty()) {
            return 3; // Mặc định 3 tiết/buổi nếu không có TKB
        }

        int targetDow = sessionDate.getDayOfWeek().getValue() + 1; // 2 = Mon ... 8 = Sun
        for (Schedule sch : schedules) {
            if (sch.getDayOfWeek() != null && sch.getDayOfWeek() == targetDow) {
                if (sch.getStartPeriod() != null && sch.getEndPeriod() != null) {
                    return Math.max(1, sch.getEndPeriod() - sch.getStartPeriod() + 1);
                }
            }
        }

        // Nếu không khớp thứ, lấy ca đầu tiên có số tiết hợp lệ
        for (Schedule sch : schedules) {
            if (sch.getStartPeriod() != null && sch.getEndPeriod() != null) {
                return Math.max(1, sch.getEndPeriod() - sch.getStartPeriod() + 1);
            }
        }

        return 3;
    }

    // =========================================================================
    // QUY TẮC LIÊN THÔNG B: HẠN HỌC PHÍ -> ĐÓNG BĂNG DỊCH VỤ HỌC VỤ (FINANCIAL_HOLD)
    // =========================================================================

    public static LocalDate calculateEffectiveDeadline(StudentInvoice invoice) {
        if (invoice == null) return null;
        if (invoice.getExtendedDeadline() != null) {
            return invoice.getExtendedDeadline();
        }
        CourseSection section = invoice.getSection();
        if (section != null && section.getSemester() != null) {
            Semester sem = section.getSemester();
            if (sem.getTuitionDeadline() != null) {
                return sem.getTuitionDeadline();
            }
            if (sem.getRegistrationEnd() != null) {
                return sem.getRegistrationEnd().plusDays(7);
            }
        }
        return null;
    }

    public static boolean isInvoiceOverdue(StudentInvoice invoice, LocalDate referenceDate) {
        if (invoice == null || invoice.getStatus() != StudentInvoice.InvoiceStatus.UNPAID) {
            return false;
        }
        LocalDate effectiveDeadline = calculateEffectiveDeadline(invoice);
        return effectiveDeadline != null && referenceDate.isAfter(effectiveDeadline);
    }

    /**
     * Quét tất cả các khoản nợ học phí quá hạn và tự động kích hoạt FINANCIAL_HOLD.
     * Chạy định kỳ bởi Scheduler lúc 00:01 sau hạn học phí hoặc do Admin kích hoạt thủ công.
     *
     * @return Số lượng sinh viên mới được áp dụng FINANCIAL_HOLD
     */
    @Transactional
    public int evaluateFinancialHolds() {
        log.info("CrossCuttingRuleEngine: Bắt đầu quét và đánh giá FINANCIAL_HOLD...");
        LocalDate today = LocalDate.now();
        List<StudentInvoice> unpaidInvoices = invoiceRepository.findByStatusWithDetails(StudentInvoice.InvoiceStatus.UNPAID);
        if (unpaidInvoices.isEmpty()) {
            log.info("CrossCuttingRuleEngine: Không có hóa đơn UNPAID nào trong hệ thống.");
            return 0;
        }

        // Lọc các hóa đơn đã quá hạn
        List<StudentInvoice> overdueInvoices = unpaidInvoices.stream()
                .filter(inv -> isInvoiceOverdue(inv, today))
                .toList();

        if (overdueInvoices.isEmpty()) {
            log.info("CrossCuttingRuleEngine: Không có hóa đơn nào quá hạn hôm nay ({}).", today);
            return 0;
        }

        // Gom nhóm theo sinh viên
        Map<Student, List<StudentInvoice>> studentInvoicesMap = overdueInvoices.stream()
                .collect(Collectors.groupingBy(StudentInvoice::getStudent));

        int newHoldsApplied = 0;
        for (Map.Entry<Student, List<StudentInvoice>> entry : studentInvoicesMap.entrySet()) {
            Student student = entry.getKey();
            List<StudentInvoice> invs = entry.getValue();

            BigDecimal totalDebt = invs.stream()
                    .map(StudentInvoice::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (!student.isFinancialHold()) {
                student.setFinancialHold(true);
                studentRepository.save(student);
                newHoldsApplied++;

                log.warn("CrossCuttingRuleEngine: Bật FINANCIAL_HOLD cho sinh viên {} - {} (Nợ {} hóa đơn, tổng tiền: {})",
                        student.getStudentCode(), student.getFullName(), invs.size(), totalDebt);

                // Gửi thông báo chuông SSE/DB
                try {
                    String title = "Đóng băng dịch vụ học vụ (FINANCIAL HOLD)";
                    String message = String.format(
                            "Tài khoản của bạn đã bị áp dụng Đóng băng dịch vụ học vụ (FINANCIAL HOLD) do quá hạn nộp học phí (%d hóa đơn, tổng %,.0f VNĐ). Cổng ĐKTC và bảng điểm chính thức tạm thời bị khóa.",
                            invs.size(), totalDebt.doubleValue());
                    notificationService.createNotification(
                            student.getId(), title, message,
                            Notification.NotificationType.SYSTEM, null);
                } catch (Exception ex) {
                    log.warn("Không thể gửi thông báo chuông Financial Hold cho SV {}: {}", student.getStudentCode(), ex.getMessage());
                }

                // Gửi email thông báo
                try {
                    if (student.getEmail() != null && !student.getEmail().isBlank()) {
                        emailService.sendFinancialHoldNotificationEmail(
                                student.getEmail(), student.getFullName(), student.getStudentCode(),
                                totalDebt, invs.size());
                    }
                } catch (Exception ex) {
                    log.warn("Không thể gửi email Financial Hold cho SV {}: {}", student.getStudentCode(), ex.getMessage());
                }
            }
        }

        log.info("CrossCuttingRuleEngine: Hoàn tất quét FINANCIAL_HOLD. Đã áp dụng mới cho {} sinh viên (Tổng SV nợ quá hạn: {}).",
                newHoldsApplied, studentInvoicesMap.size());
        return newHoldsApplied;
    }

    /**
     * Tự động dỡ bỏ chế tài FINANCIAL_HOLD (Auto-healing) khi sinh viên đã thanh toán hết nợ quá hạn.
     * Được gọi ngay khi giao dịch thanh toán hoàn tất (thu tiền mặt hoặc online).
     *
     * @param studentId ID của sinh viên vừa thanh toán
     * @return true nếu đã gỡ bỏ hold thành công; false nếu vẫn còn nợ quá hạn hoặc SV không bị hold
     */
    @Transactional
    public boolean releaseFinancialHoldIfDebtCleared(Long studentId) {
        if (studentId == null) return false;

        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null || !student.isFinancialHold()) {
            return false;
        }

        LocalDate today = LocalDate.now();
        List<StudentInvoice> unpaidInvoices = invoiceRepository.findByStudentIdAndStatus(
                studentId, StudentInvoice.InvoiceStatus.UNPAID);

        boolean hasOverdueInvoices = unpaidInvoices.stream()
                .anyMatch(inv -> isInvoiceOverdue(inv, today));

        if (!hasOverdueInvoices) {
            log.info("CrossCuttingRuleEngine: Sinh viên {} ({}) đã thanh toán hết các hóa đơn quá hạn. Gỡ FINANCIAL_HOLD...",
                    student.getStudentCode(), student.getFullName());

            student.setFinancialHold(false);
            studentRepository.save(student);

            // Gửi thông báo chuông mở khóa
            try {
                String title = "Dỡ bỏ đóng băng dịch vụ học vụ (FINANCIAL HOLD)";
                String message = "Hệ thống xác nhận bạn đã hoàn thành nghĩa vụ học phí. Quyền đăng ký tín chỉ và tra cứu bảng điểm đã được mở khóa bình thường.";
                notificationService.createNotification(
                        student.getId(), title, message,
                        Notification.NotificationType.SYSTEM, null);
            } catch (Exception ex) {
                log.warn("Không thể gửi thông báo gỡ Financial Hold cho SV {}: {}", student.getStudentCode(), ex.getMessage());
            }

            // Gửi email giải phóng hold
            try {
                if (student.getEmail() != null && !student.getEmail().isBlank()) {
                    emailService.sendFinancialHoldReleasedEmail(
                            student.getEmail(), student.getFullName(), student.getStudentCode());
                }
            } catch (Exception ex) {
                log.warn("Không thể gửi email dỡ bỏ Financial Hold cho SV {}: {}", student.getStudentCode(), ex.getMessage());
            }

            return true;
        }

        return false;
    }
}
