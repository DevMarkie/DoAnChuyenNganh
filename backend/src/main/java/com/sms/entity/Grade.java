package com.sms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Table(name = "grades")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Grade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id", nullable = false, unique = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer"})
    private Enrollment enrollment;

    @Column(name = "attendance_score", precision = 4, scale = 2)
    private BigDecimal attendanceScore;

    @Column(name = "midterm_score", precision = 4, scale = 2)
    private BigDecimal midtermScore;

    @Column(name = "final_score", precision = 4, scale = 2)
    private BigDecimal finalScore;

    @Column(name = "total_score", precision = 4, scale = 2)
    private BigDecimal totalScore;

    @Column(name = "letter_grade", length = 2)
    private String letterGrade;

    @Column(name = "gpa_point", precision = 3, scale = 2)
    private BigDecimal gpaPoint;

    @Column(name = "is_finalized", nullable = false)
    private Boolean isFinalized = false;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Tính điểm tổng kết theo công thức:
     * Chuyên cần × 10% + Giữa kỳ × 30% + Cuối kỳ × 60%
     */
    public void calculateTotalScore() {
        if (attendanceScore != null && midtermScore != null && finalScore != null) {
            this.totalScore = attendanceScore.multiply(new BigDecimal("0.1"))
                    .add(midtermScore.multiply(new BigDecimal("0.3")))
                    .add(finalScore.multiply(new BigDecimal("0.6")));
            this.totalScore = totalScore.setScale(2, java.math.RoundingMode.HALF_UP);
            calculateLetterGrade();
        }
    }

    /**
     * Quy đổi điểm tổng kết sang điểm chữ và GPA
     */
    private void calculateLetterGrade() {
        if (totalScore == null) return;

        double score = totalScore.doubleValue();
        if (score >= 8.5) {
            letterGrade = "A";
            gpaPoint = new BigDecimal("4.0");
        } else if (score >= 8.0) {
            letterGrade = "B+";
            gpaPoint = new BigDecimal("3.5");
        } else if (score >= 7.0) {
            letterGrade = "B";
            gpaPoint = new BigDecimal("3.0");
        } else if (score >= 6.5) {
            letterGrade = "C+";
            gpaPoint = new BigDecimal("2.5");
        } else if (score >= 5.5) {
            letterGrade = "C";
            gpaPoint = new BigDecimal("2.0");
        } else if (score >= 5.0) {
            letterGrade = "D+";
            gpaPoint = new BigDecimal("1.5");
        } else if (score >= 4.0) {
            letterGrade = "D";
            gpaPoint = new BigDecimal("1.0");
        } else {
            letterGrade = "F";
            gpaPoint = new BigDecimal("0.0");
        }
    }

    @JsonProperty("isPassed")
    public Boolean getIsPassed() {
        if (letterGrade != null) {
            return !"F".equalsIgnoreCase(letterGrade);
        }
        if (totalScore != null) {
            return totalScore.doubleValue() >= 4.0;
        }
        return null;
    }

    @JsonProperty("score4")
    public BigDecimal getScore4() {
        return gpaPoint;
    }
}
