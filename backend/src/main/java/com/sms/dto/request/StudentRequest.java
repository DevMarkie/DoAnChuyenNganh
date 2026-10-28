package com.sms.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class StudentRequest {
    @NotBlank(message = "Mã sinh viên không được để trống")
    private String studentCode;

    private String citizenId;

    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;

    @NotBlank(message = "Ngày sinh không được để trống")
    private String dateOfBirth;

    @NotBlank(message = "Giới tính không được để trống")
    private String gender;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    private String phone;
    private String address;
    private String hometown;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String emergencyContactRelationship;

    @NotNull(message = "Lớp không được để trống")
    private Integer classId;

    private String status;
    private String password;
}
