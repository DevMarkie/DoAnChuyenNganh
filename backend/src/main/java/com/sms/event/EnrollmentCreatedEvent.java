package com.sms.event;

import com.sms.entity.Enrollment;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class EnrollmentCreatedEvent extends ApplicationEvent {
    private final Long studentId;
    private final Long sectionId;
    private final Integer semesterId;
    private final Long enrollmentId;

    public EnrollmentCreatedEvent(Object source, Long studentId, Long sectionId, Integer semesterId, Long enrollmentId) {
        super(source);
        this.studentId = studentId;
        this.sectionId = sectionId;
        this.semesterId = semesterId;
        this.enrollmentId = enrollmentId;
    }

    public EnrollmentCreatedEvent(Object source, Enrollment enrollment) {
        super(source);
        this.studentId = enrollment.getStudent() != null ? enrollment.getStudent().getId() : null;
        this.sectionId = enrollment.getSection() != null ? enrollment.getSection().getId() : null;
        this.semesterId = (enrollment.getSection() != null && enrollment.getSection().getSemester() != null)
                ? enrollment.getSection().getSemester().getId() : null;
        this.enrollmentId = enrollment.getId();
    }
}
