package com.sms;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.entity.Schedule;
import com.sms.entity.Semester;
import com.sms.dto.request.ScheduleRequest;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class ApiSerializationTests {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void enrollmentAndScheduleUseTheFrontendPropertyNames() throws Exception {
        CourseSection courseSection = new CourseSection();
        courseSection.setId(12L);
        courseSection.setCurrentStudents(5);

        Enrollment enrollment = new Enrollment();
        enrollment.setSection(courseSection);
        JsonNode enrollmentJson = objectMapper.readTree(objectMapper.writeValueAsBytes(enrollment));

        assertThat(enrollmentJson.has("courseSection")).isTrue();
        assertThat(enrollmentJson.has("section")).isFalse();
        assertThat(enrollmentJson.path("courseSection").path("currentStudents").asInt()).isEqualTo(5);
        assertThat(enrollmentJson.path("courseSection").has("enrolledCount")).isFalse();

        Schedule schedule = new Schedule();
        schedule.setSection(courseSection);
        schedule.setStartPeriod(1);
        schedule.setEndPeriod(3);
        JsonNode scheduleJson = objectMapper.readTree(objectMapper.writeValueAsBytes(schedule));

        assertThat(scheduleJson.has("courseSection")).isTrue();
        assertThat(scheduleJson.has("section")).isFalse();
        assertThat(scheduleJson.has("administrativeClass")).isTrue();
        assertThat(scheduleJson.has("classEntity")).isFalse();
        assertThat(scheduleJson.path("periodTimeString").asText()).isEqualTo("07:00 - 09:30");
        assertThat(scheduleJson.has("timeRange")).isFalse();

        ScheduleRequest scheduleRequest = objectMapper.readValue("""
                {"courseSectionId": 12, "administrativeClassId": 4}
                """, ScheduleRequest.class);
        assertThat(scheduleRequest.getSectionId()).isEqualTo(12L);
        assertThat(scheduleRequest.getClassId()).isEqualTo(4);
    }

    @Test
    void registrationIsOnlyOpenForTheActiveCurrentSemesterWithinItsWindow() {
        Semester semester = new Semester();
        semester.setIsCurrent(true);
        semester.setStatus(Semester.SemesterStatus.ACTIVE);
        semester.setRegistrationStart(LocalDate.now().minusDays(1));
        semester.setRegistrationEnd(LocalDate.now().plusDays(1));

        assertThat(semester.isRegistrationOpen()).isTrue();

        semester.setStatus(Semester.SemesterStatus.COMPLETED);
        assertThat(semester.isRegistrationOpen()).isFalse();
    }
}
