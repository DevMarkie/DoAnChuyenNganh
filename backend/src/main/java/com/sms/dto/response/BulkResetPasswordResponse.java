package com.sms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class BulkResetPasswordResponse {

    /** Tổng số tài khoản được xử lý (có ngày sinh hợp lệ). */
    private int resetCount;

    /** Số tài khoản bị bỏ qua vì thiếu ngày sinh. */
    private int skippedCount;

    /** Danh sách tài khoản bị bỏ qua (username + lý do). */
    private List<SkippedUser> skippedUsers;

    /** Thông báo tổng kết. */
    private String message;

    @Data
    @Builder
    public static class SkippedUser {
        private String username;
        private String reason;
    }
}
