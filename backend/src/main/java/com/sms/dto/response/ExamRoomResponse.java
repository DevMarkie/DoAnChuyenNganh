package com.sms.dto.response;

import com.sms.entity.ExamRoomStatus;
import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamRoomResponse {
    private Long id;
    private Long sessionId;
    private String sessionName;
    private String subjectCode;
    private String subjectName;
    private LocalDate examDate;
    private String startTime;
    private String endTime;
    private String roomCode;
    private String roomLocation;
    private Integer capacity;
    private ExamRoomStatus status;
    private int studentCount;
    private int scoredCount;
}
