package com.sms.dto.request;

import java.math.BigDecimal;

import com.sms.entity.Grade;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class GradeRequest {

    @NotNull(message = "Thiếu mã đăng ký (enrollmentId)")
    private Long enrollmentId;

    @DecimalMin(value = "0.0", message = "Điểm chuyên cần phải >= 0")
    @DecimalMax(value = "10.0", message = "Điểm chuyên cần phải <= 10")
    private BigDecimal cc1Score;

    @DecimalMin(value = "0.0", message = "Điểm bài tập/phát biểu phải >= 0")
    @DecimalMax(value = "10.0", message = "Điểm bài tập/phát biểu phải <= 10")
    private BigDecimal cc2Score;

    @DecimalMin(value = "0.0", message = "Điểm giữa kỳ phải >= 0")
    @DecimalMax(value = "10.0", message = "Điểm giữa kỳ phải <= 10")
    private BigDecimal midtermScore;

    @DecimalMin(value = "0.0", message = "Điểm cuối kỳ phải >= 0")
    @DecimalMax(value = "10.0", message = "Điểm cuối kỳ phải <= 10")
    private BigDecimal finalScore;

    private Boolean finalize;

    private Grade.SpecialGrade specialGrade;
}
