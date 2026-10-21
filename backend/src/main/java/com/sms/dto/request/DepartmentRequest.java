package com.sms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class DepartmentRequest {
    @NotBlank(message = "Mã khoa không được để trống")
    private String code;

    @NotBlank(message = "Tên khoa không được để trống")
    private String name;

    private String description;
}
