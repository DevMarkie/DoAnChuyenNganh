package com.sms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Table(name = "schedules")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    @JsonProperty("courseSection")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "schedules"})
    private CourseSection section;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    @JsonProperty("administrativeClass")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "department"})
    private ClassEntity classEntity;

    /**
     * Thứ trong tuần: 2 = Thứ Hai, 3 = Thứ Ba, ..., 8 = Chủ Nhật
     */
    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek;

    /**
     * Tiết bắt đầu: 1 đến 12
     */
    @Column(name = "start_period", nullable = false)
    private Integer startPeriod;

    /**
     * Tiết kết thúc: 1 đến 12
     */
    @Column(name = "end_period", nullable = false)
    private Integer endPeriod;

    /**
     * Phòng học: A101, B203, P.302-A2...
     */
    @Column(nullable = false, length = 50)
    private String room;

    /**
     * Ngày bắt đầu & kết thúc kỳ học phần
     */
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    /**
     * Ghi chú: Lý thuyết, Thực hành máy...
     */
    @Column(length = 255)
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

    /**
     * Tiện ích trả về tên Thứ
     */
    public String getDayOfWeekName() {
        if (dayOfWeek == null) return "";
        return switch (dayOfWeek) {
            case 2 -> "Thứ Hai";
            case 3 -> "Thứ Ba";
            case 4 -> "Thứ Tư";
            case 5 -> "Thứ Năm";
            case 6 -> "Thứ Sáu";
            case 7 -> "Thứ Bảy";
            case 8 -> "Chủ Nhật";
            default -> "Thứ " + dayOfWeek;
        };
    }

    /**
     * Tiện ích quy đổi tiết học sang khung giờ chuẩn
     */
    @JsonProperty("periodTimeString")
    public String getTimeRange() {
        if (startPeriod == null || endPeriod == null) return "";
        String[] periodStartTimes = {
            "", "07:00", "07:50", "08:45", "09:35", "10:30", "11:20",
            "12:30", "13:20", "14:15", "15:05", "16:00", "16:50"
        };
        String[] periodEndTimes = {
            "", "07:45", "08:35", "09:30", "10:20", "11:15", "12:05",
            "13:15", "14:05", "15:00", "15:50", "16:45", "17:35"
        };
        String start = (startPeriod >= 1 && startPeriod <= 12) ? periodStartTimes[startPeriod] : "T" + startPeriod;
        String end = (endPeriod >= 1 && endPeriod <= 12) ? periodEndTimes[endPeriod] : "T" + endPeriod;
        return start + " - " + end;
    }
}
