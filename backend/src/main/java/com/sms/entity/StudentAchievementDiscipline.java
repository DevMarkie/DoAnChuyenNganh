package com.sms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Table(name = "student_achievements_disciplines")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class StudentAchievementDiscipline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "user", "classEntity"})
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer"})
    private Semester semester;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RecordType type;

    @Column(name = "decision_number", nullable = false, length = 50)
    private String decisionNumber;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    private String level = "TRUONG";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (level == null || level.isBlank()) {
            level = "TRUONG";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum RecordType {
        REWARD, DISCIPLINE
    }
}
