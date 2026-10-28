package com.sms.dto.response;

import com.sms.entity.Grade;
import com.sms.entity.GradeAuditLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeAuditLogResponse {
    private Long id;
    private Long gradeId;
    private Long studentId;
    private String studentCode;
    private String studentName;
    private Long sectionId;
    private String sectionCode;
    private String subjectName;
    private Long examRoomId;
    private String roomCode;
    private Long ticketId;
    private String component;
    private BigDecimal oldScore;
    private BigDecimal newScore;
    private Grade.SpecialGrade oldSpecialGrade;
    private Grade.SpecialGrade newSpecialGrade;
    private String reason;
    private Long changedById;
    private String changedByUsername;
    private String changedByRole;
    private String ipAddress;
    private LocalDateTime createdAt;

    public static GradeAuditLogResponse from(GradeAuditLog log) {
        if (log == null) return null;
        GradeAuditLogResponseBuilder builder = GradeAuditLogResponse.builder()
                .id(log.getId())
                .component(log.getComponent())
                .oldScore(log.getOldScore())
                .newScore(log.getNewScore())
                .oldSpecialGrade(log.getOldSpecialGrade())
                .newSpecialGrade(log.getNewSpecialGrade())
                .reason(log.getReason())
                .ipAddress(log.getIpAddress())
                .createdAt(log.getCreatedAt());

        if (log.getGrade() != null) {
            builder.gradeId(log.getGrade().getId());
            if (log.getGrade().getEnrollment() != null && log.getGrade().getEnrollment().getSection() != null) {
                var sec = log.getGrade().getEnrollment().getSection();
                builder.sectionId(sec.getId());
                builder.sectionCode(sec.getSectionCode());
                if (sec.getSubject() != null) {
                    builder.subjectName(sec.getSubject().getSubjectName());
                }
            }
        }

        if (log.getStudent() != null) {
            builder.studentId(log.getStudent().getId());
            builder.studentCode(log.getStudent().getStudentCode());
            builder.studentName(log.getStudent().getFullName());
        }

        if (log.getExamRoom() != null) {
            builder.examRoomId(log.getExamRoom().getId());
            builder.roomCode(log.getExamRoom().getRoomCode());
        }

        if (log.getTicket() != null) {
            builder.ticketId(log.getTicket().getId());
        }

        if (log.getChangedBy() != null) {
            builder.changedById(log.getChangedBy().getId());
            builder.changedByUsername(log.getChangedBy().getUsername());
            if (log.getChangedBy().getRole() != null) {
                builder.changedByRole(log.getChangedBy().getRole().getName());
            }
        }

        return builder.build();
    }
}
