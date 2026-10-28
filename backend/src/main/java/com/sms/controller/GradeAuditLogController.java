package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.response.GradeAuditLogResponse;
import com.sms.entity.GradeAuditLog;
import com.sms.repository.GradeAuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/grade-audit-logs")
@RequiredArgsConstructor
public class GradeAuditLogController {

    private final GradeAuditLogRepository gradeAuditLogRepository;

    /**
     * BR-Grade09: Màn hình Quản trị Nhật ký kiểm toán tập trung
     * Cho phép Admin, Khảo thí và Cán bộ Đào tạo tra cứu chi tiết mọi vết sửa điểm
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF', 'EXAMINATION_OFFICER')")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Page<GradeAuditLogResponse>>> searchAuditLogs(
            @RequestParam(required = false) String studentCode,
            @RequestParam(required = false) String component,
            @RequestParam(required = false) Long sectionId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<GradeAuditLog> logs = gradeAuditLogRepository.searchLogs(
                (studentCode != null && !studentCode.isBlank()) ? studentCode.trim() : null,
                (component != null && !component.isBlank()) ? component.trim().toUpperCase() : null,
                sectionId,
                startDate,
                endDate,
                pageable
        );

        Page<GradeAuditLogResponse> responsePage = logs.map(GradeAuditLogResponse::from);
        return ResponseEntity.ok(ApiResponse.success(responsePage));
    }
}
