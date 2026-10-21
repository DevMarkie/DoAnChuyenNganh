package com.sms.dto.response;

import com.sms.entity.PasswordResetRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetResult {

    private PasswordResetRequest request;
    private String generatedPassword;
    private boolean emailSent;
    private String message;
}
