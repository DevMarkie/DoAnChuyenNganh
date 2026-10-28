package com.sms.service;

import com.sms.dto.request.CourseSectionRequest;
import com.sms.dto.request.GradeRequest;
import com.sms.entity.*;
import com.sms.exception.BadRequestException;
import com.sms.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StateTransitionRulesTest {

    @Nested
    @DisplayName("1. CourseSection State Transition & Anti-skip Rules")
    class CourseSectionStateTransitionTests {

        @Mock
        private CourseSectionRepository courseSectionRepository;
        @Mock
        private LecturerRepository lecturerRepository;
        @Mock
        private ScheduleRepository scheduleRepository;

        @InjectMocks
        private CourseSectionService courseSectionService;

        private CourseSection section;

        @BeforeEach
        void setUp() {
            section = new CourseSection();
            section.setId(10L);
            section.setSectionCode("SE_STATE_01");
            section.setStatus(CourseSection.SectionStatus.OPEN);
            section.setMaxStudents(50);
            section.setCurrentStudents(10);
        }

        @Test
        @DisplayName("Valid transition: OPEN -> CLOSED")
        void testTransition_OpenToClosed_Success() {
            when(courseSectionRepository.findById(10L)).thenReturn(Optional.of(section));
            when(courseSectionRepository.save(any(CourseSection.class))).thenAnswer(i -> i.getArgument(0));

            CourseSectionRequest request = new CourseSectionRequest();
            request.setStatus("CLOSED");

            CourseSection updated = courseSectionService.update(10L, request);
            assertEquals(CourseSection.SectionStatus.CLOSED, updated.getStatus());
        }

        @Test
        @DisplayName("Valid transition: OPEN -> CANCELLED")
        void testTransition_OpenToCancelled_Success() {
            when(courseSectionRepository.findById(10L)).thenReturn(Optional.of(section));
            when(courseSectionRepository.save(any(CourseSection.class))).thenAnswer(i -> i.getArgument(0));

            CourseSectionRequest request = new CourseSectionRequest();
            request.setStatus("CANCELLED");

            CourseSection updated = courseSectionService.update(10L, request);
            assertEquals(CourseSection.SectionStatus.CANCELLED, updated.getStatus());
        }

        @Test
        @DisplayName("Anti-skip: OPEN -> ACTIVE directly is forbidden (must CLOSE registration first)")
        void testAntiSkip_OpenToActive_ThrowsBadRequest() {
            when(courseSectionRepository.findById(10L)).thenReturn(Optional.of(section));

            CourseSectionRequest request = new CourseSectionRequest();
            request.setStatus("ACTIVE");

            BadRequestException ex = assertThrows(BadRequestException.class,
                    () -> courseSectionService.update(10L, request));
            assertTrue(ex.getMessage().contains("Vi phạm luồng trạng thái"));
        }

        @Test
        @DisplayName("Anti-skip: OPEN -> COMPLETED directly is forbidden")
        void testAntiSkip_OpenToCompleted_ThrowsBadRequest() {
            when(courseSectionRepository.findById(10L)).thenReturn(Optional.of(section));

            CourseSectionRequest request = new CourseSectionRequest();
            request.setStatus("COMPLETED");

            BadRequestException ex = assertThrows(BadRequestException.class,
                    () -> courseSectionService.update(10L, request));
            assertTrue(ex.getMessage().contains("Vi phạm luồng trạng thái"));
        }

        @Test
        @DisplayName("Valid transition: CLOSED -> ACTIVE and CLOSED -> OPEN")
        void testTransition_ClosedTransitions() {
            section.setStatus(CourseSection.SectionStatus.CLOSED);
            when(courseSectionRepository.findById(10L)).thenReturn(Optional.of(section));
            when(courseSectionRepository.save(any(CourseSection.class))).thenAnswer(i -> i.getArgument(0));

            CourseSectionRequest reqActive = new CourseSectionRequest();
            reqActive.setStatus("ACTIVE");
            CourseSection updated = courseSectionService.update(10L, reqActive);
            assertEquals(CourseSection.SectionStatus.ACTIVE, updated.getStatus());

            // Re-open registration
            section.setStatus(CourseSection.SectionStatus.CLOSED);
            CourseSectionRequest reqOpen = new CourseSectionRequest();
            reqOpen.setStatus("OPEN");
            updated = courseSectionService.update(10L, reqOpen);
            assertEquals(CourseSection.SectionStatus.OPEN, updated.getStatus());
        }

        @Test
        @DisplayName("Valid transition: ACTIVE -> COMPLETED")
        void testTransition_ActiveToCompleted_Success() {
            section.setStatus(CourseSection.SectionStatus.ACTIVE);
            when(courseSectionRepository.findById(10L)).thenReturn(Optional.of(section));
            when(courseSectionRepository.save(any(CourseSection.class))).thenAnswer(i -> i.getArgument(0));

            CourseSectionRequest request = new CourseSectionRequest();
            request.setStatus("COMPLETED");

            CourseSection updated = courseSectionService.update(10L, request);
            assertEquals(CourseSection.SectionStatus.COMPLETED, updated.getStatus());
        }

        @Test
        @DisplayName("Invalid transition: CANCELLED -> any other status is rejected")
        void testTransition_CancelledToAny_ThrowsBadRequest() {
            section.setStatus(CourseSection.SectionStatus.CANCELLED);
            when(courseSectionRepository.findById(10L)).thenReturn(Optional.of(section));

            CourseSectionRequest request = new CourseSectionRequest();
            request.setStatus("ACTIVE");

            BadRequestException ex = assertThrows(BadRequestException.class,
                    () -> courseSectionService.update(10L, request));
            assertTrue(ex.getMessage().contains("Vi phạm luồng trạng thái"));
        }
    }

    @Nested
    @DisplayName("2. Grade Entry Anti-skip & Auto-completion Rules")
    class GradeEntryAntiSkipTests {

        @Mock
        private GradeRepository gradeRepository;
        @Mock
        private EnrollmentRepository enrollmentRepository;
        @Mock
        private CourseSectionRepository courseSectionRepository;
        @Mock
        private LecturerRepository lecturerRepository;
        @Mock
        private SemesterRepository semesterRepository;
        @Mock
        private NotificationService notificationService;
        @Mock
        private UserRepository userRepository;
        @Mock
        private com.sms.repository.GradeAuditLogRepository gradeAuditLogRepository;

        @InjectMocks
        private GradeService gradeService;

        private CourseSection section;
        private Enrollment enrollment;
        private Lecturer lecturer;
        private Student student;
        private Grade grade;

        @BeforeEach
        void setUp() {
            lecturer = new Lecturer();
            lecturer.setId(1L);

            section = new CourseSection();
            section.setId(10L);
            section.setSectionCode("SE_GRADE_01");
            section.setLecturer(lecturer);
            section.setStatus(CourseSection.SectionStatus.OPEN);

            student = new Student();
            student.setId(100L);
            student.setStudentCode("SV100");

            enrollment = new Enrollment();
            enrollment.setId(200L);
            enrollment.setSection(section);
            enrollment.setStudent(student);

            grade = new Grade();
            grade.setId(300L);
            grade.setEnrollment(enrollment);
        }

        @Test
        @DisplayName("Anti-skip: Cannot enter grades if section is still OPEN")
        void testGradeEntry_SectionOpen_ThrowsBadRequest() {
            section.setStatus(CourseSection.SectionStatus.OPEN);
            when(enrollmentRepository.findById(200L)).thenReturn(Optional.of(enrollment));
            when(gradeRepository.findByEnrollmentId(200L)).thenReturn(Optional.of(grade));

            GradeRequest request = new GradeRequest();
            request.setEnrollmentId(200L);
            request.setMidtermScore(BigDecimal.valueOf(8.5));

            BadRequestException ex = assertThrows(BadRequestException.class,
                    () -> gradeService.saveGrade(1L, request));
            assertTrue(ex.getMessage().contains("đang mở đăng ký (OPEN)"));
        }

        @Test
        @DisplayName("Anti-skip: Cannot enter grades if section is CANCELLED")
        void testGradeEntry_SectionCancelled_ThrowsBadRequest() {
            section.setStatus(CourseSection.SectionStatus.CANCELLED);
            when(enrollmentRepository.findById(200L)).thenReturn(Optional.of(enrollment));
            when(gradeRepository.findByEnrollmentId(200L)).thenReturn(Optional.of(grade));

            GradeRequest request = new GradeRequest();
            request.setEnrollmentId(200L);
            request.setFinalScore(BigDecimal.valueOf(7.0));

            BadRequestException ex = assertThrows(BadRequestException.class,
                    () -> gradeService.saveGrade(1L, request));
            assertTrue(ex.getMessage().contains("đã bị hủy (CANCELLED)"));
        }

        @Test
        @DisplayName("Grade Finalize: When finalized, section transitions automatically to COMPLETED")
        void testGradeFinalize_TransitionsSectionToCompleted() {
            section.setStatus(CourseSection.SectionStatus.ACTIVE);
            grade.setFinalScore(BigDecimal.valueOf(8.5)); // BR-Exam02: Khảo thí đã nạp điểm thi cuối kỳ
            when(enrollmentRepository.findById(200L)).thenReturn(Optional.of(enrollment));
            when(lecturerRepository.findByUserId(1L)).thenReturn(Optional.of(lecturer));
            when(gradeRepository.findByEnrollmentId(200L)).thenReturn(Optional.of(grade));
            when(enrollmentRepository.findActiveBySectionId(10L)).thenReturn(List.of(enrollment));
            when(gradeRepository.save(any(Grade.class))).thenAnswer(i -> i.getArgument(0));

            GradeRequest request = new GradeRequest();
            request.setEnrollmentId(200L);
            request.setCc1Score(BigDecimal.valueOf(9.0));
            request.setCc2Score(BigDecimal.valueOf(9.0));
            request.setMidtermScore(BigDecimal.valueOf(8.0));
            request.setFinalScore(BigDecimal.valueOf(8.5));
            request.setFinalize(true);

            Grade saved = gradeService.saveGrade(1L, request);

            assertTrue(saved.getIsFinalized());
            assertEquals(CourseSection.SectionStatus.COMPLETED, section.getStatus());
            verify(courseSectionRepository).save(section);
        }

        @Test
        @DisplayName("Admin unlock: When admin unlocks grade, section transitions from COMPLETED to ACTIVE")
        void testGradeUnlock_AdminTransitionsSectionToActive() {
            section.setStatus(CourseSection.SectionStatus.COMPLETED);
            grade.setIsFinalized(true);

            when(enrollmentRepository.findById(200L)).thenReturn(Optional.of(enrollment));
            when(lecturerRepository.findByUserId(999L)).thenReturn(Optional.empty()); // Admin
            when(gradeRepository.findByEnrollmentId(200L)).thenReturn(Optional.of(grade));
            when(gradeRepository.save(any(Grade.class))).thenAnswer(i -> i.getArgument(0));

            GradeRequest request = new GradeRequest();
            request.setEnrollmentId(200L);
            request.setFinalize(false); // Admin unlock

            Grade saved = gradeService.saveGrade(999L, request);

            assertFalse(saved.getIsFinalized());
            assertEquals(CourseSection.SectionStatus.ACTIVE, section.getStatus());
            verify(courseSectionRepository).save(section);
        }
    }

    @Nested
    @DisplayName("3. Student Academic Standing & Access Control Rules")
    class StudentAcademicStandingAccessControlTests {

        @Mock
        private StudentRepository studentRepository;
        @Mock
        private EnrollmentRepository enrollmentRepository;
        @Mock
        private GradeAppealRepository appealRepository;
        @Mock
        private CourseSectionRepository courseSectionRepository;
        @Mock
        private UserRepository userRepository;

        @InjectMocks
        private EnrollmentService enrollmentService;

        @InjectMocks
        private GradeAppealService gradeAppealService;

        private Student student;
        private User user;

        @BeforeEach
        void setUp() {
            user = new User();
            user.setId(50L);
            user.setUsername("sv_test");
            user.setIsActive(true);

            student = new Student();
            student.setId(100L);
            student.setUser(user);
            student.setStudentCode("SV_TEST");
            student.setStatus(Student.StudentStatus.ACTIVE);
        }

        @Test
        @DisplayName("Suspended (Bảo lưu) student is blocked from enrolling in courses")
        void testEnroll_SuspendedStudent_Blocked() {
            student.setStatus(Student.StudentStatus.SUSPENDED);
            when(studentRepository.findByUserId(50L)).thenReturn(Optional.of(student));

            BadRequestException ex = assertThrows(BadRequestException.class,
                    () -> enrollmentService.enroll(50L, 10L));
            assertTrue(ex.getMessage().contains("Bảo lưu"));
        }

        @Test
        @DisplayName("Inactive (Buộc thôi học) student is blocked from enrolling in courses")
        void testEnroll_InactiveStudent_Blocked() {
            student.setStatus(Student.StudentStatus.INACTIVE);
            when(studentRepository.findByUserId(50L)).thenReturn(Optional.of(student));

            BadRequestException ex = assertThrows(BadRequestException.class,
                    () -> enrollmentService.enroll(50L, 10L));
            assertTrue(ex.getMessage().contains("Buộc thôi học") || ex.getMessage().contains("Ngừng học"));
        }

        @Test
        @DisplayName("Suspended or Inactive student is blocked from submitting grade appeals")
        void testGradeAppeal_SuspendedStudent_Blocked() {
            student.setStatus(Student.StudentStatus.SUSPENDED);
            when(studentRepository.findByUserId(50L)).thenReturn(Optional.of(student));

            com.sms.dto.request.GradeAppealRequest request = new com.sms.dto.request.GradeAppealRequest();
            request.setEnrollmentId(200L);

            BadRequestException ex = assertThrows(BadRequestException.class,
                    () -> gradeAppealService.create(50L, request));
            assertTrue(ex.getMessage().contains("Bảo lưu / Thôi học"));
        }
    }
}
