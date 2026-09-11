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
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final ClassRepository classRepository;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;

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

        if (semesterId != null) {
            return scheduleRepository.findSchedulesForStudentAndSemester(student.getId(), classId, semesterId);
        }
        return scheduleRepository.findSchedulesForStudent(student.getId(), classId);
    }

    /**
     * Lấy lịch giảng dạy cho giảng viên đang đăng nhập
     */
    public List<Schedule> getLecturerSchedule(Long userId, Long semesterId) {
        Lecturer lecturer = lecturerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ giảng viên"));

        if (semesterId != null) {
            return scheduleRepository.findByLecturerIdAndSemesterId(lecturer.getId(), semesterId);
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
            throw new BadRequestException(String.format(
                    "Trùng phòng học! Phòng %s đã được xếp cho lớp %s (%s) vào %s (Tiết %d - %d).",
                    room, c.getSection().getSectionCode(), c.getSection().getSubject().getSubjectName(),
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
            throw new BadRequestException(String.format(
                    "Trùng lịch giảng viên! Thầy/Cô %s đã có lịch dạy lớp %s (%s) vào %s (Tiết %d - %d).",
                    lecturerName, c.getSection().getSectionCode(), c.getSection().getSubject().getSubjectName(),
                    c.getDayOfWeekName(), c.getStartPeriod(), c.getEndPeriod()
            ));
        }
    }
}
