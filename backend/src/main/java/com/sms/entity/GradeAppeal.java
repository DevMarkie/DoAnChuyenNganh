package com.sms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "grade_appeals")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class GradeAppeal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer"})
    private Enrollment enrollment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "user"})
    private Student student;

    @Enumerated(EnumType.STRING)
    @Column(name = "score_component", nullable = false, length = 10)
    private ScoreComponent scoreComponent = ScoreComponent.FINAL;

    @Column(name = "current_score", nullable = false, precision = 4, scale = 2)
    private BigDecimal currentScore;

    @Column(name = "desired_score", precision = 4, scale = 2)
    private BigDecimal desiredScore;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AppealStatus status = AppealStatus.PENDING;

    /** Cán bộ chấm phúc khảo độc lập (phân công bởi Phòng Đào tạo) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_lecturer_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "user"})
    private Lecturer assignedLecturer;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    /** Cờ đánh dấu có sai sót cơ học trong cộng/nhập điểm */
    @Column(name = "has_mechanical_error", nullable = false)
    private Boolean hasMechanicalError = false;

    /** Độ chênh lệch điểm số |newScore - currentScore| */
    @Column(name = "score_diff", precision = 4, scale = 2)
    private BigDecimal scoreDiff;

    /** Chênh lệch đạt ngưỡng quy chế (>= 0.5 hoặc có lỗi cơ học) */
    @Column(name = "exceeds_threshold", nullable = false)
    private Boolean exceedsThreshold = false;

    /** Người chấm/xem xét ban đầu */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "password"})
    private User reviewer;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @Column(name = "new_score", precision = 4, scale = 2)
    private BigDecimal newScore;

    /** Trưởng bộ môn / Trưởng khoa niêm phong phê duyệt điện tử */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "head_reviewer_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "password"})
    private User headReviewer;

    @Column(name = "head_approved_at")
    private LocalDateTime headApprovedAt;

    @Column(name = "head_signature_hash", length = 128)
    private String headSignatureHash;

    @Column(name = "head_review_notes", columnDefinition = "TEXT")
    private String headReviewNotes;

    /** Lý do điều chỉnh điểm chính thức của Phòng Đào tạo */
    @Column(name = "final_adjustment_reason", columnDefinition = "TEXT")
    private String finalAdjustmentReason;

    /** Cán bộ Phòng Đào tạo thực hiện cập nhật điểm vào hệ thống */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applied_by_user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "password"})
    private User appliedByUser;

    @Column(name = "applied_at")
    private LocalDateTime appliedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum ScoreComponent { CC1, CC2, MIDTERM, FINAL, ALL }

    public enum AppealStatus {
        PENDING,                // Sinh viên vừa nộp đơn
        ASSIGNED,               // Phòng Đào tạo đã phân công cán bộ chấm độc lập
        IN_REVIEW,              // Đang xem xét
        PROPOSED,               // Đã đề xuất điểm mới
        REJECTED_NO_CHANGE,     // Chênh lệch không đạt ngưỡng (< 0.5) và không có lỗi -> Giữ nguyên điểm cũ
        PENDING_HEAD_APPROVAL,  // Đạt ngưỡng chênh lệch -> Chờ Trưởng bộ môn/khoa niêm phong phê duyệt
        HEAD_APPROVED,          // Trưởng bộ môn/khoa đã niêm phong phê duyệt điện tử
        APPROVED_AND_APPLIED,   // Phòng Đào tạo đã chốt cập nhật vào hệ thống
        REJECTED,               // Từ chối phúc khảo
        APPROVED                // Phê duyệt (tương thích ngược)
    }
}
