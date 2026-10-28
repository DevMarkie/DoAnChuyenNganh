package com.sms.service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisLockService {

    private final StringRedisTemplate stringRedisTemplate;

    private static final String LOCK_USER_PREFIX = "sms:lock:user:";
    private static final String RATELIMIT_USER_PREFIX = "sms:ratelimit:user:";

    /**
     * Thử lấy khóa Idempotency cho một User khi thực hiện action (đăng ký/hủy môn).
     * Ngăn chặn việc sinh viên spam click liên tục hoặc extension auto-click gửi dồn dập.
     *
     * @param userId     ID của sinh viên
     * @param action     Tên hành động (ví dụ: "ENROLL")
     * @param ttlSeconds Thời gian khóa (mặc định 2-3 giây)
     * @return true nếu lấy được khóa (được đi tiếp), false nếu đang có request khác cùng user xử lý
     */
    public boolean acquireUserActionLock(Long userId, String action, long ttlSeconds) {
        if (userId == null) {
            return true;
        }
        String key = LOCK_USER_PREFIX + userId + ":" + (action != null ? action : "DEFAULT");
        try {
            Boolean acquired = stringRedisTemplate.opsForValue()
                    .setIfAbsent(key, "1", Duration.ofSeconds(ttlSeconds));
            return Boolean.TRUE.equals(acquired);
        } catch (Exception e) {
            log.warn("RedisLockService.acquireUserActionLock failed for key '{}': {}. Falling back to open lock.", key, e.getMessage());
            return true; // Fail-open: không chặn người dùng nếu Redis gặp sự cố mạng tạm thời
        }
    }

    /**
     * Giải phóng khóa Idempotency cho User.
     */
    public void releaseUserActionLock(Long userId, String action) {
        if (userId == null) {
            return;
        }
        String key = LOCK_USER_PREFIX + userId + ":" + (action != null ? action : "DEFAULT");
        try {
            stringRedisTemplate.delete(key);
        } catch (Exception e) {
            log.warn("RedisLockService.releaseUserActionLock failed for key '{}': {}", key, e.getMessage());
        }
    }

    /**
     * Rate Limiting theo User (Token bucket / Sliding counter trên Redis).
     * TUYỆT ĐỐI KHÔNG CHẶN THEO IP để tránh ảnh hưởng KTX hoặc Wi-Fi trường.
     *
     * @param identifier    user_id hoặc username
     * @param maxRequests   Số lượng request tối đa trong cửa sổ
     * @param windowSeconds Thời gian cửa sổ (giây)
     * @return true nếu còn hạn mức, false nếu vượt quá
     */
    public boolean tryConsumeUserRateLimit(String identifier, int maxRequests, long windowSeconds) {
        if (identifier == null || identifier.isBlank()) {
            return true;
        }
        String key = RATELIMIT_USER_PREFIX + identifier;
        try {
            Long count = stringRedisTemplate.opsForValue().increment(key);
            if (count != null && count == 1) {
                stringRedisTemplate.expire(key, windowSeconds, TimeUnit.SECONDS);
            }
            return count != null && count <= maxRequests;
        } catch (Exception e) {
            log.warn("RedisLockService.tryConsumeUserRateLimit failed for key '{}': {}. Fail-open.", key, e.getMessage());
            return true;
        }
    }
}
