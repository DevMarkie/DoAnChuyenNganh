package com.sms.service.rule;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.sms.entity.AttendanceRecord;
import com.sms.entity.AttendanceSession;
import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.entity.ExamRoom;
import com.sms.entity.ExamRoster;
import com.sms.entity.Grade;
import com.sms.entity.Notification;
import com.sms.entity.Schedule;
import com.sms.entity.Semester;
import com.sms.entity.Student;
import com.sms.entity.StudentInvoice;
import com.sms.entity.Subject;
import com.sms.repository.AttendanceRecordRepository;
import com.sms.repository.AttendanceSessionRepository;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.EnrollmentRepository;
import com.sms.repository.ExamRosterRepository;
import com.sms.repository.GradeRepository;
import com.sms.repository.ScheduleRepository;
import com.sms.service.EmailService;
import com.sms.service.NotificationService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CrossCuttingRuleEngineTest {

    @Mock private CourseSectionRepository courseSectionRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private AttendanceSessionRepository attendanceSessionRepository;
    @Mock private AttendanceRecordRepository attendanceRecordRepository;
    @Mock private ScheduleRepository scheduleRepository;
    @Mock private ExamRosterRepository examRosterRepository;
    @Mock private GradeRepository gradeRepository;
    @Mock private NotificationService notificationService;
    @Mock private EmailService emailService;
    @Mock private com.sms.repository.StudentRepository studentRepository;
    @Mock private com.sms.repository.StudentInvoiceRepository invoiceRepository;
    @Mock private com.sms.repository.SemesterRepository semesterRepository;

    @InjectMocks private CrossCuttingRuleEngine ruleEngine;

    private CourseSection section;
    private Subject subject;
    private Student student;
    private Enrollment enrollment;
    private Schedule schedule;

    @BeforeEach
    void setUp() {
        subject = new Subject();
        subject.setId(10);
        subject.setSubjectCode("CS101");
        subject.setSubjectName("Nhập môn Lập trình");
        subject.setCredits(3); // 3 tín chỉ = 45 tiết

        section = new CourseSection();
        section.setId(100L);
        section.setSectionCode("CS101-01");
        section.setSubject(subject);

        student = new Student();
        student.setId(200L);
        student.setStudentCode("SV2026001");
        student.setFullName("Nguyễn Văn A");
        student.setEmail("sv2026001@st.phenikaa-uni.edu.vn");

        enrollment = new Enrollment();
        enrollment.setId(300L);
        enrollment.setStudent(student);
        enrollment.setSection(section);
        enrollment.setAttendanceStatus(Enrollment.AttendanceStatus.QUALIFIED);

        schedule = Schedule.builder()
                .id(1L)
                .section(section)
                .dayOfWeek(2) // Thứ Hai
                .startPeriod(1)
                .endPeriod(3) // 3 tiết / buổi
                .build();
    }

    private AttendanceSession createSession(Long id, LocalDate date) {
        AttendanceSession s = new AttendanceSession();
        s.setId(id);
        s.setSection(section);
        s.setSessionDate(date);
        s.setStatus("SAVED");
        return s;
    }

    @Test
    @DisplayName("Quy tắc A: Vắng >= 20% (9/45 tiết) -> Tự động cấm thi, xóa phòng thi, gán điểm 0, gửi thông báo")
    void testDisqualificationWhenAbsentRateExceedsThreshold() {
        // 3 buổi vắng x 3 tiết = 9 tiết vắng / 45 tiết = 20.0% >= 20.0%
        AttendanceSession s1 = createSession(1L, LocalDate.of(2026, 9, 7));
        AttendanceSession s2 = createSession(2L, LocalDate.of(2026, 9, 14));
        AttendanceSession s3 = createSession(3L, LocalDate.of(2026, 9, 21));
        List<AttendanceSession> sessions = List.of(s1, s2, s3);

        AttendanceRecord r1 = new AttendanceRecord(11L, s1, enrollment, false); // vắng
        AttendanceRecord r2 = new AttendanceRecord(12L, s2, enrollment, false); // vắng
        AttendanceRecord r3 = new AttendanceRecord(13L, s3, enrollment, false); // vắng
        List<AttendanceRecord> records = List.of(r1, r2, r3);

        ExamRoom room = ExamRoom.builder().id(50L).roomCode("P.101").build();
        ExamRoster roster = ExamRoster.builder().id(500L).examRoom(room).enrollment(enrollment).student(student).build();

        Grade grade = new Grade();
        grade.setId(900L);
        grade.setEnrollment(enrollment);

        when(courseSectionRepository.findById(100L)).thenReturn(Optional.of(section));
        when(scheduleRepository.findBySectionId(100L)).thenReturn(List.of(schedule));
        when(attendanceSessionRepository.findBySectionIdOrderBySessionDateDesc(100L)).thenReturn(sessions);
        when(attendanceRecordRepository.findBySessionIdIn(anyList())).thenReturn(records);
        when(enrollmentRepository.findActiveBySectionId(100L)).thenReturn(List.of(enrollment));
        when(examRosterRepository.findByEnrollmentId(300L)).thenReturn(Optional.of(roster));
        when(gradeRepository.findByEnrollmentId(300L)).thenReturn(Optional.of(grade));

        ruleEngine.evaluateAttendanceRule(100L);

        // 1. Kiểm tra trạng thái Enrollment
        assertThat(enrollment.getAttendanceStatus()).isEqualTo(Enrollment.AttendanceStatus.DISQUALIFIED);
        verify(enrollmentRepository).save(enrollment);

        // 2. Kiểm tra việc xóa khỏi ExamRoster
        verify(examRosterRepository).delete(roster);

        // 3. Kiểm tra việc gán điểm 0 và điểm F
        assertThat(grade.getCc1Score()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(grade.getFinalScore()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(grade.getTotalScore()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(grade.getLetterGrade()).isEqualTo("F");
        assertThat(grade.getGpaPoint()).isEqualByComparingTo(BigDecimal.ZERO);
        verify(gradeRepository).save(grade);

        // 4. Kiểm tra bắn thông báo chuông và email
        verify(notificationService).createNotification(
                eq(student.getId()),
                contains("Cảnh báo cấm thi"),
                contains("bị cấm thi theo quy chế"),
                eq(Notification.NotificationType.ATTENDANCE_WARNING),
                eq(section.getId())
        );
        verify(emailService).sendAttendanceDisqualificationEmail(
                eq(student.getEmail()),
                eq(student.getFullName()),
                eq(student.getStudentCode()),
                eq(subject.getSubjectCode()),
                eq(subject.getSubjectName()),
                eq(9),
                eq(45),
                eq(20.0)
        );
    }

    @Test
    @DisplayName("Quy tắc A: Vắng < 20% (6/45 tiết = 13.3%) -> Không bị cấm thi, giữ nguyên trạng thái QUALIFIED")
    void testNormalAttendanceDoesNotDisqualify() {
        // 2 buổi vắng x 3 tiết = 6 tiết vắng / 45 tiết = 13.3% < 20.0%
        AttendanceSession s1 = createSession(1L, LocalDate.of(2026, 9, 7));
        AttendanceSession s2 = createSession(2L, LocalDate.of(2026, 9, 14));
        List<AttendanceSession> sessions = List.of(s1, s2);

        AttendanceRecord r1 = new AttendanceRecord(11L, s1, enrollment, false); // vắng
        AttendanceRecord r2 = new AttendanceRecord(12L, s2, enrollment, false); // vắng
        List<AttendanceRecord> records = List.of(r1, r2);

        when(courseSectionRepository.findById(100L)).thenReturn(Optional.of(section));
        when(scheduleRepository.findBySectionId(100L)).thenReturn(List.of(schedule));
        when(attendanceSessionRepository.findBySectionIdOrderBySessionDateDesc(100L)).thenReturn(sessions);
        when(attendanceRecordRepository.findBySessionIdIn(anyList())).thenReturn(records);
        when(enrollmentRepository.findActiveBySectionId(100L)).thenReturn(List.of(enrollment));

        ruleEngine.evaluateAttendanceRule(100L);

        assertThat(enrollment.getAttendanceStatus()).isEqualTo(Enrollment.AttendanceStatus.QUALIFIED);
        verify(examRosterRepository, never()).delete(any());
        verify(gradeRepository, never()).save(any());
        verify(notificationService, never()).createNotification(anyLong(), anyString(), anyString(), any(), anyLong());
    }

    @Test
    @DisplayName("Quy tắc A: Tự động hoàn tác/phục hồi khi giảng viên sửa điểm danh (vắng giảm xuống dưới 20%)")
    void testAutoRestorationWhenAttendanceCorrected() {
        // Trước đó sinh viên bị DISQUALIFIED
        enrollment.setAttendanceStatus(Enrollment.AttendanceStatus.DISQUALIFIED);

        // Giảng viên sửa lại chỉ còn 1 buổi vắng = 3/45 tiết = 6.7%
        AttendanceSession s1 = createSession(1L, LocalDate.of(2026, 9, 7));
        List<AttendanceSession> sessions = List.of(s1);

        AttendanceRecord r1 = new AttendanceRecord(11L, s1, enrollment, false); // vắng 1 buổi
        List<AttendanceRecord> records = List.of(r1);

        Grade grade = new Grade();
        grade.setId(900L);
        grade.setEnrollment(enrollment);
        grade.setCc1Score(BigDecimal.ZERO);
        grade.setFinalScore(BigDecimal.ZERO);
        grade.setTotalScore(BigDecimal.ZERO);
        grade.setLetterGrade("F");
        grade.setGpaPoint(BigDecimal.ZERO);

        when(courseSectionRepository.findById(100L)).thenReturn(Optional.of(section));
        when(scheduleRepository.findBySectionId(100L)).thenReturn(List.of(schedule));
        when(attendanceSessionRepository.findBySectionIdOrderBySessionDateDesc(100L)).thenReturn(sessions);
        when(attendanceRecordRepository.findBySessionIdIn(anyList())).thenReturn(records);
        when(enrollmentRepository.findActiveBySectionId(100L)).thenReturn(List.of(enrollment));
        when(gradeRepository.findByEnrollmentId(300L)).thenReturn(Optional.of(grade));

        ruleEngine.evaluateAttendanceRule(100L);

        // 1. Phục hồi trạng thái QUALIFIED
        assertThat(enrollment.getAttendanceStatus()).isEqualTo(Enrollment.AttendanceStatus.QUALIFIED);
        verify(enrollmentRepository).save(enrollment);

        // 2. Điểm 0 ép buộc được gỡ bỏ
        assertThat(grade.getCc1Score()).isNull();
        assertThat(grade.getFinalScore()).isNull();
        assertThat(grade.getLetterGrade()).isNull();
        verify(gradeRepository).save(grade);

        // 3. Thông báo dỡ bỏ cấm thi
        verify(notificationService).createNotification(
                eq(student.getId()),
                contains("Dỡ bỏ cấm thi"),
                contains("đã được dỡ bỏ"),
                eq(Notification.NotificationType.ATTENDANCE_WARNING),
                eq(section.getId())
        );
    }

    // =========================================================================
    // QUY TẮC B: HẠN HỌC PHÍ -> FINANCIAL_HOLD
    // =========================================================================

    @Test
    @DisplayName("Quy tắc B: Quét hóa đơn quá hạn -> Tự động bật FINANCIAL_HOLD và gửi thông báo")
    void evaluateFinancialHolds_WhenStudentOverdue_ShouldApplyHoldAndSendNotifications() {
        Semester sem = new Semester();
        sem.setId(1);
        sem.setTuitionDeadline(LocalDate.now().minusDays(3)); // Quá hạn 3 ngày

        CourseSection sec = new CourseSection();
        sec.setId(10L);
        sec.setSemester(sem);

        Student st = new Student();
        st.setId(1L);
        st.setStudentCode("2300001");
        st.setFullName("Nguyen Van A");
        st.setEmail("nva@sms.edu.vn");
        st.setFinancialHold(false);

        StudentInvoice inv = new StudentInvoice();
        inv.setId(101L);
        inv.setStudent(st);
        inv.setSection(sec);
        inv.setAmount(new BigDecimal("1350000.00"));
        inv.setStatus(StudentInvoice.InvoiceStatus.UNPAID);

        when(invoiceRepository.findByStatusWithDetails(StudentInvoice.InvoiceStatus.UNPAID))
                .thenReturn(List.of(inv));

        int applied = ruleEngine.evaluateFinancialHolds();

        assertThat(applied).isEqualTo(1);
        assertThat(st.isFinancialHold()).isTrue();
        verify(studentRepository).save(st);
        verify(notificationService).createNotification(
                eq(st.getId()),
                contains("FINANCIAL HOLD"),
                contains("Đóng băng dịch vụ học vụ"),
                eq(Notification.NotificationType.SYSTEM),
                isNull()
        );
        verify(emailService).sendFinancialHoldNotificationEmail(
                eq(st.getEmail()), eq(st.getFullName()), eq(st.getStudentCode()),
                eq(new BigDecimal("1350000.00")), eq(1)
        );
    }

    @Test
    @DisplayName("Quy tắc B: Sinh viên đã bị FINANCIAL_HOLD từ trước -> Không áp dụng lại hay gửi thông báo trùng lặp")
    void evaluateFinancialHolds_WhenStudentAlreadyHeld_ShouldNotReapply() {
        Semester sem = new Semester();
        sem.setId(1);
        sem.setTuitionDeadline(LocalDate.now().minusDays(5));

        CourseSection sec = new CourseSection();
        sec.setId(10L);
        sec.setSemester(sem);

        Student st = new Student();
        st.setId(2L);
        st.setStudentCode("2300002");
        st.setFinancialHold(true); // Đã bị hold

        StudentInvoice inv = new StudentInvoice();
        inv.setId(102L);
        inv.setStudent(st);
        inv.setSection(sec);
        inv.setAmount(new BigDecimal("1350000.00"));
        inv.setStatus(StudentInvoice.InvoiceStatus.UNPAID);

        when(invoiceRepository.findByStatusWithDetails(StudentInvoice.InvoiceStatus.UNPAID))
                .thenReturn(List.of(inv));

        int applied = ruleEngine.evaluateFinancialHolds();

        assertThat(applied).isEqualTo(0);
        verify(studentRepository, never()).save(st);
        verify(notificationService, never()).createNotification(anyLong(), anyString(), anyString(), any(), any());
    }

    @Test
    @DisplayName("Quy tắc B: Chưa quá hạn nộp học phí -> Không áp dụng FINANCIAL_HOLD")
    void evaluateFinancialHolds_WhenInvoiceNotOverdue_ShouldNotApplyHold() {
        Semester sem = new Semester();
        sem.setId(1);
        sem.setTuitionDeadline(LocalDate.now().plusDays(5)); // Còn 5 ngày mới đến hạn

        CourseSection sec = new CourseSection();
        sec.setId(10L);
        sec.setSemester(sem);

        Student st = new Student();
        st.setId(3L);
        st.setFinancialHold(false);

        StudentInvoice inv = new StudentInvoice();
        inv.setId(103L);
        inv.setStudent(st);
        inv.setSection(sec);
        inv.setStatus(StudentInvoice.InvoiceStatus.UNPAID);

        when(invoiceRepository.findByStatusWithDetails(StudentInvoice.InvoiceStatus.UNPAID))
                .thenReturn(List.of(inv));

        int applied = ruleEngine.evaluateFinancialHolds();

        assertThat(applied).isEqualTo(0);
        assertThat(st.isFinancialHold()).isFalse();
        verify(studentRepository, never()).save(st);
    }

    @Test
    @DisplayName("Quy tắc B: Auto-healing - Gạch hết nợ quá hạn -> Tự động giải phóng FINANCIAL_HOLD")
    void releaseFinancialHoldIfDebtCleared_WhenAllOverduePaid_ShouldReleaseHold() {
        Student st = new Student();
        st.setId(4L);
        st.setStudentCode("2300004");
        st.setFullName("Le Van C");
        st.setEmail("lvc@sms.edu.vn");
        st.setFinancialHold(true);

        when(studentRepository.findById(4L)).thenReturn(Optional.of(st));
        when(invoiceRepository.findByStudentIdAndStatus(4L, StudentInvoice.InvoiceStatus.UNPAID))
                .thenReturn(Collections.emptyList()); // Đã trả hết tiền

        boolean released = ruleEngine.releaseFinancialHoldIfDebtCleared(4L);

        assertThat(released).isTrue();
        assertThat(st.isFinancialHold()).isFalse();
        verify(studentRepository).save(st);
        verify(notificationService).createNotification(
                eq(4L),
                contains("Dỡ bỏ đóng băng"),
                contains("mở khóa bình thường"),
                eq(Notification.NotificationType.SYSTEM),
                isNull()
        );
        verify(emailService).sendFinancialHoldReleasedEmail(
                eq(st.getEmail()), eq(st.getFullName()), eq(st.getStudentCode())
        );
    }

    @Test
    @DisplayName("Quy tắc B: Auto-healing - Vẫn còn hóa đơn quá hạn chưa đóng -> Không giải phóng hold")
    void releaseFinancialHoldIfDebtCleared_WhenStillHasOverdueInvoice_ShouldNotRelease() {
        Student st = new Student();
        st.setId(5L);
        st.setFinancialHold(true);

        Semester sem = new Semester();
        sem.setTuitionDeadline(LocalDate.now().minusDays(2));

        CourseSection sec = new CourseSection();
        sec.setSemester(sem);

        StudentInvoice overdueInv = new StudentInvoice();
        overdueInv.setStatus(StudentInvoice.InvoiceStatus.UNPAID);
        overdueInv.setSection(sec);

        when(studentRepository.findById(5L)).thenReturn(Optional.of(st));
        when(invoiceRepository.findByStudentIdAndStatus(5L, StudentInvoice.InvoiceStatus.UNPAID))
                .thenReturn(List.of(overdueInv));

        boolean released = ruleEngine.releaseFinancialHoldIfDebtCleared(5L);

        assertThat(released).isFalse();
        assertThat(st.isFinancialHold()).isTrue();
        verify(studentRepository, never()).save(st);
    }
}
