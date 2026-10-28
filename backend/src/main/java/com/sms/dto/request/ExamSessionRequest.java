package com.sms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamSessionRequest {

    @NotNull(message = "Học kỳ không được để trống")
    private Integer semesterId;

    @NotNull(message = "Môn học không được để trống")
    private Integer subjectId;

    @NotBlank(message = "Tên đợt/ca thi không được để trống")
    private String sessionName;

    @NotNull(message = "Ngày thi không được để trống")
    private LocalDate examDate;

    @NotBlank(message = "Giờ bắt đầu không được để trống")
    private String startTime;

    @NotBlank(message = "Giờ kết thúc không được để trống")
    private String endTime;
}
