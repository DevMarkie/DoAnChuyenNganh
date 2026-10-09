# 📊 DANH MỤC BÁO CÁO DỰ ÁN (PROJECT REPORTS & AUDITS)
**Hệ thống Quản lý Đào tạo & Sinh viên (SMS / DoAnChuyenNganh)**

Thư mục `reports/` lưu trữ toàn bộ các văn bản báo cáo tiến độ học thuật, báo cáo phân tích thiết kế phần mềm (PTTKPM) và báo cáo kiểm toán chất lượng mã nguồn toàn diện.

---

## 📁 Cấu trúc thư mục

```
reports/
├── progress/                 # Báo cáo học vụ & tiến độ đồ án (Word/PDF)
│   ├── BaoCao_TienDo_Tuan19_26.docx   # Báo cáo tiến độ tuần theo dõi đồ án
│   └── PTTKPM_MauBaoCao_Ph.docx       # Báo cáo Phân tích Thiết kế Phần mềm chuẩn
├── code_review/              # Báo cáo kiểm định kỹ thuật & an ninh
│   └── code_review_report.md          # Báo cáo kiểm định toàn diện mã nguồn & kiến trúc
└── README.md                 # Tài liệu mục lục này
```

---

## 📑 Danh mục chi tiết

### 1. Phân hệ Báo cáo Tiến độ Đồ án (`progress/`)
* **`BaoCao_TienDo_Tuan19_26.docx`**: Tài liệu ghi nhận tiến độ thực hiện đồ án chuyên ngành theo các mốc thời gian từ tuần 19 đến tuần 26, gồm các phân tích mô hình, triển khai tính năng và kiểm thử.
* **`PTTKPM_MauBaoCao_Ph.docx`**: Mẫu báo cáo chính thức Phân tích & Thiết kế Phần mềm trường Đại học Phenikaa, bao gồm mô hình Use Case, BCE, Sequence, Activity và thiết kế cơ sở dữ liệu.

### 2. Phân hệ Kiểm toán & Đánh giá Chất lượng (`code_review/`)
* **[`code_review_report.md`](code_review/code_review_report.md)**:
  * **Phạm vi:** Toàn bộ hệ thống Full-Stack (Backend Spring Boot 3.5.6, Frontend React 19, MySQL 8.0, Test Suite).
  * **Nội dung:** 30 phát hiện chuyên sâu về kiến trúc, bảo mật (RBAC, SQLi, XSS), hiệu năng (N+1 query, HikariCP), và kiểm thử tự động kèm lộ trình vá lỗi chi tiết.
