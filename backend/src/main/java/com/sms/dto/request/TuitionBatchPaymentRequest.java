package com.sms.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TuitionBatchPaymentRequest {
    @NotNull(message = "Học kỳ không được để trống")
    private Integer semesterId;

    @NotEmpty(message = "Danh sách sinh viên thanh toán không được rỗng")
    private List<Long> studentIds;

    private String note;
}
