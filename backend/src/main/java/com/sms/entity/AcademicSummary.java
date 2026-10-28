package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "academic_summaries", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"student_id", "semester_id"})
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AcademicSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    @Column(name = "semester_gpa", precision = 4, scale = 2)
    private BigDecimal semesterGpa;

    @Column(name = "cumulative_cpa", precision = 4, scale = 2)
    private BigDecimal cumulativeCpa;

    @Column(name = "semester_credits")
    private Integer semesterCredits;

    @Column(name = "accumulated_credits")
    private Integer accumulatedCredits;

    @Column(name = "debt_credits")
    private Integer debtCredits;

    @Column(name = "warning_level", nullable = false)
    @Builder.Default
    private Integer warningLevel = 0; // 0: Bình thường, 1: Mức 1, 2: Mức 2, 3: Buộc thôi học

    @Column(name = "max_allowed_credits")
    @Builder.Default
    private Integer maxAllowedCredits = 24; // 24, 14, 10, 0

    @Column(name = "warning_notice", columnDefinition = "TEXT")
    private String warningNotice;

    @Column(name = "calculated_at", nullable = false)
    private LocalDateTime calculatedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        calculatedAt = LocalDateTime.now();
    }
}
