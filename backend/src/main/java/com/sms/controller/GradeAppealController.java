package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.GradeAppealRequest;
import com.sms.dto.request.GradeAppealReviewRequest;
import com.sms.dto.response.GradeAppealResponse;
import com.sms.entity.GradeAppeal;
import com.sms.security.UserPrincipal;
import com.sms.service.GradeAppealService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grade-appeals")
@RequiredArgsConstructor
public class GradeAppealController {
    private final GradeAppealService gradeAppealService;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<GradeAppealResponse>> create(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody GradeAppealRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Gửi đơn phúc khảo thành công",
                GradeAppealResponse.from(gradeAppealService.create(user.getId(), request))));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<GradeAppealResponse>>> findMine(
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(gradeAppealService.findMine(user.getId()).stream()
                .map(GradeAppealResponse::from).toList()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    public ResponseEntity<ApiResponse<List<GradeAppealResponse>>> findAll(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) Long sectionId,
            @RequestParam(required = false) GradeAppeal.AppealStatus status,
            @RequestParam(required = false) Integer semesterId) {
        return ResponseEntity.ok(ApiResponse.success(gradeAppealService.findAll(user.getId(), sectionId, status, semesterId).stream()
                .map(GradeAppealResponse::from).toList()));
    }

    @PutMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    public ResponseEntity<ApiResponse<GradeAppealResponse>> review(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @Valid @RequestBody GradeAppealReviewRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Xử lý đơn phúc khảo thành công",
                GradeAppealResponse.from(gradeAppealService.review(user.getId(), id, request))));
    }
}
