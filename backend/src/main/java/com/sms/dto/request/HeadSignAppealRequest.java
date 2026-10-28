package com.sms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class HeadSignAppealRequest {
    @NotNull(message = "Bắt buộc chọn phê duyệt hoặc từ chối")
    private Boolean approved;

    private String headReviewNotes;
}
