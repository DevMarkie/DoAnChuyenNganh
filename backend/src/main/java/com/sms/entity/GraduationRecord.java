package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "graduation_records")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class GraduationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cohort_id")
    private Cohort cohort;

    @Column(name = "total_credits_accumulated", nullable = false)
    @Builder.Default
    private Integer totalCreditsAccumulated = 0;

    @Column(name = "cumulative_gpa", nullable = false, precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal cumulativeGpa = BigDecimal.ZERO;

    @Column(name = "tuition_cleared", nullable = false)
    @Builder.Default
    private Boolean tuitionCleared = false;

    @Column(name = "physical_education_passed", nullable = false)
    @Builder.Default
    private Boolean physicalEducationPassed = false;

    @Column(name = "defense_education_passed", nullable = false)
    @Builder.Default
    private Boolean defenseEducationPassed = false;

    @Column(name = "english_certificate_status", nullable = false)
    @Builder.Default
    private Boolean englishCertificateStatus = false;

    @Column(name = "system_recommendation", nullable = false, length = 30)
    @Builder.Default
    private String systemRecommendation = "DISQUALIFIED"; // QUALIFIED, DISQUALIFIED

    @Column(name = "official_status", nullable = false, length = 30)
    @Builder.Default
    private String officialStatus = "PENDING"; // PENDING, APPROVED, REJECTED

    @Column(name = "graduation_decision_no", length = 100)
    private String graduationDecisionNo;

    @Column(name = "decision_date")
    private LocalDate decisionDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessed_by")
    private User assessedBy;

    @Column(columnDefinition = "TEXT")
    private String note;

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
