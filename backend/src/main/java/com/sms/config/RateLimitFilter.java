package com.sms.config;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

/**
 * GAP-03: Server-side Rate Limiter cho API enrollment.
 * <p>
 * Sử dụng thuật toán Sliding Window Counter trong bộ nhớ.
 * Giới hạn mỗi user (theo JWT principal) tối đa {@code MAX_REQUESTS}
 * request POST enrollment trong {@code WINDOW_MS} mili-giây.
 * <p>
 * Cơ chế này chặn auto-click tool và bot gọi API trực tiếp
 * mà frontend guard (useRef) không bắt được.
 */
@Slf4j
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    /** Tối đa 5 request thay đổi (POST/DELETE) enrollment trong 10 giây per user. */
    private static final int ENROLLMENT_MAX_REQUESTS = 5;
    private static final long ENROLLMENT_WINDOW_MS = 10_000L;

    /** Tối đa 5 request quên mật khẩu trong 60 giây per IP (SEC-05). */
    private static final int FORGOT_PASSWORD_MAX_REQUESTS = 5;
    private static final long FORGOT_PASSWORD_WINDOW_MS = 60_000L;

    /** In-memory sliding window counters, keyed by username. */
    private final Map<String, SlidingWindowBucket> enrollmentBuckets = new ConcurrentHashMap<>();

    /** In-memory sliding window counters for forgot-password, keyed by client IP. */
    private final Map<String, SlidingWindowBucket> forgotPasswordBuckets = new ConcurrentHashMap<>();

    /**
     * Dọn dẹp định kỳ (mỗi 5 phút) để chống memory leak từ những user/IP
     * không còn gửi request nữa.
     */
    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 300000)
    public void cleanupExpiredBuckets() {
        long now = System.currentTimeMillis();
        enrollmentBuckets.entrySet().removeIf(entry -> now - entry.getValue().windowStart.get() > ENROLLMENT_WINDOW_MS);
        forgotPasswordBuckets.entrySet().removeIf(entry -> now - entry.getValue().windowStart.get() > FORGOT_PASSWORD_WINDOW_MS);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        String method = request.getMethod();
        // Rate-limit các thao tác ghi enrollment (POST đăng ký, DELETE hủy)
        boolean isEnrollmentWrite = path.startsWith("/api/enrollments")
                && ("POST".equalsIgnoreCase(method) || "DELETE".equalsIgnoreCase(method));
        // Rate-limit request quên mật khẩu công khai (POST forgot-password)
        boolean isForgotPassword = "/api/auth/forgot-password".equals(path)
                && "POST".equalsIgnoreCase(method);
        return !isEnrollmentWrite && !isForgotPassword;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getServletPath();
        if ("/api/auth/forgot-password".equals(path)) {
            String clientIp = getClientIp(request);
            SlidingWindowBucket bucket = forgotPasswordBuckets.computeIfAbsent(
                    clientIp, k -> new SlidingWindowBucket(FORGOT_PASSWORD_MAX_REQUESTS, FORGOT_PASSWORD_WINDOW_MS));
            if (!bucket.tryConsume()) {
                log.warn("RATE_LIMIT: IP='{}' exceeded {} forgot-password requests in {}s",
                        clientIp, FORGOT_PASSWORD_MAX_REQUESTS, FORGOT_PASSWORD_WINDOW_MS / 1000);
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write(
                        "{\"success\":false,\"message\":\"Bạn gửi yêu cầu quá thường xuyên. Vui lòng thử lại sau ít phút.\"}");
                return;
            }
            filterChain.doFilter(request, response);
            return;
        }

        String username = extractUsername(request);
        if (username == null) {
            // Chưa authenticate → để Security filter xử lý 401
            filterChain.doFilter(request, response);
            return;
        }

        SlidingWindowBucket bucket = enrollmentBuckets.computeIfAbsent(
                username, k -> new SlidingWindowBucket(ENROLLMENT_MAX_REQUESTS, ENROLLMENT_WINDOW_MS));
        if (!bucket.tryConsume()) {
            log.warn("RATE_LIMIT: user='{}' exceeded {} enrollment requests in {}s",
                    username, ENROLLMENT_MAX_REQUESTS, ENROLLMENT_WINDOW_MS / 1000);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(
                    "{\"success\":false,\"message\":\"Bạn thao tác quá nhanh. Vui lòng đợi vài giây rồi thử lại.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String extractUsername(HttpServletRequest request) {
        var auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return null;
    }

    /**
     * Sliding window counter per key.
     * Thread-safe via atomic operations.
     */
    private static class SlidingWindowBucket {
        private final int maxRequests;
        private final long windowMs;
        private final AtomicLong windowStart = new AtomicLong(System.currentTimeMillis());
        private final AtomicInteger count = new AtomicInteger(0);

        SlidingWindowBucket(int maxRequests, long windowMs) {
            this.maxRequests = maxRequests;
            this.windowMs = windowMs;
        }

        boolean tryConsume() {
            long now = System.currentTimeMillis();
            long start = windowStart.get();

            if (now - start > windowMs) {
                // Reset window
                windowStart.set(now);
                count.set(1);
                return true;
            }

            return count.incrementAndGet() <= maxRequests;
        }
    }
}
