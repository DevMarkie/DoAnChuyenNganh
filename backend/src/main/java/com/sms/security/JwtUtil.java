package com.sms.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

@Slf4j
@Component
public class JwtUtil {

    /**
     * Khóa ký JWT mặc định dùng chung cho môi trường dev / local cluster.
     * Trong moi truong dev/test, neu chua cau hinh JWT_SECRET se tu dong sinh khoa ngau nhien manh (HS512).
     */


    private final SecretKey key;
    private final long expiration;

    public JwtUtil(@Value("${app.jwt.secret:}") String secret,
                   @Value("${app.jwt.expiration}") long expiration,
                   @Value("${spring.profiles.active:default}") String activeProfile) {
        String effectiveSecret = secret;
        if (effectiveSecret == null || effectiveSecret.isBlank()) {
            if ("prod".equalsIgnoreCase(activeProfile) || "production".equalsIgnoreCase(activeProfile)) {
                throw new IllegalStateException("JWT_SECRET must be set in production environment!");
            }
            log.warn("app.jwt.secret is not set — generating an ephemeral secure random key for {} profile. "
                    + "Set the JWT_SECRET environment variable for production.", activeProfile);
            this.key = Jwts.SIG.HS512.key().build();
        } else {
            this.key = Keys.hmacShaKeyFor(Base64.getDecoder().decode(effectiveSecret));
        }
        this.expiration = expiration;
    }

    public String generateToken(UserPrincipal userPrincipal) {
        return Jwts.builder()
                .subject(userPrincipal.getUsername())
                .claim("role", userPrincipal.getRole())
                .claim("userId", userPrincipal.getId())
                .claim("email", userPrincipal.getEmail())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key)
                .compact();
    }

    public Claims getValidatedClaims(String token) {
        try {
            return parseClaims(token);
        } catch (ExpiredJwtException e) {
            log.warn("JWT token expired: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.warn("Malformed JWT token: {}", e.getMessage());
        } catch (io.jsonwebtoken.security.SecurityException e) {
            log.warn("Invalid JWT signature: {}", e.getMessage());
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Parse and cache claims from token.
     * Avoids double-parsing when both validateToken() and getUsernameFromToken() are called.
     */
    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
