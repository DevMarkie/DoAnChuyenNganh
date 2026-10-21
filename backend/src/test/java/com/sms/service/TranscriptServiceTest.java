package com.sms.service;

import com.sms.dto.response.TranscriptResponse;
import com.sms.entity.ClassEntity;
import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.entity.Grade;
import com.sms.entity.Semester;
import com.sms.entity.Student;
import com.sms.entity.Subject;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.GradeRepository;
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

    @InjectMocks
    private TranscriptService transcriptService;

    private Student student;
    private Grade grade;
    private Semester semester;
    private Subject subject;

    @BeforeEach
    void setUp() {
        ClassEntity cls = new ClassEntity();
        cls.setName("SE01");

        student = new Student();
        student.setId(1L);
        student.setStudentCode("SV01");
        student.setFullName("Nguyen Van A");
        student.setClassEntity(cls);

        semester = new Semester();
        semester.setId(1);
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
        when(gradeRepository.findFinalizedByStudentId(1L)).thenReturn(List.of(grade));

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
    }

    @Test
    void getTranscript_StudentNotFound() {
        when(studentRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> transcriptService.getTranscript(99L));
    }

    private static Grade makeGrade(String code, int credits, double gpa, int semId) {
        Subject s = new Subject();
        s.setSubjectCode(code);
        s.setSubjectName(code);
        s.setCredits(credits);

        Semester sem = new Semester();
        sem.setId(semId);
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
        g.setLetterGrade(gpa > 0 ? "P" : "F");
        return g;
    }

    @Test
    void retake_countsBestAttempt() {
        when(studentRepository.findById(10L)).thenReturn(Optional.of(student));
        when(gradeRepository.findFinalizedByStudentId(10L)).thenReturn(List.of(
                makeGrade("CS101", 3, 0.0, 1),
                makeGrade("CS101", 3, 4.0, 2)));

        TranscriptResponse t = transcriptService.getTranscript(10L);
        assertEquals(0, BigDecimal.valueOf(4.00).compareTo(t.getCumulativeGpa()));
        assertEquals(3, t.getTotalCredits());
        assertEquals(1, t.getCompletedCourses());
    }

    @Test
    void improvement_lowerSecondAttempt_keepsBestGradeForCpa() {
        when(studentRepository.findById(20L)).thenReturn(Optional.of(student));
        when(gradeRepository.findFinalizedByStudentId(20L)).thenReturn(List.of(
                makeGrade("CS104", 3, 3.0, 1),
                makeGrade("CS104", 3, 2.0, 2)));

        TranscriptResponse t = transcriptService.getTranscript(20L);
        assertEquals(0, BigDecimal.valueOf(3.00).compareTo(t.getCumulativeGpa()));
        assertEquals(3, t.getTotalCredits());
    }

    @Test
    void failingGrade_excludedFromEarnedCredits_butCountedInCpa() {
        when(studentRepository.findById(30L)).thenReturn(Optional.of(student));
        when(gradeRepository.findFinalizedByStudentId(30L)).thenReturn(List.of(
                makeGrade("CS102", 3, 0.0, 1),
                makeGrade("CS103", 2, 3.0, 1)));

        TranscriptResponse t = transcriptService.getTranscript(30L);
        assertEquals(2, t.getTotalCredits());
        assertEquals(1, t.getCompletedCourses());
        assertEquals(0, BigDecimal.valueOf(1.20).compareTo(t.getCumulativeGpa()));
    }

    @Test
    void getTranscripts_groupsGradesPerStudent() {
        Student s2 = new Student();
        s2.setId(2L);
        s2.setStudentCode("SV02");
        s2.setFullName("Tran Thi B");

        Grade g2 = makeGrade("CS201", 3, 0.0, 1); // F
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
