package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "curriculum_programs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CurriculumProgram {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "major_id", nullable = false) private Major major;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "cohort_id", nullable = false) private Cohort cohort;
    @Column(nullable = false, length = 40) private String code;
    @Column(nullable = false, length = 200) private String name;
    @Column(name = "total_credits", nullable = false) private Integer totalCredits;
    @Column(name = "is_active", nullable = false) private Boolean isActive = true;
}
