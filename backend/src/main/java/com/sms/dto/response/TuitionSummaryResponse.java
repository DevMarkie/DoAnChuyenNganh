package com.sms.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TuitionSummaryResponse {
    private Long studentId;
    private String studentCode;
    private String fullName;
    private String className;
    private String majorName;
    private String departmentName;

    private Integer semesterId;
    private String semesterCode;
    private String semesterName;
    private LocalDate tuitionDeadline;
    @com.fasterxml.jackson.annotation.JsonProperty("registrationOpen")
    private Boolean isRegistrationOpen;

    private Integer totalCredits;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal unpaidAmount;
    private BigDecimal balance; // Số dư tài khoản tích lũy (Ví học phí của sinh viên)
    private Boolean isTuitionOverdue; // Cờ cảnh báo nợ học phí quá hạn
    private Boolean financialHold; // Cờ FINANCIAL_HOLD theo Quy tắc liên thông B
    private String overallStatus; // PAID, PARTIAL, UNPAID
    private LocalDate extendedDeadline;
    private String extensionReason;
    private Boolean isExtended;

    private List<InvoiceItemDto> items;

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class InvoiceItemDto {
        private Long invoiceId;
        private Long sectionId;
        private String sectionCode;
        private String subjectCode;
        private String subjectName;
        private Integer credits;
        private BigDecimal baseRate;
        private BigDecimal coefficient;
        private BigDecimal amount;
        private String status; // UNPAID, PAID, CANCELLED
        private LocalDateTime paidAt;
        private String receiptNumber;
        private LocalDate extendedDeadline;
        private String extensionReason;
    }
}
