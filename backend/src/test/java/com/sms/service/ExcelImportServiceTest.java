package com.sms.service;

import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.entity.Grade;
import com.sms.entity.Student;
import com.sms.entity.Subject;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.EnrollmentRepository;
import com.sms.repository.GradeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ExcelImportServiceTest {

    @Mock
    private CourseSectionRepository courseSectionRepository;
    
    @Mock
    private EnrollmentRepository enrollmentRepository;
    
    @Mock
    private GradeRepository gradeRepository;

    @InjectMocks
    private ExcelImportService excelImportService;

    private CourseSection section;
    private Enrollment enrollment;
    private Grade grade;

    @BeforeEach
    void setUp() {
        Subject subject = new Subject();
        subject.setSubjectName("Math");
        subject.setCredits(3);
        
        section = new CourseSection();
        section.setId(1L);
        section.setSectionCode("MTH101");
        section.setSubject(subject);

        Student student = new Student();
        student.setStudentCode("STU001");
        student.setFullName("Alice");

        enrollment = new Enrollment();
        enrollment.setId(10L);
        enrollment.setStudent(student);
        enrollment.setSection(section);

        grade = new Grade();
        grade.setId(1L);
        grade.setEnrollment(enrollment);
    }

    @Test
    void generateImportTemplate_Success() throws IOException {
        when(courseSectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(enrollmentRepository.findActiveBySectionId(1L)).thenReturn(List.of(enrollment));
        when(gradeRepository.findBySectionId(1L)).thenReturn(List.of(grade));

        byte[] result = excelImportService.generateImportTemplate(1L);

        assertNotNull(result);
        assertTrue(result.length > 0);
    }

    @Test
    void generateImportTemplate_SectionNotFound_Throws() {
        when(courseSectionRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> excelImportService.generateImportTemplate(1L));
    }

    @Test
    void parseGradeImport_EmptyFile_Throws() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "test.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", new byte[0]);
        assertThrows(BadRequestException.class, () -> excelImportService.parseGradeImport(1L, emptyFile));
    }

    @Test
    void parseGradeImport_SectionNotFound_Throws() {
        MockMultipartFile validFile = new MockMultipartFile("file", "test.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "dummy content".getBytes());
        when(courseSectionRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> excelImportService.parseGradeImport(1L, validFile));
    }

    @Test
    void parseGradeImport_InvalidExcelFormat_Throws() throws IOException {
        MockMultipartFile invalidFormatFile = new MockMultipartFile("file", "test.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "not an excel file".getBytes());
        when(courseSectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(enrollmentRepository.findActiveBySectionId(1L)).thenReturn(List.of(enrollment));

        assertThrows(BadRequestException.class, () -> excelImportService.parseGradeImport(1L, invalidFormatFile));
    }
}
