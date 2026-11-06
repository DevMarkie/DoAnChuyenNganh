package com.sms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class StaffResponse {

    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String role;
    private String roleDisplayName;
    private Integer departmentId;
    private String departmentName;
    private String departmentCode;
    private LocalDate dateOfBirth;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private String note;
}
