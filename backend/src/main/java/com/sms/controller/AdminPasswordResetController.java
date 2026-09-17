package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.ApproveResetRequest;
import com.sms.dto.request.RejectResetRequest;
import com.sms.dto.response.PasswordResetResult;
import com.sms.entity.PasswordResetRequest;
import com.sms.security.UserPrincipal;
import com.sms.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/password-resets")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPasswordResetController {

    private final PasswordResetService passwordResetService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PasswordResetRequest>>> getAllRequests(
            @RequestParam(required = false) String status) {
        List<PasswordResetRequest> list = passwordResetService.getAllRequests(status);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/pending-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getPendingCount() {
        long count = passwordResetService.getPendingCount();
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<PasswordResetResult>> approveRequest(
            @PathVariable Long id,
            @RequestBody(required = false) ApproveResetRequest request,
            @AuthenticationPrincipal UserPrincipal adminUser) {
        PasswordResetResult result = passwordResetService.approveRequest(id, request, adminUser.getId());
        return ResponseEntity.ok(ApiResponse.success(result.getMessage(), result));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<PasswordResetRequest>> rejectRequest(
            @PathVariable Long id,
            @Valid @RequestBody RejectResetRequest request,
            @AuthenticationPrincipal UserPrincipal adminUser) {
        PasswordResetRequest result = passwordResetService.rejectRequest(id, request, adminUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối yêu cầu cấp lại mật khẩu", result));
    }

    @PostMapping("/batch-approve")
    public ResponseEntity<ApiResponse<List<PasswordResetResult>>> batchApproveRequests(
            @RequestBody List<Long> requestIds,
            @AuthenticationPrincipal UserPrincipal adminUser) {
        List<PasswordResetResult> results = passwordResetService.batchApprove(requestIds, adminUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Đã duyệt hàng loạt " + results.size() + " yêu cầu", results));
    }

    @PostMapping("/batch-reject")
    public ResponseEntity<ApiResponse<List<PasswordResetRequest>>> batchRejectRequests(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserPrincipal adminUser) {
        
        List<Long> requestIds = (List<Long>) body.get("requestIds");
        String reason = (String) body.get("reason");
        
        List<PasswordResetRequest> results = passwordResetService.batchReject(requestIds, reason, adminUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối hàng loạt " + results.size() + " yêu cầu", results));
    }
}
