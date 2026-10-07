package com.sms.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class LoginAttemptServiceTest {

    @InjectMocks
    private LoginAttemptService loginAttemptService;

    @BeforeEach
    void setUp() {
        // Clear internal state if needed
        ConcurrentHashMap<?, ?> attempts = (ConcurrentHashMap<?, ?>) ReflectionTestUtils.getField(loginAttemptService, "attempts");
        if (attempts != null) {
            attempts.clear();
        }
    }

    @Test
    void loginSucceeded_Success() {
        loginAttemptService.loginFailed("user1");
        assertTrue(loginAttemptService.getSecondsUntilUnlocked("user1") == 0); // Not blocked yet
        
        loginAttemptService.loginSucceeded("user1");
        
        assertFalse(loginAttemptService.isBlocked("user1"));
    }

    @Test
    void loginFailed_BlocksAfterMaxAttempts() {
        for (int i = 0; i < 5; i++) {
            loginAttemptService.loginFailed("user1");
        }
        
        assertTrue(loginAttemptService.isBlocked("user1"));
        assertTrue(loginAttemptService.getSecondsUntilUnlocked("user1") > 0);
    }
}
