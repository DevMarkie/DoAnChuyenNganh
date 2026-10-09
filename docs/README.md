# 📚 HỆ THỐNG TÀI LIỆU DỰ ÁN (DOCUMENTATION SUITE)
**Hệ thống Quản lý Đào tạo & Sinh viên theo Học chế Tín chỉ (SMS / UAMS)**

Thư mục `docs/` tập hợp toàn bộ hồ sơ phân tích nghiệp vụ (Business Analysis - BA), thiết kế kiến trúc hệ thống (System Architecture), thiết kế cơ sở dữ liệu (Database Design), khung chương trình đào tạo và hướng dẫn vận hành triển khai.

---

## 📑 MỤC LỤC TÀI LIỆU HỆ THỐNG

| Mã tài liệu | Tên tài liệu | Nội dung chính |
| :--- | :--- | :--- |
| [01_Architecture](01_system_architecture_and_diagrams.md) | **Kiến trúc & Sơ đồ Hệ thống** | Kiến trúc 3 tầng (Layered Architecture), luồng dữ liệu, liên kết sơ đồ UML (Use Case, Sequence, Activity, BCE). |
| [02_UseCases](02_use_case_catalog.md) | **Danh mục Use Case** | Bảng phân rã 16+ Use Cases nghiệp vụ cốt lõi theo 3 vai trò (Admin, Giảng viên, Sinh viên). |
| [03_Specifications](03_use_case_specifications/) | **Đặc tả Chi tiết Use Case** | Luồng sự kiện chính/rẽ nhánh, tiền/hậu điều kiện cho từng phân hệ: [Admin](03_use_case_specifications/UC_Admin_Module.md), [Lecturer](03_use_case_specifications/UC_Lecturer_Module.md), [Student](03_use_case_specifications/UC_Student_Module.md). |
| [04_Rules](04_business_rules.md) | **Quy tắc Nghiệp vụ (BR)** | 10 quy tắc nghiệp vụ bất biến: ràng buộc tín chỉ, trùng lịch TKB, công thức tính điểm CC 5% + CC 5% + GK 30% + CK 60%, cửa sổ 7 ngày khóa điểm. |
| [05_Database](05_database_erd.md) | **Thiết kế CSDL & ERD** | Mô hình thực thể liên kết (ERD), từ điển dữ liệu 18 bảng, ràng buộc toàn vẹn và chiến lược Indexing. |
| [06_Curriculum](06_academic_curriculum_catalog.md) | **Khung Chương trình Đào tạo** | Danh mục chương trình đào tạo mẫu theo chuẩn 5 khối kiến thức (135 - 140 tín chỉ) cho 22 ngành thuộc 7 khoa. |
| [07_Migration](07_academic_curriculum_migration_plan.md) | **Kế hoạch Tái cấu trúc Dữ liệu** | Lộ trình chuẩn hóa khoa - ngành - lớp, dữ liệu thị trường lao động (WEF/FALMI/TopCV). |
| [08_Deployment](08_deployment_and_operations_guide.md) | **Hướng dẫn Triển khai & Vận hành** | Hướng dẫn chạy 1-click Windows, Docker Compose, Cloudflare Internet Tunnel, biến môi trường và tài khoản mẫu. |
| [Master_Dossier](TAI_LIEU_TONG_QUAN_DU_AN.md) | **Tài liệu Tổng quan Toàn diện** | Báo cáo đồ án toàn cảnh, hồ sơ kỹ thuật, thông tin tài khoản demo và hướng dẫn kiểm thử. |

---

## 🛠️ HỆ THỐNG SƠ ĐỒ UML (DRAW.IO)

Các tệp sơ đồ nguyên gốc định dạng Draw.io được lưu trữ tại thư mục [`drawio/`](../drawio/):
1. [`UseCase_Diagrams.drawio`](../drawio/UseCase_Diagrams.drawio) — 4 tabs (Tổng quan, Admin, Giảng viên, Sinh viên)
2. [`Sequence_Diagrams.drawio`](../drawio/Sequence_Diagrams.drawio) — 16 tabs tuần tự chi tiết
3. [`Activity_Diagrams.drawio`](../drawio/Activity_Diagrams.drawio) — 16 tabs sơ đồ hoạt động
4. [`AnalysisClass_BCE_Diagrams.drawio`](../drawio/AnalysisClass_BCE_Diagrams.drawio) — 16 tabs lớp phân tích Boundary - Control - Entity

*Script sinh lại sơ đồ tự động nằm tại: [`drawio/scripts/generate_all_4_diagrams.py`](../drawio/scripts/generate_all_4_diagrams.py).*

---

## 🔗 LIÊN KẾT HỮU ÍCH TRONG DỰ ÁN

* 🗄️ **[Cẩm nang CSDL & Tối ưu hóa truy vấn](../database/README.md)**: Chi tiết 18 bảng, Database Views (`v_student_transcript`, `v_student_gpa`), Composite Indexes và sổ tay Migration.
* 🧪 **[Danh mục Kiểm thử tự động](../tests/README.md)**: Hướng dẫn chạy 56 E2E test cases, kịch bản quá tải, stress test, và DevTools audit.
* 📊 **[Hồ sơ Báo cáo & Kiểm toán](../reports/README.md)**: Báo cáo tiến độ đồ án (`reports/progress/`) và Báo cáo kiểm định chất lượng mã nguồn ([`code_review_report.md`](../reports/code_review/code_review_report.md)).
