package com.sms.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamRoomRequest {

    @NotBlank(message = "Mã phòng thi không được để trống")
    private String roomCode;

    private String roomLocation;

    @Builder.Default
    @Min(value = 1, message = "Sức chứa phòng thi phải tối thiểu 1 thí sinh")
    private Integer capacity = 40;
}
