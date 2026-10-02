package com.sms;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.entity.Grade;
import com.sms.entity.Semester;
import com.sms.entity.Student;
import com.sms.entity.Subject;
import com.sms.exception.BadRequestException;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.EnrollmentRepository;
import com.sms.repository.GradeRepository;
import com.sms.repository.LecturerRepository;
import com.sms.repository.ScheduleRepository;
import com.sms.repository.StudentRepository;
import com.sms.service.EnrollmentService;

@ExtendWith(MockitoExtension.class)
class EnrollmentServiceTest {

    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private CourseSectionRepository courseSectionRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private ScheduleRepository scheduleRepository;
    @Mock private GradeRepository gradeRepository;
    @Mock private LecturerRepository lecturerRepository;

    @InjectMocks private EnrollmentService enrollmentService;

    private static Student createStudent(Long id, Long userId) {
        Student s = new Student();
        s.setId(id);
        s.setStudentCode("SV" + id);
        s.setFullName("Sinh viên " + id);
        return s;
    }

    private static CourseSection createSection(Long sectionId, Subject subject, int maxStudents, int currentStudents) {
        Semester semester = new Semester();
        semester.setId(1);
        semester.setStatus(Semester.SemesterStatus.ACTIVE);
        semester.setIsCurrent(true);
        // Ensure semester is open
        semester.setRegistrationStart(java.time.LocalDate.now().minusDays(1));
        semester.setRegistrationEnd(java.time.LocalDate.now().plusDays(5));

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
        when(gradeRepository.existsPassedFinalizedByStudentAndSubject(studentId, prereq.getId())).thenReturn(true);
        when(enrollmentRepository.findByStudentIdAndSectionId(studentId, sectionId)).thenReturn(Optional.empty());
        when(enrollmentRepository.countEnrolledCredits(studentId, 1)).thenReturn(10);
        when(scheduleRepository.findSchedulesForStudentAndSemester(studentId, null, 1L)).thenReturn(Collections.emptyList());
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
        failingGrade.setFinalScore(new java.math.BigDecimal("2.5")); // Trượt điểm liệt

        when(studentRepository.findByUserId(userId)).thenReturn(Optional.of(student));
        when(courseSectionRepository.findByIdForEnrollment(sectionId)).thenReturn(Optional.of(section));
        when(enrollmentRepository.findByStudentIdAndSectionId(studentId, sectionId)).thenReturn(Optional.empty());
        when(enrollmentRepository.countEnrolledCredits(studentId, 1)).thenReturn(0);
        when(scheduleRepository.findSchedulesForStudentAndSemester(studentId, null, 1L)).thenReturn(Collections.emptyList());
        when(scheduleRepository.findBySectionId(sectionId)).thenReturn(Collections.emptyList());
        when(gradeRepository.findFinalizedByStudentAndSubject(studentId, targetSubject.getId())).thenReturn(List.of(failingGrade));
        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(i -> i.getArgument(0));

        Enrollment result = enrollmentService.enroll(userId, sectionId);

        assertThat(result.getEnrollmentType()).isEqualTo(Enrollment.EnrollmentType.RETAKE);
    }

    @Test
    @DisplayName("TC-02.2: Tự động phân loại IMPROVE khi môn học đã từng đạt")
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
        passedGrade.setTotalScore(new java.math.BigDecimal("5.5"));
        passedGrade.setLetterGrade("C");
        passedGrade.setFinalScore(new java.math.BigDecimal("5.0"));

        when(studentRepository.findByUserId(userId)).thenReturn(Optional.of(student));
        when(courseSectionRepository.findByIdForEnrollment(sectionId)).thenReturn(Optional.of(section));
        when(enrollmentRepository.findByStudentIdAndSectionId(studentId, sectionId)).thenReturn(Optional.empty());
        when(enrollmentRepository.countEnrolledCredits(studentId, 1)).thenReturn(0);
        when(scheduleRepository.findSchedulesForStudentAndSemester(studentId, null, 1L)).thenReturn(Collections.emptyList());
        when(scheduleRepository.findBySectionId(sectionId)).thenReturn(Collections.emptyList());
        when(gradeRepository.findFinalizedByStudentAndSubject(studentId, targetSubject.getId())).thenReturn(List.of(passedGrade));
        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(i -> i.getArgument(0));

        Enrollment result = enrollmentService.enroll(userId, sectionId);

        assertThat(result.getEnrollmentType()).isEqualTo(Enrollment.EnrollmentType.IMPROVE);
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
        CourseSection section = createSection(sectionId, subject, 40, 40); // 40/40

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
}
