package com.sms.service;

import com.sms.dto.request.ApproveResetRequest;
import com.sms.dto.request.ForgotPasswordRequest;
import com.sms.dto.request.RejectResetRequest;
import com.sms.dto.response.PasswordResetResult;
import com.sms.entity.Lecturer;
import com.sms.entity.PasswordResetRequest;
import com.sms.entity.PasswordResetRequest.RequestStatus;
import com.sms.entity.Student;
import com.sms.entity.User;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.LecturerRepository;
import com.sms.repository.PasswordResetRequestRepository;
import com.sms.repository.StudentRepository;
import com.sms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final PasswordResetRequestRepository resetRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private static final String PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * Submit a new password reset request by Student or Lecturer (Public).
     */
    @Transactional
    public PasswordResetRequest createRequest(ForgotPasswordRequest request) {
        String inputUser = request.getUsername().trim();

        // 1. Resolve User
        User user = userRepository.findByUsername(inputUser).orElse(null);

        // If not found by username directly, check student_code or lecturer_code
        if (user == null) {
            Student student = studentRepository.findByStudentCode(inputUser).orElse(null);
            if (student != null) {
                user = student.getUser();
            } else {
                Lecturer lecturer = lecturerRepository.findByLecturerCode(inputUser).orElse(null);
                if (lecturer != null) {
                    user = lecturer.getUser();
                }
            }
        }

        if (user == null) {
            throw new ResourceNotFoundException("Không tìm thấy tài khoản với mã số hoặc tên đăng nhập: " + inputUser);
        }

        String roleName = user.getRole().getName();
        if (!"STUDENT".equalsIgnoreCase(roleName) && !"LECTURER".equalsIgnoreCase(roleName)) {
            throw new BadRequestException("Cổng này chỉ hỗ trợ gửi yêu cầu cấp lại mật khẩu cho Sinh viên và Giảng viên.");
        }

        // 2. Check for duplicate pending request
        if (resetRepository.existsByUserIdAndStatus(user.getId(), RequestStatus.PENDING)) {
            throw new BadRequestException("Bạn đang có một yêu cầu cấp lại mật khẩu chờ xét duyệt. Vui lòng kiên nhẫn chờ Ban Quản trị xử lý.");
        }

        // 3. Resolve Full Name
        String fullName = user.getUsername();
        if ("STUDENT".equalsIgnoreCase(roleName)) {
            Student s = studentRepository.findByUserId(user.getId()).orElse(null);
            if (s != null) fullName = s.getFullName();
        } else {
            Lecturer l = lecturerRepository.findByUserId(user.getId()).orElse(null);
            if (l != null) fullName = l.getFullName();
        }

        // 4. Create and persist request
        PasswordResetRequest resetRequest = PasswordResetRequest.builder()
                .user(user)
                .username(user.getUsername())
                .fullName(fullName)
                .role(roleName)
                .email(request.getEmail().trim())
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .reason(request.getReason() != null ? request.getReason().trim() : null)
                .status(RequestStatus.PENDING)
                .build();

        return resetRepository.save(resetRequest);
    }

    /**
     * Get all requests (optional status filter).
     */
    @Transactional(readOnly = true)
    public List<PasswordResetRequest> getAllRequests(String statusFilter) {
        if (statusFilter != null && !statusFilter.isBlank() && !"ALL".equalsIgnoreCase(statusFilter)) {
            try {
                RequestStatus status = RequestStatus.valueOf(statusFilter.toUpperCase());
                return resetRepository.findByStatusOrderByCreatedAtDesc(status);
            } catch (IllegalArgumentException e) {
                // fall through to return all
            }
        }
        return resetRepository.findAllByOrderByCreatedAtDesc();
    }

    /**
     * Count pending requests for Admin badges.
     */
    @Transactional(readOnly = true)
    public long getPendingCount() {
        return resetRepository.countByStatus(RequestStatus.PENDING);
    }

    /**
     * Admin approves request and resets password.
     */
    @Transactional
    public PasswordResetResult approveRequest(Long requestId, ApproveResetRequest approveRequest, Long adminUserId) {
        PasswordResetRequest request = resetRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu ID: " + requestId));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Yêu cầu này đã được xử lý trước đó (Trạng thái hiện tại: " + request.getStatus() + ")");
        }

        User adminUser = userRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin quản trị viên"));

        // 1. Determine new password
        String newPassword;
        if (approveRequest != null && approveRequest.getNewPassword() != null && !approveRequest.getNewPassword().isBlank()) {
            newPassword = approveRequest.getNewPassword().trim();
        } else {
            newPassword = generateRandomPassword();
        }

        // 2. Update user's password in Database
        User targetUser = request.getUser();
        targetUser.setPassword(passwordEncoder.encode(newPassword));
        // Bắt buộc đổi mật khẩu khi đăng nhập tiếp theo
        targetUser.setMustChangePassword(true);
        userRepository.save(targetUser);

        // 3. Update request status
        request.setStatus(RequestStatus.APPROVED);
        request.setAdminNotes(approveRequest != null ? approveRequest.getAdminNotes() : null);
        request.setProcessedBy(adminUser);
        request.setProcessedAt(LocalDateTime.now());
        PasswordResetRequest savedRequest = resetRepository.save(request);

        // 4. Send Gmail
        boolean emailSent = emailService.sendPasswordResetEmail(
                request.getEmail(),
                request.getFullName(),
                request.getUsername(),
                newPassword,
                request.getRole()
        );

        String message = emailSent
                ? "Cấp lại mật khẩu thành công! Thông tin đăng nhập đã được gửi tới Gmail: " + request.getEmail()
                : "Cấp lại mật khẩu thành công trong CSDL (Gửi Gmail chưa thành công do chưa kết nối SMTP). Mật khẩu mới: " + newPassword;

        return PasswordResetResult.builder()
                .request(savedRequest)
                .generatedPassword(newPassword)
                .emailSent(emailSent)
                .message(message)
                .build();
    }

    /**
     * Admin rejects request.
     */
    @Transactional
    public PasswordResetRequest rejectRequest(Long requestId, RejectResetRequest rejectRequest, Long adminUserId) {
        PasswordResetRequest request = resetRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu ID: " + requestId));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Yêu cầu này đã được xử lý trước đó (Trạng thái hiện tại: " + request.getStatus() + ")");
        }

        User adminUser = userRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin quản trị viên"));

        request.setStatus(RequestStatus.REJECTED);
        request.setAdminNotes(rejectRequest.getRejectReason());
        request.setProcessedBy(adminUser);
        request.setProcessedAt(LocalDateTime.now());
        PasswordResetRequest savedRequest = resetRepository.save(request);

        // Send rejection email
        emailService.sendRejectionEmail(
                request.getEmail(),
                request.getFullName(),
                request.getUsername(),
                rejectRequest.getRejectReason()
        );

        return savedRequest;
    }

    /**
     * Admin batch approves requests.
     */
    @Transactional
    public List<PasswordResetResult> batchApprove(List<Long> requestIds, Long adminUserId) {
        return requestIds.stream().map(id -> {
            try {
                return approveRequest(id, null, adminUserId);
            } catch (Exception e) {
                log.error("Error approving password reset request ID: " + id, e);
                return null;
            }
        }).filter(java.util.Objects::nonNull).toList();
    }

    /**
     * Admin batch rejects requests.
     */
    @Transactional
    public List<PasswordResetRequest> batchReject(List<Long> requestIds, String reason, Long adminUserId) {
        RejectResetRequest rejectRequest = new RejectResetRequest();
        rejectRequest.setRejectReason(reason != null && !reason.isBlank() ? reason : "Từ chối hàng loạt bởi Ban Quản trị");

        return requestIds.stream().map(id -> {
            try {
                return rejectRequest(id, rejectRequest, adminUserId);
            } catch (Exception e) {
                log.error("Error rejecting password reset request ID: " + id, e);
                return null;
            }
        }).filter(java.util.Objects::nonNull).toList();
    }

    private String generateRandomPassword() {
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            sb.append(PASSWORD_CHARS.charAt(RANDOM.nextInt(PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }
}
