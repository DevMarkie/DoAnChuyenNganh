package com.sms.service;

import com.sms.dto.response.PrerequisiteGraphResponse;
import com.sms.dto.response.PrerequisiteGraphResponse.*;
import com.sms.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

class PrerequisiteGraphEngineTest {

    private PrerequisiteGraphEngine graphEngine;
    private Student student;
    private CurriculumProgram program;
    private CurriculumBlock compBlock;
    private Subject subA;
    private Subject subB;
    private Subject subC;

    @BeforeEach
    void setUp() {
        graphEngine = new PrerequisiteGraphEngine();

        student = new Student();
        student.setId(100L);
        student.setStudentCode("SV2026");
        student.setFullName("Nguyễn Văn A");

        Major major = new Major();
        major.setCode("IT");
        major.setName("Công nghệ Thông tin");

        Cohort cohort = new Cohort();
        cohort.setName("K18");

        program = new CurriculumProgram();
        program.setMajor(major);
        program.setCohort(cohort);

        compBlock = new CurriculumBlock();
        compBlock.setId(1L);
        compBlock.setCode("CN");
        compBlock.setName("Chuyên ngành");
        compBlock.setBlockType(CurriculumBlock.BlockType.COMPULSORY);

        // Chain: A -> B -> C
        subA = new Subject();
        subA.setId(1);
        subA.setSubjectCode("CS101");
        subA.setSubjectName("Nhập môn lập trình");
        subA.setCredits(3);
        subA.setPrerequisites(new HashSet<>());

        subB = new Subject();
        subB.setId(2);
        subB.setSubjectCode("CS102");
        subB.setSubjectName("Kỹ thuật lập trình");
        subB.setCredits(3);
        subB.setPrerequisites(new HashSet<>(Set.of(subA)));

        subC = new Subject();
        subC.setId(3);
        subC.setSubjectCode("CS201");
        subC.setSubjectName("Cấu trúc dữ liệu");
        subC.setCredits(4);
        subC.setPrerequisites(new HashSet<>(Set.of(subB)));
    }

    private CurriculumBlockSubject createLink(CurriculumBlock block, Subject subject) {
        CurriculumBlockSubject link = new CurriculumBlockSubject();
        link.setBlock(block);
        link.setSubject(subject);
        link.setRequired(true);
        return link;
    }

    private Grade createGrade(double gpa, String letter, double finalScore) {
        Grade g = new Grade();
        g.setGpaPoint(BigDecimal.valueOf(gpa));
        g.setLetterGrade(letter);
        g.setFinalScore(BigDecimal.valueOf(finalScore));
        g.setIsFinalized(true);
        return g;
    }

    @Test
    @DisplayName("Đồ thị DAG: Tính toán đúng level và các cạnh hướng A -> B -> C")
    void testGraphLevelsAndEdges() {
        CurriculumBlockSubject linkA = createLink(compBlock, subA);
        CurriculumBlockSubject linkB = createLink(compBlock, subB);
        CurriculumBlockSubject linkC = createLink(compBlock, subC);

        PrerequisiteGraphResponse response = graphEngine.buildGraph(
                student, program, List.of(compBlock), List.of(linkA, linkB, linkC),
                Collections.emptyMap(), Collections.emptyMap());

        assertThat(response.getNodes()).hasSize(3);
        NodeDto nodeA = response.getNodes().stream().filter(n -> n.getCode().equals("CS101")).findFirst().orElseThrow();
        NodeDto nodeB = response.getNodes().stream().filter(n -> n.getCode().equals("CS102")).findFirst().orElseThrow();
        NodeDto nodeC = response.getNodes().stream().filter(n -> n.getCode().equals("CS201")).findFirst().orElseThrow();

        assertThat(nodeA.getLevel()).isEqualTo(1);
        assertThat(nodeB.getLevel()).isEqualTo(2);
        assertThat(nodeC.getLevel()).isEqualTo(3);

        // Without any grades, A is ELIGIBLE, B and C are LOCKED
        assertThat(nodeA.getStatus()).isEqualTo(SubjectStatus.ELIGIBLE);
        assertThat(nodeB.getStatus()).isEqualTo(SubjectStatus.LOCKED);
        assertThat(nodeC.getStatus()).isEqualTo(SubjectStatus.LOCKED);
        assertThat(nodeB.getMissingPrerequisites()).contains("CS101");
        assertThat(nodeC.getMissingPrerequisites()).contains("CS102", "CS101");

        // Edges: A->B, B->C
        assertThat(response.getEdges()).hasSize(2);
        assertThat(response.getEdges()).anyMatch(e -> e.getSourceCode().equals("CS101") && e.getTargetCode().equals("CS102"));
        assertThat(response.getEdges()).anyMatch(e -> e.getSourceCode().equals("CS102") && e.getTargetCode().equals("CS201"));
    }

    @Test
    @DisplayName("Kiểm tra đệ quy: Sinh viên đạt A thì mở khóa B; đạt cả A và B thì mở khóa C")
    void testUnlockingChain() {
        CurriculumBlockSubject linkA = createLink(compBlock, subA);
        CurriculumBlockSubject linkB = createLink(compBlock, subB);
        CurriculumBlockSubject linkC = createLink(compBlock, subC);

        Grade gradeA = createGrade(3.5, "B+", 7.5);
        Map<Integer, Grade> grades = Map.of(subA.getId(), gradeA);

        PrerequisiteGraphResponse response = graphEngine.buildGraph(
                student, program, List.of(compBlock), List.of(linkA, linkB, linkC),
                grades, Collections.emptyMap());

        NodeDto nodeA = response.getNodes().stream().filter(n -> n.getCode().equals("CS101")).findFirst().orElseThrow();
        NodeDto nodeB = response.getNodes().stream().filter(n -> n.getCode().equals("CS102")).findFirst().orElseThrow();
        NodeDto nodeC = response.getNodes().stream().filter(n -> n.getCode().equals("CS201")).findFirst().orElseThrow();

        assertThat(nodeA.getStatus()).isEqualTo(SubjectStatus.PASSED);
        assertThat(nodeB.getStatus()).isEqualTo(SubjectStatus.ELIGIBLE); // Unlocked!
        assertThat(nodeC.getStatus()).isEqualTo(SubjectStatus.LOCKED);   // Still locked waiting for B
    }

    @Test
    @DisplayName("Validate chuỗi đệ quy phục vụ Enrollment: Báo lỗi khi nợ môn tiên quyết gián tiếp")
    void testValidateDeepPrerequisites() {
        // Student has no grades
        List<Subject> missing = graphEngine.validateDeepPrerequisites(subC, Collections.emptySet());
        assertThat(missing).extracting(Subject::getSubjectCode).containsExactlyInAnyOrder("CS101", "CS102");

        // Student passed A only
        List<Subject> missingAfterA = graphEngine.validateDeepPrerequisites(subC, Set.of(subA.getId()));
        assertThat(missingAfterA).extracting(Subject::getSubjectCode).containsExactly("CS102");

        // Student passed both A and B
        List<Subject> missingAfterAB = graphEngine.validateDeepPrerequisites(subC, Set.of(subA.getId(), subB.getId()));
        assertThat(missingAfterAB).isEmpty();
    }
}
