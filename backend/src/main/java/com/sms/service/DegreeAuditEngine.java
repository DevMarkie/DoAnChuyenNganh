package com.sms.service;

import com.sms.dto.response.DegreeAuditResponse;
import com.sms.dto.response.DegreeAuditResponse.*;
import com.sms.entity.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class DegreeAuditEngine {

    private final PrerequisiteGraphEngine prerequisiteGraphEngine;

    /**
     * Perform degree audit for a student according to BR-CUR-04 and graduation rules.
     */
    public DegreeAuditResponse auditStudent(
            Student student,
            CurriculumProgram program,
            List<CurriculumBlock> blocks,
            List<CurriculumBlockSubject> blockSubjects,
            Map<Integer, Grade> bestGrades) {

        // Group blockSubjects by blockId
        Map<Long, List<CurriculumBlockSubject>> blockSubjectsByBlock = new HashMap<>();
        for (CurriculumBlockSubject cbs : blockSubjects) {
            blockSubjectsByBlock.computeIfAbsent(cbs.getBlock().getId(), k -> new ArrayList<>()).add(cbs);
        }

        List<AuditBlockDetail> blockDetails = new ArrayList<>();
        List<AuditSubjectItem> allExcessElectives = new ArrayList<>();
        List<String> unsatisfiedReasons = new ArrayList<>();

        int totalRequiredCredits = program.getTotalCredits() != null ? program.getTotalCredits() : 0;
        int totalCompulsoryCredits = 0;
        int completedCompulsoryCredits = 0;
        int totalElectiveCreditsRequired = 0;
        int completedElectiveCreditsAccepted = 0;

        // Weights for Audit CPA (Compulsory + Accepted Electives only)
        BigDecimal auditCpaWeighted = BigDecimal.ZERO;
        int auditCpaCredits = 0;

        // Weights for Official Overall CPA (All passed subjects)
        BigDecimal officialCpaWeighted = BigDecimal.ZERO;
        int officialCpaCredits = 0;

        for (CurriculumBlock block : blocks) {
            List<CurriculumBlockSubject> links = blockSubjectsByBlock.getOrDefault(block.getId(), Collections.emptyList());
            boolean isCompulsory = block.getBlockType() == CurriculumBlock.BlockType.COMPULSORY;

            List<AuditSubjectItem> acceptedList = new ArrayList<>();
            List<AuditSubjectItem> unfulfilledList = new ArrayList<>();

            if (isCompulsory) {
                int blockRequiredCredits = block.getRequiredCredits() != null ? block.getRequiredCredits() : 0;
                int blockCompletedCredits = 0;

                for (CurriculumBlockSubject link : links) {
                    Subject subject = link.getSubject();
                    Grade grade = bestGrades.get(subject.getId());
                    boolean passed = prerequisiteGraphEngine.isGradePassed(grade);

                    if (passed) {
                        blockCompletedCredits += subject.getCredits();
                        completedCompulsoryCredits += subject.getCredits();

                        if (grade.getGpaPoint() != null) {
                            BigDecimal weighted = grade.getGpaPoint().multiply(BigDecimal.valueOf(subject.getCredits()));
                            auditCpaWeighted = auditCpaWeighted.add(weighted);
                            auditCpaCredits += subject.getCredits();

                            officialCpaWeighted = officialCpaWeighted.add(weighted);
                            officialCpaCredits += subject.getCredits();
                        }

                        acceptedList.add(AuditSubjectItem.builder()
                                .subjectId(subject.getId())
                                .subjectCode(subject.getSubjectCode())
                                .subjectName(subject.getSubjectName())
                                .credits(subject.getCredits())
                                .letterGrade(grade.getLetterGrade())
                                .gpaPoint(grade.getGpaPoint())
                                .finalScore(grade.getFinalScore())
                                .status("PASSED")
                                .auditNote("Bắt buộc - Đã hoàn thành")
                                .build());
                    } else {
                        unfulfilledList.add(AuditSubjectItem.builder()
                                .subjectId(subject.getId())
                                .subjectCode(subject.getSubjectCode())
                                .subjectName(subject.getSubjectName())
                                .credits(subject.getCredits())
                                .letterGrade(grade != null ? grade.getLetterGrade() : null)
                                .gpaPoint(grade != null ? grade.getGpaPoint() : null)
                                .finalScore(grade != null ? grade.getFinalScore() : null)
                                .status(grade != null ? "RETAKE_REQUIRED" : "NOT_ENROLLED")
                                .auditNote("Môn bắt buộc chưa tích lũy")
                                .build());
                    }
                }

                totalCompulsoryCredits += blockRequiredCredits;
                boolean isBlockCompleted = unfulfilledList.isEmpty() && (blockRequiredCredits == 0 || blockCompletedCredits >= blockRequiredCredits);
                if (!isBlockCompleted) {
                    unsatisfiedReasons.add(String.format("Khối bắt buộc '%s' chưa hoàn thành: Đạt %d/%d tín chỉ (còn nợ %d môn)",
                            block.getName(), blockCompletedCredits, blockRequiredCredits, unfulfilledList.size()));
                }

                blockDetails.add(AuditBlockDetail.builder()
                        .blockId(block.getId())
                        .blockCode(block.getCode())
                        .blockName(block.getName())
                        .blockType("COMPULSORY")
                        .requiredCredits(blockRequiredCredits)
                        .completedCredits(blockCompletedCredits)
                        .isCompleted(isBlockCompleted)
                        .acceptedSubjects(acceptedList)
                        .unfulfilledOrRemainingSubjects(unfulfilledList)
                        .build());

            } else {
                // ELECTIVE BLOCK: Apply Best-Grade Greedy Optimization
                int reqElectiveCredits = block.getElectiveCredits() != null ? block.getElectiveCredits() : 0;
                totalElectiveCreditsRequired += reqElectiveCredits;

                List<CurriculumBlockSubject> passedElectiveLinks = new ArrayList<>();
                List<CurriculumBlockSubject> notPassedElectiveLinks = new ArrayList<>();

                for (CurriculumBlockSubject link : links) {
                    Grade grade = bestGrades.get(link.getSubject().getId());
                    if (prerequisiteGraphEngine.isGradePassed(grade)) {
                        passedElectiveLinks.add(link);
                        // Also contribute to official raw CPA
                        if (grade.getGpaPoint() != null) {
                            officialCpaWeighted = officialCpaWeighted.add(grade.getGpaPoint().multiply(BigDecimal.valueOf(link.getSubject().getCredits())));
                            officialCpaCredits += link.getSubject().getCredits();
                        }
                    } else {
                        notPassedElectiveLinks.add(link);
                    }
                }

                // Sort passed electives: Best GPA first, then credits DESC, then code ASC
                passedElectiveLinks.sort((e1, e2) -> {
                    Grade g1 = bestGrades.get(e1.getSubject().getId());
                    Grade g2 = bestGrades.get(e2.getSubject().getId());
                    BigDecimal p1 = g1 != null && g1.getGpaPoint() != null ? g1.getGpaPoint() : BigDecimal.ZERO;
                    BigDecimal p2 = g2 != null && g2.getGpaPoint() != null ? g2.getGpaPoint() : BigDecimal.ZERO;
                    int cmp = p2.compareTo(p1); // descending
                    if (cmp != 0) return cmp;
                    int credCmp = Integer.compare(e2.getSubject().getCredits(), e1.getSubject().getCredits());
                    if (credCmp != 0) return credCmp;
                    return e1.getSubject().getSubjectCode().compareTo(e2.getSubject().getSubjectCode());
                });

                int blockAcceptedCredits = 0;
                for (CurriculumBlockSubject passedLink : passedElectiveLinks) {
                    Subject subject = passedLink.getSubject();
                    Grade grade = bestGrades.get(subject.getId());

                    if (blockAcceptedCredits < reqElectiveCredits) {
                        // Accepted for degree audit
                        blockAcceptedCredits += subject.getCredits();
                        completedElectiveCreditsAccepted += subject.getCredits();

                        if (grade.getGpaPoint() != null) {
                            auditCpaWeighted = auditCpaWeighted.add(grade.getGpaPoint().multiply(BigDecimal.valueOf(subject.getCredits())));
                            auditCpaCredits += subject.getCredits();
                        }

                        acceptedList.add(AuditSubjectItem.builder()
                                .subjectId(subject.getId())
                                .subjectCode(subject.getSubjectCode())
                                .subjectName(subject.getSubjectName())
                                .credits(subject.getCredits())
                                .letterGrade(grade.getLetterGrade())
                                .gpaPoint(grade.getGpaPoint())
                                .finalScore(grade.getFinalScore())
                                .status("PASSED")
                                .auditNote("Tính vào CPA tốt nghiệp (Điểm tối ưu)")
                                .build());
                    } else {
                        // Excess elective (higher than required credit pool or lower grade)
                        AuditSubjectItem excessItem = AuditSubjectItem.builder()
                                .subjectId(subject.getId())
                                .subjectCode(subject.getSubjectCode())
                                .subjectName(subject.getSubjectName())
                                .credits(subject.getCredits())
                                .letterGrade(grade.getLetterGrade())
                                .gpaPoint(grade.getGpaPoint())
                                .finalScore(grade.getFinalScore())
                                .status("EXCESS_ELECTIVE")
                                .auditNote("Tự chọn thừa / Cải thiện điểm (Không tính vào CPA tốt nghiệp)")
                                .build();
                        allExcessElectives.add(excessItem);
                    }
                }

                // Remaining electives not passed
                for (CurriculumBlockSubject unfulfilledLink : notPassedElectiveLinks) {
                    Subject subject = unfulfilledLink.getSubject();
                    Grade grade = bestGrades.get(subject.getId());
                    unfulfilledList.add(AuditSubjectItem.builder()
                            .subjectId(subject.getId())
                            .subjectCode(subject.getSubjectCode())
                            .subjectName(subject.getSubjectName())
                            .credits(subject.getCredits())
                            .letterGrade(grade != null ? grade.getLetterGrade() : null)
                            .gpaPoint(grade != null ? grade.getGpaPoint() : null)
                            .finalScore(grade != null ? grade.getFinalScore() : null)
                            .status(grade != null ? "RETAKE_REQUIRED" : "NOT_ENROLLED")
                            .auditNote("Tự chọn chưa tích lũy")
                            .build());
                }

                boolean isBlockCompleted = blockAcceptedCredits >= reqElectiveCredits;
                if (!isBlockCompleted) {
                    unsatisfiedReasons.add(String.format("Khối tự chọn '%s' còn thiếu: Đạt %d/%d tín chỉ yêu cầu",
                            block.getName(), blockAcceptedCredits, reqElectiveCredits));
                }

                blockDetails.add(AuditBlockDetail.builder()
                        .blockId(block.getId())
                        .blockCode(block.getCode())
                        .blockName(block.getName())
                        .blockType("ELECTIVE")
                        .requiredCredits(reqElectiveCredits)
                        .completedCredits(blockAcceptedCredits)
                        .isCompleted(isBlockCompleted)
                        .acceptedSubjects(acceptedList)
                        .unfulfilledOrRemainingSubjects(unfulfilledList)
                        .build());
            }
        }

        int totalCompletedCredits = completedCompulsoryCredits + completedElectiveCreditsAccepted;
        int excessElectiveCredits = allExcessElectives.stream().mapToInt(AuditSubjectItem::getCredits).sum();

        // Calculate Audit CPA and Official CPA
        BigDecimal auditCpa = auditCpaCredits > 0
                ? auditCpaWeighted.divide(BigDecimal.valueOf(auditCpaCredits), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal officialCpa = officialCpaCredits > 0
                ? officialCpaWeighted.divide(BigDecimal.valueOf(officialCpaCredits), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Check overall total credits
        if (totalCompletedCredits < totalRequiredCredits) {
            unsatisfiedReasons.add(String.format("Chưa tích lũy đủ số tín chỉ tốt nghiệp: Đạt %d/%d tín chỉ (còn thiếu %d TC)",
                    totalCompletedCredits, totalRequiredCredits, totalRequiredCredits - totalCompletedCredits));
        }

        // Check CPA threshold (>= 2.00)
        if (auditCpa.compareTo(BigDecimal.valueOf(2.00)) < 0) {
            unsatisfiedReasons.add(String.format("Điểm trung bình tích lũy CPA chưa đạt chuẩn (>= 2.00): Hiện tại đạt %.2f", auditCpa));
        }

        // Check student suspension status
        if (student.getStatus() == Student.StudentStatus.SUSPENDED) {
            unsatisfiedReasons.add("Sinh viên đang trong thời gian bị đình chỉ học tập");
        } else if (student.getStatus() == Student.StudentStatus.INACTIVE || student.getStatus() == Student.StudentStatus.RESERVED) {
            unsatisfiedReasons.add("Sinh viên đang trong trạng thái bảo lưu hoặc không hoạt động");
        }

        boolean isGraduationEligible = unsatisfiedReasons.isEmpty();

        String majorName = program.getMajor() != null ? program.getMajor().getName() : "";
        String cohortName = program.getCohort() != null ? program.getCohort().getName() : "";

        return DegreeAuditResponse.builder()
                .studentId(student.getId())
                .studentCode(student.getStudentCode())
                .studentName(student.getFullName())
                .majorName(majorName)
                .cohortName(cohortName)
                .totalRequiredCredits(totalRequiredCredits)
                .totalCompletedCredits(totalCompletedCredits)
                .totalCompulsoryCredits(totalCompulsoryCredits)
                .completedCompulsoryCredits(completedCompulsoryCredits)
                .totalElectiveCreditsRequired(totalElectiveCreditsRequired)
                .completedElectiveCreditsAccepted(completedElectiveCreditsAccepted)
                .excessElectiveCredits(excessElectiveCredits)
                .auditCpa(auditCpa)
                .officialCpa(officialCpa)
                .isGraduationEligible(isGraduationEligible)
                .unsatisfiedReasons(unsatisfiedReasons)
                .blocks(blockDetails)
                .excessElectives(allExcessElectives)
                .build();
    }
}
