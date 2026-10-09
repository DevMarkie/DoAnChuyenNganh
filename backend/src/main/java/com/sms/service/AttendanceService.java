package com.sms.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sms.dto.request.AttendanceRecordRequest;
import com.sms.dto.request.AttendanceSessionRequest;
import com.sms.entity.AttendanceRecord;
import com.sms.entity.AttendanceSession;
import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.AttendanceRecordRepository;
import com.sms.repository.AttendanceSessionRepository;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.EnrollmentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttendanceService {

    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentService enrollmentService;

    public List<AttendanceSession> getSessionsBySection(Long sectionId) {
        return attendanceSessionRepository.findBySectionIdOrderBySessionDateDesc(sectionId);
    }

    public List<AttendanceRecord> getRecordsBySession(Long sessionId) {
        return attendanceRecordRepository.findBySessionId(sessionId);
    }

    @Transactional
    public AttendanceSession createOrUpdateSession(Long userId, AttendanceSessionRequest request) {
        enrollmentService.assertCanViewSection(userId, request.getSectionId());
        
        CourseSection section = courseSectionRepository.findById(request.getSectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));

        // Save session
        AttendanceSession session;
        if (request.getAttendanceKeyword() != null) {
            // we could check if a session for this date already exists
            List<AttendanceSession> existing = attendanceSessionRepository.findBySectionIdOrderBySessionDateDesc(request.getSectionId());
            session = existing.stream().filter(s -> s.getSessionDate().equals(request.getSessionDate())).findFirst().orElse(new AttendanceSession());
        } else {
            session = new AttendanceSession();
        }
        
        session.setSection(section);
        session.setSessionDate(request.getSessionDate());
        session.setAttendanceKeyword(request.getAttendanceKeyword());
        session = attendanceSessionRepository.save(session);

        // Save records if provided
        if (request.getRecords() != null && !request.getRecords().isEmpty()) {
            List<AttendanceRecord> existingRecords = attendanceRecordRepository.findBySessionId(session.getId());
            Map<Long, AttendanceRecord> recordMap = existingRecords.stream()
                .collect(Collectors.toMap(r -> r.getEnrollment().getId(), r -> r));

            for (AttendanceRecordRequest rr : request.getRecords()) {
                AttendanceRecord record = recordMap.get(rr.getEnrollmentId());
                if (record == null) {
                    record = new AttendanceRecord();
                    record.setSession(session);
                    Enrollment enrollment = enrollmentRepository.findById(rr.getEnrollmentId())
                        .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found"));
                    record.setEnrollment(enrollment);
                }
                record.setIsPresent(rr.getIsPresent());
                attendanceRecordRepository.save(record);
            }
        }

        return session;
    }
}
