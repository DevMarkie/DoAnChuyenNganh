package com.sms.event;

import java.time.LocalDate;

import org.springframework.context.ApplicationEvent;

import lombok.Getter;

@Getter
public class AttendanceSavedEvent extends ApplicationEvent {
    private final Long sectionId;
    private final LocalDate sessionDate;
    private final Long recordedByUserId;

    public AttendanceSavedEvent(Object source, Long sectionId, LocalDate sessionDate, Long recordedByUserId) {
        super(source);
        this.sectionId = sectionId;
        this.sessionDate = sessionDate;
        this.recordedByUserId = recordedByUserId;
    }
}
