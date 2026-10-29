# 🚀 CẨM NANG HƯỚNG DẪN TRIỂN KHAI & CHIA SẺ TRUY CẬP (DEPLOYMENT GUIDE)

> **Tài liệu đặc tả chi tiết đầy đủ:** [docs/08_deployment_and_operations_guide.md](docs/08_deployment_and_operations_guide.md)  
> **Dự án:** Hệ Thống Quản Lý Đào Tạo & Sinh Viên (Phenikaa SMS / DoAnChuyenNganh)  
> **Tác giả:** Nguyễn Duy Minh (MSV: 21010696)

---

## ⚡ 1-Click Khởi Động Nhanh (Windows)

1. **Khởi động toàn bộ dịch vụ (MySQL + Backend + Frontend):**
   ```cmd
   start_dev.bat
   ```
   * Frontend: `http://localhost:5173`
   * Backend REST API: `http://localhost:8080/api`
   * Swagger / OpenAPI Docs: `http://localhost:8080/swagger-ui/index.html`

2. **Chia sẻ ra Internet (Public HTTPS Tunnel qua Cloudflare / Localtunnel):**
   ```cmd
   share_internet.bat
   ```

3. **Chạy bộ kiểm thử tự động toàn diện (Test Suite):**
   ```cmd
   run_tests.bat
   ```

---

## 📑 Các phương thức triển khai chi tiết

Chi tiết toàn bộ quy trình cấu hình, biến môi trường, tài khoản kiểm thử mặc định và kiến trúc Docker Compose vui lòng xem tài liệu chính thức:

👉 **[Xem chi tiết tại docs/08_deployment_and_operations_guide.md](docs/08_deployment_and_operations_guide.md)**
