package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.entity.GraduationRecord;
import com.sms.entity.User;
import com.sms.repository.UserRepository;
import com.sms.security.UserPrincipal;
import com.sms.service.GraduationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/graduation")
@RequiredArgsConstructor
public class GraduationController {

    private final GraduationService graduationService;
    private final UserRepository userRepository;

    /**
     * Chạy thuật toán xét tốt nghiệp cho toàn bộ sinh viên trong Khóa tuyển sinh (Cohort).
     * Chỉ Cán bộ Đào tạo (ACADEMIC_AFFAIRS) có quyền thực thi theo Ma trận phân quyền.
     */
    @PostMapping("/evaluate-cohort/{cohortId}")
    @PreAuthorize("hasRole('ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<List<GraduationRecord>>> evaluateCohort(@PathVariable Integer cohortId) {
        List<GraduationRecord> records = graduationService.assessCohortCandidates(cohortId);
        return ResponseEntity.ok(ApiResponse.success(
                "Đã thực thi thuật toán xét tốt nghiệp thành công cho " + records.size() + " sinh viên", records));
    }

    /**
     * Tra cứu danh sách hồ sơ tốt nghiệp phân trang, có thể lọc theo Khóa và trạng thái (PENDING, APPROVED, REJECTED).
     */
    @GetMapping("/records")
    @PreAuthorize("hasRole('ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<Page<GraduationRecord>>> getRecords(
            @RequestParam(required = false) Integer cohortId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<GraduationRecord> records = graduationService.getGraduationRecords(
                cohortId, status, PageRequest.of(page, size, Sort.by("id").descending()));
        return ResponseEntity.ok(ApiResponse.success(records));
    }

    /**
     * Phê duyệt tốt nghiệp cho một hồ sơ cá nhân.
     */
    @PostMapping("/records/{recordId}/approve")
    @PreAuthorize("hasRole('ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<GraduationRecord>> approveRecord(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long recordId,
            @RequestBody(required = false) Map<String, String> body) {
        User staff = userRepository.findById(principal.getId()).orElse(null);
        String decisionNo = body != null ? body.get("decisionNo") : null;
        GraduationRecord record = graduationService.approveGraduation(recordId, staff, decisionNo);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt tốt nghiệp thành công", record));
    }

    /**
     * Phê duyệt tốt nghiệp hàng loạt cho toàn bộ sinh viên đủ điều kiện (QUALIFIED) trong khóa.
     */
    @PostMapping("/batch-approve/{cohortId}")
    @PreAuthorize("hasRole('ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<List<GraduationRecord>>> batchApprove(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Integer cohortId,
            @RequestBody(required = false) Map<String, String> body) {
        User staff = userRepository.findById(principal.getId()).orElse(null);
        String decisionNo = body != null ? body.get("decisionNo") : null;
        List<GraduationRecord> records = graduationService.batchApprove(cohortId, staff, decisionNo);
        return ResponseEntity.ok(ApiResponse.success(
                "Đã phê duyệt tốt nghiệp hàng loạt cho " + records.size() + " sinh viên đủ chuẩn", records));
    }
}
