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
public class GraduationEligibilityResponse {
    private Long studentId;
    private String studentCode;
    private String studentName;
    private String className;
    private String programName;
    private boolean eligible;
    private int completedCredits;
    private int requiredCredits;
    private int remainingCredits;
    private BigDecimal completionPercent;
    private BigDecimal cumulativeGpa;
    private List<String> unsatisfiedReasons;
}
