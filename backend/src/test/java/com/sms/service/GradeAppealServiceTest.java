package com.sms.service;

import com.sms.dto.request.GradeAppealRequest;
import com.sms.dto.request.GradeAppealReviewRequest;
import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.entity.Grade;
import com.sms.entity.GradeAppeal;
import com.sms.entity.Lecturer;
import com.sms.entity.Semester;
import com.sms.entity.Student;
import com.sms.entity.Subject;
import com.sms.entity.User;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.EnrollmentRepository;
import com.sms.repository.GradeAppealRepository;
import com.sms.repository.GradeRepository;
import com.sms.repository.LecturerRepository;
import com.sms.repository.StudentRepository;
import com.sms.repository.UserRepository;
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

    @InjectMocks
    private GradeAppealService appealService;

    private Student student;
    private Lecturer lecturer;
    private CourseSection section;
    private Enrollment enrollment;
    private Grade grade;
    private GradeAppeal appeal;
    private User reviewer;

    @BeforeEach
    void setUp() {
        student = new Student();
        student.setId(1L);

        lecturer = new Lecturer();
        lecturer.setId(1L);

        Subject subject = new Subject();
        subject.setId(1);

        Semester semester = new Semester();
        semester.setId(1);

        section = new CourseSection();
        section.setId(1L);
        section.setLecturer(lecturer);
        section.setSubject(subject);
        section.setSemester(semester);

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

        reviewer = new User();
        reviewer.setId(2L);
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
    void findAll_Lecturer_Success() {
        when(lecturerRepository.findByUserId(1L)).thenReturn(Optional.of(lecturer));
        when(appealRepository.findAllWithDetails()).thenReturn(List.of(appeal));

        List<GradeAppeal> result = appealService.findAll(1L, null, null, null);
        assertEquals(1, result.size());
    }

    @Test
    void create_Success() {
        GradeAppealRequest req = new GradeAppealRequest();
        req.setEnrollmentId(1L);
        req.setScoreComponent(GradeAppeal.ScoreComponent.FINAL);
        req.setReason("Test reason");

        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));
        when(enrollmentRepository.findById(1L)).thenReturn(Optional.of(enrollment));
        when(gradeRepository.findByEnrollmentId(1L)).thenReturn(Optional.of(grade));
        when(appealRepository.countByStudentIdAndEnrollmentSectionSubjectIdAndStatus(
                anyLong(), anyInt(), any())).thenReturn(0L);
        when(appealRepository.save(any())).thenReturn(appeal);

        GradeAppeal result = appealService.create(1L, req);
        assertNotNull(result);
    }

    @Test
    void create_Expired_Throws() {
        grade.setFinalizedAt(LocalDateTime.now().minusDays(10)); // expired
        GradeAppealRequest req = new GradeAppealRequest();
        req.setEnrollmentId(1L);

        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));
        when(enrollmentRepository.findById(1L)).thenReturn(Optional.of(enrollment));
        when(gradeRepository.findByEnrollmentId(1L)).thenReturn(Optional.of(grade));

        assertThrows(BadRequestException.class, () -> appealService.create(1L, req));
    }

    @Test
    void review_Approved_Success() {
        GradeAppealReviewRequest req = new GradeAppealReviewRequest();
        req.setStatus(GradeAppeal.AppealStatus.APPROVED);
        req.setNewScore(BigDecimal.valueOf(8));

        when(appealRepository.findById(1L)).thenReturn(Optional.of(appeal));
        when(lecturerRepository.findByUserId(2L)).thenReturn(Optional.empty()); // admin
        when(userRepository.findById(2L)).thenReturn(Optional.of(reviewer));
        when(gradeRepository.findByEnrollmentId(1L)).thenReturn(Optional.of(grade));
        when(appealRepository.save(any())).thenReturn(appeal);

        GradeAppeal result = appealService.review(2L, 1L, req);
        assertEquals(GradeAppeal.AppealStatus.APPROVED, result.getStatus());
        verify(gradeRepository).save(any(Grade.class));
    }

    @Test
    void review_Rejected_MissingReason_Throws() {
        GradeAppealReviewRequest req = new GradeAppealReviewRequest();
        req.setStatus(GradeAppeal.AppealStatus.REJECTED);

        when(appealRepository.findById(1L)).thenReturn(Optional.of(appeal));
        when(lecturerRepository.findByUserId(2L)).thenReturn(Optional.empty()); // admin
        when(userRepository.findById(2L)).thenReturn(Optional.of(reviewer));

        assertThrows(BadRequestException.class, () -> appealService.review(2L, 1L, req));
    }
}
