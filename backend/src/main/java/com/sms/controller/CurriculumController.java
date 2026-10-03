package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.response.CurriculumResponse;
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
}
