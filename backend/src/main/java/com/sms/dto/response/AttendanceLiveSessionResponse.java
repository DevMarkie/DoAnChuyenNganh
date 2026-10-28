package com.sms.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceLiveSessionResponse {
    private Long sessionId;
    private Long sectionId;
    private String sectionCode;
    private String subjectName;
    private String room;
    private LocalDate sessionDate;
    private String attendanceKeyword;
    private String status; // "NOT_STARTED", "OPEN", "SAVED"
    private LocalDateTime expiresAt;
    private int totalStudents;
    private int presentCount;
    private int absentCount;
    private List<StudentAttendanceItem> students;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentAttendanceItem {
        private Long enrollmentId;
        private Long studentId;
        private String studentCode;
        private String fullName;
        private String className;
        private boolean present;
        private String attendanceStatus;
        private boolean disqualified;
    }
}
