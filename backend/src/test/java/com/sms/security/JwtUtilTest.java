package com.sms.security;

import com.sms.entity.Role;
import com.sms.entity.User;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    // HS512 can key >= 64 byte; day la secret base64 cho test (khong dung that).
    private static final String SECRET = Base64.getEncoder().encodeToString(new byte[64]);

    private UserPrincipal principal() {
        Role role = new Role();
        role.setName("ADMIN");
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@mail.com");
        user.setRole(role);
        user.setIsActive(true);
        return UserPrincipal.create(user);
    }

    @Test
    void generatesAndValidatesToken() {
        JwtUtil jwt = new JwtUtil(SECRET, 3_600_000L, "default");
        String token = jwt.generateToken(principal());

        Claims claims = jwt.getValidatedClaims(token);
        assertNotNull(claims);
        assertEquals("testuser", claims.getSubject());
        assertEquals("ADMIN", claims.get("role"));
        assertEquals(1L, ((Number) claims.get("userId")).longValue());
    }

    @Test
    void rejectsTamperedToken() {
        JwtUtil jwt = new JwtUtil(SECRET, 3_600_000L, "default");
        String token = jwt.generateToken(principal());

        // Đổi ký tự ĐẦU của phần chữ ký -> luôn đổi byte chữ ký nên luôn bị từ chối.
        // (ký tự CUỐI của base64url có vài bit thừa, đổi nó có thể là no-op -> test flaky.)
        int sig = token.lastIndexOf('.') + 1;
        char c = token.charAt(sig);
        String tampered = token.substring(0, sig)
                + (c == 'A' ? 'B' : 'A')
                + token.substring(sig + 1);

        assertNull(jwt.getValidatedClaims(tampered));
    }

    @Test
    void rejectsExpiredToken() {
        // expiration am -> token sinh ra da het han ngay lap tuc.
        JwtUtil jwt = new JwtUtil(SECRET, -1_000L, "default");
        String token = jwt.generateToken(principal());

        assertNull(jwt.getValidatedClaims(token));
    }
}
