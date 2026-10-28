package com.sms.dto.response;

import com.sms.entity.GradeChangeTicket;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class GradeAmendmentResponse {
    private Long id;

    // Sinh viên
    private Long studentId;
    private String studentCode;
    private String studentName;
    private String studentEmail;
    private String className;

    // Lớp học phần
    private Long classSectionId;
    private String sectionCode;
    private String subjectCode;
    private String subjectName;
    private Integer semesterId;
    private String semesterName;
    private Integer departmentId;
    private String departmentName;

    // Chi tiết sửa điểm
    private GradeChangeTicket.ComponentType componentType;
    private BigDecimal oldScore;
    private BigDecimal newScore;
    private String reason;
    private String evidenceUrl;
    private GradeChangeTicket.TicketStatus status;

    // Cấp khởi tạo (Giảng viên)
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;

    // Cấp 1: Thẩm định Bộ môn/Khoa
    private Long deptReviewerId;
    private String deptReviewerName;
    private LocalDateTime deptReviewedAt;
    private String deptNotes;

    // Cấp 2: Phê duyệt Phòng Đào tạo
    private Long approvedById;
    private String approvedByName;
    private LocalDateTime approvedAt;

    // Lý do từ chối (nếu bị REJECTED)
    private String rejectionReason;

    private LocalDateTime updatedAt;

    public static GradeAmendmentResponse from(GradeChangeTicket t) {
        if (t == null) return null;

        var student = t.getStudent();
        var section = t.getClassSection();
        var subject = section != null ? section.getSubject() : null;
        var dept = subject != null ? subject.getDepartment() : null;
        var sem = section != null ? section.getSemester() : null;
        var creator = t.getCreatedBy();
        var deptReviewer = t.getDeptReviewer();
        var approver = t.getApprovedBy();

        String className = null;
        if (student != null) {
            try {
                if (student.getClassEntity() != null) {
                    className = student.getClassEntity().getName();
                }
            } catch (Exception ignored) {
                // Ignore lazy initialization if session closed
            }
        }

        return GradeAmendmentResponse.builder()
                .id(t.getId())
                .studentId(student != null ? student.getId() : null)
                .studentCode(student != null ? student.getStudentCode() : null)
                .studentName(student != null ? student.getFullName() : null)
                .studentEmail(student != null ? student.getEmail() : null)
                .className(className)
                .classSectionId(section != null ? section.getId() : null)
                .sectionCode(section != null ? section.getSectionCode() : null)
                .subjectCode(subject != null ? subject.getSubjectCode() : null)
                .subjectName(subject != null ? subject.getSubjectName() : null)
                .semesterId(sem != null ? sem.getId() : null)
                .semesterName(sem != null ? sem.getSemesterName() : null)
                .departmentId(dept != null ? dept.getId() : null)
                .departmentName(dept != null ? dept.getName() : null)
                .componentType(t.getComponentType())
                .oldScore(t.getOldScore())
                .newScore(t.getNewScore())
                .reason(t.getReason())
                .evidenceUrl(t.getEvidenceUrl())
                .status(t.getStatus())
                .createdById(creator != null ? creator.getId() : null)
                .createdByName(creator != null ? creator.getUsername() : null)
                .createdAt(t.getCreatedAt())
                .deptReviewerId(deptReviewer != null ? deptReviewer.getId() : null)
                .deptReviewerName(deptReviewer != null ? deptReviewer.getUsername() : null)
                .deptReviewedAt(t.getDeptReviewedAt())
                .deptNotes(t.getDeptNotes())
                .approvedById(approver != null ? approver.getId() : null)
                .approvedByName(approver != null ? approver.getUsername() : null)
                .approvedAt(t.getApprovedAt())
                .rejectionReason(t.getRejectionReason())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
