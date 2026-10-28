package com.sms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Table(name = "course_sections")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class CourseSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "section_code", nullable = false, unique = true, length = 30)
    private String sectionCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer"})
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lecturer_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "user"})
    private Lecturer lecturer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer"})
    private Semester semester;

    @Column(name = "max_students", nullable = false)
    private Integer maxStudents = 40;

    @Column(name = "section_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private SectionType sectionType = SectionType.REGULAR;

    @Column(name = "min_students", nullable = false)
    private Integer minStudents = 1;

    /**
     * Sĩ số sinh viên đang học trong lớp học phần (cột vật lý: enrolled_count).
     * Quản lý trực tiếp trong cùng Transaction với lệnh đăng ký môn qua khóa
     * bi quan (PESSIMISTIC_WRITE) trong Spring Boot, thay vì dùng Trigger DB
     * để tránh deadlock và sai lệch bộ nhớ đệm (1st-level cache) của Hibernate.
     */
    @Column(name = "enrolled_count", nullable = false)
    private Integer currentStudents = 0;

    @Column(length = 200)
    private String schedule;

    @Column(length = 50)
    private String room;

    @Column(name = "grade_submission_status", nullable = false, length = 20)
    private String gradeSubmissionStatus = "DRAFT";

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "grade_return_reason", columnDefinition = "TEXT")
    private String gradeReturnReason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SectionStatus status = SectionStatus.OPEN;

    @Column(name = "scale_coefficient", nullable = false, precision = 3, scale = 2)
    private java.math.BigDecimal scaleCoefficient = java.math.BigDecimal.ONE;

    @Column(name = "base_tuition_rate", nullable = false, precision = 12, scale = 2)
    private java.math.BigDecimal baseTuitionRate = java.math.BigDecimal.ZERO;

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

    public enum SectionStatus {
        OPEN, ACTIVE, CLOSED, CANCELLED, PENDING_FEE, LOCKED_BILLING, COMPLETED
    }

    public enum SectionType {
        REGULAR, SPECIAL
    }

    public void incrementCurrentStudents() {
        this.currentStudents = (this.currentStudents != null ? this.currentStudents : 0) + 1;
    }

    public void decrementCurrentStudents() {
        this.currentStudents = Math.max(0, (this.currentStudents != null ? this.currentStudents : 0) - 1);
    }
}
