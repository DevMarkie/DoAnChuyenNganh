package com.sms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class StudentCheckInRequest {
    @NotBlank(message = "Mã điểm danh không được để trống")
    private String code;
    private Long sectionId;
}
