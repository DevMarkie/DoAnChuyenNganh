package com.sms.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter @Builder @AllArgsConstructor
public class CurriculumResponse {
    private ProgramSummary program;
    private ProgressSummary progress;
    private List<BlockSummary> blocks;

    @Getter @Builder @AllArgsConstructor
    public static class ProgramSummary {
        private Long id;
        private String code;
        private String name;
        private MajorSummary major;
        private CohortSummary cohort;
        private Integer totalRequiredCredits;
    }

    @Getter @Builder @AllArgsConstructor
    public static class MajorSummary { private Integer id; private String code; private String name; }
    @Getter @Builder @AllArgsConstructor
    public static class CohortSummary { private Integer id; private String code; private String name; }

    @Getter @Builder @AllArgsConstructor
    public static class ProgressSummary {
        private int requiredCredits;
        private int completedCredits;
        private int inProgressCredits;
        private int remainingCredits;
        private BigDecimal completionPercent;
    }

    @Getter @Builder @AllArgsConstructor
    public static class BlockSummary {
        private Long id;
        private String code;
        private String name;
        private String type;
        private int requiredCredits;
        private int completedCredits;
        private boolean completed;
        private List<SubjectSummary> subjects;
    }

    @Getter @Builder @AllArgsConstructor
    public static class SubjectSummary {
        private Integer id;
        private String code;
        private String name;
        private Integer credits;
        private boolean required;
        private SubjectStatus status;
        private GradeSummary grade;
        private List<String> prerequisites;
    }

    @Getter @Builder @AllArgsConstructor
    public static class GradeSummary {
        private String letterGrade;
        private BigDecimal gpaPoint;
    }

    public enum SubjectStatus { PASSED, ENROLLED, RETAKE_REQUIRED, FAILED, NOT_ENROLLED }
}
