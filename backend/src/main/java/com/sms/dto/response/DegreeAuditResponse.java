package com.sms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DegreeAuditResponse {
    private Long studentId;
    private String studentCode;
    private String studentName;
    private String majorName;
    private String cohortName;

    // Overall Progress
    private Integer totalRequiredCredits;
    private Integer totalCompletedCredits;
    private Integer totalCompulsoryCredits;
    private Integer completedCompulsoryCredits;
    private Integer totalElectiveCreditsRequired;
    private Integer completedElectiveCreditsAccepted;
    private Integer excessElectiveCredits;

    private BigDecimal auditCpa;
    private BigDecimal officialCpa;
    private Boolean isGraduationEligible;
    private List<String> unsatisfiedReasons;

    // Block details
    private List<AuditBlockDetail> blocks;

    // Excess & Replaced Electives
    private List<AuditSubjectItem> excessElectives;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuditBlockDetail {
        private Long blockId;
        private String blockCode;
        private String blockName;
        private String blockType; // COMPULSORY / ELECTIVE
        private Integer requiredCredits;
        private Integer completedCredits;
        private Boolean isCompleted;
        private List<AuditSubjectItem> acceptedSubjects;
        private List<AuditSubjectItem> unfulfilledOrRemainingSubjects;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuditSubjectItem {
        private Integer subjectId;
        private String subjectCode;
        private String subjectName;
        private Integer credits;
        private String letterGrade;
        private BigDecimal gpaPoint;
        private BigDecimal finalScore;
        private String status; // PASSED, EXCESS_ELECTIVE, REPLACED, RETAKE_REQUIRED, NOT_ENROLLED
        private String auditNote;
    }
}
