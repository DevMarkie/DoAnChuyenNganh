package com.sms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
@AllArgsConstructor
public class AcademicWarningResponse {
    private Long studentId;
    private String studentCode;
    private String studentName;
    private String className;
    private BigDecimal cumulativeGpa;
    private String academicStanding;
    private Integer semesterId;
    private String semesterName;
    private BigDecimal semesterGpa;
    private int warningLevel;
    private String warningNotice;
}
