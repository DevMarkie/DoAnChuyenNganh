package com.sms.service;

import com.sms.dto.response.TranscriptResponse;
import com.sms.entity.ClassEntity;
import com.sms.entity.Cohort;
import com.sms.entity.CourseSection;
import com.sms.entity.Department;
import com.sms.entity.Enrollment;
import com.sms.entity.Grade;
import com.sms.entity.Lecturer;
import com.sms.entity.Semester;
import com.sms.entity.Student;
import com.sms.entity.Subject;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.GradeRepository;
import com.sms.repository.LecturerRepository;
import com.sms.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TranscriptServiceTest {

    @Mock
    private StudentRepository studentRepository;
    @Mock
    private GradeRepository gradeRepository;
    @Mock
    private LecturerRepository lecturerRepository;
    @Mock
    private TuitionService tuitionService;

    @InjectMocks
    private TranscriptService transcriptService;

    private Student student;
    private Grade grade;
    private Semester semester;
    private Subject subject;

    @BeforeEach
    void setUp() {
        Department dept = new Department();
        dept.setId(1);
        dept.setCode("CNTT");
        dept.setName("Khoa Công nghệ Thông tin & Máy tính");

        Cohort cohort = new Cohort();
        cohort.setId(1);
        cohort.setCode("K22");
        cohort.setName("Khóa 2022");
        cohort.setAdmissionYear(2022);
        cohort.setGraduationYear(2026);

        ClassEntity cls = new ClassEntity();
        cls.setName("SE01");
        cls.setDepartment(dept);
        cls.setCohort(cohort);
        cls.setAcademicYear("2022-2026");

        student = new Student();
        student.setId(1L);
        student.setStudentCode("SV01");
        student.setFullName("Nguyen Van A");
        student.setClassEntity(cls);

        semester = new Semester();
        semester.setId(1);
        semester.setSemesterNumber(1);
        semester.setSemesterName("Ky 1");
        semester.setAcademicYear("2023-2024");

        subject = new Subject();
        subject.setSubjectCode("CS101");
        subject.setSubjectName("CS");
        subject.setCredits(3);

        CourseSection section = new CourseSection();
        section.setSemester(semester);
        section.setSubject(subject);

        Enrollment enrollment = new Enrollment();
        enrollment.setId(1L);
        enrollment.setSection(section);
        enrollment.setStudent(student);

        grade = new Grade();
        grade.setEnrollment(enrollment);
        grade.setGpaPoint(BigDecimal.valueOf(4.0));
        grade.setLetterGrade("A");
        grade.setIsFinalized(true);
    }

    @Test
    void classifyAcademicStanding() {
        assertEquals("Xuất sắc", TranscriptService.classifyAcademicStanding(BigDecimal.valueOf(3.6)));
        assertEquals("Giỏi", TranscriptService.classifyAcademicStanding(BigDecimal.valueOf(3.2)));
        assertEquals("Khá", TranscriptService.classifyAcademicStanding(BigDecimal.valueOf(2.5)));
        assertEquals("Trung bình", TranscriptService.classifyAcademicStanding(BigDecimal.valueOf(2.0)));
        assertEquals("Yếu", TranscriptService.classifyAcademicStanding(BigDecimal.valueOf(1.0)));
        assertEquals("Kém", TranscriptService.classifyAcademicStanding(BigDecimal.valueOf(0.0)));
        assertEquals("Chưa xếp loại", TranscriptService.classifyAcademicStanding(null));
    }

    @Test
    void getTranscript_Success() {
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        when(gradeRepository.findAllByStudentId(1L)).thenReturn(List.of(grade));

        TranscriptResponse response = transcriptService.getTranscript(1L);

        assertNotNull(response);
        assertEquals("SV01", response.getStudentCode());
        assertEquals("Nguyen Van A", response.getStudentName());
        assertEquals("SE01", response.getClassName());
        assertEquals(3, response.getTotalCredits());
        assertEquals(1, response.getCompletedCourses());
        assertEquals(0, response.getWarningLevel());
        assertEquals(BigDecimal.valueOf(4.0).setScale(2), response.getCumulativeGpa());
        assertEquals("Xuất sắc", response.getAcademicStanding());

        assertEquals(1, response.getSemesters().size());
        assertEquals(BigDecimal.valueOf(4.0).setScale(2), response.getSemesters().get(0).getSemesterGpa());
        assertEquals(3, response.getSemesters().get(0).getSemesterCredits());
        assertFalse(response.getSemesters().get(0).isSemesterWarning());

        // Check advisor contact is built
        assertNotNull(response.getAdvisorContact());
        assertNotNull(response.getAdvisorContact().getAdvisorName());
        assertNotNull(response.getAdvisorContact().getDepartmentName());
    }

    @Test
    void getTranscript_StudentNotFound() {
        when(studentRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> transcriptService.getTranscript(99L));
    }

    private static Grade makeGrade(String code, int credits, double gpa, int semId, int semNumber) {
        Subject s = new Subject();
        s.setSubjectCode(code);
        s.setSubjectName(code);
        s.setCredits(credits);

        Semester sem = new Semester();
        sem.setId(semId);
        sem.setSemesterNumber(semNumber);
        sem.setSemesterName("HK" + semId);
        sem.setAcademicYear("2025-2026");

        CourseSection sec = new CourseSection();
        sec.setSubject(s);
        sec.setSemester(sem);

        Enrollment enr = new Enrollment();
        enr.setSection(sec);

        Grade g = new Grade();
        g.setEnrollment(enr);
        g.setGpaPoint(BigDecimal.valueOf(gpa));
        g.setLetterGrade(gpa > 0 ? "B" : "F");
        g.setIsFinalized(true);
        return g;
    }

    private static Grade makeGrade(String code, int credits, double gpa, int semId) {
        return makeGrade(code, credits, gpa, semId, 1);
    }

    @Test
    void retake_countsBestAttempt() {
        when(studentRepository.findById(10L)).thenReturn(Optional.of(student));
        when(gradeRepository.findAllByStudentId(10L)).thenReturn(List.of(
                makeGrade("CS101", 3, 0.0, 1),
                makeGrade("CS101", 3, 4.0, 2)));

        TranscriptResponse t = transcriptService.getTranscript(10L);
        assertEquals(0, BigDecimal.valueOf(4.00).compareTo(t.getCumulativeGpa()));
        assertEquals(3, t.getTotalCredits());
        assertEquals(1, t.getCompletedCourses());
        assertEquals(0, t.getDebtCredits());
    }

    @Test
    void improvement_lowerSecondAttempt_keepsBestGradeForCpa() {
        when(studentRepository.findById(20L)).thenReturn(Optional.of(student));
        when(gradeRepository.findAllByStudentId(20L)).thenReturn(List.of(
                makeGrade("CS104", 3, 3.0, 1),
                makeGrade("CS104", 3, 2.0, 2)));

        TranscriptResponse t = transcriptService.getTranscript(20L);
        assertEquals(0, BigDecimal.valueOf(3.00).compareTo(t.getCumulativeGpa()));
        assertEquals(3, t.getTotalCredits());
    }

    @Test
    void unfinalizedDraftGrade_excludedFromCpaAndCredits() {
        when(studentRepository.findById(40L)).thenReturn(Optional.of(student));
        Grade draftGrade = makeGrade("CS105", 3, 4.0, 1);
        draftGrade.setIsFinalized(false);
        when(gradeRepository.findAllByStudentId(40L)).thenReturn(List.of(draftGrade));

        TranscriptResponse t = transcriptService.getTranscript(40L);
        assertEquals(0, t.getTotalCredits());
        assertEquals(0, t.getCompletedCourses());
        assertEquals(0, BigDecimal.ZERO.compareTo(t.getCumulativeGpa()));
    }

    @Test
    void failingGrade_excludedFromEarnedCredits_andCpa_countedInDebtCredits() {
        when(studentRepository.findById(30L)).thenReturn(Optional.of(student));
        when(gradeRepository.findAllByStudentId(30L)).thenReturn(List.of(
                makeGrade("CS102", 3, 0.0, 1),
                makeGrade("CS103", 2, 3.0, 1)));

        TranscriptResponse t = transcriptService.getTranscript(30L);
        assertEquals(2, t.getTotalCredits());
        assertEquals(1, t.getCompletedCourses());
        assertEquals(3, t.getDebtCredits());
        // Điểm tích lũy CPA chỉ tính trên các môn đạt theo chuẩn tín chỉ: 3.00
        assertEquals(0, BigDecimal.valueOf(3.00).compareTo(t.getCumulativeGpa()));
    }

    @Test
    void academicWarning_level1_dueToFirstSemesterLowGpa() {
        when(studentRepository.findById(50L)).thenReturn(Optional.of(student));
        // Kỳ 1: GPA < 1.0 (ví dụ 0.0 do F)
        when(gradeRepository.findAllByStudentId(50L)).thenReturn(List.of(
                makeGrade("CS101", 3, 0.0, 1, 1)));

        TranscriptResponse t = transcriptService.getTranscript(50L);
        assertEquals(1, t.getWarningLevel());
        assertTrue(t.getWarningNotice().contains("Mức 1"));
    }

    @Test
    void academicWarning_level1_dueToSecondSemesterLowGpa() {
        when(studentRepository.findById(51L)).thenReturn(Optional.of(student));
        // Kỳ 1 đạt 2.0 (ổn), kỳ 2 đạt 1.0 (< 1.2) -> Mức 1
        when(gradeRepository.findAllByStudentId(51L)).thenReturn(List.of(
                makeGrade("CS101", 3, 2.0, 1, 1),
                makeGrade("CS102", 3, 1.0, 2, 2)));

        TranscriptResponse t = transcriptService.getTranscript(51L);
        assertEquals(1, t.getWarningLevel());
        assertTrue(t.getWarningNotice().contains("Mức 1"));
    }

    @Test
    void academicWarning_level1_dueToDebtCreditsOver24() {
        when(studentRepository.findById(52L)).thenReturn(Optional.of(student));
        // Sinh viên nợ 9 môn x 3 TC = 27 tín chỉ nợ
        List<Grade> failGrades = List.of(
                makeGrade("M1", 3, 0.0, 1, 1),
                makeGrade("M2", 3, 0.0, 1, 1),
                makeGrade("M3", 3, 0.0, 1, 1),
                makeGrade("M4", 3, 0.0, 1, 1),
                makeGrade("M5", 3, 0.0, 1, 1),
                makeGrade("M6", 3, 0.0, 1, 1),
                makeGrade("M7", 3, 0.0, 1, 1),
                makeGrade("M8", 3, 0.0, 1, 1),
                makeGrade("M9", 3, 0.0, 1, 1)
        );
        when(gradeRepository.findAllByStudentId(52L)).thenReturn(failGrades);

        TranscriptResponse t = transcriptService.getTranscript(52L);
        assertEquals(27, t.getDebtCredits());
        assertEquals(1, t.getWarningLevel());
        assertTrue(t.getWarningNotice().contains("Nợ quá 24 tín chỉ"));
    }

    @Test
    void academicWarning_level2_dueToTwoConsecutiveMainSemesters() {
        when(studentRepository.findById(53L)).thenReturn(Optional.of(student));
        // Kỳ 1: GPA 0.0 (< 1.0), Kỳ 2: GPA 1.0 (< 1.2) -> 2 kỳ chính liên tiếp -> Mức 2
        when(gradeRepository.findAllByStudentId(53L)).thenReturn(List.of(
                makeGrade("CS101", 3, 0.0, 1, 1),
                makeGrade("CS102", 3, 1.0, 2, 2)));

        TranscriptResponse t = transcriptService.getTranscript(53L);
        assertEquals(2, t.getWarningLevel());
        assertTrue(t.getWarningNotice().contains("Mức 2"));
    }

    @Test
    void academicWarning_level3_expelled_dueToThreeConsecutiveSemesters() {
        when(studentRepository.findById(54L)).thenReturn(Optional.of(student));
        // 3 kỳ chính liên tiếp không tiến bộ -> Buộc thôi học (Mức 3)
        when(gradeRepository.findAllByStudentId(54L)).thenReturn(List.of(
                makeGrade("CS101", 3, 0.0, 1, 1),
                makeGrade("CS102", 3, 1.0, 2, 2),
                makeGrade("CS103", 3, 1.0, 3, 1)));

        TranscriptResponse t = transcriptService.getTranscript(54L);
        assertEquals(3, t.getWarningLevel());
        assertTrue(t.getWarningNotice().contains("Buộc thôi học"));
    }

    @Test
    void transcript_lockedDueToTuitionOverdue() {
        when(studentRepository.findById(60L)).thenReturn(Optional.of(student));
        when(gradeRepository.findAllByStudentId(60L)).thenReturn(List.of(grade));
        when(tuitionService.isTuitionOverdue(60L)).thenReturn(true);

        TranscriptResponse response = transcriptService.getTranscript(60L);
        assertTrue(response.getIsLockedDueToTuition());
        assertNotNull(response.getLockReason());
        assertNull(response.getCumulativeGpa());
        assertEquals("Tạm khóa do nợ học phí", response.getAcademicStanding());
        // Môn học bị che điểm cuối kỳ và tổng kết
        assertEquals("LOCKED_DEBT", response.getSemesters().get(0).getCourses().get(0).getStatus());
        assertNull(response.getSemesters().get(0).getCourses().get(0).getFinalScore());
    }

    @Test
    void getTranscripts_groupsGradesPerStudent() {
        Student s2 = new Student();
        s2.setId(2L);
        s2.setStudentCode("SV02");
        s2.setFullName("Tran Thi B");

        Grade g2 = makeGrade("CS201", 3, 0.0, 1);
        g2.getEnrollment().setStudent(s2);

        when(gradeRepository.findFinalizedByStudentIdIn(List.of(1L, 2L)))
                .thenReturn(List.of(grade, g2));

        List<TranscriptResponse> result = transcriptService.getTranscripts(List.of(student, s2));

        assertEquals(2, result.size());
        assertEquals("SV01", result.get(0).getStudentCode());
        assertEquals(BigDecimal.valueOf(4.0).setScale(2), result.get(0).getCumulativeGpa());
        assertEquals("SV02", result.get(1).getStudentCode());
        assertEquals(0, BigDecimal.valueOf(0.00).compareTo(result.get(1).getCumulativeGpa()));
    }
}
