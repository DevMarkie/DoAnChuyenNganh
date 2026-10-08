# Specification: Tính năng Xuất Báo Cáo Điểm

## 1. Tổng quan (Overview)
Tính năng cho phép người dùng trích xuất dữ liệu điểm số của sinh viên trong một lớp học phần dưới dạng file Excel. Giúp giảm thiểu thao tác thủ công trong quá trình lưu trữ và thống kê điểm của nhà trường.

## 2. Yêu cầu chức năng (Functional Requirements)
- **Phân quyền truy cập:** Tính năng chỉ hiển thị và cho phép thao tác đối với người dùng có vai trò là **Admin (Phòng Đào Tạo)** và **Giảng viên (Lecturer)** (Giảng viên chỉ xuất được điểm của lớp mình phụ trách).
- **Định dạng xuất:** File tải về phải có định dạng Excel (`.xlsx`).
- **Nội dung file báo cáo:** Bảng dữ liệu bắt buộc phải có các cột sau:
  - Mã Số Sinh Viên (MSSV)
  - Họ và Tên
  - Điểm chuyên cần
  - Điểm giữa kỳ
  - Điểm cuối kỳ
  - Điểm tổng kết
  - Xếp loại (A, B, C, D, F)

## 3. Yêu cầu phi chức năng (Non-Functional Requirements)
- Quá trình xuất file không được quá 5 giây đối với lớp có tối đa 150 sinh viên.
- Đảm bảo tính bảo mật: Người dùng không có quyền (ví dụ: Sinh viên, hoặc Giảng viên không dạy lớp đó) gọi API xuất điểm sẽ bị chặn (HTTP 403 Forbidden).

## 4. Tiêu chí chấp nhận (Acceptance Criteria)
- [ ] Admin có thể ấn nút "Xuất báo cáo" ở bất kỳ lớp nào và tải thành công file `.xlsx`.
- [ ] Giảng viên có thể ấn nút "Xuất báo cáo" tại màn hình quản lý lớp của mình và tải file thành công.
- [ ] File Excel khi mở lên có cấu trúc bảng rõ ràng, header in đậm và chứa đầy đủ 7 cột dữ liệu như yêu cầu.
- [ ] Các con số (điểm) trong Excel phải ở định dạng Number để tính toán được (nếu cần), không bị ép kiểu thành String.

## 5. Ngoài phạm vi (Out of Scope)
- Tính năng không hỗ trợ xuất định dạng PDF trong phiên bản này.
- Không hỗ trợ gửi tự động báo cáo qua email (chỉ tải trực tiếp qua trình duyệt).
