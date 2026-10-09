# 🛠️ CÔNG CỤ & TIỆN ÍCH DỰ ÁN (PROJECT SCRIPTS)
**Hệ thống Quản lý Đào tạo & Sinh viên (SMS / DoAnChuyenNganh)**

Thư mục `scripts/` chứa các kịch bản tự động hóa phục vụ chụp ảnh giao diện tự động, chuyển đổi định dạng tài liệu, và các tiện ích vận hành đồ án.

---

## 📁 Danh mục kịch bản

| Tên kịch bản | Ngôn ngữ | Chức năng chính | Cách chạy |
|:---|:---|:---|:---|
| `capture_screenshots.mjs` | Node.js (ESM) | Tự động đăng nhập và chụp ảnh toàn bộ các màn hình chính (Dashboard, TKB, Bảng điểm...) qua Headless Chrome | `node scripts/capture_screenshots.mjs` |
| `convert_to_jpg.ps1` | PowerShell | Chuyển đổi hàng loạt ảnh chụp giao diện từ PNG sang JPG phục vụ chèn vào tài liệu Word/Báo cáo đồ án | `powershell -File scripts/convert_to_jpg.ps1` |
