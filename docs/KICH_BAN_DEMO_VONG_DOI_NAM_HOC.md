# 🎓 Kịch Bản Demo Trọn Vòng Đời Năm Học (Academic Lifecycle Demo)
> **Tài liệu hướng dẫn thực chiến dành cho buổi Thuyết trình & Bảo vệ Đồ án Chuyên ngành**  
> *Đề tài: Hệ thống Quản lý Đào tạo & Đăng ký môn học theo tín chỉ (SMS Portal)*

---

## 🎯 Mục Tiêu Của Kịch Bản Demo
Thay vì đi bấm lẻ tẻ từng trang CRUD gây nhàm chán, bạn hãy mở đầu với Hội đồng bằng câu nói:
> *"Em xin phép trình bày hệ thống thông qua đúng một chu trình vận hành thực tế của một năm học đại học: Bắt đầu từ khâu Nhà trường tiếp nhận khóa mới, Sinh viên đăng ký tín chỉ thông minh, Giảng viên nhập điểm thi, cho đến khâu Hệ thống tự động tính GPA/CPA và rà soát cảnh báo học vụ."*

---

## 🚀 Kịch Bản 6 Bước Thực Hiện Liền Mạch

### BƯỚC 1: NHÀ TRƯỜNG TIẾP NHẬN KHÓA MỚI (Admin Portal)
* **Tài khoản**: `admin` / `admin123`
* **Vấn đề thực tế**: Đầu năm học đón hàng nghìn tân sinh viên, không thể nhập tay từng người.
* **Thao tác Demo**:
  1. Vào menu **Lớp sinh hoạt** (`/admin/classes`) $\rightarrow$ Bấm nút **"Khởi tạo theo Khóa"**:
     - Chọn Khóa: `K17`, Năm học: `2025-2026`, Số lớp: `2`.
     - Bấm **"Tự động tạo lớp"** $\rightarrow$ Hệ thống tự sinh tức thì các lớp cho toàn bộ các Khoa (`CNTT01-K17`, `KTPM01-K17`, `QTKD01-K17`...).
  2. Vào menu **Sinh viên** (`/admin/students`) $\rightarrow$ Bấm nút **"Nhập Excel"**:
     - Bấm tải file mẫu chuẩn `.xlsx` (chỉ cho hội đồng thấy có sẵn dữ liệu mẫu).
     - Kéo file Excel có 1 dòng hợp lệ và 1 dòng cố tình sai mã lớp $\rightarrow$ Màn hình **Xem trước đối soát trực quan** bôi đỏ cảnh báo dòng lỗi và bôi xanh dòng hợp lệ.
     - Nhấn **"Xác nhận nhập"** $\rightarrow$ Sinh viên được tạo và tự động kích hoạt tài khoản User (Role `STUDENT`, mật khẩu mặc định `123456`, cờ `mustChangePassword = true`).

---

### BƯỚC 2: TÂN SINH VIÊN KÍCH HOẠT TÀI KHOẢN (Student Security Flow)
* **Tài khoản**: Đăng nhập bằng MSSV vừa được cấp (ví dụ: `24010001` / `123456`).
* **Thao tác Demo**:
  1. Đăng nhập $\rightarrow$ Hệ thống lập tức nhận diện cờ `mustChangePassword` và yêu cầu đổi mật khẩu bảo mật trước khi vào cổng.
  2. Đổi mật khẩu mới $\rightarrow$ Vào giao diện Dashboard sinh viên.

---

### BƯỚC 3: ĐĂNG KÝ TÍN CHỈ VỚI TRỢ LÝ GHÉP TKB THÔNG MINH (Smart Scheduling)
* **Tài khoản**: Sinh viên (`student1` / `student123` hoặc tân sinh viên vừa tạo).
* **Vấn đề thực tế**: Sinh viên rất khổ khi phải tự nháp từng lớp học phần để tránh trùng lịch.
* **Thao tác Demo**:
  1. Vào trang **Đăng ký môn học** (`/student/enroll`).
  2. Bấm nút **"Gợi ý TKB thông minh"** (góc phải thanh tìm kiếm):
     - Tích chọn 3–4 môn học mong muốn (VD: Triết học, Giải tích, Nhập môn CNTT, Tiếng Anh).
     - Bấm **"Tìm phương án TKB"** $\rightarrow$ Thuật toán tự động tìm kiếm các tổ hợp lớp học phần còn chỗ và **hoàn toàn không bị trùng lịch nhau**.
     - Xem kết quả các Phương án TKB được gợi ý $\rightarrow$ Bấm **"Đăng ký tất cả theo phương án này"**.
  3. *(Khoe kỹ thuật)*: Nếu sinh viên cố tình chọn thủ công 2 lớp trùng lịch $\rightarrow$ Backend lập tức ném ngoại lệ chặn lại với thông báo chi tiết: *"Trùng lịch học vào Thứ Hai lúc 07:00-09:30"*.

---

### BƯỚC 4: GIẢNG VIÊN GIẢNG DẠY & NHẬP ĐIỂM (Lecturer Portal)
* **Tài khoản**: Giảng viên (`gv.an` / `password123` hoặc tài khoản GV trong hệ thống).
* **Thao tác Demo**:
  1. Vào menu **Lịch dạy & Lớp phụ trách** $\rightarrow$ Xem thời khóa biểu theo tuần.
  2. Vào trang **Nhập điểm lớp học phần**:
     - Nhập điểm trực tuyến hoặc bấm **Nhập Excel** bảng điểm.
     - Điểm tự động tính theo công thức chuẩn: `Tổng kết = CC1(5%) + CC2(5%) + GK(30%) + CK(60%)`.
     - Tự động quy đổi sang thang điểm 4 và Điểm chữ (A, B+, B, C...).
  3. Bấm **Chốt điểm**: Hệ thống áp dụng quy tắc nghiệp vụ **BR-07**: Cho phép giảng viên sửa đổi trong cửa sổ ân hạn 7 ngày trước khi khóa cứng vĩnh viễn.

---

### BƯỚC 5: TỰ ĐỘNG TÍNH ĐIỂM GPA/CPA & CẢNH BÁO HỌC VỤ (Academic Audit)
* **Thao tác Demo**:
  1. Sinh viên vào xem **Bảng điểm cá nhân** (`/student/transcript`):
     - GPA học kỳ và CPA toàn khóa tự động cập nhật thời gian thực.
     - Tự động áp dụng luật học lại: *Lấy điểm cao nhất để tính CPA tích lũy*.
  2. Đăng nhập lại Admin $\rightarrow$ Vào menu **Cảnh báo học vụ** (`/admin/warnings`):
     - Hệ thống tự động rà soát sinh viên có kết quả học tập yếu kém (GPA < 1.0 hoặc CPA < 2.0).
     - Phân loại 3 cấp độ: Cảnh báo mức 1, Mức 2, và Buộc thôi học.

---

## 🛡️ Điểm Nhấn Kỹ Thuật Dành Cho Thầy Cô Hỏi Xoáy (Defense FAQs)

| Câu hỏi thầy cô hay hỏi | Cách trả lời & Dẫn chứng kỹ thuật trong Code |
| :--- | :--- |
| **"Khi nghìn sinh viên cùng tranh nhau 1 slot đăng ký lớp lúc 8h sáng thì sao?"** | Em sử dụng cơ chế **Pessimistic Locking** (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) trong [CourseSectionRepository.java](file:///c:/Users/Public/Learn%20Phenikaa/Nam4/Ky1/DoAnChuyenNganh/backend/src/main/java/com/sms/repository/CourseSectionRepository.java#L48) tại hàm `findByIdForEnrollment`. Database khóa bản ghi lớp học phần trong transaction để kiểm tra sĩ số `currentStudents < maxStudents`, đảm bảo không bao giờ bị vượt sĩ số (Over-enrollment). |
| **"Tại sao không làm Import Excel cho Khoa và Môn học?"** | Theo quy tắc thiết kế hệ thống **YAGNI (You Aren't Gonna Need It)**: Khoa và Môn học là Master Data tĩnh thuộc khung CTĐT (nhiều năm mới cập nhật 1 lần). Nạp 1 lần qua migration `seed.sql` là tối ưu nhất; làm Import Excel cho 8 cái khoa là over-engineering không cần thiết. |
| **"Thuật toán gợi ý TKB hoạt động như thế nào?"** | Hệ thống sử dụng thuật toán **Backtracking Search kết hợp Heuristic kiểm tra giao nhau thời gian (Interval Overlap)** trong [SmartScheduleModal.jsx](file:///c:/Users/Public/Learn%20Phenikaa/Nam4/Ky1/DoAnChuyenNganh/frontend/src/pages/student/SmartScheduleModal.jsx). Thuật toán loại bỏ các lớp hết chỗ và sinh các tổ hợp không có cặp lịch nào trùng nhau, cho ra top 3 phương án TKB đẹp nhất trong < 5ms. |
