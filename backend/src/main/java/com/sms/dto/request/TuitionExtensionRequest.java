package com.sms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class TuitionExtensionRequest {
    @NotNull(message = "ID sinh viên không được để trống")
    private Long studentId;

    @NotNull(message = "Học kỳ không được để trống")
    private Integer semesterId;

    private Integer days = 7;

    private String reason;
}
