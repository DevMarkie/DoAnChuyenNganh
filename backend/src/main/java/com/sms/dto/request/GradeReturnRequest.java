package com.sms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class GradeReturnRequest {
    @NotBlank(message = "Bắt buộc nhập lý do trả về bảng điểm")
    private String reason;
}
