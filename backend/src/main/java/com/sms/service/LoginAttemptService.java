package com.sms.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Bảo vệ chống Brute-Force cho endpoint đăng nhập.
 * Sau MAX_ATTEMPTS lần sai liên tiếp, tài khoản bị khoá LOCK_DURATION_SECONDS giây.
 */
@Slf4j
@Service
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCK_DURATION_SECONDS = 15 * 60; // 15 phút

    private record AttemptInfo(int count, Instant lockedUntil) {}

    private final ConcurrentHashMap<String, AttemptInfo> attempts = new ConcurrentHashMap<>();

    /**
     * Gọi khi đăng nhập thành công — xoá bộ đếm.
     */
    public void loginSucceeded(String username) {
        attempts.remove(username.toLowerCase());
    }

    /**
     * Gọi khi đăng nhập thất bại — tăng bộ đếm và khoá nếu vượt ngưỡng.
     */
    public void loginFailed(String username) {
        String key = username.toLowerCase();
        AttemptInfo info = attempts.getOrDefault(key, new AttemptInfo(0, null));

        // Nếu đã hết thời gian lock thì reset
        if (info.lockedUntil() != null && Instant.now().isAfter(info.lockedUntil())) {
            info = new AttemptInfo(0, null);
        }

        int newCount = info.count() + 1;
        Instant newLock = newCount >= MAX_ATTEMPTS
                ? Instant.now().plusSeconds(LOCK_DURATION_SECONDS)
                : null;

        attempts.put(key, new AttemptInfo(newCount, newLock));

        if (newLock != null) {
            log.warn("SECURITY: Tài khoản '{}' bị khoá {} phút do đăng nhập sai {} lần liên tiếp.",
                    key, LOCK_DURATION_SECONDS / 60, MAX_ATTEMPTS);
        }
    }

    /**
     * Kiểm tra tài khoản có đang bị khoá không.
     *
     * @return số giây còn lại bị khoá, hoặc 0 nếu không bị khoá.
     */
    public long getSecondsUntilUnlocked(String username) {
        AttemptInfo info = attempts.get(username.toLowerCase());
        if (info == null || info.lockedUntil() == null) return 0;
        if (Instant.now().isAfter(info.lockedUntil())) {
            attempts.remove(username.toLowerCase());
            return 0;
        }
        return info.lockedUntil().getEpochSecond() - Instant.now().getEpochSecond();
    }

    /**
     * Trả về true nếu tài khoản đang trong trạng thái bị khoá.
     */
    public boolean isBlocked(String username) {
        return getSecondsUntilUnlocked(username) > 0;
    }
}
