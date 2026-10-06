# HỆ THỐNG QUẢN LÝ SINH VIÊN (Student Management System)

Đồ Án Chuyên Ngành - Hệ Thống Quản Lý Đào Tạo & Sinh Viên theo Quy Chế Tín Chỉ.

---

## 📌 Tổng Quan Hệ Thống

Hệ thống quản lý sinh viên được xây dựng nhằm tin học hóa và tối ưu quy trình quản lý học tập, giảng dạy và vận hành đào tạo trong trường đại học theo học chế tín chỉ.

Hệ thống bao gồm 3 phân hệ người dùng chính:

1. **Quản trị viên (Admin):** Quản lý người dùng, phân quyền, quản lý khoa, ngành, lớp học, học phần, lớp học phần, phòng học, học kỳ và cấu hình thời gian đăng ký tín chỉ.
2. **Giảng viên (Lecturer):** Xem lịch giảng dạy, danh sách sinh viên theo lớp học phần, nhập và khóa điểm (chuyên cần, giữa kỳ, cuối kỳ) theo thang điểm quy chuẩn.
3. **Sinh viên (Student):** Tra cứu chương trình đào tạo, đăng ký môn học/học phần trực tuyến, xem thời khóa biểu, tra cứu điểm số và bảng điểm tích lũy theo chuẩn tín chỉ (thang điểm 10, thang điểm 4, thang điểm chữ A-B-C-D-F).

### 🗺️ Sơ đồ Use Case Tổng Quan

```mermaid
flowchart LR
    Admin(["🧑‍💼 Admin / Phòng Đào tạo"])
    Lecturer(["👨‍🏫 Giảng viên"])
    Student(["🎓 Sinh viên"])

    subgraph Quản_Lý_Hệ_Thống ["Hệ thống Quản lý Sinh viên (SMS)"]
        UC1(["Quản lý Môn học & Mở lớp"])
        UC2(["Xếp Thời khóa biểu & Phòng học"])
        UC3(["Đăng ký Tín chỉ & Hủy môn"])
        UC4(["Quản lý & Cập nhật Điểm số"])
    end

    Admin --> UC1
    Admin --> UC2
    Admin --> UC4
    Lecturer --> UC4
    Student --> UC3
    Student --> UC4
```

---

## 🛠️ Công Nghệ Sử Dụng

### Backend

- **Ngôn ngữ:** Java 23
- **Framework:** Spring Boot 3.5.6 (Spring Data JPA, Spring Security, Spring Validation, Spring Web)
- **Authentication & Authorization:** JWT (JSON Web Token - `io.jsonwebtoken 0.12.6`), Role-based access control (RBAC)
- **Database:** MySQL 8.x
- **Connection Pool:** HikariCP
- **Documentation:** SpringDoc OpenAPI / Swagger UI 3.0 (`/swagger-ui.html`)
- **Build Tool:** Maven

### Frontend

- **Framework:** React 19 (Vite)
- **Routing:** React Router v7
- **State Management:** Zustand
- **Styling & UI:** Modern Vanilla CSS (Glassmorphism, Dark/Light Theme), Lucide Icons
- **HTTP Client:** Axios (Interceptors, Token refresh/handling)
- **Charts:** Recharts
- **Notifications:** React-Toastify

### Tài liệu & Thiết kế

- Phân tích yêu cầu nghiệp vụ (Business Analysis Specification)
- Tài liệu mô hình hóa UML (Use Case, Activity, Class BCE, Sequence Diagrams trên Draw.io)
- Báo cáo đồ án (`PTTKPM_MauBaoCao_Ph.docx`)

---

## 📂 Cấu Trúc Thư Mục Dự Án Chuẩn Hóa

```text
DoAnChuyenNganh/
├── backend/                  # Mã nguồn Spring Boot 3 Backend (Java 23)
│   ├── src/main/java/com/sms/...
│   ├── src/main/resources/application.properties
│   └── pom.xml
├── frontend/                 # Mã nguồn React 19 Frontend (Vite)
│   ├── src/
│   │   ├── components/       # Layout, Header, Sidebar, ErrorBoundary
│   │   ├── pages/            # Admin, Lecturer, Student, Auth (với barrel exports index.js)
│   │   ├── services/         # Axios API & Data Services
│   │   ├── store/            # Zustand State Stores (Auth, Theme)
│   │   └── utils/            # Nhãn quy chuẩn điểm & học phần
│   ├── package.json
│   └── vite.config.js
├── database/                 # Cơ sở dữ liệu MySQL chuẩn hóa
│   ├── schema.sql            # Master DDL (20 bảng, Khóa ngoại, Trigger, View, Index)
│   ├── seed.sql              # Dữ liệu khởi tạo chuẩn (600 SV, 25 GV, 35 Môn, 50 LHP, 4 Học kỳ)
│   └── migrations/           # Lịch sử các migration gia số
├── docs/                     # Bộ tài liệu phân tích nghiệp vụ & thiết kế chuẩn BA
│   ├── README.md             # Mục lục tra cứu tài liệu hệ thống
│   ├── 01_system_architecture_and_diagrams.md
│   ├── 02_use_case_catalog.md
│   ├── 03_use_case_specifications/
│   ├── 04_business_rules.md
│   ├── 05_database_erd.md
│   ├── 06_academic_curriculum_catalog.md
│   ├── 07_academic_curriculum_migration_plan.md
│   └── TAI_LIEU_TONG_QUAN_DU_AN.md
├── drawio/                   # Các sơ đồ thiết kế UML nguyên bản
│   ├── UseCase_Diagrams.drawio
│   ├── Sequence_Diagrams.drawio
│   ├── Activity_Diagrams.drawio
│   ├── AnalysisClass_BCE_Diagrams.drawio
│   └── scripts/              # Bộ script Python tự động hóa sinh sơ đồ
├── reports/                  # Báo cáo tiến độ & mẫu báo cáo đồ án (.docx)
├── tests/                    # Bộ kịch bản & báo cáo kiểm thử tự động (E2E, Stress, Security)
│   ├── system_e2e_test.js
│   ├── comprehensive_system_test.js
│   ├── overload_stress_test.js
│   └── *.md                  # Báo cáo kiểm thử chi tiết
├── docker-compose.yml        # Cấu hình cụm dịch vụ Docker
├── start_dev.bat             # 1-Click khởi động toàn bộ môi trường phát triển
├── run_tests.bat             # Menu 1-Click thực thi các bộ kiểm thử
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

1. **Yêu cầu môi trường:** Java 23+, Node.js 18+, MySQL 8.0+.
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

| Vai trò        | Tên đăng nhập | Mật khẩu mặc định | Ghi chú                          |
| -------------- | ------------- | ----------------- | -------------------------------- |
| **Admin**      | `admin`       | `123456`          | Toàn quyền quản trị hệ thống     |
| **Giảng viên** | `1000001`     | `123456`          | 25 Giảng viên từ `1000001` đến `1000025`         |
| **Sinh viên**  | `2300001`     | `123456`          | Khóa K17 đầy đủ điểm & GPA (hoặc K19 `2500001`)   |
