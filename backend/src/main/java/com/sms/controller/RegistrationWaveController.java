package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.RegistrationWaveRequest;
import com.sms.dto.response.RegistrationStatusResponse;
import com.sms.dto.response.RegistrationWaveResponse;
import com.sms.security.UserPrincipal;
import com.sms.service.RegistrationWaveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/registration-waves")
@RequiredArgsConstructor
public class RegistrationWaveController {

    private final RegistrationWaveService registrationWaveService;

    @GetMapping("/semester/{semesterId}")
    public ResponseEntity<ApiResponse<List<RegistrationWaveResponse>>> getBySemester(@PathVariable Integer semesterId) {
        return ResponseEntity.ok(ApiResponse.success(registrationWaveService.getWavesBySemester(semesterId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RegistrationWaveResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(registrationWaveService.getWaveById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<RegistrationWaveResponse>> create(@Valid @RequestBody RegistrationWaveRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Tạo đợt đăng ký thành công", registrationWaveService.createWave(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<RegistrationWaveResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody RegistrationWaveRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật đợt đăng ký thành công", registrationWaveService.updateWave(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        registrationWaveService.deleteWave(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa đợt đăng ký thành công", null));
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_AFFAIRS')")
    public ResponseEntity<ApiResponse<RegistrationWaveResponse>> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái đợt đăng ký thành công", registrationWaveService.toggleActive(id)));
    }

    @GetMapping("/my-status")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<RegistrationStatusResponse>> getMyStatus(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(registrationWaveService.getStudentRegistrationStatus(principal.getId())));
    }
}
