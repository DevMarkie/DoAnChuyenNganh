package com.sms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentExamScheduleResponse {
    private Long enrollmentId;
    private Integer subjectId;
    private String subjectCode;
    private String subjectName;
    private Integer credits;
    private Long sectionId;
    private String sectionCode;
    private String sectionName;

    // Chuyên cần & Điều kiện dự thi
    private String attendanceStatus;
    private Integer absenceCount;
    private Integer absentPeriods;
    private Double absentRate;
    private boolean disqualified;
    private String disqualifiedReason;

    // Thông tin ca thi & phòng thi
    private boolean hasExamSchedule;
    private Long examSessionId;
    private String sessionName;
    private LocalDate examDate;
    private String startTime;
    private String endTime;

    private Long examRoomId;
    private String roomCode;
    private String roomLocation;
    private String sbd;
    private String sbdShort;
    private String seatNumber;
    private String examRoomStatus;

    // Phân loại hình thức thi & Thời lượng
    private String examType;
    private String durationMinutes;

    // Cán bộ coi thi / Giám thị
    private String proctor1Name;
    private String proctor2Name;

    // Điểm thi (nếu có)
    private BigDecimal score;
}
