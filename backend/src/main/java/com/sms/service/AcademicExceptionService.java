package com.sms.service;

import com.sms.entity.*;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AcademicExceptionService {

    private final AcademicExceptionRepository exceptionRepository;
    private final StudentRepository studentRepository;
    private final CourseSectionRepository sectionRepository;
    private final SubjectRepository subjectRepository;
    private final SemesterRepository semesterRepository;
    private final EnrollmentRepository enrollmentRepository;

    @Transactional
    public AcademicException submitRequest(Long studentId, String exceptionType, Long courseSectionId,
                                          Integer subjectId, Integer semesterId, String reason, String attachmentUrl) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên: " + studentId));

        CourseSection section = null;
        if (courseSectionId != null) {
            section = sectionRepository.findById(courseSectionId).orElse(null);
        }

        Subject subject = null;
        if (subjectId != null) {
            subject = subjectRepository.findById(subjectId).orElse(null);
        } else if (section != null) {
            subject = section.getSubject();
        }

        Semester semester = null;
        if (semesterId != null) {
            semester = semesterRepository.findById(semesterId).orElse(null);
        } else if (section != null) {
            semester = section.getSemester();
        }

        AcademicException request = AcademicException.builder()
                .student(student)
                .exceptionType(exceptionType)
                .courseSection(section)
                .subject(subject)
                .semester(semester)
                .reason(reason)
                .attachmentUrl(attachmentUrl)
                .status("PENDING")
                .build();

        return exceptionRepository.save(request);
    }

    public List<AcademicException> getStudentExceptions(Long studentId) {
        return exceptionRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
    }

    public Page<AcademicException> getExceptions(String status, Pageable pageable) {
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            return exceptionRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase(), pageable);
        }
        return exceptionRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    @Transactional
    public AcademicException reviewRequest(Long exceptionId, User reviewer, String status, String note) {
        AcademicException exception = exceptionRepository.findById(exceptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn ngoại lệ học vụ: " + exceptionId));

        if (!"PENDING".equalsIgnoreCase(exception.getStatus())) {
            throw new BadRequestException("Đơn ngoại lệ học vụ này đã được xử lý trước đó");
        }

        exception.setStatus(status.toUpperCase());
        exception.setReviewedBy(reviewer);
        exception.setReviewerNote(note);
        exception.setReviewedAt(LocalDateTime.now());

        // Nếu duyệt Rút môn học (COURSE_WITHDRAWAL), cập nhật đăng ký học phần sang CANCELLED
        if ("APPROVED".equalsIgnoreCase(status) && "COURSE_WITHDRAWAL".equalsIgnoreCase(exception.getExceptionType())) {
            if (exception.getCourseSection() != null) {
                enrollmentRepository.findByStudentIdAndSectionId(exception.getStudent().getId(), exception.getCourseSection().getId())
                        .ifPresent(enrollment -> {
                            enrollment.setStatus(Enrollment.EnrollmentStatus.CANCELLED);
                            enrollmentRepository.save(enrollment);
                        });
            }
        }

        return exceptionRepository.save(exception);
    }
}
