package com.sms.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.AttendanceSessionRequest;
import com.sms.entity.AttendanceRecord;
import com.sms.entity.AttendanceSession;
import com.sms.security.UserPrincipal;
import com.sms.service.AttendanceService;
import com.sms.service.EnrollmentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final EnrollmentService enrollmentService;

    @GetMapping("/section/{sectionId}")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    public ResponseEntity<ApiResponse<List<AttendanceSession>>> getSessionsBySection(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long sectionId) {
        enrollmentService.assertCanViewSection(user.getId(), sectionId);
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getSessionsBySection(sectionId)));
    }

    @GetMapping("/session/{sessionId}/records")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    public ResponseEntity<ApiResponse<List<AttendanceRecord>>> getRecordsBySession(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long sessionId) {
        // ideally verify access
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getRecordsBySession(sessionId)));
    }

    @PostMapping("/session")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    public ResponseEntity<ApiResponse<AttendanceSession>> saveSession(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody AttendanceSessionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Lưu điểm danh thành công",
                attendanceService.createOrUpdateSession(user.getId(), request)));
    }
}
