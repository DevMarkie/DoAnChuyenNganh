package com.sms.dto.response;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Một dòng trong bảng xem trước (preview) khi nhập điểm từ Excel.
 * KHÔNG được lưu ngay — Frontend hiển thị để giảng viên đối chiếu; chỉ các dòng
 * hợp lệ (valid=true) mới được gửi lại qua PUT /grades/batch để lưu chính thức.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeImportRow {
    private int rowNumber;        // số dòng trong file Excel (giúp GV dò lỗi)
    private Long enrollmentId;    // khoá đối chiếu sinh viên trong lớp
    private String studentCode;
    private String studentName;
    private BigDecimal cc1Score;
    private BigDecimal cc2Score;
    private BigDecimal midtermScore;
    private BigDecimal finalScore;
    private boolean valid;
    private String error;         // lý do nếu dòng không hợp lệ (null nếu hợp lệ)
}
