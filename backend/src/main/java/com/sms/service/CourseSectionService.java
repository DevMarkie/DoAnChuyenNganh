package com.sms.service;

import com.sms.dto.request.CourseSectionRequest;
import com.sms.entity.*;
import com.sms.exception.*;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseSectionService {

    private final CourseSectionRepository courseSectionRepository;
    private final SubjectRepository subjectRepository;
    private final LecturerRepository lecturerRepository;
    private final SemesterRepository semesterRepository;
    private final ScheduleRepository scheduleRepository;

    public List<CourseSection> findAll() {
        return courseSectionRepository.findAll();
    }

    /**
     * Tìm kiếm lớp học phần phân trang với bộ lọc tùy chọn.
     */
    public Page<CourseSection> findPaged(String keyword, Integer semesterId, String status, Pageable pageable) {
        CourseSection.SectionStatus parsedStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                parsedStatus = CourseSection.SectionStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException("Trạng thái không hợp lệ: " + status);
            }
        }
        return courseSectionRepository.findPaged(keyword, semesterId, parsedStatus, pageable);
    }

    public CourseSection findById(Long id) {
        return courseSectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học phần với ID: " + id));
    }

    public List<CourseSection> findBySemester(Integer semesterId) {
        return courseSectionRepository.findBySemesterId(semesterId);
    }

    public List<CourseSection> findOpenBySemester(Integer semesterId) {
        Semester semester = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học kỳ"));
        if (!semester.isRegistrationOpen()) {
            return List.of();
        }
        return courseSectionRepository.findOpenSectionsBySemester(semesterId);
    }

    public List<CourseSection> findByLecturer(Long lecturerId) {
        return courseSectionRepository.findByLecturerIdWithDetails(lecturerId);
    }

    @Transactional
    public CourseSection create(CourseSectionRequest request) {
        if (courseSectionRepository.existsBySectionCode(request.getSectionCode())) {
            throw new BadRequestException("Mã học phần đã tồn tại");
        }
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy môn học"));
        Lecturer lecturer = lecturerRepository.findById(request.getLecturerId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giảng viên"));
        Semester semester = semesterRepository.findById(request.getSemesterId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học kỳ"));

        CourseSection section = new CourseSection();
        section.setSectionCode(request.getSectionCode());
        section.setSubject(subject);
        section.setLecturer(lecturer);
        section.setSemester(semester);
        section.setMaxStudents(request.getMaxStudents() != null ? request.getMaxStudents() : 40);
        section.setCurrentStudents(0);
        section.setSchedule(request.getSchedule());
        section.setRoom(request.getRoom());
        section.setStatus(parseStatus(request.getStatus(), CourseSection.SectionStatus.OPEN));
        CourseSection saved = courseSectionRepository.save(section);
        saveStructuredSchedule(saved, request, null);
        return saved;
    }

    @Transactional
    public CourseSection update(Long id, CourseSectionRequest request) {
        CourseSection section = findById(id);

        if (request.getLecturerId() != null) {
            Lecturer lecturer = lecturerRepository.findById(request.getLecturerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giảng viên"));
            section.setLecturer(lecturer);
        }
        if (request.getMaxStudents() != null) {
            if (request.getMaxStudents() < section.getCurrentStudents()) {
                throw new BadRequestException("Sĩ số tối đa không được nhỏ hơn số sinh viên đã đăng ký ("
                        + section.getCurrentStudents() + ")");
            }
            section.setMaxStudents(request.getMaxStudents());
        }
        section.setSchedule(request.getSchedule());
        section.setRoom(request.getRoom());
        if (request.getStatus() != null) {
            section.setStatus(parseStatus(request.getStatus(), section.getStatus()));
        }
        CourseSection saved = courseSectionRepository.save(section);
        Long existingScheduleId = scheduleRepository.findBySectionId(id).stream()
                .findFirst()
                .map(Schedule::getId)
                .orElse(null);
        saveStructuredSchedule(saved, request, existingScheduleId);
        return saved;
    }

    private void saveStructuredSchedule(CourseSection section, CourseSectionRequest request, Long existingScheduleId) {
        boolean hasSchedule = request.getDayOfWeek() != null
                || request.getStartPeriod() != null
                || request.getEndPeriod() != null
                || request.getStartDate() != null
                || request.getEndDate() != null;
        if (!hasSchedule) {
            return;
        }
        if (request.getDayOfWeek() == null || request.getStartPeriod() == null || request.getEndPeriod() == null) {
            throw new BadRequestException("Phải nhập đủ thứ học, tiết bắt đầu và tiết kết thúc");
        }
        if (request.getDayOfWeek() < 2 || request.getDayOfWeek() > 8
                || request.getStartPeriod() < 1 || request.getStartPeriod() > 12
                || request.getEndPeriod() < request.getStartPeriod() || request.getEndPeriod() > 12) {
            throw new BadRequestException("Thứ hoặc tiết học không hợp lệ");
        }

        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : section.getSemester().getStartDate();
        LocalDate endDate = request.getEndDate() != null ? request.getEndDate() : section.getSemester().getEndDate();
        if (endDate.isBefore(startDate)) {
            throw new BadRequestException("Ngày kết thúc lịch học phải sau ngày bắt đầu");
        }
        String room = request.getRoom() != null && !request.getRoom().isBlank() ? request.getRoom() : section.getRoom();
        if (room == null || room.isBlank()) {
            throw new BadRequestException("Phải nhập phòng học khi tạo lịch cấu trúc");
        }

        if (!scheduleRepository.findRoomConflicts(room, request.getDayOfWeek(), request.getStartPeriod(),
                request.getEndPeriod(), startDate, endDate, existingScheduleId).isEmpty()) {
            throw new BadRequestException("Phòng học bị trùng lịch trong khoảng thời gian đã chọn");
        }
        if (!scheduleRepository.findLecturerConflicts(section.getLecturer().getId(), request.getDayOfWeek(),
                request.getStartPeriod(), request.getEndPeriod(), startDate, endDate, existingScheduleId).isEmpty()) {
            throw new BadRequestException("Giảng viên bị trùng lịch trong khoảng thời gian đã chọn");
        }

        Schedule schedule = existingScheduleId == null ? new Schedule() : scheduleRepository.findById(existingScheduleId)
                .orElseGet(Schedule::new);
        schedule.setSection(section);
        schedule.setDayOfWeek(request.getDayOfWeek());
        schedule.setStartPeriod(request.getStartPeriod());
        schedule.setEndPeriod(request.getEndPeriod());
        schedule.setRoom(room);
        schedule.setStartDate(startDate);
        schedule.setEndDate(endDate);
        scheduleRepository.save(schedule);
    }

    private CourseSection.SectionStatus parseStatus(String status, CourseSection.SectionStatus defaultStatus) {
        if (status == null || status.isBlank()) {
            return defaultStatus;
        }
        try {
            return CourseSection.SectionStatus.valueOf(status);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Trạng thái lớp học phần không hợp lệ");
        }
    }
}
