package com.sms.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
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
import org.springframework.data.redis.core.script.RedisScript;

@ExtendWith(MockitoExtension.class)
class RedisLockServiceTest {

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private RedisLockService redisLockService;

    @Test
    @DisplayName("acquireUserActionLock thành công và trả về UUID token khi key chưa tồn tại")
    void acquireUserActionLock_success() {
        Long userId = 123L;
        String action = "ENROLL";
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("sms:lock:user:123:ENROLL"), anyString(), any(Duration.class)))
                .thenReturn(true);

        String token = redisLockService.acquireUserActionLock(userId, action, 2);

        assertThat(token).isNotNull().isNotBlank();
    }

    @Test
    @DisplayName("acquireUserActionLock trả về null khi user đang có request chưa xong (chống spam click)")
    void acquireUserActionLock_fails_whenAlreadyLocked() {
        Long userId = 123L;
        String action = "ENROLL";
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("sms:lock:user:123:ENROLL"), anyString(), any(Duration.class)))
                .thenReturn(false);

        String token = redisLockService.acquireUserActionLock(userId, action, 2);

        assertThat(token).isNull();
    }

    @Test
    @DisplayName("acquireLock fail-open khi Redis gặp sự cố mạng tạm thời")
    void acquireLock_failOpen_onException() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(anyString(), anyString(), any(Duration.class)))
                .thenThrow(new RuntimeException("Redis connection refused"));

        String token = redisLockService.acquireLock("sms:lock:user:999:ENROLL", 2);

        assertThat(token).isNotNull().startsWith("FAIL_OPEN_");
    }

    @Test
    @DisplayName("releaseUserActionLock với token hợp lệ thực thi Lua script xóa key")
    void releaseUserActionLock_validToken_success() {
        Long userId = 123L;
        String action = "ENROLL";
        String token = "uuid-token-abc";

        when(stringRedisTemplate.execute(any(RedisScript.class), anyList(), eq(token)))
                .thenReturn(1L);

        boolean released = redisLockService.releaseUserActionLock(userId, action, token);

        assertThat(released).isTrue();
        verify(stringRedisTemplate).execute(any(RedisScript.class), eq(java.util.Collections.singletonList("sms:lock:user:123:ENROLL")), eq(token));
    }

    @Test
    @DisplayName("releaseUserActionLock với token không khớp không xóa key và trả về false")
    void releaseUserActionLock_mismatchedToken_returnsFalse() {
        Long userId = 123L;
        String action = "ENROLL";
        String wrongToken = "uuid-wrong-token";

        when(stringRedisTemplate.execute(any(RedisScript.class), anyList(), eq(wrongToken)))
                .thenReturn(0L);

        boolean released = redisLockService.releaseUserActionLock(userId, action, wrongToken);

        assertThat(released).isFalse();
    }

    @Test
    @DisplayName("releaseUserActionLock legacy method xóa key giải phóng khóa")
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
