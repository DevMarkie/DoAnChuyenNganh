package com.sms.dto.request;

import com.sms.entity.GradeAppeal.AppealStatus;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class GradeAppealReviewRequest {
    @NotNull
    private AppealStatus status;

    @DecimalMin(value = "0.0")
    @DecimalMax(value = "10.0")
    private BigDecimal newScore;

    @Size(max = 2000)
    private String reviewNotes;
}
