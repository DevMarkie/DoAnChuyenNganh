package com.sms.dto.response;

import com.sms.entity.Department;
import com.sms.entity.Subject;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.Comparator;
import java.util.List;

/** Non-recursive representation used by the subject catalogue API. */
@Getter
@Builder
@AllArgsConstructor
public class SubjectResponse {
    private Integer id;
    private String subjectCode;
    private String subjectName;
    private Integer credits;
    private String description;
    private DepartmentSummary department;
    private Boolean isActive;
    private List<SubjectSummary> prerequisites;

    public static SubjectResponse from(Subject subject) {
        Department department = subject.getDepartment();
        List<SubjectSummary> prerequisites = subject.getPrerequisites() == null
                ? List.of()
                : subject.getPrerequisites().stream()
                    .map(SubjectSummary::from)
                    .sorted(Comparator.comparing(SubjectSummary::getSubjectCode,
                            Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                    .toList();

        return SubjectResponse.builder()
                .id(subject.getId())
                .subjectCode(subject.getSubjectCode())
                .subjectName(subject.getSubjectName())
                .credits(subject.getCredits())
                .description(subject.getDescription())
                .department(department == null ? null : new DepartmentSummary(
                        department.getId(), department.getCode(), department.getName()))
                .isActive(subject.getIsActive())
                .prerequisites(prerequisites)
                .build();
    }

    @Getter
    @AllArgsConstructor
    public static class DepartmentSummary {
        private Integer id;
        private String code;
        private String name;
    }

    @Getter
    @AllArgsConstructor
    public static class SubjectSummary {
        private Integer id;
        private String subjectCode;
        private String subjectName;
        private Integer credits;

        public static SubjectSummary from(Subject subject) {
            return new SubjectSummary(subject.getId(), subject.getSubjectCode(),
                    subject.getSubjectName(), subject.getCredits());
        }
    }
}
