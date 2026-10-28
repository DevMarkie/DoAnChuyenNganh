package com.sms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Table(name = "exam_rosters")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ExamRoster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_room_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer"})
    private ExamRoom examRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer"})
    private Enrollment enrollment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "user"})
    private Student student;

    @Column(name = "sbd", nullable = false, length = 30)
    private String sbd;

    @Column(name = "score", precision = 4, scale = 2)
    private BigDecimal score;

    @Enumerated(EnumType.STRING)
    @Column(name = "special_grade", nullable = false, length = 10)
    @Builder.Default
    private Grade.SpecialGrade specialGrade = Grade.SpecialGrade.NONE;

    @Column(name = "violation_note", columnDefinition = "TEXT")
    private String violationNote;

    @Column(name = "scored_at")
    private LocalDateTime scoredAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scored_by")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "password"})
    private User scoredBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
