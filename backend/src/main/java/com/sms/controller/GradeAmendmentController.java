package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.AcademicApprovalAmendmentRequest;
import com.sms.dto.request.CreateGradeAmendmentRequest;
import com.sms.dto.request.DeptReviewAmendmentRequest;
import com.sms.dto.response.GradeAmendmentResponse;
import com.sms.entity.GradeChangeTicket;
import com.sms.security.UserPrincipal;
import com.sms.service.GradeAmendmentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grade-amendments")
@RequiredArgsConstructor
public class GradeAmendmentController {

    private final GradeAmendmentService gradeAmendmentService;

    /**
     * BƯỚC 1: Giảng viên tạo đơn yêu cầu sửa điểm sau khóa sổ
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    public ResponseEntity<ApiResponse<GradeAmendmentResponse>> create(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody CreateGradeAmendmentRequest request) {
        GradeChangeTicket ticket = gradeAmendmentService.create(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Tạo yêu cầu sửa điểm thành công. Đơn đã được chuyển tới Trưởng bộ môn thẩm định.",
                GradeAmendmentResponse.from(ticket)));
    }

    /**
     * Lấy danh sách yêu cầu sửa điểm (lọc theo quyền người đăng nhập và tham số)
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<GradeAmendmentResponse>>> findAll(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) Long sectionId,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) GradeChangeTicket.TicketStatus status,
            @RequestParam(required = false) Integer semesterId) {
        List<GradeChangeTicket> tickets = gradeAmendmentService.findAll(user.getId(), sectionId, studentId, status, semesterId);
        return ResponseEntity.ok(ApiResponse.success(tickets.stream().map(GradeAmendmentResponse::from).toList()));
    }

    /**
     * Xem chi tiết 1 đơn sửa điểm
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<GradeAmendmentResponse>> findById(@PathVariable Long id) {
        GradeChangeTicket ticket = gradeAmendmentService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(GradeAmendmentResponse.from(ticket)));
    }

    /**
     * BƯỚC 2: Thẩm định cấp Khoa / Bộ môn
     */
    @PutMapping("/{id}/dept-review")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<GradeAmendmentResponse>> deptReview(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @Valid @RequestBody DeptReviewAmendmentRequest request) {
        GradeChangeTicket ticket = gradeAmendmentService.deptReview(user.getId(), id, request);
        String msg = Boolean.TRUE.equals(request.getApproved())
                ? "Thẩm định chuyên môn thành công. Đơn đã được chuyển tới Phòng Đào tạo duyệt cuối."
                : "Đã từ chối yêu cầu sửa điểm cấp Bộ môn/Khoa.";
        return ResponseEntity.ok(ApiResponse.success(msg, GradeAmendmentResponse.from(ticket)));
    }

    /**
     * BƯỚC 3: Phê duyệt quyết định cuối cấp Phòng Đào tạo & Kích hoạt cập nhật điểm
     */
    @PutMapping("/{id}/academic-approval")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<GradeAmendmentResponse>> academicApproval(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @Valid @RequestBody AcademicApprovalAmendmentRequest request,
            HttpServletRequest servletRequest) {
        String clientIp = servletRequest.getHeader("X-Forwarded-For");
        if (clientIp == null || clientIp.isBlank()) {
            clientIp = servletRequest.getRemoteAddr();
        }

        GradeChangeTicket ticket = gradeAmendmentService.academicApproval(user.getId(), id, request, clientIp);
        String msg = Boolean.TRUE.equals(request.getApproved())
                ? "Phê duyệt điều chỉnh điểm thành công. Điểm số và GPA đã được cập nhật chính thức."
                : "Đã bác bỏ yêu cầu điều chỉnh điểm.";
        return ResponseEntity.ok(ApiResponse.success(msg, GradeAmendmentResponse.from(ticket)));
    }
}
