# 🧪 BỘ KIỂM THỬ TỰ ĐỘNG TOÀN DIỆN (AUTOMATED TEST SUITE)
**Hệ thống Quản lý Đào tạo & Sinh viên (SMS / DoAnChuyenNganh)**

Thư mục `tests/` quản lý toàn bộ các kịch bản kiểm thử tự động đa tầng: Khói (Smoke), Đầu-cuối (End-to-End), Tích hợp (Integration), Bảo mật (Security), Hiệu năng & Tải đồng thời (Performance & Stress), cùng hệ thống báo cáo kiểm toán chất lượng.

---

## 📁 Cấu trúc danh mục kiểm thử

```text
tests/
├── smoke/                           # 💨 Kiểm thử khói (Sanity Gate - Fail Fast < 30s)
│   └── smoke_test.js                # 10 Test cases cốt lõi: Auth, DB, Liveness, Catalog, SPA Liveness
├── e2e/                             # 🛡️ Kiểm thử hồi quy chức năng End-to-End
│   ├── comprehensive_system_test.js # Bộ 65+ test cases: Bảo mật, RBAC, Học phí, Điểm danh, Phúc khảo, Lớp riêng
│   ├── system_e2e_test.js           # Bộ 39 test cases: Kiểm tra chức năng các phân hệ chính
│   ├── test_admin_coordination_and_tuition.js # Kiểm thử điều phối học vụ và quản lý công nợ học phí
│   ├── test_analytics_and_cohort_feature.js   # Kiểm thử phân tích thống kê khóa học & chỉ số đào tạo
│   ├── test_grade_amendment_e2e.cjs # Kiểm thử quy trình đề xuất - duyệt sửa điểm sau khóa sổ & nhật ký vết
│   └── user_experience_journey_test.js        # Kiểm thử hành trình trải nghiệm người dùng xuyên suốt 3 vai trò
├── integration/                     # 🧩 Kiểm thử tích hợp tính năng chuyên sâu
│   ├── test_attendance_feature.js   # Kiểm thử quy trình điểm danh sinh viên bằng mã số 6 ký tự
│   └── test_excel_import_flow.js    # Kiểm thử luồng nhập điểm tự động từ tệp Excel chuẩn
├── performance/                     # ⚡ Kiểm thử hiệu năng, áp lực & tải đồng thời
│   ├── enrollment_load_test.js      # Kiểm thử tranh chấp đăng ký tín chỉ đồng thời (Concurrency)
│   ├── overload_stress_test.js      # Benchmark chịu tải kết nối: HikariCP pool, Tomcat thread pool
│   ├── simulate_600_enrollment.js   # Mô phỏng 600 sinh viên đồng thời tranh chấp đăng ký tín chỉ
│   ├── stress_test.js               # Kiểm thử tải đa cấp độ (500 -> 5.000 requests qua Nginx + 3 Replicas)
│   └── stress_test_to_death.js      # Kiểm thử leo thang tải cực hạn đến ngưỡng sập để đo giới hạn tối đa
├── security/                        # 🔒 Kiểm thử an toàn bảo mật
│   └── basic_security_test.js       # Quét lỗ hổng phân quyền, CSRF, Token Injection và brute-force
├── reports/                         # 📊 Báo cáo kết quả kiểm thử & kiểm toán chất lượng
│   ├── BA_QA_EXECUTION_REPORT_2026-10-01.md
│   ├── BA_QA_TEST_PACK.md
│   ├── COMPREHENSIVE_TEST_REPORT.md
│   ├── FULL_8_PILLARS_QA_REPORT.md
│   ├── FULL_QA_AUDIT_REPORT.md
│   ├── OVERLOAD_TEST_REPORT.md
│   └── STRESS_TEST_TO_DEATH_REPORT.md
├── results/                         # 📋 Dữ liệu kết quả chạy kiểm thử dạng JSON
├── test-results/                    # 📸 Minh chứng chụp màn hình và audit DevTools
├── utils/                           # 🛠️ Tiện ích hỗ trợ kiểm thử (DB helper, Token gen, Health check)
└── README.md                        # Cẩm nang tài liệu này
```

---

## 🚀 Hướng dẫn thực thi kiểm thử

### 1. Chạy nhanh qua Menu tương tác 1-Click (Windows)
Từ thư mục gốc của dự án, khởi chạy:
```cmd
run_tests.bat
```
* **Lựa chọn [1]:** 💨 Smoke Test siêu tốc (< 30s, kiểm tra liveness & API sau deploy).
* **Lựa chọn [2]:** ⚡ Kiểm thử tranh chấp tải 600 sinh viên đồng thời.
* **Lựa chọn [3]:** 📈 Kiểm thử tải đa cấp độ (500 -> 5.000 requests qua Nginx Load Balancer).
* **Lựa chọn [4]:** 💥 Kiểm thử leo thang tải cực hạn (Stress Test To Failure).
* **Lựa chọn [5]:** 🛡️ Kiểm thử hệ thống toàn diện End-to-End (65+ Test Cases).

---

### 2. Thực thi trực tiếp qua lệnh CLI

Đảm bảo Backend (`http://localhost:8080`) và Frontend (`http://localhost:5173`) đang hoạt động:

#### 🔹 1. Smoke Test (< 30s)
```bash
node tests/smoke/smoke_test.js
```

#### 🔹 2. Kiểm thử E2E Toàn diện (65+ Cases)
```bash
node tests/e2e/comprehensive_system_test.js
```

#### 🔹 3. Kiểm thử Tranh chấp 600 Sinh viên (Concurrency)
```bash
node tests/performance/simulate_600_enrollment.js
```

#### 🔹 4. Kiểm thử Tải đa cấp độ (500 - 5.000 requests)
```bash
node tests/performance/stress_test.js
```

#### 🔹 5. Kiểm thử Chịu tải cực hạn (Stress to Death)
```bash
node tests/performance/stress_test_to_death.js
```

#### 🔹 6. Kiểm thử Điểm danh & Import Excel
```bash
node tests/integration/test_attendance_feature.js
node tests/integration/test_excel_import_flow.js
```

#### 🔹 7. Kiểm thử An toàn bảo mật (Security Gate)
```bash
node tests/security/basic_security_test.js
```

---

## 🎯 Tiêu chuẩn nghiệm thu (Quality Gate Criteria)

1. **E2E & Business Rules:** 100% test cases vượt qua, không phát sinh lỗi phân quyền 403 trái phép hoặc vi phạm ràng buộc tiên quyết/trùng lịch.
2. **Kiểm thử tranh chấp (Concurrency):** Tuyệt đối không xảy ra hiện tượng vượt quá sĩ số tối đa (`enrolled_students <= max_students`) khi 600 sinh viên ghi dữ liệu trong cùng 1 giây.
3. **Hiệu năng tải cao:** Nginx cân bằng tải thành công qua 3 Backend Replicas, tỷ lệ thành công đạt trên 98% ở ngưỡng tải thông thường.
