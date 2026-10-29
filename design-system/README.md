# 🎨 HỆ THỐNG THIẾT KẾ GIAO DIỆN (PHENIKAA SMS DESIGN SYSTEM)
## APPLE VISION & AURORA GLASSMORPHISM DESIGN SPECIFICATION
> **Mục tiêu:** Định hình tiêu chuẩn giao diện người dùng nhất quán, hiện đại, dễ tiếp cận và đậm chất học thuật công nghệ  
> **Phong cách cốt lõi:** Apple Vision Glassmorphism (Backdrop blur, multi-layered depth, micro-borders) kết hợp Aurora Accents  
> **Tài liệu quy chuẩn chi tiết:** [`MASTER.md`](MASTER.md)  
> **Tác giả:** Nguyễn Duy Minh (MSV: 21010696) · Khoa Công Nghệ Thông Tin · Đại học Phenikaa

---

## 📑 Mục lục
1. [Triết lý Thiết kế & Tầm nhìn UX](#1-triết-lý-thiết-kế--tầm-nhìn-ux)
2. [Cấu trúc Thư mục `design-system/`](#2-cấu-trúc-thư-mục-design-system)
3. [Hệ thống Bảng màu & Design Tokens](#3-hệ-thống-bảng-màu--design-tokens)
4. [Quy chuẩn Typography & Thang khoảng cách](#4-quy-chuẩn-typography--thang-khoảng-cách)
5. [Hiệu ứng Kính mờ Glassmorphism & Lớp chiều sâu (Elevation)](#5-hiệu-ứng-kính-mờ-glassmorphism--lớp-chiều-sâu-elevation)
6. [Quy tắc áp dụng cho Linh kiện Giao diện (Component Specifications)](#6-quy-tắc-áp-dụng-cho-linh-kiện-giao-diện-component-specifications)
7. [Hướng dẫn Ánh xạ vào Tailwind CSS trong `frontend/`](#7-hướng-dẫn-ánh-xạ-vào-tailwind-css-trong-frontend)

---

## 1. Triết lý Thiết kế & Tầm nhìn UX

Hệ thống thiết kế **Phenikaa SMS Design System** được xây dựng nhằm mang đến trải nghiệm phần mềm quản lý học vụ thế hệ mới:
* **Loại bỏ sự khô cứng của phần mềm hành chính truyền thống:** Thay thế các bảng biểu xám xịt bằng các thẻ kính mờ có chiều sâu, viền phát quang vi mô và bố cục phân lớp thoáng đãng.
* **Tối ưu hóa độ tập trung (High Information Density without Clutter):** Phân cấp thông tin bằng độ tương phản màu sắc và trọng lượng font chữ (font weights), giúp sinh viên và giảng viên tiếp nhận khối lượng dữ liệu lớn mà không bị mỏi mắt.
* **Đồng bộ đa nền tảng & Đa chủ đề:** Hỗ trợ hoàn hảo cả hai giao diện **Dark Mode** (tối sâu thẳm, dịu mắt khi làm việc ban đêm) và **Light Mode** (sáng trong trẻo, tiêu chuẩn phòng đào tạo).

---

## 2. Cấu trúc Thư mục `design-system/`

```text
design-system/
├── MASTER.md          # Sổ tay quy chuẩn toàn diện: Bảng màu, Typography, Spacing, Shadows, Buttons, Cards, Inputs
├── README.md          # Tài liệu tổng quan chỉ dẫn này
├── pages/             # Các cấu hình bố cục chuyên biệt ghi đè cho từng màn hình
│   └── dashboard.md   # Thiết kế chi tiết cho bảng điều khiển trung tâm (Dashboard Metrics, Grid layout)
└── prototypes/        # Các bản mẫu giao diện tĩnh (HTML/CSS) thực nghiệm trước khi tích hợp vào React
```

---

## 3. Hệ thống Bảng màu & Design Tokens

Bảng màu được định nghĩa theo chuẩn semantic tokens và có sẵn dưới dạng biến CSS:

| Nhóm Token | Tên biến CSS | Mã màu Hex | Ý nghĩa & Vùng áp dụng |
| :--- | :--- | :---: | :--- |
| **Primary** | `--color-primary` | `#2563EB` | Màu xanh hoàng gia Phenikaa (Trust Blue), dùng cho Header, nút chính và thanh điều hướng. |
| **Secondary** | `--color-secondary` | `#3B82F6` | Màu xanh lam thứ cấp cho các nút phụ, huy hiệu thông tin và trạng thái kích hoạt. |
| **Accent / CTA** | `--color-accent` | `#EA580C` | Màu cam năng động tạo điểm nhấn kêu gọi hành động (Call To Action), nút Đăng ký môn. |
| **Background (Light)** | `--color-background` | `#F8FAFC` | Nền sáng ngọc trai chống chói cho giao diện ban ngày. |
| **Background (Dark)** | `--color-bg-dark` | `#0A0E1A` | Nền tối sâu thẳm kết hợp ánh sáng cực quang mờ (Aurora glow). |
| **Foreground** | `--color-foreground` | `#1E293B` | Màu chữ chính, tương phản cao, chuẩn công thái học thị giác. |
| **Muted** | `--color-muted` | `#E9EFF8` | Nền phụ mờ cho bảng biểu, thanh tìm kiếm và thẻ ghi chú. |
| **Border** | `--color-border` | `#E2E8F0` | Viền ngăn cách nhẹ nhàng 1px giữa các phân vùng nội dung. |
| **Destructive** | `--color-destructive` | `#DC2626` | Cảnh báo nguy hiểm: Hủy học phần, xóa dữ liệu, cảnh báo học vụ Mức 2. |

---

## 4. Quy chuẩn Typography & Thang khoảng cách

### Typography:
* **Họ phông chữ:** `Plus Jakarta Sans` (Google Fonts) — phông chữ hình học hiện đại, hỗ trợ hiển thị sắc nét ký tự tiếng Việt và chữ số trong bảng điểm.
* **Quy chuẩn kích thước:**
  * `Heading 1`: 28px – 32px (Bold 700)
  * `Heading 2`: 22px – 24px (Semi-bold 600)
  * `Heading 3`: 18px – 20px (Medium 500)
  * `Body Text`: 14px – 15px (Regular 400, Line-height 1.5)
  * `Caption / Microcopy`: 12px – 13px (Muted 400)

### Thang khoảng cách (Spacing Scale):
* `xs`: 4px | `sm`: 8px | `md`: 16px (khoảng cách chuẩn) | `lg`: 24px | `xl`: 32px | `2xl`: 48px

---

## 5. Hiệu ứng Kính mờ Glassmorphism & Lớp chiều sâu (Elevation)

Đặc trưng nhận diện trực quan của hệ thống là hiệu ứng phản chiếu bề mặt kính mờ nhiều lớp:

```css
/* Lớp kính mờ tiêu chuẩn của hệ thống */
.glass-panel {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
}

/* Lớp kính mờ trong chế độ Dark Mode */
.dark .glass-panel {
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
```

---

## 6. Quy tắc áp dụng cho Linh kiện Giao diện (Component Specifications)

### 1. Nút bấm tương tác (Buttons):
* **Nút chính (Primary CTA):** Nền cam `#EA580C` hoặc xanh `#2563EB`, bo góc tròn 8px (`rounded-lg`), hiệu ứng nhấc nổi nhẹ (`transform: translateY(-1px)`) và bóng đổ khi hover.
* **Nút phụ (Secondary):** Nền trong suốt viền mỏng, đổi màu nền nhẹ nhàng khi di chuột qua.

### 2. Thẻ dữ liệu (Cards & Panels):
* Mọi card thống kê hay danh sách lớp đều có bo góc chuẩn 12px – 16px (`rounded-xl` / `rounded-2xl`).
* Đổ bóng phân cấp từ `--shadow-sm` cho các card tĩnh đến `--shadow-lg` cho các modal hộp thoại tương tác.

### 3. Bảng dữ liệu học vụ (Data Tables):
* Hàng tiêu đề cố định (Sticky Header) với nền bán trong suốt `backdrop-blur`.
* Hàng xen kẽ sọc nhẹ (Zebra Striping) giúp dễ dò theo hàng ngang khi theo dõi bảng điểm 4 thành phần.

---

## 7. Hướng dẫn Ánh xạ vào Tailwind CSS trong `frontend/`

Trong dự án React SPA, các Design Tokens trên đã được ánh xạ trực tiếp vào `frontend/src/index.css` và `tailwind.config.js`:
* Khi cần tạo card kính mờ: dùng class `bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-xl`.
* Khi cần tạo hiệu ứng chuyển đổi mượt: dùng class `transition-all duration-200 ease-in-out`.
* Khi cần tra cứu thêm chi tiết kỹ thuật từng thuộc tính, vui lòng tham chiếu trực tiếp tại [MASTER.md](MASTER.md).

---
<div align="center">
  <sub>Hệ Thống Quản Lý Đào Tạo & Sinh Viên (SMS) · Đại học Phenikaa · 2026</sub>
</div>

