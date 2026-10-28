package com.sms.dto.request;

import com.sms.entity.GradeChangeTicket;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreateGradeAmendmentRequest {

    @NotNull(message = "studentId không được để trống")
    private Long studentId;

    @NotNull(message = "classSectionId không được để trống")
    private Long classSectionId;

    @NotNull(message = "componentType không được để trống (CC1, CC2, MIDTERM, FINAL)")
    private GradeChangeTicket.ComponentType componentType;

    @NotNull(message = "newScore không được để trống")
    @DecimalMin(value = "0.0", message = "Điểm số không được nhỏ hơn 0")
    @DecimalMax(value = "10.0", message = "Điểm số không được lớn hơn 10")
    private BigDecimal newScore;

    @NotBlank(message = "Lý do sửa điểm không được để trống")
    private String reason;

    @NotBlank(message = "Minh chứng (evidenceUrl) không được để trống")
    private String evidenceUrl;
}
