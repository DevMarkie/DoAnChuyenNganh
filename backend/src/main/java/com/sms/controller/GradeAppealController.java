package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.*;
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
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF', 'LECTURER')")
    public ResponseEntity<ApiResponse<List<GradeAppealResponse>>> findAll(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) Long sectionId,
            @RequestParam(required = false) GradeAppeal.AppealStatus status,
            @RequestParam(required = false) Integer semesterId) {
        return ResponseEntity.ok(ApiResponse.success(gradeAppealService.findAll(user.getId(), sectionId, status, semesterId).stream()
                .map(GradeAppealResponse::from).toList()));
    }

    /**
     * Bước 1 (PĐT): Phân công Cán bộ chấm phúc khảo độc lập
     */
    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<GradeAppealResponse>> assignGrader(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @Valid @RequestBody AssignAppealGraderRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Phân công cán bộ chấm phúc khảo độc lập thành công",
                GradeAppealResponse.from(gradeAppealService.assignGrader(user.getId(), id, request))));
    }

    /**
     * Cán bộ chấm độc lập xem danh sách đơn được phân công
     */
    @GetMapping("/assigned-tasks")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<GradeAppealResponse>>> findAssignedTasks(
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(gradeAppealService.findAssignedTasks(user.getId()).stream()
                .map(GradeAppealResponse::from).toList()));
    }

    /**
     * Bước 2: Cán bộ chấm độc lập nhập điểm thẩm định và nhận xét giải trình
     */
    @PutMapping("/{id}/submit-grading")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    public ResponseEntity<ApiResponse<GradeAppealResponse>> submitGrading(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @Valid @RequestBody SubmitAppealGradingRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Nộp kết quả chấm phúc khảo thành công",
                GradeAppealResponse.from(gradeAppealService.submitGrading(user.getId(), id, request))));
    }

    /**
     * Trưởng bộ môn / Trưởng khoa xem danh sách đơn chờ niêm phong phê duyệt cấp Khoa
     */
    @GetMapping("/department-head")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<GradeAppealResponse>>> findDepartmentHeadAppeals(
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(gradeAppealService.findDepartmentHeadAppeals(user.getId()).stream()
                .map(GradeAppealResponse::from).toList()));
    }

    /**
     * Bước 3: Trưởng bộ môn / Trưởng khoa Niêm phong phê duyệt điện tử
     */
    @PutMapping("/{id}/head-sign")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    public ResponseEntity<ApiResponse<GradeAppealResponse>> headSign(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @Valid @RequestBody HeadSignAppealRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Xử lý niêm phong phê duyệt điện tử đơn phúc khảo thành công",
                GradeAppealResponse.from(gradeAppealService.headSignAppeal(user.getId(), id, request))));
    }

    /**
     * Bước 4: Phòng Đào tạo chốt cập nhật điểm chính thức vào hệ thống kèm lý do điều chỉnh
     */
    @PutMapping("/{id}/apply-final")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<GradeAppealResponse>> applyFinalAdjustment(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @Valid @RequestBody ApplyAppealGradeRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật điểm số chính thức vào hệ thống thành công",
                GradeAppealResponse.from(gradeAppealService.applyFinalAdjustment(user.getId(), id, request))));
    }

    /**
     * Tương thích ngược: proposeScore
     */
    @PutMapping("/{id}/propose")
    @PreAuthorize("hasRole('LECTURER')")
    public ResponseEntity<ApiResponse<GradeAppealResponse>> proposeScore(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @Valid @RequestBody GradeAppealReviewRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Đề xuất điểm phúc khảo thành công",
                GradeAppealResponse.from(gradeAppealService.proposeScore(user.getId(), id, request))));
    }

    /**
     * Tương thích ngược: finalizeAppeal
     */
    @PutMapping("/{id}/finalize")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<GradeAppealResponse>> finalizeAppeal(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @Valid @RequestBody GradeAppealReviewRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt kết quả phúc khảo thành công",
                GradeAppealResponse.from(gradeAppealService.finalizeAppeal(user.getId(), id, request))));
    }

    /**
     * Tương thích ngược: review
     */
    @PutMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF', 'LECTURER')")
    public ResponseEntity<ApiResponse<GradeAppealResponse>> review(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @Valid @RequestBody GradeAppealReviewRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Xử lý đơn phúc khảo thành công",
                GradeAppealResponse.from(gradeAppealService.review(user.getId(), id, request))));
    }
}
