package com.sms.dto.response;

import lombok.*;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    private String email;
    private String role;
    private Long userId;
    /** Nếu true, frontend phải chuyển hướng ngay sang trang đổi mật khẩu */
    private Boolean mustChangePassword;
}
