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

    private final SecretKey key;
    private final long expiration;

    public JwtUtil(@Value("${app.jwt.secret:}") String secret,
                   @Value("${app.jwt.expiration}") long expiration) {
        if (secret == null || secret.isBlank()) {
            // No secret configured: generate a random ephemeral key so a known
            // signing key is never shipped. Tokens are invalidated on restart —
            // set JWT_SECRET (base64, >= 64 bytes) in production for a stable key.
            this.key = Jwts.SIG.HS512.key().build();
            log.warn("app.jwt.secret is not set — using a random ephemeral JWT key. "
                    + "All tokens become invalid after each restart. "
                    + "Set the JWT_SECRET environment variable (base64-encoded) for production.");
        } else {
            this.key = Keys.hmacShaKeyFor(Base64.getDecoder().decode(secret));
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

    public String getUsernameFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT token expired: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.warn("Malformed JWT token: {}", e.getMessage());
        } catch (io.jsonwebtoken.security.SecurityException e) {
            log.warn("Invalid JWT signature: {}", e.getMessage());
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
        }
        return false;
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
