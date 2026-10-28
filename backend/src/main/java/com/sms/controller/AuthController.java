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

    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<ApiResponse<com.sms.dto.response.SendOtpResponse>> sendOtp(
            @Valid @RequestBody com.sms.dto.request.SendOtpRequest request) {
        com.sms.dto.response.SendOtpResponse response = passwordResetService.sendOtp(request);
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyOtpAndReset(
            @Valid @RequestBody com.sms.dto.request.VerifyOtpResetRequest request) {
        passwordResetService.verifyOtpAndReset(request);
        return ResponseEntity.ok(ApiResponse.success("Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay với mật khẩu mới."));
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody ChangePasswordRequest request) {
        // /api/auth/** là permitAll nên request ẩn danh vẫn tới đây -> principal null.
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.<Void>error("Bạn cần đăng nhập để đổi mật khẩu"));
        }
        authService.changePassword(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công"));
    }

    /**
     * Logout. JWTs are stateless (no server-side blacklist), so the client must
     * discard its stored token; this endpoint just acknowledges the action and
     * gives clients a single, explicit call to hit on sign-out.
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công"));
    }
}
