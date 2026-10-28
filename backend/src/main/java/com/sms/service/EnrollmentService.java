package com.sms.service;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.entity.Grade;
import com.sms.entity.Lecturer;
import com.sms.entity.Schedule;
import com.sms.entity.Semester;
import com.sms.entity.Student;
import com.sms.entity.Subject;
import com.sms.entity.StudentInvoice;
import com.sms.event.EnrollmentCancelledEvent;
import com.sms.event.EnrollmentCreatedEvent;
import com.sms.exception.BadRequestException;
import com.sms.exception.PrerequisiteNotMetException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.support.TransactionTemplate;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.EnrollmentRepository;
import com.sms.repository.GradeRepository;
import com.sms.repository.LecturerRepository;
import com.sms.repository.ScheduleRepository;
import com.sms.repository.StudentRepository;
import com.sms.repository.CurriculumBlockSubjectRepository;
import com.sms.repository.CurriculumProgramRepository;
import com.sms.repository.AttendanceRecordRepository;
import com.sms.repository.StudentInvoiceRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final StudentRepository studentRepository;
    private final ScheduleRepository scheduleRepository;
    private final GradeRepository gradeRepository;
    private final LecturerRepository lecturerRepository;
    private final CurriculumProgramRepository curriculumProgramRepository;
    private final CurriculumBlockSubjectRepository curriculumBlockSubjectRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final StudentInvoiceRepository studentInvoiceRepository;
    private final RegistrationWaveService registrationWaveService;
    private final TuitionService tuitionService;
    private final ApplicationEventPublisher eventPublisher;
    private final RedisLockService redisLockService;
    private final RedisCourseSectionService redisCourseSectionService;

    @Autowired(required = false)
    private TransactionTemplate transactionTemplate;

    @Autowired(required = false)
    private org.springframework.transaction.PlatformTransactionManager transactionManager;

    @jakarta.annotation.PostConstruct
    public void initTransactionTemplate() {
        if (this.transactionTemplate == null && this.transactionManager != null) {
            this.transactionTemplate = new TransactionTemplate(this.transactionManager);
        }
    }

    private static final int MAX_CREDITS_PER_SEMESTER = 24;

    public List<Enrollment> findByStudent(Long studentId) {
        List<Enrollment> enrollments = enrollmentRepository.findAllByStudentIdWithDetails(studentId);
        if (!enrollments.isEmpty() && attendanceRecordRepository != null) {
            Map<Long, Long> absences = attendanceRecordRepository.countAbsencesByStudentId(studentId).stream()
                    .collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));
            enrollments.forEach(e -> e.setAbsenceCount(absences.getOrDefault(e.getId(), 0L).intValue()));
        }
        return enrollments;
    }

    public List<Enrollment> findBySection(Long sectionId) {
        List<Enrollment> enrollments = enrollmentRepository.findActiveBySectionId(sectionId);
        Map<Long, Long> absences = attendanceRecordRepository.countAbsencesBySectionId(sectionId).stream()
                .collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));
        enrollments.forEach(e -> e.setAbsenceCount(absences.getOrDefault(e.getId(), 0L).intValue()));
        return enrollments;
    }

    /**
     * BR-07 (đọc): giảng viên chỉ được xem danh sách sinh viên của lớp mình phụ
     * trách. Admin (không có bản ghi Lecturer) xem được mọi lớp.
     * Sinh viên và Admin có quyền xem danh sách sinh viên của lớp học phần.
     */
    public void assertCanViewSection(Long userId, Long sectionId) {
        Lecturer lecturer = lecturerRepository.findByUserId(userId).orElse(null);
        if (lecturer != null) {
            CourseSection section = courseSectionRepository.findById(sectionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));
            if (section.getLecturer() == null || !section.getLecturer().getId().equals(lecturer.getId())) {
                throw new AccessDeniedException("Bạn không có quyền xem danh sách sinh viên của lớp học phần này");
            }
            return;
        }

        Student student = studentRepository.findByUserId(userId).orElse(null);
        if (student != null) {
            boolean enrolled = enrollmentRepository
                    .findByStudentIdAndSectionId(student.getId(), sectionId).isPresent();
            if (!enrolled) {
                throw new AccessDeniedException("Bạn không có quyền xem danh sách sinh viên của lớp học phần này");
            }
            return;
        }

        if (!courseSectionRepository.existsById(sectionId)) {
            throw new ResourceNotFoundException("Không tìm thấy lớp học phần");
        }
    }

    /**
     * Đăng ký học phần chịu tải cao (Short-lived Transaction):
     * 1. Rate Limiting và Idempotency Lock theo user_id qua Redis.
     * 2. Pre-validation (trùng lịch, môn tiên quyết, giới hạn tín chỉ, nợ học phí) hoàn toàn không giữ DB transaction.
     * 3. Trừ slot nguyên tử qua Redis (Fail-Fast trong RAM).
     * 4. Mở DB Transaction ngắn: Atomic UPDATE sĩ số có điều kiện + INSERT enrollment + Đồng bộ học phí.
     * 5. Bồi hoàn slot Redis (INCR) nếu DB Transaction thất bại.
     */
    public Enrollment enroll(Long userId, Long sectionId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));

        // 1. Rate Limiting theo User (chỉ theo user_id, không theo IP)
        if (redisLockService != null && !redisLockService.tryConsumeUserRateLimit(student.getId().toString(), 5, 3)) {
            throw new BadRequestException("Bạn thao tác quá nhanh. Vui lòng đợi 3 giây rồi thử lại!");
        }

        // 2. Idempotency Lock theo User để chống spam click / double-click
        if (redisLockService != null && !redisLockService.acquireUserActionLock(student.getId(), "ENROLL", 2)) {
            throw new BadRequestException("Yêu cầu đăng ký của bạn đang được xử lý, vui lòng không nhấn liên tục!");
        }

        try {
            // BR-STATE-01: Chặn sinh viên không ở trạng thái ACTIVE (Bảo lưu hoặc Buộc thôi học)
            if (student.getStatus() != Student.StudentStatus.ACTIVE) {
                if (student.getStatus() == Student.StudentStatus.SUSPENDED) {
                    throw new BadRequestException("Tài khoản sinh viên đang trong trạng thái Bảo lưu, không được phép đăng ký học phần");
                } else if (student.getStatus() == Student.StudentStatus.INACTIVE) {
                    throw new BadRequestException("Tài khoản sinh viên đang trong trạng thái Buộc thôi học / Ngừng học, bị khóa toàn bộ quyền đăng ký môn học");
                } else {
                    throw new BadRequestException("Sinh viên không ở trạng thái đang học (ACTIVE), không thể đăng ký học phần");
                }
            }

            // BR-Tuition & Quy tắc liên thông B: Nếu sinh viên bị FINANCIAL_HOLD hoặc nợ học phí quá hạn quy định: tự động khóa quyền đăng ký học phần đợt tiếp theo
            if (student.isFinancialHold() || (tuitionService != null && tuitionService.isTuitionOverdue(student.getId()))) {
                throw new BadRequestException("Tài khoản của bạn đang bị áp dụng chế tài Đóng băng dịch vụ học vụ (FINANCIAL HOLD) do còn nợ học phí quá hạn. Vui lòng hoàn tất học phí hoặc liên hệ Phòng Kế hoạch - Tài chính.");
            }

            // Đọc thông tin học phần
            CourseSection section = courseSectionRepository.findById(sectionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học phần"));

            Semester semester = section.getSemester();
            // BR-04: Check registration period
            if (!semester.isRegistrationOpen()) {
                throw new BadRequestException("Hiện không trong thời gian đăng ký của học kỳ này");
            }

            // Kiểm tra đợt đăng ký tín chỉ (Registration Wave) phân tải theo Khóa/Khoa
            if (registrationWaveService != null) {
                registrationWaveService.validateStudentEligibleWave(student, semester.getId());
            }

            // BR-05: Section must be OPEN
            if (section.getStatus() != CourseSection.SectionStatus.OPEN) {
                throw new BadRequestException("Học phần đã đóng đăng ký");
            }

            assertInStudentCurriculum(student, section.getSubject().getId());

            // Kiểm tra sâu chuỗi môn tiên quyết trong Đồ thị môn học (DAG - Đệ quy tổ tiên)
            validatePrerequisitesRecursively(student, section.getSubject());

            // A cancelled enrollment keeps its row (and the database unique key),
            // so re-registering restores it instead of creating a duplicate.
            Enrollment existingEnrollment = enrollmentRepository
                    .findByStudentIdAndSectionId(student.getId(), sectionId)
                    .orElse(null);
            if (existingEnrollment != null && existingEnrollment.getStatus() != Enrollment.EnrollmentStatus.CANCELLED) {
                throw new BadRequestException("Sinh viên đã đăng ký học phần này");
            }

            // BR-NEW: one student may select only one section of a subject per semester.
            Optional<Enrollment> existingSubjectEnrollment = enrollmentRepository
                .findActiveEnrollmentBySubject(student.getId(), semester.getId(), section.getSubject().getId());
            if (existingSubjectEnrollment.isPresent()
                && !existingSubjectEnrollment.get().getSection().getId().equals(section.getId())) {
                CourseSection enrolledSection = existingSubjectEnrollment.get().getSection();
                throw new BadRequestException(String.format(
                    "Bạn đã đăng ký môn học '%s' tại lớp học phần %s. Không thể đăng ký thêm lớp khác của cùng một môn trong học kỳ này!",
                    section.getSubject().getSubjectName(), enrolledSection.getSectionCode()));
            }

            // Kiểm tra sĩ số còn lại
            if (section.getCurrentStudents() >= section.getMaxStudents()) {
                throw new BadRequestException("Học phần đã đầy");
            }

            // BR-03 & Quy chế xử lý học vụ: Check credit limit & Academic Warning
            if (student.getStatus() == Student.StudentStatus.SUSPENDED 
                    || (student.getAcademicWarningLevel() != null && student.getAcademicWarningLevel() >= 3)) {
                throw new BadRequestException("Tài khoản của bạn đang trong diện BUỘC THÔI HỌC do vi phạm quy chế học vụ. Cổng ĐKTC bị khóa hoàn toàn.");
            }

            int allowedMaxCredits = MAX_CREDITS_PER_SEMESTER;
            if (student.getAcademicWarningLevel() != null) {
                if (student.getAcademicWarningLevel() == 2) {
                    allowedMaxCredits = 10;
                } else if (student.getAcademicWarningLevel() == 1) {
                    allowedMaxCredits = 14;
                }
            }

            int currentCredits = enrollmentRepository.countEnrolledCredits(student.getId(), semester.getId());
            int sectionCredits = section.getSubject().getCredits();
            if (currentCredits + sectionCredits > allowedMaxCredits) {
                if (allowedMaxCredits < MAX_CREDITS_PER_SEMESTER) {
                    throw new BadRequestException(String.format(
                            "Bạn đang bị Cảnh báo học vụ Mức %d. Hạn mức đăng ký tối đa là %d tín chỉ (hiện có: %d TC, môn chọn: %d TC).",
                            student.getAcademicWarningLevel(), allowedMaxCredits, currentCredits, sectionCredits));
                }
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

            // BƯỚC 3: TRỪ SLOT NGUYÊN TỬ TRÊN REDIS (Fail-Fast tại RAM)
            boolean redisSlotReserved = false;
            if (redisCourseSectionService != null) {
                boolean acquired = redisCourseSectionService.tryAcquireSlot(sectionId);
                if (!acquired) {
                    throw new BadRequestException("Học phần đã đầy");
                }
                redisSlotReserved = true;
            }

            try {
                // BƯỚC 4: MỞ DATABASE TRANSACTION NGẮN ĐỂ GHI DỮ LIỆU
                Enrollment saved;
                if (transactionTemplate != null) {
                    saved = transactionTemplate.execute(status -> executeDatabaseEnrollment(student, section, existingEnrollment));
                } else {
                    saved = executeDatabaseEnrollment(student, section, existingEnrollment);
                }

                if (eventPublisher != null && saved != null) {
                    eventPublisher.publishEvent(new EnrollmentCreatedEvent(this, student.getId(), section.getId(), semester.getId(), saved.getId()));
                }
                return saved;

            } catch (Exception ex) {
                // Nếu lưu DB thất bại, bồi hoàn lại slot trên Redis (Bù slot INCR)
                if (redisSlotReserved && redisCourseSectionService != null) {
                    redisCourseSectionService.incrementSlot(sectionId);
                }
                throw ex;
            }

        } finally {
            if (redisLockService != null) {
                redisLockService.releaseUserActionLock(student.getId(), "ENROLL");
            }
        }
    }

    /**
     * Tầng 2: Ghi bền vững vào DB với Atomic Update kiểm tra sĩ số (Defense-in-depth).
     */
    @Transactional
    public Enrollment executeDatabaseEnrollment(Student student, CourseSection section, Enrollment existingEnrollment) {
        Long sectionId = section.getId();
        int rowsUpdated = courseSectionRepository.incrementCurrentStudentsAtomic(sectionId);
        if (rowsUpdated == 0) {
            throw new BadRequestException("Học phần đã đầy");
        }

        // Cập nhật giá trị hiển thị trên in-memory entity
        if (section.getCurrentStudents() != null) {
            section.setCurrentStudents(section.getCurrentStudents() + 1);
        }
        courseSectionRepository.save(section);

        Enrollment enrollment = existingEnrollment != null ? existingEnrollment : new Enrollment();
        enrollment.setStudent(student);
        enrollment.setSection(section);
        enrollment.setStatus(Enrollment.EnrollmentStatus.ENROLLED);
        Integer subjectId = (section.getSubject() != null) ? section.getSubject().getId() : null;
        enrollment.setEnrollmentType(resolveEnrollmentType(student.getId(), subjectId));

        Enrollment saved = enrollmentRepository.save(enrollment);

        // Đồng bộ hóa đơn học phí ngay trong cùng ACID Transaction
        if (tuitionService != null) {
            tuitionService.syncEnrollmentInvoice(student, section);
        }

        return saved;
    }

    private void assertInStudentCurriculum(Student student, Integer subjectId) {
        if (curriculumProgramRepository == null || curriculumBlockSubjectRepository == null
                || student.getClassEntity() == null || student.getClassEntity().getMajor() == null
                || student.getClassEntity().getCohort() == null) {
            return;
        }
        var program = curriculumProgramRepository.findActiveByMajorAndCohort(
                student.getClassEntity().getMajor().getId(), student.getClassEntity().getCohort().getId())
                .orElseThrow(() -> new BadRequestException("Bạn chưa được gán chương trình đào tạo hợp lệ"));
        if (!curriculumBlockSubjectRepository.existsByProgramIdAndSubjectId(program.getId(), subjectId)) {
            throw new BadRequestException("Học phần không nằm trong chương trình đào tạo của bạn");
        }
    }

    @Transactional
    public void unenroll(Long userId, Long enrollmentId) {
        cancelEnrollment(userId, enrollmentId);
    }

    @Transactional
    public void cancelEnrollment(Long userId, Long enrollmentId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));

        // Idempotency Lock khi hủy môn
        if (redisLockService != null && !redisLockService.acquireUserActionLock(student.getId(), "CANCEL_" + enrollmentId, 2)) {
            throw new BadRequestException("Yêu cầu hủy môn đang được xử lý, vui lòng không nhấn liên tục!");
        }

        try {
            Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đăng ký"));

            if (!enrollment.getStudent().getId().equals(student.getId())) {
                throw new AccessDeniedException("Bạn không có quyền hủy đăng ký này");
            }

            if (enrollment.getStatus() != Enrollment.EnrollmentStatus.ENROLLED) {
                throw new BadRequestException("Chỉ có thể hủy đăng ký đang hoạt động");
            }

            // BR-ENR-02: sinh viên chỉ được tự hủy học phần trong thời gian đăng ký
            if (!enrollment.getSection().getSemester().isRegistrationOpen()) {
                throw new BadRequestException("Thời gian đăng ký/hủy học phần của học kỳ này đã kết thúc.");
            }

            // Check if grade exists
            if (gradeRepository.findByEnrollmentId(enrollmentId).isPresent()) {
                throw new BadRequestException("Không thể hủy học phần đã có điểm (dù là điểm thành phần)");
            }

            CourseSection section = courseSectionRepository.findById(enrollment.getSection().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học phần"));
            enrollment.setStatus(Enrollment.EnrollmentStatus.CANCELLED);
            enrollmentRepository.save(enrollment);

            courseSectionRepository.decrementCurrentStudentsAtomic(section.getId());
            if (section.getCurrentStudents() != null && section.getCurrentStudents() > 0) {
                section.setCurrentStudents(section.getCurrentStudents() - 1);
            }
            courseSectionRepository.save(section);

            // Hoàn lại slot trên Redis
            if (redisCourseSectionService != null) {
                redisCourseSectionService.incrementSlot(section.getId());
            }

            if (studentInvoiceRepository != null) {
                studentInvoiceRepository.findByStudentIdAndSectionId(student.getId(), section.getId())
                        .ifPresent(invoice -> {
                            if (invoice.getStatus() == StudentInvoice.InvoiceStatus.UNPAID) {
                                invoice.setStatus(StudentInvoice.InvoiceStatus.CANCELLED);
                                studentInvoiceRepository.save(invoice);
                            } else if (invoice.getStatus() == StudentInvoice.InvoiceStatus.PAID) {
                                java.math.BigDecimal refundAmount = invoice.getAmount() != null ? invoice.getAmount() : java.math.BigDecimal.ZERO;
                                java.math.BigDecimal currentBalance = student.getBalance() != null ? student.getBalance() : java.math.BigDecimal.ZERO;
                                student.setBalance(currentBalance.add(refundAmount));
                                studentRepository.save(student);
                                invoice.setStatus(StudentInvoice.InvoiceStatus.CANCELLED);
                                studentInvoiceRepository.save(invoice);
                            }
                        });
            }

            if (eventPublisher != null) {
                eventPublisher.publishEvent(new EnrollmentCancelledEvent(this, student.getId(), section.getId(), section.getSemester().getId(), enrollment.getId()));
            }

        } finally {
            if (redisLockService != null) {
                redisLockService.releaseUserActionLock(student.getId(), "CANCEL_" + enrollmentId);
            }
        }
    }

    @Transactional
    public Enrollment enrollOverride(Long studentId, Long sectionId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));
        CourseSection section = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));

        Enrollment existingEnrollment = enrollmentRepository
                .findByStudentIdAndSectionId(student.getId(), section.getId())
                .orElse(null);

        if (existingEnrollment != null && existingEnrollment.getStatus() == Enrollment.EnrollmentStatus.ENROLLED) {
            throw new BadRequestException("Sinh viên đã được ghi danh vào lớp học phần này");
        }

        Enrollment enrollment = existingEnrollment != null ? existingEnrollment : new Enrollment();
        enrollment.setStudent(student);
        enrollment.setSection(section);
        enrollment.setStatus(Enrollment.EnrollmentStatus.ENROLLED);
        enrollment.setEnrollmentType(resolveEnrollmentType(student.getId(), section.getSubject().getId()));

        Enrollment saved = enrollmentRepository.save(enrollment);
        courseSectionRepository.incrementCurrentStudentsAtomic(section.getId());
        if (section.getCurrentStudents() != null) {
            section.setCurrentStudents(section.getCurrentStudents() + 1);
        }
        if (redisCourseSectionService != null) {
            redisCourseSectionService.tryAcquireSlot(section.getId());
        }

        if (eventPublisher != null) {
            eventPublisher.publishEvent(new EnrollmentCreatedEvent(this, saved));
        }
        return saved;
    }

    @Transactional
    public void cancelEnrollmentOverride(Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bản ghi đăng ký"));

        if (enrollment.getStatus() != Enrollment.EnrollmentStatus.ENROLLED) {
            throw new BadRequestException("Chỉ có thể hủy đăng ký đang hoạt động");
        }

        CourseSection section = courseSectionRepository.findById(enrollment.getSection().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));

        enrollment.setStatus(Enrollment.EnrollmentStatus.CANCELLED);
        enrollmentRepository.save(enrollment);
        courseSectionRepository.decrementCurrentStudentsAtomic(section.getId());
        if (section.getCurrentStudents() != null && section.getCurrentStudents() > 0) {
            section.setCurrentStudents(section.getCurrentStudents() - 1);
        }

        if (redisCourseSectionService != null) {
            redisCourseSectionService.incrementSlot(section.getId());
        }

        if (studentInvoiceRepository != null) {
            studentInvoiceRepository.findByStudentIdAndSectionId(enrollment.getStudent().getId(), enrollment.getSection().getId())
                    .ifPresent(invoice -> {
                        if (invoice.getStatus() == StudentInvoice.InvoiceStatus.UNPAID) {
                            invoice.setStatus(StudentInvoice.InvoiceStatus.CANCELLED);
                            studentInvoiceRepository.save(invoice);
                        } else if (invoice.getStatus() == StudentInvoice.InvoiceStatus.PAID) {
                            java.math.BigDecimal refundAmount = invoice.getAmount() != null ? invoice.getAmount() : java.math.BigDecimal.ZERO;
                            Student st = enrollment.getStudent();
                            java.math.BigDecimal currentBalance = st.getBalance() != null ? st.getBalance() : java.math.BigDecimal.ZERO;
                            st.setBalance(currentBalance.add(refundAmount));
                            studentRepository.save(st);
                            invoice.setStatus(StudentInvoice.InvoiceStatus.CANCELLED);
                            studentInvoiceRepository.save(invoice);
                        }
                    });
        }
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new EnrollmentCancelledEvent(this, enrollment));
        }
    }

    @Transactional
    public Enrollment adminUpdateStatus(Long enrollmentId, Enrollment.EnrollmentStatus newStatus) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bản ghi đăng ký"));
        enrollment.setStatus(newStatus);
        return enrollmentRepository.save(enrollment);
    }

    private Enrollment.EnrollmentType resolveEnrollmentType(Long studentId, Integer subjectId) {
        if (gradeRepository == null || studentId == null || subjectId == null) {
            return Enrollment.EnrollmentType.FIRST_TIME;
        }
        List<Grade> previousGrades = gradeRepository.findFinalizedByStudentAndSubject(studentId, subjectId);
        if (previousGrades == null || previousGrades.isEmpty()) {
            return Enrollment.EnrollmentType.FIRST_TIME;
        }
        return previousGrades.stream().anyMatch(g -> Boolean.TRUE.equals(g.getIsPassed()))
            ? Enrollment.EnrollmentType.IMPROVE
            : Enrollment.EnrollmentType.RETAKE;
    }

    private void validatePrerequisitesRecursively(Student student, Subject targetSubject) {
        try {
            if (targetSubject.getPrerequisites() == null || targetSubject.getPrerequisites().isEmpty()) {
                return;
            }

            Set<Integer> visited = new HashSet<>();
            Queue<Subject> queue = new LinkedList<>(targetSubject.getPrerequisites());
            List<Subject> missingPrereqs = new ArrayList<>();

            while (!queue.isEmpty()) {
                Subject prereq = queue.poll();
                if (prereq == null || !visited.add(prereq.getId())) {
                    continue;
                }

                if (!gradeRepository.existsPassedFinalizedByStudentAndSubject(student.getId(), prereq.getId())) {
                    missingPrereqs.add(prereq);
                }

                try {
                    if (prereq.getPrerequisites() != null && !prereq.getPrerequisites().isEmpty()) {
                        queue.addAll(prereq.getPrerequisites());
                    }
                } catch (Exception ignored) {
                }
            }

            if (!missingPrereqs.isEmpty()) {
                Subject firstMissing = missingPrereqs.get(0);
                throw new PrerequisiteNotMetException(
                        targetSubject.getSubjectCode(),
                        firstMissing.getSubjectCode(),
                        firstMissing.getSubjectName());
            }
        } catch (org.hibernate.LazyInitializationException ex) {
            log.warn("Cannot lazily initialize prerequisites outside session: {}", ex.getMessage());
        }
    }
}
