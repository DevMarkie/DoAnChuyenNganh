package com.sms.dto.response;

import lombok.*;
import java.util.List;
import java.util.Map;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class DashboardResponse {
    private long totalStudents;
    private long activeStudents;
    private long graduatedStudents;
    private long suspendedStudents;
    private long totalDepartments;
    private long totalClasses;
    private long totalSubjects;
    private long totalLecturers;
    private long totalCourseSections;
    private List<Map<String, Object>> studentsByDepartment;
    private List<Map<String, Object>> studentsByStatus;
}
