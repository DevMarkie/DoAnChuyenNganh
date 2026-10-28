package com.sms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrationWaveRequest {

    @NotNull(message = "Học kỳ không được để trống")
    private Integer semesterId;

    @NotBlank(message = "Tên đợt đăng ký không được để trống")
    private String name;

    private String shiftName;

    private Integer cohortId;

    private Integer departmentId;

    private Integer majorId;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    private LocalDateTime startTime;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    private LocalDateTime endTime;

    private String description;

    @Builder.Default
    private Boolean isActive = true;
}
