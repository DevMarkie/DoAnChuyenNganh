package com.sms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AttendanceStartRequest {
    @NotNull(message = "sectionId không được để trống")
    private Long sectionId;
    private Integer durationMinutes;
    private String customKeyword;
}
