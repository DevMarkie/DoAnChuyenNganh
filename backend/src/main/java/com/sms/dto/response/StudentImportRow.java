package com.sms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Một dòng trong bảng xem trước (preview) khi nhập sinh viên từ Excel.
 * Dùng để kiểm tra và đối chiếu dữ liệu trước khi lưu chính thức vào cơ sở dữ liệu.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentImportRow {
    private int rowNumber;        // Số dòng trong file Excel (giúp đối soát)
    private String studentCode;   // Mã sinh viên
    private String fullName;      // Họ và tên
    private String dateOfBirth;   // Ngày sinh (YYYY-MM-DD)
    private String gender;        // Giới tính (Nam / Nữ / Khác)
    private String classCode;     // Mã lớp sinh hoạt
    private String className;     // Tên lớp sinh hoạt (nếu tìm thấy)
    private String email;         // Email
    private String phone;         // Số điện thoại
    private String address;       // Địa chỉ thường trú
    private boolean valid;        // Hợp lệ để import
    private String error;         // Lý do lỗi nếu không hợp lệ
}
