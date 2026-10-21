package com.sms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RejectResetRequest {

    @NotBlank(message = "Lý do từ chối không được để trống")
    private String rejectReason;
}
