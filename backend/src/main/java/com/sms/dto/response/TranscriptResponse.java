package com.sms.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class TranscriptResponse {
    private Long studentId;
    private String studentCode;
    private String studentName;
    private String className;
    private BigDecimal cumulativeGpa;
    private String academicStanding;
    private int warningLevel; // 0: Bình thường, 1: Mức 1, 2: Mức 2, 3: Buộc thôi học
    private String warningNotice;
    private Integer maxAllowedCredits; // Hạn mức tín chỉ đăng ký kỳ sau (24, 14, 10, 0)
    private int totalCredits;
    private int completedCourses;
    private int debtCredits; // Tổng số tín chỉ nợ môn trượt F chưa trả
    private Boolean isLockedDueToTuition; // Bảng điểm bị khóa do nợ học phí
    private String lockReason; // Lý do khóa bảng điểm
    private List<SemesterGrade> semesters;
    private AdvisorContact advisorContact;

    @Getter @Setter @Builder
    @NoArgsConstructor @AllArgsConstructor
    public static class AdvisorContact {
        private String advisorName;
        private String advisorCode;
        private String advisorEmail;
        private String advisorPhone;
        private String advisorDegree;
        private String specialization;
        private String consultationHours;
        private String advisorOffice;
        private String departmentName;
        private String departmentCode;
        private String assistantName;
        private String assistantEmail;
        private String assistantPhone;
        private String departmentOffice;
        private String studentSupportNotes;
    }

    @Getter @Setter @Builder
    @NoArgsConstructor @AllArgsConstructor
    public static class SemesterGrade {
        private Integer semesterId;
        private String semesterName;
        private String academicYear;
        private Integer semesterNumber;
        private BigDecimal semesterGpa;
        private String semesterClassification;
        private boolean isSemesterWarning;
        private int semesterCredits;
        private List<CourseGrade> courses;
    }

    @Getter @Setter @Builder
    @NoArgsConstructor @AllArgsConstructor
    public static class CourseGrade {
        private Long enrollmentId;
        private Long sectionId;
        private String sectionCode;
        private LocalDateTime finalizedAt;
        private LocalDateTime publishedAt;
        private Boolean canAppeal;
        private String subjectCode;
        private String subjectName;
        private int credits;
        private BigDecimal cc1Score;
        private BigDecimal cc2Score;
        private BigDecimal midtermScore;
        private BigDecimal finalScore;
        private BigDecimal totalScore;
        private String letterGrade;
        private BigDecimal gpaPoint;
        private Boolean isFinalized;
        private String status;
        private String attendanceStatus;
        private Boolean isDisqualified;
    }
}
