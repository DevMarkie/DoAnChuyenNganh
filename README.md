# HỆ THỐNG QUẢN LÝ SINH VIÊN (Student Management System)

Đồ Án Chuyên Ngành - Hệ Thống Quản Lý Đào Tạo & Sinh Viên theo Quy Chế Tín Chỉ.

---

## 📌 Tổng Quan Hệ Thống

Hệ thống quản lý sinh viên được xây dựng nhằm tin học hóa và tối ưu quy trình quản lý học tập, giảng dạy và vận hành đào tạo trong trường đại học theo học chế tín chỉ.

Hệ thống bao gồm 3 phân hệ người dùng chính:
1. **Quản trị viên (Admin):** Quản lý người dùng, phân quyền, quản lý khoa, ngành, lớp học, học phần, lớp học phần, phòng học, học kỳ và cấu hình thời gian đăng ký tín chỉ.
2. **Giảng viên (Lecturer):** Xem lịch giảng dạy, danh sách sinh viên theo lớp học phần, nhập và khóa điểm (chuyên cần, giữa kỳ, cuối kỳ) theo thang điểm quy chuẩn.
3. **Sinh viên (Student):** Tra cứu chương trình đào tạo, đăng ký môn học/học phần trực tuyến, xem thời khóa biểu, tra cứu điểm số và bảng điểm tích lũy theo chuẩn tín chỉ (thang điểm 10, thang điểm 4, thang điểm chữ A-B-C-D-F).

---

## 🛠️ Công Nghệ Sử Dụng

### Backend
- **Ngôn ngữ:** Java 21
- **Framework:** Spring Boot 3.2.0 (Spring Data JPA, Spring Security, Spring Validation, Spring Web)
- **Authentication & Authorization:** JWT (JSON Web Token - `io.jsonwebtoken 0.12.6`), Role-based access control (RBAC)
- **Database:** MySQL 8.x
- **Connection Pool:** HikariCP
- **Documentation:** SpringDoc OpenAPI / Swagger UI 3.0 (`/swagger-ui.html`)
- **Build Tool:** Maven

### Frontend
- **Framework:** React 19 (Vite)
- **Routing:** React Router v7
- **State Management:** Zustand
- **Styling & UI:** Modern Vanilla CSS + Bootstrap 5 / React Bootstrap, Lucide Icons
- **HTTP Client:** Axios (Interceptors, Token refresh/handling)
- **Charts:** Recharts
- **Notifications:** React-Toastify

### Tài liệu & Thiết kế
- Phân tích yêu cầu nghiệp vụ (Business Analysis Specification)
- Tài liệu mô hình hóa UML (Use Case, Activity, Class BCE, Sequence Diagrams trên Draw.io)
- Báo cáo đồ án (`PTTKPM_MauBaoCao_Ph.docx`)

---

## 📂 Cấu Trúc Thư Mục

```text
DoAnChuyenNganh/
├── backend/                  # Mã nguồn Spring Boot Backend
│   ├── src/main/java/com/sms/...
│   ├── src/main/resources/application.properties
│   └── pom.xml
├── frontend/                 # Mã nguồn React Frontend (Vite)
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── database/                 # Script khởi tạo và dữ liệu mẫu CSDL
│   ├── schema.sql            # Cấu trúc bảng, khóa ngoại, ràng buộc
│   ├── seed.sql              # Dữ liệu khởi tạo mẫu
│   ├── generate_clean_seed.js
│   └── import_seed.js
├── docs/                     # Tài liệu nghiệp vụ & biểu đồ thiết kế UML
│   ├── BA_BUSINESS_PROCESS_SPECIFICATION.md
│   └── *.drawio              # Các sơ đồ UseCase, Sequence, Activity, BCE
├── docker-compose.yml        # Cấu hình container dịch vụ
├── .gitignore                # Cấu hình bỏ qua file rác, build & dependencies
└── README.md
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy Dự Án

### Cách 1: Khởi chạy nhanh 1-Click (Khuyên dùng trên Windows)
- Nhấp đúp chuột vào file **`start_dev.bat`** tại thư mục gốc. Hệ thống sẽ tự động khởi động Database, Spring Boot Backend và React Frontend.

### Cách 2: Chạy trọn gói bằng Docker Compose
Chỉ cần một câu lệnh duy nhất (đã bao gồm MySQL tự nạp CSDL, Backend và Frontend Nginx):
```bash
docker compose up --build -d
```
- Giao diện người dùng: `http://localhost:5173` hoặc `http://localhost`
- Tài liệu API (Swagger UI): `http://localhost:8080/swagger-ui.html`

### Cách 3: Khởi chạy thủ công từng phần
1. **Yêu cầu môi trường:** Java 21+, Node.js 18+, MySQL 8.0+.
2. **Khởi động Database:** Chạy file [schema.sql](database/schema.sql) và [seed.sql](database/seed.sql) trong thư mục `database/`.
3. **Chạy Backend:**
   ```bash
   cd backend
   mvnw.cmd spring-boot:run
   ```
4. **Chạy Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

> 📖 **Xem hướng dẫn chi tiết về chia sẻ qua mạng LAN, Internet Tunnel và Cloud Deployment tại [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md).**

---

## 🔐 Tài Khoản Mẫu Đăng Nhập Mặc Định

| Vai trò | Tên đăng nhập | Mật khẩu mặc định | Ghi chú |
|---|---|---|---|
| **Admin** | `admin` | `123456` | Toàn quyền quản trị hệ thống |
| **Giảng viên** | `1000001` | `123456` | Mã GV từ `1000001` đến `1000015` |
| **Sinh viên** | `2500001` | `123456` | Mã SV từ `2500001` đến `2500150` |
