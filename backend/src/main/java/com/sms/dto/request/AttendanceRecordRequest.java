package com.sms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AttendanceRecordRequest {
    @NotNull(message = "enrollmentId không được để trống")
    private Long enrollmentId;

    @NotNull(message = "isPresent không được để trống")
    private Boolean isPresent;
}
