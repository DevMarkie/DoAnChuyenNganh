package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "conduct_scores", uniqueConstraints = {
    @UniqueConstraint(name = "uq_student_semester_conduct", columnNames = {"student_id", "semester_id"})
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ConductScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    @Column(nullable = false)
    @Builder.Default
    private Integer score = 80;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String classification = "TOT"; // XUAT_SAC, TOT, KHA, TRUNG_BINH, YEU, KEM

    @Column(columnDefinition = "TEXT")
    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rated_by")
    private User ratedBy;

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
