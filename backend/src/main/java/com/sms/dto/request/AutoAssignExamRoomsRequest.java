package com.sms.dto.request;

import jakarta.validation.constraints.Min;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutoAssignExamRoomsRequest {

    @Builder.Default
    private String roomPrefix = "P";

    @Builder.Default
    @Min(value = 5, message = "Số lượng thí sinh mỗi phòng tối thiểu 5")
    private Integer studentsPerRoom = 35;

    @Builder.Default
    @Min(value = 1, message = "Số phòng bắt đầu tối thiểu là 1")
    private Integer startRoomNumber = 1;

    @Builder.Default
    private String locationPrefix = "Giảng đường A2 - Phòng ";
}
