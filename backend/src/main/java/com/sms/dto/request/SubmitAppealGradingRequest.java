package com.sms.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class SubmitAppealGradingRequest {
    @NotNull(message = "Bắt buộc nhập điểm chấm phúc khảo")
    @DecimalMin(value = "0.0", message = "Điểm không được nhỏ hơn 0.0")
    @DecimalMax(value = "10.0", message = "Điểm không được lớn hơn 10.0")
    private BigDecimal newScore;

    private Boolean hasMechanicalError = false;

    @NotBlank(message = "Bắt buộc nhập nhận xét / giải trình chấm phúc khảo")
    @Size(max = 2000, message = "Nhận xét không được quá 2000 ký tự")
    private String reviewNotes;
}
