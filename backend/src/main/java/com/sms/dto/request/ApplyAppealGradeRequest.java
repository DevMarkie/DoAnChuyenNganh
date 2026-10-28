package com.sms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class ApplyAppealGradeRequest {
    @NotBlank(message = "Bắt buộc nhập lý do điều chỉnh điểm chính thức")
    private String finalAdjustmentReason;
}
