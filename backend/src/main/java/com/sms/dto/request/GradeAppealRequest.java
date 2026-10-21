package com.sms.dto.request;

import com.sms.entity.GradeAppeal.ScoreComponent;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class GradeAppealRequest {
    @NotNull
    private Long enrollmentId;

    @NotNull
    private ScoreComponent scoreComponent = ScoreComponent.FINAL;

    @DecimalMin(value = "0.0")
    @DecimalMax(value = "10.0")
    private BigDecimal desiredScore;

    @NotBlank
    @Size(min = 20, max = 2000)
    private String reason;
}
