package com.sms.service;

import java.time.Duration;
import java.util.Collections;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
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

    private static final RedisScript<Long> RELEASE_LOCK_SCRIPT = new DefaultRedisScript<>(
            "if redis.call('get', KEYS[1]) == ARGV[1] then " +
            "    return redis.call('del', KEYS[1]) " +
            "else " +
            "    return 0 " +
            "end",
            Long.class
    );

    /**
     * Lấy khóa phân tán với unique UUID token.
     *
     * @param key        Khóa Redis
     * @param ttlSeconds Thời gian sống của khóa (giây)
     * @return token UUID nếu lấy được khóa, null nếu bị khóa bởi thread khác, token fallback nếu Redis lỗi (fail-open)
     */
    public String acquireLock(String key, long ttlSeconds) {
        if (key == null || key.isBlank()) {
            return null;
        }
        String token = UUID.randomUUID().toString();
        try {
            Boolean acquired = stringRedisTemplate.opsForValue()
                    .setIfAbsent(key, token, Duration.ofSeconds(ttlSeconds));
            if (Boolean.TRUE.equals(acquired)) {
                return token;
            }
            return null;
        } catch (Exception e) {
            log.warn("RedisLockService.acquireLock failed for key '{}': {}. Falling back to open lock.", key, e.getMessage());
            return "FAIL_OPEN_" + token;
        }
    }

    /**
     * Giải phóng khóa phân tán an toàn bằng Lua script: chỉ xóa khi token khớp.
     *
     * @param key       Khóa Redis
     * @param lockToken Token sở hữu khóa
     * @return true nếu giải phóng thành công, false nếu không khớp token hoặc lỗi
     */
    public boolean releaseLock(String key, String lockToken) {
        if (key == null || lockToken == null || lockToken.isBlank()) {
            return false;
        }
        if (lockToken.startsWith("FAIL_OPEN_")) {
            return true;
        }
        try {
            Long result = stringRedisTemplate.execute(
                    RELEASE_LOCK_SCRIPT,
                    Collections.singletonList(key),
                    lockToken
            );
            return result != null && result > 0;
        } catch (Exception e) {
            log.warn("RedisLockService.releaseLock failed for key '{}': {}", key, e.getMessage());
            return false;
        }
    }

    /**
     * Thử lấy khóa Idempotency cho một User khi thực hiện action (đăng ký/hủy môn).
     * Ngăn chặn việc sinh viên spam click liên tục hoặc extension auto-click gửi dồn dập.
     *
     * @param userId     ID của sinh viên
     * @param action     Tên hành động (ví dụ: "ENROLL")
     * @param ttlSeconds Thời gian khóa (mặc định 2-3 giây)
     * @return lockToken UUID nếu lấy được khóa, null nếu đang có request khác cùng user xử lý
     */
    public String acquireUserActionLock(Long userId, String action, long ttlSeconds) {
        if (userId == null) {
            return "NOOP";
        }
        String key = LOCK_USER_PREFIX + userId + ":" + (action != null ? action : "DEFAULT");
        return acquireLock(key, ttlSeconds);
    }

    /**
     * Giải phóng khóa Idempotency an toàn cho User bằng token.
     */
    public boolean releaseUserActionLock(Long userId, String action, String lockToken) {
        if (userId == null || lockToken == null || "NOOP".equals(lockToken)) {
            return true;
        }
        String key = LOCK_USER_PREFIX + userId + ":" + (action != null ? action : "DEFAULT");
        return releaseLock(key, lockToken);
    }

    /**
     * Giải phóng khóa Idempotency cho User (Legacy fallback).
     */
    @Deprecated
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
