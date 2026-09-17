package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.dto.request.LoginRequest;
import com.sms.dto.request.ChangePasswordRequest;
import com.sms.dto.response.LoginResponse;
import com.sms.security.UserPrincipal;
import com.sms.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final com.sms.service.PasswordResetService passwordResetService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody com.sms.dto.request.ForgotPasswordRequest request) {
        passwordResetService.createRequest(request);
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu cấp lại mật khẩu đã được gửi thành công đến Ban Quản trị. Vui lòng kiểm tra Gmail sau khi yêu cầu được xử lý."));
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công"));
    }
}
