package com.sms.service;

import com.sms.dto.request.CourseSectionRequest;
import com.sms.entity.*;
import com.sms.exception.*;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseSectionService {

    private final CourseSectionRepository courseSectionRepository;
    private final SubjectRepository subjectRepository;
    private final LecturerRepository lecturerRepository;
    private final SemesterRepository semesterRepository;

    public List<CourseSection> findAll() {
        return courseSectionRepository.findAll();
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
        return courseSectionRepository.save(section);
    }

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
        return courseSectionRepository.save(section);
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
