# 🧪 BỘ KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITE)
**Hệ thống Quản lý Đào tạo & Sinh viên (SMS / DoAnChuyenNganh)**

Thư mục `tests/` quản lý các kịch bản kiểm thử tự động đa tầng: End-to-End (E2E), kiểm thử áp lực & tải đồng thời (Performance/Stress), và kiểm thử tích hợp chuyên biệt (Integration).

---

## 📁 Cấu trúc danh mục kiểm thử

```text
tests/
├── smoke/                           # 💨 Kiểm thử khói (Sanity Gate - Fail Fast < 30s)
│   └── smoke_test.js                # 10 Test cases cốt lõi: Auth, DB, Dashboard, Catalog, SPA
├── e2e/                             # 🛡️ Kiểm thử hồi quy toàn diện End-to-End
│   ├── comprehensive_system_test.js # Bộ 65+ test cases: Bảo mật, RBAC, Học phí, Điểm danh, Phúc khảo, Lớp riêng
│   ├── system_e2e_test.js           # Bộ 39 test cases: Kiểm tra chức năng các phân hệ chính
│   └── user_experience_journey_test.js # Kiểm thử hành trình trải nghiệm người dùng xuyên suốt
├── performance/                     # ⚡ Kiểm thử hiệu năng, áp lực & tải đồng thời
│   ├── simulate_600_enrollment.js   # Mô phỏng 600 sinh viên đồng thời tranh chấp đăng ký tín chỉ
│   ├── enrollment_load_test.js      # Kiểm thử tranh chấp đăng ký tín chỉ đồng thời (Concurrency)
│   └── overload_stress_test.js      # Benchmark chịu tải kết nối: HikariCP, Tomcat thread pool
├── integration/                     # 🧩 Kiểm thử tích hợp tính năng & kiểm toán kỹ thuật
│   ├── test_attendance_feature.js   # Kiểm thử quy trình điểm danh sinh viên theo lớp học phần
│   ├── test_excel_import_flow.js    # Kiểm thử luồng nhập điểm tự động từ tệp Excel
│   ├── phase1_verification_test.js  # Kiểm thử xác thực tích hợp giai đoạn 1
│   └── full_browser_devtools_audit.js # Kiểm toán DevTools: mạng, console log và layout
└── README.md                        # Hướng dẫn danh mục kiểm thử này
```

---

## 🚀 Hướng dẫn thực thi kiểm thử

### 1. Chạy nhanh qua Menu tương tác (Windows)
Từ thư mục gốc của dự án, chạy lệnh:
```cmd
run_tests.bat
```
* **Lựa chọn [1]:** 💨 Chạy Smoke Test siêu tốc (< 30s, kiểm tra liveness & luồng chính sau deploy).
* **Lựa chọn [2]:** 🛡️ Chạy Regression Test toàn diện 65+ Test Cases (`comprehensive_system_test.js`).
* **Lựa chọn [3]:** ⚡ Chạy Performance Regression (Kiểm thử tranh chấp tải 600 sinh viên).
* **Lựa chọn [4]:** 🚀 Chạy trọn vẹn chu kỳ Release (Smoke Test Gate $\rightarrow$ Regression Test Suite).
* **Lựa chọn [5]:** 📋 Chạy kiểm thử nghiệp vụ cơ bản 39 Test Cases (`system_e2e_test.js`).

---

### 2. Chạy trực tiếp từng kịch bản bằng Node.js CLI

Đảm bảo môi trường Backend (cổng `8080`) và Frontend (cổng `5173`) đang hoạt động trước khi chạy:

#### 🔹 1. Smoke Test siêu tốc (< 30s)
```bash
node tests/smoke/smoke_test.js
```

#### 🔹 2. Regression Test E2E Toàn diện (56 Cases)
```bash
node tests/e2e/comprehensive_system_test.js
```

#### 🔹 Kiểm thử E2E Toàn diện (56 Cases)
```bash
node tests/e2e/comprehensive_system_test.js
```

#### 🔹 Kiểm thử Tranh chấp Đăng ký Tín chỉ (Concurrency)
```bash
node tests/performance/enrollment_load_test.js
```

#### 🔹 Kiểm thử Chịu tải & Giới hạn kết nối (Stress Test)
```bash
node tests/performance/overload_stress_test.js
```

#### 🔹 Kiểm thử Luồng Import Điểm Excel
```bash
node tests/integration/test_excel_import_flow.js
```

#### 🔹 Kiểm toán Trình duyệt & DevTools
```bash
node tests/integration/full_browser_devtools_audit.js
```

---

## 🎯 Tiêu chuẩn nghiệm thu (Pass Criteria)

1. **E2E & Business Rules:** 100% test cases vượt qua, không phát sinh lỗi phân quyền 403 trái phép hoặc rò rỉ dữ liệu.
2. **Kiểm thử tranh chấp:** Đảm bảo không xảy ra Race Condition vượt quá sĩ số tối đa (`max_students`) khi nhiều sinh viên đăng ký cùng 1 giây.
3. **Hiệu năng:** Thời gian phản hồi trung bình (p95) < 300ms trong điều kiện vận hành thông thường.
