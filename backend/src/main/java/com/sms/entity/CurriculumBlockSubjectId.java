package com.sms.entity;

import lombok.*;
import java.io.Serializable;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode
public class CurriculumBlockSubjectId implements Serializable {
    private Long blockId;
    private Integer subjectId;
}
