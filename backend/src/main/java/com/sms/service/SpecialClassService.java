package com.sms.service;

import com.sms.entity.*;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SpecialClassService {
    private final ClassOpeningRequestRepository requestRepository;
    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final SemesterRepository semesterRepository;
    private final CourseSectionRepository sectionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final FeeScaleRuleRepository feeScaleRuleRepository;
    private final StudentInvoiceRepository invoiceRepository;
    private final LecturerRepository lecturerRepository;

    @Transactional
    public ClassOpeningRequest submitRequest(Long userId, Integer subjectId, Integer semesterId,
                                             ClassOpeningRequest.RequestType type) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy môn học"));
        Semester semester = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học kỳ"));
        if (sectionRepository.findBySubjectId(subjectId).stream()
                .anyMatch(s -> s.getSemester().getId().equals(semesterId)
                        && s.getStatus() != CourseSection.SectionStatus.CANCELLED)) {
            throw new BadRequestException("Môn học đã có lớp mở trong học kỳ này");
        }
        if (requestRepository.existsByStudentIdAndSubjectIdAndSemesterId(student.getId(), subjectId, semesterId)) {
            throw new BadRequestException("Sinh viên chỉ được gửi một đơn cho môn học trong kỳ này");
        }
        ClassOpeningRequest request = new ClassOpeningRequest();
        request.setStudent(student);
        request.setSubject(subject);
        request.setSemester(semester);
        request.setRequestType(type);
        return requestRepository.save(request);
    }

    @Transactional
    public CourseSection createSpecialSection(Integer subjectId, Integer semesterId, Long lecturerId,
                                               String sectionCode, Integer maxStudents, BigDecimal baseRate) {
        List<ClassOpeningRequest> requests = requestRepository.findPendingForUpdate(
                subjectId, semesterId, ClassOpeningRequest.RequestStatus.PENDING);
        if (requests.isEmpty()) {
            throw new BadRequestException("Không có đơn đề nghị mở lớp đang chờ xử lý");
        }
        if (!sectionRepository.findNonCancelledBySubjectAndSemester(subjectId, semesterId).isEmpty()) {
            throw new BadRequestException("Môn học đã có lớp đang mở trong học kỳ này");
        }
        int capacity = maxStudents == null ? requests.size() : maxStudents;
        if (capacity < requests.size()) {
            throw new BadRequestException("Sĩ số tối đa không được nhỏ hơn số đơn đang chờ duyệt ("
                    + requests.size() + ")");
        }
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy môn học"));
        Semester semester = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học kỳ"));
        Lecturer lecturer = lecturerRepository.findById(lecturerId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giảng viên"));

        CourseSection section = new CourseSection();
        section.setSectionCode(sectionCode);
        section.setSubject(subject);
        section.setSemester(semester);
        section.setLecturer(lecturer);
        section.setSectionType(CourseSection.SectionType.SPECIAL);
        section.setMaxStudents(capacity);
        section.setMinStudents(1);
        section.setCurrentStudents(0);
        section.setBaseTuitionRate(baseRate == null ? BigDecimal.ZERO
                : baseRate.max(minimumTuitionRate(subject)));
        section.setStatus(CourseSection.SectionStatus.PENDING_FEE);
        CourseSection saved = sectionRepository.save(section);
        for (ClassOpeningRequest request : requests) {
            if (enrollmentRepository.existsByStudentIdAndSectionSubjectIdAndSectionSemesterIdAndStatus(
                    request.getStudent().getId(), subjectId, semesterId, Enrollment.EnrollmentStatus.ENROLLED)) {
                throw new BadRequestException("Sinh viên " + request.getStudent().getStudentCode()
                        + " đã đăng ký môn học này trong học kỳ");
            }
            request.setStatus(ClassOpeningRequest.RequestStatus.APPROVED);
            Enrollment enrollment = new Enrollment();
            enrollment.setStudent(request.getStudent());
            enrollment.setSection(saved);
            enrollment.setEnrollmentType(toEnrollmentType(request.getRequestType()));
            enrollmentRepository.save(enrollment);
        }
        return saved;
    }

    @Transactional
    public CourseSection finalizeBilling(Long sectionId) {
        CourseSection section = sectionRepository.findByIdForEnrollment(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));
        if (section.getSectionType() != CourseSection.SectionType.SPECIAL
                || section.getStatus() != CourseSection.SectionStatus.PENDING_FEE) {
            throw new BadRequestException("Chỉ được chốt lớp riêng đang chờ tính phí");
        }
        int count = enrollmentRepository.findActiveBySectionId(sectionId).size();
        FeeScaleRule rule = feeScaleRuleRepository
                .findFirstByMinStudentsLessThanEqualAndMaxStudentsGreaterThanEqual(count, count)
                .orElseThrow(() -> new BadRequestException("Chưa cấu hình hệ số quy mô cho sĩ số " + count));
        BigDecimal coefficient = rule.getCoefficient();
        BigDecimal baseRate = section.getBaseTuitionRate();
        if (baseRate == null || baseRate.signum() <= 0) {
            throw new BadRequestException("Đơn giá chuẩn của lớp chưa được cấu hình");
        }
        section.setScaleCoefficient(coefficient);
        section.setStatus(CourseSection.SectionStatus.LOCKED_BILLING);
        for (Enrollment enrollment : enrollmentRepository.findActiveBySectionId(sectionId)) {
            int credits = section.getSubject().getCredits();
            BigDecimal amount = baseRate.multiply(coefficient).multiply(BigDecimal.valueOf(credits))
                    .setScale(2, RoundingMode.HALF_UP);
            if (!invoiceRepository.existsByStudentIdAndSectionId(enrollment.getStudent().getId(), sectionId)) {
                StudentInvoice invoice = new StudentInvoice();
                invoice.setStudent(enrollment.getStudent());
                invoice.setSection(section);
                invoice.setCredits(credits);
                invoice.setBaseRate(baseRate);
                invoice.setCoefficient(coefficient);
                invoice.setAmount(amount);
                invoiceRepository.save(invoice);
            }
        }
        return sectionRepository.save(section);
    }

    private BigDecimal minimumTuitionRate(Subject subject) {
        String departmentName = subject.getDepartment() == null ? "" : subject.getDepartment().getName();
        String normalized = departmentName.toLowerCase(java.util.Locale.ROOT);
        return normalized.contains("dược") || normalized.contains("y khoa")
                || normalized.contains("răng") ? BigDecimal.valueOf(850_000) : BigDecimal.valueOf(650_000);
    }

    private Enrollment.EnrollmentType toEnrollmentType(ClassOpeningRequest.RequestType type) {
        return switch (type) {
            case LEARN_AGAIN, NEW -> Enrollment.EnrollmentType.RETAKE;
            case IMPROVE -> Enrollment.EnrollmentType.IMPROVE;
        };
    }
}
