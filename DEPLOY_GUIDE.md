# 🚀 CẨM NANG HƯỚNG DẪN TRIỂN KHAI & VẬN HÀNH (DEPLOYMENT GUIDE)
## HỆ THỐNG QUẢN LÝ ĐÀO TẠO & SINH VIÊN (SMS / UAMS)
> **Tài liệu tham chiếu chi tiết:** [`docs/08_deployment_and_operations_guide.md`](docs/08_deployment_and_operations_guide.md)  
> **Dự án:** Hệ Thống Quản Lý Đào Tạo & Sinh Viên (Phenikaa SMS / DoAnChuyenNganh)  
> **Tác giả:** Nguyễn Duy Minh (MSV: 21010696) · Khoa Công Nghệ Thông Tin · Đại học Phenikaa

---

## 📑 Mục lục
1. [Yêu cầu tiên quyết & Cổng dịch vụ](#1-yêu-cầu-tiên-quyết--cổng-dịch-vụ)
2. [Phương thức 1: Khởi động 1-Click trên Windows (Khuyên dùng khi Dev)](#2-phương-thức-1-khởi-động-1-click-trên-windows-khuyên-dùng-khi-dev)
3. [Phương thức 2: Chạy chế độ Tiết kiệm RAM qua Docker (< 600MB)](#3-phương-thức-2-chạy-chế-độ-tiết-kiệm-ram-qua-docker--600mb)
4. [Phương thức 3: Chạy chế độ Cluster Demo (3 Backends + Nginx Load Balancing)](#4-phương-thức-3-chạy-chế-độ-cluster-demo-3-backends--nginx-load-balancing)
5. [Phương thức 4: Bật Dashboard Demo Tải đồng thời (Port 5050)](#5-phương-thức-4-bật-dashboard-demo-tải-đồng-thời-port-5050)
6. [Phương thức 5: Chia sẻ ra Internet qua HTTPS Tunnel](#6-phương-thức-5-chia-sẻ-ra-internet-qua-https-tunnel)
7. [Tài khoản kiểm thử mặc định](#7-tài-khoản-kiểm-thử-mặc-định)
8. [Xử lý sự cố thường gặp (Troubleshooting)](#8-xử-lý-sự-cố-thường-gặp-troubleshooting)

---

## 1. Yêu cầu tiên quyết & Cổng dịch vụ

### Phần mềm yêu cầu:
* **Java 23 JDK** & **Node.js 20+**
* **Docker Desktop** (nếu chạy qua Docker)
* **MySQL 8.0** & **Redis 7** (nếu chạy thủ công không qua container)

### Bảng phân bổ Cổng mạng (Network Port Map):
| Dịch vụ | Cổng Localhost | Cổng Container | Mô tả |
| :--- | :---: | :---: | :--- |
| **Frontend Web SPA** | `5173` / `80` | `80` | Giao diện React Single Page Application (Nginx) |
| **Backend API (Spring Boot)** | `8080` | `8080` | Máy chủ RESTful API & Swagger UI |
| **MySQL Database** | `3306` (Local) / `3308` (Docker) | `3306` | CSDL quan hệ chính |
| **Redis Cache & Lock** | `6379` | `6379` | Khóa phân tán & Bộ đếm sĩ số nguyên tử |
| **Concurrency Dashboard** | `5050` | — | Bảng điều khiển kiểm thử tải 100 sinh viên trực quan |

---

## 2. Phương thức 1: Khởi động 1-Click trên Windows (Khuyên dùng khi Dev)

Dành cho lập trình viên phát triển tính năng mới trực tiếp trên máy cục bộ:
```cmd
start_dev.bat
```
* Script tự động kiểm tra cổng MySQL, đồng thời mở song song 2 cửa sổ chạy máy chủ Backend (Spring Boot: `http://localhost:8080`) và Frontend (Vite: `http://localhost:5173`).
* Hỗ trợ Hot Reloading: Lưu code là giao diện và API tự động cập nhật ngay lập tức.

---

## 3. Phương thức 2: Chạy chế độ Tiết kiệm RAM qua Docker (< 600MB)

Dành cho máy tính cá nhân cấu hình vừa phải, chỉ chạy 1 Backend duy nhất:
```cmd
bat_tiet_kiem_ram.bat
```
*(Hoặc lệnh CLI: `docker compose up -d --remove-orphans`)*

### Các thành phần khởi chạy:
* `student_management_db` (MySQL 8.0 tối ưu `innodb_buffer_pool_size=128M`)
* `student_management_redis` (Redis 7 Alpine siêu nhẹ)
* `student_management_backend_1` (Spring Boot cấp phát tối đa `-Xmx384m`)
* `student_management_frontend` (Nginx tĩnh)

---

## 4. Phương thức 3: Chạy chế độ Cluster Demo (3 Backends + Nginx Load Balancing)

Dành cho buổi bảo vệ đồ án, kiểm thử chịu tải cao và demo kiến trúc vi mô phân tán:
```cmd
bat_cluster_demo.bat
```
*(Hoặc lệnh CLI: `docker compose -f docker-compose.yml -f docker-compose.cluster.yml up -d`)*

### Các thành phần khởi chạy:
* Nginx Reverse Proxy tiếp nhận request tại cổng `80` / `5173` / `8080` và tự động cân bằng tải Round-Robin qua:
  * `student_management_backend_1`
  * `student_management_backend_2`
  * `student_management_backend_3`
* Cả 3 instances cùng chia sẻ một Redis 7 phục vụ phân tán khóa (`RedisLockService`) và MySQL 8.0.

---

## 5. Phương thức 4: Bật Dashboard Demo Tải đồng thời (Port 5050)

Khởi chạy bảng điều khiển trực quan theo dõi 100 sinh viên đồng thời ghi danh:
```bash
node tests/performance/demo_100/server.js
```
* **Địa chỉ truy cập:** `http://localhost:5050`
* Bấm nút **"Bắt Đầu Kiểm Thử Tải"** trên màn hình để quan sát biểu đồ Waterfall và minh chứng không vượt sĩ số.

---

## 6. Phương thức 5: Chia sẻ ra Internet qua HTTPS Tunnel

Chia sẻ toàn bộ hệ thống ra mạng Internet công cộng mà không cần cấu hình NAT/Port Forwarding:
```cmd
share_internet.bat
```
* Script sử dụng công nghệ Cloudflare Tunnel / Localtunnel an toàn.
* Tự động sinh đường dẫn HTTPS công khai để gửi cho thầy cô hoặc bạn bè dùng thử trên điện thoại.

---

## 7. Tài khoản kiểm thử mặc định

Mật khẩu dùng chung cho tất cả các tài khoản demo: **`123456`**

* **Quản trị hệ thống (Admin):** `admin`
* **Chuyên viên Học vụ (Academic Affairs):** `academic_affairs`
* **Cán bộ Khảo thí (Examination Officer):** `exam_officer`
* **Giảng viên đại diện CNTT:** `gv_gv001`
* **Sinh viên K16 CNTT (Năm cuối):** `sv_cntt_k16` (hoặc mã SV `21010001`)
* **Sinh viên K17 QTKD (Năm ba):** `sv_qtkd_k17` (hoặc mã SV `22010001`)
* **Sinh viên K18 ĐTVT (Năm hai):** `sv_dtvt_k18` (hoặc mã SV `23010001`)
* **Sinh viên K19 Dược học (Năm nhất):** `sv_yd_k19` (hoặc mã SV `24010001`)

---

## 8. Xử lý sự cố thường gặp (Troubleshooting)

### 1. Trùng cổng mạng (Port Conflict 3306 hoặc 8080)
* **Nguyên nhân:** Máy chủ đã có sẵn dịch vụ MySQL hoặc Tomcat nội bộ đang chạy ngầm.
* **Cách khắc phục:**
  * Trong `docker-compose.yml`, cổng MySQL đã được ánh xạ ra cổng ngoài `3308:3306` để tránh xung đột với MySQL gốc trên máy.
  * Nếu cổng 8080 bị chiếm, kiểm tra ứng dụng đang chiếm cổng bằng:
    ```cmd
    netstat -ano | findstr :8080
    ```

### 2. Dữ liệu chưa khởi tạo (Empty Database)
* **Khắc phục:** Khi chạy lần đầu, container MySQL tự động nạp `database/schema.sql` và `database/seed.sql`. Nếu cần nạp lại từ đầu:
  ```cmd
  docker compose down -v
  docker compose up -d
  ```

---
<div align="center">
  <sub>Hệ Thống Quản Lý Đào Tạo & Sinh Viên (SMS) · Đại học Phenikaa · 2026</sub>
</div>
