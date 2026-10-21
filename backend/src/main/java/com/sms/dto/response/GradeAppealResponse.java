package com.sms.dto.response;

import com.sms.entity.GradeAppeal;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Builder
@AllArgsConstructor
public class GradeAppealResponse {
    private Long id;
    private Long enrollmentId;
    private Long studentId;
    private String studentCode;
    private String studentName;
    private Long sectionId;
    private String sectionCode;
    private String subjectCode;
    private String subjectName;
    private Integer semesterId;
    private String semesterName;
    private GradeAppeal.ScoreComponent scoreComponent;
    private BigDecimal currentScore;
    private BigDecimal desiredScore;
    private String reason;
    private GradeAppeal.AppealStatus status;
    private Long reviewerId;
    private String reviewNotes;
    private BigDecimal newScore;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;

    public static GradeAppealResponse from(GradeAppeal appeal) {
        var enrollment = appeal.getEnrollment();
        var section = enrollment.getSection();
        var subject = section.getSubject();
        var semester = section.getSemester();
        return GradeAppealResponse.builder()
                .id(appeal.getId())
                .enrollmentId(enrollment.getId())
                .studentId(appeal.getStudent().getId())
                .studentCode(appeal.getStudent().getStudentCode())
                .studentName(appeal.getStudent().getFullName())
                .sectionId(section.getId())
                .sectionCode(section.getSectionCode())
                .subjectCode(subject.getSubjectCode())
                .subjectName(subject.getSubjectName())
                .semesterId(semester.getId())
                .semesterName(semester.getSemesterName())
                .scoreComponent(appeal.getScoreComponent())
                .currentScore(appeal.getCurrentScore())
                .desiredScore(appeal.getDesiredScore())
                .reason(appeal.getReason())
                .status(appeal.getStatus())
                .reviewerId(appeal.getReviewer() == null ? null : appeal.getReviewer().getId())
                .reviewNotes(appeal.getReviewNotes())
                .newScore(appeal.getNewScore())
                .createdAt(appeal.getCreatedAt())
                .reviewedAt(appeal.getReviewedAt())
                .build();
    }
}
