package com.sms.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sms.dto.request.AttendanceRecordRequest;
import com.sms.dto.request.AttendanceSessionRequest;
import com.sms.dto.request.AttendanceStartRequest;
import com.sms.dto.request.StudentCheckInRequest;
import com.sms.dto.response.AttendanceLiveSessionResponse;
import com.sms.dto.response.StudentTodayAttendanceResponse;
import com.sms.entity.AttendanceRecord;
import com.sms.entity.AttendanceSession;
import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.entity.Student;
import com.sms.event.AttendanceSavedEvent;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.AttendanceRecordRepository;
import com.sms.repository.AttendanceSessionRepository;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.EnrollmentRepository;
import com.sms.repository.StudentRepository;

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
    private final StudentRepository studentRepository;
    private final ApplicationEventPublisher eventPublisher;

    public List<AttendanceSession> getSessionsBySection(Long sectionId) {
        return attendanceSessionRepository.findBySectionIdOrderBySessionDateDesc(sectionId);
    }

    public List<AttendanceRecord> getRecordsBySession(Long userId, Long sessionId) {
        AttendanceSession session = attendanceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy buổi điểm danh"));
        enrollmentService.assertCanViewSection(userId, session.getSection().getId());
        return attendanceRecordRepository.findBySessionId(sessionId);
    }

    @Transactional
    public AttendanceSession createOrUpdateSession(Long userId, AttendanceSessionRequest request) {
        enrollmentService.assertCanViewSection(userId, request.getSectionId());
        
        CourseSection section = courseSectionRepository.findById(request.getSectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));

        AttendanceSession session = attendanceSessionRepository
                .findBySectionIdAndSessionDate(request.getSectionId(), request.getSessionDate())
                .orElse(new AttendanceSession());
        
        session.setSection(section);
        session.setSessionDate(request.getSessionDate());
        if (request.getAttendanceKeyword() != null) {
            session.setAttendanceKeyword(request.getAttendanceKeyword());
        }
        session.setStatus(request.getStatus() != null ? request.getStatus() : "SAVED");
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
                    if (!section.getId().equals(enrollment.getSection().getId())) {
                        throw new BadRequestException("Dòng điểm danh không thuộc lớp học phần này");
                    }
                    record.setEnrollment(enrollment);
                }
                record.setIsPresent(Boolean.TRUE.equals(rr.getIsPresent()));
                attendanceRecordRepository.save(record);
            }

            // Kích hoạt Quy tắc liên thông A (Cross-cutting Rule Engine)
            if (eventPublisher != null) {
                eventPublisher.publishEvent(new AttendanceSavedEvent(this, section.getId(), session.getSessionDate(), userId));
            }
        }

        return session;
    }

    @Transactional
    public AttendanceLiveSessionResponse startSession(Long userId, AttendanceStartRequest request) {
        enrollmentService.assertCanViewSection(userId, request.getSectionId());

        CourseSection section = courseSectionRepository.findById(request.getSectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));

        LocalDate today = LocalDate.now();
        String keyword = (request.getCustomKeyword() != null && !request.getCustomKeyword().isBlank())
                ? request.getCustomKeyword().trim().toUpperCase()
                : generateRandomCode(6);

        LocalDateTime expiresAt = (request.getDurationMinutes() != null && request.getDurationMinutes() > 0)
                ? LocalDateTime.now().plusMinutes(request.getDurationMinutes())
                : null;

        AttendanceSession session = attendanceSessionRepository
                .findBySectionIdAndSessionDate(request.getSectionId(), today)
                .orElse(new AttendanceSession());

        session.setSection(section);
        session.setSessionDate(today);
        session.setAttendanceKeyword(keyword);
        session.setStatus("OPEN");
        session.setExpiresAt(expiresAt);
        session = attendanceSessionRepository.save(session);
        return buildLiveSessionResponse(section, session, today);
    }

    public AttendanceLiveSessionResponse getLiveSession(Long userId, Long sectionId) {
        enrollmentService.assertCanViewSection(userId, sectionId);

        CourseSection section = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));

        LocalDate today = LocalDate.now();
        AttendanceSession session = attendanceSessionRepository
                .findBySectionIdAndSessionDate(sectionId, today)
                .orElse(null);

        return buildLiveSessionResponse(section, session, today);
    }

    private AttendanceLiveSessionResponse buildLiveSessionResponse(
            CourseSection section, AttendanceSession session, LocalDate today) {
        List<Enrollment> enrollments = enrollmentRepository.findActiveBySectionId(section.getId());
        Map<Long, Boolean> presentMap = new HashMap<>();

        if (session != null && session.getId() != null) {
            List<AttendanceRecord> records = attendanceRecordRepository.findBySessionId(session.getId());
            records.forEach(r -> presentMap.put(r.getEnrollment().getId(), r.getIsPresent()));
        }

        List<AttendanceLiveSessionResponse.StudentAttendanceItem> studentItems = enrollments.stream().map(e -> {
            Student st = e.getStudent();
            boolean isPresent = presentMap.getOrDefault(e.getId(), false);
            return AttendanceLiveSessionResponse.StudentAttendanceItem.builder()
                    .enrollmentId(e.getId())
                    .studentId(st != null ? st.getId() : null)
                    .studentCode(st != null ? st.getStudentCode() : "")
                    .fullName(st != null ? st.getFullName() : "")
                    .className(st != null && st.getClassEntity() != null ? st.getClassEntity().getName() : "")
                    .present(isPresent)
                    .attendanceStatus(e.getAttendanceStatus() != null ? e.getAttendanceStatus().name() : "QUALIFIED")
                    .disqualified(e.getAttendanceStatus() == Enrollment.AttendanceStatus.DISQUALIFIED)
                    .build();
        }).collect(Collectors.toList());

        int presentCount = (int) studentItems.stream().filter(AttendanceLiveSessionResponse.StudentAttendanceItem::isPresent).count();
        int absentCount = studentItems.size() - presentCount;

        return AttendanceLiveSessionResponse.builder()
                .sessionId(session != null ? session.getId() : null)
                .sectionId(section.getId())
                .sectionCode(section.getSectionCode())
                .subjectName(section.getSubject() != null ? section.getSubject().getSubjectName() : "")
                .room(section.getRoom())
                .sessionDate(today)
                .attendanceKeyword(session != null ? session.getAttendanceKeyword() : null)
                .status(session != null && session.getStatus() != null ? session.getStatus() : "NOT_STARTED")
                .expiresAt(session != null ? session.getExpiresAt() : null)
                .totalStudents(studentItems.size())
                .presentCount(presentCount)
                .absentCount(absentCount)
                .students(studentItems)
                .build();
    }

    @Transactional
    public Map<String, Object> checkIn(Long userId, StudentCheckInRequest request) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin sinh viên"));

        String code = request.getCode() != null ? request.getCode().trim().toUpperCase() : "";
        if (code.isEmpty()) {
            throw new BadRequestException("Mã điểm danh không được để trống");
        }

        LocalDate today = LocalDate.now();
        List<AttendanceSession> openSessions = attendanceSessionRepository.findByAttendanceKeywordAndStatusAndSessionDate(code, "OPEN", today);

        AttendanceSession matchedSession = null;
        Enrollment matchedEnrollment = null;

        for (AttendanceSession s : openSessions) {
            Optional<Enrollment> enOpt = enrollmentRepository.findByStudentIdAndSectionId(student.getId(), s.getSection().getId());
            if (enOpt.isPresent() && enOpt.get().getStatus() != Enrollment.EnrollmentStatus.CANCELLED) {
                matchedSession = s;
                matchedEnrollment = enOpt.get();
                break;
            }
        }

        if (matchedSession == null) {
            throw new BadRequestException("Mã điểm danh không đúng hoặc bạn không thuộc lớp học này");
        }

        if (matchedSession.getExpiresAt() != null && LocalDateTime.now().isAfter(matchedSession.getExpiresAt())) {
            throw new BadRequestException("Mã điểm danh đã hết thời gian hiệu lực");
        }

        AttendanceRecord record = attendanceRecordRepository
                .findBySessionIdAndEnrollmentId(matchedSession.getId(), matchedEnrollment.getId())
                .orElse(new AttendanceRecord());

        record.setSession(matchedSession);
        record.setEnrollment(matchedEnrollment);
        record.setIsPresent(true);
        attendanceRecordRepository.save(record);

        // Kích hoạt Quy tắc liên thông A để cập nhật tỷ lệ
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new AttendanceSavedEvent(this, matchedSession.getSection().getId(), matchedSession.getSessionDate(), userId));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("sectionId", matchedSession.getSection().getId());
        result.put("sectionCode", matchedSession.getSection().getSectionCode());
        result.put("subjectName", matchedSession.getSection().getSubject() != null ? matchedSession.getSection().getSubject().getSubjectName() : "");
        result.put("message", "Điểm danh thành công! Bạn đã được ghi nhận có mặt.");
        return result;
    }

    public List<StudentTodayAttendanceResponse> getStudentTodayAttendance(Long userId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin sinh viên"));

        List<Enrollment> enrollments = enrollmentRepository.findAllByStudentIdWithDetails(student.getId());
        List<Enrollment> activeEnrollments = enrollments.stream()
                .filter(e -> e.getStatus() != Enrollment.EnrollmentStatus.CANCELLED)
                .toList();
        if (activeEnrollments.isEmpty()) {
            return List.of();
        }

        LocalDate today = LocalDate.now();
        List<Long> sectionIds = activeEnrollments.stream()
                .map(e -> e.getSection().getId())
                .toList();

        List<AttendanceSession> sessions = attendanceSessionRepository.findBySectionIdInAndSessionDate(sectionIds, today);
        Map<Long, AttendanceSession> sessionBySectionId = sessions.stream()
                .collect(Collectors.toMap(s -> s.getSection().getId(), s -> s, (first, second) -> first));

        List<Long> sessionIds = sessions.stream().map(AttendanceSession::getId).toList();
        Map<String, Boolean> recordMap = new HashMap<>();
        if (!sessionIds.isEmpty()) {
            List<AttendanceRecord> records = attendanceRecordRepository.findBySessionIdIn(sessionIds);
            for (AttendanceRecord r : records) {
                if (r.getSession() != null && r.getEnrollment() != null) {
                    recordMap.put(r.getSession().getId() + "_" + r.getEnrollment().getId(), r.getIsPresent());
                }
            }
        }

        List<StudentTodayAttendanceResponse> responses = new ArrayList<>();
        for (Enrollment e : activeEnrollments) {
            CourseSection sec = e.getSection();
            AttendanceSession sess = sessionBySectionId.get(sec.getId());

            String sessionStatus = "NOT_STARTED";
            Boolean isPresent = null;
            LocalDateTime expiresAt = null;

            if (sess != null) {
                sessionStatus = sess.getStatus() != null ? sess.getStatus() : "OPEN";
                expiresAt = sess.getExpiresAt();

                Boolean recorded = recordMap.get(sess.getId() + "_" + e.getId());
                if (recorded != null) {
                    isPresent = recorded;
                } else if ("SAVED".equals(sessionStatus)) {
                    isPresent = false;
                }
            }

            responses.add(StudentTodayAttendanceResponse.builder()
                    .sectionId(sec.getId())
                    .sectionCode(sec.getSectionCode())
                    .subjectName(sec.getSubject() != null ? sec.getSubject().getSubjectName() : "")
                    .sessionDate(today)
                    .sessionStatus(sessionStatus)
                    .isPresent(isPresent)
                    .expiresAt(expiresAt)
                    .build());
        }

        return responses;
    }

    private String generateRandomCode(int length) {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        ThreadLocalRandom rnd = ThreadLocalRandom.current();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
