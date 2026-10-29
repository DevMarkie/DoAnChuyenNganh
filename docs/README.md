# 📚 HỆ THỐNG TÀI LIỆU DỰ ÁN (DOCUMENTATION SUITE)
**Hệ thống Quản lý Đào tạo & Sinh viên theo Học chế Tín chỉ (SMS / DoAnChuyenNganh)**

Thư mục `docs/` lưu trữ toàn bộ hồ sơ đặc tả phân tích nghiệp vụ (Business Analysis), kiến trúc hệ thống (System Architecture), thiết kế cơ sở dữ liệu (Database Design), quy trình vận hành và kiểm thử tự động.

---

## 📑 Danh mục tài liệu nghiệp vụ & kỹ thuật

| Mã tài liệu | Tên tài liệu | Nội dung chính |
| :--- | :--- | :--- |
| [01_Architecture](01_system_architecture_and_diagrams.md) | **Kiến trúc & Sơ đồ Hệ thống** | Kiến trúc phân tầng (Layered Architecture), luồng dữ liệu, các sơ đồ UML (Use Case, Sequence, Activity, BCE). |
| [02_UseCases](02_use_case_catalog.md) | **Danh mục Use Case** | Bảng phân rã 16+ Use Cases nghiệp vụ cốt lõi theo 3 vai trò (Admin, Giảng viên, Sinh viên). |
| [03_Specifications](03_use_case_specifications/) | **Đặc tả Chi tiết Use Case** | Luồng sự kiện chính/rẽ nhánh, tiền/hậu điều kiện: [Admin](03_use_case_specifications/UC_Admin_Module.md), [Lecturer](03_use_case_specifications/UC_Lecturer_Module.md), [Student](03_use_case_specifications/UC_Student_Module.md). |
| [04_Rules](04_business_rules.md) | **Quy tắc Nghiệp vụ (BR)** | 10 quy tắc nghiệp vụ bất biến: giới hạn tín chỉ (10–24 TC), chống trùng lịch TKB, công thức tính điểm và khóa sổ điểm 7 ngày. |
| [05_Database](05_database_erd.md) | **Thiết kế CSDL & ERD** | Mô hình thực thể liên kết (ERD), từ điển dữ liệu 18 bảng, ràng buộc toàn vẹn và chiến lược Indexing. |
| [06_Curriculum](06_academic_curriculum_catalog.md) | **Khung Chương trình Đào tạo** | Danh mục chương trình đào tạo theo chuẩn 5 khối kiến thức (135–140 tín chỉ) cho 22 ngành thuộc 7 khoa. |
| [07_Migration](07_academic_curriculum_migration_plan.md) | **Kế hoạch Tái cấu trúc Dữ liệu** | Lộ trình chuẩn hóa cấu trúc Khoa - Ngành - Khóa - Lớp và tích hợp dữ liệu ngành học. |
| [08_Deployment](08_deployment_and_operations_guide.md) | **Hướng dẫn Triển khai & Vận hành** | Hướng dẫn triển khai môi trường phát triển (1-Click Windows, Docker Compose), cấu hình bảo mật và tài khoản dùng thử. |
| [09_TestCases](09_comprehensive_test_case_specification.md) | **Đặc tả Kịch bản Kiểm thử Toàn diện** | Ma trận kiểm thử hồi quy 65+ E2E test cases: Bảo mật, RBAC, Đăng ký tín chỉ, Điểm danh, Phúc khảo, Thu học phí, Lớp riêng. |
| [10_Workflows](10_system_processing_workflows.md) | **Luồng Xử lý Nghiệp vụ Hệ thống** | Chi tiết chuỗi xử lý nghiệp vụ 3 phân hệ (Đào tạo, Giảng viên, Sinh viên) qua sơ đồ tương tác và trạng thái. |
| [11_NFR_Challenges](11_nfr_and_technical_challenges.md) | **Yêu cầu Phi chức năng & Thách thức Kỹ thuật** | Tiêu chuẩn chất lượng ISO/IEC 25010, giải pháp xử lý tranh chấp tải cao (Race Condition, Redis locking, Nginx Load Balancing). |
| [TAI_LIEU_TONG_QUAN](TAI_LIEU_TONG_QUAN_DU_AN.md) | **Tài liệu Tổng quan Toàn diện** | Hồ sơ kỹ thuật tổng thể, tóm tắt kiến trúc và các phân hệ phần mềm. |
| [KICH_BAN_DEMO](KICH_BAN_DEMO_VONG_DOI_NAM_HOC.md) | **Kịch bản Demo Vòng đời Học kỳ** | Kịch bản trình diễn luồng nghiệp vụ từ mở lớp, xếp TKB, sinh viên đăng ký đến giảng viên nhập điểm và chốt sổ. |

---

## 🔗 Liên kết nhanh trong mã nguồn

* 🗄️ **[Cẩm nang CSDL & Indexing](../database/README.md)**: Chi tiết 18 bảng, Database Views (`v_student_transcript`, `v_student_gpa`), Composite Indexes và quy trình khởi tạo.
* 🧪 **[Danh mục Kiểm thử Tự động](../tests/README.md)**: Hướng dẫn thực thi 65+ E2E test cases, kịch bản quá tải, stress test và DevTools audit.
* 🚀 **[Cẩm nang Triển khai & Vận hành (Deployment Guide)](08_deployment_and_operations_guide.md)**: Hướng dẫn chi tiết triển khai máy chủ, Docker Compose và chia sẻ truy cập nội bộ / Internet.
* 📊 **[Hệ thống Sơ đồ Phân tích Thiết kế (DrawIO)](../drawio/README.md)**: Trọn bộ Use Case, Activity, Sequence, BCE diagrams.
