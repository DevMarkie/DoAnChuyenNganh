package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.entity.AuditLog;
import com.sms.entity.BackupHistory;
import com.sms.entity.SystemConfig;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.LecturerRepository;
import com.sms.repository.StudentRepository;
import com.sms.repository.UserRepository;
import com.sms.security.UserPrincipal;
import com.sms.service.AuditLogService;
import com.sms.service.DatabaseBackupService;
import com.sms.service.SystemConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
}
