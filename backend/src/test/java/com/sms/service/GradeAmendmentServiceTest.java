package com.sms.service;

import com.sms.dto.request.AcademicApprovalAmendmentRequest;
import com.sms.dto.request.CreateGradeAmendmentRequest;
import com.sms.dto.request.DeptReviewAmendmentRequest;
import com.sms.entity.*;
import com.sms.exception.BadRequestException;
import com.sms.exception.ForbiddenException;
import com.sms.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GradeAmendmentServiceTest {

    @Mock
    private GradeChangeTicketRepository ticketRepository;
    @Mock
    private GradeRepository gradeRepository;
    @Mock
    private GradeAuditLogRepository gradeAuditLogRepository;
    @Mock
    private CourseSectionRepository courseSectionRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private LecturerRepository lecturerRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private DepartmentRepository departmentRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private EmailService emailService;

    @InjectMocks
    private GradeAmendmentService gradeAmendmentService;

    private User lecturerUser;
    private User headUser;
    private User academicUser;
    private Lecturer lecturer;
    private Lecturer headLecturer;
    private Department department;
    private Subject subject;
    private CourseSection section;
    private Student student;
    private Enrollment enrollment;
    private Grade grade;
    private GradeChangeTicket ticket;

    @BeforeEach
    void setUp() {
        Role lecturerRole = new Role(3, "LECTURER");
        Role academicRole = new Role(4, "ACADEMIC_AFFAIRS");

        lecturerUser = new User();
        lecturerUser.setId(10L);
        lecturerUser.setUsername("gv_nguyen");
        lecturerUser.setEmail("gv@sms.edu.vn");
        lecturerUser.setRole(lecturerRole);

        headUser = new User();
        headUser.setId(11L);
        headUser.setUsername("truong_bomon");
        headUser.setEmail("head@sms.edu.vn");
        headUser.setRole(lecturerRole);

        academicUser = new User();
        academicUser.setId(12L);
        academicUser.setUsername("daotao");
        academicUser.setEmail("daotao@sms.edu.vn");
        academicUser.setRole(academicRole);

        department = new Department();
        department.setId(1);
        department.setName("Khoa Công nghệ thông tin");

        lecturer = new Lecturer();
        lecturer.setId(100L);
        lecturer.setUser(lecturerUser);
        lecturer.setDepartment(department);

        headLecturer = new Lecturer();
        headLecturer.setId(101L);
        headLecturer.setUser(headUser);
        headLecturer.setDepartment(department);
        department.setHeadLecturer(headLecturer);

        subject = new Subject();
        subject.setId(1);
        subject.setSubjectCode("CS101");
        subject.setSubjectName("Lập trình nâng cao");
        subject.setCredits(3);
        subject.setDepartment(department);

        section = new CourseSection();
        section.setId(500L);
        section.setSectionCode("CS101_01");
        section.setSubject(subject);
        section.setLecturer(lecturer);
        section.setGradeSubmissionStatus("PUBLISHED");
        section.setStatus(CourseSection.SectionStatus.ACTIVE);

        student = new Student();
        student.setId(200L);
        student.setStudentCode("SV2026001");
        student.setFullName("Nguyễn Văn An");
        student.setEmail("an.nv@sms.edu.vn");

        enrollment = new Enrollment();
        enrollment.setId(300L);
        enrollment.setStudent(student);
        enrollment.setSection(section);

        grade = new Grade();
        grade.setId(400L);
        grade.setEnrollment(enrollment);
        grade.setCc1Score(new BigDecimal("9.00"));
        grade.setCc2Score(new BigDecimal("8.50"));
        grade.setMidtermScore(new BigDecimal("7.00"));
        grade.setFinalScore(new BigDecimal("6.00"));
        grade.calculateTotalScore();

        ticket = GradeChangeTicket.builder()
                .id(1L)
                .student(student)
                .classSection(section)
                .componentType(GradeChangeTicket.ComponentType.FINAL)
                .oldScore(new BigDecimal("6.00"))
                .newScore(new BigDecimal("8.50"))
                .reason("Chấm sót câu số 4 tự luận phần thuật toán")
                .evidenceUrl("/api/uploads/evidence/test_evidence.png")
                .status(GradeChangeTicket.TicketStatus.PENDING_DEPT)
                .createdBy(lecturerUser)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Bước 1: Giảng viên tạo đơn sửa điểm sau khóa sổ thành công")
    void testCreateTicket_Success() {
        CreateGradeAmendmentRequest request = new CreateGradeAmendmentRequest();
        request.setClassSectionId(500L);
        request.setStudentId(200L);
        request.setComponentType(GradeChangeTicket.ComponentType.FINAL);
        request.setNewScore(new BigDecimal("8.50"));
        request.setReason("Chấm sót câu số 4 tự luận");
        request.setEvidenceUrl("/api/uploads/evidence/test.png");

        when(userRepository.findById(10L)).thenReturn(Optional.of(lecturerUser));
        when(courseSectionRepository.findById(500L)).thenReturn(Optional.of(section));
        when(lecturerRepository.findByUserId(10L)).thenReturn(Optional.of(lecturer));
        when(studentRepository.findById(200L)).thenReturn(Optional.of(student));
        when(enrollmentRepository.findByStudentIdAndSectionId(200L, 500L)).thenReturn(Optional.of(enrollment));
        when(gradeRepository.findByEnrollmentId(300L)).thenReturn(Optional.of(grade));
        when(ticketRepository.existsByClassSectionIdAndStudentIdAndComponentTypeAndStatusIn(anyLong(), anyLong(), any(), any())).thenReturn(false);
        when(ticketRepository.save(any(GradeChangeTicket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        GradeChangeTicket created = gradeAmendmentService.create(10L, request);

        assertNotNull(created);
        assertEquals(GradeChangeTicket.TicketStatus.PENDING_DEPT, created.getStatus());
        assertEquals(new BigDecimal("6.00"), created.getOldScore());
        assertEquals(new BigDecimal("8.50"), created.getNewScore());
        verify(ticketRepository).save(any(GradeChangeTicket.class));
    }

    @Test
    @DisplayName("Bước 1: Thất bại nếu lớp học phần chưa công bố / khóa sổ")
    void testCreateTicket_FailNotPublished() {
        section.setGradeSubmissionStatus("DRAFT");

        CreateGradeAmendmentRequest request = new CreateGradeAmendmentRequest();
        request.setClassSectionId(500L);
        request.setStudentId(200L);
        request.setComponentType(GradeChangeTicket.ComponentType.FINAL);
        request.setNewScore(new BigDecimal("8.00"));
        request.setReason("Lý do");
        request.setEvidenceUrl("url");

        when(userRepository.findById(10L)).thenReturn(Optional.of(lecturerUser));
        when(courseSectionRepository.findById(500L)).thenReturn(Optional.of(section));
        when(lecturerRepository.findByUserId(10L)).thenReturn(Optional.of(lecturer));

        assertThrows(BadRequestException.class, () -> gradeAmendmentService.create(10L, request));
    }

    @Test
    @DisplayName("Bước 2: Trưởng bộ môn thẩm định đồng thuận chuyển trạng thái PENDING_ACADEMIC")
    void testDeptReview_Approve() {
        DeptReviewAmendmentRequest request = new DeptReviewAmendmentRequest();
        request.setApproved(true);
        request.setNotes("Đã đối chiếu bài thi gốc, minh chứng hợp lệ");

        when(userRepository.findById(11L)).thenReturn(Optional.of(headUser));
        when(ticketRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(ticket));
        when(lecturerRepository.findByUserId(11L)).thenReturn(Optional.of(headLecturer));
        when(ticketRepository.save(any(GradeChangeTicket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        GradeChangeTicket reviewed = gradeAmendmentService.deptReview(11L, 1L, request);

        assertEquals(GradeChangeTicket.TicketStatus.PENDING_ACADEMIC, reviewed.getStatus());
        assertEquals(headUser, reviewed.getDeptReviewer());
        assertNotNull(reviewed.getDeptReviewedAt());
        assertEquals("Đã đối chiếu bài thi gốc, minh chứng hợp lệ", reviewed.getDeptNotes());
    }

    @Test
    @DisplayName("Bước 2: Trưởng bộ môn từ chối chuyển trạng thái REJECTED")
    void testDeptReview_Reject() {
        DeptReviewAmendmentRequest request = new DeptReviewAmendmentRequest();
        request.setApproved(false);
        request.setRejectionReason("Chữ ký cán bộ chấm thi mờ, không đủ điều kiện");

        when(userRepository.findById(11L)).thenReturn(Optional.of(headUser));
        when(ticketRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(ticket));
        when(lecturerRepository.findByUserId(11L)).thenReturn(Optional.of(headLecturer));
        when(ticketRepository.save(any(GradeChangeTicket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        GradeChangeTicket reviewed = gradeAmendmentService.deptReview(11L, 1L, request);

        assertEquals(GradeChangeTicket.TicketStatus.REJECTED, reviewed.getStatus());
        assertEquals("Chữ ký cán bộ chấm thi mờ, không đủ điều kiện", reviewed.getRejectionReason());
    }

    @Test
    @DisplayName("Bước 3: Phòng Đào tạo duyệt cuối -> Update Grade + Insert Audit Log + Recalculate + APPROVED")
    void testAcademicApproval_Success() {
        ticket.setStatus(GradeChangeTicket.TicketStatus.PENDING_ACADEMIC);

        AcademicApprovalAmendmentRequest request = new AcademicApprovalAmendmentRequest();
        request.setApproved(true);

        when(userRepository.findById(12L)).thenReturn(Optional.of(academicUser));
        when(ticketRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(ticket));
        when(enrollmentRepository.findByStudentIdAndSectionId(200L, 500L)).thenReturn(Optional.of(enrollment));
        when(gradeRepository.findByEnrollmentId(300L)).thenReturn(Optional.of(grade));
        when(ticketRepository.save(any(GradeChangeTicket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        GradeChangeTicket approved = gradeAmendmentService.academicApproval(12L, 1L, request, "127.0.0.1");

        assertEquals(GradeChangeTicket.TicketStatus.APPROVED, approved.getStatus());
        assertEquals(academicUser, approved.getApprovedBy());
        assertNotNull(approved.getApprovedAt());

        // Kiểm tra điểm số của sinh viên đã được cập nhật
        assertEquals(new BigDecimal("8.50"), grade.getFinalScore());
        verify(gradeRepository).save(grade);

        // Kiểm tra bản ghi kiểm toán GradeAuditLog được lưu
        ArgumentCaptor<GradeAuditLog> auditCaptor = ArgumentCaptor.forClass(GradeAuditLog.class);
        verify(gradeAuditLogRepository).save(auditCaptor.capture());
        GradeAuditLog logged = auditCaptor.getValue();
        assertEquals(new BigDecimal("6.00"), logged.getOldScore());
        assertEquals(new BigDecimal("8.50"), logged.getNewScore());
        assertEquals("FINAL", logged.getComponent());
        assertEquals("127.0.0.1", logged.getIpAddress());

        // Kiểm tra thông báo được gửi
        verify(notificationService).createNotification(eq(200L), anyString(), anyString(), eq(Notification.NotificationType.GRADE_UPDATED), eq(500L));
    }
}
