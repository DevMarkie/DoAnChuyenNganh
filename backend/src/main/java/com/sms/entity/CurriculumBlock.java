package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "curriculum_blocks")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CurriculumBlock {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "program_id", nullable = false) private CurriculumProgram program;
    @Column(nullable = false, length = 30) private String code;
    @Column(nullable = false, length = 200) private String name;
    @Enumerated(EnumType.STRING) @Column(name = "block_type", nullable = false, length = 15) private BlockType blockType;
    @Column(name = "required_subject_count", nullable = false) private Integer requiredSubjectCount;
    @Column(name = "required_credits", nullable = false) private Integer requiredCredits;
    @Column(name = "elective_subject_count", nullable = false) private Integer electiveSubjectCount;
    @Column(name = "elective_credits", nullable = false) private Integer electiveCredits;
    @Column(name = "display_order", nullable = false) private Integer displayOrder;

    public enum BlockType { COMPULSORY, ELECTIVE }
}
