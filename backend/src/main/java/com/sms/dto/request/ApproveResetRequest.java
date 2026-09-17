package com.sms.dto.request;

import lombok.Data;

@Data
public class ApproveResetRequest {

    /**
     * Optional custom new password. If blank, system generates an 8-character secure password.
     */
    private String newPassword;

    private String adminNotes;
}
