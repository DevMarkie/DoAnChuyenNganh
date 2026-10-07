<div align="center">
  <img src="https://img.icons8.com/color/120/graduation-cap.png" alt="Logo" />
  <h1>Hệ Thống Quản Lý Đào Tạo & Sinh Viên</h1>
  <p><strong>Student Management System (SMS)</strong></p>
  <p><em>Đồ án chuyên ngành - Mang đến giải pháp quản lý trường học toàn diện</em></p>

  ![Java](https://img.shields.io/badge/Java-23-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
  ![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5.6-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
  ![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
</div>

---

## 📌 Dự án này là gì?

Hãy tưởng tượng một trường Đại học với hàng ngàn sinh viên, hàng trăm giảng viên và vô số lớp học mỗi kỳ. Việc quản lý bằng giấy tờ hay Excel là "bất khả thi". 

Dự án này là một **website quản lý trường học trọn gói**, giúp số hóa toàn bộ quy trình: từ lúc sinh viên chọn môn đăng ký học, giảng viên xem lịch đi dạy và chấm điểm, cho đến khi Phòng đào tạo tổng kết kết quả học tập.

---

## 🎭 Hệ thống có những ai tham gia?

Website được thiết kế riêng biệt cho 3 nhóm người dùng, mỗi nhóm sẽ thấy một giao diện khác nhau phù hợp với công việc của họ:

1. 🧑‍💼 **Phòng Đào Tạo (Admin):** 
   - Là "người nắm quyền lực cao nhất".
   - Có thể mở lớp mới, thêm sinh viên, xếp thời khóa biểu và phòng học.
   - Quản lý cảnh báo học vụ (những sinh viên điểm quá thấp).

2. 👨‍🏫 **Giảng viên:** 
   - Lên web để xem **Hôm nay mình dạy lớp nào? Phòng bao nhiêu?**.
   - Cuối kỳ, giảng viên nhập điểm (điểm chuyên cần, giữa kỳ, cuối kỳ) cho sinh viên trên web và khóa bảng điểm lại.

3. 🎓 **Sinh viên:** 
   - Đăng nhập vào để **Đăng ký tín chỉ** (như trò chơi "săn" lớp học vào đầu mỗi kỳ).
   - Xem thời khóa biểu hàng tuần để biết lịch đi học.
   - Xem bảng điểm cá nhân và xem mình đã tích lũy được bao nhiêu tín chỉ.

---

## 🚀 Hướng dẫn chạy thử dự án (Dành cho người mới)

Bạn không cần biết quá nhiều về code để chạy thử dự án này. Hãy làm theo 2 bước đơn giản:

### Cách 1: Chạy bằng 1-Click (Trên Windows)
Nếu máy bạn đã cài sẵn Java, Node.js và MySQL:
- Chỉ cần nhấp đúp chuột vào file **`start_dev.bat`** ở thư mục gốc. 
- Hệ thống sẽ tự động cấu hình và mở trang web lên cho bạn.

### Cách 2: Chạy bằng Docker (Khuyên dùng)
Nếu máy bạn có cài Docker, chỉ cần mở Terminal (CMD) và gõ một dòng lệnh duy nhất:
```bash
docker compose up --build -d
```

Sau khi chạy xong, hãy mở trình duyệt web và truy cập:
- **Trang web chính:** `http://localhost:5173`

---

## 🔐 Tài khoản để Đăng nhập thử nghiệm

Hệ thống đã có sẵn dữ liệu mẫu. Bạn có thể dùng các tài khoản sau để đăng nhập và trải nghiệm thử các tính năng:

| Bạn muốn làm ai? | Tên đăng nhập | Mật khẩu | 
| :--- | :--- | :--- | 
| **Phòng Đào Tạo** | `admin` | `123456` | 
| **Giảng Viên** | `1000001` | `123456` | 
| **Sinh Viên** | `2300001` | `123456` | 

> *(Ghi chú: Sinh viên có thể thử tài khoản `2500001`, giảng viên có thể thử `1000002` v.v..)*

---

## 🛠️ Dành cho Dân Kỹ Thuật (Tech Stack)

Nếu bạn tò mò dự án này được lập trình bằng công nghệ gì:
- **Phần Giao diện (Frontend):** Xây dựng bằng `React 19` (Vite), giao diện theo phong cách Tối giản & Trẻ trung (Minimalism & Swiss Style).
- **Phần Xử lý (Backend):** Sử dụng `Spring Boot 3.5` (Java 23) mạnh mẽ, bảo mật bằng JWT.
- **Cơ sở dữ liệu (Database):** Lưu trữ trên `MySQL 8`.
- **Cấu trúc dữ liệu:** Toàn bộ API và luồng dữ liệu đều tuân thủ chuẩn RESTful.

---
*Phát triển bởi DevMarkie - 2026*
