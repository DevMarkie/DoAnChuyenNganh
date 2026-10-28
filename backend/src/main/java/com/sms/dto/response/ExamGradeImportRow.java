package com.sms.dto.response;

import com.sms.entity.Grade;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamGradeImportRow {
    private int rowNumber;
    private String sbd;
    private String studentCode;
    private String studentName;
    private String dateOfBirth;
    private String className;
    private BigDecimal score;
    private Grade.SpecialGrade specialGrade;
    private String violationNote;
    private Long rosterId;
    private Long enrollmentId;
    private boolean valid;
    private String error;
    private String warning;
}
