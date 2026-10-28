package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.response.CurriculumResponse;
import com.sms.dto.response.DegreeAuditResponse;
import com.sms.dto.response.PrerequisiteGraphResponse;
import com.sms.security.UserPrincipal;
import com.sms.service.CurriculumService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/curriculum")
@RequiredArgsConstructor
public class CurriculumController {
    private final CurriculumService curriculumService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<CurriculumResponse>> getMine(
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(curriculumService.getMyCurriculum(user.getId())));
    }

    @GetMapping({"/me/prerequisite-graph", "/prerequisite-graph"})
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<PrerequisiteGraphResponse>> getMyPrerequisiteGraph(
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(curriculumService.getPrerequisiteGraphByUserId(user.getId())));
    }

    @GetMapping({"/me/degree-audit", "/degree-audit"})
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<DegreeAuditResponse>> getMyDegreeAudit(
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(curriculumService.getDegreeAuditByUserId(user.getId())));
    }

    @GetMapping("/student/{studentId}/prerequisite-graph")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<PrerequisiteGraphResponse>> getStudentPrerequisiteGraph(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.success(curriculumService.getPrerequisiteGraphByStudentId(studentId)));
    }

    @GetMapping("/student/{studentId}/degree-audit")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<DegreeAuditResponse>> getStudentDegreeAudit(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.success(curriculumService.getDegreeAuditByStudentId(studentId)));
    }
}
