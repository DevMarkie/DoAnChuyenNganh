# 📸 KẾT QUẢ KIỂM THỬ & ẢNH CHỤP GIAO DIỆN (TEST RESULTS & ARTIFACTS)
**Hệ thống Quản lý Đào tạo & Sinh viên (SMS / DoAnChuyenNganh)**

Thư mục `test-results/` lưu trữ các bằng chứng kiểm thử tự động, ảnh chụp màn hình kiểm định giao diện (UI snapshots) và số liệu kiểm toán DevTools (Lighthouse / Core Web Vitals).

---

## 📁 Cấu trúc thư mục

```
test-results/
├── screenshots/               # Ảnh chụp kiểm định UI & Thời khóa biểu
│   ├── fixed_student_schedule.png     # Thời khóa biểu sinh viên đã sửa lỗi layout
│   └── hk1_2025_student_schedule.png   # Thời khóa biểu sinh viên học kỳ mẫu HK1
├── devtools_screenshots/      # Ảnh chụp màn hình từ bài kiểm toán Headless Chrome DevTools
├── audit/                     # Nhật ký kiểm toán kỹ thuật
│   ├── devtools_audit_summary.json    # Tổng hợp chỉ số hiệu năng mạng, tải trang, DOM
│   └── .last-run.json                 # Thời gian thực thi gần nhất của test runner
└── README.md                  # Hướng dẫn danh mục này
```
