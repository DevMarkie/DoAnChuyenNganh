package com.sms.service;

import com.sms.dto.request.ScheduleRequest;
import com.sms.entity.*;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

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
        if (requestedSemesterId != null) {
            return scheduleRepository.findByLecturerIdAndSemesterId(lecturer.getId(), requestedSemesterId);
        }
        return scheduleRepository.findByLecturerId(lecturer.getId());
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
                .build();

        return scheduleRepository.save(schedule);
    }

    /**
     * Cập nhật lịch học
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

        schedule.setSection(section);
        schedule.setClassEntity(classEntity);
        schedule.setDayOfWeek(request.getDayOfWeek());
        schedule.setStartPeriod(request.getStartPeriod());
        schedule.setEndPeriod(request.getEndPeriod());
        schedule.setRoom(request.getRoom().trim().toUpperCase());
        schedule.setStartDate(start);
        schedule.setEndDate(end);
        schedule.setNote(request.getNote());

        return scheduleRepository.save(schedule);
    }

    @Transactional
    public void delete(Long id) {
        Schedule schedule = findById(id);
        scheduleRepository.delete(schedule);
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

    /**
     * A schedule may be added after students have enrolled in its section.  At
     * that point enrollment-time validation is too late, so protect every
     * affected student's timetable here as well.
     */
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
