package com.sms.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentTodayAttendanceResponse {
    private Long sectionId;
    private String sectionCode;
    private String subjectName;
    private LocalDate sessionDate;
    private String sessionStatus; // "NOT_STARTED", "OPEN", "SAVED"
    private Boolean isPresent;
    private LocalDateTime expiresAt;
}
