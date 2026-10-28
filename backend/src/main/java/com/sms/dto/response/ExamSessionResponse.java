package com.sms.dto.response;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamSessionResponse {
    private Long id;
    private Integer semesterId;
    private String semesterName;
    private Integer subjectId;
    private String subjectCode;
    private String subjectName;
    private String sessionName;
    private LocalDate examDate;
    private String startTime;
    private String endTime;
    private int totalRooms;
    private int totalStudents;
}
