package com.sms.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStudentContactRequest {

    @Size(max = 15, message = "Số điện thoại không được vượt quá 15 ký tự")
    @Pattern(regexp = "^(0\\d{9})?$", message = "Số điện thoại phải có 10 chữ số bắt đầu bằng số 0")
    private String phone;

    @Size(max = 255, message = "Địa chỉ không được vượt quá 255 ký tự")
    private String address;

    @Size(max = 100, message = "Tên người liên hệ khẩn cấp không được vượt quá 100 ký tự")
    private String emergencyContactName;

    @Size(max = 15, message = "Số điện thoại khẩn cấp không được vượt quá 15 ký tự")
    @Pattern(regexp = "^(0\\d{9})?$", message = "Số điện thoại khẩn cấp không đúng định dạng Việt Nam (10 chữ số bắt đầu bằng 0)")
    private String emergencyContactPhone;

    @Size(max = 50, message = "Mối quan hệ không được vượt quá 50 ký tự")
    private String emergencyContactRelationship;
}
