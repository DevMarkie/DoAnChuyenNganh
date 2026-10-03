package com.sms;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.sms.dto.response.TranscriptResponse;
import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.entity.Grade;
import com.sms.entity.Semester;
import com.sms.entity.Student;
import com.sms.entity.Subject;
import com.sms.repository.GradeRepository;
import com.sms.repository.StudentRepository;
import com.sms.service.TranscriptService;

/**
 * Unit tests locking in the two transcript bugs fixed in the logic audit:
 *  - retakes must not be double-counted (best attempt per subject wins);
 *  - a failing grade (F / gpaPoint 0.0) must not count as an earned credit,
 *    yet still counts in the CPA denominator.
 */
@ExtendWith(MockitoExtension.class)
class TranscriptServiceTest {

    @Mock
    private StudentRepository studentRepository;
    @Mock
    private GradeRepository gradeRepository;
    @InjectMocks
    private TranscriptService transcriptService;

    private static Grade grade(String subjectCode, int credits, double gpa, int semId) {
        Subject subject = new Subject();
        subject.setSubjectCode(subjectCode);
        subject.setSubjectName(subjectCode + " Name");
        subject.setCredits(credits);

        Semester semester = new Semester();
        semester.setId(semId);
        semester.setSemesterName("HK" + semId);
        semester.setAcademicYear("2025-2026");

        CourseSection section = new CourseSection();
        section.setSubject(subject);
        section.setSemester(semester);

        Enrollment enrollment = new Enrollment();
        enrollment.setSection(section);

        Grade g = new Grade();
        g.setEnrollment(enrollment);
        g.setGpaPoint(BigDecimal.valueOf(gpa));
        g.setLetterGrade(gpa > 0 ? "P" : "F");
        return g;
    }

    private void stubStudent(long id, List<Grade> grades) {
        Student student = new Student();
        student.setId(id);
        student.setStudentCode("SV" + id);
        student.setFullName("Student " + id);
        when(studentRepository.findById(id)).thenReturn(Optional.of(student));
        when(gradeRepository.findFinalizedByStudentId(id)).thenReturn(grades);
    }

    @Test
    void retake_countsBestAttempt() {
        // CS101 (3 credits): F in semester 1, then A (4.0) retaken in semester 2.
        stubStudent(1L, List.of(
                grade("CS101", 3, 0.0, 1),
                grade("CS101", 3, 4.0, 2)));

        TranscriptResponse t = transcriptService.getTranscript(1L);

        assertThat(t.getCumulativeGpa()).isEqualByComparingTo("4.00");
        assertThat(t.getTotalCredits()).isEqualTo(3);
        assertThat(t.getCompletedCourses()).isEqualTo(1);
    }

    @Test
    void improvement_lowerSecondAttempt_keepsBestGradeForCpa() {
        // CS104 (3 credits): B (3.0) first, then C (2.0) on improvement.
        stubStudent(3L, List.of(
                grade("CS104", 3, 3.0, 1),
                grade("CS104", 3, 2.0, 2)));

        TranscriptResponse t = transcriptService.getTranscript(3L);

        assertThat(t.getCumulativeGpa()).isEqualByComparingTo("3.00");
        assertThat(t.getTotalCredits()).isEqualTo(3);
    }

    @Test
    void failingGrade_excludedFromEarnedCredits_butCountedInCpa() {
        // CS102 (3cr) failed with F, CS103 (2cr) passed with B (3.0), no retakes.
        stubStudent(2L, List.of(
                grade("CS102", 3, 0.0, 1),
                grade("CS103", 2, 3.0, 1)));

        TranscriptResponse t = transcriptService.getTranscript(2L);

        // Earned credits / completed courses exclude the F.
        assertThat(t.getTotalCredits()).isEqualTo(2);
        assertThat(t.getCompletedCourses()).isEqualTo(1);
        // CPA denominator still includes the F: (0*3 + 3*2) / (3+2) = 1.20
        assertThat(t.getCumulativeGpa()).isEqualByComparingTo("1.20");
    }

    @Test
    void classifiesAcademicStandingAtConfiguredBoundaries() {
        assertThat(TranscriptService.classifyAcademicStanding(new BigDecimal("3.60"))).isEqualTo("Xuất sắc");
        assertThat(TranscriptService.classifyAcademicStanding(new BigDecimal("3.20"))).isEqualTo("Giỏi");
        assertThat(TranscriptService.classifyAcademicStanding(new BigDecimal("2.50"))).isEqualTo("Khá");
        assertThat(TranscriptService.classifyAcademicStanding(new BigDecimal("2.00"))).isEqualTo("Trung bình");
        assertThat(TranscriptService.classifyAcademicStanding(new BigDecimal("1.00"))).isEqualTo("Yếu");
        assertThat(TranscriptService.classifyAcademicStanding(new BigDecimal("0.99"))).isEqualTo("Kém");
    }

    @Test
    void marksLowSemesterAndAcademicWarning() {
        stubStudent(4L, List.of(
                grade("CS101", 3, 0.0, 1),
                grade("CS102", 3, 1.5, 2)));

        TranscriptResponse t = transcriptService.getTranscript(4L);

        assertThat(t.getAcademicStanding()).isEqualTo("Kém");
        assertThat(t.getWarningLevel()).isEqualTo(1);
        assertThat(t.getWarningNotice()).contains("CPA tích lũy < 2.0");
        assertThat(t.getSemesters().get(0).isSemesterWarning()).isTrue();
        assertThat(t.getSemesters().get(1).isSemesterWarning()).isFalse();
        assertThat(t.getSemesters().get(1).getSemesterClassification()).isEqualTo("Yếu");
    }
}
