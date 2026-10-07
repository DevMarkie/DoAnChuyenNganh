package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_invoices",
        uniqueConstraints = @UniqueConstraint(name = "uq_invoice_student_section",
                columnNames = {"student_id", "section_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StudentInvoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    private CourseSection section;

    @Column(nullable = false)
    private Integer credits;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal baseRate;

    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal coefficient;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InvoiceStatus status = InvoiceStatus.UNPAID;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum InvoiceStatus { UNPAID, PAID, CANCELLED }
}
