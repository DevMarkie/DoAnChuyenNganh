package com.sms.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryResponse {
    private long totalStudents;
    private long totalSections;
    private long pendingAppeals;
}
