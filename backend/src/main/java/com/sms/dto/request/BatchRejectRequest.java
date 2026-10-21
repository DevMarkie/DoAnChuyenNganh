package com.sms.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * Payload for POST /api/admin/password-resets/batch-reject.
 * Replaces the previous raw {@code Map<String,Object>} parsing so the id list is
 * type-safe (Jackson coerces the JSON array straight to {@code List<Long>}).
 */
@Data
public class BatchRejectRequest {

    @NotEmpty(message = "Danh sách yêu cầu không được để trống")
    private List<Long> requestIds;

    private String reason;
}
