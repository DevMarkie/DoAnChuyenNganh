package com.sms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SpecialSectionCreate {
    @NotNull
    private Integer subjectId;
    @NotNull
    private Integer semesterId;
    @NotNull
    private Long lecturerId;
    @NotBlank
    private String sectionCode;
    private Integer maxStudents;
    private BigDecimal baseTuitionRate;
}
