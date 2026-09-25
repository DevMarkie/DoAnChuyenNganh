package com.sms.service;

import com.sms.dto.request.LoginRequest;
import com.sms.dto.request.ChangePasswordRequest;
import com.sms.dto.response.LoginResponse;
import com.sms.entity.User;
import com.sms.repository.UserRepository;
import com.sms.security.JwtUtil;
import com.sms.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final LoginAttemptService loginAttemptService;

    public LoginResponse login(LoginRequest request) {
        String username = request.getUsername().trim();

        // Kiểm tra tài khoản có đang bị khoá do brute-force không
        long secondsLocked = loginAttemptService.getSecondsUntilUnlocked(username);
        if (secondsLocked > 0) {
            long minutesLeft = (secondsLocked + 59) / 60;
            throw new BadRequestException(
                    String.format("Tài khoản tạm thời bị khoá do đăng nhập sai quá nhiều lần. " +
                                  "Vui lòng thử lại sau %d phút.", minutesLeft));
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, request.getPassword())
            );

            // Đăng nhập thành công — xoá bộ đếm thất bại
            loginAttemptService.loginSucceeded(username);

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            String token = jwtUtil.generateToken(userPrincipal);

            return LoginResponse.builder()
                    .token(token)
                    .username(userPrincipal.getUsername())
                    .email(userPrincipal.getEmail())
                    .role(userPrincipal.getRole())
                    .userId(userPrincipal.getId())
                    .mustChangePassword(userPrincipal.isMustChangePassword())
                    .build();

        } catch (BadCredentialsException ex) {
            // Tăng bộ đếm thất bại
            loginAttemptService.loginFailed(username);
            long remaining = loginAttemptService.getSecondsUntilUnlocked(username);
            if (remaining > 0) {
                throw new BadRequestException(
                        "Sai tên đăng nhập hoặc mật khẩu. Tài khoản bị khoá 15 phút do sai quá nhiều lần.");
            }
            throw new BadRequestException("Sai tên đăng nhập hoặc mật khẩu.");
        }
    }

    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu cũ không đúng");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        // Xóa cờ bắt buộc đổi mật khẩu sau khi đổi thành công
        user.setMustChangePassword(false);
        userRepository.save(user);
    }
}
