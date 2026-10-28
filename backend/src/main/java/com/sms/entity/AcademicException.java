package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "academic_exceptions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AcademicException {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "exception_type", nullable = false, length = 50)
    private String exceptionType; // COURSE_WITHDRAWAL, CREDIT_EXEMPTION, TUITION_REDUCTION, LATE_ENROLLMENT

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_section_id")
    private CourseSection courseSection;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id")
    private Semester semester;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "attachment_url", length = 500)
    private String attachmentUrl;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewer_note", columnDefinition = "TEXT")
    private String reviewerNote;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

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
