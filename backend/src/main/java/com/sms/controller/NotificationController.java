package com.sms.controller;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.sms.dto.ApiResponse;
import com.sms.dto.response.NotificationResponse;
import com.sms.security.UserPrincipal;
import com.sms.service.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Kênh SSE truyền thông báo đẩy thời gian thực từ máy chủ đến trình duyệt
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    public SseEmitter subscribe(@AuthenticationPrincipal UserPrincipal user) {
        return notificationService.subscribe(user.getId());
    }

    /**
     * Lấy danh sách thông báo của sinh viên
     */
    @GetMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getMyNotifications(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(defaultValue = "30") int limit) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.getMyNotifications(user.getId(), limit)));
    }

    /**
     * Lấy số lượng thông báo chưa đọc (để hiển thị badge chuông đỏ)
     */
    @GetMapping("/unread-count")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.getUnreadCount(user.getId())));
    }

    /**
     * Đánh dấu một thông báo là đã đọc
     */
    @PutMapping("/{id}/read")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id) {
        notificationService.markAsRead(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu thông báo là đã đọc"));
    }

    /**
     * Đánh dấu tất cả thông báo là đã đọc
     */
    @PutMapping("/read-all")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(@AuthenticationPrincipal UserPrincipal user) {
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu tất cả thông báo là đã đọc"));
    }
}
