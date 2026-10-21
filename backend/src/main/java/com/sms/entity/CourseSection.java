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
     * Số chỗ đã được giữ trong lớp học phần. Tên thuộc tính khớp với API
     * mà giao diện sử dụng, còn cột vật lý vẫn là {@code enrolled_count}.
     * Cột do trigger MySQL quản lý (insert/cancel enrollment) nên JPA không
     * ghi (insertable/updatable=false) để khỏi ghi đè giá trị trigger → tránh
     * lost update khi admin sửa lớp đúng lúc có SV đăng ký.
     */
    @Column(name = "enrolled_count", nullable = false, insertable = false, updatable = false)
    private Integer currentStudents = 0;

    @Column(length = 200)
    private String schedule;

    @Column(length = 50)
    private String room;

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
        OPEN, ACTIVE, CLOSED, CANCELLED, PENDING_FEE, LOCKED_BILLING
    }

    public enum SectionType {
        REGULAR, SPECIAL
    }
}
