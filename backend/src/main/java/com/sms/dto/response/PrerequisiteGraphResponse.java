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
public class PrerequisiteGraphResponse {
    private String majorCode;
    private String majorName;
    private String cohortName;
    private Long studentId;
    private String studentCode;
    private String studentName;
    private List<NodeDto> nodes;
    private List<EdgeDto> edges;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NodeDto {
        private Integer id;
        private String code;
        private String name;
        private Integer credits;
        private String blockCode;
        private String blockName;
        private String blockType; // COMPULSORY / ELECTIVE
        private Integer level;    // Topological depth level
        private SubjectStatus status; // PASSED, ENROLLED, ELIGIBLE, LOCKED, RETAKE_REQUIRED
        private GradeSummary bestGrade;
        private List<String> directPrerequisites;
        private List<String> missingPrerequisites; // direct & indirect unmet
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EdgeDto {
        private Integer source; // prerequisite subject id
        private Integer target; // dependent subject id
        private String sourceCode;
        private String targetCode;
        private Boolean isFulfilled; // whether the student passed the prerequisite
    }

    public enum SubjectStatus {
        PASSED,
        ENROLLED,
        ELIGIBLE,
        LOCKED,
        RETAKE_REQUIRED
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GradeSummary {
        private String letterGrade;
        private BigDecimal gpaPoint;
        private BigDecimal finalScore;
    }
}
