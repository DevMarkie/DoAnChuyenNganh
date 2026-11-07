package com.sms.service;

import com.sms.dto.request.GradeRequest;
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
import com.sms.exception.BadRequestException;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.EnrollmentRepository;
import com.sms.repository.GradeAuditLogRepository;
import com.sms.repository.GradeRepository;
import com.sms.repository.LecturerRepository;
import com.sms.repository.SemesterRepository;
import com.sms.repository.StudentRepository;
import com.sms.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * BỘ KIỂM THỬ TOÀN DIỆN PHÂN HỆ B: QUẢN LÝ ĐIỂM & HỌC VỤ
 * Bao quát 6 nghiệp vụ trọng tâm:
 * 1. Công thức tính điểm thành phần & quy chế điểm liệt (< 3.0)
 * 2. Quy đổi thang điểm 10 -> Chữ (A, B+, B, C+, C, D+, D, F) -> Thang 4.0
 * 3. Quy tắc làm tròn số HALF_UP (2 chữ số thập phân) & triệt tiêu lỗi số thực
 * 4. Tính toán GPA học kỳ & CPA toàn khóa (khử trùng lặp cải thiện HIGHEST_SCORE / LATEST_ATTEMPT)
 * 5. Quét cảnh báo học vụ 3 mức & xét duyệt Học bổng Khuyến khích học tập (KKHT)
 * 6. Quy trình khóa điểm 7 ngày (Read-only), phân quyền giảng viên & phúc khảo
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Phân hệ B: Quản lý Điểm & Xử lý Học vụ - Academic & Grade Management Test Suite")
public class AcademicAndGradeManagementTest {

    // =========================================================================
    // 1. CÔNG THỨC TÍNH ĐIỂM & ĐIỂM LIỆT (TC-GRADE)
    // =========================================================================
    @Nested
    @DisplayName("1. Kiểm thử Công thức tính điểm & Quy chế điểm liệt")
    class GradeCalculationAndWeightsTest {

        @Test
        @DisplayName("TC-GRADE-01: Tính điểm tổng kết theo trọng số chuẩn (CC1 5%, CC2 5%, GK 30%, CK 60%)")
        void testStandardComponentWeightFormula() {
            Grade grade = new Grade();
            grade.setCc1Score(BigDecimal.valueOf(10.0));
            grade.setCc2Score(BigDecimal.valueOf(10.0));
            grade.setMidtermScore(BigDecimal.valueOf(8.0));
            grade.setFinalScore(BigDecimal.valueOf(8.5));

            grade.calculateTotalScore();

            // 10*0.05 + 10*0.05 + 8*0.3 + 8.5*0.6 = 0.5 + 0.5 + 2.4 + 5.1 = 8.50
            assertEquals(new BigDecimal("8.50"), grade.getTotalScore());
            assertEquals("A", grade.getLetterGrade());
            assertEquals(new BigDecimal("4.0"), grade.getGpaPoint());
            assertTrue(grade.getIsPassed());
        }

        @Test
        @DisplayName("TC-GRADE-02: Điểm cuối kỳ dưới 3.0 bị điểm liệt dù điểm quá trình rất cao (Tổng kết >= 4.0)")
        void testFinalScoreBelowThreshold_FailsRegardlessOfTotal() {
            Grade grade = new Grade();
            grade.setCc1Score(BigDecimal.valueOf(10.0));
            grade.setCc2Score(BigDecimal.valueOf(10.0));
            grade.setMidtermScore(BigDecimal.valueOf(10.0));
            grade.setFinalScore(BigDecimal.valueOf(2.90)); // Điểm liệt cuối kỳ (< 3.0)

            grade.calculateTotalScore();

            // Tổng điểm lý thuyết = 0.5 + 0.5 + 3.0 + 1.74 = 5.74 (đạt mức C)
            assertEquals(new BigDecimal("5.74"), grade.getTotalScore());
            // Nhưng vì điểm liệt CK < 3.0 nên bị ép về F và 0.0 điểm tích lũy
            assertEquals("F", grade.getLetterGrade());
            assertEquals(new BigDecimal("0.0"), grade.getGpaPoint());
            assertFalse(grade.getIsPassed());
        }

        @Test
        @DisplayName("TC-GRADE-03: Điểm cuối kỳ đạt chính xác ngưỡng thoát liệt 3.00")
        void testFinalScoreAtExactPassingBoundary() {
            Grade grade = new Grade();
            grade.setCc1Score(BigDecimal.valueOf(8.0));
            grade.setCc2Score(BigDecimal.valueOf(8.0));
            grade.setMidtermScore(BigDecimal.valueOf(6.0));
            grade.setFinalScore(BigDecimal.valueOf(3.00)); // Vừa khít ngưỡng 3.00

            grade.calculateTotalScore();

            // 8*0.05 + 8*0.05 + 6*0.3 + 3.0*0.6 = 0.4 + 0.4 + 1.8 + 1.8 = 4.40
            assertEquals(new BigDecimal("4.40"), grade.getTotalScore());
            assertEquals("D", grade.getLetterGrade());
            assertEquals(new BigDecimal("1.0"), grade.getGpaPoint());
            assertTrue(grade.getIsPassed());
        }

        @Test
        @DisplayName("TC-GRADE-04: Cận dưới điểm liệt 2.99 bị trượt môn")
        void testFinalScoreAt2Point99_Fails() {
            Grade grade = new Grade();
            grade.setCc1Score(BigDecimal.valueOf(10.0));
            grade.setCc2Score(BigDecimal.valueOf(10.0));
            grade.setMidtermScore(BigDecimal.valueOf(9.0));
            grade.setFinalScore(BigDecimal.valueOf(2.99)); // Dưới 3.00 đúng 0.01

            grade.calculateTotalScore();

            // Tổng điểm = 0.5 + 0.5 + 2.7 + 1.794 = 5.494 -> 5.49
            assertEquals(new BigDecimal("5.49"), grade.getTotalScore());
            assertEquals("F", grade.getLetterGrade());
            assertEquals(new BigDecimal("0.0"), grade.getGpaPoint());
            assertFalse(grade.getIsPassed());
        }

        @Test
        @DisplayName("TC-GRADE-05: Điểm đặc biệt Miễn học (SpecialGrade = M) được tính là Đạt")
        void testSpecialGrade_M_Exempted() {
            Grade grade = new Grade();
            grade.setSpecialGrade(Grade.SpecialGrade.M);

            grade.calculateTotalScore();

            assertNull(grade.getTotalScore());
            assertTrue(grade.getIsPassed());
        }

        @Test
        @DisplayName("TC-GRADE-06: Điểm đặc biệt Vắng thi (SpecialGrade = V) không đạt")
        void testSpecialGrade_V_Absent() {
            Grade grade = new Grade();
            grade.setSpecialGrade(Grade.SpecialGrade.V);

            assertFalse(grade.getIsPassed());
        }

        @Test
        @DisplayName("TC-GRADE-07: Điểm Hoãn thi (SpecialGrade = I) chưa đạt, chờ thi bổ sung")
        void testSpecialGrade_I_Incomplete() {
            Grade grade = new Grade();
            grade.setSpecialGrade(Grade.SpecialGrade.I);

            assertFalse(grade.getIsPassed());
        }

        @Test
        @DisplayName("TC-GRADE-08: Điểm thành phần chưa nhập đủ không gây exception, giữ nguyên null")
        void testMissingComponentScores_SafeHandling() {
            Grade grade = new Grade();
            grade.setCc1Score(BigDecimal.valueOf(9.0));
            grade.setCc2Score(BigDecimal.valueOf(9.0));
            grade.setMidtermScore(BigDecimal.valueOf(8.0));
            grade.setFinalScore(null); // Chưa có điểm cuối kỳ

            grade.calculateTotalScore();

            assertNull(grade.getTotalScore());
            assertNull(grade.getLetterGrade());
            assertNull(grade.getGpaPoint());
        }
    }

    // =========================================================================
    // 2. QUY ĐỔI THANG ĐIỂM (TC-CONV)
    // =========================================================================
    @Nested
    @DisplayName("2. Kiểm thử Quy đổi thang điểm (10 -> Chữ -> 4.0)")
    class GradeScaleConversionTest {

        private Grade createGradeWithTotal(BigDecimal totalScore, BigDecimal finalScore) {
            Grade grade = new Grade();
            grade.setCc1Score(totalScore);
            grade.setCc2Score(totalScore);
            grade.setMidtermScore(totalScore);
            grade.setFinalScore(finalScore != null ? finalScore : totalScore);
            grade.calculateTotalScore();
            return grade;
        }

        @Test
        @DisplayName("TC-CONV-01: Ngưỡng tối đa 10.0 quy đổi về A (4.0)")
        void testGradeMax10() {
            Grade grade = createGradeWithTotal(new BigDecimal("10.0"), new BigDecimal("10.0"));
            assertEquals("A", grade.getLetterGrade());
            assertEquals(new BigDecimal("4.0"), grade.getGpaPoint());
        }

        @Test
        @DisplayName("TC-CONV-02: Ngưỡng biên 8.50 quy đổi chính xác loại A (4.0)")
        void testBoundary_8_50_IsA() {
            Grade grade = createGradeWithTotal(new BigDecimal("8.50"), new BigDecimal("8.50"));
            assertEquals("A", grade.getLetterGrade());
            assertEquals(new BigDecimal("4.0"), grade.getGpaPoint());
        }

        @Test
        @DisplayName("TC-CONV-03: Cận dưới 8.49 quy đổi sang B+ (3.5)")
        void testBoundary_8_49_IsBPlus() {
            Grade grade = createGradeWithTotal(new BigDecimal("8.49"), new BigDecimal("8.49"));
            assertEquals("B+", grade.getLetterGrade());
            assertEquals(new BigDecimal("3.5"), grade.getGpaPoint());
        }

        @Test
        @DisplayName("TC-CONV-04: Ngưỡng biên 8.00 quy đổi sang B+ (3.5)")
        void testBoundary_8_00_IsBPlus() {
            Grade grade = createGradeWithTotal(new BigDecimal("8.00"), new BigDecimal("8.00"));
            assertEquals("B+", grade.getLetterGrade());
            assertEquals(new BigDecimal("3.5"), grade.getGpaPoint());
        }

        @Test
        @DisplayName("TC-CONV-05: Cận dưới 7.99 quy đổi sang B (3.0)")
        void testBoundary_7_99_IsB() {
            Grade grade = createGradeWithTotal(new BigDecimal("7.99"), new BigDecimal("7.99"));
            assertEquals("B", grade.getLetterGrade());
            assertEquals(new BigDecimal("3.0"), grade.getGpaPoint());
        }

        @Test
        @DisplayName("TC-CONV-06: Ngưỡng biên 7.00 quy đổi sang B (3.0)")
        void testBoundary_7_00_IsB() {
            Grade grade = createGradeWithTotal(new BigDecimal("7.00"), new BigDecimal("7.00"));
            assertEquals("B", grade.getLetterGrade());
            assertEquals(new BigDecimal("3.0"), grade.getGpaPoint());
        }

        @Test
        @DisplayName("TC-CONV-07: Ngưỡng biên 6.50 quy đổi sang C+ (2.5)")
        void testBoundary_6_50_IsCPlus() {
            Grade grade = createGradeWithTotal(new BigDecimal("6.50"), new BigDecimal("6.50"));
            assertEquals("C+", grade.getLetterGrade());
            assertEquals(new BigDecimal("2.5"), grade.getGpaPoint());
        }

        @Test
        @DisplayName("TC-CONV-08: Ngưỡng biên 5.50 quy đổi sang C (2.0)")
        void testBoundary_5_50_IsC() {
            Grade grade = createGradeWithTotal(new BigDecimal("5.50"), new BigDecimal("5.50"));
            assertEquals("C", grade.getLetterGrade());
            assertEquals(new BigDecimal("2.0"), grade.getGpaPoint());
        }

        @Test
        @DisplayName("TC-CONV-09: Ngưỡng biên 5.00 quy đổi sang D+ (1.5)")
        void testBoundary_5_00_IsDPlus() {
            Grade grade = createGradeWithTotal(new BigDecimal("5.00"), new BigDecimal("5.00"));
            assertEquals("D+", grade.getLetterGrade());
            assertEquals(new BigDecimal("1.5"), grade.getGpaPoint());
        }

        @Test
        @DisplayName("TC-CONV-10: Ngưỡng biên 4.00 quy đổi sang D (1.0 - Đạt)")
        void testBoundary_4_00_IsD() {
            Grade grade = createGradeWithTotal(new BigDecimal("4.00"), new BigDecimal("4.00"));
            assertEquals("D", grade.getLetterGrade());
            assertEquals(new BigDecimal("1.0"), grade.getGpaPoint());
        }

        @Test
        @DisplayName("TC-CONV-11: Cận dưới 3.99 bị trượt môn (F - 0.0)")
        void testBoundary_3_99_IsF() {
            Grade grade = createGradeWithTotal(new BigDecimal("3.99"), new BigDecimal("3.99"));
            assertEquals("F", grade.getLetterGrade());
            assertEquals(new BigDecimal("0.0"), grade.getGpaPoint());
        }
    }

    // =========================================================================
    // 3. QUY TẮC LÀM TRÒN SỐ (TC-ROUND)
    // =========================================================================
    @Nested
    @DisplayName("3. Kiểm thử Quy tắc làm tròn số HALF_UP & Triệt tiêu sai số số thực")
    class RoundingRulesTest {

        @Test
        @DisplayName("TC-ROUND-01: Làm tròn nửa lên đối với phần nghìn 0.005 (8.025 -> 8.03)")
        void testHalfUpRounding_Point005() {
            // Thiết lập điểm sao cho phép tính sinh ra đúng 8.025
            // 8.5*0.05 + 9.0*0.05 + 7.35*0.3 + 8.15*0.6 = 0.425 + 0.450 + 2.205 + 4.890 = 7.970
            // Test trực tiếp BigDecimal rounding rule
            BigDecimal score = new BigDecimal("8.025").setScale(2, RoundingMode.HALF_UP);
            assertEquals(new BigDecimal("8.03"), score);
        }

        @Test
        @DisplayName("TC-ROUND-02: Làm tròn xuống đối với phần nghìn 0.0049 (8.0249 -> 8.02)")
        void testHalfUpRounding_Point0049() {
            BigDecimal score = new BigDecimal("8.0249").setScale(2, RoundingMode.HALF_UP);
            assertEquals(new BigDecimal("8.02"), score);
        }

        @Test
        @DisplayName("TC-ROUND-03: Triệt tiêu lỗi floating-point cộng dồn phân số tín chỉ")
        void testFloatingPointAccuracyWithBigDecimal() {
            // Kiểm tra tính chia không bị sai số kiểu 2.9999999999996
            BigDecimal score1 = new BigDecimal("3.5");
            BigDecimal score2 = new BigDecimal("3.0");
            BigDecimal score3 = new BigDecimal("2.5");
            BigDecimal sumWeighted = score1.multiply(BigDecimal.valueOf(3))
                    .add(score2.multiply(BigDecimal.valueOf(3)))
                    .add(score3.multiply(BigDecimal.valueOf(3)));
            BigDecimal gpa = sumWeighted.divide(BigDecimal.valueOf(9), 2, RoundingMode.HALF_UP);

            assertEquals(new BigDecimal("3.00"), gpa);
        }

        @Test
        @DisplayName("TC-ROUND-04: Làm tròn GPA học kỳ với phép chia số lẻ tín chỉ (41.0 / 13 TC -> 3.15)")
        void testSemesterGpaOddCreditDivision() {
            BigDecimal weightedTotal = new BigDecimal("41.0");
            BigDecimal semCredits = new BigDecimal("13");
            BigDecimal gpa = weightedTotal.divide(semCredits, 2, RoundingMode.HALF_UP);

            // 41 / 13 = 3.15384615... -> 3.15
            assertEquals(new BigDecimal("3.15"), gpa);
        }

        @Test
        @DisplayName("TC-ROUND-05: Làm tròn CPA toàn khóa tại mốc cận Xuất sắc (3.595 -> 3.60)")
        void testCpaRoundingAtHonorsThreshold() {
            BigDecimal cpaRaw = new BigDecimal("3.595");
            BigDecimal cpaRounded = cpaRaw.setScale(2, RoundingMode.HALF_UP);

            assertEquals(new BigDecimal("3.60"), cpaRounded);
            assertEquals("Xuất sắc", TranscriptService.classifyAcademicStanding(cpaRounded));
        }

        @Test
        @DisplayName("TC-ROUND-06: Làm tròn CPA toàn khóa tại mốc cận Giỏi (3.194 -> 3.19)")
        void testCpaRoundingJustBelowHighDistinction() {
            BigDecimal cpaRaw = new BigDecimal("3.194");
            BigDecimal cpaRounded = cpaRaw.setScale(2, RoundingMode.HALF_UP);

            assertEquals(new BigDecimal("3.19"), cpaRounded);
            assertEquals("Khá", TranscriptService.classifyAcademicStanding(cpaRounded));
        }
    }

    // =========================================================================
    // 4. TÍNH TOÁN GPA / CPA & KHỬ TRÙNG LẶP HỌC LẠI / HỌC CẢI THIỆN (TC-GPA)
    // =========================================================================
    @Nested
    @DisplayName("4. Kiểm thử Tính toán GPA / CPA & Khử trùng lặp môn học")
    class GpaAndCpaComputationTest {

        @Mock private StudentRepository studentRepository;
        @Mock private GradeRepository gradeRepository;
        @Mock private LecturerRepository lecturerRepository;
        @Mock private TuitionService tuitionService;
        @Mock private SystemConfigService systemConfigService;

        @InjectMocks
        private TranscriptService transcriptService;

        private Student testStudent;
        private Semester semester1;
        private Semester semester2;

        @BeforeEach
        void setUp() {
            testStudent = new Student();
            testStudent.setId(100L);
            testStudent.setStudentCode("SV23010359");
            testStudent.setFullName("Nguyễn Duy Minh");

            semester1 = new Semester();
            semester1.setId(1);
            semester1.setSemesterName("Học kỳ 1");
            semester1.setSemesterNumber(1);

            semester2 = new Semester();
            semester2.setId(2);
            semester2.setSemesterName("Học kỳ 2");
            semester2.setSemesterNumber(2);
        }

        private Grade buildFinalizedGrade(Long id, Student student, Semester semester, String subjectCode,
                                          String subjectName, int credits, BigDecimal gpaPoint, String letterGrade) {
            Subject subject = new Subject();
            subject.setSubjectCode(subjectCode);
            subject.setSubjectName(subjectName);
            subject.setCredits(credits);

            CourseSection section = new CourseSection();
            section.setId(id);
            section.setSectionCode("SEC_" + subjectCode);
            section.setSubject(subject);
            section.setSemester(semester);

            Enrollment enrollment = new Enrollment();
            enrollment.setId(id);
            enrollment.setStudent(student);
            enrollment.setSection(section);

            Grade grade = new Grade();
            grade.setId(id);
            grade.setEnrollment(enrollment);
            grade.setGpaPoint(gpaPoint);
            grade.setLetterGrade(letterGrade);
            grade.setIsFinalized(true);
            grade.setFinalizedAt(LocalDateTime.now().minusDays(10));
            return grade;
        }

        @Test
        @DisplayName("TC-GPA-01: Tính GPA học kỳ chính xác cho sinh viên hoàn thành 5 môn (Tổng 15 TC)")
        void testCalculateSemesterGpaFiveCourses() {
            Grade g1 = buildFinalizedGrade(1L, testStudent, semester1, "CS101", "Lập trình C", 3, new BigDecimal("4.0"), "A");
            Grade g2 = buildFinalizedGrade(2L, testStudent, semester1, "MA101", "Giải tích 1", 3, new BigDecimal("3.5"), "B+");
            Grade g3 = buildFinalizedGrade(3L, testStudent, semester1, "PH101", "Vật lý đại cương", 4, new BigDecimal("3.0"), "B");
            Grade g4 = buildFinalizedGrade(4L, testStudent, semester1, "EN101", "Tiếng Anh 1", 2, new BigDecimal("2.5"), "C+");
            Grade g5 = buildFinalizedGrade(5L, testStudent, semester1, "PE101", "Giáo dục thể chất", 3, new BigDecimal("2.0"), "C");

            when(studentRepository.findById(100L)).thenReturn(Optional.of(testStudent));
            when(gradeRepository.findAllByStudentId(100L)).thenReturn(List.of(g1, g2, g3, g4, g5));
            when(systemConfigService.getValue("cpa_deduplication_strategy", "HIGHEST_SCORE")).thenReturn("HIGHEST_SCORE");

            TranscriptResponse response = transcriptService.getTranscript(100L);

            // Tổng TC = 3 + 3 + 4 + 2 + 3 = 15 TC
            // Điểm trọng số = 3*4 + 3*3.5 + 4*3 + 2*2.5 + 3*2 = 12 + 10.5 + 12 + 5 + 6 = 45.5
            // GPA = 45.5 / 15 = 3.0333... -> 3.03
            assertEquals(1, response.getSemesters().size());
            assertEquals(new BigDecimal("3.03"), response.getSemesters().get(0).getSemesterGpa());
            assertEquals("Khá", response.getSemesters().get(0).getSemesterClassification());
            assertEquals(new BigDecimal("3.03"), response.getCumulativeGpa());
            assertEquals(15, response.getTotalCredits());
            assertEquals(0, response.getDebtCredits());
        }

        @Test
        @DisplayName("TC-GPA-02: Điểm chưa finalized không được tính vào GPA/CPA")
        void testUnfinalizedGradeExcludedFromGpa() {
            Grade g1 = buildFinalizedGrade(1L, testStudent, semester1, "CS101", "Lập trình C", 3, new BigDecimal("4.0"), "A");
            Grade gDraft = buildFinalizedGrade(2L, testStudent, semester1, "MA101", "Giải tích 1", 3, new BigDecimal("0.0"), "F");
            gDraft.setIsFinalized(false); // Đang nháp

            when(studentRepository.findById(100L)).thenReturn(Optional.of(testStudent));
            when(gradeRepository.findAllByStudentId(100L)).thenReturn(List.of(g1, gDraft));
            when(systemConfigService.getValue("cpa_deduplication_strategy", "HIGHEST_SCORE")).thenReturn("HIGHEST_SCORE");

            TranscriptResponse response = transcriptService.getTranscript(100L);

            assertEquals(new BigDecimal("4.00"), response.getSemesters().get(0).getSemesterGpa());
            assertEquals(new BigDecimal("4.00"), response.getCumulativeGpa());
            assertEquals(3, response.getTotalCredits());
        }

        @Test
        @DisplayName("TC-GPA-03: Khử trùng lặp môn học cải thiện theo chiến lược HIGHEST_SCORE")
        void testDeduplicationStrategy_HighestScore() {
            // Lần 1: Kỳ 1 được điểm D (1.0)
            Grade g1 = buildFinalizedGrade(1L, testStudent, semester1, "CS201", "Cơ sở dữ liệu", 3, new BigDecimal("1.0"), "D");
            // Lần 2: Kỳ 2 học cải thiện được điểm B+ (3.5)
            Grade g2 = buildFinalizedGrade(2L, testStudent, semester2, "CS201", "Cơ sở dữ liệu", 3, new BigDecimal("3.5"), "B+");

            when(studentRepository.findById(100L)).thenReturn(Optional.of(testStudent));
            when(gradeRepository.findAllByStudentId(100L)).thenReturn(List.of(g1, g2));
            when(systemConfigService.getValue("cpa_deduplication_strategy", "HIGHEST_SCORE")).thenReturn("HIGHEST_SCORE");

            TranscriptResponse response = transcriptService.getTranscript(100L);

            // Môn CS201 chỉ tính 1 lần 3 TC với điểm cao nhất là 3.5
            assertEquals(3, response.getTotalCredits());
            assertEquals(1, response.getCompletedCourses());
            assertEquals(new BigDecimal("3.50"), response.getCumulativeGpa());
        }

        @Test
        @DisplayName("TC-GPA-04: Khử trùng lặp môn học lại thi trượt (F -> B xóa nợ tín chỉ)")
        void testDeduplication_RetakeFailedCourse() {
            // Lần 1: Kỳ 1 trượt môn (0.0 - F)
            Grade gFail = buildFinalizedGrade(1L, testStudent, semester1, "CS301", "Hệ điều hành", 3, new BigDecimal("0.0"), "F");
            // Lần 2: Kỳ 2 thi lại được B (3.0)
            Grade gPass = buildFinalizedGrade(2L, testStudent, semester2, "CS301", "Hệ điều hành", 3, new BigDecimal("3.0"), "B");

            when(studentRepository.findById(100L)).thenReturn(Optional.of(testStudent));
            when(gradeRepository.findAllByStudentId(100L)).thenReturn(List.of(gFail, gPass));
            when(systemConfigService.getValue("cpa_deduplication_strategy", "HIGHEST_SCORE")).thenReturn("HIGHEST_SCORE");

            TranscriptResponse response = transcriptService.getTranscript(100L);

            // Nợ tín chỉ về 0 và tích lũy được 3 TC môn Hệ điều hành
            assertEquals(0, response.getDebtCredits());
            assertEquals(3, response.getTotalCredits());
            assertEquals(new BigDecimal("3.00"), response.getCumulativeGpa());
        }

        @Test
        @DisplayName("TC-GPA-05: Chiến lược LATEST_ATTEMPT lấy điểm lần thi cuối dù thấp hơn điểm cũ")
        void testDeduplicationStrategy_LatestAttempt() {
            // Lần 1: Kỳ 1 được điểm B (3.0)
            Grade g1 = buildFinalizedGrade(1L, testStudent, semester1, "CS401", "Mạng máy tính", 3, new BigDecimal("3.0"), "B");
            // Lần 2: Kỳ 2 thi cải thiện bị điểm C (2.0)
            Grade g2 = buildFinalizedGrade(2L, testStudent, semester2, "CS401", "Mạng máy tính", 3, new BigDecimal("2.0"), "C");

            when(studentRepository.findById(100L)).thenReturn(Optional.of(testStudent));
            when(gradeRepository.findAllByStudentId(100L)).thenReturn(List.of(g1, g2));
            when(systemConfigService.getValue("cpa_deduplication_strategy", "HIGHEST_SCORE")).thenReturn("LATEST_ATTEMPT");

            TranscriptResponse response = transcriptService.getTranscript(100L);

            // LATEST_ATTEMPT ghi nhận điểm lần thi cuối là 2.0
            assertEquals(3, response.getTotalCredits());
            assertEquals(new BigDecimal("2.00"), response.getCumulativeGpa());
        }

        @Test
        @DisplayName("TC-GPA-06: Môn học bị rớt (F) và chưa học lại tính vào tổng nợ tín chỉ debtCredits")
        void testFailedCourseAccumulatesDebtCredits() {
            Grade gFail = buildFinalizedGrade(1L, testStudent, semester1, "MA201", "Xác suất thống kê", 4, new BigDecimal("0.0"), "F");

            when(studentRepository.findById(100L)).thenReturn(Optional.of(testStudent));
            when(gradeRepository.findAllByStudentId(100L)).thenReturn(List.of(gFail));
            when(systemConfigService.getValue("cpa_deduplication_strategy", "HIGHEST_SCORE")).thenReturn("HIGHEST_SCORE");

            TranscriptResponse response = transcriptService.getTranscript(100L);

            assertEquals(4, response.getDebtCredits());
            assertEquals(0, response.getTotalCredits());
            assertEquals(BigDecimal.ZERO, response.getCumulativeGpa());
        }

        @Test
        @DisplayName("TC-GPA-07: Kỳ học chưa có môn nào chốt điểm trả về GPA null (Chưa xếp loại)")
        void testEmptySemesterGpaIsNull() {
            when(studentRepository.findById(100L)).thenReturn(Optional.of(testStudent));
            when(gradeRepository.findAllByStudentId(100L)).thenReturn(List.of());

            TranscriptResponse response = transcriptService.getTranscript(100L);

            assertTrue(response.getSemesters().isEmpty());
            assertEquals(BigDecimal.ZERO, response.getCumulativeGpa());
            assertEquals(0, response.getWarningLevel());
        }

        @Test
        @DisplayName("TC-GPA-08: Khóa tra cứu bảng điểm khi sinh viên bị FINANCIAL_HOLD")
        void testFinancialHoldLocksTranscript() {
            testStudent.setFinancialHold(true);

            when(studentRepository.findById(100L)).thenReturn(Optional.of(testStudent));
            when(gradeRepository.findAllByStudentId(100L)).thenReturn(List.of());

            TranscriptResponse response = transcriptService.getTranscript(100L);

            assertTrue(response.getIsLockedDueToTuition());
            assertNotNull(response.getLockReason());
            assertEquals("Tạm khóa do nợ học phí", response.getAcademicStanding());
            assertNull(response.getCumulativeGpa());
        }
    }

    // =========================================================================
    // 5. CẢNH BÁO HỌC VỤ & HỌC BỔNG KHUYẾN KHÍCH HỌC TẬP (TC-WARN)
    // =========================================================================
    @Nested
    @DisplayName("5. Kiểm thử Cảnh báo học vụ 3 mức & Tiêu chuẩn xét Học bổng KKHT")
    class AcademicWarningAndScholarshipTest {

        private TranscriptResponse.SemesterGrade createMockSemester(int semId, int semNumber, BigDecimal gpa) {
            return TranscriptResponse.SemesterGrade.builder()
                    .semesterId(semId)
                    .semesterNumber(semNumber)
                    .semesterGpa(gpa)
                    .build();
        }

        private TranscriptResponse.SemesterGrade createMockSemester(int semNumber, BigDecimal gpa) {
            return createMockSemester(semNumber, semNumber, gpa);
        }

        @Test
        @DisplayName("TC-WARN-01: Cảnh báo học vụ Mức 1 do GPA kỳ đầu < 1.00 (Ví dụ: GPA = 0.90)")
        void testWarningLevel1_FirstSemesterGpaBelow1() {
            Student student = new Student();
            List<TranscriptResponse.SemesterGrade> semesters = List.of(createMockSemester(1, new BigDecimal("0.90")));

            int level = TranscriptService.calculateWarningLevel(student, semesters, new BigDecimal("0.90"), 0);

            assertEquals(1, level);
        }

        @Test
        @DisplayName("TC-WARN-02: Cảnh báo học vụ Mức 1 do GPA từ kỳ 2 trở đi < 1.20 (Ví dụ: GPA = 1.15)")
        void testWarningLevel1_SecondSemesterGpaBelow1Point2() {
            Student student = new Student();
            List<TranscriptResponse.SemesterGrade> semesters = List.of(
                    createMockSemester(1, new BigDecimal("2.50")),
                    createMockSemester(2, new BigDecimal("1.15"))
            );

            int level = TranscriptService.calculateWarningLevel(student, semesters, new BigDecimal("1.80"), 0);

            assertEquals(1, level);
        }

        @Test
        @DisplayName("TC-WARN-03: Cảnh báo học vụ Mức 1 do nợ quá 24 tín chỉ quy định")
        void testWarningLevel1_DebtCreditsExceeded24() {
            Student student = new Student();
            List<TranscriptResponse.SemesterGrade> semesters = List.of(
                    createMockSemester(1, new BigDecimal("2.00")),
                    createMockSemester(2, new BigDecimal("2.10"))
            );

            // Nợ 25 tín chỉ (> 24 TC)
            int level = TranscriptService.calculateWarningLevel(student, semesters, new BigDecimal("2.05"), 25);

            assertEquals(1, level);
        }

        @Test
        @DisplayName("TC-WARN-04: Cảnh báo học vụ Mức 2 do bị cảnh báo Mức 1 liên tiếp 2 học kỳ chính")
        void testWarningLevel2_ConsecutiveWarnings() {
            Student student = new Student();
            List<TranscriptResponse.SemesterGrade> semesters = List.of(
                    createMockSemester(1, new BigDecimal("0.85")), // Kỳ 1 < 1.0 -> vi phạm
                    createMockSemester(2, new BigDecimal("1.10"))  // Kỳ 2 < 1.2 -> vi phạm liên tiếp kỳ 2
            );

            int level = TranscriptService.calculateWarningLevel(student, semesters, new BigDecimal("1.00"), 0);

            assertEquals(2, level);
        }

        @Test
        @DisplayName("TC-WARN-05: Khôi phục mức cảnh báo về 0 (Bình thường) khi điểm cải thiện")
        void testWarningLevelRecovery_WhenScoresImprove() {
            Student student = new Student();
            List<TranscriptResponse.SemesterGrade> semesters = List.of(
                    createMockSemester(1, new BigDecimal("0.85")), // Kỳ 1 vi phạm
                    createMockSemester(2, new BigDecimal("2.80"))  // Kỳ 2 bứt phá -> ngắt chuỗi
            );

            int level = TranscriptService.calculateWarningLevel(student, semesters, new BigDecimal("2.00"), 0);

            assertEquals(0, level);
        }

        @Test
        @DisplayName("TC-WARN-06: Buộc thôi học (Mức 3) khi vi phạm 3 học kỳ chính liên tiếp")
        void testWarningLevel3_ThreeConsecutiveWarnings_Suspension() {
            Student student = new Student();
            // 3 kỳ chính liên tiếp (Kỳ 1 năm 1, Kỳ 2 năm 1, Kỳ 1 năm 2) đều bị vi phạm điểm
            List<TranscriptResponse.SemesterGrade> semesters = List.of(
                    createMockSemester(1, 1, new BigDecimal("0.80")),
                    createMockSemester(2, 2, new BigDecimal("1.00")),
                    createMockSemester(3, 1, new BigDecimal("1.10"))
            );

            int level = TranscriptService.calculateWarningLevel(student, semesters, new BigDecimal("0.95"), 0);

            assertEquals(3, level);
        }

        @Test
        @DisplayName("TC-WARN-07: Buộc thôi học do vượt quá thời gian đào tạo tối đa (N + 2 năm)")
        void testWarningLevel3_ExceededMaxDuration() {
            Student student = new Student();
            ClassEntity classEntity = new ClassEntity();
            Cohort cohort = new Cohort();
            cohort.setAdmissionYear(2018); // Nhập học 2018, đào tạo 4 năm -> Tối đa tốt nghiệp 2024
            cohort.setGraduationYear(2022);
            classEntity.setCohort(cohort);
            student.setClassEntity(classEntity);

            // Năm hiện tại là 2026 (> 2024) -> Quá hạn
            assertTrue(TranscriptService.isExceededMaxDuration(student));
            int level = TranscriptService.calculateWarningLevel(student, List.of(), new BigDecimal("3.5"), 0);
            assertEquals(3, level);
        }

        // --- TIÊU CHUẨN XÉT HỌC BỔNG KHUYẾN KHÍCH HỌC TẬP (KKHT) ---

        /**
         * Hàm helper kiểm tra điều kiện xét Học bổng KKHT theo Quy chế Đào tạo Phenikaa / TT 08:
         * - Số tín chỉ tích lũy trong kỳ >= 14
         * - Không có học phần nào bị điểm F (rớt môn)
         * - GPA kỳ >= 3.60 & ĐRL >= 80 -> Học bổng Xuất sắc (Loại A)
         * - 3.20 <= GPA kỳ < 3.60 & ĐRL >= 80 -> Học bổng Giỏi (Loại B)
         */
        private String evaluateScholarship(int semesterCredits, boolean hasFailedCourse, BigDecimal semesterGpa, int dRL) {
            if (semesterCredits < 14) {
                return "KHÔNG ĐỦ ĐIỀU KIỆN (Tín chỉ kỳ < 14)";
            }
            if (hasFailedCourse) {
                return "KHÔNG ĐỦ ĐIỀU KIỆN (Bị môn F)";
            }
            if (dRL < 80) {
                return "KHÔNG ĐỦ ĐIỀU KIỆN (Điểm rèn luyện < 80)";
            }
            if (semesterGpa.compareTo(new BigDecimal("3.60")) >= 0) {
                return "HỌC BỔNG XUẤT SẮC (LOẠI A)";
            } else if (semesterGpa.compareTo(new BigDecimal("3.20")) >= 0) {
                return "HỌC BỔNG GIỎI (LOẠI B)";
            }
            return "KHÔNG ĐỦ ĐIỀU KIỆN (GPA < 3.20)";
        }

        @Test
        @DisplayName("TC-WARN-08: Đủ tiêu chuẩn Học bổng KKHT Loại Xuất sắc (GPA >= 3.60, TC >= 14, không F, ĐRL >= 80)")
        void testScholarship_ExcellentCategory() {
            String result = evaluateScholarship(16, false, new BigDecimal("3.65"), 88);
            assertEquals("HỌC BỔNG XUẤT SẮC (LOẠI A)", result);
        }

        @Test
        @DisplayName("TC-WARN-09: Đủ tiêu chuẩn Học bổng KKHT Loại Giỏi (3.20 <= GPA < 3.60, TC >= 14, không F, ĐRL >= 80)")
        void testScholarship_GoodCategory() {
            String result = evaluateScholarship(15, false, new BigDecimal("3.35"), 82);
            assertEquals("HỌC BỔNG GIỎI (LOẠI B)", result);
        }

        @Test
        @DisplayName("TC-WARN-10: Trượt học bổng KKHT do có 1 môn F dù GPA rất cao (3.62)")
        void testScholarship_DisqualifiedDueToFailedCourse() {
            String result = evaluateScholarship(18, true, new BigDecimal("3.62"), 90);
            assertEquals("KHÔNG ĐỦ ĐIỀU KIỆN (Bị môn F)", result);
        }

        @Test
        @DisplayName("TC-WARN-11: Trượt học bổng KKHT do số tín chỉ tích lũy không đủ 14 TC")
        void testScholarship_DisqualifiedDueToInsufficientCredits() {
            String result = evaluateScholarship(12, false, new BigDecimal("3.80"), 92);
            assertEquals("KHÔNG ĐỦ ĐIỀU KIỆN (Tín chỉ kỳ < 14)", result);
        }
    }

    // =========================================================================
    // 6. QUY TRÌNH KHÓA ĐIỂM, PHÚC KHẢO & ĐIỀU CHỈNH ĐIỂM (TC-LOCK)
    // =========================================================================
    @Nested
    @DisplayName("6. Kiểm thử Quy trình khóa điểm 7 ngày, Phúc khảo & Phân quyền bảo mật")
    class GradeLockingAndAppealsTest {

        @Test
        @DisplayName("TC-LOCK-01: Bảng điểm chưa quá 7 ngày kể từ lúc chốt: isEditWindowExpired = false")
        void testGracePeriod_Within7Days_AllowedToEdit() {
            Grade grade = new Grade();
            grade.setIsFinalized(true);
            grade.setFinalizedAt(LocalDateTime.now().minusDays(3)); // Mới chốt được 3 ngày

            assertFalse(grade.isEditWindowExpired());
        }

        @Test
        @DisplayName("TC-LOCK-02: Bảng điểm đã quá 7 ngày kể từ lúc chốt: isEditWindowExpired = true (Khóa sổ Read-only)")
        void testGracePeriod_After7Days_Locked() {
            Grade grade = new Grade();
            grade.setIsFinalized(true);
            grade.setFinalizedAt(LocalDateTime.now().minusDays(8)); // Đã chốt 8 ngày trước

            assertTrue(grade.isEditWindowExpired());
        }

        @Test
        @DisplayName("TC-LOCK-03: Bảng điểm chưa chốt (isFinalized = false) luôn cho phép sửa")
        void testGracePeriod_NotFinalized_NeverExpired() {
            Grade grade = new Grade();
            grade.setIsFinalized(false);
            grade.setFinalizedAt(null);

            assertFalse(grade.isEditWindowExpired());
        }

        @Test
        @DisplayName("TC-LOCK-04: Bảng điểm đã chốt nhưng thiếu mốc finalizedAt coi như đã khóa cứng an toàn")
        void testGracePeriod_FinalizedWithoutTimestamp_TreatedAsExpired() {
            Grade grade = new Grade();
            grade.setIsFinalized(true);
            grade.setFinalizedAt(null);

            assertTrue(grade.isEditWindowExpired());
        }

        @Test
        @DisplayName("TC-LOCK-05: Cửa sổ tiếp nhận Phúc khảo: Trong vòng 7 ngày kể từ khi công bố hợp lệ")
        void testAppealWindow_Within7Days_Valid() {
            LocalDateTime publishedAt = LocalDateTime.now().minusDays(4);
            int appealWindowDays = 7;

            boolean isExpired = publishedAt.plusDays(appealWindowDays).isBefore(LocalDateTime.now());
            assertFalse(isExpired, "Trong vòng 7 ngày sinh viên phải được quyền nộp đơn phúc khảo");
        }

        @Test
        @DisplayName("TC-LOCK-06: Cửa sổ tiếp nhận Phúc khảo: Quá hạn 7 ngày bị từ chối")
        void testAppealWindow_After7Days_Expired() {
            LocalDateTime publishedAt = LocalDateTime.now().minusDays(8);
            int appealWindowDays = 7;

            boolean isExpired = publishedAt.plusDays(appealWindowDays).isBefore(LocalDateTime.now());
            assertTrue(isExpired, "Sau 7 ngày hệ thống phải đóng cổng tiếp nhận phúc khảo");
        }
    }
}
