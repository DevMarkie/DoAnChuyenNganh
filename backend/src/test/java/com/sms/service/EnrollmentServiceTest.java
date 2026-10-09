package com.sms.service;

import com.sms.entity.ClassEntity;
import com.sms.entity.Cohort;
import com.sms.entity.CourseSection;
import com.sms.entity.CurriculumProgram;
import com.sms.entity.Enrollment;
import com.sms.entity.Major;
import com.sms.entity.Semester;
import com.sms.entity.Student;
import com.sms.entity.Subject;
import com.sms.exception.BadRequestException;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.CurriculumBlockSubjectRepository;
import com.sms.repository.CurriculumProgramRepository;
import com.sms.repository.EnrollmentRepository;
import com.sms.repository.GradeRepository;
import com.sms.repository.LecturerRepository;
import com.sms.repository.ScheduleRepository;
import com.sms.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EnrollmentServiceTest {

    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private CourseSectionRepository courseSectionRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private GradeRepository gradeRepository;
    @Mock
    private LecturerRepository lecturerRepository;
    @Mock
    private CurriculumProgramRepository curriculumProgramRepository;
    @Mock
    private CurriculumBlockSubjectRepository curriculumBlockSubjectRepository;

    @InjectMocks
    private EnrollmentService enrollmentService;

    private Student student;
    private CourseSection section;
    private Enrollment enrollment;
    private CurriculumProgram program;

    @BeforeEach
    void setUp() {
        Major major = new Major();
        major.setId(1);

        Cohort cohort = new Cohort();
        cohort.setId(1);

        ClassEntity classEntity = new ClassEntity();
        classEntity.setId(1);
        classEntity.setMajor(major);
        classEntity.setCohort(cohort);

        student = new Student();
        student.setId(1L);
        student.setClassEntity(classEntity);

        Subject subject = new Subject();
        subject.setId(1);
        subject.setCredits(3);
        subject.setPrerequisites(new LinkedHashSet<>());

        Semester semester = new Semester();
        semester.setId(1);
        semester.setRegistrationStart(LocalDate.now().minusDays(1));
        semester.setRegistrationEnd(LocalDate.now().plusDays(1));
        semester.setIsCurrent(true);
        semester.setStatus(Semester.SemesterStatus.ACTIVE);

        section = new CourseSection();
        section.setId(1L);
        section.setSubject(subject);
        section.setSemester(semester);
        section.setStatus(CourseSection.SectionStatus.OPEN);
        section.setMaxStudents(40);
        section.setCurrentStudents(10);

        enrollment = new Enrollment();
        enrollment.setId(1L);
        enrollment.setStudent(student);
        enrollment.setSection(section);
        enrollment.setStatus(Enrollment.EnrollmentStatus.ENROLLED);

        program = new CurriculumProgram();
        program.setId(1L);
    }

    @Test
    void enroll_Success() {
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));
        when(courseSectionRepository.findByIdForEnrollment(1L)).thenReturn(Optional.of(section));
        
        when(curriculumProgramRepository.findActiveByMajorAndCohort(1, 1)).thenReturn(Optional.of(program));
        when(curriculumBlockSubjectRepository.existsByProgramIdAndSubjectId(1L, 1)).thenReturn(true);
        
        when(enrollmentRepository.findByStudentIdAndSectionId(1L, 1L)).thenReturn(Optional.empty());
        when(enrollmentRepository.findActiveEnrollmentBySubject(1L, 1, 1)).thenReturn(Optional.empty());
        when(enrollmentRepository.countEnrolledCredits(1L, 1)).thenReturn(0);
        when(scheduleRepository.findSchedulesForStudentAndSemester(1L, 1, 1L)).thenReturn(List.of());
        when(scheduleRepository.findBySectionId(1L)).thenReturn(List.of());
        when(enrollmentRepository.save(any(Enrollment.class))).thenReturn(enrollment);

        Enrollment result = enrollmentService.enroll(1L, 1L);
        assertNotNull(result);
        assertEquals(Enrollment.EnrollmentStatus.ENROLLED, result.getStatus());
    }

    @Test
    void enroll_RegistrationClosed_Throws() {
        section.getSemester().setRegistrationStart(LocalDate.now().plusDays(1));
        
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));
        when(courseSectionRepository.findByIdForEnrollment(1L)).thenReturn(Optional.of(section));
        when(curriculumProgramRepository.findActiveByMajorAndCohort(1, 1)).thenReturn(Optional.of(program));
        when(curriculumBlockSubjectRepository.existsByProgramIdAndSubjectId(1L, 1)).thenReturn(true);

        assertThrows(BadRequestException.class, () -> enrollmentService.enroll(1L, 1L));
    }

    @Test
    void cancelEnrollment_Success() {
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));
        when(enrollmentRepository.findById(1L)).thenReturn(Optional.of(enrollment));
        when(gradeRepository.findByEnrollmentId(1L)).thenReturn(Optional.empty());
        when(courseSectionRepository.findByIdForEnrollment(1L)).thenReturn(Optional.of(section));
        
        enrollmentService.cancelEnrollment(1L, 1L);
        verify(enrollmentRepository).save(enrollment);
        assertEquals(Enrollment.EnrollmentStatus.CANCELLED, enrollment.getStatus());
    }

    @Test
    void adminAssign_Success() {
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        when(courseSectionRepository.findByIdForEnrollment(1L)).thenReturn(Optional.of(section));
        when(enrollmentRepository.findByStudentIdAndSectionId(1L, 1L)).thenReturn(Optional.empty());
        when(enrollmentRepository.save(any(Enrollment.class))).thenReturn(enrollment);
        
        Enrollment result = enrollmentService.adminAssign(1L, 1L, false, null);
        assertNotNull(result);
    }

    @Test
    void adminBatchAssignClass_Success() {
        when(courseSectionRepository.findByIdForEnrollment(1L)).thenReturn(Optional.of(section));
        when(studentRepository.findByClassEntityId(1)).thenReturn(List.of(student));
        when(enrollmentRepository.findByStudentIdAndSectionId(1L, 1L)).thenReturn(Optional.empty());
        when(enrollmentRepository.saveAll(anyList())).thenReturn(List.of(enrollment));
        
        List<Enrollment> results = enrollmentService.adminBatchAssignClass(1, 1L);
        assertEquals(1, results.size());
    }
}
