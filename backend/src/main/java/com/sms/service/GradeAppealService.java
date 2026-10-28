package com.sms.service;

import com.sms.dto.request.*;
import com.sms.dto.response.TranscriptResponse;
import com.sms.entity.*;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GradeAppealService {

    private final GradeAppealRepository appealRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final GradeRepository gradeRepository;
    private final UserRepository userRepository;
    private final LecturerRepository lecturerRepository;
    private final DepartmentRepository departmentRepository;
    private final GradeAuditLogRepository gradeAuditLogRepository;
    private final SystemConfigRepository systemConfigRepository;
    private final NotificationService notificationService;
    private final TranscriptService transcriptService;

    public List<GradeAppeal> findMine(Long userId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));
        return appealRepository.findByStudentIdWithDetails(student.getId());
    }

    public List<GradeAppeal> findAll(Long requesterUserId, Long sectionId,
                                     GradeAppeal.AppealStatus status, Integer semesterId) {
        Lecturer lecturer = lecturerRepository.findByUserId(requesterUserId).orElse(null);
        return appealRepository.findAllWithDetails().stream()
                .filter(a -> lecturer == null
                        || (a.getEnrollment().getSection().getLecturer() != null
                        && lecturer.getId().equals(a.getEnrollment().getSection().getLecturer().getId()))
                        || (a.getAssignedLecturer() != null
                        && lecturer.getId().equals(a.getAssignedLecturer().getId())))
                .filter(a -> sectionId == null || sectionId.equals(a.getEnrollment().getSection().getId()))
                .filter(a -> status == null || status == a.getStatus())
                .filter(a -> semesterId == null || semesterId.equals(a.getEnrollment().getSection().getSemester().getId()))
                .toList();
    }

    @Transactional
    public GradeAppeal create(Long userId, GradeAppealRequest request) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));
        if (student.getStatus() != Student.StudentStatus.ACTIVE) {
            throw new BadRequestException("Tài khoản sinh viên đang trong trạng thái Bảo lưu / Thôi học, không được phép nộp đơn phúc khảo");
        }

        Enrollment enrollment = enrollmentRepository.findById(request.getEnrollmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đăng ký học phần"));
        if (!student.getId().equals(enrollment.getStudent().getId())) {
            throw new AccessDeniedException("Bạn không có quyền gửi phúc khảo cho đăng ký này");
        }

        Grade grade = gradeRepository.findByEnrollmentId(enrollment.getId())
                .orElseThrow(() -> new BadRequestException("Học phần chưa có bảng điểm để phúc khảo"));

        CourseSection section = enrollment.getSection();
        boolean isPublished = "PUBLISHED".equalsIgnoreCase(section.getGradeSubmissionStatus())
                || Boolean.TRUE.equals(grade.getIsFinalized());
        if (!isPublished) {
            throw new BadRequestException("Chỉ được phúc khảo học phần đã được Phòng Đào tạo phát hành điểm");
        }

        // Quy định chỉ phúc khảo điểm thi kết thúc học phần (FINAL)
        if (request.getScoreComponent() != GradeAppeal.ScoreComponent.FINAL) {
            throw new BadRequestException("Chỉ áp dụng phúc khảo cho điểm thi kết thúc học phần (FINAL)");
        }

        // Cửa sổ phúc khảo: đọc từ system_configs, mặc định 7 ngày kể từ khi phát hành
        int appealWindowDays = 7;
        try {
            appealWindowDays = systemConfigRepository.findByConfigKey("APPEAL_WINDOW_DAYS")
                    .map(c -> Integer.parseInt(c.getConfigValue().trim()))
                    .orElse(7);
        } catch (Exception ignored) {}

        LocalDateTime publishedAt = section.getPublishedAt() != null ? section.getPublishedAt() : grade.getFinalizedAt();
        if (publishedAt != null && publishedAt.plusDays(appealWindowDays).isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Đã quá thời hạn nộp đơn phúc khảo (" + appealWindowDays + " ngày kể từ khi công bố điểm)");
        }

        BigDecimal currentScore = grade.getFinalScore();
        if (currentScore == null) {
            throw new BadRequestException("Điểm thi kết thúc học phần chưa có để phúc khảo");
        }

        Set<GradeAppeal.AppealStatus> activeStatuses = Set.of(
                GradeAppeal.AppealStatus.PENDING,
                GradeAppeal.AppealStatus.ASSIGNED,
                GradeAppeal.AppealStatus.IN_REVIEW,
                GradeAppeal.AppealStatus.PROPOSED,
                GradeAppeal.AppealStatus.PENDING_HEAD_APPROVAL,
                GradeAppeal.AppealStatus.HEAD_APPROVED
        );
        if (appealRepository.countByStudentIdAndEnrollmentSectionSubjectIdAndStatusIn(
                student.getId(), section.getSubject().getId(), activeStatuses) > 0) {
            throw new BadRequestException("Bạn đã có đơn phúc khảo đang được xử lý cho học phần này");
        }

        GradeAppeal appeal = new GradeAppeal();
        appeal.setEnrollment(enrollment);
        appeal.setStudent(student);
        appeal.setScoreComponent(GradeAppeal.ScoreComponent.FINAL);
        appeal.setCurrentScore(currentScore);
        appeal.setDesiredScore(request.getDesiredScore());
        appeal.setReason(request.getReason().trim());
        appeal.setStatus(GradeAppeal.AppealStatus.PENDING);
        return appealRepository.save(appeal);
    }

    /**
     * Bước 1 (PĐT): Tiếp nhận & Phân công Cán bộ chấm phúc khảo độc lập
     */
    @Transactional
    public GradeAppeal assignGrader(Long staffUserId, Long appealId, AssignAppealGraderRequest request) {
        GradeAppeal appeal = appealRepository.findByIdWithDetails(appealId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn phúc khảo"));

        if (appeal.getStatus() != GradeAppeal.AppealStatus.PENDING
                && appeal.getStatus() != GradeAppeal.AppealStatus.ASSIGNED) {
            throw new BadRequestException("Đơn phúc khảo không ở trạng thái chờ phân công chấm");
        }

        Lecturer assignedLecturer = lecturerRepository.findById(request.getLecturerId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giảng viên được chỉ định"));

        Lecturer sectionLecturer = appeal.getEnrollment().getSection().getLecturer();
        if (sectionLecturer != null && sectionLecturer.getId().equals(assignedLecturer.getId())) {
            throw new BadRequestException("Cán bộ chấm độc lập không được là giảng viên đã giảng dạy lớp học phần này");
        }

        appeal.setAssignedLecturer(assignedLecturer);
        appeal.setAssignedAt(LocalDateTime.now());
        appeal.setStatus(GradeAppeal.AppealStatus.ASSIGNED);
        return appealRepository.save(appeal);
    }

    /**
     * Giảng viên được phân công xem các bài thi cần chấm phúc khảo
     */
    public List<GradeAppeal> findAssignedTasks(Long lecturerUserId) {
        Lecturer lecturer = lecturerRepository.findByUserId(lecturerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ giảng viên"));
        return appealRepository.findByAssignedLecturerIdWithDetails(lecturer.getId());
    }

    /**
     * Bước 2: Cán bộ chấm phúc khảo độc lập nhập điểm mới và đánh giá ngưỡng chênh lệch
     */
    @Transactional
    public GradeAppeal submitGrading(Long lecturerUserId, Long appealId, SubmitAppealGradingRequest request) {
        GradeAppeal appeal = appealRepository.findByIdWithDetails(appealId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn phúc khảo"));

        if (appeal.getStatus() != GradeAppeal.AppealStatus.ASSIGNED
                && appeal.getStatus() != GradeAppeal.AppealStatus.IN_REVIEW
                && appeal.getStatus() != GradeAppeal.AppealStatus.PENDING) {
            throw new BadRequestException("Đơn phúc khảo không ở trạng thái chờ chấm độc lập");
        }

        Lecturer lecturer = lecturerRepository.findByUserId(lecturerUserId).orElse(null);
        if (lecturer != null && appeal.getAssignedLecturer() != null
                && !lecturer.getId().equals(appeal.getAssignedLecturer().getId())) {
            throw new AccessDeniedException("Bạn không phải là cán bộ chấm độc lập được phân công cho đơn này");
        }

        User reviewer = userRepository.findById(lecturerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người xử lý"));

        BigDecimal newScore = request.getNewScore();
        BigDecimal diff = newScore.subtract(appeal.getCurrentScore()).abs();
        boolean hasMechanicalError = Boolean.TRUE.equals(request.getHasMechanicalError());
        boolean exceedsThreshold = diff.compareTo(new BigDecimal("0.50")) >= 0 || hasMechanicalError;

        appeal.setNewScore(newScore);
        appeal.setScoreDiff(diff);
        appeal.setHasMechanicalError(hasMechanicalError);
        appeal.setExceedsThreshold(exceedsThreshold);
        appeal.setReviewer(reviewer);
        appeal.setReviewNotes(request.getReviewNotes());
        appeal.setReviewedAt(LocalDateTime.now());

        if (exceedsThreshold) {
            // Đạt ngưỡng quy chế -> Chuyển lên Trưởng bộ môn/khoa niêm phong phê duyệt
            appeal.setStatus(GradeAppeal.AppealStatus.PENDING_HEAD_APPROVAL);
        } else {
            // Không đạt ngưỡng chênh lệch quy chế & không có sai sót cơ học -> Giữ nguyên điểm cũ
            appeal.setStatus(GradeAppeal.AppealStatus.REJECTED_NO_CHANGE);
            try {
                notificationService.createNotification(
                        appeal.getStudent().getId(),
                        "Kết quả phúc khảo: Giữ nguyên điểm",
                        String.format("Học phần %s: Điểm chấm lại (%s) có mức chênh lệch nhỏ hơn ngưỡng quy định (0.5 điểm) và không có sai sót cơ học. Điểm số gốc (%s) được giữ nguyên.",
                                appeal.getEnrollment().getSection().getSubject().getSubjectName(),
                                newScore, appeal.getCurrentScore()),
                        Notification.NotificationType.APPEAL_STATUS,
                        appeal.getEnrollment().getSection().getId()
                );
            } catch (Exception e) {
                log.warn("Không thể gửi thông báo phúc khảo: {}", e.getMessage());
            }
        }

        return appealRepository.save(appeal);
    }

    /**
     * Trưởng bộ môn / Trưởng khoa xem các đơn phúc khảo cần niêm phong phê duyệt thuộc Khoa mình
     */
    public List<GradeAppeal> findDepartmentHeadAppeals(Long headUserId) {
        User user = userRepository.findById(headUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        Lecturer lecturer = lecturerRepository.findByUserId(headUserId).orElse(null);
        if (lecturer == null) {
            // Nếu là Admin thì xem được tất cả các đơn chờ Trưởng khoa duyệt
            return appealRepository.findAllWithDetails().stream()
                    .filter(a -> a.getStatus() == GradeAppeal.AppealStatus.PENDING_HEAD_APPROVAL
                            || a.getStatus() == GradeAppeal.AppealStatus.HEAD_APPROVED)
                    .toList();
        }

        List<Department> managedDepartments = departmentRepository.findByHeadLecturerId(lecturer.getId());
        if (managedDepartments.isEmpty()) {
            throw new AccessDeniedException("Bạn không giữ chức vụ Trưởng bộ môn hoặc Trưởng khoa");
        }

        List<Integer> deptIds = managedDepartments.stream().map(Department::getId).toList();
        return appealRepository.findByDepartmentIdsWithDetails(deptIds).stream()
                .filter(a -> a.getStatus() == GradeAppeal.AppealStatus.PENDING_HEAD_APPROVAL
                        || a.getStatus() == GradeAppeal.AppealStatus.HEAD_APPROVED)
                .toList();
    }

    /**
     * Bước 3: Trưởng bộ môn / Trưởng khoa Niêm phong phê duyệt điện tử
     */
    @Transactional
    public GradeAppeal headSignAppeal(Long headUserId, Long appealId, HeadSignAppealRequest request) {
        GradeAppeal appeal = appealRepository.findByIdWithDetails(appealId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn phúc khảo"));

        if (appeal.getStatus() != GradeAppeal.AppealStatus.PENDING_HEAD_APPROVAL) {
            throw new BadRequestException("Đơn phúc khảo không ở trạng thái chờ Trưởng khoa niêm phong phê duyệt");
        }

        User headUser = userRepository.findById(headUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người niêm phong phê duyệt"));

        Lecturer lecturer = lecturerRepository.findByUserId(headUserId).orElse(null);
        if (lecturer != null) {
            Department subjectDept = appeal.getEnrollment().getSection().getSubject().getDepartment();
            if (subjectDept == null || subjectDept.getHeadLecturer() == null
                    || !lecturer.getId().equals(subjectDept.getHeadLecturer().getId())) {
                throw new AccessDeniedException("Bạn không phụ trách Khoa quản lý học phần này");
            }
        }

        LocalDateTime now = LocalDateTime.now();
        appeal.setHeadReviewer(headUser);
        appeal.setHeadApprovedAt(now);
        appeal.setHeadReviewNotes(request.getHeadReviewNotes());

        if (Boolean.TRUE.equals(request.getApproved())) {
            // Tạo mã băm chữ ký điện tử nội bộ SHA-256
            String rawSig = "SMS-DEAN-SIGN|" + appeal.getId() + "|" + headUserId + "|"
                    + appeal.getNewScore() + "|" + now;
            appeal.setHeadSignatureHash(sha256Hex(rawSig));
            appeal.setStatus(GradeAppeal.AppealStatus.HEAD_APPROVED);
        } else {
            appeal.setStatus(GradeAppeal.AppealStatus.REJECTED);
            try {
                notificationService.createNotification(
                        appeal.getStudent().getId(),
                        "Đơn phúc khảo bị từ chối",
                        String.format("Đơn phúc khảo học phần %s đã bị Trưởng khoa từ chối duyệt: %s",
                                appeal.getEnrollment().getSection().getSubject().getSubjectName(),
                                request.getHeadReviewNotes() != null ? request.getHeadReviewNotes() : "Không đủ căn cứ điều chỉnh"),
                        Notification.NotificationType.APPEAL_STATUS,
                        appeal.getEnrollment().getSection().getId()
                );
            } catch (Exception ignored) {}
        }

        return appealRepository.save(appeal);
    }

    /**
     * Bước 4: Phòng Đào tạo chốt cập nhật vào hệ thống kèm lý do điều chỉnh
     */
    @Transactional
    public GradeAppeal applyFinalAdjustment(Long staffUserId, Long appealId, ApplyAppealGradeRequest request) {
        GradeAppeal appeal = appealRepository.findByIdWithDetails(appealId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn phúc khảo"));

        if (appeal.getStatus() != GradeAppeal.AppealStatus.HEAD_APPROVED
                && appeal.getStatus() != GradeAppeal.AppealStatus.PROPOSED) {
            throw new BadRequestException("Chỉ cập nhật điểm khi đơn đã có đầy đủ chữ ký điện tử của Trưởng khoa");
        }

        User staffUser = userRepository.findById(staffUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cán bộ xử lý"));

        BigDecimal scoreToApply = appeal.getNewScore();
        if (scoreToApply == null) {
            throw new BadRequestException("Không tìm thấy điểm mới để cập nhật");
        }

        Grade grade = gradeRepository.findByEnrollmentId(appeal.getEnrollment().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bảng điểm"));

        BigDecimal oldScore = grade.getFinalScore();
        grade.setFinalScore(scoreToApply);
        grade.calculateTotalScore();
        gradeRepository.save(grade);

        // Ghi nhận nhật ký kiểm toán điểm (GradeAuditLog)
        GradeAuditLog auditLog = GradeAuditLog.builder()
                .grade(grade)
                .component("FINAL")
                .oldScore(oldScore)
                .newScore(scoreToApply)
                .reason("Phúc khảo: " + request.getFinalAdjustmentReason().trim())
                .changedBy(staffUser)
                .build();
        gradeAuditLogRepository.save(auditLog);

        LocalDateTime now = LocalDateTime.now();
        appeal.setStatus(GradeAppeal.AppealStatus.APPROVED_AND_APPLIED);
        appeal.setFinalAdjustmentReason(request.getFinalAdjustmentReason().trim());
        appeal.setAppliedByUser(staffUser);
        appeal.setAppliedAt(now);
        GradeAppeal savedAppeal = appealRepository.save(appeal);

        // Tự động tính toán lại GPA học kỳ và CPA tích lũy mới của sinh viên (BR-Grade09)
        BigDecimal newSemesterGpa = null;
        BigDecimal newCpa = null;
        try {
            if (transcriptService != null && appeal.getStudent() != null) {
                TranscriptResponse transcript = transcriptService.getTranscript(appeal.getStudent().getId());
                if (transcript != null) {
                    newCpa = transcript.getCumulativeGpa();
                    if (transcript.getSemesters() != null && appeal.getEnrollment() != null
                            && appeal.getEnrollment().getSection() != null
                            && appeal.getEnrollment().getSection().getSemester() != null) {
                        Integer currentSemId = appeal.getEnrollment().getSection().getSemester().getId();
                        newSemesterGpa = transcript.getSemesters().stream()
                                .filter(s -> currentSemId.equals(s.getSemesterId()))
                                .map(TranscriptResponse.SemesterGrade::getSemesterGpa)
                                .findFirst()
                                .orElse(null);
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Không thể tính lại GPA/CPA cho sinh viên {}: {}", appeal.getStudent().getId(), ex.getMessage());
        }

        // Thông báo kết quả cuối cùng cho sinh viên kèm GPA/CPA mới
        try {
            String gpaInfo = "";
            if (newSemesterGpa != null || newCpa != null) {
                gpaInfo = String.format(" | GPA học kỳ mới: %s, CPA tích lũy: %s.",
                        newSemesterGpa != null ? newSemesterGpa : "N/A",
                        newCpa != null ? newCpa : "N/A");
            }
            notificationService.createNotification(
                    appeal.getStudent().getId(),
                    "Kết quả phúc khảo: Điểm đã được cập nhật",
                    String.format("Điểm thi kết thúc học phần %s đã được cập nhật thành %s. Điểm tổng kết: %s, Điểm chữ: %s%s",
                            appeal.getEnrollment().getSection().getSubject().getSubjectName(),
                            scoreToApply, grade.getTotalScore(), grade.getLetterGrade(), gpaInfo),
                    Notification.NotificationType.APPEAL_STATUS,
                    appeal.getEnrollment().getSection().getId()
            );
        } catch (Exception e) {
            log.warn("Không thể gửi thông báo cập nhật điểm phúc khảo: {}", e.getMessage());
        }

        return savedAppeal;
    }

    /**
     * Phương thức cũ tương thích ngược (proposeScore)
     */
    @Transactional
    public GradeAppeal proposeScore(Long lecturerUserId, Long appealId, GradeAppealReviewRequest request) {
        SubmitAppealGradingRequest submitReq = new SubmitAppealGradingRequest();
        submitReq.setNewScore(request.getNewScore());
        submitReq.setReviewNotes(request.getReviewNotes());
        submitReq.setHasMechanicalError(false);
        return submitGrading(lecturerUserId, appealId, submitReq);
    }

    /**
     * Phương thức cũ tương thích ngược (finalizeAppeal)
     */
    @Transactional
    public GradeAppeal finalizeAppeal(Long staffUserId, Long appealId, GradeAppealReviewRequest request) {
        if (request.getStatus() == GradeAppeal.AppealStatus.REJECTED) {
            GradeAppeal appeal = appealRepository.findById(appealId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn phúc khảo"));
            appeal.setStatus(GradeAppeal.AppealStatus.REJECTED);
            appeal.setReviewNotes(request.getReviewNotes());
            return appealRepository.save(appeal);
        }
        ApplyAppealGradeRequest applyReq = new ApplyAppealGradeRequest();
        applyReq.setFinalAdjustmentReason(request.getReviewNotes() != null ? request.getReviewNotes() : "Phê duyệt cập nhật điểm phúc khảo");
        return applyFinalAdjustment(staffUserId, appealId, applyReq);
    }

    /**
     * Phương thức cũ tương thích ngược (review)
     */
    @Transactional
    public GradeAppeal review(Long reviewerUserId, Long appealId, GradeAppealReviewRequest request) {
        return finalizeAppeal(reviewerUserId, appealId, request);
    }

    private String sha256Hex(String text) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(text.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not supported", e);
        }
    }
}
