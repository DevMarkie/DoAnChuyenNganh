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
    private Integer departmentId;
    private String departmentName;
    private Long lecturerId;
    private String lecturerName;
    private GradeAppeal.ScoreComponent scoreComponent;
    private BigDecimal currentScore;
    private BigDecimal desiredScore;
    private String reason;
    private GradeAppeal.AppealStatus status;

    // Phân công chấm độc lập
    private Long assignedLecturerId;
    private String assignedLecturerName;
    private LocalDateTime assignedAt;

    // Kết quả chấm độc lập
    private Boolean hasMechanicalError;
    private BigDecimal scoreDiff;
    private Boolean exceedsThreshold;
    private Long reviewerId;
    private String reviewNotes;
    private BigDecimal newScore;
    private LocalDateTime reviewedAt;

    // Ký duyệt cấp Khoa
    private Long headReviewerId;
    private String headReviewerName;
    private LocalDateTime headApprovedAt;
    private String headSignatureHash;
    private String headReviewNotes;

    // Cập nhật điểm chính thức của Phòng Đào tạo
    private String finalAdjustmentReason;
    private Long appliedByUserId;
    private String appliedByName;
    private LocalDateTime appliedAt;
    private BigDecimal recalculatedSemesterGpa;
    private BigDecimal recalculatedCpa;

    private LocalDateTime createdAt;

    public static GradeAppealResponse from(GradeAppeal appeal) {
        var enrollment = appeal.getEnrollment();
        var section = enrollment != null ? enrollment.getSection() : null;
        var subject = section != null ? section.getSubject() : null;
        var semester = section != null ? section.getSemester() : null;
        var department = subject != null ? subject.getDepartment() : null;
        var lecturer = section != null ? section.getLecturer() : null;
        var assignedLec = appeal.getAssignedLecturer();
        var headRev = appeal.getHeadReviewer();
        var appliedUser = appeal.getAppliedByUser();

        return GradeAppealResponse.builder()
                .id(appeal.getId())
                .enrollmentId(enrollment != null ? enrollment.getId() : null)
                .studentId(appeal.getStudent() != null ? appeal.getStudent().getId() : null)
                .studentCode(appeal.getStudent() != null ? appeal.getStudent().getStudentCode() : null)
                .studentName(appeal.getStudent() != null ? appeal.getStudent().getFullName() : null)
                .sectionId(section != null ? section.getId() : null)
                .sectionCode(section != null ? section.getSectionCode() : null)
                .subjectCode(subject != null ? subject.getSubjectCode() : null)
                .subjectName(subject != null ? subject.getSubjectName() : null)
                .semesterId(semester != null ? semester.getId() : null)
                .semesterName(semester != null ? semester.getSemesterName() : null)
                .departmentId(department != null ? department.getId() : null)
                .departmentName(department != null ? department.getName() : null)
                .lecturerId(lecturer != null ? lecturer.getId() : null)
                .lecturerName(lecturer != null ? lecturer.getFullName() : null)
                .scoreComponent(appeal.getScoreComponent())
                .currentScore(appeal.getCurrentScore())
                .desiredScore(appeal.getDesiredScore())
                .reason(appeal.getReason())
                .status(appeal.getStatus())
                .assignedLecturerId(assignedLec != null ? assignedLec.getId() : null)
                .assignedLecturerName(assignedLec != null ? assignedLec.getFullName() : null)
                .assignedAt(appeal.getAssignedAt())
                .hasMechanicalError(appeal.getHasMechanicalError())
                .scoreDiff(appeal.getScoreDiff())
                .exceedsThreshold(appeal.getExceedsThreshold())
                .reviewerId(appeal.getReviewer() == null ? null : appeal.getReviewer().getId())
                .reviewNotes(appeal.getReviewNotes())
                .newScore(appeal.getNewScore())
                .reviewedAt(appeal.getReviewedAt())
                .headReviewerId(headRev != null ? headRev.getId() : null)
                .headReviewerName(headRev != null ? headRev.getUsername() : null)
                .headApprovedAt(appeal.getHeadApprovedAt())
                .headSignatureHash(appeal.getHeadSignatureHash())
                .headReviewNotes(appeal.getHeadReviewNotes())
                .finalAdjustmentReason(appeal.getFinalAdjustmentReason())
                .appliedByUserId(appliedUser != null ? appliedUser.getId() : null)
                .appliedByName(appliedUser != null ? appliedUser.getUsername() : null)
                .appliedAt(appeal.getAppliedAt())
                .createdAt(appeal.getCreatedAt())
                .build();
    }
}
