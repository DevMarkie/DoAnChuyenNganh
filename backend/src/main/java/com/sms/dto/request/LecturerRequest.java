package com.sms.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class LecturerRequest {
    @NotBlank(message = "Mã giảng viên không được để trống")
    private String lecturerCode;

    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;

    private String dateOfBirth;
    private String gender;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    private String phone;

    @NotNull(message = "Khoa không được để trống")
    private Integer departmentId;

    private String degree;
    private String specialization;
    private String password;
}
