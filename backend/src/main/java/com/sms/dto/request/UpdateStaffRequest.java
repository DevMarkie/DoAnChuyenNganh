package com.sms.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateStaffRequest {

    @Size(max = 100, message = "Họ và tên tối đa 100 ký tự")
    private String fullName;

    @Email(message = "Email không đúng định dạng")
    private String email;

    private String roleName;

    private Integer departmentId;

    private LocalDate dateOfBirth;

    private Boolean isActive;
}
