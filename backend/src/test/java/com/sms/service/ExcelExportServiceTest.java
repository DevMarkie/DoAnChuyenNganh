package com.sms.service;

import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.entity.Grade;
import com.sms.entity.Lecturer;
import com.sms.entity.Semester;
import com.sms.entity.Student;
import com.sms.entity.Subject;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.GradeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ExcelExportServiceTest {

    @Mock
    private GradeRepository gradeRepository;
    
    @Mock
    private CourseSectionRepository courseSectionRepository;

    @InjectMocks
    private ExcelExportService excelExportService;

    private CourseSection section;
    private Grade grade;

    @BeforeEach
    void setUp() {
        Subject subject = new Subject();
        subject.setSubjectName("Math");
        subject.setCredits(3);
        
        Semester semester = new Semester();
        semester.setSemesterName("Fall 2024");
        
        Lecturer lecturer = new Lecturer();
        lecturer.setFullName("Dr. Smith");
        
        section = new CourseSection();
        section.setId(1L);
        section.setSectionCode("MTH101");
        section.setSubject(subject);
        section.setSemester(semester);
        section.setLecturer(lecturer);

        Student student = new Student();
        student.setStudentCode("STU001");
        student.setFullName("Alice");

        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setSection(section);

        grade = new Grade();
        grade.setId(1L);
        grade.setEnrollment(enrollment);
        grade.setCc1Score(BigDecimal.valueOf(9.0));
        grade.setCc2Score(BigDecimal.valueOf(8.5));
        grade.setMidtermScore(BigDecimal.valueOf(8.0));
        grade.setFinalScore(BigDecimal.valueOf(7.5));
        grade.setTotalScore(BigDecimal.valueOf(7.8));
        grade.setGpaPoint(BigDecimal.valueOf(3.0));
        grade.setLetterGrade("B");
    }

    @Test
    void exportGradeSheet_Success() throws IOException {
        when(courseSectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(gradeRepository.findBySectionId(1L)).thenReturn(List.of(grade));

        byte[] result = excelExportService.exportGradeSheet(1L);

        // Mo lai bang POI: file hop le + co dong du lieu SV (khong chi tieu de rong).
        try (XSSFWorkbook wb = new XSSFWorkbook(new ByteArrayInputStream(result))) {
            Sheet sheet = wb.getSheetAt(0);
            DataFormatter fmt = new DataFormatter();
            boolean hasStudent = false;
            for (Row row : sheet) {
                for (Cell cell : row) {
                    if ("STU001".equals(fmt.formatCellValue(cell).trim())) hasStudent = true;
                }
            }
            assertTrue(hasStudent, "Bang diem phai chua dong SV STU001");
        }
    }

    @Test
    void exportGradeSheet_SectionNotFound_Throws() {
        when(courseSectionRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> excelExportService.exportGradeSheet(1L));
    }
}
