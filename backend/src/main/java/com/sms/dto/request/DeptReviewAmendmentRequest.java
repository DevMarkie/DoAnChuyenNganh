package com.sms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DeptReviewAmendmentRequest {

    @NotNull(message = "Trạng thái phê duyệt (approved) không được để trống")
    private Boolean approved;

    private String notes;

    private String rejectionReason;
}
