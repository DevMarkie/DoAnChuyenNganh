package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roles")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Role {

    public static final String ADMIN = "ADMIN";
    public static final String ACADEMIC_STAFF = "ACADEMIC_STAFF";
    public static final String ACADEMIC_AFFAIRS = "ACADEMIC_AFFAIRS";
    public static final String LECTURER = "LECTURER";
    public static final String STUDENT = "STUDENT";
    public static final String EXAMINATION_OFFICER = "EXAMINATION_OFFICER";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 30)
    private String name;
}
