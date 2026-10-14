package com.sms.exception;

import com.sms.dto.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
        ReflectionTestUtils.setField(handler, "maxFileSize", "5MB");
    }

    @Test
    @DisplayName("ResourceNotFoundException ánh xạ thành HTTP 404 với message chuẩn")
    void handleNotFound_Returns404() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Không tìm thấy môn học");
        ResponseEntity<ApiResponse<Void>> response = handler.handleNotFound(ex);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Không tìm thấy môn học", response.getBody().getMessage());
    }

    @Test
    @DisplayName("BadRequestException ánh xạ thành HTTP 400")
    void handleBadRequest_Returns400() {
        BadRequestException ex = new BadRequestException("Vượt quá số tín chỉ");
        ResponseEntity<ApiResponse<Void>> response = handler.handleBadRequest(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Vượt quá số tín chỉ", response.getBody().getMessage());
    }

    @Test
    @DisplayName("BadCredentialsException ánh xạ thành HTTP 401")
    void handleBadCredentials_Returns401() {
        BadCredentialsException ex = new BadCredentialsException("Bad credentials");
        ResponseEntity<ApiResponse<Void>> response = handler.handleBadCredentials(ex);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("Tên đăng nhập hoặc mật khẩu không đúng", response.getBody().getMessage());
    }

    @Test
    @DisplayName("AccessDeniedException ánh xạ thành HTTP 403")
    void handleAccessDenied_Returns403() {
        AccessDeniedException ex = new AccessDeniedException("Access denied");
        ResponseEntity<ApiResponse<Void>> response = handler.handleAccessDenied(ex);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals("Bạn không có quyền thực hiện thao tác này", response.getBody().getMessage());
    }

    @Test
    @DisplayName("HttpMessageNotReadableException ánh xạ thành HTTP 400")
    void handleMalformedJson_Returns400() {
        HttpMessageNotReadableException ex = new HttpMessageNotReadableException("Invalid JSON");
        ResponseEntity<ApiResponse<Void>> response = handler.handleMalformedJson(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Dữ liệu gửi lên không đúng định dạng JSON", response.getBody().getMessage());
    }

    @Test
    @DisplayName("DataIntegrityViolationException ánh xạ thành HTTP 409 Conflict")
    void handleDataIntegrity_Returns409() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException("Duplicate key", new RuntimeException("duplicate"));
        ResponseEntity<ApiResponse<Void>> response = handler.handleDataIntegrity(ex);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("Dữ liệu bị trùng hoặc vi phạm ràng buộc toàn vẹn", response.getBody().getMessage());
    }

    @Test
    @DisplayName("MaxUploadSizeExceededException ánh xạ thành HTTP 400 kèm thông báo dung lượng")
    void handleUploadTooLarge_Returns400() {
        MaxUploadSizeExceededException ex = new MaxUploadSizeExceededException(5000000L);
        ResponseEntity<ApiResponse<Void>> response = handler.handleUploadTooLarge(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("File tải lên quá lớn (tối đa 5MB)", response.getBody().getMessage());
    }

    @Test
    @DisplayName("Exception chung ánh xạ thành HTTP 500 che giấu thông tin nội bộ")
    void handleGeneral_Returns500WithoutLeakingDetails() {
        Exception ex = new RuntimeException("Internal DB null pointer");
        ResponseEntity<ApiResponse<Void>> response = handler.handleGeneral(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.", response.getBody().getMessage());
    }
}
