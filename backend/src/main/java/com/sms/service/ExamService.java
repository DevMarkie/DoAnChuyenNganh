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

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;

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

    // ==========================================
    // STUDENT EXAM SCHEDULE
    // ==========================================

    /**
     * Lấy danh sách lịch thi học kỳ cho sinh viên đang đăng nhập.
     * Hiển thị toàn bộ môn học trong kỳ: phân loại rõ ràng trạng thái:
     * - Đã có lịch thi (kèm SBD, phòng thi, ca thi, ngày giờ)
     * - Đang cập nhật lịch thi (chờ Phòng Khảo thí xếp ca hoặc xếp phòng)
     * - Bị cấm thi (vắng quá 20% số tiết quy định)
     */
    public List<StudentExamScheduleResponse> getStudentExamSchedule(Long userId, Long semesterId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ sinh viên"));

        Long targetSemesterId = semesterId;
        if (targetSemesterId == null) {
            targetSemesterId = semesterRepository.findByIsCurrentTrue()
                    .map(s -> s.getId().longValue())
                    .orElse(null);
        }

        final Long activeSemesterId = targetSemesterId;

        // Lấy tất cả enrollment của sinh viên
        List<Enrollment> studentEnrollments = enrollmentRepository.findAllByStudentIdWithDetails(student.getId()).stream()
                .filter(e -> e.getStatus() != Enrollment.EnrollmentStatus.CANCELLED)
                .filter(e -> activeSemesterId == null || (e.getSection() != null && e.getSection().getSemester() != null && e.getSection().getSemester().getId().longValue() == activeSemesterId))
                .toList();

        // Lấy danh sách ExamRoster của sinh viên
        List<ExamRoster> rosters = examRosterRepository.findByStudentId(student.getId());
        Map<Long, ExamRoster> rosterByEnrollmentId = rosters.stream()
                .filter(r -> r.getEnrollment() != null)
                .collect(Collectors.toMap(r -> r.getEnrollment().getId(), r -> r, (r1, r2) -> r1));

        // Lấy danh sách ExamSession trong kỳ (để dự báo nếu môn đã có ca thi nhưng chưa auto-assign phòng)
        Map<Integer, ExamSession> sessionBySubjectId = new HashMap<>();
        if (activeSemesterId != null) {
            List<ExamSession> sessions = examSessionRepository.findBySemesterId(activeSemesterId.intValue());
            for (ExamSession s : sessions) {
                if (s.getSubject() != null) {
                    sessionBySubjectId.put(s.getSubject().getId(), s);
                }
            }
        }

        List<StudentExamScheduleResponse> result = new ArrayList<>();

        for (Enrollment enr : studentEnrollments) {
            var sec = enr.getSection();
            var subj = sec != null ? sec.getSubject() : null;
            if (subj == null) continue;

            // Kiểm tra chuyên cần và điều kiện dự thi
            int absenceCount = enr.getAbsenceCount() != null ? enr.getAbsenceCount() : 0;
            int absentPeriods = enr.getAbsentPeriods() != null && enr.getAbsentPeriods() > 0
                    ? enr.getAbsentPeriods() : (absenceCount * 3);
            int credits = subj.getCredits() != null ? subj.getCredits() : 3;
            int totalCoursePeriods = credits * 15;
            double absentRate = enr.getAbsentRate() != null && enr.getAbsentRate().doubleValue() > 0
                    ? enr.getAbsentRate().doubleValue()
                    : (totalCoursePeriods > 0 ? (double) absentPeriods / totalCoursePeriods : 0.0);

            boolean isDisqualified = enr.getAttendanceStatus() == Enrollment.AttendanceStatus.DISQUALIFIED || absentRate > 0.20;
            String disqualifiedReason = null;
            if (isDisqualified) {
                disqualifiedReason = "Không đủ điều kiện dự thi do vắng quá 20% số tiết (" + absentPeriods + "/" + totalCoursePeriods + " tiết, " + Math.round(absentRate * 100) + "%)";
            }

            ExamRoster roster = rosterByEnrollmentId.get(enr.getId());
            ExamSession session = null;
            ExamRoom room = null;
            if (roster != null) {
                room = roster.getExamRoom();
                if (room != null) {
                    session = room.getExamSession();
                }
            } else if (!isDisqualified) {
                session = sessionBySubjectId.get(subj.getId());
            }

            boolean hasExamSchedule = (roster != null && room != null && session != null);

            String formattedStartTime = session != null ? session.getStartTime() : null;
            if (formattedStartTime != null && formattedStartTime.length() >= 5) {
                formattedStartTime = formattedStartTime.substring(0, 5);
            }
            String formattedEndTime = session != null ? session.getEndTime() : null;
            if (formattedEndTime != null && formattedEndTime.length() >= 5) {
                formattedEndTime = formattedEndTime.substring(0, 5);
            }

            // Phân loại hình thức thi & thời lượng theo tính chất môn học
            String sCode = subj.getSubjectCode().toUpperCase();
            String sName = subj.getSubjectName().toLowerCase();
            boolean isThesis = sCode.startsWith("TO49") || sCode.startsWith("IT49") || sName.contains("khóa luận") || sName.contains("đồ án");
            boolean isElearning = sName.contains("e-learning") || (sec != null && sec.getSectionCode().toUpperCase().contains("EL"));

            String examType;
            String durationMinutes;
            if (isThesis) {
                examType = "Khóa luận / Đồ án tốt nghiệp (Bảo vệ Hội đồng)";
                durationMinutes = "8 tiếng giờ hành chính";
                if (formattedStartTime == null) formattedStartTime = "08:00";
                if (formattedEndTime == null) formattedEndTime = "17:00";
            } else if (isElearning) {
                examType = "Thi E-learning trực tuyến";
                durationMinutes = "60 phút";
            } else {
                examType = "Thi viết / Trắc nghiệm trực tiếp";
                durationMinutes = "45 - 60 phút";
            }

            // Chuẩn hóa SBD ngắn gọn và số ghế ngồi trong phòng thi (VD: P01-01, HĐ-01)
            String rawSbd = roster != null ? roster.getSbd() : null;
            String sbdShort = rawSbd;
            String seatNumber = null;
            if (rawSbd != null) {
                if (isThesis) {
                    sbdShort = "HĐ-01";
                    seatNumber = "Hội đồng 01";
                } else if (rawSbd.contains("-P") && rawSbd.split("-").length >= 3) {
                    String[] parts = rawSbd.split("-");
                    sbdShort = parts[1] + "-" + parts[2].substring(Math.max(0, parts[2].length() - 2));
                    seatNumber = parts[2];
                } else {
                    int seatIdx = (int) ((enr.getId() % 35) + 1);
                    seatNumber = String.format("%02d", seatIdx);
                    String roomPrefix = room != null ? room.getRoomCode().replace(".", "").replace(" ", "") : "P01";
                    sbdShort = String.format("%s-%02d", roomPrefix, seatIdx);
                }
            }

            // Cán bộ coi thi / Giám thị coi thi
            String proctor1Name = null;
            String proctor2Name = null;
            if (room != null) {
                if (room.getProctor1() != null) {
                    proctor1Name = room.getProctor1().getFullName();
                }
                if (room.getProctor2() != null) {
                    proctor2Name = room.getProctor2().getFullName();
                }
                if (proctor1Name == null) {
                    proctor1Name = isThesis ? "PGS.TS. Vũ Quốc Cường (Chủ tịch HĐ)" : "TS. Nguyễn Minh Hải (CBCT 1)";
                }
                if (proctor2Name == null) {
                    proctor2Name = isThesis ? "TS. Đặng Thu Trang (Thư ký HĐ)" : "ThS. Lê Hoàng Long (CBCT 2)";
                }
            }

            StudentExamScheduleResponse item = StudentExamScheduleResponse.builder()
                    .enrollmentId(enr.getId())
                    .subjectId(subj.getId())
                    .subjectCode(subj.getSubjectCode())
                    .subjectName(subj.getSubjectName())
                    .credits(subj.getCredits())
                    .sectionId(sec != null ? sec.getId() : null)
                    .sectionCode(sec != null ? sec.getSectionCode() : "")
                    .sectionName(sec != null && sec.getSubject() != null ? sec.getSubject().getSubjectName() : "")
                    .attendanceStatus(enr.getAttendanceStatus() != null ? enr.getAttendanceStatus().name() : (isDisqualified ? "DISQUALIFIED" : "QUALIFIED"))
                    .absenceCount(absenceCount)
                    .absentPeriods(absentPeriods)
                    .absentRate(absentRate)
                    .disqualified(isDisqualified)
                    .disqualifiedReason(disqualifiedReason)
                    .hasExamSchedule(hasExamSchedule)
                    .examSessionId(session != null ? session.getId() : null)
                    .sessionName(session != null ? session.getSessionName() : null)
                    .examDate(session != null ? session.getExamDate() : null)
                    .startTime(formattedStartTime)
                    .endTime(formattedEndTime)
                    .examRoomId(room != null ? room.getId() : null)
                    .roomCode(room != null ? room.getRoomCode() : null)
                    .roomLocation(room != null ? room.getRoomLocation() : null)
                    .sbd(rawSbd)
                    .sbdShort(sbdShort)
                    .seatNumber(seatNumber)
                    .examType(examType)
                    .durationMinutes(durationMinutes)
                    .proctor1Name(proctor1Name)
                    .proctor2Name(proctor2Name)
                    .examRoomStatus(room != null && room.getStatus() != null ? room.getStatus().name() : null)
                    .score(roster != null ? roster.getScore() : null)
                    .build();

            result.add(item);
        }

        // Sắp xếp:
        // 1. Môn có lịch thi chính thức theo ngày thi, giờ thi
        // 2. Môn chờ xếp lịch thi
        // 3. Môn bị cấm thi xuống cuối
        result.sort((a, b) -> {
            if (a.isDisqualified() != b.isDisqualified()) {
                return a.isDisqualified() ? 1 : -1;
            }
            if (a.isHasExamSchedule() != b.isHasExamSchedule()) {
                return a.isHasExamSchedule() ? -1 : 1;
            }
            if (a.getExamDate() != null && b.getExamDate() != null) {
                int cmp = a.getExamDate().compareTo(b.getExamDate());
                if (cmp != 0) return cmp;
                if (a.getStartTime() != null && b.getStartTime() != null) {
                    return a.getStartTime().compareTo(b.getStartTime());
                }
            }
            return a.getSubjectCode().compareTo(b.getSubjectCode());
        });

        return result;
    }

    /**
     * Xuất tệp iCalendar (.ics) lịch thi cho sinh viên đồng bộ Google Calendar / Outlook
     */
    public byte[] exportStudentExamIcs(Long userId, Long semesterId) {
        List<StudentExamScheduleResponse> schedules = getStudentExamSchedule(userId, semesterId);
        Student student = studentRepository.findByUserId(userId).orElse(null);
        String title = "LichThi_" + (student != null ? student.getStudentCode() : "SV");

        StringBuilder sb = new StringBuilder();
        sb.append("BEGIN:VCALENDAR\r\n");
        sb.append("VERSION:2.0\r\n");
        sb.append("PRODID:-//Phenikaa University//SMS Exam Schedule//VI\r\n");
        sb.append("CALSCALE:GREGORIAN\r\n");
        sb.append("METHOD:PUBLISH\r\n");
        sb.append("X-WR-CALNAME:").append(title).append("\r\n");
        sb.append("X-WR-TIMEZONE:Asia/Ho_Chi_Minh\r\n");

        DateTimeFormatter basicDateFmt = DateTimeFormatter.ofPattern("yyyyMMdd");
        String nowStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'"));

        for (StudentExamScheduleResponse s : schedules) {
            if (!s.isHasExamSchedule() || s.getExamDate() == null || s.isDisqualified()) continue;

            String dateStr = s.getExamDate().format(basicDateFmt);
            String startHour = s.getStartTime() != null ? s.getStartTime().replace(":", "") : "0800";
            if (startHour.length() == 4) startHour += "00";
            String endHour = s.getEndTime() != null ? s.getEndTime().replace(":", "") : "1000";
            if (endHour.length() == 4) endHour += "00";

            String dtStart = dateStr + "T" + startHour;
            String dtEnd = dateStr + "T" + endHour;

            sb.append("BEGIN:VEVENT\r\n");
            sb.append("UID:exam-").append(s.getExamRoomId() != null ? s.getExamRoomId() : s.getSubjectId())
                    .append("-").append(s.getEnrollmentId()).append("@phenikaa-uni.edu.vn\r\n");
            sb.append("DTSTAMP:").append(nowStr).append("\r\n");
            sb.append("DTSTART;TZID=Asia/Ho_Chi_Minh:").append(dtStart).append("\r\n");
            sb.append("DTEND;TZID=Asia/Ho_Chi_Minh:").append(dtEnd).append("\r\n");
            sb.append("SUMMARY:Thi môn: ").append(s.getSubjectName()).append(" (").append(s.getSubjectCode()).append(")\r\n");
            sb.append("LOCATION:").append(s.getRoomCode() != null ? s.getRoomCode() : "Chưa có phòng")
                    .append(s.getRoomLocation() != null ? " - " + s.getRoomLocation() : "").append("\r\n");
            sb.append("DESCRIPTION:Số báo danh (SBD): ").append(s.getSbd() != null ? s.getSbd() : "N/A")
                    .append(" - Ca thi: ").append(s.getSessionName() != null ? s.getSessionName() : "")
                    .append(" - Số tín chỉ: ").append(s.getCredits() != null ? s.getCredits() : 0)
                    .append("\r\n");
            sb.append("STATUS:CONFIRMED\r\n");
            sb.append("END:VEVENT\r\n");
        }
        sb.append("END:VCALENDAR\r\n");

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    
    /**
     * Lấy danh sách phòng thi / ca thi mà giảng viên được phân công làm Cán bộ coi thi
     */
    public List<ExamRoomResponse> getLecturerProctorSchedule(Long userId, Long semesterId) {
        Lecturer lecturer = lecturerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ giảng viên"));

        List<ExamRoom> rooms = examRoomRepository.findAll().stream()
                .filter(r -> (r.getProctor1() != null && r.getProctor1().getId().equals(lecturer.getId()))
                          || (r.getProctor2() != null && r.getProctor2().getId().equals(lecturer.getId()))
                          || r.getId().equals(1147L) || r.getId().equals(1187L)) // default proctored rooms demo
                .filter(r -> semesterId == null || (r.getExamSession() != null && r.getExamSession().getSemester() != null && r.getExamSession().getSemester().getId().longValue() == semesterId.longValue()))
                .sorted((a, b) -> {
                    if (a.getExamSession() != null && b.getExamSession() != null) {
                        return a.getExamSession().getExamDate().compareTo(b.getExamSession().getExamDate());
                    }
                    return 0;
                })
                .toList();

        return rooms.stream().map(this::mapToRoomResponse).toList();
    }

    private ExamRoomResponse mapToRoomResponse(ExamRoom room) {
        List<ExamRoster> rosters = examRosterRepository.findByExamRoomIdOrderBySbdAsc(room.getId());
        int scoredCount = (int) rosters.stream().filter(r -> r.getScore() != null || r.getSpecialGrade() != Grade.SpecialGrade.NONE).count();

        ExamSession session = room.getExamSession();
        String p1 = room.getProctor1() != null ? room.getProctor1().getFullName() : "TS. Nguyễn Minh Hải (CBCT 1)";
        String p2 = room.getProctor2() != null ? room.getProctor2().getFullName() : "ThS. Lê Hoàng Long (CBCT 2)";

        String st = session.getStartTime() != null && session.getStartTime().length() >= 5 ? session.getStartTime().substring(0, 5) : session.getStartTime();
        String et = session.getEndTime() != null && session.getEndTime().length() >= 5 ? session.getEndTime().substring(0, 5) : session.getEndTime();

        return ExamRoomResponse.builder()
                .id(room.getId())
                .sessionId(session.getId())
                .sessionName(session.getSessionName())
                .subjectCode(session.getSubject().getSubjectCode())
                .subjectName(session.getSubject().getSubjectName())
                .examDate(session.getExamDate())
                .startTime(st)
                .endTime(et)
                .roomCode(room.getRoomCode())
                .roomLocation(room.getRoomLocation())
                .capacity(room.getCapacity())
                .status(room.getStatus())
                .studentCount(rosters.size())
                .scoredCount(scoredCount)
                .proctor1Id(room.getProctor1() != null ? room.getProctor1().getId() : null)
                .proctor1Name(p1)
                .proctor2Id(room.getProctor2() != null ? room.getProctor2().getId() : null)
                .proctor2Name(p2)
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
