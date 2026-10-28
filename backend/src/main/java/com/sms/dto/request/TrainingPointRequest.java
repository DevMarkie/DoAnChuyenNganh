package com.sms.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class TrainingPointRequest {

    @NotNull(message = "ID sinh viên không được để trống")
    private Long studentId;

    @NotNull(message = "Học kỳ không được để trống")
    private Integer semesterId;

    @NotNull(message = "Điểm rèn luyện không được để trống")
    @Min(value = 0, message = "Điểm rèn luyện tối thiểu là 0")
    @Max(value = 100, message = "Điểm rèn luyện tối đa là 100")
    private Integer score;

    private String notes;
}
