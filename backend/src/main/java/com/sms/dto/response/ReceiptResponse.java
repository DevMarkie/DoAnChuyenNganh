package com.sms.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ReceiptResponse {
    private String receiptNumber;
    private LocalDateTime paidAt;
    private String cashierName;
    private String studentCode;
    private String studentName;
    private String className;
    private String semesterName;
    private List<ReceiptItemDto> items;
    private BigDecimal totalAmount;
    private String paymentMethod;
    private String note;

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class ReceiptItemDto {
        private String subjectCode;
        private String subjectName;
        private Integer credits;
        private BigDecimal amount;
    }
}
