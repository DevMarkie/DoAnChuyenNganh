# QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

## 1. Ràng buộc Khung chương trình & Mở Lớp (Course Rules)
- **BR-Course01 (Tiên quyết):** Để đăng ký học phần B, sinh viên phải hoàn thành học phần tiên quyết A với mức điểm tổng kết >= D (Thang điểm chữ) hoặc >= 4.0 (Thang 10).
- **BR-Course02 (Sĩ số Lớp):** Không cho phép sinh viên đăng ký khi `CurrentEnrolled >= MaxCapacity`. Phòng Đào tạo được phép Override rule này trong trường hợp ngoại lệ.

## 2. Ràng buộc Đăng ký Tín chỉ (Enrollment Rules)
- **BR-Reg01 (Trùng lịch TKB):** Một sinh viên không được phép đăng ký 2 lớp học phần có giao nhau về [Thứ, Ca Bắt Đầu, Ca Kết Thúc].
- **BR-Reg02 (Giới hạn tín chỉ):** Trong học kỳ chính, tổng số tín chỉ đăng ký `TotalCredits` phải thỏa mãn: `14 <= TotalCredits <= 24`.
- **BR-Reg03 (Khóa cổng ĐK):** Mọi giao dịch Đăng ký / Hủy đăng ký chỉ được thực thi khi `Semester.Status == 'Open'`.

## 3. Ràng buộc Điểm số & Xét loại (Grading & GPA Rules)
- **BR-Grade01 (Công thức quy đổi):**
  Tổng kết hệ 10 = `(CC * Tỷ_trọng_CC) + (GK * Tỷ_trọng_GK) + (CK * Tỷ_trọng_CK)`
- **BR-Grade02 (Chuyển đổi Hệ 4 & Điểm chữ):**
  - `>= 8.5` -> A (4.0)
  - `7.0 - 8.4` -> B (3.0)
  - `5.5 - 6.9` -> C (2.0)
  - `4.0 - 5.4` -> D (1.0)
  - `< 4.0` -> F (0.0 - Trượt)
- **BR-Grade03 (Chốt & cửa sổ chỉnh sửa):** Khi giảng viên chốt bảng điểm, điểm được **công bố cho sinh viên ngay**. Giảng viên còn **7 ngày** kể từ thời điểm chốt (`finalizedAt`) để chỉnh sửa; mốc này không gia hạn khi sửa trong hạn. Quá 7 ngày, hệ thống **khóa cứng** — chỉ **Quản trị viên (Phòng Đào tạo)** mới mở khóa để sửa lại (có ghi log audit).
