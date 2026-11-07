package com.sms.service;

import com.sms.dto.response.DegreeAuditResponse;
import com.sms.dto.response.DegreeAuditResponse.*;
import com.sms.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

class DegreeAuditEngineTest {

    private DegreeAuditEngine auditEngine;
    private Student student;
    private CurriculumProgram program;
    private CurriculumBlock compBlock;
    private CurriculumBlock elecBlock;

    private Subject comp1;
    private Subject comp2;
    private Subject elec1;
    private Subject elec2;
    private Subject elec3;

    @BeforeEach
    void setUp() {
        PrerequisiteGraphEngine graphEngine = new PrerequisiteGraphEngine();
        auditEngine = new DegreeAuditEngine(graphEngine);

        student = new Student();
        student.setId(10L);
        student.setStudentCode("SV2026-TEST");
        student.setFullName("Lê Minh");
        student.setStatus(Student.StudentStatus.ACTIVE);

        Major major = new Major();
        major.setCode("SE");
        major.setName("Kỹ thuật Phần mềm");

        Cohort cohort = new Cohort();
        cohort.setName("K18");

        program = new CurriculumProgram();
        program.setMajor(major);
        program.setCohort(cohort);
        program.setTotalCredits(12); // Total required: 6 compulsory + 6 elective

        compBlock = new CurriculumBlock();
        compBlock.setId(1L);
        compBlock.setCode("CN-COMP");
        compBlock.setName("Chuyên ngành bắt buộc");
        compBlock.setBlockType(CurriculumBlock.BlockType.COMPULSORY);
        compBlock.setRequiredCredits(6);

        elecBlock = new CurriculumBlock();
        elecBlock.setId(2L);
        elecBlock.setCode("CN-ELEC");
        elecBlock.setName("Chuyên ngành tự chọn");
        elecBlock.setBlockType(CurriculumBlock.BlockType.ELECTIVE);
        elecBlock.setElectiveCredits(6); // Requires 6 elective credits

        comp1 = createSubject(1, "SE101", "Nhập môn SE", 3);
        comp2 = createSubject(2, "SE102", "Thiết kế kiến trúc PM", 3);

        elec1 = createSubject(3, "SE-E01", "Lập trình di động iOS", 3);
        elec2 = createSubject(4, "SE-E02", "Lập trình Web Cloud", 3);
        elec3 = createSubject(5, "SE-E03", "Phát triển Game Unity", 3);
    }

    private Subject createSubject(Integer id, String code, String name, int credits) {
        Subject s = new Subject();
        s.setId(id);
        s.setSubjectCode(code);
        s.setSubjectName(name);
        s.setCredits(credits);
        s.setPrerequisites(new HashSet<>());
        return s;
    }

    private Grade createGrade(double gpa, String letter, double finalScore) {
        Grade g = new Grade();
        g.setGpaPoint(BigDecimal.valueOf(gpa));
        g.setLetterGrade(letter);
        g.setFinalScore(BigDecimal.valueOf(finalScore));
        g.setIsFinalized(true);
        return g;
    }

    private CurriculumBlockSubject createLink(CurriculumBlock block, Subject subject) {
        CurriculumBlockSubject link = new CurriculumBlockSubject();
        link.setBlock(block);
        link.setSubject(subject);
        link.setRequired(true);
        return link;
    }

    @Test
    @DisplayName("Khối Bắt buộc: Đạt toàn bộ môn bắt buộc -> Khối hoàn thành")
    void testCompulsoryBlockPassed() {
        CurriculumBlockSubject c1 = createLink(compBlock, comp1);
        CurriculumBlockSubject c2 = createLink(compBlock, comp2);

        Map<Integer, Grade> grades = Map.of(
                comp1.getId(), createGrade(3.5, "B+", 7.5),
                comp2.getId(), createGrade(4.0, "A", 9.0)
        );

        DegreeAuditResponse audit = auditEngine.auditStudent(
                student, program, List.of(compBlock), List.of(c1, c2), grades);

        AuditBlockDetail block = audit.getBlocks().get(0);
        assertThat(block.getIsCompleted()).isTrue();
        assertThat(block.getCompletedCredits()).isEqualTo(6);
        assertThat(block.getAcceptedSubjects()).hasSize(2);
        assertThat(block.getUnfulfilledOrRemainingSubjects()).isEmpty();
    }

    @Test
    @DisplayName("Khối Bắt buộc: Nợ môn bắt buộc -> Khối chưa hoàn thành & nêu rõ lý do")
    void testCompulsoryBlockIncomplete() {
        CurriculumBlockSubject c1 = createLink(compBlock, comp1);
        CurriculumBlockSubject c2 = createLink(compBlock, comp2);

        // Passed comp1, missing comp2
        Map<Integer, Grade> grades = Map.of(
                comp1.getId(), createGrade(3.5, "B+", 7.5)
        );

        DegreeAuditResponse audit = auditEngine.auditStudent(
                student, program, List.of(compBlock), List.of(c1, c2), grades);

        AuditBlockDetail block = audit.getBlocks().get(0);
        assertThat(block.getIsCompleted()).isFalse();
        assertThat(block.getCompletedCredits()).isEqualTo(3);
        assertThat(block.getUnfulfilledOrRemainingSubjects()).hasSize(1);
        assertThat(block.getUnfulfilledOrRemainingSubjects().get(0).getSubjectCode()).isEqualTo("SE102");
        assertThat(audit.getUnsatisfiedReasons()).anyMatch(r -> r.contains("SE102") || r.contains("Chuyên ngành bắt buộc"));
    }

    @Test
    @DisplayName("BR-CUR-04 Best-Grade Optimization: Học 3 môn tự chọn (9 TC, yêu cầu 6 TC) -> Chọn 2 môn điểm cao nhất vào CPA, môn còn lại là EXCESS_ELECTIVE")
    void testBestGradeElectiveOptimization() {
        CurriculumBlockSubject e1 = createLink(elecBlock, elec1);
        CurriculumBlockSubject e2 = createLink(elecBlock, elec2);
        CurriculumBlockSubject e3 = createLink(elecBlock, elec3);

        // Student took 3 electives:
        // elec1: GPA 2.0 (C)
        // elec2: GPA 4.0 (A)
        // elec3: GPA 3.5 (B+)
        // Best 2 are: elec2 (4.0) and elec3 (3.5) = 6 credits.
        // elec1 (2.0) should be EXCESS_ELECTIVE and NOT pull down auditCpa!
        Map<Integer, Grade> grades = Map.of(
                elec1.getId(), createGrade(2.0, "C", 5.5),
                elec2.getId(), createGrade(4.0, "A", 8.8),
                elec3.getId(), createGrade(3.5, "B+", 7.8)
        );

        DegreeAuditResponse audit = auditEngine.auditStudent(
                student, program, List.of(elecBlock), List.of(e1, e2, e3), grades);

        AuditBlockDetail block = audit.getBlocks().get(0);
        assertThat(block.getIsCompleted()).isTrue();
        assertThat(block.getCompletedCredits()).isEqualTo(6);

        // Accepted subjects must be elec2 (4.0) and elec3 (3.5)
        assertThat(block.getAcceptedSubjects()).extracting(AuditSubjectItem::getSubjectCode)
                .containsExactly("SE-E02", "SE-E03");

        // Excess electives must contain elec1 (2.0)
        assertThat(audit.getExcessElectives()).hasSize(1);
        AuditSubjectItem excess = audit.getExcessElectives().get(0);
        assertThat(excess.getSubjectCode()).isEqualTo("SE-E01");
        assertThat(excess.getStatus()).isEqualTo("EXCESS_ELECTIVE");

        // Audit CPA is calculated from elec2 (4.0*3) + elec3 (3.5*3) = (12 + 10.5) / 6 = 22.5 / 6 = 3.75!
        assertThat(audit.getAuditCpa()).isEqualTo(BigDecimal.valueOf(3.75));

        // Whereas raw official CPA including the 2.0 course would be (22.5 + 6.0) / 9 = 28.5 / 9 = 3.17
        assertThat(audit.getOfficialCpa()).isEqualTo(BigDecimal.valueOf(3.17));
        assertThat(audit.getAuditCpa()).isGreaterThan(audit.getOfficialCpa());
    }

    @Test
    @DisplayName("Điều kiện chuẩn đầu ra: Tổng tín chỉ tích lũy chưa đạt mức tối thiểu CTĐT -> Không đủ điều kiện tốt nghiệp")
    void testInsufficientTotalCredits_GraduationDisqualified() {
        // Required is 12 credits, student only passed 1 course of 3 credits
        CurriculumBlockSubject c1 = createLink(compBlock, comp1);

        Map<Integer, Grade> grades = Map.of(
                comp1.getId(), createGrade(3.5, "B+", 8.0)
        );

        DegreeAuditResponse audit = auditEngine.auditStudent(
                student, program, List.of(compBlock), List.of(c1), grades);

        assertThat(audit.getIsGraduationEligible()).isFalse();
        assertThat(audit.getTotalCompletedCredits()).isEqualTo(3);
        assertThat(audit.getUnsatisfiedReasons())
                .anyMatch(r -> r.contains("Chưa tích lũy đủ số tín chỉ tốt nghiệp"));
    }

    @Test
    @DisplayName("Điều kiện chuẩn đầu ra: CPA < 2.00 -> Không đủ điều kiện tốt nghiệp")
    void testLowCpaThreshold_GraduationDisqualified() {
        // Complete compulsory blocks (6 credits) + elective block (6 credits) = 12 credits, but all D/D+ with CPA < 2.00
        CurriculumBlockSubject c1 = createLink(compBlock, comp1);
        CurriculumBlockSubject c2 = createLink(compBlock, comp2);
        CurriculumBlockSubject e1 = createLink(elecBlock, elec1);
        CurriculumBlockSubject e2 = createLink(elecBlock, elec2);

        Map<Integer, Grade> lowGrades = Map.of(
                comp1.getId(), createGrade(1.5, "D+", 5.0),
                comp2.getId(), createGrade(1.5, "D+", 5.0),
                elec1.getId(), createGrade(1.0, "D", 4.0),
                elec2.getId(), createGrade(1.5, "D+", 5.0)
        );

        DegreeAuditResponse audit = auditEngine.auditStudent(
                student, program, List.of(compBlock, elecBlock), List.of(c1, c2, e1, e2), lowGrades);

        assertThat(audit.getAuditCpa().doubleValue()).isLessThan(2.00);
        assertThat(audit.getIsGraduationEligible()).isFalse();
        assertThat(audit.getUnsatisfiedReasons())
                .anyMatch(r -> r.contains("Điểm trung bình tích lũy CPA chưa đạt chuẩn (>= 2.00)"));
    }

    @Test
    @DisplayName("Điều kiện chuẩn đầu ra: Sinh viên đang BẢO LƯU hoặc ĐÌNH CHỈ -> Không đủ điều kiện tốt nghiệp")
    void testSuspendedOrReservedStudent_GraduationDisqualified() {
        CurriculumBlockSubject c1 = createLink(compBlock, comp1);
        CurriculumBlockSubject c2 = createLink(compBlock, comp2);
        CurriculumBlockSubject e1 = createLink(elecBlock, elec1);
        CurriculumBlockSubject e2 = createLink(elecBlock, elec2);

        Map<Integer, Grade> goodGrades = Map.of(
                comp1.getId(), createGrade(3.5, "B+", 8.0),
                comp2.getId(), createGrade(4.0, "A", 9.0),
                elec1.getId(), createGrade(3.0, "B", 7.0),
                elec2.getId(), createGrade(3.5, "B+", 8.0)
        );

        // Sinh viên đang SUSPENDED (Đình chỉ)
        student.setStatus(Student.StudentStatus.SUSPENDED);
        DegreeAuditResponse auditSuspended = auditEngine.auditStudent(
                student, program, List.of(compBlock, elecBlock), List.of(c1, c2, e1, e2), goodGrades);
        assertThat(auditSuspended.getIsGraduationEligible()).isFalse();
        assertThat(auditSuspended.getUnsatisfiedReasons())
                .anyMatch(r -> r.contains("đình chỉ học tập"));

        // Sinh viên đang RESERVED (Bảo lưu)
        student.setStatus(Student.StudentStatus.RESERVED);
        DegreeAuditResponse auditReserved = auditEngine.auditStudent(
                student, program, List.of(compBlock, elecBlock), List.of(c1, c2, e1, e2), goodGrades);
        assertThat(auditReserved.getIsGraduationEligible()).isFalse();
        assertThat(auditReserved.getUnsatisfiedReasons())
                .anyMatch(r -> r.contains("bảo lưu hoặc không hoạt động"));
    }
}
