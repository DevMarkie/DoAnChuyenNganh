# 🧪 HỆ THỐNG KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITE CATALOG)
**Hệ thống Quản lý Đào tạo & Sinh viên (SMS / DoAnChuyenNganh)**

Thư mục `tests/` quản lý toàn bộ các kịch bản kiểm thử End-to-End (E2E), kiểm thử tải và áp lực (Stress/Load), kiểm thử tích hợp nghiệp vụ (Integration), kiểm toán DevTools và các công cụ hỗ trợ.

---

## 📁 Cấu trúc thư mục

```
tests/
├── e2e/                     # Kiểm thử người dùng & luồng toàn diện E2E
│   ├── comprehensive_system_test.js     # 56 test case toàn diện: RBAC, SQLi, XSS, Business Rules
│   ├── system_e2e_test.js              # 39 test case kiểm tra nghiệp vụ cơ bản
│   └── user_experience_journey_test.js # Trải nghiệm hành trình người dùng (User Journey)
├── performance/             # Kiểm thử hiệu năng, áp lực & tải đồng thời
│   ├── overload_stress_test.js         # Benchmark chịu tải: HikariCP, Tomcat threads, Rate Limiting
│   └── enrollment_load_test.js         # Kiểm thử tranh chấp đăng ký tín chỉ đồng thời (Concurrency)
├── integration/             # Kiểm thử tích hợp tính năng chuyên biệt
│   ├── phase1_verification_test.js     # Xác thực chức năng giai đoạn 1
│   ├── test_attendance_feature.js      # Kiểm thử quy trình điểm danh sinh viên
│   ├── test_excel_import_flow.js       # Kiểm thử luồng import bảng điểm Excel
│   └── full_browser_devtools_audit.js  # Kiểm toán hiệu năng mạng, layout và console browser
├── utils/                   # Tiện ích sinh token, kiểm tra liên kết và chụp ảnh màn hình
│   ├── generate_student_tokens.js      # Tự động sinh hàng nghìn JWT token cho sinh viên
│   ├── check_links.js                  # Script kiểm tra điều hướng UI và capture
│   ├── browser_tour.js                 # Script tour giao diện các phân hệ UI
│   ├── capture_lecturer.js             # Tiện ích chụp màn hình phân hệ giảng viên
│   ├── capture_student_lecturer.js     # Tiện ích chụp màn hình giảng viên & sinh viên
│   └── snap_schedule.cjs               # Snapshot kiểm tra layout Thời khóa biểu
├── reports/                 # Báo cáo kết quả kiểm thử (Markdown Reports)
│   ├── COMPREHENSIVE_TEST_REPORT.md    # Báo cáo kiểm thử toàn diện 56 test cases
│   ├── OVERLOAD_TEST_REPORT.md         # Báo cáo thử nghiệm chịu tải quá tải
│   ├── FULL_QA_AUDIT_REPORT.md         # Báo cáo kiểm toán DevTools và giao diện
│   ├── BA_QA_TEST_PACK.md              # Ma trận kịch bản kiểm thử theo hồ sơ BA
│   └── BA_QA_EXECUTION_REPORT_2026-10-01.md # Báo cáo thực thi kiểm thử theo chuẩn QA
├── results/                 # Dữ liệu JSON thô của các lần chạy test
│   ├── comprehensive_test_result.json  # JSON kết quả chạy comprehensive test
│   ├── overload_test_result.json       # JSON số liệu độ trễ, TPS của overload test
│   └── test_result.json                # JSON kết quả system e2e test
└── README.md                # Tài liệu mục lục này
```

---

## 🚀 Hướng dẫn thực thi kiểm thử

### 1. Chạy nhanh qua tệp thực thi Batch (Khuyên dùng trên Windows)
Tại thư mục gốc dự án:
```cmd
run_tests.bat
```
* **Lựa chọn [1]:** Chạy bộ kiểm thử toàn diện mọi trường hợp (56 Test Cases).
* **Lựa chọn [2]:** Chạy bộ kiểm thử quá tải, áp lực (Overload, Stress, Concurrency).
* **Lựa chọn [3]:** Chạy bộ kiểm thử cơ bản (39 Test Cases).

### 2. Chạy trực tiếp qua Node.js CLI

#### Kiểm thử Toàn diện (56 Cases):
```bash
node tests/e2e/comprehensive_system_test.js
```

#### Kiểm thử Áp lực & Chịu tải:
```bash
node tests/performance/overload_stress_test.js
```

#### Kiểm thử Tích hợp Import Excel:
```bash
node tests/integration/test_excel_import_flow.js
```

#### Kiểm toán Headless Chrome DevTools:
```bash
node tests/integration/full_browser_devtools_audit.js
```
