package com.sms.service;

import com.sms.dto.request.*;
import com.sms.dto.response.*;
import com.sms.entity.*;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExamService {

    private final ExamSessionRepository examSessionRepository;
    private final ExamRoomRepository examRoomRepository;
    private final ExamRosterRepository examRosterRepository;
    private final GradeAuditLogRepository gradeAuditLogRepository;
    private final SemesterRepository semesterRepository;
    private final SubjectRepository subjectRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final GradeRepository gradeRepository;
    private final UserRepository userRepository;

    // ==========================================
    // EXAM SESSION CRUD
    // ==========================================

    @Transactional
    public ExamSessionResponse createSession(ExamSessionRequest req) {
        Semester semester = semesterRepository.findById(req.getSemesterId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học kỳ: " + req.getSemesterId()));

        Subject subject = subjectRepository.findById(req.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy môn học: " + req.getSubjectId()));

        ExamSession session = ExamSession.builder()
                .semester(semester)
                .subject(subject)
                .sessionName(req.getSessionName())
                .examDate(req.getExamDate())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .build();

        ExamSession saved = examSessionRepository.save(session);
        return mapToSessionResponse(saved);
    }

    public List<ExamSessionResponse> getSessionsBySemester(Integer semesterId) {
        return examSessionRepository.findBySemesterId(semesterId).stream()
                .map(this::mapToSessionResponse)
                .collect(Collectors.toList());
    }

    public ExamSessionResponse getSessionById(Long sessionId) {
        ExamSession session = examSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ca thi: " + sessionId));
        return mapToSessionResponse(session);
    }

    @Transactional
    public void deleteSession(Long sessionId) {
        ExamSession session = examSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ca thi: " + sessionId));
        List<ExamRoom> rooms = examRoomRepository.findByExamSessionId(sessionId);
        for (ExamRoom r : rooms) {
            examRosterRepository.deleteByExamRoomId(r.getId());
            examRoomRepository.delete(r);
        }
        examSessionRepository.delete(session);
    }

    // ==========================================
    // EXAM ROOM CRUD & AUTO ASSIGNMENT
    // ==========================================

    @Transactional
    public ExamRoomResponse createRoom(Long sessionId, ExamRoomRequest req) {
        ExamSession session = examSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ca thi: " + sessionId));

        examRoomRepository.findByExamSessionIdAndRoomCode(sessionId, req.getRoomCode())
                .ifPresent(r -> {
                    throw new BadRequestException("Phòng thi " + req.getRoomCode() + " đã tồn tại trong ca thi này");
                });

        ExamRoom room = ExamRoom.builder()
                .examSession(session)
                .roomCode(req.getRoomCode())
                .roomLocation(req.getRoomLocation() != null ? req.getRoomLocation() : "Giảng đường A2")
                .capacity(req.getCapacity() != null ? req.getCapacity() : 40)
                .status(ExamRoomStatus.SCHEDULED)
                .build();

        ExamRoom saved = examRoomRepository.save(room);
        return mapToRoomResponse(saved);
    }

    public List<ExamRoomResponse> getRoomsBySession(Long sessionId) {
        return examRoomRepository.findByExamSessionId(sessionId).stream()
                .map(this::mapToRoomResponse)
                .collect(Collectors.toList());
    }

    public ExamRoomResponse getRoomById(Long roomId) {
        ExamRoom room = examRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng thi: " + roomId));
        return mapToRoomResponse(room);
    }

    @Transactional
    public void deleteRoom(Long roomId) {
        ExamRoom room = examRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng thi: " + roomId));
        examRosterRepository.deleteByExamRoomId(roomId);
        examRoomRepository.delete(room);
    }

    /**
     * Tự động gom sinh viên đăng ký môn học trong kỳ, tạo phòng thi và cấp Số báo danh (SBD) liên tục.
     */
    @Transactional
    public List<ExamRoomResponse> autoAssignRooms(Long sessionId, AutoAssignExamRoomsRequest req) {
        ExamSession session = examSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ca thi: " + sessionId));

        List<Enrollment> enrollments = enrollmentRepository.findActiveBySemesterIdAndSubjectId(
                session.getSemester().getId(), session.getSubject().getId()).stream()
                .filter(e -> e.getAttendanceStatus() != Enrollment.AttendanceStatus.DISQUALIFIED)
                .toList();

        if (enrollments.isEmpty()) {
            throw new BadRequestException("Không có sinh viên đủ điều kiện dự thi môn học "
                    + session.getSubject().getSubjectCode() + " trong học kỳ này");
        }

        // Xóa các phòng thi và danh sách cũ nếu có
        List<ExamRoom> existingRooms = examRoomRepository.findByExamSessionId(sessionId);
        for (ExamRoom r : existingRooms) {
            examRosterRepository.deleteByExamRoomId(r.getId());
            examRoomRepository.delete(r);
        }

        int studentsPerRoom = (req.getStudentsPerRoom() != null && req.getStudentsPerRoom() > 0)
                ? req.getStudentsPerRoom() : 35;
        String roomPrefix = (req.getRoomPrefix() != null && !req.getRoomPrefix().isBlank())
                ? req.getRoomPrefix().trim() : "P";
        String locationPrefix = (req.getLocationPrefix() != null && !req.getLocationPrefix().isBlank())
                ? req.getLocationPrefix().trim() : "Giảng đường A2 - Phòng ";
        int startRoomNumber = (req.getStartRoomNumber() != null && req.getStartRoomNumber() > 0)
                ? req.getStartRoomNumber() : 1;

        int totalStudents = enrollments.size();
        int numRooms = (int) Math.ceil((double) totalStudents / studentsPerRoom);

        List<ExamRoom> createdRooms = new ArrayList<>();
        List<ExamRoster> allRosters = new ArrayList<>();

        int studentIdx = 0;
        String subjectCode = session.getSubject().getSubjectCode();

        for (int r = 0; r < numRooms; r++) {
            int currentRoomNum = startRoomNumber + r;
            String roomCode = String.format("%s.%02d", roomPrefix, currentRoomNum);
            String roomLocation = locationPrefix + currentRoomNum;

            ExamRoom examRoom = ExamRoom.builder()
                    .examSession(session)
                    .roomCode(roomCode)
                    .roomLocation(roomLocation)
                    .capacity(studentsPerRoom)
                    .status(ExamRoomStatus.SCHEDULED)
                    .build();
            examRoom = examRoomRepository.save(examRoom);
            createdRooms.add(examRoom);

            int studentsInThisRoom = Math.min(studentsPerRoom, totalStudents - studentIdx);
            for (int s = 0; s < studentsInThisRoom; s++) {
                Enrollment e = enrollments.get(studentIdx++);
                // Format SBD: VD: IT301-P01-001
                String sbd = String.format("%s-%s%02d-%03d", subjectCode, roomPrefix, currentRoomNum, s + 1);

                ExamRoster roster = ExamRoster.builder()
                        .examRoom(examRoom)
                        .enrollment(e)
                        .student(e.getStudent())
                        .sbd(sbd)
                        .specialGrade(Grade.SpecialGrade.NONE)
                        .build();
                allRosters.add(roster);
            }
        }

        examRosterRepository.saveAll(allRosters);
        log.info("Auto-assigned {} students into {} exam rooms for session {}", totalStudents, numRooms, sessionId);

        return createdRooms.stream().map(this::mapToRoomResponse).collect(Collectors.toList());
    }

    // ==========================================
    // EXAM ROSTER & GRADE COMMIT WITH AUDIT LOG
    // ==========================================

    public List<ExamRosterResponse> getRosterByRoom(Long roomId) {
        return examRosterRepository.findByExamRoomIdOrderBySbdAsc(roomId).stream()
                .map(this::mapToRosterResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void commitExamGrades(Long userId, Long roomId, ExamGradeCommitRequest request) {
        ExamRoom room = examRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng thi: " + roomId));

        User currentUser = userRepository.findById(userId).orElse(null);

        List<GradeAuditLog> auditLogs = new ArrayList<>();

        for (ExamGradeCommitItem item : request.getItems()) {
            ExamRoster roster = examRosterRepository.findById(item.getRosterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thí sinh với ID: " + item.getRosterId()));

            if (!roster.getExamRoom().getId().equals(roomId)) {
                throw new BadRequestException("Thí sinh " + roster.getSbd() + " không thuộc phòng thi này");
            }

            java.math.BigDecimal oldScore = roster.getScore();
            Grade.SpecialGrade oldSpecial = roster.getSpecialGrade();

            Grade.SpecialGrade newSpecial = item.getSpecialGrade() != null ? item.getSpecialGrade() : Grade.SpecialGrade.NONE;
            java.math.BigDecimal newScore = item.getScore();

            // Cập nhật ExamRoster
            roster.setScore(newScore);
            roster.setSpecialGrade(newSpecial);
            roster.setViolationNote(item.getViolationNote());
            roster.setScoredAt(LocalDateTime.now());
            roster.setScoredBy(currentUser);
            examRosterRepository.save(roster);

            // Cập nhật Grade tương ứng của sinh viên
            Enrollment enrollment = roster.getEnrollment();
            if (enrollment != null && enrollment.getAttendanceStatus() == Enrollment.AttendanceStatus.DISQUALIFIED) {
                throw new BadRequestException("Thí sinh " + roster.getSbd() + " đã bị cấm thi do vắng quá 20% số tiết học phần");
            }
            Grade grade = gradeRepository.findByEnrollmentId(enrollment.getId())
                    .orElseGet(() -> {
                        Grade g = new Grade();
                        g.setEnrollment(enrollment);
                        return g;
                    });

            grade.setFinalScore(newScore);
            grade.setSpecialGrade(newSpecial);
            // Tự động tính điểm tổng kết (nếu đã có điểm quá trình)
            grade.calculateTotalScore();
            // Khóa sổ điểm bảo vệ
            grade.setIsFinalized(true);
            grade.setFinalizedAt(LocalDateTime.now());
            gradeRepository.save(grade);

            // Ghi nhận Audit Log nếu có thay đổi điểm
            boolean changed = false;
            if (oldScore == null && newScore != null) changed = true;
            else if (oldScore != null && newScore == null) changed = true;
            else if (oldScore != null && oldScore.compareTo(newScore) != 0) changed = true;
            else if (oldSpecial != newSpecial) changed = true;

            if (changed) {
                GradeAuditLog auditLog = GradeAuditLog.builder()
                        .grade(grade)
                        .examRoom(room)
                        .component("FINAL")
                        .oldScore(oldScore)
                        .newScore(newScore)
                        .oldSpecialGrade(oldSpecial)
                        .newSpecialGrade(newSpecial)
                        .reason(request.getReason() != null && !request.getReason().isBlank()
                                ? request.getReason() : "Khảo thí nạp điểm phòng thi " + room.getRoomCode())
                        .changedBy(currentUser)
                        .build();
                auditLogs.add(auditLog);
            }
        }

        if (!auditLogs.isEmpty()) {
            gradeAuditLogRepository.saveAll(auditLogs);
            log.info("Saved {} audit log entries for exam room {}", auditLogs.size(), roomId);
        }

        room.setStatus(ExamRoomStatus.SCORED);
        examRoomRepository.save(room);
    }

    public List<GradeAuditLog> getAuditLogsByRoom(Long roomId) {
        return gradeAuditLogRepository.findByExamRoomIdOrderByCreatedAtDesc(roomId);
    }

    // ==========================================
    // MAPPERS
    // ==========================================

    private ExamSessionResponse mapToSessionResponse(ExamSession session) {
        List<ExamRoom> rooms = examRoomRepository.findByExamSessionId(session.getId());
        int totalStudents = 0;
        for (ExamRoom r : rooms) {
            totalStudents += (int) examRosterRepository.countByExamRoomId(r.getId());
        }

        return ExamSessionResponse.builder()
                .id(session.getId())
                .semesterId(session.getSemester().getId())
                .semesterName(session.getSemester().getSemesterName())
                .subjectId(session.getSubject().getId())
                .subjectCode(session.getSubject().getSubjectCode())
                .subjectName(session.getSubject().getSubjectName())
                .sessionName(session.getSessionName())
                .examDate(session.getExamDate())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .totalRooms(rooms.size())
                .totalStudents(totalStudents)
                .build();
    }

    private ExamRoomResponse mapToRoomResponse(ExamRoom room) {
        List<ExamRoster> rosters = examRosterRepository.findByExamRoomIdOrderBySbdAsc(room.getId());
        int scoredCount = (int) rosters.stream().filter(r -> r.getScore() != null || r.getSpecialGrade() != Grade.SpecialGrade.NONE).count();

        ExamSession session = room.getExamSession();
        return ExamRoomResponse.builder()
                .id(room.getId())
                .sessionId(session.getId())
                .sessionName(session.getSessionName())
                .subjectCode(session.getSubject().getSubjectCode())
                .subjectName(session.getSubject().getSubjectName())
                .examDate(session.getExamDate())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .roomCode(room.getRoomCode())
                .roomLocation(room.getRoomLocation())
                .capacity(room.getCapacity())
                .status(room.getStatus())
                .studentCount(rosters.size())
                .scoredCount(scoredCount)
                .build();
    }

    private ExamRosterResponse mapToRosterResponse(ExamRoster roster) {
        Student s = roster.getStudent();
        String className = s.getClassEntity() != null ? s.getClassEntity().getCode() : "";
        String majorName = (s.getClassEntity() != null && s.getClassEntity().getMajor() != null)
                ? s.getClassEntity().getMajor().getName() : "";

        return ExamRosterResponse.builder()
                .id(roster.getId())
                .examRoomId(roster.getExamRoom().getId())
                .enrollmentId(roster.getEnrollment().getId())
                .studentId(s.getId())
                .studentCode(s.getStudentCode())
                .studentName(s.getFullName())
                .dateOfBirth(s.getDateOfBirth())
                .className(className)
                .majorName(majorName)
                .sbd(roster.getSbd())
                .score(roster.getScore())
                .specialGrade(roster.getSpecialGrade())
                .violationNote(roster.getViolationNote())
                .scoredAt(roster.getScoredAt())
                .scoredByName(roster.getScoredBy() != null ? roster.getScoredBy().getUsername() : null)
                .attendanceStatus(roster.getEnrollment() != null && roster.getEnrollment().getAttendanceStatus() != null ? roster.getEnrollment().getAttendanceStatus().name() : "QUALIFIED")
                .build();
    }
}
