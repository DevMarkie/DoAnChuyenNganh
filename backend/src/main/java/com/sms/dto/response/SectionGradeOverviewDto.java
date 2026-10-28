package com.sms.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SectionGradeOverviewDto {
    private Long sectionId;
    private String sectionCode;
    private String subjectCode;
    private String subjectName;
    private Integer credits;
    private String lecturerName;
    private Integer semesterId;
    private String semesterName;
    private Integer enrolledCount;
    private Integer gradedCount;
    private Double completionRate;
    private String gradeStatus; // NOT_GRADED, IN_PROGRESS, SUBMITTED, RETURNED, PUBLISHED
    private Boolean isPublished;
    private LocalDateTime publishedAt;
    private String gradeReturnReason;
}
