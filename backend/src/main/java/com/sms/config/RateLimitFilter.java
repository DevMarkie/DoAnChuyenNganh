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
    private static final int MAX_REQUESTS = 5;
    private static final long WINDOW_MS = 10_000L;

    /** In-memory sliding window counters, keyed by username. */
    private final Map<String, UserBucket> buckets = new ConcurrentHashMap<>();

    /**
     * Dọn dẹp định kỳ (mỗi 5 phút) để chống memory leak từ những user
     * không còn gửi request nữa.
     */
    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 300000)
    public void cleanupExpiredBuckets() {
        long now = System.currentTimeMillis();
        buckets.entrySet().removeIf(entry -> now - entry.getValue().windowStart.get() > WINDOW_MS);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        String method = request.getMethod();
        // Chỉ rate-limit các thao tác ghi enrollment (POST đăng ký, DELETE hủy)
        boolean isEnrollmentWrite = path.startsWith("/api/enrollments")
                && ("POST".equalsIgnoreCase(method) || "DELETE".equalsIgnoreCase(method));
        return !isEnrollmentWrite;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String username = extractUsername(request);
        if (username == null) {
            // Chưa authenticate → để Security filter xử lý 401
            filterChain.doFilter(request, response);
            return;
        }

        UserBucket bucket = buckets.computeIfAbsent(username, k -> new UserBucket());
        if (!bucket.tryConsume()) {
            log.warn("RATE_LIMIT: user='{}' exceeded {} enrollment requests in {}s",
                    username, MAX_REQUESTS, WINDOW_MS / 1000);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(
                    "{\"success\":false,\"message\":\"Bạn thao tác quá nhanh. Vui lòng đợi vài giây rồi thử lại.\"}");
            return;
        }

        filterChain.doFilter(request, response);
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
     * Sliding window counter per user.
     * Thread-safe via atomic operations.
     */
    private static class UserBucket {
        private final AtomicLong windowStart = new AtomicLong(System.currentTimeMillis());
        private final AtomicInteger count = new AtomicInteger(0);

        boolean tryConsume() {
            long now = System.currentTimeMillis();
            long start = windowStart.get();

            if (now - start > WINDOW_MS) {
                // Reset window
                windowStart.set(now);
                count.set(1);
                return true;
            }

            return count.incrementAndGet() <= MAX_REQUESTS;
        }
    }
}
