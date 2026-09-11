package com.sms.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class SubjectRequest {
    @NotBlank(message = "Mã môn không được để trống")
    private String subjectCode;

    @NotBlank(message = "Tên môn không được để trống")
    private String subjectName;

    @NotNull(message = "Số tín chỉ không được để trống")
    @Min(value = 1, message = "Số tín chỉ phải lớn hơn 0")
    @Max(value = 10, message = "Số tín chỉ không vượt quá 10")
    private Integer credits;

    private String description;

    @NotNull(message = "Khoa không được để trống")
    private Integer departmentId;
}
