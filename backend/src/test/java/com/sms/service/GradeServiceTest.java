package com.sms.service;

import com.sms.dto.request.GradeRequest;
import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.entity.Grade;
import com.sms.entity.Lecturer;
import com.sms.entity.Student;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.EnrollmentRepository;
import com.sms.repository.GradeRepository;
import com.sms.repository.LecturerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GradeServiceTest {

    @Mock
    private GradeRepository gradeRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private CourseSectionRepository courseSectionRepository;
    @Mock
    private LecturerRepository lecturerRepository;

    @InjectMocks
    private GradeService gradeService;

    private Enrollment enrollment;
    private CourseSection courseSection;
    private Lecturer lecturer;
    private Student student;
    private Grade grade;
    private GradeRequest request;

    @BeforeEach
    void setUp() {
        lecturer = new Lecturer();
        lecturer.setId(1L);

        courseSection = new CourseSection();
        courseSection.setId(1L);
        courseSection.setLecturer(lecturer);
        courseSection.setSectionCode("SE01");

        student = new Student();
        student.setId(1L);
        student.setStudentCode("SV01");

        enrollment = new Enrollment();
        enrollment.setId(1L);
        enrollment.setSection(courseSection);
        enrollment.setStudent(student);

        grade = new Grade();
        grade.setId(1L);
        grade.setEnrollment(enrollment);
        grade.setCc1Score(BigDecimal.valueOf(10));
        grade.setCc2Score(BigDecimal.valueOf(9));
        grade.setMidtermScore(BigDecimal.valueOf(8));
        grade.setFinalScore(BigDecimal.valueOf(7));
        grade.setSpecialGrade(Grade.SpecialGrade.NONE);
        grade.calculateTotalScore();

        request = new GradeRequest();
        request.setEnrollmentId(1L);
        request.setCc1Score(BigDecimal.valueOf(8));
        request.setCc2Score(BigDecimal.valueOf(8));
        request.setMidtermScore(BigDecimal.valueOf(8));
        request.setFinalScore(BigDecimal.valueOf(8));
    }

    @Test
    void findBySection_Success() {
        when(enrollmentRepository.findActiveBySectionId(1L)).thenReturn(List.of(enrollment));
        when(gradeRepository.findByEnrollmentIdIn(List.of(1L))).thenReturn(List.of(grade));

        List<Grade> result = gradeService.findBySection(1L);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
    }

    @Test
    void assertCanViewSection_Admin_Success() {
        when(lecturerRepository.findByUserId(99L)).thenReturn(Optional.empty());
        assertDoesNotThrow(() -> gradeService.assertCanViewSection(99L, 1L));
    }

    @Test
    void assertCanViewSection_Lecturer_Success() {
        when(lecturerRepository.findByUserId(1L)).thenReturn(Optional.of(lecturer));
        when(courseSectionRepository.findById(1L)).thenReturn(Optional.of(courseSection));
        assertDoesNotThrow(() -> gradeService.assertCanViewSection(1L, 1L));
    }

    @Test
    void assertCanViewSection_Lecturer_Forbidden() {
        Lecturer otherLecturer = new Lecturer();
        otherLecturer.setId(2L);
        when(lecturerRepository.findByUserId(2L)).thenReturn(Optional.of(otherLecturer));
        when(courseSectionRepository.findById(1L)).thenReturn(Optional.of(courseSection));

        assertThrows(BadRequestException.class, () -> gradeService.assertCanViewSection(2L, 1L));
    }

    @Test
    void saveGrade_Lecturer_Success() {
        when(enrollmentRepository.findById(1L)).thenReturn(Optional.of(enrollment));
        when(lecturerRepository.findByUserId(1L)).thenReturn(Optional.of(lecturer));
        when(gradeRepository.findByEnrollmentId(1L)).thenReturn(Optional.of(grade));
        when(gradeRepository.save(any(Grade.class))).thenReturn(grade);

        Grade saved = gradeService.saveGrade(1L, request);
        // request.cc1=8 ghi de diem cu (10) -> chung minh service da map request vao grade.
        assertEquals(0, BigDecimal.valueOf(8).compareTo(saved.getCc1Score()));
        verify(gradeRepository).save(any(Grade.class));
    }

    @Test
    void saveGrade_Finalize_Incomplete_Throws() {
        Grade incompleteGrade = new Grade();
        incompleteGrade.setEnrollment(enrollment);

        when(enrollmentRepository.findById(1L)).thenReturn(Optional.of(enrollment));
        when(lecturerRepository.findByUserId(1L)).thenReturn(Optional.of(lecturer));
        when(gradeRepository.findByEnrollmentId(1L)).thenReturn(Optional.of(incompleteGrade));

        request.setFinalize(true);
        request.setFinalScore(null); // Make it incomplete

        assertThrows(BadRequestException.class, () -> gradeService.saveGrade(1L, request));
    }

    @Test
    void saveGrade_Finalize_Success() {
        when(enrollmentRepository.findById(1L)).thenReturn(Optional.of(enrollment));
        when(lecturerRepository.findByUserId(1L)).thenReturn(Optional.of(lecturer));
        when(gradeRepository.findByEnrollmentId(1L)).thenReturn(Optional.of(grade));
        when(enrollmentRepository.findActiveBySectionId(1L)).thenReturn(List.of(enrollment));
        when(gradeRepository.save(any(Grade.class))).thenReturn(grade);

        request.setFinalize(true);
        Grade saved = gradeService.saveGrade(1L, request);
        
        assertTrue(saved.getIsFinalized());
        assertNotNull(saved.getFinalizedAt());
        verify(gradeRepository).save(any(Grade.class));
    }

    @Test
    void saveGrades_Bulk_Success() {
        when(lecturerRepository.findByUserId(1L)).thenReturn(Optional.of(lecturer));
        when(enrollmentRepository.findByIdInWithSection(anyList())).thenReturn(List.of(enrollment));
        when(gradeRepository.findByEnrollmentIdIn(anyList())).thenReturn(List.of(grade));

        gradeService.saveGrades(1L, List.of(request));
        assertEquals(0, BigDecimal.valueOf(8).compareTo(grade.getCc1Score()));
        verify(gradeRepository).saveAll(anyList());
    }

    @Test
    void saveImportedGrades_Success() {
        when(courseSectionRepository.findById(1L)).thenReturn(Optional.of(courseSection));
        when(enrollmentRepository.findByIdInWithSection(anyList())).thenReturn(List.of(enrollment));
        when(lecturerRepository.findByUserId(1L)).thenReturn(Optional.of(lecturer));
        when(gradeRepository.findByEnrollmentIdIn(anyList())).thenReturn(List.of(grade));

        gradeService.saveImportedGrades(1L, 1L, List.of(request));
        assertEquals(0, BigDecimal.valueOf(8).compareTo(grade.getCc1Score()));
        verify(gradeRepository).saveAll(anyList());
    }

    @Test
    void saveGrades_resolvesLecturerOnce_batchLoads_andSavesAllInOneCall() {
        long adminUserId = 500L;
        GradeRequest r1 = new GradeRequest();
        r1.setEnrollmentId(1L);
        r1.setCc1Score(BigDecimal.valueOf(9.0));
        r1.setCc2Score(BigDecimal.valueOf(9.0));
        r1.setMidtermScore(BigDecimal.valueOf(8.0));
        r1.setFinalScore(BigDecimal.valueOf(7.5));

        when(lecturerRepository.findByUserId(adminUserId)).thenReturn(Optional.empty());
        when(enrollmentRepository.findByIdInWithSection(anyList()))
                .thenReturn(List.of(enrollment));
        when(gradeRepository.findByEnrollmentIdIn(anyList())).thenReturn(List.of());
        when(gradeRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        gradeService.saveGrades(adminUserId, List.of(r1));

        verify(lecturerRepository, times(1)).findByUserId(adminUserId);
        verify(enrollmentRepository, times(1)).findByIdInWithSection(anyList());
        verify(gradeRepository, times(1)).findByEnrollmentIdIn(anyList());
        verify(gradeRepository, times(1)).saveAll(anyList());
    }

    @Test
    void calculateTotalScore_usesFiveFiveThirtySixtyWeights() {
        Grade g = new Grade();
        g.setCc1Score(BigDecimal.valueOf(8.0));
        g.setCc2Score(BigDecimal.valueOf(6.0));
        g.setMidtermScore(BigDecimal.valueOf(7.0));
        g.setFinalScore(BigDecimal.valueOf(9.0));

        g.calculateTotalScore();

        assertEquals(0, BigDecimal.valueOf(8.20).compareTo(g.getTotalScore()));
    }

    @Test
    void saveImportedGrades_rejectsEnrollmentFromAnotherSection() {
        CourseSection selectedSection = new CourseSection();
        selectedSection.setId(999L);
        when(courseSectionRepository.findById(999L)).thenReturn(Optional.of(selectedSection));
        when(enrollmentRepository.findByIdInWithSection(anyList()))
                .thenReturn(List.of(enrollment));

        assertThrows(BadRequestException.class, () -> 
                gradeService.saveImportedGrades(500L, 999L, List.of(request)));
    }

    @Test
    void lecturer_canEditFinalizedGrade_withinGraceWindow() {
        long lectUserId = 42L;
        courseSection.setLecturer(lecturer);
        Grade existing = new Grade();
        existing.setEnrollment(enrollment);
        existing.setIsFinalized(true);
        existing.setFinalizedAt(LocalDateTime.now().minusDays(2));

        when(lecturerRepository.findByUserId(lectUserId)).thenReturn(Optional.of(lecturer));
        when(enrollmentRepository.findById(1L)).thenReturn(Optional.of(enrollment));
        when(gradeRepository.findByEnrollmentId(1L)).thenReturn(Optional.of(existing));
        when(gradeRepository.save(any(Grade.class))).thenAnswer(i -> i.getArgument(0));

        Grade saved = gradeService.saveGrade(lectUserId, request);
        assertEquals(0, BigDecimal.valueOf(8.0).compareTo(saved.getMidtermScore()));
    }

    @Test
    void lecturer_cannotEditFinalizedGrade_afterGraceWindow() {
        long lectUserId = 42L;
        courseSection.setLecturer(lecturer);
        Grade existing = new Grade();
        existing.setEnrollment(enrollment);
        existing.setIsFinalized(true);
        existing.setFinalizedAt(LocalDateTime.now().minusDays(8));

        when(lecturerRepository.findByUserId(lectUserId)).thenReturn(Optional.of(lecturer));
        when(enrollmentRepository.findById(1L)).thenReturn(Optional.of(enrollment));
        when(gradeRepository.findByEnrollmentId(1L)).thenReturn(Optional.of(existing));

        assertThrows(BadRequestException.class, () -> gradeService.saveGrade(lectUserId, request));
    }

    @Test
    void specialGradeV_countsAsCompleteAndProducesFailingGrade() {
        long adminUserId = 500L;
        GradeRequest reqV = new GradeRequest();
        reqV.setEnrollmentId(1L);
        reqV.setSpecialGrade(Grade.SpecialGrade.V);
        reqV.setFinalize(true);

        when(lecturerRepository.findByUserId(adminUserId)).thenReturn(Optional.empty());
        when(enrollmentRepository.findById(1L)).thenReturn(Optional.of(enrollment));
        when(gradeRepository.findByEnrollmentId(1L)).thenReturn(Optional.empty());
        when(enrollmentRepository.findActiveBySectionId(courseSection.getId())).thenReturn(List.of(enrollment));
        when(gradeRepository.save(any(Grade.class))).thenAnswer(i -> i.getArgument(0));

        Grade saved = gradeService.saveGrade(adminUserId, reqV);
        assertEquals(Grade.SpecialGrade.V, saved.getSpecialGrade());
        assertEquals("F", saved.getLetterGrade());
        assertTrue(saved.getIsFinalized());
    }
}
