package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cohorts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Cohort {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(nullable = false, unique = true, length = 10) private String code;
    @Column(nullable = false, length = 100) private String name;
    @Column(name = "admission_year", nullable = false) private Integer admissionYear;
    @Column(name = "graduation_year") private Integer graduationYear;
    @Column(name = "is_active", nullable = false) private Boolean isActive = true;
}
