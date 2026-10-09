package com.sms.service;

import com.sms.entity.*;
import com.sms.exception.BadRequestException;
import com.sms.repository.*;
import org.junit.jupiter.api.DisplayName;
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
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EnrollmentServiceTest {

    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private CourseSectionRepository courseSectionRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private ScheduleRepository scheduleRepository;
    @Mock private GradeRepository gradeRepository;
    @Mock private LecturerRepository lecturerRepository;
    @Mock private CurriculumProgramRepository curriculumProgramRepository;
    @Mock private CurriculumBlockSubjectRepository curriculumBlockSubjectRepository;

    @InjectMocks private EnrollmentService enrollmentService;

    private static Student createStudent(Long id, Long userId) {
        User user = new User();
        user.setId(userId);
        user.setUsername("SV" + id);

        Major major = new Major();
        major.setId(1);
        major.setName("CNTT");

        Cohort cohort = new Cohort();
        cohort.setId(1);
        cohort.setName("K16");

        ClassEntity cls = new ClassEntity();
        cls.setId(1);
        cls.setName("IT01");
        cls.setMajor(major);
        cls.setCohort(cohort);

        Student s = new Student();
        s.setUser(user);
        s.setId(id);
        s.setStudentCode("SV" + id);
        s.setFullName("Sinh viên " + id);
        s.setClassEntity(cls);
        return s;
    }

    private static CourseSection createSection(Long sectionId, Subject subject, int maxStudents, int currentStudents) {
        Semester semester = new Semester();
        semester.setId(1);
        semester.setStatus(Semester.SemesterStatus.ACTIVE);
        semester.setIsCurrent(true);
        semester.setRegistrationStart(LocalDate.now().minusDays(1));
        semester.setRegistrationEnd(LocalDate.now().plusDays(5));

        CourseSection sec = new CourseSection();
        sec.setId(sectionId);
        sec.setSectionCode("SEC-" + sectionId);
        sec.setSubject(subject);
        sec.setSemester(semester);
        sec.setStatus(CourseSection.SectionStatus.OPEN);
        sec.setMaxStudents(maxStudents);
        sec.setCurrentStudents(currentStudents);
        return sec;
    }

    /**
     * Cho phép qua cổng kiểm tra chương trình đào tạo (assertInStudentCurriculum).
     * Sinh viên trong các test này có major+cohort nên enroll() luôn gọi cổng này
     * TRƯỚC bước tiên quyết/phân loại; thiếu stub sẽ ném "chưa được gán chương
     * trình đào tạo" và che mất hành vi đang kiểm thử.
     */
    private void allowCurriculum(int subjectId) {
        CurriculumProgram program = new CurriculumProgram();
        program.setId(1L);
        when(curriculumProgramRepository.findActiveByMajorAndCohort(1, 1)).thenReturn(Optional.of(program));
        when(curriculumBlockSubjectRepository.existsByProgramIdAndSubjectId(1L, subjectId)).thenReturn(true);
    }

    @Test
    @DisplayName("TC-01.1: Đăng ký thất bại khi sinh viên chưa hoàn thành môn tiên quyết")
    void enroll_fails_whenPrerequisiteNotPassed() {
        Long userId = 10L;
        Long studentId = 1L;
        Long sectionId = 100L;

        Subject prereq = new Subject();
        prereq.setId(1);
        prereq.setSubjectCode("CS101");
        prereq.setSubjectName("Lập trình C");

        Subject targetSubject = new Subject();
        targetSubject.setId(2);
        targetSubject.setSubjectCode("CS201");
        targetSubject.setSubjectName("Cấu trúc dữ liệu");
        targetSubject.setCredits(3);
        targetSubject.setPrerequisites(Set.of(prereq));

        Student student = createStudent(studentId, userId);
        CourseSection section = createSection(sectionId, targetSubject, 40, 20);

        when(studentRepository.findByUserId(userId)).thenReturn(Optional.of(student));
        when(courseSectionRepository.findByIdForEnrollment(sectionId)).thenReturn(Optional.of(section));
        allowCurriculum(2);
        when(gradeRepository.existsPassedFinalizedByStudentAndSubject(studentId, prereq.getId())).thenReturn(false);

        assertThatThrownBy(() -> enrollmentService.enroll(userId, sectionId))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("yêu cầu hoàn thành môn tiên quyết CS101 - Lập trình C");

        verify(enrollmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-01.2: Đăng ký thành công và phân loại FIRST_TIME khi qua môn tiên quyết")
    void enroll_success_firstTime_whenPrerequisitePassed() {
        Long userId = 10L;
        Long studentId = 1L;
        Long sectionId = 100L;

        Subject prereq = new Subject();
        prereq.setId(1);
        prereq.setSubjectCode("CS101");
        prereq.setSubjectName("Lập trình C");

        Subject targetSubject = new Subject();
        targetSubject.setId(2);
        targetSubject.setSubjectCode("CS201");
        targetSubject.setSubjectName("Cấu trúc dữ liệu");
        targetSubject.setCredits(3);
        targetSubject.setPrerequisites(Set.of(prereq));

        Student student = createStudent(studentId, userId);
        CourseSection section = createSection(sectionId, targetSubject, 40, 20);

        when(studentRepository.findByUserId(userId)).thenReturn(Optional.of(student));
        when(courseSectionRepository.findByIdForEnrollment(sectionId)).thenReturn(Optional.of(section));
        allowCurriculum(2);
        when(gradeRepository.existsPassedFinalizedByStudentAndSubject(studentId, prereq.getId())).thenReturn(true);
        when(enrollmentRepository.findByStudentIdAndSectionId(studentId, sectionId)).thenReturn(Optional.empty());
        when(enrollmentRepository.countEnrolledCredits(studentId, 1)).thenReturn(10);
        when(scheduleRepository.findSchedulesForStudentAndSemester(studentId, 1, 1L)).thenReturn(Collections.emptyList());
        when(scheduleRepository.findBySectionId(sectionId)).thenReturn(Collections.emptyList());
        when(gradeRepository.findFinalizedByStudentAndSubject(studentId, targetSubject.getId())).thenReturn(Collections.emptyList());
        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(i -> i.getArgument(0));

        Enrollment result = enrollmentService.enroll(userId, sectionId);

        assertThat(result).isNotNull();
        assertThat(result.getEnrollmentType()).isEqualTo(Enrollment.EnrollmentType.FIRST_TIME);
        assertThat(result.getStatus()).isEqualTo(Enrollment.EnrollmentStatus.ENROLLED);
        verify(enrollmentRepository).save(any(Enrollment.class));
    }

    @Test
    @DisplayName("TC-02.1: Tự động phân loại RETAKE khi môn học từng bị trượt (điểm F)")
    void enroll_resolvesRetake_whenPreviousGradeWasFailing() {
        Long userId = 10L;
        Long studentId = 1L;
        Long sectionId = 100L;

        Subject targetSubject = new Subject();
        targetSubject.setId(5);
        targetSubject.setSubjectCode("MATH101");
        targetSubject.setCredits(3);
        targetSubject.setPrerequisites(Collections.emptySet());

        Student student = createStudent(studentId, userId);
        CourseSection section = createSection(sectionId, targetSubject, 40, 10);

        Grade failingGrade = new Grade();
        failingGrade.setLetterGrade("F");
        failingGrade.setFinalScore(new BigDecimal("2.5"));

        when(studentRepository.findByUserId(userId)).thenReturn(Optional.of(student));
        when(courseSectionRepository.findByIdForEnrollment(sectionId)).thenReturn(Optional.of(section));
        allowCurriculum(5);
        when(enrollmentRepository.findByStudentIdAndSectionId(studentId, sectionId)).thenReturn(Optional.empty());
        when(enrollmentRepository.countEnrolledCredits(studentId, 1)).thenReturn(0);
        when(scheduleRepository.findSchedulesForStudentAndSemester(studentId, 1, 1L)).thenReturn(Collections.emptyList());
        when(scheduleRepository.findBySectionId(sectionId)).thenReturn(Collections.emptyList());
        when(gradeRepository.findFinalizedByStudentAndSubject(studentId, targetSubject.getId())).thenReturn(List.of(failingGrade));
        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(i -> i.getArgument(0));

        Enrollment result = enrollmentService.enroll(userId, sectionId);

        assertThat(result.getEnrollmentType()).isEqualTo(Enrollment.EnrollmentType.RETAKE);
        assertThat(result.getStatus()).isEqualTo(Enrollment.EnrollmentStatus.ENROLLED);
    }

    @Test
    @DisplayName("TC-02.2: Tự động phân loại IMPROVE khi môn học đã từng qua (điểm A-D)")
    void enroll_resolvesImprove_whenPreviousGradeWasPassed() {
        Long userId = 10L;
        Long studentId = 1L;
        Long sectionId = 100L;

        Subject targetSubject = new Subject();
        targetSubject.setId(5);
        targetSubject.setSubjectCode("MATH101");
        targetSubject.setCredits(3);
        targetSubject.setPrerequisites(Collections.emptySet());

        Student student = createStudent(studentId, userId);
        CourseSection section = createSection(sectionId, targetSubject, 40, 10);

        Grade passedGrade = new Grade();
        passedGrade.setTotalScore(new BigDecimal("5.5"));
        passedGrade.setLetterGrade("C");
        passedGrade.setFinalScore(new BigDecimal("5.0"));

        when(studentRepository.findByUserId(userId)).thenReturn(Optional.of(student));
        when(courseSectionRepository.findByIdForEnrollment(sectionId)).thenReturn(Optional.of(section));
        allowCurriculum(5);
        when(enrollmentRepository.findByStudentIdAndSectionId(studentId, sectionId)).thenReturn(Optional.empty());
        when(enrollmentRepository.countEnrolledCredits(studentId, 1)).thenReturn(0);
        when(scheduleRepository.findSchedulesForStudentAndSemester(studentId, 1, 1L)).thenReturn(Collections.emptyList());
        when(scheduleRepository.findBySectionId(sectionId)).thenReturn(Collections.emptyList());
        when(gradeRepository.findFinalizedByStudentAndSubject(studentId, targetSubject.getId())).thenReturn(List.of(passedGrade));
        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(i -> i.getArgument(0));

        Enrollment result = enrollmentService.enroll(userId, sectionId);

        assertThat(result.getEnrollmentType()).isEqualTo(Enrollment.EnrollmentType.IMPROVE);
    }

    @Test
    @DisplayName("TC-ENR-SUBJECT: Không cho đăng ký lớp thứ hai của cùng môn trong cùng học kỳ")
    void enroll_fails_whenAlreadyEnrolledInAnotherSectionOfSameSubject() {
        Long userId = 10L;
        Long studentId = 1L;
        Long sectionId = 100L;
        Long enrolledSectionId = 101L;

        Subject subject = new Subject();
        subject.setId(5);
        subject.setSubjectCode("MATH101");
        subject.setSubjectName("Giải tích 1");
        subject.setCredits(3);
        subject.setPrerequisites(Collections.emptySet());

        Student student = createStudent(studentId, userId);
        CourseSection targetSection = createSection(sectionId, subject, 40, 10);
        CourseSection enrolledSection = createSection(enrolledSectionId, subject, 40, 10);
        enrolledSection.setSectionCode("MATH101-01");

        Enrollment existing = new Enrollment();
        existing.setId(200L);
        existing.setStudent(student);
        existing.setSection(enrolledSection);
        existing.setStatus(Enrollment.EnrollmentStatus.ENROLLED);

        when(studentRepository.findByUserId(userId)).thenReturn(Optional.of(student));
        when(courseSectionRepository.findByIdForEnrollment(sectionId)).thenReturn(Optional.of(targetSection));
        allowCurriculum(5);
        when(enrollmentRepository.findByStudentIdAndSectionId(studentId, sectionId)).thenReturn(Optional.empty());
        when(enrollmentRepository.findActiveEnrollmentBySubject(studentId, 1, subject.getId()))
                .thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> enrollmentService.enroll(userId, sectionId))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("MATH101-01")
                .hasMessageContaining("cùng một môn");

        verify(enrollmentRepository, never()).save(any(Enrollment.class));
    }

    @Test
    @DisplayName("TC-05.1: Admin assign thất bại khi lớp đầy và không dùng forceOverride")
    void adminAssign_fails_whenCapacityFullAndNoOverride() {
        Long studentId = 1L;
        Long sectionId = 200L;

        Subject subject = new Subject();
        subject.setId(3);
        subject.setSubjectCode("PHY101");

        Student student = createStudent(studentId, 10L);
        CourseSection section = createSection(sectionId, subject, 40, 40);

        when(studentRepository.findById(studentId)).thenReturn(Optional.of(student));
        when(courseSectionRepository.findByIdForEnrollment(sectionId)).thenReturn(Optional.of(section));
        when(enrollmentRepository.findByStudentIdAndSectionId(studentId, sectionId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> enrollmentService.adminAssign(studentId, sectionId, false, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Học phần đã đầy");

        verify(enrollmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-05.2: Admin assign thất bại khi forceOverride = true nhưng thiếu lý do")
    void adminAssign_fails_whenOverrideWithoutReason() {
        Long studentId = 1L;
        Long sectionId = 200L;

        Subject subject = new Subject();
        subject.setId(3);
        subject.setSubjectCode("PHY101");

        Student student = createStudent(studentId, 10L);
        CourseSection section = createSection(sectionId, subject, 40, 40);

        when(studentRepository.findById(studentId)).thenReturn(Optional.of(student));
        when(courseSectionRepository.findByIdForEnrollment(sectionId)).thenReturn(Optional.of(section));
        when(enrollmentRepository.findByStudentIdAndSectionId(studentId, sectionId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> enrollmentService.adminAssign(studentId, sectionId, true, "   "))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Phải nhập lý do khi cưỡng chế vượt sĩ số");

        verify(enrollmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-05.3: Admin assign thành công khi forceOverride = true và có lý do chính đáng")
    void adminAssign_success_whenOverrideWithValidReason() {
        Long studentId = 1L;
        Long sectionId = 200L;

        Subject subject = new Subject();
        subject.setId(3);
        subject.setSubjectCode("PHY101");

        Student student = createStudent(studentId, 10L);
        CourseSection section = createSection(sectionId, subject, 40, 40);

        when(studentRepository.findById(studentId)).thenReturn(Optional.of(student));
        when(courseSectionRepository.findByIdForEnrollment(sectionId)).thenReturn(Optional.of(section));
        when(enrollmentRepository.findByStudentIdAndSectionId(studentId, sectionId)).thenReturn(Optional.empty());
        when(gradeRepository.findFinalizedByStudentAndSubject(studentId, 3)).thenReturn(Collections.emptyList());
        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(i -> i.getArgument(0));

        Enrollment result = enrollmentService.adminAssign(studentId, sectionId, true, "Sinh viên năm cuối cứu xét tốt nghiệp");

        assertThat(result).isNotNull();
        assertThat(result.getStudent()).isEqualTo(student);
        assertThat(result.getSection()).isEqualTo(section);
        assertThat(result.getEnrollmentType()).isEqualTo(Enrollment.EnrollmentType.FIRST_TIME);
        verify(enrollmentRepository).save(any(Enrollment.class));
    }

    @Test
    void enroll_RegistrationClosed_Throws() {
        Long userId = 10L;
        Long studentId = 1L;
        Long sectionId = 100L;

        Subject subject = new Subject();
        subject.setId(1);
        subject.setCredits(3);

        Student student = createStudent(studentId, userId);
        CourseSection section = createSection(sectionId, subject, 40, 10);
        section.getSemester().setRegistrationStart(LocalDate.now().plusDays(2));

        CurriculumProgram program = new CurriculumProgram();
        program.setId(1L);

        when(studentRepository.findByUserId(userId)).thenReturn(Optional.of(student));
        when(courseSectionRepository.findByIdForEnrollment(sectionId)).thenReturn(Optional.of(section));
        when(curriculumProgramRepository.findActiveByMajorAndCohort(1, 1)).thenReturn(Optional.of(program));
        when(curriculumBlockSubjectRepository.existsByProgramIdAndSubjectId(1L, 1)).thenReturn(true);

        assertThrows(BadRequestException.class, () -> enrollmentService.enroll(userId, sectionId));
    }

    @Test
    void cancelEnrollment_Success() {
        Long userId = 10L;
        Long studentId = 1L;
        Long enrollmentId = 50L;

        Student student = createStudent(studentId, userId);
        CourseSection section = createSection(100L, new Subject(), 40, 10);

        Enrollment enrollment = new Enrollment();
        enrollment.setId(enrollmentId);
        enrollment.setStudent(student);
        enrollment.setSection(section);
        enrollment.setStatus(Enrollment.EnrollmentStatus.ENROLLED);

        when(studentRepository.findByUserId(userId)).thenReturn(Optional.of(student));
        when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
        when(gradeRepository.findByEnrollmentId(enrollmentId)).thenReturn(Optional.empty());
        when(courseSectionRepository.findByIdForEnrollment(100L)).thenReturn(Optional.of(section));

        enrollmentService.cancelEnrollment(userId, enrollmentId);
        verify(enrollmentRepository).save(enrollment);
        assertEquals(Enrollment.EnrollmentStatus.CANCELLED, enrollment.getStatus());
    }

    @Test
    void adminBatchAssignClass_Success() {
        CourseSection section = createSection(100L, new Subject(), 40, 10);
        Student student = createStudent(1L, 10L);

        when(courseSectionRepository.findByIdForEnrollment(100L)).thenReturn(Optional.of(section));
        when(studentRepository.findByClassEntityId(1)).thenReturn(List.of(student));
        when(enrollmentRepository.findByStudentIdAndSectionId(1L, 100L)).thenReturn(Optional.empty());
        when(enrollmentRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        List<Enrollment> results = enrollmentService.adminBatchAssignClass(1, 100L);
        assertEquals(1, results.size());
    }
}
