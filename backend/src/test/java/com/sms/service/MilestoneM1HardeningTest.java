package com.sms.service;

import com.sms.config.AsyncConfig;
import com.sms.dto.ApiResponse;
import com.sms.entity.*;
import com.sms.exception.GlobalExceptionHandler;
import com.sms.exception.PrerequisiteNotMetException;
import com.sms.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Suite kiểm thử tích hợp & hồi quy cho Milestone M1: Workflow & Exception Hardening.
 * Bao gồm các Feature:
 * - Feature 12: Prerequisite DAG Validation & Proxy Initialization (no swallowed exception)
 * - Feature 13: Student Balance Concurrency & Optimistic Locking (@Version & Atomic Update)
 * - Feature 14: Safe Distributed Lock Release with UUID Token in RedisLockService
 * - Feature 15: Asynchronous System Alerts in Warnings & AsyncConfig
 * - Feature 16: File Upload Multipart Size Alignment (15MB)
 * - Feature 17: GlobalExceptionHandler Extension (400 for IllegalArgument/IllegalState)
 */
@ExtendWith(MockitoExtension.class)
public class MilestoneM1HardeningTest {

    // -------------------------------------------------------------
    // Feature 14: Safe Distributed Lock Release Tests
    // -------------------------------------------------------------
    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private RedisLockService redisLockService;

    @Test
    @DisplayName("Feature 14: acquireLock sinh UUID token ngẫu nhiên và lưu với đúng TTL")
    void feature14_acquireLock_generatesUuidToken() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("sms:lock:user:101:ENROLL"), anyString(), eq(Duration.ofSeconds(3))))
                .thenReturn(true);

        String token = redisLockService.acquireLock("sms:lock:user:101:ENROLL", 3);

        assertNotNull(token);
        assertFalse(token.isBlank());
        // Verify token là định dạng UUID chuẩn
        assertDoesNotThrow(() -> UUID.fromString(token));
    }

    @Test
    @DisplayName("Feature 14: releaseLock sử dụng Lua script kiểm tra token trước khi xóa key")
    void feature14_releaseLock_usesLuaScript_verifyingTokenMatch() {
        String key = "sms:lock:user:101:ENROLL";
        String token = UUID.randomUUID().toString();

        when(stringRedisTemplate.execute(any(RedisScript.class), eq(Collections.singletonList(key)), eq(token)))
                .thenReturn(1L);

        boolean released = redisLockService.releaseLock(key, token);

        assertTrue(released);
        verify(stringRedisTemplate).execute(any(RedisScript.class), eq(Collections.singletonList(key)), eq(token));
        // Đảm bảo KHÔNG xóa thẳng tay bằng delete(key)
        verify(stringRedisTemplate, never()).delete(key);
    }

    @Test
    @DisplayName("Feature 14: releaseLock thất bại và không xóa key khi token không khớp")
    void feature14_releaseLock_fails_whenTokenDoesNotMatch() {
        String key = "sms:lock:user:101:ENROLL";
        String wrongToken = "foreign-thread-token";

        when(stringRedisTemplate.execute(any(RedisScript.class), eq(Collections.singletonList(key)), eq(wrongToken)))
                .thenReturn(0L);

        boolean released = redisLockService.releaseLock(key, wrongToken);

        assertFalse(released);
    }

    // -------------------------------------------------------------
    // Feature 13: Student Balance Concurrency & @Version
    // -------------------------------------------------------------
    @Test
    @DisplayName("Feature 13: Thực thể Student có trường @Version kiểu Long để hỗ trợ Optimistic Locking")
    void feature13_student_hasVersionAnnotation() throws NoSuchFieldException {
        Field versionField = Student.class.getDeclaredField("version");
        assertNotNull(versionField);
        assertTrue(versionField.isAnnotationPresent(jakarta.persistence.Version.class));
        assertEquals(Long.class, versionField.getType());

        Student s = new Student();
        assertEquals(0L, s.getVersion());
    }

    // -------------------------------------------------------------
    // Feature 15: Asynchronous System Alerts in Warnings & AsyncConfig
    // -------------------------------------------------------------
    @Test
    @DisplayName("Feature 15: AsyncConfig cấu hình đúng ThreadPoolTaskExecutor với prefix sms-async-")
    void feature15_asyncConfig_providesValidTaskExecutor() {
        AsyncConfig asyncConfig = new AsyncConfig();
        var executor = asyncConfig.taskExecutor();

        assertNotNull(executor);
        assertTrue(executor instanceof org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor);
        var pool = (org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor) executor;
        assertEquals(5, pool.getCorePoolSize());
        assertEquals(20, pool.getMaxPoolSize());
        assertEquals("sms-async-", pool.getThreadNamePrefix());
        pool.destroy();
    }

    @Test
    @DisplayName("Feature 15: EmailService.sendAcademicWarningEmail là CompletableFuture trả về kết quả async")
    void feature15_emailService_returnsCompletableFuture() throws Exception {
        EmailService emailService = new EmailService();
        // Khi mailSender null, trả về CompletableFuture.completedFuture(false)
        CompletableFuture<Boolean> future = emailService.sendAcademicWarningEmail(
                "student@phenikaa.edu.vn", "Nguyen Van C", "20010099",
                1, "GPA duoi 1.0", 14);

        assertNotNull(future);
        assertTrue(future.isDone());
        assertFalse(future.get());
    }

    // -------------------------------------------------------------
    // Feature 16 & 17: GlobalExceptionHandler Extension & Multipart Alignment
    // -------------------------------------------------------------
    @Test
    @DisplayName("Feature 16: GlobalExceptionHandler cấu hình hạn mức multipart 15MB")
    void feature16_globalExceptionHandler_multipartLimitIs15MB() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        ReflectionTestUtils.setField(handler, "maxFileSize", "15MB");

        MaxUploadSizeExceededException ex = new MaxUploadSizeExceededException(15 * 1024 * 1024);
        ResponseEntity<ApiResponse<Void>> response = handler.handleUploadTooLarge(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().getMessage().contains("15MB"));
    }

    @Test
    @DisplayName("Feature 17: IllegalArgumentException được ánh xạ thành HTTP 400 Bad Request")
    void feature17_handleIllegalArgument_returns400() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        IllegalArgumentException ex = new IllegalArgumentException("Học kỳ không tồn tại hoặc đã bị khóa");

        ResponseEntity<ApiResponse<Void>> response = handler.handleIllegalArgumentOrState(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Học kỳ không tồn tại hoặc đã bị khóa", response.getBody().getMessage());
    }

    @Test
    @DisplayName("Feature 17: IllegalStateException được ánh xạ thành HTTP 400 Bad Request")
    void feature17_handleIllegalState_returns400() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        IllegalStateException ex = new IllegalStateException("Trạng thái học vụ hiện tại không cho phép thao tác này");

        ResponseEntity<ApiResponse<Void>> response = handler.handleIllegalArgumentOrState(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Trạng thái học vụ hiện tại không cho phép thao tác này", response.getBody().getMessage());
    }

    // -------------------------------------------------------------
    // Feature 12: Prerequisite DAG Validation
    // -------------------------------------------------------------
    @Test
    @DisplayName("Feature 12: PrerequisiteNotMetException giữ nguyên thông tin môn tiên quyết để báo về client")
    void feature12_prerequisiteNotMetException_holdsCompleteMetadata() {
        PrerequisiteNotMetException pne = new PrerequisiteNotMetException(
                "CS202", "CS101", "Cơ sở lập trình");

        assertEquals("CS202", pne.getTargetSubjectCode());
        assertEquals("CS101", pne.getPrerequisiteSubjectCode());
        assertEquals("Cơ sở lập trình", pne.getPrerequisiteSubjectName());
        assertTrue(pne.getMessage().contains("CS202"));
        assertTrue(pne.getMessage().contains("CS101"));
        assertTrue(pne.getMessage().contains("Cơ sở lập trình"));
    }
}
