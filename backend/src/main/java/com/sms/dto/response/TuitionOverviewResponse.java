package com.sms.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TuitionOverviewResponse {
    private Integer semesterId;
    private String semesterName;
    private String academicYear;
    private LocalDate tuitionDeadline;
    @com.fasterxml.jackson.annotation.JsonProperty("registrationOpen")
    private Boolean isRegistrationOpen;

    private int totalStudents;
    private BigDecimal totalTuition;
    private BigDecimal totalCollected;
    private BigDecimal totalDebt;

    private List<StudentTuitionItemDto> students;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudentTuitionItemDto {
        private Long studentId;
        private String studentCode;
        private String fullName;
        private Long classId;
        private String className;
        private Long departmentId;
        private String departmentName;
        private String phone;
        private String email;

        private int totalCredits;
        private int totalCourses;
        private BigDecimal totalAmount;
        private BigDecimal paidAmount;
        private BigDecimal unpaidAmount;
        private String status; // PAID, PARTIAL, UNPAID, OVERDUE
        private LocalDate extendedDeadline;
        private String extensionReason;
        private Boolean isExtended;
    }
}
