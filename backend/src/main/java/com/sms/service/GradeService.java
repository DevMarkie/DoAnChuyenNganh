package com.sms.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sms.dto.request.GradeRequest;
import com.sms.dto.response.SectionGradeOverviewDto;
import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.entity.Grade;
import com.sms.entity.GradeAuditLog;
import com.sms.entity.Lecturer;
import com.sms.entity.Semester;
import com.sms.entity.User;
import com.sms.exception.BadRequestException;
import org.springframework.security.access.AccessDeniedException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.EnrollmentRepository;
import com.sms.repository.GradeAuditLogRepository;
import com.sms.repository.GradeRepository;
import com.sms.repository.LecturerRepository;
import com.sms.repository.SemesterRepository;
import com.sms.repository.UserRepository;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import jakarta.servlet.http.HttpServletRequest;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GradeService {

    private final GradeRepository gradeRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final LecturerRepository lecturerRepository;
    private final SemesterRepository semesterRepository;
    private final NotificationService notificationService;
    private final GradeAuditLogRepository gradeAuditLogRepository;
    private final UserRepository userRepository;

    public List<Grade> findBySection(Long sectionId) {
        List<Enrollment> enrollments = enrollmentRepository.findActiveBySectionId(sectionId);
        if (enrollments.isEmpty()) {
            return List.of();
        }

        List<Long> enrollmentIds = enrollments.stream()
                .map(Enrollment::getId)
                .toList();
        Map<Long, Grade> gradesByEnrollmentId = gradeRepository.findByEnrollmentIdIn(enrollmentIds)
                .stream()
                .collect(Collectors.toMap(g -> g.getEnrollment().getId(), Function.identity()));

        return enrollments.stream()
                .map(enrollment -> gradesByEnrollmentId.computeIfAbsent(enrollment.getId(), id -> {
                    Grade grade = new Grade();
                    grade.setEnrollment(enrollment);
                    return grade;
                }))
                .toList();
    }

    /**
     * BR-07 (đọc): giảng viên chỉ được xem/xuất bảng điểm của lớp mình phụ trách.
     * Admin (không có bản ghi Lecturer) được xem mọi lớp. Ném lỗi nếu không có quyền.
     */
    public void assertCanViewSection(Long userId, Long sectionId) {
        Lecturer lecturer = lecturerRepository.findByUserId(userId).orElse(null);
        if (lecturer == null) {
            return; // admin — toàn quyền xem
        }
        CourseSection section = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));
        if (section.getLecturer() == null || !section.getLecturer().getId().equals(lecturer.getId())) {
            throw new AccessDeniedException("Bạn không có quyền xem bảng điểm của lớp học phần này");
        }
    }

    /**
     * Nhập/cập nhật điểm cho một enrollment
     * BR-07: Giảng viên chỉ được nhập điểm cho HP mình phụ trách
     */
    @Transactional
    public Grade saveGrade(Long userId, GradeRequest request) {
        Enrollment enrollment = enrollmentRepository.findById(request.getEnrollmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đăng ký"));

        Lecturer lecturer = lecturerRepository.findByUserId(userId).orElse(null);
        User currentUser = (userRepository != null && userId != null) ? userRepository.findById(userId).orElse(null) : null;

        Grade grade = gradeRepository.findByEnrollmentId(enrollment.getId())
                .orElseGet(() -> {
                    Grade g = new Grade();
                    g.setEnrollment(enrollment);
                    return g;
                });

        List<GradeAuditLog> auditLogs = new ArrayList<>();
        applyScores(userId, request, enrollment, grade, lecturer, currentUser, auditLogs);

        // Activity #14: chỉ được chốt khi cả lớp học phần đã có điểm đầy đủ (100%).
        if (Boolean.TRUE.equals(request.getFinalize())) {
            CourseSection section = enrollment.getSection();
            if (section.getStatus() != CourseSection.SectionStatus.ACTIVE && section.getStatus() != CourseSection.SectionStatus.CLOSED) {
                throw new BadRequestException("Chỉ có thể chốt điểm khi lớp học phần đang ở trạng thái CLOSED hoặc ACTIVE");
            }
            if (grade.getTotalScore() == null && grade.getSpecialGrade() == Grade.SpecialGrade.NONE) {
                throw new BadRequestException("Không thể chốt điểm khi chưa nhập đủ điểm thành phần");
            }
            verifyAllStudentsGraded(section.getId(),
                    Map.of(enrollment.getId(), grade));
            grade.setIsFinalized(true);
            // Đặt mốc ân hạn ở lần chốt đầu tiên; sửa trong cửa sổ không được gia hạn thêm.
            if (grade.getFinalizedAt() == null) {
                grade.setFinalizedAt(LocalDateTime.now());
            }
            section.setStatus(CourseSection.SectionStatus.COMPLETED);
            courseSectionRepository.save(section);
            log.info("AUDIT: userId={} finalized grade for enrollmentId={} (section={})",
                    userId, enrollment.getId(), section.getSectionCode());
        }
        Grade saved = gradeRepository.save(grade);
        if (gradeAuditLogRepository != null && !auditLogs.isEmpty()) {
            auditLogs.forEach(l -> l.setGrade(saved));
            gradeAuditLogRepository.saveAll(auditLogs);
        }
        if (enrollment.getSection() != null) {
            boolean isFinalized = Boolean.TRUE.equals(request.getFinalize());
            notificationService.notifySectionGradeEvent(enrollment.getSection().getId(), isFinalized);
        }
        return saved;
    }

    /**
     * Nhập điểm hàng loạt cho một học phần.
     * Bulk-fetches the lecturer, enrollments and existing grades up front so the
     * whole batch runs in a handful of queries instead of ~4 per row (N+1).
     */
    @Transactional
    public void saveGrades(Long userId, List<GradeRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return;
        }

        // Resolve the lecturer once — userId is constant for the whole batch.
        Lecturer lecturer = lecturerRepository.findByUserId(userId).orElse(null);
        User currentUser = (userRepository != null && userId != null) ? userRepository.findById(userId).orElse(null) : null;
        List<GradeAuditLog> allAuditLogs = new ArrayList<>();

        List<Long> enrollmentIds = requests.stream()
                .map(GradeRequest::getEnrollmentId)
                .distinct()
                .toList();

        Map<Long, Enrollment> enrollmentsById = enrollmentRepository.findByIdInWithSection(enrollmentIds)
                .stream()
                .collect(Collectors.toMap(Enrollment::getId, Function.identity()));

        Map<Long, Grade> gradesByEnrollmentId = gradeRepository.findByEnrollmentIdIn(enrollmentIds)
                .stream()
                .collect(Collectors.toMap(g -> g.getEnrollment().getId(), Function.identity()));

        // BA-02: chốt điểm theo TỪNG lớp học phần — chỉ khoá những section thực sự
        // có yêu cầu finalize, thay vì khoá cả loạt khi bất kỳ dòng nào bật cờ.
        java.util.Set<Long> finalizeSectionIds = requests.stream()
                .filter(r -> Boolean.TRUE.equals(r.getFinalize()))
                .map(r -> enrollmentsById.get(r.getEnrollmentId()))
                .filter(java.util.Objects::nonNull)
                .map(e -> e.getSection().getId())
                .collect(Collectors.toSet());

        // Phase 1: apply component scores + recompute totals (no locking yet).
        List<Grade> toSave = new ArrayList<>(requests.size());
        for (GradeRequest request : requests) {
            Enrollment enrollment = enrollmentsById.get(request.getEnrollmentId());
            if (enrollment == null) {
                throw new ResourceNotFoundException("Không tìm thấy đăng ký: " + request.getEnrollmentId());
            }
            Grade grade = gradesByEnrollmentId.computeIfAbsent(enrollment.getId(), id -> {
                Grade g = new Grade();
                g.setEnrollment(enrollment);
                return g;
            });
            applyScores(userId, request, enrollment, grade, lecturer, currentUser, allAuditLogs);
            toSave.add(grade);
        }

        // Phase 2 (Activity #14): chỉ chốt được khi MỌI sinh viên trong lớp đã có
        // điểm tổng kết. Kiểm tra đủ 100% trước khi khoá bảng điểm.
        if (!finalizeSectionIds.isEmpty()) {
            for (Long sectionId : finalizeSectionIds) {
                CourseSection section = courseSectionRepository.findById(sectionId)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));
                if (section.getStatus() != CourseSection.SectionStatus.ACTIVE && section.getStatus() != CourseSection.SectionStatus.CLOSED) {
                    throw new BadRequestException("Chỉ có thể chốt điểm khi lớp học phần đang ở trạng thái CLOSED hoặc ACTIVE");
                }
                verifyAllStudentsGraded(sectionId, gradesByEnrollmentId);
                section.setStatus(CourseSection.SectionStatus.COMPLETED);
                courseSectionRepository.save(section);
            }
            LocalDateTime now = LocalDateTime.now();
            toSave.stream()
                    .filter(g -> finalizeSectionIds.contains(g.getEnrollment().getSection().getId()))
                    .forEach(g -> {
                        g.setIsFinalized(true);
                        // Mốc ân hạn chỉ đặt ở lần chốt đầu; chốt lại không gia hạn.
                        if (g.getFinalizedAt() == null) {
                            g.setFinalizedAt(now);
                        }
                    });
            log.info("AUDIT: userId={} finalized grade sheet for sectionIds={}", userId, finalizeSectionIds);
        }

        gradeRepository.saveAll(toSave);
        if (gradeAuditLogRepository != null && !allAuditLogs.isEmpty()) {
            gradeAuditLogRepository.saveAll(allAuditLogs);
        }

        // Phát thông báo đẩy thời gian thực cho sinh viên trong các lớp học phần có cập nhật điểm
        java.util.Set<Long> affectedSectionIds = toSave.stream()
                .map(g -> g.getEnrollment().getSection().getId())
                .collect(Collectors.toSet());

        for (Long sectionId : affectedSectionIds) {
            boolean isFinalized = finalizeSectionIds.contains(sectionId);
            notificationService.notifySectionGradeEvent(sectionId, isFinalized);
        }
    }

    /**
     * Lưu các dòng điểm đã được preview từ file Excel cho đúng một lớp học phần.
     * Việc kiểm tra sectionId ở đây ngăn client tráo enrollmentId của lớp khác
     * giữa bước preview và bước commit.
     */
    @Transactional
    public void saveImportedGrades(Long userId, Long sectionId, List<GradeRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return;
        }

        courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));

        List<Long> enrollmentIds = requests.stream()
                .map(GradeRequest::getEnrollmentId)
                .distinct()
                .toList();
        List<Enrollment> enrollments = enrollmentRepository.findByIdInWithSection(enrollmentIds);

        if (enrollments.size() != enrollmentIds.size()
                || enrollments.stream().anyMatch(e -> !sectionId.equals(e.getSection().getId()))) {
            throw new BadRequestException("Có dòng điểm không thuộc lớp học phần đang nhập");
        }

        saveGrades(userId, requests);
    }

    /**
     * Apply a grade request's component scores onto a (possibly new) Grade in memory
     * and recompute the total. Enforces BR-07 (lecturer only edits their own sections)
     * and blocks a lecturer from touching an already-finalized grade. Does NOT finalize —
     * locking is handled by the callers after the section-completeness gate. Admin may
     * explicitly reopen (unlock) a finalized grade by sending finalize=false.
     */
    private void applyScores(Long userId, GradeRequest request, Enrollment enrollment,
                             Grade grade, Lecturer lecturer, User currentUser,
                             List<GradeAuditLog> auditLogs) {
        CourseSection section = enrollment.getSection();
        // BR-07: Check lecturer authorization first
        if (lecturer != null && (section.getLecturer() == null || !section.getLecturer().getId().equals(lecturer.getId()))) {
            throw new AccessDeniedException("Bạn không có quyền nhập điểm cho học phần này");
        }

        if (section.getStatus() == CourseSection.SectionStatus.OPEN) {
            throw new BadRequestException("Lớp học phần đang mở đăng ký (OPEN), chưa được phép nhập điểm");
        }
        if (section.getStatus() == CourseSection.SectionStatus.CANCELLED) {
            throw new BadRequestException("Lớp học phần đã bị hủy (CANCELLED), không thể nhập điểm");
        }

        // Luồng 2: Kiểm tra trạng thái khóa sổ đối với Giảng viên
        if (lecturer != null) {
            String submissionStatus = section.getGradeSubmissionStatus();
            if ("SUBMITTED".equalsIgnoreCase(submissionStatus)) {
                throw new BadRequestException("Bảng điểm đã được gửi duyệt & khóa sổ. Giảng viên không thể tự ý sửa điểm.");
            }
            if ("PUBLISHED".equalsIgnoreCase(submissionStatus) || Boolean.TRUE.equals(grade.getIsFinalized())) {
                throw new BadRequestException("Bảng điểm đã được Phòng Đào tạo phát hành chính thức. Giảng viên không thể tự ý sửa điểm.");
            }

            // BR-Exam02: Giảng viên chỉ nhập điểm quá trình, không được nhập/sửa điểm thi kết thúc học phần
            if (request.getFinalScore() != null &&
                    (grade.getFinalScore() == null || grade.getFinalScore().compareTo(request.getFinalScore()) != 0)) {
                throw new AccessDeniedException("Giảng viên không có quyền nhập/sửa điểm thi kết thúc học phần (BR-Exam02). Điểm thi do Phòng Khảo thí nạp theo phòng thi.");
            }
        }

        String clientIp = getClientIp();
        String defaultReason = lecturer != null ? "Giảng viên cập nhật điểm quá trình" : "Điều chỉnh điểm số";
        String reason = (request.getReason() != null && !request.getReason().isBlank()) ? request.getReason() : defaultReason;

        // BR-Grade09 Audit: CC1
        if (request.getCc1Score() != null) {
            java.math.BigDecimal oldScore = grade.getCc1Score();
            java.math.BigDecimal newScore = request.getCc1Score();
            if (oldScore != null && oldScore.compareTo(newScore) != 0) {
                auditLogs.add(GradeAuditLog.builder()
                        .student(enrollment.getStudent())
                        .grade(grade)
                        .component("CC1")
                        .oldScore(oldScore)
                        .newScore(newScore)
                        .reason(reason)
                        .changedBy(currentUser)
                        .ipAddress(clientIp)
                        .createdAt(LocalDateTime.now())
                        .build());
            }
            grade.setCc1Score(newScore);
        }

        // BR-Grade09 Audit: CC2
        if (request.getCc2Score() != null) {
            java.math.BigDecimal oldScore = grade.getCc2Score();
            java.math.BigDecimal newScore = request.getCc2Score();
            if (oldScore != null && oldScore.compareTo(newScore) != 0) {
                auditLogs.add(GradeAuditLog.builder()
                        .student(enrollment.getStudent())
                        .grade(grade)
                        .component("CC2")
                        .oldScore(oldScore)
                        .newScore(newScore)
                        .reason(reason)
                        .changedBy(currentUser)
                        .ipAddress(clientIp)
                        .createdAt(LocalDateTime.now())
                        .build());
            }
            grade.setCc2Score(newScore);
        }

        // BR-Grade09 Audit: MIDTERM
        if (request.getMidtermScore() != null) {
            java.math.BigDecimal oldScore = grade.getMidtermScore();
            java.math.BigDecimal newScore = request.getMidtermScore();
            if (oldScore != null && oldScore.compareTo(newScore) != 0) {
                auditLogs.add(GradeAuditLog.builder()
                        .student(enrollment.getStudent())
                        .grade(grade)
                        .component("MIDTERM")
                        .oldScore(oldScore)
                        .newScore(newScore)
                        .reason(reason)
                        .changedBy(currentUser)
                        .ipAddress(clientIp)
                        .createdAt(LocalDateTime.now())
                        .build());
            }
            grade.setMidtermScore(newScore);
        }

        // BR-Grade09 Audit: FINAL (chỉ áp dụng khi non-lecturer cập nhật)
        if (request.getFinalScore() != null && lecturer == null) {
            java.math.BigDecimal oldScore = grade.getFinalScore();
            java.math.BigDecimal newScore = request.getFinalScore();
            if (oldScore != null && oldScore.compareTo(newScore) != 0) {
                auditLogs.add(GradeAuditLog.builder()
                        .student(enrollment.getStudent())
                        .grade(grade)
                        .component("FINAL")
                        .oldScore(oldScore)
                        .newScore(newScore)
                        .reason(reason)
                        .changedBy(currentUser)
                        .ipAddress(clientIp)
                        .createdAt(LocalDateTime.now())
                        .build());
            }
            grade.setFinalScore(newScore);
        }

        if (request.getSpecialGrade() != null) {
            Grade.SpecialGrade oldSpecial = grade.getSpecialGrade();
            Grade.SpecialGrade newSpecial = request.getSpecialGrade();
            if (oldSpecial != null && oldSpecial != newSpecial && oldSpecial != Grade.SpecialGrade.NONE) {
                auditLogs.add(GradeAuditLog.builder()
                        .student(enrollment.getStudent())
                        .grade(grade)
                        .component("SPECIAL")
                        .oldSpecialGrade(oldSpecial)
                        .newSpecialGrade(newSpecial)
                        .reason(reason)
                        .changedBy(currentUser)
                        .ipAddress(clientIp)
                        .createdAt(LocalDateTime.now())
                        .build());
            }
            grade.setSpecialGrade(newSpecial);
        }

        // Auto-calculate total score
        grade.calculateTotalScore();

        if (grade.getSpecialGrade() != null) {
            switch (grade.getSpecialGrade()) {
                case V -> {
                    grade.setTotalScore(java.math.BigDecimal.ZERO);
                    grade.setLetterGrade("F");
                    grade.setGpaPoint(java.math.BigDecimal.ZERO);
                }
                case I -> {
                    grade.setTotalScore(null);
                    grade.setLetterGrade(null);
                    grade.setGpaPoint(null);
                }
                case M -> {
                    grade.setTotalScore(null);
                    grade.setLetterGrade("M");
                    grade.setGpaPoint(null);
                }
                case NONE -> {
                    // Numeric component scores remain authoritative.
                }
            }
        }

        // Admin can explicitly unfinalize / unlock a grade. Xoá luôn mốc ân hạn để
        // lần chốt sau bắt đầu một cửa sổ 7 ngày mới.
        if (lecturer == null && Boolean.FALSE.equals(request.getFinalize())) {
            grade.setIsFinalized(false);
            grade.setFinalizedAt(null);
            if (section.getStatus() == CourseSection.SectionStatus.COMPLETED) {
                section.setStatus(CourseSection.SectionStatus.ACTIVE);
                courseSectionRepository.save(section);
            }
            log.info("AUDIT: adminUserId={} unlocked grade for enrollmentId={}", userId, enrollment.getId());
        }
    }

    public List<GradeAuditLog> getSectionAuditLogs(Long sectionId) {
        return gradeAuditLogRepository.findBySectionIdOrderByCreatedAtDesc(sectionId);
    }

    public List<GradeAuditLog> getGradeAuditLogs(Long gradeId) {
        return gradeAuditLogRepository.findByGradeIdOrderByCreatedAtDesc(gradeId);
    }

    private String getClientIp() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest req = attrs.getRequest();
                String ip = req.getHeader("X-Forwarded-For");
                if (ip == null || ip.isBlank()) {
                    ip = req.getRemoteAddr();
                }
                return ip;
            }
        } catch (Exception ignored) {
        }
        return "127.0.0.1";
    }

    /**
     * Activity #14 precondition: every non-cancelled enrollment in the section must
     * already have a complete total score before the sheet can be finalized. Grades
     * modified in the current transaction are read from {@code pending}; the rest are
     * loaded from the database. Throws if any student is still ungraded.
     */
    private void verifyAllStudentsGraded(Long sectionId, Map<Long, Grade> pending) {
        List<Enrollment> active = enrollmentRepository.findActiveBySectionId(sectionId);
        List<String> ungraded = new ArrayList<>();
        List<Long> missingEnrollmentIds = active.stream()
                .map(Enrollment::getId)
                .filter(id -> !pending.containsKey(id))
                .toList();
        Map<Long, Grade> dbGrades = missingEnrollmentIds.isEmpty() ? Map.of() :
                gradeRepository.findByEnrollmentIdIn(missingEnrollmentIds).stream()
                        .collect(Collectors.toMap(g -> g.getEnrollment().getId(), Function.identity(), (a, b) -> a));

        for (Enrollment e : active) {
            Grade g = pending.getOrDefault(e.getId(), dbGrades.get(e.getId()));
            if (g == null || (g.getTotalScore() == null && g.getSpecialGrade() == Grade.SpecialGrade.NONE)) {
                ungraded.add(e.getStudent().getStudentCode());
            }
        }
        if (!ungraded.isEmpty()) {
            throw new BadRequestException(
                    "Không thể chốt điểm: còn " + ungraded.size() + " sinh viên chưa nhập đủ điểm ("
                    + String.join(", ", ungraded) + "). Vui lòng hoàn tất nhập điểm cho tất cả "
                    + "sinh viên trước khi chốt & công bố.");
        }
    }

    public List<SectionGradeOverviewDto> getSectionsGradeOverview(Integer semesterId) {
        List<CourseSection> sections;
        if (semesterId != null) {
            sections = courseSectionRepository.findBySemesterId(semesterId);
        } else {
            Semester current = semesterRepository.findByIsCurrentTrue()
                    .orElseGet(() -> semesterRepository.findAllByOrderByStartDateDesc().stream().findFirst().orElse(null));
            if (current == null) return List.of();
            sections = courseSectionRepository.findBySemesterId(current.getId());
        }

        List<SectionGradeOverviewDto> result = new ArrayList<>();
        if (sections.isEmpty()) return result;

        List<Long> sectionIds = sections.stream().map(CourseSection::getId).toList();
        Map<Long, List<Enrollment>> enrollmentsBySection = enrollmentRepository.findActiveBySectionIdIn(sectionIds).stream()
                .collect(Collectors.groupingBy(e -> e.getSection().getId()));
        Map<Long, List<Grade>> gradesBySection = gradeRepository.findBySectionIdIn(sectionIds).stream()
                .collect(Collectors.groupingBy(g -> g.getEnrollment().getSection().getId()));

        for (CourseSection s : sections) {
            List<Enrollment> enrollments = enrollmentsBySection.getOrDefault(s.getId(), List.of());
            int enrolledCount = enrollments.size();
            List<Grade> grades = gradesBySection.getOrDefault(s.getId(), List.of());
            Map<Long, Grade> gradeByEnrollmentId = grades.stream()
                    .filter(x -> x.getEnrollment() != null)
                    .collect(Collectors.toMap(x -> x.getEnrollment().getId(), Function.identity(), (a, b) -> a));

            int gradedCount = 0;
            boolean allFinalized = enrolledCount > 0;
            LocalDateTime publishedAt = null;

            for (Enrollment e : enrollments) {
                Grade g = gradeByEnrollmentId.get(e.getId());
                if (g != null && (g.getTotalScore() != null || g.getSpecialGrade() != Grade.SpecialGrade.NONE)) {
                    gradedCount++;
                    if (Boolean.TRUE.equals(g.getIsFinalized())) {
                        if (publishedAt == null && g.getFinalizedAt() != null) {
                            publishedAt = g.getFinalizedAt();
                        }
                    } else {
                        allFinalized = false;
                    }
                } else {
                    allFinalized = false;
                }
            }

            double rate = enrolledCount > 0 ? Math.round(((double) gradedCount / enrolledCount) * 1000.0) / 10.0 : 0.0;
            String status = "NOT_GRADED";
            String subStatus = s.getGradeSubmissionStatus();
            if ("PUBLISHED".equalsIgnoreCase(subStatus) || (enrolledCount > 0 && allFinalized && gradedCount == enrolledCount)) {
                status = "PUBLISHED";
            } else if ("SUBMITTED".equalsIgnoreCase(subStatus)) {
                status = "SUBMITTED";
            } else if ("RETURNED".equalsIgnoreCase(subStatus)) {
                status = "RETURNED";
            } else if (gradedCount > 0) {
                status = "IN_PROGRESS";
            }

            if (s.getPublishedAt() != null) {
                publishedAt = s.getPublishedAt();
            }

            result.add(SectionGradeOverviewDto.builder()
                    .sectionId(s.getId())
                    .sectionCode(s.getSectionCode())
                    .subjectCode(s.getSubject() != null ? s.getSubject().getSubjectCode() : "")
                    .subjectName(s.getSubject() != null ? s.getSubject().getSubjectName() : "")
                    .credits(s.getSubject() != null ? s.getSubject().getCredits() : 0)
                    .lecturerName(s.getLecturer() != null ? s.getLecturer().getFullName() : "Chưa phân công")
                    .semesterId(s.getSemester() != null ? s.getSemester().getId() : null)
                    .semesterName(s.getSemester() != null ? s.getSemester().getSemesterName() : "")
                    .enrolledCount(enrolledCount)
                    .gradedCount(gradedCount)
                    .completionRate(rate)
                    .gradeStatus(status)
                    .isPublished("PUBLISHED".equals(status))
                    .publishedAt(publishedAt)
                    .gradeReturnReason(s.getGradeReturnReason())
                    .build());
        }
        return result;
    }

    @Transactional
    public void publishSectionGrades(Long sectionId, Long adminUserId) {
        CourseSection section = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));

        if (!"SUBMITTED".equalsIgnoreCase(section.getGradeSubmissionStatus())) {
            throw new BadRequestException("Chỉ có thể công bố bảng điểm khi giảng viên đã nộp và khóa sổ (SUBMITTED)");
        }

        List<Enrollment> active = enrollmentRepository.findActiveBySectionId(sectionId);
        if (active.isEmpty()) {
            throw new BadRequestException("Lớp học phần chưa có sinh viên nào đăng ký");
        }

        verifyAllStudentsGraded(sectionId, Map.of());

        LocalDateTime now = LocalDateTime.now();
        List<Grade> grades = gradeRepository.findBySectionId(sectionId);
        for (Grade g : grades) {
            g.setIsFinalized(true);
            if (g.getFinalizedAt() == null) {
                g.setFinalizedAt(now);
            }
        }
        gradeRepository.saveAll(grades);

        section.setStatus(CourseSection.SectionStatus.COMPLETED);
        section.setGradeSubmissionStatus("PUBLISHED");
        section.setPublishedAt(now);
        section.setGradeReturnReason(null);
        courseSectionRepository.save(section);

        notificationService.notifySectionGradeEvent(sectionId, true);
        log.info("AUDIT: adminUserId={} published entire grade sheet for section={}", adminUserId, section.getSectionCode());
    }

    @Transactional
    public void submitSectionGrades(Long sectionId, Long lecturerUserId) {
        CourseSection section = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));

        assertCanViewSection(lecturerUserId, sectionId);

        List<Enrollment> active = enrollmentRepository.findActiveBySectionId(sectionId);
        if (active.isEmpty()) {
            throw new BadRequestException("Lớp học phần chưa có sinh viên nào đăng ký");
        }

        verifyAllStudentsGraded(sectionId, java.util.Map.of());

        section.setGradeSubmissionStatus("SUBMITTED");
        courseSectionRepository.save(section);

        log.info("AUDIT: lecturerUserId={} submitted official grade sheet for section={}", lecturerUserId, section.getSectionCode());
    }

    @Transactional
    public void returnSectionGrades(Long sectionId, Long adminUserId, String reason) {
        CourseSection section = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));

        if ("PUBLISHED".equalsIgnoreCase(section.getGradeSubmissionStatus())) {
            throw new BadRequestException("Bảng điểm đã được công bố chính thức, không thể trả về. Mọi thay đổi điểm phải qua luồng phúc khảo hoặc sửa điểm.");
        }

        List<Grade> grades = gradeRepository.findBySectionId(sectionId);
        grades.forEach(g -> {
            g.setIsFinalized(false);
            g.setFinalizedAt(null);
        });
        gradeRepository.saveAll(grades);

        section.setStatus(CourseSection.SectionStatus.ACTIVE);
        section.setGradeSubmissionStatus("RETURNED");
        section.setGradeReturnReason(reason != null ? reason.trim() : "Phòng Đào tạo yêu cầu chỉnh sửa lại bảng điểm");
        courseSectionRepository.save(section);

        log.info("AUDIT: adminUserId={} returned grade sheet for section={} (reason: {})",
                adminUserId, section.getSectionCode(), reason);
    }

    @Transactional
    public void unpublishSectionGrades(Long sectionId, Long adminUserId, String reason) {
        returnSectionGrades(sectionId, adminUserId, reason);
    }
}
