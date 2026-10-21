package com.sms.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class ClassRequest {
    @NotBlank(message = "Mã lớp không được để trống")
    private String code;

    @NotBlank(message = "Tên lớp không được để trống")
    private String name;

    @NotNull(message = "Khoa không được để trống")
    private Integer departmentId;

    private Integer majorId;
    private Integer cohortId;

    @NotBlank(message = "Khóa không được để trống")
    private String academicYear;
}
