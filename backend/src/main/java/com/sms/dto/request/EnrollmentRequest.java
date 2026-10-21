package com.sms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class EnrollmentRequest {
    @NotNull(message = "Học phần không được để trống")
    private Long sectionId;
}
