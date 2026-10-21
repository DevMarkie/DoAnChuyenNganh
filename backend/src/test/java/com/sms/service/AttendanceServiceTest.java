package com.sms.service;

import com.sms.dto.request.AttendanceRecordRequest;
import com.sms.dto.request.AttendanceSessionRequest;
import com.sms.entity.AttendanceRecord;
import com.sms.entity.AttendanceSession;
import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.exception.BadRequestException;
import com.sms.repository.AttendanceRecordRepository;
import com.sms.repository.AttendanceSessionRepository;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.EnrollmentRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

    @Mock private AttendanceSessionRepository attendanceSessionRepository;
    @Mock private AttendanceRecordRepository attendanceRecordRepository;
    @Mock private CourseSectionRepository courseSectionRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private EnrollmentService enrollmentService;

    @InjectMocks private AttendanceService attendanceService;

    private static CourseSection section(Long id) {
        CourseSection s = new CourseSection();
        s.setId(id);
        return s;
    }

    private static Enrollment enrollment(Long id, Long sectionId) {
        Enrollment e = new Enrollment();
        e.setId(id);
        e.setSection(section(sectionId));
        return e;
    }

    private static AttendanceSessionRequest request(Long sectionId, Long enrollmentId) {
        AttendanceRecordRequest rr = new AttendanceRecordRequest();
        rr.setEnrollmentId(enrollmentId);
        rr.setIsPresent(false);
        AttendanceSessionRequest req = new AttendanceSessionRequest();
        req.setSectionId(sectionId);
        req.setSessionDate(LocalDate.now());
        req.setRecords(List.of(rr));
        return req;
    }

    @Test
    @DisplayName("TC-SEC-ATT.1: Chặn ghi điểm danh cho enrollment thuộc lớp khác")
    void saveSession_rejects_crossSectionEnrollment() {
        CourseSection sectionA = section(100L);
        AttendanceSession saved = new AttendanceSession();
        saved.setId(1L);
        saved.setSection(sectionA);

        when(courseSectionRepository.findById(100L)).thenReturn(Optional.of(sectionA));
        when(attendanceSessionRepository.save(any())).thenReturn(saved);
        when(attendanceRecordRepository.findBySessionId(1L)).thenReturn(Collections.emptyList());
        when(enrollmentRepository.findById(999L)).thenReturn(Optional.of(enrollment(999L, 200L)));

        assertThatThrownBy(() -> attendanceService.createOrUpdateSession(10L, request(100L, 999L)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("không thuộc lớp");

        verify(attendanceRecordRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-SEC-ATT.2: Cho ghi điểm danh cho enrollment đúng lớp")
    void saveSession_allows_sameSectionEnrollment() {
        CourseSection sectionA = section(100L);
        AttendanceSession saved = new AttendanceSession();
        saved.setId(1L);
        saved.setSection(sectionA);

        when(courseSectionRepository.findById(100L)).thenReturn(Optional.of(sectionA));
        when(attendanceSessionRepository.save(any())).thenReturn(saved);
        when(attendanceRecordRepository.findBySessionId(1L)).thenReturn(Collections.emptyList());
        when(enrollmentRepository.findById(500L)).thenReturn(Optional.of(enrollment(500L, 100L)));

        assertDoesNotThrow(() -> attendanceService.createOrUpdateSession(10L, request(100L, 500L)));

        verify(attendanceRecordRepository).save(any(AttendanceRecord.class));
    }
}
