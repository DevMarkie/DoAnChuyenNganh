package com.sms.service;

import com.sms.entity.*;
import com.sms.exception.*;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final StudentRepository studentRepository;
    private static final int MAX_CREDITS_PER_SEMESTER = 30;

    public List<Enrollment> findByStudent(Long studentId) {
        return enrollmentRepository.findActiveByStudentId(studentId);
    }

    public List<Enrollment> findBySection(Long sectionId) {
        return enrollmentRepository.findActiveBySectionId(sectionId);
    }

    @Transactional
    public Enrollment enroll(Long userId, Long sectionId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));

        // Serialize changes to a section's capacity so the final slot cannot
        // be granted to more than one student at once.
        CourseSection section = courseSectionRepository.findByIdForEnrollment(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học phần"));

        // BR-05: Section must be OPEN
        if (section.getStatus() != CourseSection.SectionStatus.OPEN) {
            throw new BadRequestException("Học phần đã đóng đăng ký");
        }

        // BR-04: Check registration period
        Semester semester = section.getSemester();
        if (!semester.isRegistrationOpen()) {
            throw new BadRequestException("Hiện không trong thời gian đăng ký của học kỳ này");
        }

        // A cancelled enrollment keeps its row (and the database unique key),
        // so re-registering restores it instead of creating a duplicate.
        Enrollment existingEnrollment = enrollmentRepository
                .findByStudentIdAndSectionId(student.getId(), sectionId)
                .orElse(null);
        if (existingEnrollment != null && existingEnrollment.getStatus() != Enrollment.EnrollmentStatus.CANCELLED) {
            throw new BadRequestException("Sinh viên đã đăng ký học phần này");
        }

        // The database trigger updates enrolled_count after this enrollment is
        // persisted. The pessimistic lock above makes this capacity check safe.
        if (section.getCurrentStudents() >= section.getMaxStudents()) {
            throw new BadRequestException("Học phần đã đầy");
        }

        // BR-03: Check credit limit
        int currentCredits = enrollmentRepository.countEnrolledCredits(student.getId(), semester.getId());
        int sectionCredits = section.getSubject().getCredits();
        if (currentCredits + sectionCredits > MAX_CREDITS_PER_SEMESTER) {
            throw new BadRequestException("Vượt quá số tín chỉ tối đa trong học kỳ (" + MAX_CREDITS_PER_SEMESTER + ")");
        }

        Enrollment enrollment = existingEnrollment != null ? existingEnrollment : new Enrollment();
        enrollment.setStudent(student);
        enrollment.setSection(section);
        enrollment.setStatus(Enrollment.EnrollmentStatus.ENROLLED);

        return enrollmentRepository.save(enrollment);
    }

    @Transactional
    public void cancelEnrollment(Long userId, Long enrollmentId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));

        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đăng ký"));

        if (!enrollment.getStudent().getId().equals(student.getId())) {
            throw new BadRequestException("Không có quyền hủy đăng ký này");
        }

        if (enrollment.getStatus() != Enrollment.EnrollmentStatus.ENROLLED) {
            throw new BadRequestException("Chỉ có thể hủy đăng ký đang hoạt động");
        }

        // Lock the same section before releasing a seat, which keeps a
        // cancellation and a concurrent enrollment in a consistent order.
        courseSectionRepository.findByIdForEnrollment(enrollment.getSection().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học phần"));
        enrollment.setStatus(Enrollment.EnrollmentStatus.CANCELLED);
        enrollmentRepository.save(enrollment);
    }
}
