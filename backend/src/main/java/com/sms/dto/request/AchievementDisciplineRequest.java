package com.sms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class AchievementDisciplineRequest {

    @NotNull(message = "ID sinh viên không được để trống")
    private Long studentId;

    private Integer semesterId;

    @NotBlank(message = "Loại hồ sơ (REWARD/DISCIPLINE) không được để trống")
    private String type;

    @NotBlank(message = "Số quyết định không được để trống")
    private String decisionNumber;

    @NotBlank(message = "Ngày ban hành không được để trống")
    private String issueDate;

    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    private String description;
    private String level;
}
