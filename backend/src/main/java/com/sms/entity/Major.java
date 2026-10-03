package com.sms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "majors")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Major {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(nullable = false, unique = true, length = 20) private String code;
    @Column(nullable = false, length = 150) private String name;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "department_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer"}) private Department department;
    @Column(name = "is_active", nullable = false) private Boolean isActive = true;
}
