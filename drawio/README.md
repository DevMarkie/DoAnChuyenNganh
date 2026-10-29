# BỘ SƠ ĐỒ THIẾT KẾ & PHÂN TÍCH HỆ THỐNG (UML DRAW.IO DIAGRAMS)
## HỆ THỐNG QUẢN LÝ ĐÀO TẠO & SINH VIÊN (SMS / UAMS)
> **Đồ án Chuyên ngành Công nghệ Thông tin — Trường Đại học Phenikaa**  
> **Tác giả:** Nguyễn Duy Minh (MSV: 21010696)  
> **Kiến trúc hệ thống:** 3-Tier Layered Architecture (React SPA + Spring Boot 3.5.6 + MySQL 8.0)

---

## 📌 TỔNG QUAN DANH MỤC TOÀN BỘ FILE SƠ ĐỒ (.DRAWIO)

Toàn bộ các file vẽ biểu đồ Draw.io của dự án được quy hoạch tập trung 100% tại thư mục [drawio/](file:///c:/Users/Public/Learn%20Phenikaa/Nam4/Ky1/DoAnChuyenNganh/drawio):

### 1. Các bộ sơ đồ đa phân hệ / đa chức năng (Multi-page Diagrams)

| STT | Tên file | Chuẩn UML / Mô hình | Số lượng Tab | Nội dung mô tả chi tiết |
|:---:|:---|:---|:---:|:---|
| **1** | [UseCase_Diagrams.drawio](file:///c:/Users/Public/Learn%20Phenikaa/Nam4/Ky1/DoAnChuyenNganh/drawio/UseCase_Diagrams.drawio) | UML 2.5 Use Case Diagram | 4 tabs | 4 phân hệ ca sử dụng: Tổng quan toàn trường, Phân hệ Quản trị viên, Phân hệ Giảng viên, Phân hệ Sinh viên. Ranh giới hệ thống rõ ràng, đầy đủ quan hệ «include» và «extend». |
| **2** | [Sequence_Diagrams.drawio](file:///c:/Users/Public/Learn%20Phenikaa/Nam4/Ky1/DoAnChuyenNganh/drawio/Sequence_Diagrams.drawio) | UML 2.5 Sequence Diagram | 18 tabs | 18 biểu đồ tuần tự cho 18 chức năng nghiệp vụ cốt lõi theo 6 đường sinh mệnh (Lifelines): Tác nhân → Giao diện React → REST Controller → Business Service → JPA Repository → CSDL MySQL. |
| **3** | [Activity_Diagrams.drawio](file:///c:/Users/Public/Learn%20Phenikaa/Nam4/Ky1/DoAnChuyenNganh/drawio/Activity_Diagrams.drawio) | UML 2.5 Activity Diagram | 18 tabs | 18 biểu đồ hoạt động phân làn (swimlane) rõ ràng: Làn Tác nhân (Actor Lane) và Làn Hệ thống (System Service & DB Lane), đầy đủ điểm quyết định và nhánh xử lý lỗi. |
| **4** | [AnalysisClass_BCE_Diagrams.drawio](file:///c:/Users/Public/Learn%20Phenikaa/Nam4/Ky1/DoAnChuyenNganh/drawio/AnalysisClass_BCE_Diagrams.drawio) | Boundary – Control – Entity (BCE) | 18 tabs | 18 biểu đồ lớp phân tích phân rã trách nhiệm: Lớp Biên (Boundary), Lớp Điều khiển (Control), Lớp Thực thể (Entity & DTO) khớp 1-1 với kiến trúc backend. |

### 2. Các sơ đồ đơn phân hệ Use Case (Single-tab Diagrams)

| STT | Tên file | Chuẩn UML / Phân hệ | Số lượng Tab | Nội dung mô tả chi tiết |
|:---:|:---|:---|:---:|:---|
| **5** | [1_UseCase_TongQuan.drawio](file:///c:/Users/Public/Learn%20Phenikaa/Nam4/Ky1/DoAnChuyenNganh/drawio/1_UseCase_TongQuan.drawio) | Use Case Toàn hệ thống | 1 tab | Sơ đồ ca sử dụng tổng quan toàn trường với đầy đủ 4 tác nhân (Người dùng, QTV, GV, SV). |
| **6** | [2_UseCase_Admin.drawio](file:///c:/Users/Public/Learn%20Phenikaa/Nam4/Ky1/DoAnChuyenNganh/drawio/2_UseCase_Admin.drawio) | Use Case Phân hệ QTV | 1 tab | Chi tiết các chức năng quản trị: Đào tạo, Sinh viên, Giảng viên, Học kỳ, Học phần, Học phí, Thống kê. |
| **7** | [3_UseCase_GiangVien.drawio](file:///c:/Users/Public/Learn%20Phenikaa/Nam4/Ky1/DoAnChuyenNganh/drawio/3_UseCase_GiangVien.drawio) | Use Case Phân hệ Giảng viên | 1 tab | Chi tiết nghiệp vụ giảng viên: Lịch giảng dạy, Nhập/chốt bảng điểm, Điểm danh PIN, Danh sách sinh viên. |
| **8** | [4_UseCase_SinhVien.drawio](file:///c:/Users/Public/Learn%20Phenikaa/Nam4/Ky1/DoAnChuyenNganh/drawio/4_UseCase_SinhVien.drawio) | Use Case Phân hệ Sinh viên | 1 tab | Chi tiết nghiệp vụ sinh viên: Đăng ký/hủy học phần, Xem TKB, Tra cứu điểm CPA/GPA, Check-in điểm danh. |

---

## 📋 DANH MỤC 18 CHỨC NĂNG NGHIỆP VỤ ĐỒNG BỘ TRỌN VẸN

Tất cả 18 tab trong 3 bộ biểu đồ Tuần tự, Hoạt động và BCE đều đồng bộ số thứ tự và tên chức năng:

1. **Chức năng 01:** Đăng nhập hệ thống & Xác thực JWT (`/api/auth/login`)
2. **Chức năng 02:** Đổi mật khẩu tài khoản (`/api/auth/change-password`)
3. **Chức năng 03:** Thêm mới Sinh viên & Cấp phát tài khoản tự động (`/api/students`)
4. **Chức năng 04:** Quản lý hồ sơ Sinh viên & Đình chỉ đào tạo (`/api/students/{id}/status`)
5. **Chức năng 05:** Quản lý cơ cấu đào tạo (Khoa, Chuyên ngành & Lớp sinh hoạt) (`/api/classes`, `/api/departments`)
6. **Chức năng 06:** Quản lý Giảng viên & Cấp phát tài khoản giảng dạy (`/api/lecturers`)
7. **Chức năng 07:** Quản lý Danh mục Môn học, Tín chỉ & Môn tiên quyết (`/api/subjects`)
8. **Chức năng 08:** Cấu hình Học kỳ & Kích hoạt Học kỳ hiện tại (`/api/semesters`)
9. **Chức năng 09:** Mở mới & Điều phối Lớp học phần (`/api/course-sections`)
10. **Chức năng 10:** Xếp Thời khóa biểu & Kiểm tra xung đột phòng học / giảng viên (`/api/schedules`)
11. **Chức năng 11:** Sinh viên Đăng ký lớp Học phần (Khóa bi quan & Điều khiển đồng thời) (`/api/enrollments`)
12. **Chức năng 12:** Hủy đăng ký Học phần & Hoàn trả sĩ số lớp (`/api/enrollments/{id}`)
13. **Chức năng 13:** Giảng viên Nhập điểm thành phần & Tính tổng kết, GPA (`/api/grades`)
14. **Chức năng 14:** Chốt bảng điểm & Cửa sổ chỉnh sửa ân hạn 7 ngày (`/api/grades?finalize=true`)
15. **Chức năng 15:** Tra cứu Bảng điểm, Lộ trình CTĐT & Điểm tích lũy CPA (`/api/transcript/me`)
16. **Chức năng 16:** Báo cáo Thống kê Toàn trường, Cảnh báo học vụ & Dashboard (`/api/dashboard`)
17. **Chức năng 17:** Quản lý Tài chính & Thu học phí theo tín chỉ (`/api/admin/tuition`, `TuitionCashierPage`)
18. **Chức năng 18:** Điểm danh lớp học trực tiếp thời gian thực qua mã PIN (`/api/attendance`)

---

## 🛠️ CÔNG CỤ TỰ ĐỘNG HÓA VÀ SINH SƠ ĐỒ (SCRIPTS)

Thư mục `drawio/scripts/` chứa mã nguồn Python tự động sinh các biểu đồ trực tiếp từ cấu trúc mã nguồn:

- [build_drawio_diagrams.py](file:///c:/Users/Public/Learn%20Phenikaa/Nam4/Ky1/DoAnChuyenNganh/drawio/scripts/build_drawio_diagrams.py): Sinh sơ đồ Use Case 4 phân hệ (nền trắng chuẩn, không trùng lặp ID, căn lề pixel chính xác).
- [build_full_sequence_diagrams.py](file:///c:/Users/Public/Learn%20Phenikaa/Nam4/Ky1/DoAnChuyenNganh/drawio/scripts/build_full_sequence_diagrams.py): Sinh toàn bộ 18 tab Biểu đồ tuần tự chuẩn UML.
- [build_full_activity_diagrams.py](file:///c:/Users/Public/Learn%20Phenikaa/Nam4/Ky1/DoAnChuyenNganh/drawio/scripts/build_full_activity_diagrams.py): Sinh toàn bộ 18 tab Biểu đồ hoạt động phân làn.
- [build_full_bce_diagrams.py](file:///c:/Users/Public/Learn%20Phenikaa/Nam4/Ky1/DoAnChuyenNganh/drawio/scripts/build_full_bce_diagrams.py): Sinh toàn bộ 18 tab Biểu đồ lớp phân tích BCE.
- [generate_all_4_diagrams.py](file:///c:/Users/Public/Learn%20Phenikaa/Nam4/Ky1/DoAnChuyenNganh/drawio/scripts/generate_all_4_diagrams.py): Script Master thực thi đồng bộ cả 4 file Draw.io.
- [check_diagrams.py](file:///c:/Users/Public/Learn%20Phenikaa/Nam4/Ky1/DoAnChuyenNganh/drawio/scripts/check_diagrams.py): Script kiểm thử tự động quét trùng lặp Cell ID, kiểm đếm số phần tử và xác thực cấu trúc XML.

### Cách chạy sinh lại toàn bộ sơ đồ:
```bash
# 1. Sinh lại toàn bộ 4 file .drawio
python drawio/scripts/generate_all_4_diagrams.py

# 2. Kiểm thử tính toàn vẹn và cấu trúc XML
python drawio/scripts/check_diagrams.py

# 3. Tách từng tab thành các file đơn trang để xuất ảnh
node report/split_pages.mjs

# 4. Xuất ảnh PNG độ phân giải cao bằng Draw.io Desktop
node report/render_pages.mjs

# 5. Biên dịch toàn bộ tài liệu báo cáo Đồ án tốt nghiệp (Word DOCX)
node report/build_report.js
```

---

## 🎨 QUY CHUẨN ĐỒ HỌA & THIẾT KẾ HÀN LÂM

1. **Bảng màu đơn sắc chuẩn học thuật (Monochrome High Contrast):**
   - Nền trắng tinh khiết (`#ffffff`), viền đen mỏng 1.5px (`#000000`).
   - Tuyệt đối không dùng nền đen hay hiệu ứng đổ bóng mờ gây nhòe khi in ấn đen trắng.
2. **Chống lỗi đè chữ & đè nhãn (Zero Overlap):**
   - Mọi nhãn thông điệp trong Biểu đồ tuần tự đều có nền trắng (`labelBackgroundColor=#ffffff`) để không bị đường lifeline gạch ngang qua chữ.
   - Khoảng cách giữa các ca sử dụng đạt tối thiểu 70px – 80px theo chiều dọc và 190px theo chiều ngang.
3. **Phân làn Swimlane chuẩn mực:**
   - Biểu đồ hoạt động phân tách rành mạch trách nhiệm phía Client (Người dùng/Giao diện) và phía Server (Dịch vụ Spring Boot & CSDL MySQL).
