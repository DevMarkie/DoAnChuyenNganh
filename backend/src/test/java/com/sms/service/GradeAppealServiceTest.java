package com.sms.service;

import com.sms.dto.request.*;
import com.sms.entity.*;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.*;
import org.junit.jupiter.api.BeforeEach;
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
public class GradeAppealServiceTest {

    @Mock
    private GradeAppealRepository appealRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private GradeRepository gradeRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private LecturerRepository lecturerRepository;
    @Mock
    private DepartmentRepository departmentRepository;
    @Mock
    private GradeAuditLogRepository gradeAuditLogRepository;
    @Mock
    private SystemConfigRepository systemConfigRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private TranscriptService transcriptService;

    @InjectMocks
    private GradeAppealService appealService;

    private Student student;
    private Lecturer lecturer;
    private Lecturer independentLecturer;
    private Department department;
    private CourseSection section;
    private Enrollment enrollment;
    private Grade grade;
    private GradeAppeal appeal;
    private User reviewer;
    private User deanUser;

    @BeforeEach
    void setUp() {
        student = new Student();
        student.setId(1L);
        student.setStatus(Student.StudentStatus.ACTIVE);

        department = new Department();
        department.setId(1);
        department.setName("Khoa CNTT");

        lecturer = new Lecturer();
        lecturer.setId(1L);
        lecturer.setDepartment(department);

        independentLecturer = new Lecturer();
        independentLecturer.setId(2L);
        independentLecturer.setDepartment(department);

        Subject subject = new Subject();
        subject.setId(1);
        subject.setDepartment(department);

        Semester semester = new Semester();
        semester.setId(1);

        section = new CourseSection();
        section.setId(1L);
        section.setLecturer(lecturer);
        section.setSubject(subject);
        section.setSemester(semester);
        section.setGradeSubmissionStatus("PUBLISHED");

        enrollment = new Enrollment();
        enrollment.setId(1L);
        enrollment.setStudent(student);
        enrollment.setSection(section);

        grade = new Grade();
        grade.setId(1L);
        grade.setEnrollment(enrollment);
        grade.setIsFinalized(true);
        grade.setFinalizedAt(LocalDateTime.now().minusDays(1)); // valid
        grade.setFinalScore(BigDecimal.valueOf(5));

        appeal = new GradeAppeal();
        appeal.setId(1L);
        appeal.setStudent(student);
        appeal.setEnrollment(enrollment);
        appeal.setStatus(GradeAppeal.AppealStatus.PENDING);
        appeal.setScoreComponent(GradeAppeal.ScoreComponent.FINAL);
        appeal.setCurrentScore(BigDecimal.valueOf(5));

        reviewer = new User();
        reviewer.setId(2L);
        reviewer.setUsername("gv_doclap");

        deanUser = new User();
        deanUser.setId(3L);
        deanUser.setUsername("truong_khoa");
    }

    @Test
    void findMine_Success() {
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));
        when(appealRepository.findByStudentIdWithDetails(1L)).thenReturn(List.of(appeal));

        List<GradeAppeal> result = appealService.findMine(1L);
        assertEquals(1, result.size());
    }

    @Test
    void findAll_Admin_Success() {
        when(lecturerRepository.findByUserId(99L)).thenReturn(Optional.empty());
        when(appealRepository.findAllWithDetails()).thenReturn(List.of(appeal));

        List<GradeAppeal> result = appealService.findAll(99L, null, null, null);
        assertEquals(1, result.size());
    }

    @Test
    void create_FinalScore_Success() {
        GradeAppealRequest req = new GradeAppealRequest();
        req.setEnrollmentId(1L);
        req.setScoreComponent(GradeAppeal.ScoreComponent.FINAL);
        req.setReason("Bài thi cuối kỳ em làm tốt nhưng điểm bị thấp");

        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));
        when(enrollmentRepository.findById(1L)).thenReturn(Optional.of(enrollment));
        when(gradeRepository.findByEnrollmentId(1L)).thenReturn(Optional.of(grade));
        when(appealRepository.countByStudentIdAndEnrollmentSectionSubjectIdAndStatusIn(anyLong(), anyInt(), any()))
                .thenReturn(0L);
        when(appealRepository.save(any())).thenReturn(appeal);

        GradeAppeal result = appealService.create(1L, req);

        ArgumentCaptor<GradeAppeal> captor = ArgumentCaptor.forClass(GradeAppeal.class);
        verify(appealRepository).save(captor.capture());
        GradeAppeal built = captor.getValue();
        assertEquals(0, BigDecimal.valueOf(5).compareTo(built.getCurrentScore()));
        assertEquals(GradeAppeal.AppealStatus.PENDING, built.getStatus());
        assertNotNull(result);
    }

    @Test
    void create_CC1_ThrowsBadRequest_UnderLuong2() {
        GradeAppealRequest req = new GradeAppealRequest();
        req.setEnrollmentId(1L);
        req.setScoreComponent(GradeAppeal.ScoreComponent.CC1);
        req.setDesiredScore(BigDecimal.valueOf(10));
        req.setReason("Em đi học đủ tất cả các buổi nhưng bị ghi nhầm vắng 1 buổi");

        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));
        when(enrollmentRepository.findById(1L)).thenReturn(Optional.of(enrollment));
        when(gradeRepository.findByEnrollmentId(1L)).thenReturn(Optional.of(grade));

        assertThrows(BadRequestException.class, () -> appealService.create(1L, req));
    }

    @Test
    void assignGrader_CannotAssignSectionLecturer() {
        AssignAppealGraderRequest req = new AssignAppealGraderRequest(1L); // lecturer 1 is teaching this section
        when(appealRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(appeal));
        when(lecturerRepository.findById(1L)).thenReturn(Optional.of(lecturer));

        assertThrows(BadRequestException.class, () -> appealService.assignGrader(99L, 1L, req));
    }

    @Test
    void assignGrader_Success() {
        AssignAppealGraderRequest req = new AssignAppealGraderRequest(2L); // independent lecturer
        when(appealRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(appeal));
        when(lecturerRepository.findById(2L)).thenReturn(Optional.of(independentLecturer));
        when(appealRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        GradeAppeal updated = appealService.assignGrader(99L, 1L, req);
        assertEquals(GradeAppeal.AppealStatus.ASSIGNED, updated.getStatus());
        assertEquals(2L, updated.getAssignedLecturer().getId());
    }

    @Test
    void submitGrading_ExceedsThreshold_ChuyenLenTruongKhoa() {
        appeal.setStatus(GradeAppeal.AppealStatus.ASSIGNED);
        appeal.setAssignedLecturer(independentLecturer);

        SubmitAppealGradingRequest req = new SubmitAppealGradingRequest();
        req.setNewScore(new BigDecimal("6.0")); // Diff = 1.0 >= 0.5
        req.setHasMechanicalError(false);
        req.setReviewNotes("Chấm lại câu 3 cộng thiếu điểm cho sinh viên");

        when(appealRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(appeal));
        when(lecturerRepository.findByUserId(2L)).thenReturn(Optional.of(independentLecturer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(reviewer));
        when(appealRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        GradeAppeal result = appealService.submitGrading(2L, 1L, req);
        assertEquals(GradeAppeal.AppealStatus.PENDING_HEAD_APPROVAL, result.getStatus());
        assertTrue(result.getExceedsThreshold());
    }

    @Test
    void submitGrading_BelowThreshold_GiuNguyenDiemCu() {
        appeal.setStatus(GradeAppeal.AppealStatus.ASSIGNED);
        appeal.setAssignedLecturer(independentLecturer);

        SubmitAppealGradingRequest req = new SubmitAppealGradingRequest();
        req.setNewScore(new BigDecimal("5.25")); // Diff = 0.25 < 0.5
        req.setHasMechanicalError(false);
        req.setReviewNotes("Chênh lệch nhỏ dưới 0.5 điểm không do lỗi cộng cơ học");

        when(appealRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(appeal));
        when(lecturerRepository.findByUserId(2L)).thenReturn(Optional.of(independentLecturer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(reviewer));
        when(appealRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        GradeAppeal result = appealService.submitGrading(2L, 1L, req);
        assertEquals(GradeAppeal.AppealStatus.REJECTED_NO_CHANGE, result.getStatus());
        assertFalse(result.getExceedsThreshold());
    }

    @Test
    void headSignAppeal_Approved_TaoChuKyDienTu() {
        appeal.setStatus(GradeAppeal.AppealStatus.PENDING_HEAD_APPROVAL);
        appeal.setNewScore(new BigDecimal("6.5"));

        HeadSignAppealRequest req = new HeadSignAppealRequest();
        req.setApproved(true);
        req.setHeadReviewNotes("Đồng ý với biên bản thẩm định của cán bộ chấm độc lập");

        when(appealRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(appeal));
        when(userRepository.findById(3L)).thenReturn(Optional.of(deanUser));
        when(lecturerRepository.findByUserId(3L)).thenReturn(Optional.empty()); // admin / bypass dean check
        when(appealRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        GradeAppeal result = appealService.headSignAppeal(3L, 1L, req);
        assertEquals(GradeAppeal.AppealStatus.HEAD_APPROVED, result.getStatus());
        assertNotNull(result.getHeadSignatureHash());
        assertNotNull(result.getHeadApprovedAt());
    }

    @Test
    void applyFinalAdjustment_Success_CapNhatVaoHeThong() {
        appeal.setStatus(GradeAppeal.AppealStatus.HEAD_APPROVED);
        appeal.setNewScore(new BigDecimal("7.0"));

        ApplyAppealGradeRequest req = new ApplyAppealGradeRequest();
        req.setFinalAdjustmentReason("Điều chỉnh theo biên bản phúc khảo số 01/PK-CNTT");

        when(appealRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(appeal));
        when(userRepository.findById(99L)).thenReturn(Optional.of(reviewer));
        when(gradeRepository.findByEnrollmentId(1L)).thenReturn(Optional.of(grade));
        when(gradeRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(appealRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        GradeAppeal result = appealService.applyFinalAdjustment(99L, 1L, req);
        assertEquals(GradeAppeal.AppealStatus.APPROVED_AND_APPLIED, result.getStatus());
        assertEquals(0, BigDecimal.valueOf(7.0).compareTo(grade.getFinalScore()));
        verify(gradeAuditLogRepository).save(any());
        verify(gradeRepository).save(grade);
    }
}
