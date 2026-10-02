package com.sms.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class CourseSectionRequest {
    @NotBlank(message = "Mã học phần không được để trống")
    private String sectionCode;

    @NotNull(message = "Môn học không được để trống")
    private Integer subjectId;

    @NotNull(message = "Giảng viên không được để trống")
    private Long lecturerId;

    @NotNull(message = "Học kỳ không được để trống")
    private Integer semesterId;

    @NotNull(message = "Sĩ số tối đa không được để trống")
    @Min(value = 1, message = "Sĩ số tối đa phải lớn hơn 0")
    private Integer maxStudents;
    private String schedule;
    private String room;
    private String status;
    private Integer dayOfWeek;
    private Integer startPeriod;
    private Integer endPeriod;
    private LocalDate startDate;
    private LocalDate endDate;
}
