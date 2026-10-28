package com.sms.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TuitionBatchPaymentResponse {
    private int totalSuccessStudents;
    private BigDecimal totalAmount;
    private List<ReceiptResponse> receipts;
}
