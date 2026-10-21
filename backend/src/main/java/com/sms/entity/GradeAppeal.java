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
    @Column(nullable = false, length = 15)
    private AppealStatus status = AppealStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "password"})
    private User reviewer;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @Column(name = "new_score", precision = 4, scale = 2)
    private BigDecimal newScore;

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

    public enum ScoreComponent { CC2, MIDTERM, FINAL, ALL }
    public enum AppealStatus { PENDING, IN_REVIEW, APPROVED, REJECTED }
}
