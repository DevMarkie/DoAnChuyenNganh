package com.sms.service;

import com.sms.dto.response.CurriculumResponse;
import com.sms.entity.ClassEntity;
import com.sms.entity.Cohort;
import com.sms.entity.CourseSection;
import com.sms.entity.CurriculumBlock;
import com.sms.entity.CurriculumBlockSubject;
import com.sms.entity.CurriculumProgram;
import com.sms.entity.Enrollment;
import com.sms.entity.Grade;
import com.sms.entity.Major;
import com.sms.entity.Semester;
import com.sms.entity.Student;
import com.sms.entity.Subject;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.CurriculumBlockRepository;
import com.sms.repository.CurriculumBlockSubjectRepository;
import com.sms.repository.CurriculumProgramRepository;
import com.sms.repository.EnrollmentRepository;
import com.sms.repository.GradeRepository;
import com.sms.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CurriculumServiceTest {

    @Mock
    private StudentRepository studentRepository;
    @Mock
    private CurriculumProgramRepository programRepository;
    @Mock
    private CurriculumBlockRepository blockRepository;
    @Mock
    private CurriculumBlockSubjectRepository blockSubjectRepository;
    @Mock
    private GradeRepository gradeRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;

    @InjectMocks
    private CurriculumService curriculumService;

    private Student student;
    private ClassEntity classEntity;
    private Major major;
    private Cohort cohort;
    private CurriculumProgram program;
    private CurriculumBlock block;
    private CurriculumBlockSubject link;
    private Subject subject;
    private Grade grade;
    private Enrollment enrollment;

    @BeforeEach
    void setUp() {
        major = new Major();
        major.setId(1);
        major.setCode("IT");

        cohort = new Cohort();
        cohort.setId(1);
        cohort.setCode("K16");

        classEntity = new ClassEntity();
        classEntity.setId(1);
        classEntity.setMajor(major);
        classEntity.setCohort(cohort);

        student = new Student();
        student.setId(1L);
        student.setClassEntity(classEntity);

        program = new CurriculumProgram();
        program.setId(1L);
        program.setMajor(major);
        program.setCohort(cohort);
        program.setTotalCredits(120);

        block = new CurriculumBlock();
        block.setId(1L);
        block.setProgram(program);
        block.setBlockType(CurriculumBlock.BlockType.COMPULSORY);
        block.setRequiredCredits(3);

        subject = new Subject();
        subject.setId(1);
        subject.setSubjectCode("CS101");
        subject.setCredits(3);
        subject.setPrerequisites(new LinkedHashSet<>());

        link = new CurriculumBlockSubject();
        link.setBlockId(1L);
        link.setSubjectId(1);
        link.setBlock(block);
        link.setSubject(subject);
        link.setRequired(true);

        CourseSection section = new CourseSection();
        section.setId(1L);
        section.setSubject(subject);
        Semester currentSem = new Semester();
        currentSem.setIsCurrent(true);
        section.setSemester(currentSem);

        enrollment = new Enrollment();
        enrollment.setId(1L);
        enrollment.setStudent(student);
        enrollment.setSection(section);
        enrollment.setStatus(Enrollment.EnrollmentStatus.ENROLLED);

        grade = new Grade();
        grade.setId(1L);
        grade.setEnrollment(enrollment);
        grade.setGpaPoint(BigDecimal.valueOf(4.0)); // Passed
    }

    @Test
    void getMyCurriculum_Success() {
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));
        when(programRepository.findActiveByMajorAndCohort(1, 1)).thenReturn(Optional.of(program));
        when(gradeRepository.findFinalizedByStudentId(1L)).thenReturn(List.of(grade));
        when(enrollmentRepository.findActiveByStudentId(1L)).thenReturn(List.of(enrollment));
        when(blockRepository.findByProgramIdOrdered(1L)).thenReturn(List.of(block));
        when(blockSubjectRepository.findByBlockIdWithSubject(1L)).thenReturn(List.of(link));

        CurriculumResponse result = curriculumService.getMyCurriculum(1L);
        
        assertNotNull(result);
        assertEquals(120, result.getProgram().getTotalRequiredCredits());
        assertEquals(3, result.getProgress().getCompletedCredits());
        assertEquals(117, result.getProgress().getRemainingCredits());
        assertEquals(1, result.getBlocks().size());
        assertEquals(1, result.getBlocks().get(0).getSubjects().size());
        assertEquals(CurriculumResponse.SubjectStatus.PASSED, result.getBlocks().get(0).getSubjects().get(0).getStatus());
    }

    @Test
    void getMyCurriculum_StudentNotFound() {
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> curriculumService.getMyCurriculum(1L));
    }

    @Test
    void getMyCurriculum_MissingMajorOrCohort_Throws() {
        student.getClassEntity().setMajor(null);
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));

        assertThrows(BadRequestException.class, () -> curriculumService.getMyCurriculum(1L));
    }

    @Test
    void getMyCurriculum_ProgramNotFound_Throws() {
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));
        when(programRepository.findActiveByMajorAndCohort(1, 1)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> curriculumService.getMyCurriculum(1L));
    }
}
