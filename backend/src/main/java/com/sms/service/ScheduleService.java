package com.sms.service;

import com.sms.dto.request.ScheduleRequest;
import com.sms.entity.*;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final ClassRepository classRepository;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SemesterRepository semesterRepository;
    private final NotificationService notificationService;
    private final ExcelExportService excelExportService;

    public List<Schedule> findAll() {
        return scheduleRepository.findAll();
    }

    public List<Schedule> findBySemester(Long semesterId) {
        return scheduleRepository.findBySectionSemesterId(semesterId);
    }

    public List<Schedule> findByClass(Integer classId) {
        return scheduleRepository.findByClassEntityId(classId);
    }

    public Schedule findById(Long id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch học với ID: " + id));
    }

    /**
     * Lấy thời khóa biểu cho sinh viên đang đăng nhập
     */
    public List<Schedule> getStudentSchedule(Long userId, Long semesterId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ sinh viên"));

        Integer classId = student.getClassEntity() != null ? student.getClassEntity().getId() : null;

        Long requestedSemesterId = semesterId;
        if (requestedSemesterId == null) {
            requestedSemesterId = semesterRepository.findByIsCurrentTrue()
                    .map(semester -> semester.getId().longValue())
                    .orElse(null);
        }
        if (requestedSemesterId != null) {
            return scheduleRepository.findSchedulesForStudentAndSemester(student.getId(), classId, requestedSemesterId);
        }
        return scheduleRepository.findSchedulesForStudent(student.getId(), classId);
    }

    /**
     * Lấy lịch giảng dạy cho giảng viên đang đăng nhập
     * Tự động ẩn các lịch học thuộc các lớp đã bị HỦY (CANCELLED) để tránh giảng viên đến nhầm phòng
     */
    public List<Schedule> getLecturerSchedule(Long userId, Long semesterId) {
        Lecturer lecturer = lecturerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ giảng viên"));

        Long requestedSemesterId = semesterId;
        if (requestedSemesterId == null) {
            requestedSemesterId = semesterRepository.findByIsCurrentTrue()
                    .map(semester -> semester.getId().longValue())
                    .orElse(null);
        }
        List<Schedule> schedules;
        if (requestedSemesterId != null) {
            schedules = scheduleRepository.findByLecturerIdAndSemesterId(lecturer.getId(), requestedSemesterId);
        } else {
            schedules = scheduleRepository.findByLecturerId(lecturer.getId());
        }
        return schedules.stream()
                .filter(s -> s.getSection() == null || s.getSection().getStatus() != CourseSection.SectionStatus.CANCELLED)
                .toList();
    }

    /**
     * Tạo lịch học mới kèm kiểm tra xung đột phòng học & giảng viên
     */
    @Transactional
    public Schedule create(ScheduleRequest request) {
        validatePeriodsAndDates(request);

        CourseSection section = courseSectionRepository.findById(request.getSectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));

        ClassEntity classEntity = null;
        if (request.getClassId() != null) {
            classEntity = classRepository.findById(request.getClassId()).orElse(null);
        }

        LocalDate start = LocalDate.parse(request.getStartDate());
        LocalDate end = LocalDate.parse(request.getEndDate());

        // Kiểm tra xung đột phòng học
        checkRoomConflict(request.getRoom(), request.getDayOfWeek(), request.getStartPeriod(), request.getEndPeriod(), start, end, null);

        // Kiểm tra xung đột lịch giảng viên
        if (section.getLecturer() != null) {
            checkLecturerConflict(section.getLecturer().getId(), section.getLecturer().getFullName(),
                    request.getDayOfWeek(), request.getStartPeriod(), request.getEndPeriod(), start, end, null);
        }
        checkStudentScheduleConflicts(section, request, start, end, null);

        Schedule.ScheduleStatus status = Schedule.ScheduleStatus.NORMAL;
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                status = Schedule.ScheduleStatus.valueOf(request.getStatus().trim().toUpperCase());
            } catch (Exception ignored) {}
        }

        Schedule schedule = Schedule.builder()
                .section(section)
                .classEntity(classEntity)
                .dayOfWeek(request.getDayOfWeek())
                .startPeriod(request.getStartPeriod())
                .endPeriod(request.getEndPeriod())
                .room(request.getRoom().trim().toUpperCase())
                .startDate(start)
                .endDate(end)
                .note(request.getNote())
                .status(status)
                .build();

        return scheduleRepository.save(schedule);
    }

    /**
     * Cập nhật lịch học kèm đồng bộ thông báo đổi phòng / báo nghỉ / học bù
     */
    @Transactional
    public Schedule update(Long id, ScheduleRequest request) {
        Schedule schedule = findById(id);
        validatePeriodsAndDates(request);

        CourseSection section = courseSectionRepository.findById(request.getSectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));

        ClassEntity classEntity = null;
        if (request.getClassId() != null) {
            classEntity = classRepository.findById(request.getClassId()).orElse(null);
        }

        LocalDate start = LocalDate.parse(request.getStartDate());
        LocalDate end = LocalDate.parse(request.getEndDate());

        // Kiểm tra xung đột phòng học
        checkRoomConflict(request.getRoom(), request.getDayOfWeek(), request.getStartPeriod(), request.getEndPeriod(), start, end, id);

        // Kiểm tra xung đột giảng viên
        if (section.getLecturer() != null) {
            checkLecturerConflict(section.getLecturer().getId(), section.getLecturer().getFullName(),
                    request.getDayOfWeek(), request.getStartPeriod(), request.getEndPeriod(), start, end, id);
        }
        checkStudentScheduleConflicts(section, request, start, end, id);

        boolean roomChanged = !request.getRoom().trim().equalsIgnoreCase(schedule.getRoom());
        Schedule.ScheduleStatus oldStatus = schedule.getStatus() != null ? schedule.getStatus() : Schedule.ScheduleStatus.NORMAL;
        Schedule.ScheduleStatus newStatus = oldStatus;
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                newStatus = Schedule.ScheduleStatus.valueOf(request.getStatus().trim().toUpperCase());
            } catch (Exception ignored) {}
        }
        boolean statusChanged = (oldStatus != newStatus);

        schedule.setSection(section);
        schedule.setClassEntity(classEntity);
        schedule.setDayOfWeek(request.getDayOfWeek());
        schedule.setStartPeriod(request.getStartPeriod());
        schedule.setEndPeriod(request.getEndPeriod());
        schedule.setRoom(request.getRoom().trim().toUpperCase());
        schedule.setStartDate(start);
        schedule.setEndDate(end);
        schedule.setNote(request.getNote());
        schedule.setStatus(newStatus);

        Schedule updated = scheduleRepository.save(schedule);

        // Tự động đồng bộ thông báo tới sinh viên trong lớp học phần khi có thay đổi trạng thái hoặc đổi phòng
        if ((roomChanged || statusChanged) && notificationService != null) {
            String subjectName = (section.getSubject() != null) ? section.getSubject().getSubjectName() : section.getSectionCode();
            String title = "Cập nhật lịch học: " + subjectName;
            String message;
            if (newStatus == Schedule.ScheduleStatus.CANCELLED) {
                message = String.format("Lớp %s (%s) vào %s (Tiết %d-%d) đã BÁO NGHỈ. Ghi chú: %s",
                        section.getSectionCode(), subjectName, schedule.getDayOfWeekName(),
                        schedule.getStartPeriod(), schedule.getEndPeriod(),
                        request.getNote() != null ? request.getNote() : "Theo thông báo của giảng viên");
            } else if (newStatus == Schedule.ScheduleStatus.MAKEUP) {
                message = String.format("Lớp %s (%s) được xếp HỌC BÙ vào %s (Tiết %d-%d) tại phòng %s. Ghi chú: %s",
                        section.getSectionCode(), subjectName, schedule.getDayOfWeekName(),
                        schedule.getStartPeriod(), schedule.getEndPeriod(), schedule.getRoom(),
                        request.getNote() != null ? request.getNote() : "");
            } else if (roomChanged || newStatus == Schedule.ScheduleStatus.ROOM_CHANGED) {
                message = String.format("Lớp %s (%s) vào %s (Tiết %d-%d) đã ĐỔI PHÒNG HỌC sang phòng %s.",
                        section.getSectionCode(), subjectName, schedule.getDayOfWeekName(),
                        schedule.getStartPeriod(), schedule.getEndPeriod(), schedule.getRoom());
            } else {
                message = String.format("Lịch học lớp %s (%s) đã được cập nhật.", section.getSectionCode(), subjectName);
            }
            try {
                notificationService.notifyScheduleChange(section.getId(), title, message);
            } catch (Exception ex) {
                log.warn("Không thể gửi thông báo thay đổi lịch học: {}", ex.getMessage());
            }
        }

        return updated;
    }

    @Transactional
    public void delete(Long id) {
        Schedule schedule = findById(id);
        scheduleRepository.delete(schedule);
    }

    // ==========================================
    // EXPORT THỜI KHÓA BIỂU (.ICS & .XLSX)
    // ==========================================

    public byte[] exportStudentIcs(Long userId, Long semesterId) {
        List<Schedule> schedules = getStudentSchedule(userId, semesterId);
        Student student = studentRepository.findByUserId(userId).orElse(null);
        String title = "TKB_SinhVien_" + (student != null ? student.getStudentCode() : "SV");
        return generateIcalendar(schedules, title);
    }

    public byte[] exportLecturerIcs(Long userId, Long semesterId) {
        List<Schedule> schedules = getLecturerSchedule(userId, semesterId);
        Lecturer lecturer = lecturerRepository.findByUserId(userId).orElse(null);
        String title = "LichGiangDay_" + (lecturer != null ? lecturer.getFullName() : "GV");
        return generateIcalendar(schedules, title);
    }

    public byte[] exportStudentExcel(Long userId, Long semesterId) throws IOException {
        List<Schedule> schedules = getStudentSchedule(userId, semesterId);
        Student student = studentRepository.findByUserId(userId).orElse(null);
        String title = "THỜI KHÓA BIỂU SINH VIÊN - " + (student != null ? student.getFullName() + " (" + student.getStudentCode() + ")" : "");
        return excelExportService.exportSchedule(schedules, title);
    }

    public byte[] exportLecturerExcel(Long userId, Long semesterId) throws IOException {
        List<Schedule> schedules = getLecturerSchedule(userId, semesterId);
        Lecturer lecturer = lecturerRepository.findByUserId(userId).orElse(null);
        String title = "LỊCH GIẢNG DẠY GIẢNG VIÊN - " + (lecturer != null ? lecturer.getFullName() : "");
        return excelExportService.exportSchedule(schedules, title);
    }

    /**
     * Sinh định dạng tệp iCalendar chuẩn RFC 5545 để đồng bộ Google Calendar / Outlook
     */
    public byte[] generateIcalendar(List<Schedule> schedules, String calName) {
        StringBuilder sb = new StringBuilder();
        sb.append("BEGIN:VCALENDAR\r\n");
        sb.append("VERSION:2.0\r\n");
        sb.append("PRODID:-//Phenikaa University//SMS Timetable//VI\r\n");
        sb.append("CALSCALE:GREGORIAN\r\n");
        sb.append("METHOD:PUBLISH\r\n");
        sb.append("X-WR-CALNAME:").append(calName != null ? calName : "ThoiKhoaBieu").append("\r\n");
        sb.append("X-WR-TIMEZONE:Asia/Ho_Chi_Minh\r\n");

        DateTimeFormatter basicDateFmt = DateTimeFormatter.ofPattern("yyyyMMdd");
        String nowStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'"));

        String[] periodStartTimes = {
                "", "07:00:00", "07:50:00", "08:45:00", "09:35:00", "10:30:00", "11:20:00",
                "12:30:00", "13:20:00", "14:15:00", "15:05:00", "16:00:00", "16:50:00"
        };
        String[] periodEndTimes = {
                "", "07:45:00", "08:35:00", "09:30:00", "10:20:00", "11:15:00", "12:05:00",
                "13:15:00", "14:05:00", "15:00:00", "15:50:00", "16:45:00", "17:35:00"
        };

        for (Schedule s : schedules) {
            if (s.getDayOfWeek() == null || s.getStartDate() == null || s.getEndDate() == null) continue;
            DayOfWeek targetDow = (s.getDayOfWeek() == 8) ? DayOfWeek.SUNDAY : DayOfWeek.of(s.getDayOfWeek() - 1);

            LocalDate firstDate = s.getStartDate();
            while (firstDate.getDayOfWeek() != targetDow && !firstDate.isAfter(s.getEndDate())) {
                firstDate = firstDate.plusDays(1);
            }
            if (firstDate.isAfter(s.getEndDate())) continue;

            int sp = (s.getStartPeriod() != null && s.getStartPeriod() >= 1 && s.getStartPeriod() <= 12) ? s.getStartPeriod() : 1;
            int ep = (s.getEndPeriod() != null && s.getEndPeriod() >= 1 && s.getEndPeriod() <= 12) ? s.getEndPeriod() : sp;

            String dtStart = firstDate.format(basicDateFmt) + "T" + periodStartTimes[sp].replace(":", "");
            String dtEnd = firstDate.format(basicDateFmt) + "T" + periodEndTimes[ep].replace(":", "");
            String untilStr = s.getEndDate().format(basicDateFmt) + "T235959Z";

            String subName = (s.getSection() != null && s.getSection().getSubject() != null)
                    ? s.getSection().getSubject().getSubjectName() : "Hoc phan";
            String secCode = s.getSection() != null ? s.getSection().getSectionCode() : "";
            String lecturerName = (s.getSection() != null && s.getSection().getLecturer() != null)
                    ? s.getSection().getLecturer().getFullName() : "N/A";

            sb.append("BEGIN:VEVENT\r\n");
            sb.append("UID:schedule-").append(s.getId()).append("-").append(firstDate).append("@phenikaa-uni.edu.vn\r\n");
            sb.append("DTSTAMP:").append(nowStr).append("\r\n");
            sb.append("DTSTART;TZID=Asia/Ho_Chi_Minh:").append(dtStart).append("\r\n");
            sb.append("DTEND;TZID=Asia/Ho_Chi_Minh:").append(dtEnd).append("\r\n");
            sb.append("RRULE:FREQ=WEEKLY;UNTIL=").append(untilStr).append("\r\n");
            sb.append("SUMMARY:").append(subName).append(" (").append(secCode).append(")\r\n");
            sb.append("LOCATION:").append(s.getRoom() != null ? s.getRoom() : "Online").append("\r\n");
            sb.append("DESCRIPTION:Giang vien: ").append(lecturerName)
                    .append(" - Tiet: ").append(s.getStartPeriod()).append("-").append(s.getEndPeriod())
                    .append(" - Ghi chu: ").append(s.getNote() != null ? s.getNote() : "")
                    .append("\r\n");
            sb.append("STATUS:").append(s.getStatus() == Schedule.ScheduleStatus.CANCELLED ? "CANCELLED" : "CONFIRMED").append("\r\n");
            sb.append("END:VEVENT\r\n");
        }
        sb.append("END:VCALENDAR\r\n");

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private void validatePeriodsAndDates(ScheduleRequest request) {
        if (request.getStartPeriod() > request.getEndPeriod()) {
            throw new BadRequestException("Tiết bắt đầu không thể lớn hơn tiết kết thúc");
        }
        LocalDate start = LocalDate.parse(request.getStartDate());
        LocalDate end = LocalDate.parse(request.getEndDate());
        if (start.isAfter(end)) {
            throw new BadRequestException("Ngày bắt đầu không thể sau ngày kết thúc");
        }
    }

    private void checkRoomConflict(String room, Integer dayOfWeek, Integer startPeriod, Integer endPeriod,
                                    LocalDate startDate, LocalDate endDate, Long excludeId) {
        List<Schedule> conflicts = scheduleRepository.findRoomConflicts(
                room.trim().toUpperCase(), dayOfWeek, startPeriod, endPeriod, startDate, endDate, excludeId
        );
        if (!conflicts.isEmpty()) {
            Schedule c = conflicts.get(0);
            String subjectName = (c.getSection() != null && c.getSection().getSubject() != null) 
                                 ? c.getSection().getSubject().getSubjectName() : "Không xác định";
            String sectionCode = c.getSection() != null ? c.getSection().getSectionCode() : "Không xác định";
            throw new BadRequestException(String.format(
                    "Trùng phòng học! Phòng %s đã được xếp cho lớp %s (%s) vào %s (Tiết %d - %d).",
                    room, sectionCode, subjectName,
                    c.getDayOfWeekName(), c.getStartPeriod(), c.getEndPeriod()
            ));
        }
    }

    private void checkLecturerConflict(Long lecturerId, String lecturerName, Integer dayOfWeek,
                                       Integer startPeriod, Integer endPeriod, LocalDate startDate,
                                       LocalDate endDate, Long excludeId) {
        List<Schedule> conflicts = scheduleRepository.findLecturerConflicts(
                lecturerId, dayOfWeek, startPeriod, endPeriod, startDate, endDate, excludeId
        );
        if (!conflicts.isEmpty()) {
            Schedule c = conflicts.get(0);
            String subjectName = (c.getSection() != null && c.getSection().getSubject() != null) 
                                 ? c.getSection().getSubject().getSubjectName() : "Không xác định";
            String sectionCode = c.getSection() != null ? c.getSection().getSectionCode() : "Không xác định";
            throw new BadRequestException(String.format(
                    "Trùng lịch giảng viên! Thầy/Cô %s đã có lịch dạy lớp %s (%s) vào %s (Tiết %d - %d).",
                    lecturerName, sectionCode, subjectName,
                    c.getDayOfWeekName(), c.getStartPeriod(), c.getEndPeriod()
            ));
        }
    }

    private void checkStudentScheduleConflicts(CourseSection section, ScheduleRequest request,
                                               LocalDate startDate, LocalDate endDate, Long excludeId) {
        for (var enrollment : enrollmentRepository.findActiveBySectionId(section.getId())) {
            var student = enrollment.getStudent();
            Integer classId = student.getClassEntity() == null ? null : student.getClassEntity().getId();
            List<Schedule> existingSchedules = scheduleRepository.findSchedulesForStudentAndSemester(
                    student.getId(), classId, section.getSemester().getId().longValue());

            for (Schedule existing : existingSchedules) {
                boolean isCurrentSchedule = excludeId != null && excludeId.equals(existing.getId());
                boolean belongsToSameSection = existing.getSection() != null
                        && section.getId().equals(existing.getSection().getId());
                if (isCurrentSchedule || belongsToSameSection || existing.getDayOfWeek() == null
                        || !existing.getDayOfWeek().equals(request.getDayOfWeek())) {
                    continue;
                }

                boolean periodOverlap = request.getStartPeriod() <= existing.getEndPeriod()
                        && request.getEndPeriod() >= existing.getStartPeriod();
                boolean dateOverlap = !startDate.isAfter(existing.getEndDate())
                        && !endDate.isBefore(existing.getStartDate());
                if (periodOverlap && dateOverlap) {
                    String studentName = student.getFullName() == null ? student.getStudentCode() : student.getFullName();
                    throw new BadRequestException(String.format(
                            "Trùng lịch học! Không thể xếp môn %s cho sinh viên %s vì trùng với lớp %s (%s) vào %s (Tiết %d - %d).",
                            section.getSubject().getSubjectName(), studentName,
                            existing.getSection().getSectionCode(), existing.getSection().getSubject().getSubjectName(),
                            existing.getDayOfWeekName(), existing.getStartPeriod(), existing.getEndPeriod()));
                }
            }
        }
    }
}
