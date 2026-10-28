package com.sms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Table(name = "students")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnoreProperties({"password", "hibernateLazyInitializer"})
    private User user;

    @Column(name = "student_code", nullable = false, unique = true, length = 20)
    private String studentCode;

    @Column(name = "citizen_id", length = 20)
    private String citizenId;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Gender gender;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(length = 15)
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 200)
    private String hometown;

    @Column(name = "emergency_contact_name", length = 100)
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone", length = 20)
    private String emergencyContactPhone;

    @Column(name = "emergency_contact_relationship", length = 50)
    private String emergencyContactRelationship;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer"})
    private ClassEntity classEntity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StudentStatus status = StudentStatus.ACTIVE;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "financial_hold", nullable = false)
    private Boolean financialHold = false;

    @Column(name = "academic_warning_level", nullable = false)
    private Integer academicWarningLevel = 0;

    public boolean isFinancialHold() {
        return Boolean.TRUE.equals(financialHold);
    }

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

    public enum Gender {
        MALE, FEMALE, OTHER
    }

    public enum StudentStatus {
        ACTIVE, INACTIVE, GRADUATED, SUSPENDED, RESERVED
    }
}
