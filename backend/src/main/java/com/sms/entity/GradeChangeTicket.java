package com.sms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "grade_change_tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class GradeChangeTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "user"})
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_section_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "lecturer"})
    private CourseSection classSection;

    @Enumerated(EnumType.STRING)
    @Column(name = "component_type", nullable = false, length = 20)
    private ComponentType componentType;

    @Column(name = "old_score", nullable = false, precision = 4, scale = 2)
    private BigDecimal oldScore;

    @Column(name = "new_score", nullable = false, precision = 4, scale = 2)
    private BigDecimal newScore;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "evidence_url", nullable = false, length = 500)
    private String evidenceUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private TicketStatus status = TicketStatus.PENDING_DEPT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "password"})
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dept_reviewer_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "password"})
    private User deptReviewer;

    @Column(name = "dept_reviewed_at")
    private LocalDateTime deptReviewedAt;

    @Column(name = "dept_notes", columnDefinition = "TEXT")
    private String deptNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "password"})
    private User approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = TicketStatus.PENDING_DEPT;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum ComponentType {
        CC1,
        CC2,
        MIDTERM,
        FINAL
    }

    public enum TicketStatus {
        PENDING_DEPT,       // Chờ Trưởng bộ môn / Khoa thẩm định
        PENDING_ACADEMIC,   // Đã qua Khoa duyệt, chờ Phòng Đào tạo duyệt cuối
        APPROVED,           // Đã được Phòng Đào tạo phê duyệt và cập nhật vào bảng điểm
        REJECTED            // Bị từ chối (bởi Khoa hoặc Phòng Đào tạo)
    }
}
