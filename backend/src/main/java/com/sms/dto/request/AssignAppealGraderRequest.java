package com.sms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class AssignAppealGraderRequest {
    @NotNull(message = "Vui lòng chọn giảng viên chấm độc lập")
    private Long lecturerId;
}
