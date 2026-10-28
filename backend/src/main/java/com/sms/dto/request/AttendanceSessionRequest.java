package com.sms.dto.request;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AttendanceSessionRequest {
    @NotNull(message = "sectionId không được để trống")
    private Long sectionId;

    @NotNull(message = "sessionDate không được để trống")
    private LocalDate sessionDate;

    private String attendanceKeyword;
    
    private String status; // "OPEN" or "SAVED"
    
    private List<AttendanceRecordRequest> records;
}
