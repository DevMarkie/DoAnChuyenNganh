package com.sms.controller;

import java.util.List;
import java.util.Map;

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
import com.sms.dto.request.AttendanceStartRequest;
import com.sms.dto.request.StudentCheckInRequest;
import com.sms.dto.response.AttendanceLiveSessionResponse;
import com.sms.dto.response.StudentTodayAttendanceResponse;
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

    @GetMapping("/section/{sectionId}/live")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    public ResponseEntity<ApiResponse<AttendanceLiveSessionResponse>> getLiveSession(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long sectionId) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getLiveSession(user.getId(), sectionId)));
    }

    @PostMapping("/session/start")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    public ResponseEntity<ApiResponse<AttendanceLiveSessionResponse>> startSession(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody AttendanceStartRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Bắt đầu phiên điểm danh thành công",
                attendanceService.startSession(user.getId(), request)));
    }

    @GetMapping("/session/{sessionId}/records")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    public ResponseEntity<ApiResponse<List<AttendanceRecord>>> getRecordsBySession(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getRecordsBySession(user.getId(), sessionId)));
    }

    @PostMapping("/session")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    public ResponseEntity<ApiResponse<AttendanceSession>> saveSession(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody AttendanceSessionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Lưu điểm danh thành công",
                attendanceService.createOrUpdateSession(user.getId(), request)));
    }

    @PostMapping("/check-in")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkIn(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody StudentCheckInRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Điểm danh thành công",
                attendanceService.checkIn(user.getId(), request)));
    }

    @GetMapping("/student/today")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<StudentTodayAttendanceResponse>>> getStudentTodayAttendance(
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getStudentTodayAttendance(user.getId())));
    }
}
