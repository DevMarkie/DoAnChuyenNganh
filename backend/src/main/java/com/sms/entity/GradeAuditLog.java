package com.sms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Table(name = "grade_audit_logs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class GradeAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer"})
    private GradeChangeTicket ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "user"})
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grade_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer"})
    private Grade grade;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_room_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer"})
    private ExamRoom examRoom;

    @Column(name = "component", nullable = false, length = 20)
    @Builder.Default
    private String component = "FINAL";

    @Column(name = "old_score", precision = 4, scale = 2)
    private BigDecimal oldScore;

    @Column(name = "new_score", precision = 4, scale = 2)
    private BigDecimal newScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "old_special_grade", length = 10)
    private Grade.SpecialGrade oldSpecialGrade;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_special_grade", length = 10)
    private Grade.SpecialGrade newSpecialGrade;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "password"})
    private User changedBy;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
