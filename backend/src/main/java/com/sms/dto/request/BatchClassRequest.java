package com.sms.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class BatchClassRequest {
    @NotBlank(message = "Khóa học không được để trống (ví dụ: K17)")
    private String cohort;

    @NotBlank(message = "Năm học không được để trống (ví dụ: 2025-2026)")
    private String academicYear;

    @Min(value = 1, message = "Số lớp mỗi khoa tối thiểu là 1")
    @Max(value = 10, message = "Số lớp mỗi khoa tối đa là 10")
    private int classesPerDepartment = 2;

    private List<Integer> departmentIds;
}
