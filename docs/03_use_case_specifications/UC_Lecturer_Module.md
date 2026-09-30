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

## 2. UC-L05: Chốt & Công bố điểm
- **Actor:** Giảng viên
- **Brief Description:** Chốt bảng điểm để công bố cho sinh viên; giảng viên còn 7 ngày để chỉnh sửa trước khi hệ thống khóa cứng.
- **Pre-conditions:** Toàn bộ sinh viên trong lớp đã có điểm tổng kết (nhập đủ 100%).
- **Main Flow:**
  1. Giảng viên nhấn "Chốt & Công bố điểm".
  2. Hệ thống kiểm tra mọi sinh viên đã có điểm tổng kết; nếu còn thiếu → chặn và liệt kê SV chưa đủ điểm.
  3. Hệ thống đặt `isFinalized = true`, ghi mốc `finalizedAt = thời điểm hiện tại` và công bố điểm cho sinh viên xem ngay.
  4. Trong **7 ngày** kể từ `finalizedAt`, giảng viên vẫn sửa được điểm (nút "Lưu chỉnh sửa"); mốc 7 ngày **không** được gia hạn khi sửa.
  5. Quá 7 ngày, hệ thống **khóa cứng** chức năng sửa của giảng viên — chỉ Quản trị viên mới mở lại được.
- **Exception Flow:**
  - Còn sinh viên chưa nhập đủ điểm → không cho chốt, báo danh sách SV còn thiếu.
