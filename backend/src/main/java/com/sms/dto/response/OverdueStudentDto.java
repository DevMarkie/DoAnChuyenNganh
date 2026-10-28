package com.sms.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class OverdueStudentDto {
    private Long studentId;
    private String studentCode;
    private String fullName;
    private String className;
    private String phone;
    private String email;
    private Integer overdueInvoiceCount;
    private BigDecimal totalOverdueAmount;
    private Long overdueDays;
    private Boolean financialHold;
    private List<Long> invoiceIds;
    private List<String> overdueSections;
}
