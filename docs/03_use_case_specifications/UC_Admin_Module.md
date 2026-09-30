# USE CASE SPECIFICATION: PHÂN HỆ ADMIN

## 1. UC-A06: Mở Lớp học phần mới & Cấu hình sĩ số
- **Actor:** Admin (Phòng Đào tạo)
- **Brief Description:** Tạo danh sách các Lớp học phần cụ thể cho học kỳ mới.
- **Main Flow:**
  1. Admin chọn Học kỳ, Môn học.
  2. Nhập Mã lớp học phần (VD: IT101.01), Sĩ số tối đa.
  3. Chọn Giảng viên phụ trách.
  4. Hệ thống lưu cấu hình và tạo bản ghi CourseClass.

## 2. UC-A08: Phân bổ TKB & Xếp phòng học
- **Actor:** Admin (Phòng Đào tạo)
- **Brief Description:** Gán Thứ, Ca học và Phòng học cho lớp học phần.
- **Main Flow:**
  1. Chọn Lớp học phần cần xếp lịch.
  2. Nhập/Chọn Thứ, Ca bắt đầu, Ca kết thúc, Phòng học (Building + Room).
  3. Bấm "Xác nhận".
  4. Hệ thống chạy thuật toán quét các Schedule hiện có.
  5. Ghi nhận thành công nếu không có xung đột.
- **Exception Flow:**
  - *Trùng phòng:* Hệ thống cảnh báo "Phòng A01 đã có lớp XYZ học vào ca này".
  - *Trùng GV:* Hệ thống cảnh báo "Giảng viên A đang dạy lớp ABC cùng thời gian".

## 3. UC-A09: Kiểm duyệt & Phê duyệt bảng điểm
- **Actor:** Admin (Phòng Đào tạo)
- **Brief Description:** Admin xem lại điểm do GV nộp và chính thức công bố.
- **Main Flow:**
  1. Admin mở danh sách các bảng điểm "Pending Approval".
  2. Xem chi tiết điểm, bấm "Approve".
  3. Hệ thống đổi trạng thái thành "Locked".
  4. Cập nhật điểm công khai trên hệ thống sinh viên. Trang tự động tính lại GPA.
