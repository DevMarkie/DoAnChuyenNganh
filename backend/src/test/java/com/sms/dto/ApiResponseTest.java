package com.sms.dto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ApiResponseTest {

    @Test
    @DisplayName("ApiResponse.success(data) khởi tạo thành công với message mặc định")
    void success_WithData_InitializesProperly() {
        ApiResponse<Integer> response = ApiResponse.success(12345);
        assertTrue(response.isSuccess());
        assertEquals("Thành công", response.getMessage());
        assertEquals(12345, response.getData());
    }

    @Test
    @DisplayName("ApiResponse.success(message, data) khởi tạo thành công với message tùy biến")
    void success_WithMessageAndData_InitializesProperly() {
        ApiResponse<Integer> response = ApiResponse.success("Thao tác thành công", 100);
        assertTrue(response.isSuccess());
        assertEquals("Thao tác thành công", response.getMessage());
        assertEquals(100, response.getData());
    }

    @Test
    @DisplayName("ApiResponse.success(message) khởi tạo thành công không kèm data")
    void success_WithMessageOnly_InitializesProperly() {
        ApiResponse<Void> response = ApiResponse.success("Đã xóa bản ghi");
        assertTrue(response.isSuccess());
        assertEquals("Đã xóa bản ghi", response.getMessage());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("ApiResponse.error(message) khởi tạo đối tượng lỗi")
    void error_WithMessageOnly_InitializesProperly() {
        ApiResponse<Void> response = ApiResponse.error("Đã xảy ra lỗi");
        assertFalse(response.isSuccess());
        assertEquals("Đã xảy ra lỗi", response.getMessage());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("ApiResponse.error(message, data) khởi tạo đối tượng lỗi kèm dữ liệu chi tiết")
    void error_WithMessageAndData_InitializesProperly() {
        ApiResponse<String> response = ApiResponse.error("Dữ liệu không hợp lệ", "Chi tiết lỗi");
        assertFalse(response.isSuccess());
        assertEquals("Dữ liệu không hợp lệ", response.getMessage());
        assertEquals("Chi tiết lỗi", response.getData());
    }

    @Test
    @DisplayName("Setters và Getters hoạt động chuẩn xác")
    void settersAndGetters_WorkCorrectly() {
        ApiResponse<String> response = new ApiResponse<>(true, "OK", "Data");
        response.setSuccess(false);
        response.setMessage("Failed");
        response.setData("NewData");

        assertFalse(response.isSuccess());
        assertEquals("Failed", response.getMessage());
        assertEquals("NewData", response.getData());
    }
}
