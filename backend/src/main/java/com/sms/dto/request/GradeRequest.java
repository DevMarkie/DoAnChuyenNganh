package com.sms.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class GradeRequest {

    @NotNull(message = "Thiếu mã đăng ký (enrollmentId)")
    private Long enrollmentId;

    @DecimalMin(value = "0.0", message = "Điểm chuyên cần phải >= 0")
    @DecimalMax(value = "10.0", message = "Điểm chuyên cần phải <= 10")
    private BigDecimal attendanceScore;

    @DecimalMin(value = "0.0", message = "Điểm giữa kỳ phải >= 0")
    @DecimalMax(value = "10.0", message = "Điểm giữa kỳ phải <= 10")
    private BigDecimal midtermScore;

    @DecimalMin(value = "0.0", message = "Điểm cuối kỳ phải >= 0")
    @DecimalMax(value = "10.0", message = "Điểm cuối kỳ phải <= 10")
    private BigDecimal finalScore;

    private Boolean finalize;
}
