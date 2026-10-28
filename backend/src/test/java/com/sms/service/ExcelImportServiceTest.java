package com.sms.service;

import com.sms.dto.response.ExamGradeImportRow;
import com.sms.entity.ClassEntity;
import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.entity.ExamRoom;
import com.sms.entity.ExamRoster;
import com.sms.entity.Grade;
import com.sms.entity.Student;
import com.sms.entity.Subject;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.ClassRepository;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.EnrollmentRepository;
import com.sms.repository.ExamRoomRepository;
import com.sms.repository.ExamRosterRepository;
import com.sms.repository.GradeRepository;
import com.sms.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
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

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private ClassRepository classRepository;

    @Mock
    private ExamRoomRepository examRoomRepository;

    @Mock
    private ExamRosterRepository examRosterRepository;

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

        // Mo lai bang POI de chac chan la file XLSX hop le co du lieu, khong chi "khac rong".
        try (XSSFWorkbook wb = new XSSFWorkbook(new ByteArrayInputStream(result))) {
            assertTrue(wb.getNumberOfSheets() > 0);
            assertTrue(wb.getSheetAt(0).getPhysicalNumberOfRows() > 0);
        }
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

    @Test
    void generateStudentTemplate_Success() throws IOException {
        when(classRepository.findAll()).thenReturn(List.of());

        byte[] result = excelImportService.generateStudentTemplate();

        try (XSSFWorkbook wb = new XSSFWorkbook(new ByteArrayInputStream(result))) {
            assertTrue(wb.getNumberOfSheets() > 0);
            assertTrue(wb.getSheetAt(0).getPhysicalNumberOfRows() > 0);
        }
    }

    @Test
    void parseStudentImport_EmptyFile_Throws() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "students.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", new byte[0]);
        assertThrows(BadRequestException.class, () -> excelImportService.parseStudentImport(emptyFile));
    }

    @Test
    void parseStudentImport_InvalidExcelFormat_Throws() {
        MockMultipartFile invalidFile = new MockMultipartFile("file", "students.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "corrupted content".getBytes());
        assertThrows(BadRequestException.class, () -> excelImportService.parseStudentImport(invalidFile));
    }

    @Test
    void parseExamGradeImport_RoomNotFound_Throws() {
        when(examRoomRepository.findById(999L)).thenReturn(Optional.empty());
        MockMultipartFile file = new MockMultipartFile("file", "grades.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "content".getBytes());
        assertThrows(ResourceNotFoundException.class, () -> excelImportService.parseExamGradeImport(999L, file));
    }

    @Test
    void parseExamGradeImport_NoRosters_Throws() {
        ExamRoom room = new ExamRoom();
        room.setId(100L);
        room.setRoomCode("P.01");

        when(examRoomRepository.findById(100L)).thenReturn(Optional.of(room));
        when(examRosterRepository.findByExamRoomIdOrderBySbdAsc(100L)).thenReturn(List.of());

        MockMultipartFile file = new MockMultipartFile("file", "grades.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "content".getBytes());
        assertThrows(BadRequestException.class, () -> excelImportService.parseExamGradeImport(100L, file));
    }

    @Test
    void parseExamGradeImport_ValidExcel_ReturnsPreviewRows() throws IOException {
        ExamRoom room = new ExamRoom();
        room.setId(100L);
        room.setRoomCode("P.01");

        Student s1 = new Student();
        s1.setStudentCode("STU001");
        s1.setFullName("Alice");
        s1.setDateOfBirth(LocalDate.of(2000, 1, 1));

        Enrollment e1 = new Enrollment();
        e1.setId(101L);
        e1.setStudent(s1);

        ExamRoster r1 = new ExamRoster();
        r1.setId(1L);
        r1.setSbd("IT-001");
        r1.setStudent(s1);
        r1.setEnrollment(e1);

        Student s2 = new Student();
        s2.setStudentCode("STU002");
        s2.setFullName("Bob");
        s2.setDateOfBirth(LocalDate.of(2000, 2, 2));

        Enrollment e2 = new Enrollment();
        e2.setId(102L);
        e2.setStudent(s2);

        ExamRoster r2 = new ExamRoster();
        r2.setId(2L);
        r2.setSbd("IT-002");
        r2.setStudent(s2);
        r2.setEnrollment(e2);

        when(examRoomRepository.findById(100L)).thenReturn(Optional.of(room));
        when(examRosterRepository.findByExamRoomIdOrderBySbdAsc(100L)).thenReturn(List.of(r1, r2));

        byte[] excelBytes;
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Phòng Thi");
            // Header at row 4
            Row hRow = sheet.createRow(4);
            hRow.createCell(0).setCellValue("STT");
            hRow.createCell(1).setCellValue("Số báo danh");
            hRow.createCell(2).setCellValue("Mã sinh viên");
            hRow.createCell(3).setCellValue("Họ và tên");
            hRow.createCell(4).setCellValue("Ngày sinh");
            hRow.createCell(5).setCellValue("Lớp");
            hRow.createCell(6).setCellValue("Điểm thi");
            hRow.createCell(7).setCellValue("Ghi chú");

            // Row 1: score 8.5
            Row row1 = sheet.createRow(5);
            row1.createCell(0).setCellValue(1);
            row1.createCell(1).setCellValue("IT-001");
            row1.createCell(2).setCellValue("STU001");
            row1.createCell(3).setCellValue("Alice");
            row1.createCell(4).setCellValue("2000-01-01");
            row1.createCell(5).setCellValue("CNTT1");
            row1.createCell(6).setCellValue(8.5);
            row1.createCell(7).setCellValue("");

            // Row 2: V (absent)
            Row row2 = sheet.createRow(6);
            row2.createCell(0).setCellValue(2);
            row2.createCell(1).setCellValue("IT-002");
            row2.createCell(2).setCellValue("STU002");
            row2.createCell(3).setCellValue("Bob");
            row2.createCell(4).setCellValue("2000-02-02");
            row2.createCell(5).setCellValue("CNTT1");
            row2.createCell(6).setCellValue("V");
            row2.createCell(7).setCellValue("Vắng thi");

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            wb.write(bos);
            excelBytes = bos.toByteArray();
        }

        MockMultipartFile file = new MockMultipartFile("file", "grades.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", excelBytes);

        List<ExamGradeImportRow> rows = excelImportService.parseExamGradeImport(100L, file);

        assertEquals(2, rows.size());
        assertTrue(rows.get(0).isValid());
        assertEquals(new BigDecimal("8.50"), rows.get(0).getScore());
        assertEquals(Grade.SpecialGrade.NONE, rows.get(0).getSpecialGrade());

        assertTrue(rows.get(1).isValid());
        assertEquals(BigDecimal.ZERO, rows.get(1).getScore());
        assertEquals(Grade.SpecialGrade.V, rows.get(1).getSpecialGrade());
    }

    @Test
    void parseExamGradeImport_InvalidScoresAndUnmatchedStudent_FlagsErrors() throws IOException {
        ExamRoom room = new ExamRoom();
        room.setId(100L);
        room.setRoomCode("P.01");

        Student s1 = new Student();
        s1.setStudentCode("STU001");
        s1.setFullName("Alice");
        s1.setDateOfBirth(LocalDate.of(2000, 1, 1));

        Enrollment e1 = new Enrollment();
        e1.setId(101L);
        e1.setStudent(s1);

        ExamRoster r1 = new ExamRoster();
        r1.setId(1L);
        r1.setSbd("IT-001");
        r1.setStudent(s1);
        r1.setEnrollment(e1);

        when(examRoomRepository.findById(100L)).thenReturn(Optional.of(room));
        when(examRosterRepository.findByExamRoomIdOrderBySbdAsc(100L)).thenReturn(List.of(r1));

        byte[] excelBytes;
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Phòng Thi");
            Row hRow = sheet.createRow(4);
            hRow.createCell(0).setCellValue("STT");
            hRow.createCell(1).setCellValue("Số báo danh");
            hRow.createCell(2).setCellValue("Mã sinh viên");
            hRow.createCell(3).setCellValue("Họ và tên");
            hRow.createCell(4).setCellValue("Ngày sinh");
            hRow.createCell(5).setCellValue("Lớp");
            hRow.createCell(6).setCellValue("Điểm thi");
            hRow.createCell(7).setCellValue("Ghi chú");

            // Row 1: score > 10.0
            Row row1 = sheet.createRow(5);
            row1.createCell(0).setCellValue(1);
            row1.createCell(1).setCellValue("IT-001");
            row1.createCell(2).setCellValue("STU001");
            row1.createCell(3).setCellValue("Alice");
            row1.createCell(4).setCellValue("2000-01-01");
            row1.createCell(5).setCellValue("CNTT1");
            row1.createCell(6).setCellValue(12.0);

            // Row 2: Unmatched student STU999
            Row row2 = sheet.createRow(6);
            row2.createCell(0).setCellValue(2);
            row2.createCell(1).setCellValue("IT-999");
            row2.createCell(2).setCellValue("STU999");
            row2.createCell(3).setCellValue("Ghost");
            row2.createCell(4).setCellValue("2000-01-01");
            row2.createCell(5).setCellValue("CNTT1");
            row2.createCell(6).setCellValue(7.0);

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            wb.write(bos);
            excelBytes = bos.toByteArray();
        }

        MockMultipartFile file = new MockMultipartFile("file", "grades.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", excelBytes);

        List<ExamGradeImportRow> rows = excelImportService.parseExamGradeImport(100L, file);

        assertEquals(2, rows.size());
        assertFalse(rows.get(0).isValid());
        assertTrue(rows.get(0).getError().contains("Điểm thi phải nằm trong khoảng"));

        assertFalse(rows.get(1).isValid());
        assertTrue(rows.get(1).getError().contains("Không tìm thấy thí sinh"));
    }
}
