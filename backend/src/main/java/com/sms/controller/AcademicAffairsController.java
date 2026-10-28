package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.entity.*;
import com.sms.repository.UserRepository;
import com.sms.security.UserPrincipal;
import com.sms.service.AcademicExceptionService;
import com.sms.service.GraduationService;
import com.sms.service.OneStopService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF')")
public class AcademicAffairsController {

    private final AcademicExceptionService exceptionService;
    private final GraduationService graduationService;
    private final OneStopService oneStopService;
    private final UserRepository userRepository;

    // --- NGOẠI LỆ HỌC VỤ (RÚT MÔN, MIỄN GIẢM TÍN CHỈ) ---

    @GetMapping("/exceptions")
    public ResponseEntity<ApiResponse<Page<AcademicException>>> getExceptions(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(exceptionService.getExceptions(status, PageRequest.of(page, size))));
    }

    @PutMapping("/exceptions/{id}/review")
    public ResponseEntity<ApiResponse<AcademicException>> reviewException(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        String note = body.get("note");
        User staffUser = userRepository.findById(user.getId()).orElse(null);
        AcademicException reviewed = exceptionService.reviewRequest(id, staffUser, status, note);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt đơn ngoại lệ học vụ thành công", reviewed));
    }

    // --- XÉT TỐT NGHIỆP BÁN TỰ ĐỘNG ---

    @PostMapping("/graduation/assess")
    public ResponseEntity<ApiResponse<List<GraduationRecord>>> assessCohort(
            @RequestParam Integer cohortId) {
        List<GraduationRecord> assessed = graduationService.assessCohortCandidates(cohortId);
        return ResponseEntity.ok(ApiResponse.success("Đã hoàn thành rà soát tự động điều kiện xét tốt nghiệp!", assessed));
    }

    @GetMapping("/graduation/records")
    public ResponseEntity<ApiResponse<Page<GraduationRecord>>> getGraduationRecords(
            @RequestParam(required = false) Integer cohortId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(graduationService.getGraduationRecords(cohortId, status, PageRequest.of(page, size))));
    }

    @PostMapping("/graduation/records/{id}/approve")
    public ResponseEntity<ApiResponse<GraduationRecord>> approveGraduation(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String decisionNo = body != null ? body.get("decisionNo") : null;
        User staffUser = userRepository.findById(user.getId()).orElse(null);
        GraduationRecord approved = graduationService.approveGraduation(id, staffUser, decisionNo);
        return ResponseEntity.ok(ApiResponse.success("Đã phê duyệt công nhận tốt nghiệp chính thức!", approved));
    }

    // --- DỊCH VỤ SINH VIÊN 1 CỬA ---

    @GetMapping("/service-requests")
    public ResponseEntity<ApiResponse<Page<StudentServiceRequest>>> getServiceRequests(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(oneStopService.getRequests(status, PageRequest.of(page, size))));
    }

    @PutMapping("/service-requests/{id}/process")
    public ResponseEntity<ApiResponse<StudentServiceRequest>> processServiceRequest(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        String note = body.get("note");
        User staffUser = userRepository.findById(user.getId()).orElse(null);
        StudentServiceRequest processed = oneStopService.processRequest(id, staffUser, status, note);
        return ResponseEntity.ok(ApiResponse.success("Xử lý yêu cầu dịch vụ sinh viên thành công", processed));
    }
}
