# 💻 FRONTEND - CỔNG THÔNG TIN QUẢN LÝ ĐÀO TẠO (SMS)
**React 19 · Vite 8 · Tailwind CSS · Zustand · Single Page Application**

Tầng Frontend cung cấp giao diện người dùng (UI/UX) cho cả 3 phân hệ: Quản trị viên Phòng Đào Tạo, Giảng viên và Sinh viên.

---

## 🛠️ Công nghệ cốt lõi

* **Framework:** React 19 (Hooks, Suspense, Concurrent Mode)
* **Build Tool:** Vite 8 (Hot Module Replacement siêu tốc)
* **Styling:** Tailwind CSS, CSS Variables (hỗ trợ Light / Dark Mode)
* **Quản lý trạng thái:** Zustand (Stores: `authStore`, `themeStore`)
* **Giao tiếp mạng:** Axios (kèm Interceptor tự động refresh JWT token khi hết hạn)
* **Icons & UI:** Lucide React Icons
* **Kiểm thử:** Vitest + React Testing Library

---

## 📁 Cấu trúc mã nguồn

```text
frontend/
├── src/
│   ├── components/         # Các thành phần giao diện tái sử dụng
│   │   ├── common/         #   Skeleton loader, ErrorBoundary, Modal đổi mật khẩu, Logo
│   │   └── layout/         #   Header, Sidebar đa phân hệ, Layout bọc ngoài
│   ├── pages/              # Màn hình chức năng theo từng phân hệ người dùng
│   │   ├── admin/          #   Quản lý CTĐT, Khoa, Ngành, Môn học, Lớp HP, TKB, Cảnh báo học vụ
│   │   ├── lecturer/       #   Lịch dạy tuần, Vào điểm trực tuyến, Import Excel, Điểm danh
│   │   ├── student/        #   Cổng đăng ký tín chỉ, Xem TKB tuần, Bảng điểm GPA/CPA, Lộ trình CTĐT
│   │   ├── auth/           #   Trang đăng nhập thống nhất Portal, Portal Hub
│   │   └── shared/         #   Trang phúc khảo điểm số dùng chung
│   ├── services/           # Lớp kết nối HTTP Axios (`api.js`) & Business Data Services (`dataService.js`)
│   ├── store/              # Zustand state stores: Quản lý phiên đăng nhập (`authStore`), Theme (`themeStore`)
│   └── utils/              # Tiện ích: Format nhãn dữ liệu, tính điểm, xuất file
├── public/                 # Favicon, assets tĩnh
├── nginx.conf              # Cấu hình Web Server Nginx khi đóng gói Docker
├── vite.config.js          # Cấu hình Vite, alias và reverse proxy tới Backend
└── package.json            # Khai báo thư viện và scripts
```

---

## ⚡ Hướng dẫn khởi chạy

### Yêu cầu:
* Node.js phiên bản 20 trở lên.
* npm hoặc pnpm.

### Cài đặt thư viện:
```bash
cd frontend
npm install
```

### Chạy môi trường phát triển (Dev Server):
```bash
npm run dev
```
> Ứng dụng khởi chạy tại: `http://localhost:5173`  
> Tự động proxy các cuộc gọi API `/api/*` tới Backend `http://localhost:8080`.

### Chạy kiểm thử tự động:
```bash
npm test
```

### Đóng gói ứng dụng (Production Build):
```bash
npm run build
```
