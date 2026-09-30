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

## 3. UC-A09: Sửa điểm & Mở khóa bảng điểm
- **Actor:** Admin (Phòng Đào tạo)
- **Brief Description:** Admin sửa điểm không giới hạn thời gian và mở khóa bảng điểm đã hết hạn chỉnh sửa của giảng viên (ví dụ khi có phúc khảo hoặc sai sót sau 7 ngày).
- **Main Flow:**
  1. Admin mở bảng điểm của lớp học phần cần xử lý.
  2. Admin sửa điểm thành phần nếu cần (không bị giới hạn cửa sổ 7 ngày như giảng viên).
  3. Với bảng điểm đã khóa cứng, Admin gửi thao tác mở khóa (`finalize = false`) → xóa mốc `finalizedAt`, cho phép nhập/sửa lại.
  4. Hệ thống ghi log audit cho mọi thao tác khóa/mở khóa.
- **Ghi chú:** Điểm được công bố cho sinh viên **ngay khi giảng viên chốt** (UC-L05); không có bước Admin phê duyệt bắt buộc.
