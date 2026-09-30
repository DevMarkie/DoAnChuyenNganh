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
    private final ScheduleRepository scheduleRepository;
    private final GradeRepository gradeRepository;
    private final LecturerRepository lecturerRepository;
    private static final int MAX_CREDITS_PER_SEMESTER = 30;

    public List<Enrollment> findByStudent(Long studentId) {
        return enrollmentRepository.findActiveByStudentId(studentId);
    }

    public List<Enrollment> findBySection(Long sectionId) {
        return enrollmentRepository.findActiveBySectionId(sectionId);
    }

    /**
     * BR-07 (đọc): giảng viên chỉ được xem danh sách sinh viên của lớp mình phụ
     * trách. Admin (không có bản ghi Lecturer) xem được mọi lớp.
     */
    public void assertCanViewSection(Long userId, Long sectionId) {
        Lecturer lecturer = lecturerRepository.findByUserId(userId).orElse(null);
        if (lecturer == null) {
            return;
        }
        CourseSection section = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));
        if (section.getLecturer() == null || !section.getLecturer().getId().equals(lecturer.getId())) {
            throw new BadRequestException("Bạn không có quyền xem danh sách sinh viên của lớp học phần này");
        }
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

        // Schedule Conflict Validation
        Integer classId = student.getClassEntity() != null ? student.getClassEntity().getId() : null;
        List<Schedule> studentSchedules = scheduleRepository.findSchedulesForStudentAndSemester(student.getId(), classId, semester.getId().longValue());
        List<Schedule> newSchedules = scheduleRepository.findBySectionId(section.getId());

        for (Schedule newSch : newSchedules) {
            for (Schedule stuSch : studentSchedules) {
                if (newSch.getDayOfWeek().equals(stuSch.getDayOfWeek())) {
                    boolean periodOverlap = newSch.getStartPeriod() <= stuSch.getEndPeriod()
                            && newSch.getEndPeriod() >= stuSch.getStartPeriod();
                    // BA-08: chỉ trùng lịch khi khoảng NGÀY học cũng giao nhau — hai
                    // lớp cùng thứ/tiết nhưng khác nửa kỳ thì KHÔNG bị coi là trùng.
                    boolean dateOverlap = newSch.getStartDate() == null || stuSch.getStartDate() == null
                            || (!newSch.getStartDate().isAfter(stuSch.getEndDate())
                                && !newSch.getEndDate().isBefore(stuSch.getStartDate()));
                    if (periodOverlap && dateOverlap) {
                        throw new BadRequestException(String.format(
                                "Trùng lịch học! Học phần này trùng thời gian với lớp %s (%s) vào %s (Tiết %d - %d).",
                                stuSch.getSection().getSectionCode(), stuSch.getSection().getSubject().getSubjectName(),
                                stuSch.getDayOfWeekName(), stuSch.getStartPeriod(), stuSch.getEndPeriod()
                        ));
                    }
                }
            }
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

        // Check if grade exists
        if (gradeRepository.findByEnrollmentId(enrollmentId).isPresent()) {
            throw new BadRequestException("Không thể hủy học phần đã có điểm (dù là điểm thành phần)");
        }

        // Lock the same section before releasing a seat, which keeps a
        // cancellation and a concurrent enrollment in a consistent order.
        courseSectionRepository.findByIdForEnrollment(enrollment.getSection().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học phần"));
        enrollment.setStatus(Enrollment.EnrollmentStatus.CANCELLED);
        enrollmentRepository.save(enrollment);
    }

    @Transactional
    public Enrollment adminAssign(Long studentId, Long sectionId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));
        // Khoá bi quan để kiểm tra sĩ số an toàn dưới truy cập đồng thời (BUG-03),
        // đồng bộ với enroll() / adminBatchAssignClass().
        CourseSection section = courseSectionRepository.findByIdForEnrollment(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));

        Enrollment existingEnrollment = enrollmentRepository
                .findByStudentIdAndSectionId(student.getId(), sectionId)
                .orElse(null);
        if (existingEnrollment != null && existingEnrollment.getStatus() == Enrollment.EnrollmentStatus.ENROLLED) {
            throw new BadRequestException("Sinh viên đã có trong lớp học phần này");
        }

        // Kiểm tra sĩ số khi Admin giao trực tiếp
        if (section.getCurrentStudents() >= section.getMaxStudents()) {
            throw new BadRequestException(
                String.format("Học phần đã đầy (%d/%d sinh viên). Vui lòng tăng sĩ số tối đa trước.",
                        section.getCurrentStudents(), section.getMaxStudents()));
        }

        Enrollment enrollment = existingEnrollment != null ? existingEnrollment : new Enrollment();
        enrollment.setStudent(student);
        enrollment.setSection(section);
        enrollment.setStatus(Enrollment.EnrollmentStatus.ENROLLED);
        return enrollmentRepository.save(enrollment);
    }

    @Transactional
    public List<Enrollment> adminBatchAssignClass(Integer classId, Long sectionId) {
        // Lock the section so the capacity check below stays consistent even if
        // another enrollment lands concurrently.
        CourseSection section = courseSectionRepository.findByIdForEnrollment(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));
        List<Student> students = studentRepository.findByClassEntityId(classId);
        if (students.isEmpty()) {
            throw new BadRequestException("Lớp sinh hoạt này không có sinh viên nào");
        }

        // Only students not already actively enrolled will consume a seat.
        // A CANCELLED enrollment is restored (re-uses its row) and does count.
        List<Enrollment> toEnroll = new java.util.ArrayList<>();
        for (Student student : students) {
            Enrollment existing = enrollmentRepository
                    .findByStudentIdAndSectionId(student.getId(), sectionId)
                    .orElse(null);
            if (existing == null || existing.getStatus() != Enrollment.EnrollmentStatus.ENROLLED) {
                Enrollment enrollment = existing != null ? existing : new Enrollment();
                enrollment.setStudent(student);
                enrollment.setSection(section);
                enrollment.setStatus(Enrollment.EnrollmentStatus.ENROLLED);
                toEnroll.add(enrollment);
            }
        }

        // Capacity guard — the whole batch is rejected if it would overflow the
        // section, so an admin never lands the class in an over-capacity state
        // (e.g. 120 students into a 50-seat section).
        int available = section.getMaxStudents() - section.getCurrentStudents();
        if (toEnroll.size() > available) {
            throw new BadRequestException(String.format(
                    "Không đủ chỗ: cần thêm %d chỗ nhưng học phần chỉ còn trống %d/%d. Vui lòng tăng sĩ số tối đa trước.",
                    toEnroll.size(), Math.max(available, 0), section.getMaxStudents()));
        }

        List<Enrollment> results = new java.util.ArrayList<>();
        for (Enrollment enrollment : toEnroll) {
            results.add(enrollmentRepository.save(enrollment));
        }
        return results;
    }
}
