package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_service_requests")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class StudentServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "request_type", nullable = false, length = 50)
    private String requestType; // STUDENT_CONFIRMATION, TRANSCRIPT_COPY, MILITARY_DEFERRAL, LOAN_CONFIRMATION

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    @Column(columnDefinition = "TEXT")
    private String purpose;

    @Column(name = "verification_code", nullable = false, unique = true, length = 64)
    private String verificationCode;

    @Column(name = "pickup_method", nullable = false, length = 30)
    @Builder.Default
    private String pickupMethod = "ONLINE_PDF"; // ONLINE_PDF, OFFICE_PICKUP

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, PROCESSING, COMPLETED, REJECTED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private User processedBy;

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

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
