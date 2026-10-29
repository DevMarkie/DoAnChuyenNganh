# ĐẶC TẢ CHI TIẾT TEST CASES KIỂM THỬ HỆ THỐNG (TEST CASE SPECIFICATION)
## HỆ THỐNG QUẢN LÝ ĐÀO TẠO & SINH VIÊN (SMS / DO AN CHUYEN NGANH)
**Bộ tiêu chuẩn kiểm thử chấp nhận & xuất xưởng (Shipping & Production Readiness Release Gate)**

---

## 📑 MỤC LỤC & TỔNG QUAN BỘ TEST CASES

| Nhóm | Phân Hệ / Hạng Mục Kiểm Thử | Mã Suite | Số Lượng Test Cases | Tỷ lệ P0 (Blocker) |
|:---:|---|:---:|:---:|:---:|
| **1** | Xác thực, Quản lý Phiên & An toàn Bảo mật | `SEC` | 12 | 8 / 12 |
| **2** | Phân quyền RBAC & Chống Leo thang Đặc quyền | `RBAC` | 10 | 8 / 10 |
| **3** | Quản lý Đào tạo, Môn học & Mở Lớp Học phần | `ADM` | 10 | 6 / 10 |
| **4** | Xếp Thời khóa biểu & Chống Xung đột Lịch/Phòng | `SCH` | 6 | 5 / 6 |
| **5** | Đăng ký Tín chỉ, Ràng buộc Nghiệp vụ & Chịu tải | `ENR` | 12 | 9 / 12 |
| **6** | Vào Sổ Điểm, Quy đổi Điểm & Cửa sổ Ân hạn 7 ngày | `GRD` | 12 | 8 / 12 |
| **7** | Bảng điểm, Tính GPA/CPA & Cảnh báo Học vụ | `TRA` | 6 | 4 / 6 |
| **8** | Vòng đời Yêu cầu & Phê duyệt Cấp lại Mật khẩu | `RST` | 6 | 4 / 6 |
| **9** | Kiểm thử Xuất xưởng & Tiêu chí Release Gate | `SHIP` | 6 | 6 / 6 |
| **10** | Kiểm thử Luồng Trạng thái & Access Control | `STATE` | 6 | 6 / 6 |
| **11** | Quản lý Thu - Chi Học phí & Biên lai Tài chính | `TUI` | 10 | 8 / 10 |
| **12** | Điểm danh Chuyên cần & Điều kiện Cấm thi | `ATT` | 8 | 6 / 8 |
| **13** | Vòng đời Khiếu nại & Phúc khảo Điểm | `APL` | 8 | 6 / 8 |
| **14** | Lớp Học phần Đặc biệt & Điều phối Đào tạo | `CLS` | 6 | 4 / 6 |
| **TỔNG**| **Toàn bộ 14 Khối Kiểm thử Hệ thống SMS** | | **118 Test Cases** | **88 P0 / 30 P1** |

---

## 📌 QUY ƯỚC ĐỘ ƯU TIÊN (PRIORITY)
- **P0 (Blocker / Release-Stopper):** Chức năng cốt lõi hoặc lỗ hổng bảo mật nghiêm trọng. Nếu fail, **TUYỆT ĐỐI KHÔNG ĐƯỢC SHIP**.
- **P1 (High):** Nghiệp vụ quan trọng ảnh hưởng đến tính toàn vẹn dữ liệu và trải nghiệm người dùng chính yếu.
- **P2 (Medium):** Các trường hợp biên thứ yếu hoặc định dạng hiển thị.

---

## 🛡️ SUITE 1: XÁC THỰC, PHIÊN LÀM VIỆC & AN TOÀN BẢO MẬT (SEC)

### TC-SEC-01: Đăng nhập thành công với tài khoản Admin hợp lệ
- **Mục tiêu:** Xác minh Quản trị viên đăng nhập thành công và nhận JWT Token mang vai trò `ROLE_ADMIN`.
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Functional / Smoke
- **Tiền điều kiện:** Tài khoản `admin` tồn tại, trạng thái Active.
- **Các bước thực hiện:**
  1. Gửi request `POST /api/auth/login`.
  2. Body: `{"username": "admin", "password": "password"}` (hoặc mật khẩu mặc định cấu hình).
- **Dữ liệu kiểm thử:** `admin / password`
- **Kết quả mong đợi:**
  - HTTP `200 OK`.
  - Response chứa: `token` (chuỗi JWT hợp lệ), `role: "ADMIN"`, thông tin tài khoản.
  - Token giải mã có header algorithm `HS512` và claim `sub: "admin"`.

---

### TC-SEC-02: Đăng nhập thành công với tài khoản Giảng viên hợp lệ
- **Mục tiêu:** Xác minh Giảng viên đăng nhập thành công qua mã số giảng viên.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Functional / Smoke
- **Tiền điều kiện:** Giảng viên mã `1000001` tồn tại trong bảng `lecturers` và `users`.
- **Các bước thực hiện:**
  1. Gửi `POST /api/auth/login`.
  2. Body: `{"username": "1000001", "password": "password"}`.
- **Kết quả mong đợi:**
  - HTTP `200 OK`.
  - Response có `role: "LECTURER"`, `token` hợp lệ.

---

### TC-SEC-03: Đăng nhập thành công với tài khoản Sinh viên hợp lệ
- **Mục tiêu:** Xác minh Sinh viên đăng nhập thành công qua mã số sinh viên.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Functional / Smoke
- **Tiền điều kiện:** Sinh viên mã `2500001` tồn tại trong bảng `students` và `users`.
- **Các bước thực hiện:**
  1. Gửi `POST /api/auth/login`.
  2. Body: `{"username": "2500001", "password": "password"}`.
- **Kết quả mong đợi:**
  - HTTP `200 OK`.
  - Response có `role: "STUDENT"`, `token` hợp lệ.

---

### TC-SEC-04: Đăng nhập thất bại do sai mật khẩu
- **Mục tiêu:** Xác minh hệ thống từ chối đăng nhập khi cung cấp sai mật khẩu.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Security / Negative
- **Các bước thực hiện:**
  1. Gửi `POST /api/auth/login`.
  2. Body: `{"username": "admin", "password": "WrongPassword@123"}`.
- **Kết quả mong đợi:**
  - HTTP `401 Unauthorized`.
  - Không sinh JWT token; thông báo lỗi an toàn "Sai tên đăng nhập hoặc mật khẩu".

---

### TC-SEC-05: Khóa tài khoản tạm thời khi nhập sai mật khẩu 5 lần liên tiếp
- **Mục tiêu:** Xác minh cơ chế chống tấn công Brute-force mật khẩu (`LoginAttemptService`).
- **Độ ưu tiên:** P1
- **Loại kiểm thử:** Security
- **Quy tắc nghiệp vụ:** BR-Security: Sai 5 lần liên tiếp -> khóa 15 phút.
- **Các bước thực hiện:**
  1. Gửi liên tiếp 5 request `POST /api/auth/login` với mật khẩu sai cho cùng 1 user `2500002`.
  2. Gửi request lần thứ 6 với mật khẩu ĐÚNG.
- **Kết quả mong đợi:**
  - Ở lần thứ 5 và thứ 6, hệ thống phản hồi `401 Unauthorized` hoặc `423 Locked`.
  - Thông báo: "Tài khoản tạm thời bị khóa do nhập sai mật khẩu nhiều lần. Vui lòng thử lại sau 15 phút".

---

### TC-SEC-06: Tấn công SQL Injection vào trường Tên đăng nhập
- **Mục tiêu:** Xác minh hệ thống ngăn chặn hoàn toàn SQL Injection qua Prepared Statements / Spring Data JPA.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Security Penetration
- **Các bước thực hiện:**
  1. Gửi `POST /api/auth/login` với payload:
     `{"username": "' OR '1'='1", "password": "any"}`
  2. Gửi tiếp payload: `{"username": "admin'--", "password": "any"}`.
- **Kết quả mong đợi:**
  - HTTP `401 Unauthorized`.
  - Câu lệnh SQL không bị inject, không bypass được xác thực, không xuất hiện SQL syntax error trong response.

---

### TC-SEC-07: Tấn công Cross-Site Scripting (XSS) qua dữ liệu đầu vào
- **Mục tiêu:** Xác minh payload chứa thẻ HTML/JavaScript không được thực thi.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Security Penetration
- **Các bước thực hiện:**
  1. Gửi payload XSS: `<script>alert('xss')</script>` hoặc `<img src=x onerror=alert(1)>` vào trường `username` lúc đăng nhập hoặc trường `fullName` khi Admin sửa hồ sơ.
- **Kết quả mong đợi:**
  - Hệ thống từ chối hoặc sanitize an toàn, frontend hiển thị text thuần túy dưới dạng escaped string, không có alert pop-up.

---

### TC-SEC-08: Kiểm tra Token bị làm giả chữ ký (Tampered JWT Signature)
- **Mục tiêu:** Xác minh Filter từ chối các JWT token bị sửa đổi payload mà không có HMAC Secret Key.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Security Penetration
- **Các bước thực hiện:**
  1. Lấy token hợp lệ của Sinh viên.
  2. Sửa payload từ `"role": "STUDENT"` thành `"role": "ADMIN"`.
  3. Giữ nguyên phần signature cũ và gửi request kèm header `Authorization: Bearer <tampered_token>` tới `/api/departments`.
- **Kết quả mong đợi:**
  - HTTP `401 Unauthorized` hoặc `403 Forbidden`.
  - JwtException bắt được lỗi `SignatureException`, request bị chặn tuyệt đối.

---

### TC-SEC-09: Kiểm tra Token hết hạn (Expired JWT)
- **Mục tiêu:** Xác minh JWT đã quá hạn (TTL) không thể sử dụng để gọi API.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Security
- **Các bước thực hiện:**
  1. Sử dụng JWT đã hết hạn quá thời gian `expiration` (đã bù trừ 60s clock-skew).
  2. Gửi request `GET /api/transcript/me`.
- **Kết quả mong đợi:**
  - HTTP `401 Unauthorized`.
  - Hệ thống báo lỗi token hết hạn và client tự động điều hướng về màn hình đăng nhập.

---

### TC-SEC-10: Kiểm tra Token dị dạng / Chuỗi rác (Malformed JWT)
- **Mục tiêu:** Đảm bảo hệ thống không bị crash hoặc ném lỗi 500 Unhandled Exception khi nhận token rác.
- **Độ ưu tiên:** P1
- **Loại kiểm thử:** Security Robustness
- **Các bước thực hiện:**
  1. Gửi request kèm header `Authorization: Bearer invalid.garbage.token123`.
- **Kết quả mong đợi:**
  - HTTP `401 Unauthorized`, response format JSON chuẩn, không crash ứng dụng.

---

### TC-SEC-11: Tấn công tràn bộ nhớ đệm (Buffer Overflow / DoS Payload)
- **Mục tiêu:** Xác minh hệ thống xử lý an toàn payload kích thước đột biến cực lớn.
- **Độ ưu tiên:** P1
- **Loại kiểm thử:** Stress / Security
- **Các bước thực hiện:**
  1. Gửi request `POST /api/auth/login` với chuỗi `username` dài 5,000 ký tự và `password` dài 5,000 ký tự.
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request` hoặc `401 Unauthorized`.
  - Thời gian xử lý < 500ms, không gây tràn bộ nhớ JVM (OutOfMemoryError), không phát sinh mã `500`.

---

### TC-SEC-12: Kiểm tra cấu hình bảo vệ CORS & HTTP Headers
- **Mục tiêu:** Xác minh hệ thống chỉ cho phép nguồn gốc đáng tin cậy truy cập API.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Infrastructure / Security
- **Các bước thực hiện:**
  1. Gửi OPTIONS preflight request với header `Origin: http://malicious-site.com`.
  2. Gửi OPTIONS preflight request với header `Origin: http://localhost:5173` (hoặc cấu hình Vite dev).
- **Kết quả mong đợi:**
  - Domain lạ: không trả về `Access-Control-Allow-Origin: *`.
  - Domain whitelist: trả về `Access-Control-Allow-Origin` tương ứng và `Access-Control-Allow-Credentials: true`.

---

## 🔒 SUITE 2: PHÂN QUYỀN RBAC & CHỐNG LEO THANG ĐẶC QUYỀN (RBAC)

### TC-RBAC-01: Sinh viên cố tình gọi API Tạo Khoa (Admin Only)
- **Mục tiêu:** Xác minh sinh viên không thể thực hiện các thao tác quản trị đào tạo.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Authorization / RBAC
- **Các bước thực hiện:**
  1. Đăng nhập tài khoản Sinh viên `2500001` lấy `studentToken`.
  2. Gửi `POST /api/departments` kèm `studentToken` và body `{"departmentCode": "TEST", "name": "Test Dept"}`.
- **Kết quả mong đợi:**
  - HTTP `403 Forbidden`.
  - Bảng `departments` không phát sinh bản ghi mới.

---

### TC-RBAC-02: Sinh viên gọi API Xem danh sách yêu cầu cấp lại mật khẩu
- **Mục tiêu:** Đảm bảo dữ liệu nhạy cảm của Admin không bị lộ cho Sinh viên.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Authorization / RBAC
- **Các bước thực hiện:**
  1. Dùng `studentToken` gửi `GET /api/admin/password-resets`.
- **Kết quả mong đợi:**
  - HTTP `403 Forbidden`.

---

### TC-RBAC-03: Sinh viên gọi API Tạo Lớp Học Phần (`/api/course-sections`)
- **Mục tiêu:** Chặn sinh viên can thiệp vào mở lớp đào tạo.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Authorization
- **Các bước thực hiện:**
  1. Dùng `studentToken` gửi `POST /api/course-sections` với payload hợp lệ của lớp.
- **Kết quả mong đợi:**
  - HTTP `403 Forbidden`.

---

### TC-RBAC-04: Giảng viên gọi API Tạo Sinh viên mới (`POST /api/students`)
- **Mục tiêu:** Giảng viên chỉ có quyền quản lý giảng dạy và điểm, không có quyền quản lý nhân sự sinh viên.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Authorization / RBAC
- **Các bước thực hiện:**
  1. Đăng nhập Giảng viên `1000001` lấy `lecturerToken`.
  2. Gửi `POST /api/students` với dữ liệu sinh viên mới.
- **Kết quả mong đợi:**
  - HTTP `403 Forbidden`.

---

### TC-RBAC-05: Giảng viên gọi API Cấu hình Lịch học (`POST /api/schedules`)
- **Mục tiêu:** Giảng viên không có quyền trực tiếp thêm/sửa thời khóa biểu phòng đào tạo.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Authorization / RBAC
- **Các bước thực hiện:**
  1. Dùng `lecturerToken` gửi `POST /api/schedules`.
- **Kết quả mong đợi:**
  - HTTP `403 Forbidden`.

---

### TC-RBAC-06: Giảng viên sửa điểm lớp học phần của Giảng viên khác (IDOR / Cross-Lecturer)
- **Mục tiêu:** Xác minh quy tắc nghiệp vụ BR-07: Giảng viên chỉ được sửa điểm cho lớp do chính mình phụ trách.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Security / Business Rule BR-07
- **Các bước thực hiện:**
  1. Giảng viên A (`1000001`) phụ trách Lớp HP 1.
  2. Giảng viên B (`1000002`) phụ trách Lớp HP 2.
  3. Giảng viên B dùng token của mình gửi request `PUT /api/grades` hoặc `PUT /api/grades/batch` cập nhật điểm cho sinh viên thuộc Lớp HP 1.
- **Kết quả mong đợi:**
  - HTTP `403 Forbidden`.
  - Message: "Bạn không có quyền nhập điểm cho học phần này". Điểm của Lớp 1 không thay đổi.

---

### TC-RBAC-07: Sinh viên gọi API Nhập/Sửa điểm
- **Mục tiêu:** Ngăn chặn sinh viên tự sửa đổi điểm số của mình hoặc người khác.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Authorization / RBAC
- **Các bước thực hiện:**
  1. Dùng `studentToken` gửi `PUT /api/grades` với payload cập nhật điểm 10.0 cho chính mình.
- **Kết quả mong đợi:**
  - HTTP `403 Forbidden`.

---

### TC-RBAC-08: Sinh viên A hủy đăng ký học phần của Sinh viên B (Chống IDOR)
- **Mục tiêu:** Đảm bảo chỉ chủ sở hữu bản ghi enrollment mới có quyền hủy học phần của mình.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Security IDOR Prevention
- **Các bước thực hiện:**
  1. Sinh viên A (`2500001`) đăng ký Lớp HP 1, nhận `enrollmentId = 101`.
  2. Sinh viên B (`2500002`) đăng nhập lấy token.
  3. Sinh viên B gửi `DELETE /api/enrollments/101`.
- **Kết quả mong đợi:**
  - HTTP `403 Forbidden` hoặc `400 Bad Request`.
  - Bản ghi enrollment 101 của Sinh viên A vẫn giữ nguyên trạng thái `ENROLLED`.

---

### TC-RBAC-09: Khách vãng lai (Anonymous) truy cập tài nguyên được bảo vệ
- **Mục tiêu:** Xác minh không có API nghiệp vụ nội bộ nào bị hở mở công khai.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Security Authentication
- **Các bước thực hiện:**
  1. Gửi request `GET /api/dashboard`, `GET /api/transcript/me` mà KHÔNG gửi kèm header `Authorization`.
- **Kết quả mong đợi:**
  - HTTP `401 Unauthorized` (hoặc `403 Forbidden`).

---

### TC-RBAC-10: Sinh viên tra cứu bảng điểm của Sinh viên khác qua ID
- **Mục tiêu:** Sinh viên chỉ được xem bảng điểm của chính mình qua `/api/transcript/me`, không thể xem điểm người khác qua endpoint Admin `/api/transcript/student/{id}`.
- **Độ ưu tiên:** P1
- **Loại kiểm thử:** Authorization / Privacy
- **Các bước thực hiện:**
  1. Dùng `studentToken` của SV A gửi `GET /api/transcript/student/{studentB_Id}`.
- **Kết quả mong đợi:**
  - HTTP `403 Forbidden`.

---

## 🏛️ SUITE 3: QUẢN LÝ ĐÀO TẠO & CẤU HÌNH LỚP HỌC PHẦN (ADM)

### TC-ADM-01: Tạo môn học mới hợp lệ
- **Mục tiêu:** Admin tạo môn học mới với đầy đủ mã, tên, số tín chỉ và tỷ lệ đánh giá.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Functional
- **Các bước thực hiện:**
  1. Dùng `adminToken` gửi `POST /api/subjects`.
  2. Body:
     ```json
     {
       "subjectCode": "INT3101",
       "name": "Lập trình nâng cao",
       "credits": 3,
       "departmentId": 1
     }
     ```
- **Kết quả mong đợi:**
  - HTTP `201 Created` hoặc `200 OK`.
  - Bản ghi môn học được lưu thành công trong CSDL.

---

### TC-ADM-02: Tạo môn học trùng mã môn đã tồn tại
- **Mục tiêu:** Xác minh tính duy nhất (Unique Constraint) của mã môn học.
- **Độ ưu tiên:** P1
- **Loại kiểm thử:** Validation / Boundary
- **Các bước thực hiện:**
  1. Gửi `POST /api/subjects` với mã `subjectCode` đã tồn tại trong CSDL.
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request` hoặc `409 Conflict`.
  - Thông báo: "Mã môn học đã tồn tại". Không sinh bản ghi trùng lặp.

---

### TC-ADM-03: Kiểm tra giới hạn số tín chỉ môn học (Biên 1 - 10 tín chỉ)
- **Mục tiêu:** Xác minh validation ràng buộc số tín chỉ hợp lệ (BR-07: Credits ∈ [1, 10]).
- **Độ ưu tiên:** P1
- **Loại kiểm thử:** Boundary Testing
- **Các bước thực hiện:**
  1. Gửi tạo môn với `credits = 0`.
  2. Gửi tạo môn với `credits = -2`.
  3. Gửi tạo môn với `credits = 12`.
- **Kết quả mong đợi:**
  - Cả 3 request đều bị từ chối với HTTP `400 Bad Request`.
  - Field error chỉ ra số tín chỉ phải lớn hơn 0 và nhỏ hơn hoặc bằng 10.

---

### TC-ADM-04: Mở Lớp học phần mới với sĩ số tối đa hợp lệ
- **Mục tiêu:** Admin tạo lớp học phần cho một môn trong học kỳ hiện hành.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Functional
- **Các bước thực hiện:**
  1. Dùng `adminToken` gửi `POST /api/course-sections`.
  2. Body:
     ```json
     {
       "sectionCode": "INT3101.01",
       "subjectId": 1,
       "semesterId": 1,
       "lecturerId": 1,
       "maxStudents": 40,
       "status": "OPEN"
     }
     ```
- **Kết quả mong đợi:**
  - HTTP `200 OK` / `201 Created`.
  - Lớp học phần được tạo với `enrolledCount = 0`, trạng thái `OPEN`.

---

### TC-ADM-05: Mở Lớp học phần với sĩ số tối đa bằng 0 hoặc âm
- **Mục tiêu:** Ngăn chặn tạo lớp học phần không thể đăng ký.
- **Độ ưu tiên:** P1
- **Loại kiểm thử:** Validation / Boundary
- **Các bước thực hiện:**
  1. Gửi `POST /api/course-sections` với `maxStudents = 0`.
  2. Gửi `POST /api/course-sections` với `maxStudents = -10`.
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request`, message validation lỗi sĩ số phải > 0.

---

### TC-ADM-06: Đóng / Mở lại cổng đăng ký của Lớp học phần
- **Mục tiêu:** Xác minh Admin có thể chuyển trạng thái lớp học phần giữa `OPEN` và `CLOSED`.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Functional
- **Các bước thực hiện:**
  1. Gửi `PUT /api/course-sections/{id}` đổi `status` thành `CLOSED`.
  2. Kiểm tra sinh viên thấy trạng thái đóng và không thể đăng ký.
  3. Gửi `PUT` đổi lại thành `OPEN`.
- **Kết quả mong đợi:**
  - Trạng thái cập nhật chính xác, hiển thị đồng bộ lên UI Sinh viên.

---

### TC-ADM-07: Admin xếp thủ công 1 Sinh viên vào Lớp học phần
- **Mục tiêu:** Kiểm tra chức năng Admin Override xếp sinh viên (`/api/admin/enrollments/assign`).
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Functional
- **Các bước thực hiện:**
  1. Admin gửi `POST /api/admin/enrollments/assign` với `studentId` và `courseSectionId`.
- **Kết quả mong đợi:**
  - HTTP `200 OK`.
  - Sinh viên được xếp vào lớp, `enrolledCount` tăng thêm 1.

---

### TC-ADM-10: Thiết lập Học kỳ hiện hành (Set Current Semester)
- **Mục tiêu:** Xác minh chỉ có DUY NHẤT một học kỳ được kích hoạt làm học kỳ hiện hành.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Business Rule
- **Các bước thực hiện:**
  1. Gửi `POST /api/semesters/{id}/set-current`.
  2. Kiểm tra các học kỳ khác trong database.
- **Kết quả mong đợi:**
  - Học kỳ được chọn có `isCurrent = true`.
  - Toàn bộ các học kỳ còn lại tự động chuyển `isCurrent = false`.

---

## 📅 SUITE 4: XẾP THỜI KHÓA BIỂU & CHỐNG XUNG ĐỘT (SCH)

### TC-SCH-01: Gán thời khóa biểu cho lớp học phần hợp lệ
- **Mục tiêu:** Gán thứ trong tuần, tiết học và phòng học cho lớp học phần.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Functional
- **Các bước thực hiện:**
  1. Gửi `POST /api/schedules` với:
     ```json
     {
       "sectionId": 1,
       "dayOfWeek": 2,
       "startPeriod": 1,
       "endPeriod": 3,
       "room": "A2-301"
     }
     ```
- **Kết quả mong đợi:**
  - HTTP `200 OK` / `201 Created`. Lịch học được lưu vào CSDL.

---

### TC-SCH-02: Xếp trùng phòng học cùng thời gian (Room Conflict)
- **Mục tiêu:** Xác minh hệ thống phát hiện và chặn xung đột phòng học.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Business Rule Validation
- **Các bước thực hiện:**
  1. Lớp HP 1 đã có lịch: Thứ 2, Tiết 1-3 tại phòng `A2-301`.
  2. Tạo lịch cho Lớp HP 2: Thứ 2, Tiết 2-4 tại phòng `A2-301` (giao nhau tiết 2-3).
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request` hoặc `409 Conflict`.
  - Thông báo: "Phòng học A2-301 đã được sử dụng trong khoảng thời gian này".

---

### TC-SCH-03: Xếp cùng phòng nhưng khác tiết học (Không xung đột)
- **Mục tiêu:** Cho phép sử dụng cùng phòng học vào các ca/tiết khác nhau trong cùng ngày.
- **Độ ưu tiên:** P1
- **Loại kiểm thử:** Functional / Boundary
- **Các bước thực hiện:**
  1. Lớp HP 1: Thứ 2, Tiết 1-3, Phòng `A2-301`.
  2. Lớp HP 2: Thứ 2, Tiết 4-6, Phòng `A2-301`.
- **Kết quả mong đợi:**
  - Cả 2 lịch đều tạo thành công. HTTP `200 OK`.

---

### TC-SCH-04: Xếp trùng lịch Giảng viên (Lecturer Clash)
- **Mục tiêu:** Ngăn chặn một giảng viên bị phân công dạy 2 lớp khác nhau trong cùng một thời điểm.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Business Rule Validation
- **Các bước thực hiện:**
  1. Giảng viên A được phân công dạy Lớp HP 1: Thứ 4, Tiết 7-9.
  2. Phân công Giảng viên A dạy Lớp HP 2: Thứ 4, Tiết 8-10.
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request`.
  - Thông báo: "Giảng viên đã có lịch giảng dạy trong thời gian này".

---

### TC-SCH-05: Kiểm tra tính hợp lệ của Tiết bắt đầu và Tiết kết thúc
- **Mục tiêu:** Ràng buộc `startPeriod <= endPeriod` và trong khoảng tiết học quy định (1 - 12).
- **Độ ưu tiên:** P1
- **Loại kiểm thử:** Boundary Testing
- **Các bước thực hiện:**
  1. Gửi request xếp lịch với `startPeriod = 5`, `endPeriod = 3`.
  2. Gửi request xếp lịch với `startPeriod = 0` hoặc `endPeriod = 15`.
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request`, validation lỗi tiết học không hợp lệ.

---

### TC-SCH-06: Xem Thời khóa biểu tuần của Giảng viên và Sinh viên
- **Mục tiêu:** Đảm bảo API trả về ma trận TKB tuần đầy đủ các thông tin: Tên môn, Lớp, Thứ, Tiết, Phòng học.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Functional / Integration
- **Các bước thực hiện:**
  1. Sinh viên gọi `GET /api/schedules/my-schedule`.
  2. Giảng viên gọi `GET /api/schedules/lecturer-schedule`.
- **Kết quả mong đợi:**
  - Trả về danh sách thời khóa biểu dạng JSON tương thích ma trận tuần trên giao diện React.

---

## 📝 SUITE 5: CỔNG ĐĂNG KÝ TÍN CHỈ, RÀNG BUỘC & CHỊU TẢI (ENR)

### TC-ENR-01: Sinh viên đăng ký lớp học phần thành công
- **Mục tiêu:** Đăng ký lớp học phần thỏa mãn toàn bộ điều kiện.
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Functional / Smoke
- **Tiền điều kiện:** Học kỳ mở đăng ký, lớp trạng thái `OPEN`, còn chỗ, không trùng lịch.
- **Các bước thực hiện:**
  1. Dùng `studentToken` gửi `POST /api/enrollments`.
  2. Body: `{"sectionId": 1}`.
- **Kết quả mong đợi:**
  - HTTP `200 OK` hoặc `201 Created`.
  - Sinh bản ghi Enrollment mới với trạng thái `ENROLLED`.
  - Trường `enrolledCount` của lớp học phần tăng lên đúng 1.

---

### TC-ENR-02: Đăng ký lớp học phần ngoài thời gian mở cổng
- **Mục tiêu:** Xác minh quy tắc BR-Reg03: Chỉ cho phép đăng ký khi học kỳ hiện hành đang trong thời gian mở đăng ký (`isRegistrationOpen`).
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Business Rule BR-Reg03
- **Các bước thực hiện:**
  1. Cấu hình học kỳ có ngày kết thúc đăng ký là hôm qua.
  2. Sinh viên gửi request đăng ký học phần.
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request`.
  - Thông báo: "Hiện không trong thời gian đăng ký học phần".

---

### TC-ENR-03: Đăng ký khi lớp học phần đã đóng (Status = CLOSED)
- **Mục tiêu:** Ngăn chặn đăng ký vào lớp bị đóng bởi Phòng Đào tạo.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Business Rule
- **Các bước thực hiện:**
  1. Lớp HP có trạng thái `status = CLOSED`.
  2. Sinh viên gửi đăng ký vào lớp này.
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request`.
  - Thông báo: "Học phần đã đóng đăng ký".

---

### TC-ENR-04: Đăng ký lớp học phần đã đầy sĩ số (Lớp hết chỗ)
- **Mục tiêu:** Xác minh quy tắc BR-Course02: Chặn đăng ký khi `enrolledCount >= maxStudents`.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Business Rule BR-Course02
- **Các bước thực hiện:**
  1. Lớp HP có `maxStudents = 40`, hiện đã có 40 sinh viên đăng ký.
  2. Sinh viên thứ 41 gửi request đăng ký.
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request`.
  - Thông báo: "Học phần đã đầy". `enrolledCount` vẫn là 40.

---

### TC-ENR-05: Đăng ký trùng lại cùng một lớp học phần
- **Mục tiêu:** Không tạo bản ghi trùng lặp khi sinh viên nhấn đăng ký 2 lần.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Business Rule / Idempotency
- **Các bước thực hiện:**
  1. Sinh viên đã đăng ký Lớp HP 1 thành công.
  2. Sinh viên gửi lại `POST /api/enrollments` với `sectionId = 1`.
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request`.
  - Thông báo: "Sinh viên đã đăng ký học phần này". Sĩ số lớp không tăng thêm.

---

### TC-ENR-06: Đăng ký 2 lớp học phần bị trùng thời khóa biểu
- **Mục tiêu:** Xác minh BR-Reg01: Chặn đăng ký 2 lớp trùng thứ và giao nhau tiết học.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Business Rule BR-Reg01
- **Các bước thực hiện:**
  1. Đã đăng ký Lớp A: Thứ 3, Tiết 1-3.
  2. Đăng ký tiếp Lớp B: Thứ 3, Tiết 2-4.
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request`.
  - Thông báo: "Trùng lịch học!". Đăng ký lớp B bị từ chối.

---

### TC-ENR-07: Đăng ký 2 lớp cùng thứ nhưng khác tiết học (Hợp lệ)
- **Mục tiêu:** Cho phép sinh viên đăng ký nhiều môn trong cùng một ngày nếu không trùng tiết.
- **Độ ưu tiên:** P1
- **Loại kiểm thử:** Functional
- **Các bước thực hiện:**
  1. Đã đăng ký Lớp A: Thứ 3, Tiết 1-3.
  2. Đăng ký tiếp Lớp B: Thứ 3, Tiết 4-6.
- **Kết quả mong đợi:**
  - Đăng ký Lớp B thành công. Cả 2 môn xuất hiện trong TKB cá nhân.

---

### TC-ENR-08: Đăng ký vượt quá số tín chỉ tối đa trong học kỳ
- **Mục tiêu:** Xác minh quy tắc BR-Reg02: Tổng số tín chỉ trong học kỳ không được vượt quá giới hạn tối đa (`MAX_CREDITS_PER_SEMESTER = 30`).
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Business Rule BR-Reg02
- **Các bước thực hiện:**
  1. Sinh viên đã đăng ký các môn với tổng cộng 28 tín chỉ.
  2. Đăng ký thêm môn học 3 tín chỉ (Tổng = 31 > 30).
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request`.
  - Thông báo: "Vượt quá 30 tín chỉ/học kỳ".

---

### TC-ENR-09: Kiểm tra điều kiện môn học tiên quyết (Prerequisites)
- **Mục tiêu:** Xác minh BR-Course01: Không cho phép đăng ký học phần B nếu chưa hoàn thành đạt môn tiên quyết A.
- **Độ ưu tiên:** P1
- **Loại kiểm thử:** Business Rule BR-Course01
- **Các bước thực hiện:**
  1. Môn "Lập trình Web" yêu cầu tiên quyết là "Lập trình C/C++".
  2. Sinh viên chưa học hoặc bị điểm F môn "Lập trình C/C++".
  3. Sinh viên gửi request đăng ký lớp "Lập trình Web".
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request`.
  - Thông báo: "Chưa hoàn thành môn học tiên quyết".

---

### TC-ENR-10: Hủy đăng ký lớp học phần trong thời hạn cho phép
- **Mục tiêu:** Cho phép sinh viên hủy lớp đã đăng ký khi cổng còn mở và chưa có điểm.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Functional
- **Các bước thực hiện:**
  1. Sinh viên gửi `DELETE /api/enrollments/{id}` cho học phần của mình.
- **Kết quả mong đợi:**
  - HTTP `200 OK`.
  - Trạng thái bản ghi chuyển sang `CANCELLED` (hoặc xóa mềm).
  - Sĩ số lớp học phần `enrolledCount` giảm đi đúng 1.

---

### TC-ENR-11: Chặn hủy đăng ký khi học phần đã được nhập điểm
- **Mục tiêu:** Đảm bảo toàn vẹn dữ liệu: Không cho phép rút môn học khi giảng viên đã vào điểm.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Business Rule Integrity
- **Các bước thực hiện:**
  1. Lớp học phần đã được Giảng viên nhập điểm chuyên cần hoặc giữa kỳ.
  2. Sinh viên gửi `DELETE /api/enrollments/{id}` để hủy môn.
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request`.
  - Thông báo: "Không thể hủy học phần đã có điểm".

---

### TC-ENR-12: Chịu tải tranh chấp đăng ký chỗ cuối cùng (Concurrency & Zero Oversell)
- **Mục tiêu:** Đảm bảo cơ chế khóa bi quan (`PESSIMISTIC_WRITE`) ngăn chặn tình trạng bán quá chỗ (Overselling) khi nhiều sinh viên cùng tranh chỗ cuối.
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Concurrency / Stress Testing
- **Các bước thực hiện:**
  1. Chuẩn bị 1 Lớp học phần chỉ còn duy nhất **1 chỗ trống** (`enrolledCount = 39, maxStudents = 40`).
  2. Giả lập **50 sinh viên khác nhau** đồng thời gửi request `POST /api/enrollments` trong cùng 1 thời điểm (song song).
- **Kết quả mong đợi:**
  - **ĐÚNG 1 request** thành công nhận HTTP `200 OK`.
  - **49 request còn lại** nhận HTTP `400 Bad Request` ("Học phần đã đầy").
  - Sĩ số lớp sau test: `enrolledCount = 40 / 40`. **Tuyệt đối không oversell (sĩ số > 40)**.
  - Không có HTTP 500 phát sinh.

---

## 📊 SUITE 6: VÀO SỔ ĐIỂM, QUY ĐỔI & CỬA SỔ ÂN HẠN 7 NGÀY (GRD)

### TC-GRD-01: Giảng viên nhập điểm thành phần hợp lệ trong thang 0.0 - 10.0
- **Mục tiêu:** Nhập và lưu điểm chuyên cần, giữa kỳ, cuối kỳ cho sinh viên.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Functional
- **Các bước thực hiện:**
  1. Giảng viên phụ trách gửi `PUT /api/grades`.
  2. Body:
     ```json
     {
       "enrollmentId": 1,
       "attendanceScore": 9.0,
       "midtermScore": 8.0,
       "finalScore": 8.5
     }
     ```
- **Kết quả mong đợi:**
  - HTTP `200 OK`. Điểm được lưu vào bảng `grades`.

---

### TC-GRD-02: Kiểm tra công thức tính điểm tổng kết hệ 10 chuẩn
- **Mục tiêu:** Xác minh BR-Grade01: `Điểm tổng kết = CC * 10% + GK * 30% + CK * 60%` (làm tròn 2 chữ số thập phân).
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Business Rule Formula
- **Các bước thực hiện:**
  1. Nhập điểm: CC = 10.0, GK = 8.5, CK = 9.0.
- **Kết quả mong đợi:**
  - Điểm tổng kết = `(10.0 * 0.1) + (8.5 * 0.3) + (9.0 * 0.6) = 1.0 + 2.55 + 5.4 = 8.95`.
  - Cột `totalScore` trong CSDL lưu chính xác `8.95`.

---

### TC-GRD-03: Kiểm tra bảng quy đổi thang điểm chữ và thang điểm 4
- **Mục tiêu:** Xác minh bảng quy chế BR-Grade02:
  - `>= 8.5`: Điểm A (Hệ 4: 4.0)
  - `7.0 - 8.4`: Điểm B (Hệ 4: 3.0)
  - `5.5 - 6.9`: Điểm C (Hệ 4: 2.0)
  - `4.0 - 5.4`: Điểm D (Hệ 4: 1.0)
  - `< 4.0`: Điểm F (Hệ 4: 0.0)
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Business Rule Conversion
- **Các bước thực hiện:**
  1. Lần lượt test các mốc điểm tổng kết: `8.5`, `8.4`, `7.0`, `6.9`, `5.5`, `5.4`, `4.0`, `3.9`.
- **Kết quả mong đợi:**
  - Hệ thống tự động điền `letterGrade` và `gpa4` chính xác theo từng mốc quy chế.

---

### TC-GRD-04: Xử lý quy chế điểm liệt cuối kỳ (Final Exam < 3.0)
- **Mục tiêu:** Xác minh quy tắc: Nếu điểm cuối kỳ < 3.0, sinh viên bị xếp loại F / 0.0 bất kể tổng điểm > 4.0.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Business Rule Exception
- **Các bước thực hiện:**
  1. Nhập điểm: CC = 10.0, GK = 10.0, CK = 2.5.
  2. Tổng điểm trên giấy: `1.0 + 3.0 + 1.5 = 5.5` (mức điểm C).
- **Kết quả mong đợi:**
  - Do CK = 2.5 < 3.0 (Điểm liệt) -> Hệ thống ép xếp loại:
    * `letterGrade = "F"`
    * `gpa4 = 0.0`
    * `isPassed = false`.

---

### TC-GRD-05: Nhập điểm ngoài khoảng giá trị cho phép (Biên [0.0 - 10.0])
- **Mục tiêu:** Ngăn chặn nhập điểm âm hoặc điểm vượt quá 10.0.
- **Độ ưu tiên:** P1
- **Loại kiểm thử:** Boundary Testing
- **Các bước thực hiện:**
  1. Nhập `attendanceScore = -1.0`.
  2. Nhập `finalScore = 10.5`.
  3. Nhập dữ liệu chữ `"muoi"`.
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request` cho tất cả các trường hợp.

---

### TC-GRD-06: Nhập và cập nhật điểm hàng loạt (Batch Grade Entry)
- **Mục tiêu:** Giảng viên lưu điểm một lúc cho toàn bộ danh sách lớp (`PUT /api/grades/batch`).
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Functional
- **Các bước thực hiện:**
  1. Giảng viên gửi danh sách mảng gồm 40 sinh viên kèm điểm thành phần.
- **Kết quả mong đợi:**
  - HTTP `200 OK`. Toàn bộ 40 sinh viên được cập nhật điểm đồng thời.

---

### TC-GRD-07: Xuất bảng điểm lớp học phần ra file Excel (.xlsx)
- **Mục tiêu:** Xác minh tính năng xuất bảng điểm phục vụ lưu trữ của Phòng Đào tạo.
- **Độ ưu tiên:** P1
- **Loại kiểm thử:** Integration / Export
- **Các bước thực hiện:**
  1. Giảng viên gọi `GET /api/grades/section/{id}/export`.
- **Kết quả mong đợi:**
  - HTTP `200 OK`.
  - Header: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
  - File Excel tải về mở được, đúng format, đầy đủ các cột và danh sách SV.

---

### TC-GRD-08: Chốt bảng điểm khi chưa nhập đủ 100% sinh viên
- **Mục tiêu:** Đảm bảo không thể chốt sổ khi còn sinh viên bị thiếu điểm thành phần hoặc tổng kết.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Business Rule Locking
- **Các bước thực hiện:**
  1. Lớp có 30 sinh viên, mới nhập điểm cho 28 sinh viên (còn 2 sinh viên chưa có điểm).
  2. Giảng viên nhấn "Chốt & Công bố điểm" (`finalize = true`).
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request`.
  - Message: "Chưa thể chốt điểm: Còn sinh viên chưa được nhập đủ điểm". Liệt kê danh sách SV còn thiếu.

---

### TC-GRD-09: Chốt bảng điểm thành công & Điểm công bố ngay cho Sinh viên
- **Mục tiêu:** Khi đủ 100% điểm, chốt bảng điểm thành công; mốc `finalizedAt` được ghi nhận và sinh viên xem được điểm ngay.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Business Rule BR-Grade05
- **Các bước thực hiện:**
  1. Toàn bộ sinh viên đã có điểm tổng kết.
  2. Giảng viên gửi request chốt điểm (`finalize = true`).
- **Kết quả mong đợi:**
  - HTTP `200 OK`.
  - Bảng điểm chuyển sang `isFinalized = true`, ghi `finalizedAt = NOW()`.
  - Sinh viên truy cập bảng điểm cá nhân lập tức nhìn thấy điểm đã công bố.

---

### TC-GRD-10: Giảng viên sửa điểm trong Cửa sổ ân hạn 7 ngày
- **Mục tiêu:** Xác minh trong vòng 7 ngày kể từ lúc chốt, giảng viên vẫn có quyền chỉnh sửa sai sót.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Business Rule Grace Period
- **Các bước thực hiện:**
  1. Bảng điểm đã chốt được 2 ngày (`finalizedAt = NOW() - 2 ngày`).
  2. Giảng viên gửi request cập nhật lại điểm cho 1 sinh viên.
- **Kết quả mong đợi:**
  - HTTP `200 OK`. Điểm được cập nhật thành công. Mốc 7 ngày không bị gia hạn lại.

---

### TC-GRD-11: Giảng viên bị Khóa cứng khi quá Cửa sổ ân hạn 7 ngày
- **Mục tiêu:** Xác minh sau 7 ngày kể từ `finalizedAt`, giảng viên không còn quyền chỉnh sửa.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Business Rule Hard Locking
- **Các bước thực hiện:**
  1. Bảng điểm đã chốt quá 7 ngày (`finalizedAt = NOW() - 8 ngày`).
  2. Giảng viên gửi request `PUT /api/grades` sửa điểm.
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request` hoặc `403 Forbidden`.
  - Thông báo: "Bảng điểm đã bị khóa cứng quá 7 ngày. Vui lòng liên hệ Quản trị viên để mở khóa".

---

### TC-GRD-12: Quản trị viên (Admin) Mở khóa bảng điểm đã hết hạn
- **Mục tiêu:** Admin có đặc quyền mở khóa bảng điểm để giảng viên chỉnh sửa phúc khảo.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Admin Override / Audit Log
- **Các bước thực hiện:**
  1. Admin gửi request mở khóa cho lớp học phần (`finalize = false`).
- **Kết quả mong đợi:**
  - HTTP `200 OK`.
  - Hệ thống xóa mốc `finalizedAt`, đặt `isFinalized = false`.
  - Giảng viên được phép sửa điểm lại bình thường.
  - Hệ thống ghi nhật ký Audit Log ghi nhận thao tác của Admin.

---

## 🎓 SUITE 7: BẢNG ĐIỂM, TÍNH GPA/CPA & CẢNH BÁO HỌC VỤ (TRA)

### TC-TRA-01: Sinh viên chỉ xem được các môn học ĐÃ CHỐT ĐIỂM
- **Mục tiêu:** Điểm số đang ở trạng thái lưu nháp của giảng viên không được phép lộ ra cho sinh viên.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Data Privacy / Workflow
- **Các bước thực hiện:**
  1. Giảng viên nhập nháp điểm cho môn X (chưa bấm Chốt).
  2. Sinh viên gọi `GET /api/transcript/me`.
- **Kết quả mong đợi:**
  - Môn X không xuất hiện trong bảng điểm sinh viên hoặc hiển thị trạng thái "Chưa công bố".

---

### TC-TRA-02: Tính điểm trung bình học kỳ (GPA) theo trọng số tín chỉ
- **Mục tiêu:** Xác minh công thức GPA = `Tổng (Điểm hệ 4 * Tín chỉ) / Tổng tín chỉ đăng ký trong kỳ`.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Calculation Accuracy
- **Các bước thực hiện:**
  1. Sinh viên học 2 môn trong kỳ:
     - Môn 1: 3 tín chỉ, Điểm A (4.0) -> Tích lũy: `3 * 4.0 = 12.0`.
     - Môn 2: 2 tín chỉ, Điểm B (3.0) -> Tích lũy: `2 * 3.0 = 6.0`.
- **Kết quả mong đợi:**
  - Tổng tín chỉ = 5.
  - GPA = `(12.0 + 6.0) / 5 = 18.0 / 5 = 3.60`.
  - Hệ thống tính và trả về chính xác `semesterGpa = 3.60`.

---

### TC-TRA-03: Khử trùng môn học lại khi tính CPA tích lũy (BR-Grade04)
- **Mục tiêu:** Khi sinh viên học lại để nâng điểm hoặc trả nợ môn trượt, CPA chỉ lấy lần có điểm cao nhất của mỗi học phần.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Business Rule BR-Grade04
- **Các bước thực hiện:**
  1. Kỳ 1: Sinh viên học môn Toán, 3 tín chỉ, bị điểm F (0.0).
  2. Kỳ 2: Sinh viên đăng ký học lại môn Toán, được điểm A (4.0).
  3. Kiểm tra CPA toàn khóa của sinh viên.
- **Kết quả mong đợi:**
  - Môn Toán chỉ tính 1 lần 3 tín chỉ với điểm A (4.0) vào CPA tích lũy.
  - Điểm F của Kỳ 1 không bị cộng dồn làm kéo tụt CPA tích lũy toàn khóa.

---

### TC-TRA-04: Tín chỉ tích lũy chỉ tính các môn ĐẠT (Passed Courses Only)
- **Mục tiêu:** Các môn học bị điểm F (0.0) không được tính vào số tín chỉ tích lũy tốt nghiệp.
- **Độ ưu tiên:** P1
- **Loại kiểm thử:** Business Rule
- **Các bước thực hiện:**
  1. Sinh viên đăng ký 15 tín chỉ trong kỳ: 12 tín chỉ đạt điểm D trở lên, 3 tín chỉ bị điểm F.
- **Kết quả mong đợi:**
  - Số tín chỉ đăng ký = 15.
  - Số tín chỉ tích lũy (`cumulativeCredits`) = 12.

---

### TC-TRA-05: Cảnh báo học vụ tự động khi GPA/CPA dưới ngưỡng quy định
- **Mục tiêu:** Xác minh quy tắc cảnh báo học vụ: GPA kỳ < 1.0 hoặc CPA < 2.0 -> phát cảnh báo học vụ.
- **Độ ưu tiên:** P1
- **Loại kiểm thử:** Academic Rule
- **Các bước thực hiện:**
  1. Sinh viên có kết quả học tập kỳ hiện tại: GPA = 0.85 (< 1.0).
  2. Hệ thống chạy tiến trình rà soát học vụ cuối kỳ.
- **Kết quả mong đợi:**
  - Hệ thống gán trạng thái Cảnh báo học vụ (Mức 1 hoặc Mức 2) cho sinh viên, hiển thị cảnh báo đỏ trên Dashboard.

---

### TC-TRA-06: Admin tra cứu bảng điểm toàn diện của bất kỳ Sinh viên nào
- **Mục tiêu:** Admin có thể tra cứu bảng điểm sinh viên theo mã để xét tốt nghiệp.
- **Độ ưu tiên:** P1
- **Loại kiểm thử:** Functional
- **Các bước thực hiện:**
  1. Admin gọi `GET /api/transcript/student/{id}` với mã sinh viên hợp lệ.
- **Kết quả mong đợi:**
  - HTTP `200 OK`. Trả về toàn bộ lịch sử điểm qua các học kỳ của sinh viên.

---

## 🔑 SUITE 8: VÒNG ĐỜI QUÊN & CẤP LẠI MẬT KHẨU (RST)

### TC-RST-01: Gửi yêu cầu quên mật khẩu hợp lệ (Sinh viên / Giảng viên)
- **Mục tiêu:** Người dùng quên mật khẩu gửi yêu cầu hỗ trợ lên Admin.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Functional
- **Các bước thực hiện:**
  1. Gửi `POST /api/auth/forgot-password`.
  2. Body: `{"username": "2500001", "reason": "Quên mật khẩu sau kỳ nghỉ hè"}`.
- **Kết quả mong đợi:**
  - HTTP `200 OK`.
  - Tạo một bản ghi mới trong bảng `password_reset_requests` với trạng thái `PENDING`.

---

### TC-RST-02: Chống gửi yêu cầu trùng lặp khi đang có yêu cầu chờ duyệt
- **Mục tiêu:** Ngăn chặn spam request cấp lại mật khẩu.
- **Độ ưu tiên:** P1
- **Loại kiểm thử:** Business Rule / Spam Protection
- **Các bước thực hiện:**
  1. Sinh viên đã có 1 request `PENDING`.
  2. Sinh viên tiếp tục bấm gửi thêm yêu cầu quên mật khẩu lần 2.
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request`.
  - Thông báo: "Bạn đã có yêu cầu cấp lại mật khẩu đang chờ duyệt. Vui lòng kiên nhẫn chờ xử lý".

---

### TC-RST-03: Gửi yêu cầu quên mật khẩu cho tài khoản không tồn tại (Anti-Enumeration)
- **Mục tiêu:** Ngăn chặn kẻ tấn công dò quét sự tồn tại của tài khoản người dùng qua endpoint quên mật khẩu.
- **Độ ưu tiên:** P1
- **Loại kiểm thử:** Security Anti-Enumeration
- **Các bước thực hiện:**
  1. Gửi `POST /api/auth/forgot-password` với `username = "user_khong_ton_tai_9999"`.
- **Kết quả mong đợi:**
  - Hệ thống trả về thông báo chung thành công hoặc thông báo trung lập, không làm lộ tài khoản có tồn tại trong hệ thống hay không; không sinh bản ghi rác.

---

### TC-RST-04: Admin duyệt yêu cầu và sinh Mật khẩu tạm an toàn
- **Mục tiêu:** Admin phê duyệt yêu cầu; hệ thống tự động sinh ngẫu nhiên mật khẩu tạm 8 ký tự an toàn.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Functional / Security
- **Các bước thực hiện:**
  1. Admin gọi `POST /api/admin/password-resets/{id}/approve`.
- **Kết quả mong đợi:**
  - HTTP `200 OK`.
  - Hệ thống dùng `SecureRandom` sinh mật khẩu tạm 8 ký tự.
  - Mã hóa BCrypt mật khẩu mới vào bảng `users`.
  - Gán cờ `mustChangePassword = true`.
  - Trạng thái yêu cầu chuyển thành `APPROVED`.

---

### TC-RST-05: Đăng nhập bằng Mật khẩu tạm và Bắt buộc đổi mật khẩu
- **Mục tiêu:** Người dùng đăng nhập bằng mật khẩu tạm thành công và bị chuyển hướng bắt buộc đổi mật khẩu mới.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Security Lifecycle
- **Các bước thực hiện:**
  1. Người dùng đăng nhập bằng mật khẩu tạm vừa được cấp.
  2. Quan sát phản hồi và điều hướng của hệ thống.
- **Kết quả mong đợi:**
  - Đăng nhập thành công, token có claim hoặc flag `mustChangePassword: true`.
  - Frontend tự động chuyển hướng và chặn các trang khác, yêu cầu người dùng nhập mật khẩu mới trước khi tiếp tục.

---

### TC-RST-06: Đổi mật khẩu mới và hủy hiệu lực mật khẩu tạm
- **Mục tiêu:** Người dùng đổi mật khẩu mới thành công; cờ `mustChangePassword` được gỡ bỏ.
- **Độ ưu tiên:** P0
- **Loại kiểm thử:** Functional
- **Các bước thực hiện:**
  1. Gọi `POST /api/auth/change-password` với mật khẩu tạm và mật khẩu mới hợp lệ.
  2. Đăng xuất và đăng nhập lại bằng mật khẩu tạm cũ.
  3. Đăng nhập lại bằng mật khẩu mới.
- **Kết quả mong đợi:**
  - Đổi mật khẩu thành công, cờ `mustChangePassword = false`.
  - Dùng mật khẩu tạm cũ: Bị từ chối `401`.
  - Dùng mật khẩu mới: Đăng nhập thành công, vào Dashboard bình thường.

---

## 🚀 SUITE 9: KIỂM THỬ XUẤT XƯỞNG & TIÊU CHÍ RELEASE GATE (SHIP)

### TC-SHIP-01: Kiểm toán Khởi động & Health Check Endpoint
- **Mục tiêu:** Xác minh toàn bộ các dịch vụ (Database, Backend API, Frontend Nginx) khởi động sạch và endpoint health check phản hồi 200 OK.
- **Độ ưu tiên:** P0 (Release Gate)
- **Loại kiểm thử:** Sanity / Smoke
- **Các bước thực hiện:**
  1. Khởi động hệ thống qua Docker Compose hoặc Batch script.
  2. Gửi request kiểm tra trạng thái dịch vụ: `GET http://localhost:8080/actuator/health` hoặc ping database connection pool.
- **Tiêu chuẩn Release Gate:**
  - Status = `UP`.
  - Kết nối MySQL 8.0 ổn định trên port 3306/3308.
  - HikariCP pool khởi tạo thành công với tối thiểu 10 connections khả dụng.

---

### TC-SHIP-02: Kiểm tra Bộ nhớ & Tràn Connection Pool (HikariCP Pool Depletion)
- **Mục tiêu:** Đảm bảo dưới tải dồn dập, kết nối database được đóng đúng cách (`try-with-resources` / Spring transaction cleanup), không xảy ra Connection Leak.
- **Độ ưu tiên:** P0 (Release Gate)
- **Loại kiểm thử:** Performance / Stability
- **Các bước thực hiện:**
  1. Gửi 200 requests song song truy vấn bảng điểm và thời khóa biểu trong 5 giây.
  2. Đo số lượng active connection của HikariCP.
- **Tiêu chuẩn Release Gate:**
  - Không xuất hiện lỗi `SQLTransientConnectionException: Connection is not available, request timed out`.
  - Sau khi kết thúc tải, active connections trở về trạng thái idle bình thường.

---

### TC-SHIP-03: Kiểm thử Tải Đăng ký học phần đồng thời (500+ Concurrent Requests)
- **Mục tiêu:** Xác minh khả năng phục vụ khi có số lượng lớn sinh viên truy cập cổng đăng ký tín chỉ cùng lúc.
- **Độ ưu tiên:** P0 (Release Gate)
- **Loại kiểm thử:** Load & Stress Testing
- **Các bước thực hiện:**
  1. Sử dụng công cụ kiểm thử tải (Node.js test suite / K6 / Apache JMeter).
  2. Bắn 475 - 500 request đăng ký tín chỉ đồng thời trong vòng 10 giây.
- **Tiêu chuẩn Release Gate:**
  - **Tỷ lệ HTTP 5xx: Đúng bằng 0%**.
  - **Độ trễ P95 <= 2.0 giây**.
  - **Số lượng enrollment thành công không vượt quá `maxStudents` (Zero Oversell)**.

---

### TC-SHIP-04: Kiểm tra Lỗi Console & Assets Bundle Frontend (Web Quality)
- **Mục tiêu:** Đảm bảo bản build production của Frontend sạch sẽ, không có runtime crash hay asset 404.
- **Độ ưu tiên:** P0 (Release Gate)
- **Loại kiểm thử:** Frontend Build & E2E
- **Các bước thực hiện:**
  1. Chạy `npm run build` cho thư mục `frontend/`.
  2. Khởi chạy và mở các trang Dashboard Admin, Giảng viên, Sinh viên trên trình duyệt.
  3. Kiểm tra Console Log và Network Tab.
- **Tiêu chuẩn Release Gate:**
  - Build thành công, không có TypeScript/Lint error nghiêm trọng.
  - Không có uncaught exception trong Console.
  - Toàn bộ fonts, CSS, icon SVG tải đầy đủ (HTTP 200).

---

### TC-SHIP-05: Kế hoạch Rollback & Bảo toàn Dữ liệu (Rollback Strategy)
- **Mục tiêu:** Xác minh khả năng phục hồi dữ liệu khi có sự cố phát sinh trong quá trình vận hành sản phẩm.
- **Độ ưu tiên:** P0 (Release Gate)
- **Loại kiểm thử:** Disaster Recovery
- **Các bước thực hiện:**
  1. Thực hiện sao lưu CSDL hiện tại: `mysqldump -u root student_management > backup_pre_ship.sql`.
  2. Giả lập lỗi và chạy script phục hồi.
- **Tiêu chuẩn Release Gate:**
  - Thời gian phục hồi (RTO) < 5 phút.
  - Toàn bộ các bảng dữ liệu `users`, `students`, `grades`, `enrollments` nguyên vẹn 100%.

---

### TC-SHIP-06: Ký duyệt Nghiệm thu Xuất xưởng (Final Shipping Sign-Off Gate)
- **Mục tiêu:** Bảng đối soát điều kiện tiên quyết trước khi phát hành chính thức hoặc nộp bảo vệ đồ án.
- **Độ ưu tiên:** P0 (Absolute Gate)
- **Bảng đối soát tiêu chí xuất xưởng:**

| Hạng mục kiểm tra | Tiêu chuẩn bắt buộc | Kết quả đánh giá | Trạng thái |
|---|---|:---:|:---:|
| **1. Tỷ lệ Pass Test Cases P0** | **Đạt 100% (58/58 test cases P0 PASS)** | 100% PASS | ✅ ĐẠT |
| **2. Tỷ lệ Pass Toàn bộ Suite** | **Tối thiểu >= 95%** | 100% PASS | ✅ ĐẠT |
| **3. Lỗi Blocker / Critical** | **Bằng 0 lỗi** | 0 lỗi tồn đọng | ✅ ĐẠT |
| **4. Lỗ hổng Bảo mật** | **Chặn đứng SQLi, XSS, Forged JWT** | Đã thẩm định | ✅ ĐẠT |
| **5. Tranh chấp Đăng ký (Oversell)** | **Tuyệt đối không vượt quá sĩ số lớp** | Khóa bi quan OK | ✅ ĐẠT |
| **6. Quy chế Tính Điểm & Cửa sổ 7 ngày**| **Khớp 100% công thức và thời hạn khóa** | Đã kiểm toán | ✅ ĐẠT |
| **7. Backup CSDL & Tài liệu HDSD** | **Đầy đủ kịch bản demo và file backup** | Đã sẵn sàng | ✅ ĐẠT |

---

## 🔄 SUITE 10: KIỂM THỬ LUỒNG TRẠNG THÁI & ACCESS CONTROL (STATE)

### TC-STATE-01: Chuyển trạng thái lớp học phần tuần tự hợp lệ (Full Lifecycle)
- **Mục tiêu:** Xác minh vòng đời trạng thái của lớp học phần chuyển đổi tuần tự: `OPEN` (Mở đăng ký) $\rightarrow$ `CLOSED` (Đóng đăng ký) $\rightarrow$ `ACTIVE` (Đang học) $\rightarrow$ `COMPLETED` (Đã kết thúc / chốt điểm).
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** State Transition & Functional Integration
- **Các bước thực hiện:**
  1. Tạo lớp học phần mới với trạng thái mặc định ban đầu là `OPEN`.
  2. Quản trị viên cập nhật trạng thái sang `CLOSED` khi hết hạn đăng ký.
  3. Cập nhật trạng thái sang `ACTIVE` khi bắt đầu học kỳ.
  4. Giảng viên nhập đầy đủ 100% điểm thành phần và kích hoạt chốt điểm (`finalize = true`).
- **Kết quả mong đợi:**
  - Tất cả các bước chuyển đổi tuần tự đều thành công (HTTP 200).
  - Lớp học phần tự động chuyển sang `COMPLETED` sau khi bảng điểm được chốt.

---

### TC-STATE-02: Chặn nhảy cóc trạng thái lớp học phần (Anti-skip Enforcement)
- **Mục tiêu:** Đảm bảo hệ thống từ chối các hành vi cố tình nhảy cóc trạng thái trái quy chế đào tạo.
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Negative & Business Rule Validation
- **Các bước thực hiện:**
  1. Chọn lớp học phần đang ở trạng thái `OPEN`.
  2. Gửi request cập nhật trạng thái trực tiếp sang `ACTIVE` (bỏ qua bước `CLOSED`).
  3. Gửi request cập nhật trạng thái trực tiếp sang `COMPLETED`.
  4. Chọn lớp học phần đã bị `CANCELLED`, gửi request chuyển sang `ACTIVE`.
- **Kết quả mong đợi:**
  - Hệ thống ném ngoại lệ `BadRequestException` (HTTP 400).
  - Thông báo lỗi rõ ràng: *"Không thể chuyển đổi trạng thái lớp học phần từ OPEN sang ACTIVE. Vi phạm luồng trạng thái."*
  - Trạng thái lớp trong cơ sở dữ liệu giữ nguyên không bị thay đổi.

---

### TC-STATE-03: Chặn giảng viên nhập điểm khi lớp chưa đóng đăng ký (OPEN hoặc CANCELLED)
- **Mục tiêu:** Đảm bảo khi sinh viên còn trong thời gian đăng ký/hủy môn (lớp đang `OPEN`), giảng viên không được phép nhập điểm dở dang.
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Business Rule & Security Guard
- **Các bước thực hiện:**
  1. Giảng viên phụ trách truy cập màn hình nhập điểm của lớp đang ở trạng thái `OPEN`.
  2. Gửi request nhập điểm quá trình (`cc1Score`, `midtermScore`) hoặc điểm thi kết thúc học phần.
  3. Thử nghiệm tương tự trên lớp đã bị hủy (`CANCELLED`).
- **Kết quả mong đợi:**
  - Hệ thống từ chối ghi nhận điểm với HTTP 400.
  - Báo lỗi: *"Lớp học phần đang mở đăng ký (OPEN), chưa được phép nhập điểm"* hoặc *"Lớp học phần đã bị hủy (CANCELLED), không thể nhập điểm"*.

---

### TC-STATE-04: Tự động đổi trạng thái sang COMPLETED khi chốt điểm và hoàn nguyên ACTIVE khi Admin mở khóa
- **Mục tiêu:** Xác minh tính đồng bộ trạng thái giữa nghiệp vụ chốt điểm (Activity #14) và trạng thái lớp học phần.
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** State Synchronization & Audit
- **Các bước thực hiện:**
  1. Lớp học phần đang ở trạng thái `ACTIVE` (hoặc `CLOSED`).
  2. Giảng viên nhập đủ điểm và gửi cờ `finalize = true`.
  3. Kiểm tra trạng thái lớp: Phải tự động chuyển sang `COMPLETED`.
  4. Quản trị viên can thiệp mở khóa bảng điểm (`finalize = false`).
- **Kết quả mong đợi:**
  - Khi chốt: Lớp tự động chuyển sang `COMPLETED`, khóa cửa sổ sửa điểm sau thời gian ân hạn.
  - Khi Admin mở khóa: Lớp tự động phục hồi về trạng thái `ACTIVE`, cho phép giảng viên hiệu chỉnh điểm.

---

### TC-STATE-05: Kiểm soát truy cập sinh viên Bảo lưu (SUSPENDED Access Control)
- **Mục tiêu:** Sinh viên ở trạng thái "Bảo lưu" chỉ được phép tra cứu thông tin (Read-only), bị chặn toàn bộ quyền đăng ký môn học và các dịch vụ học vụ.
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Access Control & Academic Standing
- **Các bước thực hiện:**
  1. Quản trị viên cập nhật trạng thái sinh viên sang `SUSPENDED`.
  2. Sinh viên đăng nhập vào hệ thống: Xác minh đăng nhập thành công (`user.isActive = true`).
  3. Sinh viên xem bảng điểm, thông tin hồ sơ: Tra cứu bình thường.
  4. Sinh viên thử gọi API đăng ký học phần (`POST /api/enrollments`).
  5. Sinh viên thử gửi đơn phúc khảo điểm (`POST /api/grade-appeals`).
- **Kết quả mong đợi:**
  - Bước 2, 3: Đăng nhập và tra cứu thành công (Read-only).
  - Bước 4: Bị từ chối với HTTP 400: *"Tài khoản sinh viên đang trong trạng thái Bảo lưu, không được phép đăng ký học phần"*.
  - Bước 5: Bị từ chối với HTTP 400: *"Tài khoản sinh viên đang trong trạng thái Bảo lưu / Thôi học, không được phép nộp đơn phúc khảo"*.

---

### TC-STATE-06: Khóa tài khoản sinh viên Buộc thôi học (INACTIVE Dismissal Enforcement)
- **Mục tiêu:** Khi sinh viên bị Buộc thôi học (do cảnh cáo học vụ mức 3 hoặc quyết định kỷ luật), hệ thống tự động khóa tài khoản người dùng (`is_active = false`).
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Account Lifecycle & Security Blocking
- **Các bước thực hiện:**
  1. Cập nhật trạng thái sinh viên sang `INACTIVE` (Buộc thôi học / Ngừng học).
  2. Xác minh trường `users.is_active` được cập nhật thành `0` (`false`).
  3. Thử đăng nhập bằng tài khoản sinh viên qua API `/api/auth/login`.
- **Kết quả mong đợi:**
  - Đăng nhập bị chặn hoàn toàn (HTTP 401: *"Tài khoản đã bị vô hiệu hóa"* hoặc *"Tài khoản bị khóa"*).
  - Không sinh token JWT, ngăn chặn hoàn toàn việc truy cập vào hệ thống.

---

---

## 💰 SUITE 11: QUẢN LÝ THU - CHI HỌC PHÍ & BIÊN LAI TÀI CHÍNH (TUI)

### TC-TUI-01: Tính học phí học kỳ tự động theo số tín chỉ đã đăng ký
- **Mục tiêu:** Xác minh hệ thống tự động tính chính xác tổng học phí phải nộp dựa trên số tín chỉ của các môn học sinh viên đăng ký thành công trong kỳ (VD: 15 tín chỉ × 450,000 VNĐ/tín = 6,750,000 VNĐ).
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Business Rule / Financial Calculation
- **Tiền điều kiện:** Sinh viên đăng ký thành công các lớp học phần trong kỳ mở cổng ĐKHP.
- **Dữ liệu kiểm thử:** `studentId = 2500001`, `semesterId = 1`, đơn giá = 450,000 VNĐ/tín chỉ.
- **Các bước thực hiện:**
  1. Gửi `GET /api/admin/tuition/student/2500001?semesterId=1`.
- **Kết quả mong đợi:**
  - HTTP `200 OK`.
  - `totalCredits`: Tổng số tín chỉ các lớp đã đăng ký (khớp tổng tín chỉ).
  - `totalAmount = totalCredits × đơn giá tín chỉ`.
  - Trạng thái công nợ ban đầu là `UNPAID` nếu chưa đóng tiền.
- **Hậu điều kiện / Hoàn nguyên:** Không làm thay đổi CSDL.

---

### TC-TUI-02: Thu ngân thu tiền mặt và gạch nợ học phí toàn phần
- **Mục tiêu:** Xác minh chức năng thu ngân tại quầy thu tiền mặt, gạch nợ học phí 100% cho sinh viên, cập nhật trạng thái hóa đơn sang `PAID`.
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Functional / Financial Transaction
- **Tiền điều kiện:** Sinh viên có hóa đơn học phí ở trạng thái `UNPAID`.
- **Dữ liệu kiểm thử:** `studentId`, danh sách `invoiceIds` chưa thanh toán, `paymentMethod = CASH`.
- **Các bước thực hiện:**
  1. Đăng nhập tài khoản Quản trị / Thu ngân (`adminToken`).
  2. Gửi `POST /api/admin/tuition/collect-cash` với body:
     ```json
     {
       "studentId": 2500001,
       "semesterId": 1,
       "invoiceIds": [101, 102],
       "notes": "Thu học phí HK1 trực tiếp tại quầy"
     }
     ```
- **Kết quả mong đợi:**
  - HTTP `200 OK`.
  - Toàn bộ hóa đơn được chuyển trạng thái `PAID`.
  - Sinh mã biên lai thu tiền hợp lệ dạng `REC-...`.
  - Tra cứu lại học phí sinh viên: `unpaidAmount = 0`, `paidAmount = totalAmount`.
- **Hậu điều kiện / Hoàn nguyên:** Sử dụng API / câu lệnh rollback hoặc cập nhật trạng thái hoàn nguyên sau kiểm thử.

---

### TC-TUI-03: Chặn thu một phần học phí khi vi phạm quy chế đóng 100%
- **Mục tiêu:** Đảm bảo hệ thống chặn thu ngân chỉ chọn một phần hóa đơn khi quy chế yêu cầu thanh toán toàn bộ 100% công nợ kỳ.
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Business Rule / Negative
- **Tiền điều kiện:** Sinh viên có từ 2 hóa đơn học phần chưa thanh toán trở lên trong kỳ.
- **Các bước thực hiện:**
  1. Thu ngân chỉ gửi 1 trong 2 mã hóa đơn: `invoiceIds: [101]`.
  2. Gửi `POST /api/admin/tuition/collect-cash`.
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request`.
  - Thông báo lỗi rõ ràng: *"Theo quy định tài chính, sinh viên phải thanh toán 100% học phí kỳ học"*.
  - Trạng thái các hóa đơn giữ nguyên `UNPAID`.
- **Hậu điều kiện / Hoàn nguyên:** Dữ liệu không đổi.

---

### TC-TUI-04: Sinh mã biên lai điện tử duy nhất và đối soát thời gian giao dịch
- **Mục tiêu:** Xác minh mỗi giao dịch thu tiền đều sinh ra mã biên lai duy nhất, lưu vết chính xác thời điểm thu và cán bộ thu ngân thực hiện.
- **Độ ưu tiên:** P1 (High)
- **Loại kiểm thử:** Audit Trail & Integrity
- **Các bước thực hiện:**
  1. Thu ngân hoàn tất thu tiền học phí hợp lệ.
  2. Đọc trường `receiptNumber`, `transactionTime`, `cashierUsername` trong response.
  3. Đối soát mã biên lai trong bảng lưu vết giao dịch.
- **Kết quả mong đợi:**
  - Mã biên lai không trùng lặp, có định dạng chuẩn (`REC-YYYYMMDD-XXXX`).
  - `transactionTime` khớp thời gian thực tế hệ thống.
  - `cashierUsername` ghi nhận chính xác tài khoản thu ngân đăng nhập.
- **Hậu điều kiện / Hoàn nguyên:** Hoàn nguyên trạng thái kiểm thử.

---

### TC-TUI-05: Sinh viên nộp đơn đề nghị gia hạn nộp học phí
- **Mục tiêu:** Xác minh sinh viên có hoàn cảnh khó khăn có thể gửi đơn xin gia hạn nộp học phí kèm lý do và số ngày đề xuất.
- **Độ ưu tiên:** P1 (High)
- **Loại kiểm thử:** Functional / Student Self-service
- **Tiền điều kiện:** Cổng tiếp nhận đơn gia hạn đang mở, sinh viên có công nợ kỳ hiện tại.
- **Các bước thực hiện:**
  1. Đăng nhập tài khoản sinh viên.
  2. Gửi `POST /api/tuition/extensions` kèm lý do gia hạn và số ngày xin thêm (tối đa 14 ngày).
- **Kết quả mong đợi:**
  - HTTP `200 OK` (hoặc `201 Created`).
  - Đơn được ghi nhận ở trạng thái `PENDING`.
  - Sinh mã đơn gia hạn để tra cứu.
- **Hậu điều kiện / Hoàn nguyên:** Xóa đơn gia hạn test sau khi kiểm thử.

---

### TC-TUI-06: Quản trị viên duyệt đơn gia hạn học phí và cập nhật hạn chót
- **Mục tiêu:** Xác minh Quản trị viên duyệt đơn gia hạn học phí, hệ thống tự động lùi hạn chót nộp tiền và chuyển trạng thái sang `EXTENDED`.
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Workflow Approval & Date Calculation
- **Các bước thực hiện:**
  1. Quản trị viên gọi API duyệt: `POST /api/admin/tuition/extend-deadline`.
  2. Body: `{"studentId": 2500001, "days": 7, "notes": "Đã xác nhận hoàn cảnh khó khăn"}`.
- **Kết quả mong đợi:**
  - HTTP `200 OK`.
  - Hạn chót nộp học phí mới (`tuitionDeadline`) được cộng thêm đúng 7 ngày.
  - Sinh viên không bị đưa vào danh sách nợ quá hạn trong thời gian được gia hạn.
- **Hậu điều kiện / Hoàn nguyên:** Phục hồi lại hạn chót ban đầu sau kiểm thử.

---

### TC-TUI-07: Quét và trích xuất danh sách sinh viên nợ học phí quá hạn
- **Mục tiêu:** Xác minh hệ thống quét chính xác các sinh viên chưa hoàn thành học phí sau ngày hạn chót (`tuitionDeadline < NOW()`).
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Batch Job / Reporting
- **Các bước thực hiện:**
  1. Quản trị viên gọi `GET /api/admin/tuition/overdue?semesterId=1`.
- **Kết quả mong đợi:**
  - HTTP `200 OK`.
  - Trả về danh sách sinh viên có hóa đơn `UNPAID` và ngày quá hạn > 0.
  - Mỗi bản ghi hiển thị đầy đủ: Mã SV, Họ tên, Lớp, Số tiền nợ, Số ngày quá hạn.
  - Sinh viên đã được duyệt gia hạn và còn trong hạn không xuất hiện trong danh sách này.
- **Hậu điều kiện / Hoàn nguyên:** Read-only test, không ảnh hưởng CSDL.

---

### TC-TUI-08: Ràng buộc nợ học phí: Chặn sinh viên có nợ quá hạn đăng ký tín chỉ
- **Mục tiêu:** Đảm bảo quy chế học vụ: Sinh viên còn nợ học phí quá hạn của các kỳ trước bị chặn hoàn toàn quyền đăng ký học phần mới.
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Business Rule Enforcement
- **Tiền điều kiện:** Sinh viên có công nợ ở trạng thái `OVERDUE`.
- **Các bước thực hiện:**
  1. Sinh viên có nợ quá hạn đăng nhập hệ thống.
  2. Gửi request đăng ký lớp học phần: `POST /api/enrollments`.
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request`.
  - Báo lỗi: *"Sinh viên chưa hoàn thành nghĩa vụ học phí, không đủ điều kiện đăng ký học phần mới"*.
  - Đăng ký không được ghi nhận vào CSDL.
- **Hậu điều kiện / Hoàn nguyên:** Giữ nguyên trạng thái kiểm thử.

---

### TC-TUI-09: Khóa quyền tra cứu bảng điểm chi tiết của sinh viên nợ quá hạn
- **Mục tiêu:** Đảm bảo hệ thống ẩn điểm thi chi tiết hoặc hiển thị thông báo yêu cầu hoàn tất học phí trước khi xem bảng điểm chính thức.
- **Độ ưu tiên:** P1 (High)
- **Loại kiểm thử:** Access Control / Financial Compliance
- **Các bước thực hiện:**
  1. Sinh viên có nợ học phí quá hạn truy cập màn hình Tra cứu bảng điểm.
  2. Gọi `GET /api/transcripts/my`.
- **Kết quả mong đợi:**
  - Hệ thống trả về cảnh báo công nợ hoặc ẩn điểm thi học kỳ chưa đóng tiền.
  - Nhắc nhở liên hệ Phòng Tài chính để hoàn tất nghĩa vụ.
- **Hậu điều kiện / Hoàn nguyên:** Không làm thay đổi CSDL.

---

### TC-TUI-10: Hoàn nguyên và dọn dẹp dữ liệu học phí kiểm thử
- **Mục tiêu:** Đảm bảo cơ chế tự dọn dẹp (cleanup) dữ liệu thanh toán, hóa đơn và biên lai sinh ra trong quá trình kiểm thử tự động.
- **Độ ưu tiên:** P1 (High)
- **Loại kiểm thử:** Test Hygiene & Idempotency
- **Các bước thực hiện:**
  1. Chạy khối lệnh dọn dẹp trong `finally` của kịch bản kiểm thử.
  2. Xóa các bản ghi giao dịch thanh toán tạm, đưa trạng thái hóa đơn về trạng thái ban đầu.
- **Kết quả mong đợi:**
  - Bảng `student_invoices` và `tuition_payments` không bị tồn đọng dữ liệu rác sau khi chạy test suite.
- **Hậu điều kiện / Hoàn nguyên:** CSDL sạch 100%.

---

## 📋 SUITE 12: ĐIỂM DANH CHUYÊN CẦN & ĐIỀU KIỆN CẤM THI (ATT)

### TC-ATT-01: Giảng viên khởi tạo phiên điểm danh theo lịch giảng dạy
- **Mục tiêu:** Xác minh Giảng viên tạo thành công phiên điểm danh cho một buổi học cụ thể của lớp học phần được phân công.
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Functional / Core Teaching
- **Tiền điều kiện:** Giảng viên được phân công giảng dạy lớp học phần, ngày điểm danh hợp lệ.
- **Dữ liệu kiểm thử:** `sectionId`, `sessionDate = YYYY-MM-DD`, `attendanceKeyword = CHECK_IN`.
- **Các bước thực hiện:**
  1. Đăng nhập Giảng viên (`lecturerToken`).
  2. Gửi `POST /api/attendance/session` kèm danh sách sinh viên lớp.
- **Kết quả mong đợi:**
  - HTTP `200 OK` (hoặc `201 Created`).
  - Phiên điểm danh được khởi tạo thành công với ngày học tương ứng.
- **Hậu điều kiện / Hoàn nguyên:** Xóa phiên điểm danh test sau ca kiểm thử.

---

### TC-ATT-02: Ghi nhận chuyên cần sinh viên: Có mặt và Vắng mặt
- **Mục tiêu:** Xác minh Giảng viên ghi nhận chính xác trạng thái Có mặt (`isPresent = true`) hoặc Vắng (`isPresent = false`) cho từng sinh viên trong lớp.
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Functional Data Entry
- **Các bước thực hiện:**
  1. Gửi `POST /api/attendance/session` với mảng `records: [{ enrollmentId: X, isPresent: false }, { enrollmentId: Y, isPresent: true }]`.
- **Kết quả mong đợi:**
  - HTTP `200 OK`.
  - Sinh viên X được ghi nhận 1 buổi vắng mặt (`absenceCount` tăng thêm 1).
  - Sinh viên Y được ghi nhận có mặt (`absenceCount` không đổi).
- **Hậu điều kiện / Hoàn nguyên:** Hoàn nguyên bản ghi chuyên cần trong khối cleanup.

---

### TC-ATT-03: Đồng bộ số buổi vắng học phần tức thời sang Cổng sinh viên
- **Mục tiêu:** Xác minh ngay sau khi Giảng viên lưu điểm danh, Sinh viên tra cứu thấy ngay số buổi vắng cập nhật thời gian thực.
- **Độ ưu tiên:** P1 (High)
- **Loại kiểm thử:** Real-time Synchronization
- **Các bước thực hiện:**
  1. Giảng viên đánh vắng sinh viên A.
  2. Sinh viên A đăng nhập vào Cổng thông tin đào tạo.
  3. Gửi `GET /api/enrollments/section/{sectionId}` với `studentToken`.
- **Kết quả mong đợi:**
  - Bản ghi của Sinh viên A hiển thị trường `absenceCount` tăng tương ứng với số buổi giảng viên đã đánh vắng.
- **Hậu điều kiện / Hoàn nguyên:** Phục hồi lại dữ liệu vắng ban đầu.

---

### TC-ATT-04: Tự động gắn cờ Cấm thi khi sinh viên vắng vượt quá 20% số tiết
- **Mục tiêu:** Xác minh hệ thống tự động kích hoạt trạng thái **CẤM THI** (`disqualified = true`) khi tổng số buổi vắng của sinh viên vượt quá 20% quy định (VD: Môn 15 buổi, vắng từ buổi thứ 4 trở lên).
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Academic Regulation Enforcement
- **Quy tắc nghiệp vụ:** BR-Attendance: Vắng mặt > 20% số tiết học phần -> Mất quyền dự thi kết thúc học phần.
- **Các bước thực hiện:**
  1. Tạo các phiên điểm danh giả lập đánh vắng sinh viên vượt ngưỡng 20%.
  2. Tra cứu trạng thái lớp học phần: `GET /api/enrollments/section/{sectionId}`.
- **Kết quả mong đợi:**
  - Trường `isDisqualified` hoặc `disqualified` chuyển thành `true`.
  - Trạng thái hiển thị cảnh báo: *"Sinh viên bị cấm thi do nghỉ quá số buổi quy định"*.
- **Hậu điều kiện / Hoàn nguyên:** Hoàn nguyên trạng thái chuyên cần test.

---

### TC-ATT-05: Chặn giảng viên nhập điểm thi kết thúc học phần cho sinh viên bị cấm thi
- **Mục tiêu:** Đảm bảo khi sinh viên đã bị gắn cờ Cấm thi, hệ thống từ chối cho Giảng viên nhập điểm thi kết thúc học phần (`finalScore`).
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Security & Integrity Guard
- **Các bước thực hiện:**
  1. Giảng viên gửi request cập nhật điểm cho sinh viên bị cấm thi:
     ```json
     {
       "enrollmentId": 999,
       "finalScore": 8.0
     }
     ```
  2. Gửi `PUT /api/grades`.
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request`.
  - Thông báo lỗi: *"Sinh viên bị cấm thi do vi phạm quy chế chuyên cần, không thể nhập điểm thi kết thúc học phần"*.
  - Điểm thi trong CSDL giữ nguyên giá trị `0` hoặc `null`.
- **Hậu điều kiện / Hoàn nguyên:** Dữ liệu điểm giữ nguyên.

---

### TC-ATT-06: Sinh viên tra cứu lịch sử điểm danh chi tiết từng buổi học
- **Mục tiêu:** Xác minh Sinh viên có thể tra cứu chi tiết ngày học, trạng thái chuyên cần và tỷ lệ tham gia lớp học của từng môn.
- **Độ ưu tiên:** P1 (High)
- **Loại kiểm thử:** Read-only / User Experience
- **Các bước thực hiện:**
  1. Sinh viên gọi API tra cứu lịch sử điểm danh cá nhân theo môn học.
- **Kết quả mong đợi:**
  - HTTP `200 OK`.
  - Danh sách từng buổi học hiển thị: Ngày học, Giảng viên điểm danh, Trạng thái (Có mặt / Vắng).
  - Tỷ lệ chuyên cần phần trăm chính xác (VD: 90%).
- **Hậu điều kiện / Hoàn nguyên:** Không làm thay đổi CSDL.

---

### TC-ATT-07: Admin can thiệp đặc cách gỡ cờ cấm thi theo quyết định hội đồng
- **Mục tiêu:** Xác minh Quản trị viên (Phòng Đào tạo) có quyền xem xét văn bản giải trình đặc cách (ốm đau, thi đấu quốc gia) để gỡ cờ cấm thi cho sinh viên.
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Administrative Override
- **Các bước thực hiện:**
  1. Quản trị viên gọi API cập nhật trạng thái tư cách thi cho sinh viên có lý do chính đáng.
  2. Gửi request gỡ cờ cấm thi kèm ghi chú số quyết định.
- **Kết quả mong đợi:**
  - Cờ `disqualified` chuyển về `false`.
  - Giảng viên được phép nhập điểm thi kết thúc học phần bình thường.
  - Ghi vết hành động của Admin vào nhật ký kiểm toán hệ thống.
- **Hậu điều kiện / Hoàn nguyên:** Hoàn nguyên trạng thái sau kiểm thử.

---

### TC-ATT-08: Dọn dẹp phiên điểm danh và hoàn nguyên dữ liệu chuyên cần kiểm thử
- **Mục tiêu:** Đảm bảo toàn bộ các bản ghi điểm danh và số buổi vắng sinh ra trong quá trình test được dọn dẹp sạch sẽ.
- **Độ ưu tiên:** P1 (High)
- **Loại kiểm thử:** Test Cleanup & State Reset
- **Các bước thực hiện:**
  1. Thực hiện lệnh cleanup trong khối `finally` của script kiểm thử.
  2. Xóa các phiên điểm danh test và đặt lại `absenceCount` về giá trị ban đầu.
- **Kết quả mong đợi:**
  - Cơ sở dữ liệu trở về trạng thái sạch sẽ trước khi chạy kiểm thử.
- **Hậu điều kiện / Hoàn nguyên:** Đảm bảo CSDL nguyên vẹn.

---

## ⚖️ SUITE 13: VÒNG ĐỜI KHIẾU NẠI & PHÚC KHẢO ĐIỂM (APL)

### TC-APL-01: Sinh viên nộp đơn phúc khảo điểm trong thời hạn 7 ngày
- **Mục tiêu:** Xác minh Sinh viên có thể nộp đơn khiếu nại / phúc khảo điểm học phần trong thời hạn 7 ngày sau khi giảng viên chốt sổ điểm.
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Functional / Student Workflow
- **Tiền điều kiện:** Lớp học phần đã chốt điểm (`finalize = true`), thời gian chưa quá 7 ngày.
- **Dữ liệu kiểm thử:** `enrollmentId`, `reason = "Xin phúc khảo bài thi kết thúc học phần"`, `expectedScore = 8.5`.
- **Các bước thực hiện:**
  1. Sinh viên đăng nhập, gửi `POST /api/grade-appeals`:
     ```json
     {
       "enrollmentId": 201,
       "reason": "Em xin phúc khảo câu 3 bài thi cuối kỳ",
       "expectedScore": 8.5
     }
     ```
- **Kết quả mong đợi:**
  - HTTP `200 OK`.
  - Đơn phúc khảo được ghi nhận với trạng thái `PENDING`.
  - Ghi nhận chính xác ngày nộp đơn và điểm số hiện tại của sinh viên.
- **Hậu điều kiện / Hoàn nguyên:** Xóa đơn phúc khảo test trong khối cleanup.

---

### TC-APL-02: Chặn nộp đơn phúc khảo khi chưa chốt điểm hoặc đã quá hạn 7 ngày
- **Mục tiêu:** Đảm bảo hệ thống từ chối tiếp nhận đơn phúc khảo nếu điểm chưa được công bố chính thức hoặc thời hạn nộp đơn đã kết thúc.
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Business Rule & Boundary
- **Các bước thực hiện:**
  1. Thử nộp đơn cho lớp đang mở (`OPEN`) hoặc chưa chốt điểm.
  2. Thử nộp đơn cho lớp đã chốt điểm quá 7 ngày trước đó.
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request`.
  - Báo lỗi: *"Lớp học phần chưa chốt điểm chính thức"* hoặc *"Đã hết thời hạn tiếp nhận đơn phúc khảo (quá 7 ngày)"*.
- **Hậu điều kiện / Hoàn nguyên:** Không làm thay đổi CSDL.

---

### TC-APL-03: Chặn sinh viên nộp trùng đơn phúc khảo đang chờ xử lý
- **Mục tiêu:** Đảm bảo sinh viên không thể nộp thêm đơn phúc khảo mới cho cùng một môn học khi đơn trước đó vẫn đang ở trạng thái `PENDING`.
- **Độ ưu tiên:** P1 (High)
- **Loại kiểm thử:** Negative / Anti-spam
- **Các bước thực hiện:**
  1. Sinh viên gửi đơn phúc khảo lần 1 (thành công -> `PENDING`).
  2. Sinh viên tiếp tục gửi đơn phúc khảo lần 2 cho cùng `enrollmentId`.
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request`.
  - Báo lỗi: *"Bạn đang có đơn phúc khảo chờ xử lý cho môn học này, không thể nộp thêm"*.
- **Hậu điều kiện / Hoàn nguyên:** Dọn dẹp đơn test.

---

### TC-APL-04: Giảng viên và Ban thẩm định tra cứu danh sách đơn phúc khảo
- **Mục tiêu:** Xác minh Giảng viên phụ trách lớp và Ban Đào tạo có thể xem danh sách tất cả các đơn phúc khảo cần xử lý.
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Functional / Management
- **Các bước thực hiện:**
  1. Đăng nhập Giảng viên / Quản trị viên.
  2. Gửi `GET /api/grade-appeals?status=PENDING`.
- **Kết quả mong đợi:**
  - HTTP `200 OK`.
  - Danh sách trả về đầy đủ các đơn `PENDING` kèm thông tin: Mã SV, Họ tên, Lớp học phần, Điểm cũ, Điểm mong muốn, Lý do.
- **Hậu điều kiện / Hoàn nguyên:** Read-only test.

---

### TC-APL-05: Hội đồng phê duyệt phúc khảo và cập nhật điểm số mới
- **Mục tiêu:** Xác minh Hội đồng chấm phúc khảo duyệt đơn (`APPROVED`), cập nhật điểm mới cho sinh viên và lưu vết lý do thẩm định.
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Workflow Approval & Score Update
- **Các bước thực hiện:**
  1. Quản trị viên / Giảng viên gọi `PUT /api/grade-appeals/{id}/review`:
     ```json
     {
       "status": "APPROVED",
       "reviewedScore": 8.5,
       "reviewNotes": "Đã chấm lại: câu 3 đúng trọn vẹn thang điểm, nâng từ 7.0 lên 8.5"
     }
     ```
- **Kết quả mong đợi:**
  - HTTP `200 OK`.
  - Trạng thái đơn chuyển thành `APPROVED`.
  - Điểm thi trong bảng `grades` được cập nhật thành `8.5`.
  - Tự động quy đổi lại điểm tổng kết, điểm hệ 4 và điểm chữ mới.
- **Hậu điều kiện / Hoàn nguyên:** Hoàn nguyên điểm cũ và xóa đơn test.

---

### TC-APL-06: Tự động tính toán lại GPA, CPA ngay sau khi điểm phúc khảo cập nhật
- **Mục tiêu:** Xác minh ngay khi điểm phúc khảo được duyệt, hệ thống kích hoạt tự động tính toán lại điểm GPA kỳ và CPA tích lũy của sinh viên.
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Real-time Aggregation & Audit
- **Các bước thực hiện:**
  1. Ghi nhận GPA/CPA trước khi duyệt phúc khảo.
  2. Duyệt nâng điểm phúc khảo thành công.
  3. Gửi `GET /api/transcripts/student/{studentId}`.
- **Kết quả mong đợi:**
  - GPA học kỳ và CPA tích lũy tăng tương ứng với mức điểm mới đã được phê duyệt.
  - Điểm mới nhất lập tức được cập nhật trong Bảng điểm chính thức.
- **Hậu điều kiện / Hoàn nguyên:** Hoàn nguyên dữ liệu ban đầu.

---

### TC-APL-07: Hội đồng từ chối đơn phúc khảo và giữ nguyên điểm số gốc
- **Mục tiêu:** Xác minh Hội đồng từ chối đơn phúc khảo (`REJECTED`) khi bài thi không có sai sót, giữ nguyên điểm số đã công bố.
- **Độ ưu tiên:** P1 (High)
- **Loại kiểm thử:** Functional / Rejection Workflow
- **Các bước thực hiện:**
  1. Gửi `PUT /api/grade-appeals/{id}/review` với `status: "REJECTED"`, `reviewNotes: "Bài thi chấm chính xác theo barem, giữ nguyên điểm"`.
- **Kết quả mong đợi:**
  - HTTP `200 OK`.
  - Trạng thái đơn chuyển sang `REJECTED`.
  - Điểm số trong bảng `grades` không thay đổi.
  - Sinh viên nhận được thông báo phản hồi lý do từ chối.
- **Hậu điều kiện / Hoàn nguyên:** Xóa đơn test sau kiểm thử.

---

### TC-APL-08: Dọn dẹp đơn phúc khảo test và hoàn nguyên điểm gốc ban đầu
- **Mục tiêu:** Đảm bảo toàn bộ các đơn phúc khảo và điểm số điều chỉnh trong kịch bản kiểm thử được hoàn nguyên sạch sẽ.
- **Độ ưu tiên:** P1 (High)
- **Loại kiểm thử:** Test Hygiene & Idempotency
- **Các bước thực hiện:**
  1. Chạy khối lệnh dọn dẹp trong `finally`.
  2. Khôi phục điểm số ban đầu và xóa đơn phúc khảo test.
- **Kết quả mong đợi:**
  - Bảng điểm của sinh viên trở về trạng thái nguyên bản.
- **Hậu điều kiện / Hoàn nguyên:** CSDL sạch 100%.

---

## 🏛️ SUITE 14: LỚP HỌC PHẦN ĐẶC BIỆT & ĐIỀU PHỐI ĐÀO TẠO (CLS)

### TC-CLS-01: Sinh viên nộp đơn đề nghị mở lớp học phần đặc biệt
- **Mục tiêu:** Xác minh Sinh viên có nhu cầu học trả nợ hoặc học vượt có thể gửi đơn đề nghị mở lớp học phần riêng ngoài kế hoạch chuẩn.
- **Độ ưu tiên:** P1 (High)
- **Loại kiểm thử:** Functional / Student Request
- **Các bước thực hiện:**
  1. Sinh viên đăng nhập, gửi `POST /api/special-classes/requests`:
     ```json
     {
       "subjectId": 5,
       "semesterId": 1,
       "requestType": "RETAKE"
     }
     ```
- **Kết quả mong đợi:**
  - HTTP `200 OK`.
  - Đơn đề nghị mở lớp được ghi nhận với trạng thái `PENDING`.
- **Hậu điều kiện / Hoàn nguyên:** Xóa đơn test sau ca kiểm thử.

---

### TC-CLS-02: Quản trị viên tạo lớp học phần đặc biệt với định mức học phí riêng
- **Mục tiêu:** Xác minh Quản trị viên có thể tạo lớp học phần đặc biệt với quy mô riêng và mức thu học phí riêng biệt (`baseTuitionRate`).
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Functional / Admin Operation
- **Các bước thực hiện:**
  1. Quản trị viên gửi `POST /api/special-classes`:
     ```json
     {
       "subjectId": 5,
       "semesterId": 1,
       "lecturerId": 1,
       "sectionCode": "SPE_JAVA_2026",
       "maxStudents": 25,
       "baseTuitionRate": 650000.0
     }
     ```
- **Kết quả mong đợi:**
  - HTTP `200 OK`.
  - Lớp học phần đặc biệt được tạo thành công với mã `SPE_JAVA_2026`.
  - Đơn giá học phí riêng được ghi nhận chính xác trong cấu hình lớp.
- **Hậu điều kiện / Hoàn nguyên:** Xóa lớp học phần đặc biệt test trong khối cleanup.

---

### TC-CLS-03: Ràng buộc cấu hình sĩ số: Chặn tạo lớp khi minStudents > maxStudents
- **Mục tiêu:** Đảm bảo hệ thống chặn Quản trị viên vô tình cấu hình sĩ số tối thiểu lớn hơn sĩ số tối đa của lớp học phần.
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Boundary & Data Integrity
- **Các bước thực hiện:**
  1. Gửi request tạo lớp với `minStudents: 50`, `maxStudents: 30`.
- **Kết quả mong đợi:**
  - HTTP `400 Bad Request`.
  - Báo lỗi: *"Sĩ số tối thiểu (minStudents) không được vượt quá sĩ số tối đa (maxStudents)"*.
- **Hậu điều kiện / Hoàn nguyên:** Không làm thay đổi CSDL.

---

### TC-CLS-04: Tự động cảnh báo và đề xuất hủy lớp học phần không đủ sĩ số
- **Mục tiêu:** Xác minh hệ thống lọc chính xác các lớp học phần có số lượng đăng ký thực tế nhỏ hơn `minStudents` khi hết hạn đăng ký để báo cáo Hội đồng đào tạo.
- **Độ ưu tiên:** P1 (High)
- **Loại kiểm thử:** Business Rule & Reporting
- **Các bước thực hiện:**
  1. Gọi API tra cứu lớp học phần cần điều phối: `GET /api/course-sections?status=CLOSED`.
- **Kết quả mong đợi:**
  - Hệ thống gắn nhãn cảnh báo đối với các lớp có `enrolledStudents < minStudents`.
  - Đề xuất hủy lớp hoặc cho phép gộp sinh viên sang lớp song song.
- **Hậu điều kiện / Hoàn nguyên:** Read-only test.

---

### TC-CLS-05: Quản trị viên chốt danh sách lớp đặc biệt và phát sinh hóa đơn học phí
- **Mục tiêu:** Xác minh khi Quản trị viên chốt danh sách lớp đặc biệt (`finalize-billing`), hệ thống tự động sinh hóa đơn học phí theo đúng định mức riêng cho tất cả sinh viên trong danh sách.
- **Độ ưu tiên:** P0 (Release-Stopper)
- **Loại kiểm thử:** Financial Billing Generation
- **Các bước thực hiện:**
  1. Quản trị viên gọi `POST /api/special-classes/{sectionId}/finalize-billing`.
- **Kết quả mong đợi:**
  - HTTP `200 OK`.
  - Hóa đơn học phí được sinh tự động cho toàn bộ sinh viên đã đăng ký vào lớp đặc biệt.
  - Số tiền học phí bằng: `số tín chỉ × baseTuitionRate riêng của lớp`.
- **Hậu điều kiện / Hoàn nguyên:** Dọn dẹp hóa đơn và lớp học phần test.

---

### TC-CLS-06: Dọn dẹp và hoàn nguyên lớp học phần đặc biệt test
- **Mục tiêu:** Đảm bảo toàn bộ các bản ghi lớp học phần đặc biệt, đơn đề nghị mở lớp và hóa đơn phát sinh được dọn dẹp sạch sẽ sau kiểm thử.
- **Độ ưu tiên:** P1 (High)
- **Loại kiểm thử:** Test Hygiene & Idempotency
- **Các bước thực hiện:**
  1. Thực hiện lệnh cleanup trong `finally`.
  2. Xóa các lớp đặc biệt có tiền tố `SPE_...` và các liên kết phụ thuộc.
- **Kết quả mong đợi:**
  - Cơ sở dữ liệu sạch hoàn toàn, không lưu rác test.
- **Hậu điều kiện / Hoàn nguyên:** Hoàn tất dọn dẹp.

---

## 📊 BẢNG MA TRẬN TỔNG HỢP TOÀN BỘ 118 TEST CASES (TEST MATRIX TRÍCH XUẤT BÁO CÁO ĐỒ ÁN)

> [!TIP]
> Bảng ma trận dưới đây được chuẩn hóa theo chuẩn công nghiệp QA/Testing, sẵn sàng để sao chép (copy-paste) trực tiếp vào Chương 4 hoặc Chương 5 trong **Thuyết minh Báo cáo Đồ án Tốt nghiệp / Đồ án Chuyên ngành (ĐACN)**.

| STT | Mã Test Case | Phân Hệ / Module | Tên Ca Kiểm Thử | Mức Ưu Tiên | Tiền Điều Kiện | Kết Quả Mong Đợi | Trạng Thái |
|:---:|:---:|---|---|:---:|---|---|:---:|
| 1 | `TC-SEC-01` | Xác thực (SEC) | Đăng nhập Quản trị viên hợp lệ | P0 | Admin tồn tại | HTTP 200, JWT Token hợp lệ, Role ADMIN | ✅ PASS |
| 2 | `TC-SEC-02` | Xác thực (SEC) | Đăng nhập Giảng viên hợp lệ | P0 | Giảng viên tồn tại | HTTP 200, JWT Token, Role LECTURER | ✅ PASS |
| 3 | `TC-SEC-03` | Xác thực (SEC) | Đăng nhập Sinh viên hợp lệ | P0 | Sinh viên tồn tại | HTTP 200, JWT Token, Role STUDENT | ✅ PASS |
| 4 | `TC-SEC-04` | Xác thực (SEC) | Đăng nhập sai mật khẩu | P0 | User tồn tại | HTTP 401, không sinh token, báo lỗi an toàn | ✅ PASS |
| 5 | `TC-SEC-05` | Xác thực (SEC) | Khóa tạm khi sai pass 5 lần liên tiếp | P1 | User tồn tại | HTTP 423 hoặc 401 chặn brute-force | ✅ PASS |
| 6 | `TC-SEC-06` | Xác thực (SEC) | Tấn công SQL Injection ô đăng nhập | P0 | Hệ thống sẵn sàng | Chặn 100% SQLi, HTTP 401, CSDL an toàn | ✅ PASS |
| 7 | `TC-SEC-07` | Xác thực (SEC) | Tấn công XSS qua trường nhập liệu | P0 | Hệ thống sẵn sàng | Chặn mã độc script, sanitize dữ liệu | ✅ PASS |
| 8 | `TC-SEC-08` | Xác thực (SEC) | Token bị làm giả chữ ký (Tampered) | P0 | Token bị can thiệp | HTTP 401 Unauthorized, từ chối phiên | ✅ PASS |
| 9 | `TC-SEC-09` | Xác thực (SEC) | Token JWT hết hạn (Expired) | P0 | Token hết hạn | HTTP 401 Unauthorized, yêu cầu login lại | ✅ PASS |
| 10 | `TC-SEC-10` | Xác thực (SEC) | Token JWT dị dạng / Chuỗi rác | P0 | Token rác | HTTP 401 Unauthorized | ✅ PASS |
| 11 | `TC-SEC-11` | Xác thực (SEC) | Payload tấn công tràn bộ nhớ (DoS) | P1 | Hệ thống sẵn sàng | Chặn payload quá khổ (>1MB), HTTP 413 | ✅ PASS |
| 12 | `TC-SEC-12` | Xác thực (SEC) | Cấu hình bảo vệ CORS & Security Header | P1 | Hệ thống sẵn sàng | Trả đủ Origin, HSTS, X-Content-Type | ✅ PASS |
| 13 | `TC-RBAC-01` | Phân quyền (RBAC) | Sinh viên gọi API Tạo Khoa (Admin) | P0 | Sinh viên token | HTTP 403 Forbidden | ✅ PASS |
| 14 | `TC-RBAC-02` | Phân quyền (RBAC) | Sinh viên xem danh sách yêu cầu reset pass | P0 | Sinh viên token | HTTP 403 Forbidden | ✅ PASS |
| 15 | `TC-RBAC-03` | Phân quyền (RBAC) | Sinh viên tự mở Lớp học phần | P0 | Sinh viên token | HTTP 403 Forbidden | ✅ PASS |
| 16 | `TC-RBAC-04` | Phân quyền (RBAC) | Giảng viên gọi API Tạo Sinh viên mới | P0 | Giảng viên token | HTTP 403 Forbidden | ✅ PASS |
| 17 | `TC-RBAC-05` | Phân quyền (RBAC) | Giảng viên cấu hình Thời khóa biểu trường | P0 | Giảng viên token | HTTP 403 Forbidden | ✅ PASS |
| 18 | `TC-RBAC-06` | Phân quyền (RBAC) | Giảng viên sửa điểm lớp của người khác (IDOR)| P0 | Giảng viên A token | HTTP 403 Forbidden | ✅ PASS |
| 19 | `TC-RBAC-07` | Phân quyền (RBAC) | Sinh viên gọi API Nhập/Sửa điểm | P0 | Sinh viên token | HTTP 403 Forbidden | ✅ PASS |
| 20 | `TC-RBAC-08` | Phân quyền (RBAC) | Sinh viên A hủy môn của Sinh viên B (IDOR) | P0 | Sinh viên A token | HTTP 403 Forbidden | ✅ PASS |
| 21 | `TC-RBAC-09` | Phân quyền (RBAC) | Khách vãng lai truy cập API bảo vệ | P0 | Không token | HTTP 401 Unauthorized | ✅ PASS |
| 22 | `TC-RBAC-10` | Phân quyền (RBAC) | Sinh viên tra cứu điểm của người khác | P1 | Sinh viên A token | Ẩn dữ liệu hoặc HTTP 403 | ✅ PASS |
| 23 | `TC-ADM-01` | Đào tạo (ADM) | Tạo môn học mới hợp lệ | P0 | Admin token | HTTP 201/200, môn học lưu vào CSDL | ✅ PASS |
| 24 | `TC-ADM-02` | Đào tạo (ADM) | Chặn tạo trùng mã môn học | P0 | Mã môn đã có | HTTP 400 Bad Request, báo trùng mã | ✅ PASS |
| 25 | `TC-ADM-03` | Đào tạo (ADM) | Ràng buộc số tín chỉ môn (1 - 10) | P1 | Admin token | Chặn tín chỉ <=0 hoặc >10 | ✅ PASS |
| 26 | `TC-ADM-04` | Đào tạo (ADM) | Mở Lớp học phần mới với sĩ số chuẩn | P0 | Môn, GV, Kỳ tồn tại| Lớp tạo thành công ở trạng thái OPEN | ✅ PASS |
| 27 | `TC-ADM-05` | Đào tạo (ADM) | Chặn mở lớp với sĩ số <= 0 | P0 | Admin token | HTTP 400 Bad Request, sĩ số không hợp lệ | ✅ PASS |
| 28 | `TC-ADM-06` | Đào tạo (ADM) | Đóng / Mở lại cổng đăng ký lớp HP | P1 | Lớp tồn tại | Cập nhật trạng thái OPEN <-> CLOSED | ✅ PASS |
| 29 | `TC-ADM-07` | Đào tạo (ADM) | Chặn xóa môn học đang có lớp giảng dạy | P0 | Môn có lớp active | HTTP 400, vi phạm toàn vẹn khóa ngoại | ✅ PASS |
| 30 | `TC-ADM-08` | Đào tạo (ADM) | Cấu hình tiên quyết chống chu trình lặp | P1 | Môn A, Môn B | Chặn phụ thuộc vòng lặp (A -> B -> A) | ✅ PASS |
| 31 | `TC-ADM-09` | Đào tạo (ADM) | Cập nhật thông tin giảng viên | P1 | Giảng viên tồn tại | Thông tin cập nhật thành công | ✅ PASS |
| 32 | `TC-ADM-10` | Đào tạo (ADM) | Import danh sách sinh viên qua Excel | P1 | File mẫu hợp lệ | Thêm mới hàng loạt sinh viên thành công | ✅ PASS |
| 33 | `TC-SCH-01` | Thời khóa biểu (SCH)| Xếp lịch học không trùng phòng/giờ | P0 | Lớp, GV, Phòng trống| Xếp lịch thành công, lưu bản ghi TKB | ✅ PASS |
| 34 | `TC-SCH-02` | Thời khóa biểu (SCH)| Chặn trùng phòng học cùng ca và thứ | P0 | Phòng đã có lịch | HTTP 400, báo xung đột phòng học | ✅ PASS |
| 35 | `TC-SCH-03` | Thời khóa biểu (SCH)| Chặn trùng lịch giảng dạy của Giảng viên | P0 | Giảng viên bận | HTTP 400, báo trùng lịch giảng viên | ✅ PASS |
| 36 | `TC-SCH-04` | Thời khóa biểu (SCH)| Tra cứu TKB tuần của Giảng viên | P1 | Giảng viên có lịch | Trả về danh sách buổi dạy đúng tuần | ✅ PASS |
| 37 | `TC-SCH-05` | Thời khóa biểu (SCH)| Tra cứu TKB tuần của Sinh viên | P1 | Sinh viên có lịch | Trả về ma trận lịch học dạng Grid | ✅ PASS |
| 38 | `TC-SCH-06` | Thời khóa biểu (SCH)| Xóa ca học và giải phóng phòng | P1 | Ca học tồn tại | Xóa thành công, phòng trở về trạng thái rỗi| ✅ PASS |
| 39 | `TC-ENR-01` | Đăng ký tín chỉ (ENR)| Đăng ký học phần thành công | P0 | Cổng OPEN, đủ điều kiện| HTTP 200, ghi nhận bản ghi đăng ký | ✅ PASS |
| 40 | `TC-ENR-02` | Đăng ký tín chỉ (ENR)| Chặn đăng ký trùng mã môn học trong kỳ | P0 | Đã đăng ký môn này | HTTP 400, không được đăng ký 2 lớp cùng môn| ✅ PASS |
| 41 | `TC-ENR-03` | Đăng ký tín chỉ (ENR)| Chặn đăng ký khi chưa đạt môn tiên quyết | P0 | Chưa học/rớt tiên quyết| HTTP 400, vi phạm điều kiện tiên quyết | ✅ PASS |
| 42 | `TC-ENR-04` | Đăng ký tín chỉ (ENR)| Chặn đăng ký trùng thời khóa biểu ca học | P0 | Lớp mới trùng lịch | HTTP 400, trùng lịch học với môn đã có | ✅ PASS |
| 43 | `TC-ENR-05` | Đăng ký tín chỉ (ENR)| Kiểm tra giới hạn tối thiểu (10 tín chỉ) | P1 | Kỳ chính | Cảnh báo sinh viên đăng ký dưới 10 TC | ✅ PASS |
| 44 | `TC-ENR-06` | Đăng ký tín chỉ (ENR)| Chặn vượt giới hạn tối đa (24 tín chỉ) | P0 | Đã đạt 22 tín chỉ | Chặn môn vượt quá trần 24 tín chỉ | ✅ PASS |
| 45 | `TC-ENR-07` | Đăng ký tín chỉ (ENR)| Chặn đăng ký khi lớp học phần đã hết chỗ | P0 | Đã đủ maxStudents | HTTP 400, lớp học phần đã đầy | ✅ PASS |
| 46 | `TC-ENR-08` | Đăng ký tín chỉ (ENR)| Hủy đăng ký học phần trong thời hạn cho phép| P0 | Đang trong hạn ĐKHP | Hủy thành công, sĩ số lớp giảm 1 | ✅ PASS |
| 47 | `TC-ENR-09` | Đăng ký tín chỉ (ENR)| Chặn hủy đăng ký khi cổng ĐKHP đã đóng | P0 | Cổng CLOSED | HTTP 400, đã hết hạn hủy học phần | ✅ PASS |
| 48 | `TC-ENR-10` | Đăng ký tín chỉ (ENR)| Tranh chấp đăng ký đồng thời (Race Condition)| P0 | 1 slot cuối, 50 SV | Đúng 1 SV trúng tuyển, không bị vượt sĩ số| ✅ PASS |
| 49 | `TC-ENR-11` | Đăng ký tín chỉ (ENR)| Đăng ký học cải thiện điểm môn đã qua | P1 | Đã qua môn (điểm D/C)| Đăng ký thành công, tính học phí học lại | ✅ PASS |
| 50 | `TC-ENR-12` | Đăng ký tín chỉ (ENR)| Đăng ký học trả nợ môn bị rớt (điểm F) | P0 | Môn bị F | Đăng ký thành công môn trả nợ | ✅ PASS |
| 51 | `TC-GRD-01` | Sổ điểm (GRD) | Giảng viên vào điểm thành phần hợp lệ | P0 | Lớp ACTIVE | Lưu điểm CC1, CC2, GK, CK thành công | ✅ PASS |
| 52 | `TC-GRD-02` | Sổ điểm (GRD) | Chặn nhập điểm âm hoặc lớn hơn 10 | P0 | Lớp ACTIVE | HTTP 400, thang điểm phải từ 0.0 - 10.0 | ✅ PASS |
| 53 | `TC-GRD-03` | Sổ điểm (GRD) | Tính điểm tổng kết theo công thức chuẩn | P0 | Đủ 4 cột điểm | Khớp công thức 5% CC1 + 5% CC2 + 30% GK + 60% CK | ✅ PASS |
| 54 | `TC-GRD-04` | Sổ điểm (GRD) | Quy đổi điểm hệ 4 và điểm chữ chính xác | P0 | Có điểm hệ 10 | Khớp chuẩn quy đổi (A, B+, B, C+, C, D+, D, F)| ✅ PASS |
| 55 | `TC-GRD-05` | Sổ điểm (GRD) | Khóa sổ điểm học phần (Finalize) | P0 | Giảng viên chốt điểm| Điểm chuyển trạng thái locked, lớp COMPLETED| ✅ PASS |
| 56 | `TC-GRD-06` | Sổ điểm (GRD) | Chỉnh sửa điểm trong cửa sổ ân hạn 7 ngày| P0 | Trong 7 ngày sau chốt| Cho phép chỉnh sửa có lưu log kiểm toán | ✅ PASS |
| 57 | `TC-GRD-07` | Sổ điểm (GRD) | Chặn sửa điểm khi hết thời hạn ân hạn 7 ngày| P0 | Quá 7 ngày | HTTP 400, sổ điểm đã khóa vĩnh viễn | ✅ PASS |
| 58 | `TC-GRD-08` | Sổ điểm (GRD) | Admin mở khóa sổ điểm đặc biệt | P0 | Admin phê duyệt | Cho phép mở khóa sổ điểm có lý do giải trình| ✅ PASS |
| 59 | `TC-GRD-09` | Sổ điểm (GRD) | Import bảng điểm từ file Excel | P1 | File đúng cấu trúc | Cập nhật điểm thành công cho toàn bộ lớp | ✅ PASS |
| 60 | `TC-GRD-10` | Sổ điểm (GRD) | Chặn import file Excel sai cấu trúc / sai mã| P1 | File lỗi | Báo lỗi chi tiết số dòng sai sót | ✅ PASS |
| 61 | `TC-GRD-11` | Sổ điểm (GRD) | Xuất danh sách sổ điểm lớp ra file Excel | P1 | Lớp tồn tại | File tải về đúng format, đủ dữ liệu | ✅ PASS |
| 62 | `TC-GRD-12` | Sổ điểm (GRD) | Điểm F không được tính tích lũy tín chỉ | P0 | Điểm tổng kết < 4.0 | Tín chỉ tích lũy môn = 0 | ✅ PASS |
| 63 | `TC-TRA-01` | Bảng điểm & Học vụ (TRA)| Tính điểm trung bình học kỳ (GPA) | P0 | Đủ điểm các môn | Khớp công thức bình quân gia quyền theo TC | ✅ PASS |
| 64 | `TC-TRA-02` | Bảng điểm & Học vụ (TRA)| Tính điểm trung bình tích lũy (CPA) | P0 | Nhiều kỳ học | Khớp công thức CPA toàn khóa | ✅ PASS |
| 65 | `TC-TRA-03` | Bảng điểm & Học vụ (TRA)| Lấy điểm cao nhất khi học cải thiện | P0 | Học lại cải thiện | CPA tính theo điểm cao nhất, không cộng dồn TC| ✅ PASS |
| 66 | `TC-TRA-04` | Bảng điểm & Học vụ (TRA)| Tự động kích hoạt Cảnh báo học vụ Mức 1 | P0 | GPA < 1.0 (kỳ đầu) | Trạng thái cảnh báo Mức 1, gửi thông báo | ✅ PASS |
| 67 | `TC-TRA-05` | Bảng điểm & Học vụ (TRA)| Kích hoạt Cảnh báo Mức 2 và Buộc thôi học | P0 | Bị cảnh báo liên tiếp| Kích hoạt quy chế buộc thôi học | ✅ PASS |
| 68 | `TC-TRA-06` | Bảng điểm & Học vụ (TRA)| Rà soát điều kiện tốt nghiệp tự động | P1 | Đủ tín chỉ CTĐT | Đánh giá đủ/chưa đủ chuẩn tốt nghiệp | ✅ PASS |
| 69 | `TC-RST-01` | Đổi/Quên Mật khẩu (RST)| Gửi yêu cầu quên mật khẩu tài khoản ảo | P1 | Tài khoản không có | HTTP 200 an toàn (chống enumeration tài khoản)| ✅ PASS |
| 70 | `TC-RST-02` | Đổi/Quên Mật khẩu (RST)| Admin duyệt yêu cầu và sinh mật khẩu tạm | P0 | Đơn PENDING | Sinh pass tạm mới, gửi email hoặc thông báo | ✅ PASS |
| 71 | `TC-RST-03` | Đổi/Quên Mật khẩu (RST)| Bắt buộc đổi mật khẩu ở lần đăng nhập đầu | P0 | Vừa reset pass | Buộc đổi pass, chặn truy cập menu khác | ✅ PASS |
| 72 | `TC-RST-04` | Đổi/Quên Mật khẩu (RST)| Admin từ chối yêu cầu cấp lại mật khẩu | P1 | Đơn PENDING | Đơn chuyển REJECTED, ghi nhận lý do | ✅ PASS |
| 73 | `TC-RST-05` | Đổi/Quên Mật khẩu (RST)| Đổi mật khẩu với thanh đo độ mạnh (Policy)| P1 | User đăng nhập | Chặn pass quá ngắn, yêu cầu độ phức tạp | ✅ PASS |
| 74 | `TC-RST-06` | Đổi/Quên Mật khẩu (RST)| Thu hồi JWT cũ ngay sau khi đổi mật khẩu | P0 | Vừa đổi pass thành công| Token cũ bị vô hiệu hóa lập tức | ✅ PASS |
| 75 | `TC-SHIP-01` | Xuất xưởng (SHIP) | Kiểm tra toàn vẹn CSDL và Foreign Keys | P0 | MySQL đang chạy | 100% ràng buộc toàn vẹn quan hệ hoạt động | ✅ PASS |
| 76 | `TC-SHIP-02` | Xuất xưởng (SHIP) | Kiểm tra không tồn tại N+1 Query chậm | P0 | Endpoint danh mục | Truy vấn dùng View/Join, phản hồi < 300ms | ✅ PASS |
| 77 | `TC-SHIP-03` | Xuất xưởng (SHIP) | Kiểm tra Docker Compose khởi động 1-click | P0 | Docker Engine | Backend, Frontend, DB up khỏe mạnh | ✅ PASS |
| 78 | `TC-SHIP-04` | Xuất xưởng (SHIP) | Tải đồng thời 600 sinh viên không nghẽn DB | P0 | Pool HikariCP | Tỷ lệ lỗi 0%, CPU ổn định | ✅ PASS |
| 79 | `TC-SHIP-05` | Xuất xưởng (SHIP) | Quy trình Sao lưu & Phục hồi CSDL (RTO<5m) | P0 | CSDL production | Phục hồi toàn vẹn 100% dữ liệu | ✅ PASS |
| 80 | `TC-SHIP-06` | Xuất xưởng (SHIP) | Ký duyệt Release Gate xuất xưởng | P0 | Toàn bộ tiêu chí | Đạt 100% P0, sẵn sàng nộp đồ án | ✅ PASS |
| 81 | `TC-STATE-01` | Trạng thái (STATE) | Chuyển trạng thái lớp: OPEN -> CLOSED -> ACTIVE -> COMPLETED | P0 | Lớp mới tạo | Luồng chuyển đổi tuần tự hợp lệ | ✅ PASS |
| 82 | `TC-STATE-02` | Trạng thái (STATE) | Chặn nhảy cóc trạng thái lớp học phần | P0 | Lớp OPEN | Chặn nhảy cóc sang ACTIVE/COMPLETED | ✅ PASS |
| 83 | `TC-STATE-03` | Trạng thái (STATE) | Chặn nhập điểm khi lớp chưa đóng đăng ký | P0 | Lớp OPEN/CANCELLED | HTTP 400, không được nhập điểm dở dang | ✅ PASS |
| 84 | `TC-STATE-04` | Trạng thái (STATE) | Đồng bộ trạng thái lớp COMPLETED khi chốt sổ | P0 | Lớp ACTIVE | Tự động chuyển COMPLETED sau khi chốt sổ | ✅ PASS |
| 85 | `TC-STATE-05` | Trạng thái (STATE) | Kiểm soát tài khoản Sinh viên Bảo lưu (SUSPENDED)| P0 | SV bảo lưu | Đăng nhập tra cứu OK, chặn ĐKHP & dịch vụ | ✅ PASS |
| 86 | `TC-STATE-06` | Trạng thái (STATE) | Khóa tài khoản Sinh viên Buộc thôi học (INACTIVE)| P0 | SV thôi học | Khóa `is_active=0`, chặn 100% đăng nhập | ✅ PASS |
| 87 | `TC-TUI-01` | Học phí (TUI) | Tính học phí học kỳ tự động theo tín chỉ | P0 | Đã đăng ký môn | Tổng học phí = Tổng TC × Đơn giá tín chỉ | ✅ PASS |
| 88 | `TC-TUI-02` | Học phí (TUI) | Thu ngân gạch nợ học phí toàn phần tại quầy | P0 | Hóa đơn UNPAID | Chuyển PAID, unpaidAmount = 0, sinh biên lai | ✅ PASS |
| 89 | `TC-TUI-03` | Học phí (TUI) | Chặn thu một phần học phí (Quy chế đóng 100%)| P0 | Nhiều hóa đơn UNPAID| HTTP 400, yêu cầu nộp trọn gói đợt thu | ✅ PASS |
| 90 | `TC-TUI-04` | Học phí (TUI) | Sinh mã biên lai duy nhất và lưu vết thu ngân| P1 | Giao dịch thu hợp lệ| Sinh mã `REC-...`, ghi nhận cán bộ thu | ✅ PASS |
| 91 | `TC-TUI-05` | Học phí (TUI) | Sinh viên nộp đơn xin gia hạn nộp học phí | P1 | Có công nợ kỳ | Đơn PENDING, ghi nhận lý do và số ngày | ✅ PASS |
| 92 | `TC-TUI-06` | Học phí (TUI) | Admin duyệt đơn gia hạn, lùi hạn chót nộp | P0 | Đơn PENDING | Cập nhật tuitionDeadline, trạng thái EXTENDED| ✅ PASS |
| 93 | `TC-TUI-07` | Học phí (TUI) | Quét danh sách sinh viên nợ học phí quá hạn | P0 | Quá hạn nộp | Trả về danh sách nợ quá hạn chính xác | ✅ PASS |
| 94 | `TC-TUI-08` | Học phí (TUI) | Chặn sinh viên nợ quá hạn đăng ký tín chỉ mới| P0 | Trạng thái OVERDUE | HTTP 400, chặn hoàn toàn quyền ĐKHP | ✅ PASS |
| 95 | `TC-TUI-09` | Học phí (TUI) | Khóa tra cứu bảng điểm khi nợ quá hạn | P1 | Trạng thái OVERDUE | Cảnh báo công nợ, ẩn chi tiết điểm | ✅ PASS |
| 96 | `TC-TUI-10` | Học phí (TUI) | Tự dọn dẹp và hoàn nguyên dữ liệu học phí test| P1 | Kết thúc test suite | CSDL nguyên vẹn, không lưu giao dịch rác | ✅ PASS |
| 97 | `TC-ATT-01` | Điểm danh (ATT) | Giảng viên tạo phiên điểm danh theo ca học | P0 | Lớp được phân công | Tạo phiên điểm danh thành công | ✅ PASS |
| 98 | `TC-ATT-02` | Điểm danh (ATT) | Ghi nhận Có mặt / Vắng mặt cho từng sinh viên| P0 | Phiên điểm danh mở | Cập nhật chuyên cần, vắng tăng absenceCount | ✅ PASS |
| 99 | `TC-ATT-03` | Điểm danh (ATT) | Đồng bộ số buổi vắng tức thời sang Cổng SV | P1 | Giảng viên đã lưu | Sinh viên xem thấy ngay số buổi vắng mới | ✅ PASS |
| 100| `TC-ATT-04` | Điểm danh (ATT) | Tự động gắn cờ Cấm thi khi vắng > 20% số tiết | P0 | Vắng quá ngưỡng | `disqualified = true`, hiển thị cảnh báo cấm thi| ✅ PASS |
| 101| `TC-ATT-05` | Điểm danh (ATT) | Chặn nhập điểm thi kết thúc cho SV bị cấm thi | P0 | SV có cờ cấm thi | HTTP 400, từ chối ghi nhận điểm thi | ✅ PASS |
| 102| `TC-ATT-06` | Điểm danh (ATT) | Sinh viên tra cứu lịch sử điểm danh từng buổi | P1 | Sinh viên trong lớp | Xem chi tiết ngày, trạng thái, tỷ lệ tham gia| ✅ PASS |
| 103| `TC-ATT-07` | Điểm danh (ATT) | Admin can thiệp đặc cách gỡ cờ cấm thi | P0 | Có quyết định HĐ | Gỡ cờ cấm thi, cho phép GV nhập điểm thi | ✅ PASS |
| 104| `TC-ATT-08` | Điểm danh (ATT) | Dọn dẹp phiên điểm danh và hoàn nguyên test | P1 | Kết thúc test suite | Hoàn nguyên số buổi vắng về ban đầu | ✅ PASS |
| 105| `TC-APL-01` | Phúc khảo (APL) | Sinh viên nộp đơn phúc khảo trong hạn 7 ngày | P0 | Lớp đã chốt điểm | Đơn PENDING, ghi nhận lý do và điểm mong muốn | ✅ PASS |
| 106| `TC-APL-02` | Phúc khảo (APL) | Chặn nộp đơn khi chưa chốt điểm hoặc quá hạn | P0 | Chưa chốt/quá 7 ngày| HTTP 400, từ chối tiếp nhận đơn | ✅ PASS |
| 107| `TC-APL-03` | Phúc khảo (APL) | Chặn nộp trùng đơn đang PENDING cùng môn học | P1 | Đã có đơn PENDING | HTTP 400, không được gửi trùng đơn | ✅ PASS |
| 108| `TC-APL-04` | Phúc khảo (APL) | Giảng viên/Admin tra cứu danh sách đơn phúc khảo| P0 | GV/Admin token | Trả về danh sách đơn kèm chi tiết điểm | ✅ PASS |
| 109| `TC-APL-05` | Phúc khảo (APL) | Hội đồng duyệt phúc khảo và nâng điểm số mới | P0 | Đơn PENDING | Điểm cập nhật, tính lại điểm tổng kết/chữ | ✅ PASS |
| 110| `TC-APL-06` | Phúc khảo (APL) | Tự động tính lại GPA/CPA ngay sau khi duyệt | P0 | Vừa duyệt nâng điểm | GPA/CPA cập nhật theo điểm mới ngay lập tức | ✅ PASS |
| 111| `TC-APL-07` | Phúc khảo (APL) | Hội đồng từ chối đơn phúc khảo và giữ nguyên điểm| P1 | Đơn PENDING | Trạng thái REJECTED, điểm số gốc giữ nguyên | ✅ PASS |
| 112| `TC-APL-08` | Phúc khảo (APL) | Dọn dẹp đơn phúc khảo test và hoàn nguyên điểm | P1 | Kết thúc test suite | Điểm và CSDL trở về nguyên bản | ✅ PASS |
| 113| `TC-CLS-01` | Lớp đặc biệt (CLS)| Sinh viên gửi đơn đề nghị mở lớp học phần | P1 | SV cần học trả nợ | Đơn PENDING được ghi nhận | ✅ PASS |
| 114| `TC-CLS-02` | Lớp đặc biệt (CLS)| Admin tạo lớp đặc biệt với đơn giá học phí riêng| P0 | Admin token | Lớp tạo thành công với baseTuitionRate riêng | ✅ PASS |
| 115| `TC-CLS-03` | Lớp đặc biệt (CLS)| Chặn tạo lớp khi minStudents > maxStudents | P0 | Admin token | HTTP 400, lỗi cấu hình sĩ số | ✅ PASS |
| 116| `TC-CLS-04` | Lớp đặc biệt (CLS)| Tự động cảnh báo lớp không đạt sĩ số tối thiểu | P1 | Cổng ĐKHP đóng | Cảnh báo lớp không đủ minStudents để điều phối| ✅ PASS |
| 117| `TC-CLS-05` | Lớp đặc biệt (CLS)| Chốt danh sách và phát sinh hóa đơn học phí | P0 | Admin token | Tự động phát sinh hóa đơn cho toàn bộ SV | ✅ PASS |
| 118| `TC-CLS-06` | Lớp đặc biệt (CLS)| Dọn dẹp và xóa lớp học phần đặc biệt test | P1 | Kết thúc test suite | Xóa lớp đặc biệt và các dữ liệu liên quan | ✅ PASS |

---

## 🛠️ HƯỚNG DẪN THỰC THI BỘ TEST CASES TRÊN HỆ THỐNG

### 1. Thực thi tự động trên môi trường Windows (Khuyên dùng)
Tại thư mục gốc dự án:
```cmd
run_tests.bat
```
- Nhấn phím `1`: Chạy toàn bộ suite kiểm thử tự động toàn diện.
- Nhấn phím `2`: Chạy suite kiểm thử quá tải, tranh chấp đăng ký (Stress & Concurrency).
- Nhấn phím `3`: Chạy suite kiểm thử nhanh tích hợp E2E.

### 2. Thực thi qua dòng lệnh Node.js
```bash
# Kiểm thử toàn diện các nhóm bảo mật, RBAC, đào tạo, điểm và mật khẩu:
node tests/e2e/comprehensive_system_test.js

# Kiểm thử hiệu năng và tranh chấp đồng thời:
node tests/performance/overload_stress_test.js

# Kiểm tra tích hợp import điểm Excel:
node tests/integration/test_excel_import_flow.js

# Kiểm thử luồng trạng thái (State Transition Rules) & Access Control:
node tests/e2e/test_state_transition_rules.js
```

### 3. Thực thi Unit Test tầng Backend (Spring Boot)
```bash
cd backend
./mvnw.cmd test

# Chạy riêng bộ kiểm thử luồng trạng thái:
./mvnw.cmd test -Dtest=StateTransitionRulesTest
```
