# USE CASE SPECIFICATION: PHÂN HỆ GIẢNG VIÊN

## 1. UC-L04: Nhập, Chỉnh sửa & Import điểm
- **Actor:** Giảng viên
- **Brief Description:** Giảng viên nhập điểm CC, GK, CK cho sinh viên.
- **Pre-conditions:** Cổng nhập điểm đang mở, lớp học phần đã kết thúc giảng dạy.
- **Trigger:** Chọn "Nhập điểm" trên dòng lớp học phần.
- **Main Flow:**
  1. Giảng viên mở giao diện nhập điểm của lớp.
  2. Hệ thống tải danh sách sinh viên Enrollments.
  3. Giảng viên nhập tay trên Grid hoặc Upload file Excel template.
  4. Hệ thống tự động Trigger công thức tính điểm (Hệ 10, Chữ, Hệ 4).
  5. Giảng viên nhấn "Lưu nháp" (Save Draft).
- **Exception Flow:**
  - File Excel sai định dạng hoặc khác danh sách SV -> Báo lỗi dòng cụ thể.
  - Điểm nhập < 0 hoặc > 10 -> Ràng buộc Validation Frontend & Backend báo đỏ.

## 2. UC-L05: Chốt điểm & Gửi phê duyệt
- **Actor:** Giảng viên
- **Brief Description:** Chốt điểm nháp và nộp lên Phòng Đào tạo.
- **Main Flow:**
  1. Giảng viên nhấn "Gửi phê duyệt".
  2. Hệ thống khóa chức năng chỉnh sửa của Giảng viên.
  3. Trạng thái bảng điểm -> "Pending Approval".
  4. Hệ thống gửi Noti tới Admin.
