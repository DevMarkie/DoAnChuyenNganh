package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.BulkResetPasswordRequest;
import com.sms.dto.request.CreateStaffRequest;
import com.sms.dto.request.UpdateStaffRequest;
import com.sms.dto.response.BulkResetPasswordResponse;
import com.sms.dto.response.StaffResponse;
import com.sms.entity.AuditLog;
import com.sms.entity.BackupHistory;
import com.sms.entity.Role;
import com.sms.entity.SystemConfig;
import com.sms.entity.User;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.DepartmentRepository;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.LecturerRepository;
import com.sms.repository.RoleRepository;
import com.sms.repository.StudentRepository;
import com.sms.repository.UserRepository;
import com.sms.security.UserPrincipal;
import com.sms.service.AuditLogService;
import com.sms.service.DatabaseBackupService;
import com.sms.service.PasswordResetService;
import com.sms.service.SystemConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSystemController {

    private final SystemConfigService systemConfigService;
    private final AuditLogService auditLogService;
    private final DatabaseBackupService backupService;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final PasswordResetService passwordResetService;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final DepartmentRepository departmentRepository;


    // --- CẤU HÌNH THAM SỐ TOÀN HỆ THỐNG ---

    @GetMapping("/configs")
    public ResponseEntity<ApiResponse<List<SystemConfig>>> getAllConfigs() {
        return ResponseEntity.ok(ApiResponse.success(systemConfigService.getAllConfigs()));
    }

    @PutMapping("/configs/{key}")
    public ResponseEntity<ApiResponse<SystemConfig>> updateConfig(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable String key,
            @RequestBody Map<String, String> body) {
        String value = body.get("value");
        String description = body.get("description");
        SystemConfig updated = systemConfigService.updateConfig(key, value, description);
        auditLogService.record(null, user.getUsername(), "ADMIN", "UPDATE_CONFIG", "SYSTEM_CONFIG", null, "Updated config: " + key + " = " + value);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật tham số hệ thống thành công", updated));
    }

    // --- AUDIT LOGS ---

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String username) {
        PageRequest pageable = PageRequest.of(page, size);
        if (module != null && !module.isBlank()) {
            return ResponseEntity.ok(ApiResponse.success(auditLogService.getLogsByModule(module, pageable)));
        } else if (action != null && !action.isBlank()) {
            return ResponseEntity.ok(ApiResponse.success(auditLogService.getLogsByAction(action, pageable)));
        } else if (username != null && !username.isBlank()) {
            return ResponseEntity.ok(ApiResponse.success(auditLogService.getLogsByUsername(username, pageable)));
        }
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getLogs(pageable)));
    }

    // --- SAO LƯU DỮ LIỆU ---

    @PostMapping("/backups")
    public ResponseEntity<ApiResponse<BackupHistory>> createBackup(@AuthenticationPrincipal UserPrincipal user) {
        BackupHistory backup = backupService.createBackup(userRepository.findById(user.getId()).orElse(null));
        auditLogService.record(null, user.getUsername(), "ADMIN", "CREATE_BACKUP", "DATABASE", null, "Created backup: " + backup.getFileName());
        return ResponseEntity.ok(ApiResponse.success("Khởi tạo bản sao lưu CSDL thành công", backup));
    }

    @GetMapping("/backups")
    public ResponseEntity<ApiResponse<Page<BackupHistory>>> getBackups(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(backupService.getBackupHistories(PageRequest.of(page, size))));
    }

    // --- THỐNG KÊ KỸ THUẬT & CHỈ SỐ HỆ THỐNG ---

    @GetMapping("/system/metrics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSystemMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalUsers", userRepository.count());
        metrics.put("activeUsers", userRepository.findAll().stream().filter(u -> Boolean.TRUE.equals(u.getIsActive())).count());
        metrics.put("totalStudents", studentRepository.count());
        metrics.put("totalLecturers", lecturerRepository.count());
        metrics.put("totalCourseSections", courseSectionRepository.count());

        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        metrics.put("memoryUsedMb", usedMemory / (1024 * 1024));
        metrics.put("memoryTotalMb", totalMemory / (1024 * 1024));
        metrics.put("availableProcessors", runtime.availableProcessors());
        metrics.put("status", "HEALTHY");

        return ResponseEntity.ok(ApiResponse.success(metrics));
    }

    // --- RESET MẬT KHẨU TOÀN BỘ NGƯỜI DÙNG ---

    /**
     * POST /api/admin/users/bulk-reset-password
     * <p>
     * Đặt lại mật khẩu tất cả người dùng về dạng <b>ddmmyyyya@</b> (lấy từ ngày sinh).
     * Tài khoản không có ngày sinh sẽ bị bỏ qua và liệt kê trong phần skippedUsers của response.
     * <p>
     * Request body: { "confirm": true }
     */
    @PostMapping("/users/bulk-reset-password")
    public ResponseEntity<ApiResponse<BulkResetPasswordResponse>> bulkResetPasswords(
            @Valid @RequestBody BulkResetPasswordRequest request,
            @AuthenticationPrincipal UserPrincipal admin) {

        BulkResetPasswordResponse result = passwordResetService.resetAllPasswordsToDateOfBirth();

        auditLogService.record(
                null,
                admin.getUsername(),
                "ADMIN",
                "BULK_RESET_PASSWORD",
                "USER",
                null,
                String.format("Bulk reset passwords: %d reset, %d skipped", result.getResetCount(), result.getSkippedCount())
        );

        return ResponseEntity.ok(ApiResponse.success(result.getMessage(), result));
    }

    // --- QUẢN LÝ CÁN BỘ & NHÂN VIÊN (STAFF MANAGEMENT) ---

    private static final Set<String> STAFF_ROLES = Set.of("ADMIN", "ACADEMIC_AFFAIRS", "ACADEMIC_STAFF", "EXAMINATION_OFFICER");
    private static final DateTimeFormatter DOB_FMT = DateTimeFormatter.ofPattern("ddMMyyyy");

    @GetMapping("/staffs")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<StaffResponse>>> getAllStaffs() {
        List<StaffResponse> list = userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && STAFF_ROLES.contains(u.getRole().getName()))
                .map(this::mapToStaffResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/staffs")
    public ResponseEntity<ApiResponse<StaffResponse>> createStaff(
            @Valid @RequestBody CreateStaffRequest req,
            @AuthenticationPrincipal UserPrincipal admin) {

        String username = req.getUsername().trim();
        if (userRepository.existsByUsername(username)) {
            throw new BadRequestException("Tên đăng nhập '" + username + "' đã tồn tại trong hệ thống");
        }
        if (userRepository.existsByEmail(req.getEmail().trim())) {
            throw new BadRequestException("Email '" + req.getEmail() + "' đã được sử dụng");
        }

        String roleName = req.getRoleName().trim().toUpperCase();
        if (!STAFF_ROLES.contains(roleName)) {
            throw new BadRequestException("Vai trò không hợp lệ: " + roleName + ". Chỉ chấp nhận: " + STAFF_ROLES);
        }

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò: " + roleName));

        // Mật khẩu mặc định tự động sinh từ ngày sinh: ddmmyyyya@ (ví dụ 15031990a@)
        String rawPassword = req.getDateOfBirth().format(DOB_FMT) + "a@";

        User staff = new User();
        staff.setUsername(username);
        staff.setFullName(req.getFullName().trim());
        staff.setEmail(req.getEmail().trim().toLowerCase());
        staff.setDateOfBirth(req.getDateOfBirth());
        staff.setPassword(passwordEncoder.encode(rawPassword));
        staff.setRole(role);
        staff.setIsActive(true);
        staff.setMustChangePassword(false);

        if (req.getDepartmentId() != null && req.getDepartmentId() > 0) {
            departmentRepository.findById(req.getDepartmentId()).ifPresent(staff::setDepartment);
        }
        User saved = userRepository.save(staff);

        auditLogService.record(
                null,
                admin.getUsername(),
                "ADMIN",
                "CREATE_STAFF",
                "USER",
                saved.getId().toString(),
                "Tạo mới cán bộ: " + saved.getUsername() + " (Chức danh: " + roleName + ", Ngày sinh: " + req.getDateOfBirth() + ")"
        );

        StaffResponse res = mapToStaffResponse(saved);
        res.setNote("Mật khẩu khởi tạo là: " + rawPassword);

        return ResponseEntity.ok(ApiResponse.success(
                "Tạo cán bộ thành công! Mật khẩu khởi tạo là: " + rawPassword,
                res
        ));
    }

    @PutMapping("/staffs/{id}")
    public ResponseEntity<ApiResponse<StaffResponse>> updateStaff(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStaffRequest req,
            @AuthenticationPrincipal UserPrincipal admin) {

        User staff = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cán bộ với ID: " + id));

        if (req.getFullName() != null && !req.getFullName().isBlank()) {
            staff.setFullName(req.getFullName().trim());
        }
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            String newEmail = req.getEmail().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(staff.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new BadRequestException("Email '" + newEmail + "' đã được sử dụng bởi tài khoản khác");
            }
            staff.setEmail(newEmail);
        }
        if (req.getDateOfBirth() != null) {
            staff.setDateOfBirth(req.getDateOfBirth());
        }
        if (req.getIsActive() != null) {
            staff.setIsActive(req.getIsActive());
        }
        if (req.getRoleName() != null && !req.getRoleName().isBlank()) {
            String roleName = req.getRoleName().trim().toUpperCase();
            if (!STAFF_ROLES.contains(roleName)) {
                throw new BadRequestException("Vai trò không hợp lệ: " + roleName);
            }
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò: " + roleName));
            staff.setRole(role);
        }

        if (req.getDepartmentId() != null) {
            if (req.getDepartmentId() <= 0) {
                staff.setDepartment(null);
            } else {
                departmentRepository.findById(req.getDepartmentId()).ifPresent(staff::setDepartment);
            }
        }
        User updated = userRepository.save(staff);

        auditLogService.record(
                null,
                admin.getUsername(),
                "ADMIN",
                "UPDATE_STAFF",
                "USER",
                updated.getId().toString(),
                "Cập nhật thông tin cán bộ: " + updated.getUsername()
        );

        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin cán bộ thành công", mapToStaffResponse(updated)));
    }

    @PostMapping("/staffs/{id}/reset-password")
    public ResponseEntity<ApiResponse<Map<String, String>>> resetStaffPassword(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal admin) {

        User staff = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cán bộ với ID: " + id));

        if (staff.getDateOfBirth() == null) {
            throw new BadRequestException("Cán bộ '" + staff.getUsername() + "' chưa có ngày sinh trong hệ thống. Vui lòng cập nhật ngày sinh trước khi cấp lại mật khẩu!");
        }

        String rawPassword = staff.getDateOfBirth().format(DOB_FMT) + "a@";
        staff.setPassword(passwordEncoder.encode(rawPassword));
        userRepository.save(staff);

        auditLogService.record(
                null,
                admin.getUsername(),
                "ADMIN",
                "RESET_PASSWORD",
                "USER",
                staff.getId().toString(),
                "Cấp lại mật khẩu theo ngày sinh cho cán bộ: " + staff.getUsername()
        );

        return ResponseEntity.ok(ApiResponse.success(
                "Đã cấp lại mật khẩu thành công! Mật khẩu mới là: " + rawPassword,
                Map.of("username", staff.getUsername(), "newPassword", rawPassword)
        ));
    }

    private StaffResponse mapToStaffResponse(User user) {
        String roleName = user.getRole() != null ? user.getRole().getName() : "STAFF";
        String displayName;
        switch (roleName) {
            case "ADMIN" -> displayName = "Quản trị viên";
            case "ACADEMIC_AFFAIRS" -> displayName = "Cán bộ Đào tạo (Cấp trường)";
            case "ACADEMIC_STAFF" -> displayName = "Giáo vụ Khoa";
            case "EXAMINATION_OFFICER" -> displayName = "Cán bộ Khảo thí";
            default -> displayName = roleName;
        }

        String deptName = null;
        if (user.getDepartment() != null) {
            deptName = user.getDepartment().getName();
        } else if ("ACADEMIC_AFFAIRS".equals(roleName)) {
            deptName = "Phòng Đào tạo (Toàn trường)";
        } else if ("EXAMINATION_OFFICER".equals(roleName)) {
            deptName = "Phòng Khảo thí & ĐBCL";
        } else if ("ADMIN".equals(roleName)) {
            deptName = "Trung tâm CNTT / Toàn trường";
        }

        return StaffResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() : user.getUsername())
                .email(user.getEmail())
                .role(roleName)
                .roleDisplayName(displayName)
                .departmentId(user.getDepartment() != null ? user.getDepartment().getId() : null)
                .departmentName(deptName)
                .departmentCode(user.getDepartment() != null ? user.getDepartment().getCode() : null)
                .dateOfBirth(user.getDateOfBirth())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
