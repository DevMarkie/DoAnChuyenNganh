package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.ClassOpeningRequestCreate;
import com.sms.dto.request.SpecialSectionCreate;
import com.sms.entity.ClassOpeningRequest;
import com.sms.entity.CourseSection;
import com.sms.security.UserPrincipal;
import com.sms.service.SpecialClassService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/special-classes")
@RequiredArgsConstructor
public class SpecialClassController {
    private final SpecialClassService specialClassService;

    @PostMapping("/requests")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<ClassOpeningRequest>> submitRequest(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody ClassOpeningRequestCreate request) {
        return ResponseEntity.ok(ApiResponse.success("Đã gửi đơn đề nghị mở lớp",
                specialClassService.submitRequest(user.getId(), request.getSubjectId(),
                        request.getSemesterId(), request.getRequestType())));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CourseSection>> createSpecialSection(
            @Valid @RequestBody SpecialSectionCreate request) {
        return ResponseEntity.ok(ApiResponse.success("Đã tạo lớp riêng",
                specialClassService.createSpecialSection(request.getSubjectId(), request.getSemesterId(),
                        request.getLecturerId(), request.getSectionCode(), request.getMaxStudents(),
                        request.getBaseTuitionRate())));
    }

    @PostMapping("/{sectionId}/finalize-billing")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CourseSection>> finalizeBilling(@PathVariable Long sectionId) {
        return ResponseEntity.ok(ApiResponse.success("Đã chốt danh sách và phát sinh học phí",
                specialClassService.finalizeBilling(sectionId)));
    }
}
