package com.sms.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class TuitionPaymentRequest {
    @NotNull(message = "ID sinh viên không được để trống")
    private Long studentId;

    @NotNull(message = "Học kỳ không được để trống")
    private Integer semesterId;

    @NotEmpty(message = "Danh sách hóa đơn thanh toán không được rỗng")
    private List<Long> invoiceIds;

    private String note;
}
