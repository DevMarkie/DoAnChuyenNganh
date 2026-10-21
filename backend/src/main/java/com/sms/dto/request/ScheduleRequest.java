package com.sms.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ScheduleRequest {

    @NotNull(message = "Lớp học phần không được để trống")
    @JsonAlias("courseSectionId")
    private Long sectionId;

    @JsonAlias("administrativeClassId")
    private Integer classId;

    @NotNull(message = "Thứ trong tuần không được để trống")
    @Min(value = 2, message = "Thứ hợp lệ từ 2 (Thứ Hai) đến 8 (Chủ Nhật)")
    @Max(value = 8, message = "Thứ hợp lệ từ 2 (Thứ Hai) đến 8 (Chủ Nhật)")
    private Integer dayOfWeek;

    @NotNull(message = "Tiết bắt đầu không được để trống")
    @Min(value = 1, message = "Tiết học từ 1 đến 12")
    @Max(value = 12, message = "Tiết học từ 1 đến 12")
    private Integer startPeriod;

    @NotNull(message = "Tiết kết thúc không được để trống")
    @Min(value = 1, message = "Tiết học từ 1 đến 12")
    @Max(value = 12, message = "Tiết học từ 1 đến 12")
    private Integer endPeriod;

    @NotBlank(message = "Phòng học không được để trống")
    private String room;

    @NotBlank(message = "Ngày bắt đầu không được để trống")
    private String startDate;

    @NotBlank(message = "Ngày kết thúc không được để trống")
    private String endDate;

    private String note;
}
