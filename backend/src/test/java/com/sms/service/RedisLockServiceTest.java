package com.sms.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

@ExtendWith(MockitoExtension.class)
class RedisLockServiceTest {

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private RedisLockService redisLockService;

    @Test
    @DisplayName("acquireUserActionLock thành công khi user chưa có request nào đang chạy")
    void acquireUserActionLock_success() {
        Long userId = 123L;
        String action = "ENROLL";
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("sms:lock:user:123:ENROLL"), eq("1"), any(Duration.class)))
                .thenReturn(true);

        boolean acquired = redisLockService.acquireUserActionLock(userId, action, 2);

        assertThat(acquired).isTrue();
    }

    @Test
    @DisplayName("acquireUserActionLock chặn lại khi user đang có request chưa xong (chống spam click)")
    void acquireUserActionLock_fails_whenAlreadyLocked() {
        Long userId = 123L;
        String action = "ENROLL";
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("sms:lock:user:123:ENROLL"), eq("1"), any(Duration.class)))
                .thenReturn(false);

        boolean acquired = redisLockService.acquireUserActionLock(userId, action, 2);

        assertThat(acquired).isFalse();
    }

    @Test
    @DisplayName("releaseUserActionLock xóa key giải phóng khóa")
    void releaseUserActionLock_deletesKey() {
        Long userId = 123L;
        String action = "ENROLL";

        redisLockService.releaseUserActionLock(userId, action);

        verify(stringRedisTemplate).delete("sms:lock:user:123:ENROLL");
    }

    @Test
    @DisplayName("tryConsumeUserRateLimit cho phép khi trong hạn mức")
    void tryConsumeUserRateLimit_allowed() {
        String username = "student01";
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment("sms:ratelimit:user:student01")).thenReturn(3L);

        boolean allowed = redisLockService.tryConsumeUserRateLimit(username, 5, 10);

        assertThat(allowed).isTrue();
    }

    @Test
    @DisplayName("tryConsumeUserRateLimit từ chối khi vượt quá hạn mức")
    void tryConsumeUserRateLimit_exceeded() {
        String username = "student01";
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment("sms:ratelimit:user:student01")).thenReturn(6L);

        boolean allowed = redisLockService.tryConsumeUserRateLimit(username, 5, 10);

        assertThat(allowed).isFalse();
    }
}
