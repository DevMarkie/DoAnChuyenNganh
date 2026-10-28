package com.sms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Table(name = "student_training_points",
       uniqueConstraints = @UniqueConstraint(name = "uq_stp_student_semester", columnNames = {"student_id", "semester_id"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class StudentTrainingPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "user", "classEntity"})
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer"})
    private Semester semester;

    @Column(nullable = false)
    private Integer score;

    @Column(name = "evaluation_grade", nullable = false, length = 30)
    private String evaluationGrade;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        computeEvaluationGrade();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        computeEvaluationGrade();
    }

    public void computeEvaluationGrade() {
        if (score == null) return;
        if (score >= 90) {
            this.evaluationGrade = "XUAT_SAC";
        } else if (score >= 80) {
            this.evaluationGrade = "TOT";
        } else if (score >= 65) {
            this.evaluationGrade = "KHA";
        } else if (score >= 50) {
            this.evaluationGrade = "TRUNG_BINH";
        } else if (score >= 35) {
            this.evaluationGrade = "YEU";
        } else {
            this.evaluationGrade = "KEM";
        }
    }
}
