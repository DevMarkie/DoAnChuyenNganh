package com.sms.dto.request;

import com.sms.entity.Grade;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamGradeCommitItem {

    @NotNull(message = "ID thí sinh phòng thi không được để trống")
    private Long rosterId;

    private String sbd;
    private String studentCode;
    private BigDecimal score;
    private Grade.SpecialGrade specialGrade;
    private String violationNote;
}
