package com.sms.service;

import com.sms.dto.request.AttendanceRecordRequest;
import com.sms.dto.request.AttendanceSessionRequest;
import com.sms.dto.request.AttendanceStartRequest;
import com.sms.dto.request.StudentCheckInRequest;
import com.sms.dto.response.AttendanceLiveSessionResponse;
import com.sms.entity.AttendanceRecord;
import com.sms.entity.AttendanceSession;
import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.entity.Student;
import com.sms.exception.BadRequestException;
import com.sms.repository.AttendanceRecordRepository;
import com.sms.repository.AttendanceSessionRepository;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.EnrollmentRepository;
import com.sms.repository.StudentRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
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
    @Mock private StudentRepository studentRepository;

    @InjectMocks private AttendanceService attendanceService;

    private static CourseSection section(Long id) {
        CourseSection s = new CourseSection();
        s.setId(id);
        s.setSectionCode("IT301-01");
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
        when(attendanceSessionRepository.findBySectionIdAndSessionDate(100L, LocalDate.now()))
                .thenReturn(Optional.of(saved));
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
        when(attendanceSessionRepository.findBySectionIdAndSessionDate(100L, LocalDate.now()))
                .thenReturn(Optional.of(saved));
        when(attendanceSessionRepository.save(any())).thenReturn(saved);
        when(attendanceRecordRepository.findBySessionId(1L)).thenReturn(Collections.emptyList());
        when(enrollmentRepository.findById(500L)).thenReturn(Optional.of(enrollment(500L, 100L)));

        assertDoesNotThrow(() -> attendanceService.createOrUpdateSession(10L, request(100L, 500L)));

        verify(attendanceRecordRepository).save(any(AttendanceRecord.class));
    }

    @Test
    @DisplayName("TC-ATT-START.1: Giảng viên bắt đầu phiên điểm danh tạo mã thành công")
    void startSession_createsOpenSession() {
        CourseSection section = section(101L);
        when(courseSectionRepository.findById(101L)).thenReturn(Optional.of(section));
        when(attendanceSessionRepository.findBySectionIdAndSessionDate(eq(101L), any(LocalDate.class)))
                .thenReturn(Optional.empty());
        when(attendanceSessionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(enrollmentRepository.findActiveBySectionId(101L)).thenReturn(Collections.emptyList());

        AttendanceStartRequest startReq = new AttendanceStartRequest();
        startReq.setSectionId(101L);
        startReq.setDurationMinutes(10);
        startReq.setCustomKeyword("TEST99");

        AttendanceLiveSessionResponse resp = attendanceService.startSession(5L, startReq);

        assertThat(resp).isNotNull();
        assertThat(resp.getAttendanceKeyword()).isEqualTo("TEST99");
        assertThat(resp.getStatus()).isEqualTo("OPEN");
        verify(attendanceSessionRepository).save(any(AttendanceSession.class));
    }

    @Test
    @DisplayName("TC-ATT-CHECKIN.1: Sinh viên nhập đúng mã điểm danh thành công")
    void checkIn_success() {
        Student student = new Student();
        student.setId(55L);
        when(studentRepository.findByUserId(20L)).thenReturn(Optional.of(student));

        CourseSection section = section(101L);
        AttendanceSession session = new AttendanceSession();
        session.setId(1L);
        session.setSection(section);
        session.setSessionDate(LocalDate.now());
        session.setAttendanceKeyword("ABCD12");
        session.setStatus("OPEN");

        Enrollment enrollment = enrollment(77L, 101L);
        enrollment.setStudent(student);

        when(attendanceSessionRepository.findByAttendanceKeywordAndStatusAndSessionDate(eq("ABCD12"), eq("OPEN"), any(LocalDate.class)))
                .thenReturn(List.of(session));
        when(enrollmentRepository.findByStudentIdAndSectionId(55L, 101L))
                .thenReturn(Optional.of(enrollment));
        when(attendanceRecordRepository.findBySessionIdAndEnrollmentId(1L, 77L))
                .thenReturn(Optional.empty());

        StudentCheckInRequest checkInReq = new StudentCheckInRequest();
        checkInReq.setCode("abcd12"); // lowercase check

        Map<String, Object> res = attendanceService.checkIn(20L, checkInReq);

        assertThat(res.get("message")).toString().contains("thành công");
        verify(attendanceRecordRepository).save(argThat(r -> r.getIsPresent().equals(true)));
    }

    @Test
    @DisplayName("TC-ATT-CHECKIN.2: Chặn điểm danh khi mã sai hoặc không thuộc lớp")
    void checkIn_rejects_wrongCode() {
        Student student = new Student();
        student.setId(55L);
        when(studentRepository.findByUserId(20L)).thenReturn(Optional.of(student));
        when(attendanceSessionRepository.findByAttendanceKeywordAndStatusAndSessionDate(eq("WRONG1"), eq("OPEN"), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        StudentCheckInRequest checkInReq = new StudentCheckInRequest();
        checkInReq.setCode("WRONG1");

        assertThatThrownBy(() -> attendanceService.checkIn(20L, checkInReq))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Mã điểm danh không đúng");
    }

    @Test
    @DisplayName("TC-ATT-CHECKIN.3: Chặn điểm danh khi mã đã hết hạn")
    void checkIn_rejects_expiredSession() {
        Student student = new Student();
        student.setId(55L);
        when(studentRepository.findByUserId(20L)).thenReturn(Optional.of(student));

        CourseSection section = section(101L);
        AttendanceSession session = new AttendanceSession();
        session.setId(1L);
        session.setSection(section);
        session.setSessionDate(LocalDate.now());
        session.setAttendanceKeyword("EXP123");
        session.setStatus("OPEN");
        session.setExpiresAt(LocalDateTime.now().minusMinutes(2)); // expired

        Enrollment enrollment = enrollment(77L, 101L);
        enrollment.setStudent(student);

        when(attendanceSessionRepository.findByAttendanceKeywordAndStatusAndSessionDate(eq("EXP123"), eq("OPEN"), any(LocalDate.class)))
                .thenReturn(List.of(session));
        when(enrollmentRepository.findByStudentIdAndSectionId(55L, 101L))
                .thenReturn(Optional.of(enrollment));

        StudentCheckInRequest checkInReq = new StudentCheckInRequest();
        checkInReq.setCode("EXP123");

        assertThatThrownBy(() -> attendanceService.checkIn(20L, checkInReq))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("hết thời gian hiệu lực");
    }
}
