package com.sms.service;

import com.sms.dto.request.AcademicApprovalAmendmentRequest;
import com.sms.dto.request.CreateGradeAmendmentRequest;
import com.sms.dto.request.DeptReviewAmendmentRequest;
import com.sms.entity.*;
import com.sms.exception.BadRequestException;
import com.sms.exception.ForbiddenException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GradeAmendmentService {

    private final GradeChangeTicketRepository ticketRepository;
    private final GradeRepository gradeRepository;
    private final GradeAuditLogRepository gradeAuditLogRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LecturerRepository lecturerRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    /**
     * BƯỚC 1: Giảng viên khởi tạo yêu cầu sửa điểm sau khóa sổ
     */
    @Transactional
    public GradeChangeTicket create(Long userId, CreateGradeAmendmentRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng"));

        CourseSection section = courseSectionRepository.findById(request.getClassSectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần với ID: " + request.getClassSectionId()));

        // Kiểm tra quyền: Phải là giảng viên phụ trách lớp học phần đó (hoặc Admin)
        String roleName = user.getRole().getName();
        boolean isAdmin = "ADMIN".equalsIgnoreCase(roleName) || "ACADEMIC_AFFAIRS".equalsIgnoreCase(roleName);
        if (!isAdmin) {
            Lecturer lecturer = lecturerRepository.findByUserId(userId)
                    .orElseThrow(() -> new ForbiddenException("Chỉ giảng viên được phân công mới có thể gửi yêu cầu sửa điểm"));
            if (section.getLecturer() == null || !Objects.equals(section.getLecturer().getId(), lecturer.getId())) {
                throw new ForbiddenException("Bạn không phải giảng viên phụ trách lớp học phần: " + section.getSectionCode());
            }
        }

        // Kiểm tra trạng thái khóa sổ: Chỉ áp dụng khi bảng điểm đã khóa sổ / công bố (PUBLISHED)
        String subStatus = section.getGradeSubmissionStatus();
        if (!"PUBLISHED".equalsIgnoreCase(subStatus) && !"COMPLETED".equalsIgnoreCase(section.getStatus().name())) {
            throw new BadRequestException("Chỉ được tạo yêu cầu sửa điểm sau khóa sổ khi lớp đã công bố điểm chính thức (PUBLISHED). Hiện tại lớp đang ở trạng thái: " + subStatus);
        }

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên với ID: " + request.getStudentId()));

        Enrollment enrollment = enrollmentRepository.findByStudentIdAndSectionId(student.getId(), section.getId())
                .orElseThrow(() -> new BadRequestException("Sinh viên không tham gia lớp học phần này"));

        Grade grade = gradeRepository.findByEnrollmentId(enrollment.getId())
                .orElseThrow(() -> new BadRequestException("Chưa tìm thấy bản ghi điểm của sinh viên trong lớp học phần này"));

        BigDecimal oldScore = extractScore(grade, request.getComponentType());
        if (oldScore == null) {
            throw new BadRequestException("Cột điểm " + request.getComponentType() + " hiện tại chưa có điểm ban đầu để điều chỉnh");
        }

        if (request.getNewScore().compareTo(oldScore) == 0) {
            throw new BadRequestException("Điểm mới đề xuất (" + request.getNewScore() + ") phải khác điểm hiện tại (" + oldScore + ")");
        }

        // Chặn trùng lặp đơn khi đang PENDING
        boolean hasPending = ticketRepository.existsByClassSectionIdAndStudentIdAndComponentTypeAndStatusIn(
                section.getId(),
                student.getId(),
                request.getComponentType(),
                List.of(GradeChangeTicket.TicketStatus.PENDING_DEPT, GradeChangeTicket.TicketStatus.PENDING_ACADEMIC)
        );
        if (hasPending) {
            throw new BadRequestException("Đang có một yêu cầu sửa điểm cột " + request.getComponentType() + " của sinh viên này đang chờ xử lý");
        }

        GradeChangeTicket ticket = GradeChangeTicket.builder()
                .student(student)
                .classSection(section)
                .componentType(request.getComponentType())
                .oldScore(oldScore)
                .newScore(request.getNewScore())
                .reason(request.getReason())
                .evidenceUrl(request.getEvidenceUrl())
                .status(GradeChangeTicket.TicketStatus.PENDING_DEPT)
                .createdBy(user)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        log.info("Giảng viên {} tạo yêu cầu sửa điểm ticket cho sinh viên {} lớp {}", user.getUsername(), student.getStudentCode(), section.getSectionCode());
        ticket = ticketRepository.save(ticket);
        if (ticket != null && ticket.getId() != null) {
            return ticketRepository.findByIdWithDetails(ticket.getId()).orElse(ticket);
        }
        return ticket;
    }

    /**
     * Lấy danh sách ticket theo phân quyền và bộ lọc
     */
    @Transactional(readOnly = true)
    public List<GradeChangeTicket> findAll(Long userId, Long sectionId, Long studentId, GradeChangeTicket.TicketStatus status, Integer semesterId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản"));

        String roleName = user.getRole().getName();
        List<GradeChangeTicket> baseList;

        if ("STUDENT".equalsIgnoreCase(roleName)) {
            Student student = studentRepository.findByUserId(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin sinh viên"));
            baseList = ticketRepository.findByStudentIdWithDetails(student.getId());
        } else if ("LECTURER".equalsIgnoreCase(roleName)) {
            Lecturer lecturer = lecturerRepository.findByUserId(userId).orElse(null);
            Long lecturerId = lecturer != null ? lecturer.getId() : -1L;

            // Kiểm tra xem giảng viên có phải là Trưởng bộ môn của khoa nào không
            List<Department> headDepts = departmentRepository.findByHeadLecturerId(lecturerId);
            Set<Integer> headDeptIds = headDepts.stream().map(Department::getId).collect(Collectors.toSet());

            if (headDeptIds.isEmpty()) {
                // Giảng viên thường: Chỉ xem đơn do chính mình tạo
                baseList = ticketRepository.findByCreatedByIdWithDetails(userId);
            } else {
                // Trưởng bộ môn: Xem đơn do chính mình tạo HOẶC đơn thuộc các môn thuộc Khoa mình phụ trách
                baseList = ticketRepository.findAllWithDetails().stream()
                        .filter(t -> {
                            boolean isCreator = t.getCreatedBy() != null && t.getCreatedBy().getId().equals(userId);
                            Integer deptId = (t.getClassSection() != null && t.getClassSection().getSubject() != null && t.getClassSection().getSubject().getDepartment() != null)
                                    ? t.getClassSection().getSubject().getDepartment().getId() : null;
                            boolean isDeptHead = deptId != null && headDeptIds.contains(deptId);
                            return isCreator || isDeptHead;
                        })
                        .toList();
            }
        } else {
            // ADMIN, ACADEMIC_AFFAIRS, ACADEMIC_STAFF: Xem toàn bộ
            baseList = ticketRepository.findAllWithDetails();
        }

        // Áp dụng các bộ lọc bổ sung
        return baseList.stream()
                .filter(t -> sectionId == null || (t.getClassSection() != null && Objects.equals(t.getClassSection().getId(), sectionId)))
                .filter(t -> studentId == null || (t.getStudent() != null && Objects.equals(t.getStudent().getId(), studentId)))
                .filter(t -> status == null || t.getStatus() == status)
                .filter(t -> semesterId == null || (t.getClassSection() != null && t.getClassSection().getSemester() != null && Objects.equals(t.getClassSection().getSemester().getId(), semesterId)))
                .toList();
    }

    /**
     * Xem chi tiết 1 ticket
     */
    @Transactional(readOnly = true)
    public GradeChangeTicket findById(Long ticketId) {
        return ticketRepository.findByIdWithDetails(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn sửa điểm với ID: " + ticketId));
    }

    /**
     * BƯỚC 2: Thẩm định cấp Khoa / Bộ môn
     */
    @Transactional
    public GradeChangeTicket deptReview(Long userId, Long ticketId, DeptReviewAmendmentRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản"));

        GradeChangeTicket ticket = ticketRepository.findByIdWithDetails(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn yêu cầu sửa điểm với ID: " + ticketId));

        if (ticket.getStatus() != GradeChangeTicket.TicketStatus.PENDING_DEPT) {
            throw new BadRequestException("Đơn không ở trạng thái chờ thẩm định cấp Khoa (PENDING_DEPT). Trạng thái hiện tại: " + ticket.getStatus());
        }

        // Kiểm tra thẩm quyền: Trưởng bộ môn phụ trách môn học, hoặc Admin/Phòng Đào tạo
        String roleName = user.getRole().getName();
        boolean isAdminOrStaff = "ADMIN".equalsIgnoreCase(roleName) || "ACADEMIC_AFFAIRS".equalsIgnoreCase(roleName) || "ACADEMIC_STAFF".equalsIgnoreCase(roleName);

        if (!isAdminOrStaff) {
            Lecturer lecturer = lecturerRepository.findByUserId(userId)
                    .orElseThrow(() -> new ForbiddenException("Không tìm thấy thông tin giảng viên"));

            Department dept = (ticket.getClassSection() != null && ticket.getClassSection().getSubject() != null)
                    ? ticket.getClassSection().getSubject().getDepartment() : null;

            boolean isHead = dept != null && dept.getHeadLecturer() != null && Objects.equals(dept.getHeadLecturer().getId(), lecturer.getId());
            if (!isHead) {
                throw new ForbiddenException("Chỉ Trưởng bộ môn/Trưởng khoa phụ trách môn học mới có quyền thẩm định đơn này");
            }
        }

        if (Boolean.TRUE.equals(request.getApproved())) {
            ticket.setStatus(GradeChangeTicket.TicketStatus.PENDING_ACADEMIC);
            ticket.setDeptReviewer(user);
            ticket.setDeptReviewedAt(LocalDateTime.now());
            ticket.setDeptNotes(request.getNotes());
            log.info("Trưởng bộ môn {} đã đồng thuận thẩm định ticket #{}, chuyển trạng thái PENDING_ACADEMIC", user.getUsername(), ticket.getId());
        } else {
            if (request.getRejectionReason() == null || request.getRejectionReason().trim().isEmpty()) {
                throw new BadRequestException("Vui lòng cung cấp lý do từ chối thẩm định chuyên môn");
            }
            ticket.setStatus(GradeChangeTicket.TicketStatus.REJECTED);
            ticket.setDeptReviewer(user);
            ticket.setDeptReviewedAt(LocalDateTime.now());
            ticket.setDeptNotes(request.getNotes());
            ticket.setRejectionReason(request.getRejectionReason().trim());
            log.info("Trưởng bộ môn {} đã từ chối ticket #{}, lý do: {}", user.getUsername(), ticket.getId(), request.getRejectionReason());
        }

        ticket.setUpdatedAt(LocalDateTime.now());
        return ticketRepository.save(ticket);
    }

    /**
     * BƯỚC 3 & 4: Phê duyệt cấp Phòng Đào tạo (Database Transaction an toàn & Thông báo)
     */
    @Transactional(rollbackFor = Exception.class)
    public GradeChangeTicket academicApproval(Long userId, Long ticketId, AcademicApprovalAmendmentRequest request, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người duyệt"));

        String roleName = user.getRole().getName();
        boolean hasAcademicPermission = "ADMIN".equalsIgnoreCase(roleName) || "ACADEMIC_AFFAIRS".equalsIgnoreCase(roleName) || "ACADEMIC_STAFF".equalsIgnoreCase(roleName);
        if (!hasAcademicPermission) {
            throw new ForbiddenException("Chỉ cán bộ Phòng Đào tạo (Admin học vụ) mới có quyền phê duyệt quyết định sửa điểm");
        }

        GradeChangeTicket ticket = ticketRepository.findByIdWithDetails(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn yêu cầu sửa điểm với ID: " + ticketId));

        if (ticket.getStatus() != GradeChangeTicket.TicketStatus.PENDING_ACADEMIC && !("ADMIN".equalsIgnoreCase(roleName) && ticket.getStatus() == GradeChangeTicket.TicketStatus.PENDING_DEPT)) {
            throw new BadRequestException("Đơn không ở trạng thái chờ Phòng Đào tạo phê duyệt (PENDING_ACADEMIC). Trạng thái hiện tại: " + ticket.getStatus());
        }

        // Trường hợp 3a: Bác bỏ yêu cầu
        if (!Boolean.TRUE.equals(request.getApproved())) {
            if (request.getRejectionReason() == null || request.getRejectionReason().trim().isEmpty()) {
                throw new BadRequestException("Vui lòng nhập lý do bác bỏ yêu cầu sửa điểm");
            }
            ticket.setStatus(GradeChangeTicket.TicketStatus.REJECTED);
            ticket.setApprovedBy(user);
            ticket.setApprovedAt(LocalDateTime.now());
            ticket.setRejectionReason(request.getRejectionReason().trim());
            ticket.setUpdatedAt(LocalDateTime.now());
            log.info("Cán bộ Phòng Đào tạo {} đã bác bỏ ticket #{}, lý do: {}", user.getUsername(), ticket.getId(), request.getRejectionReason());
            return ticketRepository.save(ticket);
        }

        // Trường hợp 3b: Chấp thuận -> Ghi đè điểm + Insert Audit Log + Tính lại GPA/CPA
        Enrollment enrollment = enrollmentRepository.findByStudentIdAndSectionId(
                ticket.getStudent().getId(), ticket.getClassSection().getId()
        ).orElseThrow(() -> new BadRequestException("Không tìm thấy thông tin đăng ký học phần của sinh viên"));

        Grade grade = gradeRepository.findByEnrollmentId(enrollment.getId())
                .orElseThrow(() -> new BadRequestException("Không tìm thấy bản ghi điểm của sinh viên"));

        BigDecimal oldScore = extractScore(grade, ticket.getComponentType());
        updateGradeComponent(grade, ticket.getComponentType(), ticket.getNewScore());

        // Kích hoạt tính toán lại Điểm tổng kết, Điểm chữ và GPA thang 4 của học phần
        grade.calculateTotalScore();
        gradeRepository.save(grade);

        // Ghi một bản ghi bất biến vào grade_audit_logs
        GradeAuditLog auditLog = GradeAuditLog.builder()
                .ticket(ticket)
                .student(ticket.getStudent())
                .grade(grade)
                .component(ticket.getComponentType().name())
                .oldScore(oldScore != null ? oldScore : ticket.getOldScore())
                .newScore(ticket.getNewScore())
                .reason("Duyệt sửa điểm sau khóa sổ (Đơn #" + ticket.getId() + "): " + ticket.getReason())
                .changedBy(user)
                .ipAddress(ipAddress)
                .createdAt(LocalDateTime.now())
                .build();
        gradeAuditLogRepository.save(auditLog);

        ticket.setStatus(GradeChangeTicket.TicketStatus.APPROVED);
        ticket.setApprovedBy(user);
        ticket.setApprovedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());
        GradeChangeTicket savedTicket = ticketRepository.save(ticket);

        log.info("Phòng Đào tạo duyệt thành công ticket #{}: Sinh viên {}, Môn {}, Điểm cũ {}, Điểm mới {}",
                ticket.getId(), ticket.getStudent().getStudentCode(),
                ticket.getClassSection().getSubject().getSubjectName(), oldScore, ticket.getNewScore());

        // BƯỚC 4: Gửi thông báo SSE + Email tự động
        sendNotificationsAndEmails(savedTicket, grade, oldScore);

        return savedTicket;
    }

    private void sendNotificationsAndEmails(GradeChangeTicket ticket, Grade grade, BigDecimal oldScore) {
        String subjectName = ticket.getClassSection() != null && ticket.getClassSection().getSubject() != null
                ? ticket.getClassSection().getSubject().getSubjectName() : "Học phần";
        String sectionCode = ticket.getClassSection() != null ? ticket.getClassSection().getSectionCode() : "";
        String compName = getComponentDisplayName(ticket.getComponentType());

        // 1. In-app SSE Notification cho sinh viên
        try {
            notificationService.createNotification(
                    ticket.getStudent().getId(),
                    "Điểm học phần đã được cập nhật chính thức",
                    String.format("Học phần %s: Điểm %s đã được Phòng Đào tạo duyệt cập nhật từ %s thành %s. Điểm tổng kết: %s (%s).",
                            subjectName, compName, oldScore, ticket.getNewScore(), grade.getTotalScore(), grade.getLetterGrade()),
                    Notification.NotificationType.GRADE_UPDATED,
                    ticket.getClassSection().getId()
            );
        } catch (Exception e) {
            log.warn("Không thể gửi thông báo in-app cho sinh viên: {}", e.getMessage());
        }

        // 2. Email thông báo cho sinh viên
        if (ticket.getStudent().getEmail() != null && !ticket.getStudent().getEmail().isBlank()) {
            emailService.sendGradeAmendmentEmail(
                    ticket.getStudent().getEmail(),
                    ticket.getStudent().getFullName(),
                    subjectName,
                    sectionCode,
                    compName,
                    oldScore,
                    ticket.getNewScore(),
                    ticket.getReason()
            );
        }

        // 3. Email thông báo cho giảng viên đề xuất
        if (ticket.getCreatedBy() != null && ticket.getCreatedBy().getEmail() != null && !ticket.getCreatedBy().getEmail().isBlank()) {
            emailService.sendGradeAmendmentEmail(
                    ticket.getCreatedBy().getEmail(),
                    "Thầy/Cô (" + ticket.getCreatedBy().getUsername() + ")",
                    subjectName,
                    sectionCode,
                    compName,
                    oldScore,
                    ticket.getNewScore(),
                    ticket.getReason()
            );
        }
    }

    private BigDecimal extractScore(Grade grade, GradeChangeTicket.ComponentType comp) {
        if (grade == null || comp == null) return null;
        return switch (comp) {
            case CC1 -> grade.getCc1Score();
            case CC2 -> grade.getCc2Score();
            case MIDTERM -> grade.getMidtermScore();
            case FINAL -> grade.getFinalScore();
        };
    }

    private void updateGradeComponent(Grade grade, GradeChangeTicket.ComponentType comp, BigDecimal newScore) {
        switch (comp) {
            case CC1 -> grade.setCc1Score(newScore);
            case CC2 -> grade.setCc2Score(newScore);
            case MIDTERM -> grade.setMidtermScore(newScore);
            case FINAL -> grade.setFinalScore(newScore);
        }
    }

    private String getComponentDisplayName(GradeChangeTicket.ComponentType comp) {
        if (comp == null) return "Điểm số";
        return switch (comp) {
            case CC1 -> "Chuyên cần 1 (5%)";
            case CC2 -> "Chuyên cần 2 / Bài tập (5%)";
            case MIDTERM -> "Giữa kỳ (30%)";
            case FINAL -> "Cuối kỳ (60%)";
        };
    }
}
