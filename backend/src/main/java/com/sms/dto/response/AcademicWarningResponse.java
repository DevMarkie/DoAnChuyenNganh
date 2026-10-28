package com.sms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
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
    private int warningLevel; // 1: Mức 1, 2: Mức 2, 3: Buộc thôi học
    private String warningStatus; // "MỨC 1", "MỨC 2", "BUỘC THÔI HỌC"
    private Integer debtCredits; // Số tín chỉ nợ
    private String warningNotice; // Lý do chi tiết
    private Integer nextSemesterMaxCredits; // Hạn mức tín chỉ kỳ kế tiếp (14, 10, hoặc 0)
}
