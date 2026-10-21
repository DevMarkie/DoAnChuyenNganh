package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "curriculum_block_subjects")
@IdClass(CurriculumBlockSubjectId.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CurriculumBlockSubject {
    @Id @Column(name = "block_id") private Long blockId;
    @Id @Column(name = "subject_id") private Integer subjectId;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "block_id", insertable = false, updatable = false) private CurriculumBlock block;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "subject_id", insertable = false, updatable = false) private Subject subject;
    @Column(name = "is_required", nullable = false) private Boolean required;
}
