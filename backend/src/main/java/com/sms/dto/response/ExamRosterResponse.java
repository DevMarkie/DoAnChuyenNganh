package com.sms.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.sms.entity.Grade;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamRosterResponse {
    private Long id;
    private Long examRoomId;
    private Long enrollmentId;
    private Long studentId;
    private String studentCode;
    private String studentName;
    private LocalDate dateOfBirth;
    private String className;
    private String majorName;
    private String sbd;
    private BigDecimal score;
    private Grade.SpecialGrade specialGrade;
    private String violationNote;
    private LocalDateTime scoredAt;
    private String scoredByName;
    private String attendanceStatus;
}
