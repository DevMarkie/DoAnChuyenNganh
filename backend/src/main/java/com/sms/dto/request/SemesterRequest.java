package com.sms.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class SemesterRequest {
    @NotBlank(message = "Mã học kỳ không được để trống")
    private String semesterCode;

    @NotBlank(message = "Tên học kỳ không được để trống")
    private String semesterName;

    @NotBlank(message = "Năm học không được để trống")
    private String academicYear;

    @NotNull(message = "Số học kỳ không được để trống")
    private Integer semesterNumber;

    @NotBlank(message = "Ngày bắt đầu không được để trống")
    private String startDate;

    @NotBlank(message = "Ngày kết thúc không được để trống")
    private String endDate;

    private String registrationStart;
    private String registrationEnd;
    private Boolean isCurrent;
    private String status;
}
