package com.sms.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Table(name = "grades")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Grade {

    /**
     * Activity #14 — cửa sổ ân hạn sau khi chốt: giảng viên vẫn được sửa điểm
     * trong ngần này ngày kể từ lúc chốt. Hết hạn thì bảng điểm khoá cứng, chỉ
     * Quản trị viên mới mở lại được.
     */
    public static final int EDIT_GRACE_DAYS = 7;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id", nullable = false, unique = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer"})
    private Enrollment enrollment;

    @Column(name = "cc1_score", precision = 4, scale = 2)
    private BigDecimal cc1Score;

    @Column(name = "cc2_score", precision = 4, scale = 2)
    private BigDecimal cc2Score;

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

    /** Thời điểm giảng viên chốt điểm; mốc bắt đầu đếm cửa sổ ân hạn {@link #EDIT_GRACE_DAYS} ngày. */
    @Column(name = "finalized_at")
    private LocalDateTime finalizedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "special_grade", nullable = false)
    private SpecialGrade specialGrade = SpecialGrade.NONE;

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
        if (specialGrade != null && specialGrade != SpecialGrade.NONE) {
            return;
        }
        if (cc1Score != null && cc2Score != null && midtermScore != null && finalScore != null) {
            this.totalScore = cc1Score.multiply(new BigDecimal("0.05"))
                    .add(cc2Score.multiply(new BigDecimal("0.05")))
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

        // Quy chế điểm liệt cuối kỳ (BA - Quy trình 5): "Đạt" yêu cầu Điểm TK >= 4.0
        // VÀ Điểm cuối kỳ (CK) >= 3.0. Nếu CK < 3.0 thì học phần bị trượt (F / phải
        // học lại) bất kể điểm tổng kết, nên ta ghi đè điểm chữ về F.
        if (finalScore != null && finalScore.compareTo(new BigDecimal("3.0")) < 0) {
            letterGrade = "F";
            gpaPoint = new BigDecimal("0.0");
        }
    }

    @JsonProperty("isPassed")
    public Boolean getIsPassed() {
        if (specialGrade == SpecialGrade.M) {
            return true;
        }
        if (specialGrade == SpecialGrade.V || specialGrade == SpecialGrade.I) {
            return false;
        }
        if (letterGrade != null) {
            return !"F".equalsIgnoreCase(letterGrade)
                    && (finalScore == null || finalScore.compareTo(new BigDecimal("3.0")) >= 0);
        }
        if (totalScore != null) {
            // Điểm D (>= 4.0) là đạt nếu điểm cuối kỳ không dưới 3.0.
            return totalScore.doubleValue() >= 4.0
                    && (finalScore == null || finalScore.compareTo(new BigDecimal("3.0")) >= 0);
        }
        return null;
    }

    @JsonProperty("score4")
    public BigDecimal getScore4() {
        return gpaPoint;
    }

    /**
     * true = đã quá {@link #EDIT_GRACE_DAYS} ngày kể từ khi chốt nên giảng viên
     * không còn sửa được (bảng điểm khoá cứng). Điểm đã chốt nhưng thiếu mốc
     * {@code finalizedAt} (dữ liệu cũ) cũng coi như đã khoá.
     */
    @JsonProperty("editWindowExpired")
    public boolean isEditWindowExpired() {
        if (!Boolean.TRUE.equals(isFinalized)) {
            return false;
        }
        if (finalizedAt == null) {
            return true;
        }
        return finalizedAt.plusDays(EDIT_GRACE_DAYS).isBefore(LocalDateTime.now());
    }

    public enum SpecialGrade {
        NONE, V, I, M
    }
}
