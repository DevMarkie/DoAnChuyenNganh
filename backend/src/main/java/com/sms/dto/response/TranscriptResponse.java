package com.sms.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class TranscriptResponse {
    private Long studentId;
    private String studentCode;
    private String studentName;
    private String className;
    private BigDecimal cumulativeGpa;
    private int totalCredits;
    private int completedCourses;
    private List<SemesterGrade> semesters;

    @Getter @Setter @Builder
    @NoArgsConstructor @AllArgsConstructor
    public static class SemesterGrade {
        private Integer semesterId;
        private String semesterName;
        private String academicYear;
        private BigDecimal semesterGpa;
        private int semesterCredits;
        private List<CourseGrade> courses;
    }

    @Getter @Setter @Builder
    @NoArgsConstructor @AllArgsConstructor
    public static class CourseGrade {
        private String subjectCode;
        private String subjectName;
        private int credits;
        private BigDecimal attendanceScore;
        private BigDecimal midtermScore;
        private BigDecimal finalScore;
        private BigDecimal totalScore;
        private String letterGrade;
        private BigDecimal gpaPoint;
    }
}
