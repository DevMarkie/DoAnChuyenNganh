package com.sms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Table(name = "semesters")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Semester {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "semester_code", nullable = false, unique = true, length = 20)
    private String semesterCode;

    @Column(name = "semester_name", nullable = false, length = 100)
    private String semesterName;

    @Column(name = "academic_year", nullable = false, length = 20)
    private String academicYear;

    @Column(name = "semester_number", nullable = false)
    private Integer semesterNumber;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "registration_start")
    private LocalDate registrationStart;

    @Column(name = "registration_end")
    private LocalDate registrationEnd;

    @Column(name = "is_current", nullable = false)
    private Boolean isCurrent = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SemesterStatus status = SemesterStatus.UPCOMING;

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
     * The server is the source of truth for whether students may register.
     * A registration window must be configured for the active current term.
     */
    @Transient
    public boolean isRegistrationOpen() {
        if (!Boolean.TRUE.equals(isCurrent) || status != SemesterStatus.ACTIVE
                || registrationStart == null || registrationEnd == null) {
            return false;
        }
        LocalDate today = LocalDate.now();
        return !today.isBefore(registrationStart) && !today.isAfter(registrationEnd);
    }

    public enum SemesterStatus {
        UPCOMING, ACTIVE, COMPLETED
    }
}
