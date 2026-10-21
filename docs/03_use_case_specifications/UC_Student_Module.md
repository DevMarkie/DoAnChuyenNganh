# USE CASE SPECIFICATION: PHÂN HỆ SINH VIÊN

## 1. UC-S02: Tìm kiếm & Đăng ký Lớp học phần
- **Actor:** Sinh viên
- **Brief Description:** Sinh viên đăng ký lớp học phần, hệ thống kiểm tra tiên quyết, trùng lịch, sĩ số.
- **Pre-conditions:** Đăng nhập thành công, cổng đăng ký mở.
- **Trigger:** Nhấn nút "Đăng ký" tại một lớp học phần.
- **Main Flow:**
  1. Sinh viên vào module "Đăng ký học phần".
  2. Hệ thống load các môn học mở trong kỳ thỏa mãn tiên quyết.
  3. Sinh viên chọn lớp và nhấn "Đăng ký".
  4. Hệ thống chạy Validations (Tiên quyết, Trùng lịch, Sĩ số, Tín chỉ).
  5. Hệ thống lưu Enrollment, hiển thị "Thành công".
- **Exception Flows:**
  - Nếu vi phạm bất kỳ Business Rule nào (Trùng lịch, đầy lớp), hệ thống block thao tác và ném lỗi tương ứng ra UI.

## 2. UC-S03: Hủy đăng ký Lớp học phần (Trong hạn)
- **Actor:** Sinh viên
- **Brief Description:** Sinh viên rút khỏi lớp học phần đã đăng ký thành công.
- **Main Flow:**
  1. Sinh viên nhấn "Hủy" trên danh sách môn đã đăng ký.
  2. Hệ thống xác nhận và kiểm tra điều kiện tín chỉ tối thiểu.
  3. Hệ thống xóa bản ghi Enrollment và cập nhật sĩ số lớp.

## 3. UC-S04: Xem Thời khóa biểu cá nhân
- **Actor:** Sinh viên
- **Brief Description:** Hiển thị TKB cá nhân dạng Calendar (Tuần).
- **Main Flow:** Truy cập module -> Hệ thống lấy dữ liệu tuần hiện tại -> Render các block thời gian (Tên môn, Phòng, GV).

## 4. UC-S05: Tra cứu Kết quả học tập & Điểm trung bình (GPA)
- **Actor:** Sinh viên
- **Brief Description:** Xem bảng điểm và GPA.
- **Main Flow:** Truy cập module -> Hệ thống tính tổng tín chỉ, GPA hệ 10 và 4 -> Render danh sách điểm chi tiết từng học kỳ.
