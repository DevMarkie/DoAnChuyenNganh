# 🛠️ CÔNG CỤ & TIỆN ÍCH DỰ ÁN (PROJECT SCRIPTS & UTILITIES)
**Hệ thống Quản lý Đào tạo & Sinh viên (SMS / DoAnChuyenNganh)**

Thư mục `scripts/` quản lý các kịch bản tự động hóa phục vụ:
1. Nạp và chuẩn hóa dữ liệu thực nghiệm CSDL (Database Seeding & Dataset Generation).
2. Tạo tệp Excel mẫu và xác thực định dạng nhập liệu (Excel Demo Generation & Verification).
3. Tự động hóa chụp ảnh giao diện và xử lý hình ảnh cho báo cáo đồ án (UI Screenshots & Asset Pipeline).

---

## 📁 Danh mục kịch bản theo phân nhóm

### 1. Phân nhóm Nạp & Chuẩn hóa CSDL (Database Seeding)

| Tên kịch bản | Ngôn ngữ | Vai trò chính | Cách thực thi |
|:---|:---|:---|:---|
| `generate_3000_dataset.py` | Python 3 | **Trình sinh dữ liệu toàn diện chính:** Tạo 3.000 sinh viên (K16–K19), 80 giảng viên, 28 ngành, 8 khoa, 5 học kỳ và xuất ra `database/seed.sql`, tự động nạp vào Docker MySQL. | `python scripts/generate_3000_dataset.py` |
| `generate_curriculum_catalog.py` | Python 3 | Khảo sát, kiến tạo ma trận lộ trình đào tạo 8 học kỳ cho các ngành đào tạo (130-134 TC), kiểm tra 0 chu trình trong đồ thị tiên quyết DAG. | `python scripts/generate_curriculum_catalog.py` |
| `curriculum_catalog.py` | Python 3 | Module danh mục chuẩn: 9 khoa, 9 ngành, 4 khóa (K16-K19), 36 lớp sinh hoạt, 45 giảng viên, 306 môn học và 260 quan hệ tiên quyết. | Được import bởi generator |
| `create_views.py` | Python 3 | Khởi tạo và cập nhật các Database Views tối ưu hóa (`v_student_transcript`, `v_student_gpa`) trong MySQL. | `python scripts/create_views.py` |
| `verify_dataset.py` | Python 3 | Tự động kiểm tra tính toàn vẹn, số lượng bản ghi của 23 bảng và phân bố phổ điểm học kỳ trong CSDL MySQL. | `python scripts/verify_dataset.py` |
| `load_seed_to_docker.py` | Python 3 | Nạp an toàn dữ liệu `database/seed.sql` vào MySQL container với cơ chế làm sạch bảng tự động, không chạm quyền view DEFINER. | `python scripts/load_seed_to_docker.py` |
| `verify_live_api.py` | Python 3 | Tự động kiểm thử API sống (Curriculum, Degree Audit, Prerequisite Graph) cho các ngành đào tạo và Admin qua HTTP REST client. | `python scripts/verify_live_api.py` |

---

### 2. Phân nhóm Excel Demo & Kiểm tra Dữ liệu (Excel & Verification)

| Tên kịch bản | Ngôn ngữ | Vai trò chính | Cách thực thi |
|:---|:---|:---|:---|
| `generate_demo_excels.py` | Python 3 | Tự động sinh các file Excel mẫu danh sách sinh viên theo lớp học phần với công thức tính điểm (CC1 5%, CC2 5%, GK 30%, CK 60%). | `python scripts/generate_demo_excels.py` |
| `generate_exam_demo_excels.py` | Python 3 | Sinh file Excel mẫu danh sách phòng thi, danh sách thí sinh và mẫu nhập điểm thi kết thúc học phần. | `python scripts/generate_exam_demo_excels.py` |
| `verify_demo_excels.py` | Python 3 | Kiểm tra tính hợp lệ của toàn bộ các file Excel đã sinh: kiểm tra header, định dạng điểm số, mã sinh viên hợp lệ. | `python scripts/verify_demo_excels.py` |
| `verify_exam_data.py` | Python 3 | Kiểm tra tính toàn vẹn quan hệ giữa phòng thi, ca thi, danh sách sinh viên và lớp học phần. | `python scripts/verify_exam_data.py` |

---

### 3. Phân nhóm Tự động hóa Giao diện & Đồ án (UI & Media Pipeline)

| Tên kịch bản | Ngôn ngữ | Vai trò chính | Cách thực thi |
|:---|:---|:---|:---|
| `capture_screenshots.mjs` | Node.js (ESM) | Tự động đăng nhập và chụp ảnh toàn bộ 32+ màn hình hệ thống (Admin, Giảng viên, Sinh viên) qua Headless Chrome. | `node scripts/capture_screenshots.mjs` |
| `convert_to_jpg.ps1` | PowerShell | Tự động chuyển đổi hàng loạt ảnh chụp màn hình từ `.png` sang `.jpg` để tối ưu dung lượng khi chèn vào báo cáo Word. | `powershell -File scripts/convert_to_jpg.ps1` |

---

## 💡 Yêu cầu môi trường chạy scripts

* **Python 3.10+**: Yêu cầu các thư viện chuẩn hoặc cài thêm qua `pip install openpyxl mysql-connector-python`.
* **Node.js 20+**: Yêu cầu thư viện `puppeteer` (chạy `npm install` trong `tests/` hoặc môi trường gốc).
