package com.sms.dto.request;

import jakarta.validation.constraints.AssertTrue;
import lombok.Data;

@Data
public class BulkResetPasswordRequest {

    /**
     * Bắt buộc phải truyền confirm = true để xác nhận reset hàng loạt.
     */
    @AssertTrue(message = "Phải xác nhận bằng cách đặt confirm = true")
    private boolean confirm;
}
