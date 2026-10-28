package com.sms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Table(name = "student_invoices")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class StudentInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "user"})
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer"})
    private CourseSection section;

    @Column(nullable = false)
    private Integer credits = 3;

    @Column(name = "base_rate", nullable = false, precision = 12, scale = 2)
    private BigDecimal baseRate = new BigDecimal("450000.00");

    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal coefficient = BigDecimal.ONE;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InvoiceStatus status = InvoiceStatus.UNPAID;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "paid_method", length = 30)
    private String paidMethod = "CASH";

    @Column(name = "receipt_number", length = 50)
    private String receiptNumber;

    @Column(name = "cashier_user_id")
    private Long cashierUserId;

    @Column(name = "extended_deadline")
    private LocalDate extendedDeadline;

    @Column(name = "extension_reason")
    private String extensionReason;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public enum InvoiceStatus {
        UNPAID, PAID, CANCELLED
    }
}
