package com.sms.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrationWaveResponse {
    private Long id;
    private Integer semesterId;
    private String semesterName;
    private String name;
    private Integer cohortId;
    private String cohortCode;
    private String cohortName;
    private Integer departmentId;
    private String departmentName;
    private Integer majorId;
    private String majorCode;
    private String majorName;
    private String shiftName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String description;
    private Boolean isActive;
    private boolean isCurrent;
    private String statusText;
    private LocalDateTime createdAt;
}
