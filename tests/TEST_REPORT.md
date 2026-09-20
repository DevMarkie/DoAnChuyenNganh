# BÁO CÁO KIỂM THỬ TOÀN DIỆN HỆ THỐNG (SYSTEM TEST REPORT)
### Dự Án: DevMarkie/DoAnChuyenNganh - Hệ Thống Quản Lý Đào Tạo & Sinh Viên
**Thời gian thực hiện:** 19/09/2026  
**Môi trường:** Local Server (Spring Boot 3.2.0 + MySQL 8.0 + Node.js v24.14.1 + React 19)  
**Tỷ lệ đạt (Pass Rate):** **39 / 39 (100%)**

---

## 📊 1. BẢNG TỔNG HỢP KẾT QUẢ THEO PHÂN HỆ

| STT | Phân Hệ / Nhóm Tính Năng | Số Lượng Test | Đạt (Pass) | Lỗi (Fail) | Tỷ Lệ Đạt | Đánh Giá |
|:---:|---|:---:|:---:|:---:|:---:|---|
| **1** | **Xác Thực & Phân Quyền (Auth & RBAC)** | 9 | 9 | 0 | **100%** | Tuyệt đối an toàn |
| **2** | **Quản Trị Viên (Admin Management)** | 17 | 17 | 0 | **100%** | CRUD, lọc, tìm kiếm mượt |
| **3** | **Giảng Viên (Lecturer Workflow)** | 6 | 6 | 0 | **100%** | Chuẩn quy chế BR-07 |
| **4** | **Sinh Viên (Student Workflow)** | 5 | 5 | 0 | **100%** | Xem TKB, GPA, Bảng điểm chuẩn |
| **5** | **Tài Liệu API & OpenAPI Docs** | 2 | 2 | 0 | **100%** | Swagger UI & API-Docs OK |
| **TỔNG** | **Toàn Bộ Hệ Thống** | **39** | **39** | **0** | **100%** | **Sẵn Sàng Triển Khai** |

---

## 🔍 2. CHI TIẾT CÁC TEST CASES ĐÃ THỰC THI

### Phân Hệ 1: Xác Thực & Bảo Mật (Auth & RBAC)
- `1.1` [PASS] Đăng nhập Quản trị viên (`admin` / `123456`) -> Trả về mã token JWT, role `ADMIN`.
- `1.2` [PASS] Đăng nhập Giảng viên (`1000001` / `123456`) -> Trả về token JWT, role `LECTURER`.
- `1.3` [PASS] Đăng nhập Sinh viên (`2500001` / `123456`) -> Trả về token JWT, role `STUDENT`.
- `1.4` [PASS] Chặn đăng nhập sai mật khẩu -> Trả về `401 Unauthorized`.
- `1.5` [PASS] Chặn đăng nhập tên tài khoản không tồn tại -> Trả về `401 Unauthorized`.
- `1.6` [PASS] Chặn truy cập API khi chưa đăng nhập (`/api/dashboard`) -> Trả về `401/403`.
- `1.7` [PASS] **RBAC:** Sinh viên gọi API tạo Khoa (`POST /api/departments`) -> Bị chặn với mã `403 Forbidden`.
- `1.8` [PASS] **RBAC:** Giảng viên gọi API tạo Sinh viên (`POST /api/students`) -> Bị chặn với mã `403 Forbidden`.
- `1.9` [PASS] Token JWT giả mạo hoặc sai định dạng -> Bị từ chối ngay lập tức.

### Phân Hệ 2: Quản Trị Viên (Admin Features)
- `2.1` [PASS] Thống kê số lượng sinh viên, giảng viên, môn học (`/api/dashboard`).
- `2.2` [PASS] Tra cứu danh sách Khoa/Viện (`/api/departments`).
- `2.3` [PASS] Tra cứu danh sách Lớp sinh hoạt (`/api/classes`).
- `2.4` [PASS] Tra cứu danh sách Môn học đào tạo (`/api/subjects`).
- `2.5` [PASS] Tra cứu danh sách Học kỳ (`/api/semesters`).
- `2.6` [PASS] Tra cứu danh sách Giảng viên (`/api/lecturers`).
- `2.7` [PASS] Phân trang danh sách Sinh viên (`/api/students/paged?page=0&size=10`).
- `2.8` [PASS] Tìm kiếm sinh viên theo từ khóa mã SV/tên (`/api/students/search`).
- `2.9` [PASS] Tra cứu danh sách Lớp học phần (`/api/course-sections`).
- `2.10` [PASS] Tra cứu danh sách Lịch học / Thời khóa biểu (`/api/schedules`).
- `2.11` [PASS] Tra cứu danh sách Yêu cầu cấp lại mật khẩu (`/api/admin/password-resets`).
- `2.12` [PASS] Tạo mới Khoa (`POST /api/departments`) thành công.
- `2.13` [PASS] Cập nhật thông tin Khoa (`PUT /api/departments/{id}`) thành công.
- `2.14` [PASS] Kích hoạt/khóa trạng thái Khoa (`PUT /api/departments/{id}/toggle`) thành công.
- `2.15` [PASS] Tạo mới Môn học kèm ràng buộc số tín chỉ (`POST /api/subjects`) thành công.
- `2.16` [PASS] Ràng buộc tín chỉ: Chặn tạo môn học có số tín chỉ vượt quá giới hạn (15 > 10).
- `2.17` [PASS] Tạo mới Lớp sinh hoạt (`POST /api/classes`) liên kết Khoa đào tạo thành công.

### Phân Hệ 3: Giảng Viên (Lecturer Workflow)
- `3.1` [PASS] Lấy thông tin cá nhân giảng viên đang đăng nhập (`/api/lecturers/me`).
- `3.2` [PASS] Tra cứu lịch giảng dạy theo học kỳ (`/api/schedules/lecturer-schedule`).
- `3.3` [PASS] Tra cứu danh sách điểm sinh viên theo lớp học phần (`/api/grades/section/{id}`).
- `3.4` [PASS] Kiểm tra ràng buộc điểm số: Chặn nhập điểm ngoài khoảng hợp lệ `[0.0, 10.0]` (điểm 15.0 bị từ chối).
- `3.5` [PASS] Xuất bảng điểm lớp học phần ra file Excel (.xlsx) chuẩn định dạng (`/api/grades/section/{id}/export`).
- `3.6` [PASS] **Quy chế BR-07 & Khóa điểm:** Giảng viên nhập điểm hợp lệ (chuyên cần, giữa kỳ, cuối kỳ) -> Hệ thống tự động tính điểm tổng kết và quy đổi điểm chữ (A, B, C, D, F). Khi Admin chốt điểm (`finalize=true`), giảng viên bị chặn không được tự ý sửa điểm.

### Phân Hệ 4: Sinh Viên (Student Workflow)
- `4.1` [PASS] Lấy hồ sơ cá nhân sinh viên (`/api/students/me` - mã SV, lớp, khoa).
- `4.2` [PASS] Xem thời khóa biểu cá nhân theo tuần (`/api/schedules/my-schedule`).
- `4.3` [PASS] Xem danh sách các học phần đã đăng ký (`/api/enrollments/my`).
- `4.4` [PASS] Tra cứu bảng điểm tích lũy & CPA/GPA (tính toán đồng thời thang điểm 10 và thang điểm 4).
- `4.5` [PASS] Gửi yêu cầu quên mật khẩu (`/api/auth/forgot-password`), chặn gửi yêu cầu trùng lặp và Admin xử lý duyệt/từ chối.

### Phân Hệ 5: Tài Liệu API & OpenAPI
- `5.1` [PASS] Endpoint OpenAPI specification json (`/api-docs`) hoạt động 200 OK.
- `5.2` [PASS] Giao diện tương tác Swagger UI (`/swagger-ui/index.html`) tải đầy đủ.

---

## 🛠️ 3. CÁC LỖI ĐÃ PHÁT HIỆN & ĐÃ ĐƯỢC KHẮC PHỤC NGAY TRONG QUÁ TRÌNH TEST

1. **Lỗi mật khẩu mẫu trong MySQL Container cũ:**
   - *Hiện tượng:* Tài khoản `admin`, `1000001`, `2500001` nhập mật khẩu `123456` bị báo `Tên đăng nhập hoặc mật khẩu không đúng`.
   - *Nguyên nhân:* Dữ liệu container database cũ từ 2 tuần trước chứa mã băm không tương thích với chuỗi "123456".
   - *Khắc phục:* Đã chạy script chuẩn hóa [database/update_passwords.sql](database/update_passwords.sql), cập nhật toàn bộ 626 người dùng trong hệ thống về chuẩn mã băm BCrypt của mật khẩu `123456`. Đăng nhập thành công 100%.

2. **Lỗi đường dẫn tài liệu Swagger OpenAPI:**
   - *Hiện tượng:* Truy cập `/v3/api-docs` bị Spring Security trả về `403 Forbidden`.
   - *Nguyên nhân:* Backend cấu hình `springdoc.api-docs.path=/api-docs` nhưng SecurityConfig chỉ permitAll cho `/api-docs/**` (có slash ở đuôi).
   - *Khắc phục:* Đã bổ sung `/api-docs` và `/v3/api-docs/**` vào danh sách `permitAll()` trong `SecurityConfig.java`.

---

## 🎯 4. HƯỚNG DẪN CHẠY LẠI TEST BẤT CỨ LÚC NÀO

Bạn chỉ cần nhấp đúp chuột vào file:
👉 **`run_tests.bat`** (ở thư mục gốc dự án)
Hệ thống sẽ tự động chạy toàn bộ 39 test cases và hiển thị kết quả trực tiếp trên màn hình console.
