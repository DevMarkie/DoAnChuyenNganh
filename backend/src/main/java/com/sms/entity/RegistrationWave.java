package com.sms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "registration_waves")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RegistrationWave {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer"})
    private Semester semester;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "shift_name", length = 100)
    private String shiftName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cohort_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer"})
    private Cohort cohort;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer"})
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "major_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer"})
    private Major major;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isActive == null) {
            isActive = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean isCurrentlyActive() {
        if (!Boolean.TRUE.equals(isActive) || startTime == null || endTime == null) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        return !now.isBefore(startTime) && !now.isAfter(endTime);
    }

    public boolean matchesStudent(Integer studentCohortId, Integer studentDepartmentId, Integer studentMajorId) {
        if (cohort != null && (studentCohortId == null || !cohort.getId().equals(studentCohortId))) {
            return false;
        }
        if (department != null && (studentDepartmentId == null || !department.getId().equals(studentDepartmentId))) {
            return false;
        }
        if (major != null && (studentMajorId == null || !major.getId().equals(studentMajorId))) {
            return false;
        }
        return true;
    }
}
