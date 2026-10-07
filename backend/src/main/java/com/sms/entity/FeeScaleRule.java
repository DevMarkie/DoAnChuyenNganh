package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "fee_scale_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FeeScaleRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "min_students", nullable = false)
    private Integer minStudents;

    @Column(name = "max_students", nullable = false)
    private Integer maxStudents;

    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal coefficient;
}
