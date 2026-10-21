# 🗄️ CẨM NANG THIẾT KẾ & TỐI ƯU HÓA CƠ SỞ DỮ LIỆU
**Database Architecture, Indexing Strategy & Query Optimization Handbook**  
**Dự án:** Hệ Thống Quản Lý Đào Tạo & Sinh Viên (SMS / DoAnChuyenNganh)  
**Hệ quản trị CSDL:** MySQL 8.0 (InnoDB Engine, `utf8mb4_unicode_ci`)

---

## 📑 MỤC LỤC
1. [Tổng quan Kiến trúc CSDL](#1-tổng-quan-kiến-trúc-csdl)
2. [Cấu trúc Thư mục `database/`](#2-cấu-trúc-thư-mục-database)
3. [Danh mục 18 Bảng Cốt lõi & Ràng buộc](#3-danh-mục-18-bảng-cốt-lõi--ràng-buộc)
4. [Hệ thống Database Views phục vụ Truy xuất dữ liệu siêu tốc](#4-hệ-thống-database-views-phục-vụ-truy-xuất-dữ-liệu-siêu-tốc)
5. [Chiến lược Indexing & Tối ưu hóa truy vấn (Performance Tuning)](#5-chiến-lược-indexing--tối-ưu-hóa-truy-vấn-performance-tuning)
6. [Sổ tay Migration & Lịch sử nâng cấp CSDL](#6-sổ-tay-migration--lịch-sử-nâng-cấp-csdl)
7. [Mẫu truy vấn Tối ưu thường dùng (Best Practice SQL Recipes)](#7-mẫu-truy-vấn-tối-ưu-thường-dùng-best-practice-sql-recipes)

---

## 1. Tổng quan Kiến trúc CSDL

Cơ sở dữ liệu được thiết kế theo chuẩn hóa bậc 3 (3NF), tuân thủ chặt chẽ mô hình phân tích nghiệp vụ đào tạo tín chỉ đại học:
* **Hạt nhân danh mục:** `departments` (Khoa) ➜ `majors` (Ngành) ➜ `cohorts` (Khóa) ➜ `classes` (Lớp hành chính).
* **Khung chương trình:** `curriculum_programs` ➜ `curriculum_blocks` ➜ `curriculum_block_subjects` (Ràng buộc môn tiên quyết qua `subject_prerequisites`).
* **Vận hành giảng dạy:** `semesters` (Học kỳ) ➜ `course_sections` (Lớp học phần) ➜ `schedules` (Lịch học/phòng học).
* **Quản trị người học:** `users` ➜ `students` / `lecturers`.
* **Học vụ & Đánh giá:** `enrollments` (Đăng ký tín chỉ) ➜ `grades` (Bảng điểm 4 thành phần) ➜ `grade_appeals` (Phúc khảo).
* **Tài chính đào tạo:** `fee_scale_rules` ➜ `student_invoices` (Học phí theo quy mô sĩ số lớp riêng).

---

## 2. Cấu trúc Thư mục `database/`

```
database/
├── schema.sql                 # Schema chuẩn (Canonical DDL) chứa toàn bộ 18 bảng, views, triggers, indexes
├── seed.sql                   # Bộ dữ liệu mẫu chuẩn (Khoa, ngành, môn học, khung CTĐT, tài khoản demo)
├── migrations/                # Lịch sử các bản vá cấu trúc CSDL theo từng giai đoạn
│   ├── migration_academic_structure.sql        # Nâng cấp cấu trúc Khoa - Ngành - Khóa - CTĐT chuẩn
│   ├── populate_curriculum_subjects.sql        # Nạp dữ liệu môn học vào các khối kiến thức
│   ├── migrate_split_cc.sql                    # Tách điểm chuyên cần thành CC1 (5%) và CC2 (5%)
│   ├── migrate_grade_edit_window.sql           # Cấu hình cửa sổ 7 ngày cho phép giảng viên sửa điểm
│   ├── migrate_grade_appeals.sql               # Bổ sung quy trình phúc khảo điểm số
│   ├── migrate_special_class_billing.sql       # Bổ sung tính học phí lớp riêng theo sĩ số
│   ├── migrate_add_must_change_password.sql    # Bắt buộc đổi mật khẩu lần đầu đăng nhập
│   ├── migrate_fix_section_capacity.sql        # Đồng bộ sĩ số lớp học phần
│   ├── migrate_split_overcapacity_sections.sql # Tách lớp học phần quá tải sinh viên
│   ├── migrate_curriculum_block_names_vi.sql   # Chuẩn hóa tên khối kiến thức tiếng Việt
│   └── validate_academic_catalog.sql           # Script kiểm định tính toàn vẹn dữ liệu
└── README.md                  # Cẩm nang tài liệu này
```

---

## 3. Danh mục 18 Bảng Cốt lõi & Ràng buộc

| STT | Tên bảng | Chức năng chính | Khóa ngoại chính | Ghi chú toàn vẹn |
|:---:|:---|:---|:---|:---|
| 1 | `roles` | Phân quyền hệ thống | — | ENUM: `ADMIN`, `LECTURER`, `STUDENT` |
| 2 | `users` | Tài khoản đăng nhập, hash bcrypt | `role_id ➜ roles.id` | Unique `username`, `email` |
| 3 | `departments` | Khoa đào tạo | — | Unique `code`, `name` |
| 4 | `majors` | Ngành đào tạo trực thuộc khoa | `department_id ➜ departments.id` | Unique `code` |
| 5 | `cohorts` | Khóa tuyển sinh (K16..K19) | — | Unique `code`, năm tuyển sinh/tốt nghiệp |
| 6 | `curriculum_programs` | Khung CTĐT theo ngành + khóa | `major_id`, `cohort_id` | Unique composite `(major_id, cohort_id)` |
| 7 | `curriculum_blocks` | 5 khối kiến thức chuẩn | `program_id ➜ curriculum_programs.id` | Đại cương, Cơ sở, Chuyên ngành... |
| 8 | `curriculum_block_subjects` | Môn học trong từng khối | `block_id`, `subject_id` | Định nghĩa Bắt buộc (COMPULSORY) / Tự chọn |
| 9 | `classes` | Lớp sinh viên hành chính | `department_id`, `major_id`, `cohort_id` | Unique `code` |
| 10 | `students` | Hồ sơ sinh viên | `user_id ➜ users.id`, `class_id ➜ classes.id`| Unique `student_code` (VD: 2500001) |
| 11 | `lecturers` | Hồ sơ giảng viên | `user_id`, `department_id` | Unique `lecturer_code` (VD: 1000001) |
| 12 | `subjects` | Môn học (Số tín chỉ, học phần) | `department_id ➜ departments.id` | CHECK `credits BETWEEN 1 AND 10` |
| 13 | `subject_prerequisites` | Ràng buộc môn tiên quyết | `subject_id`, `prerequisite_id` | Chặn tự tham chiếu & vòng lặp |
| 14 | `semesters` | Học kỳ đào tạo | — | Registration window date constraints |
| 15 | `course_sections` | Lớp học phần mở trong kỳ | `subject_id`, `semester_id`, `lecturer_id` | Trạng thái: `OPEN`, `LOCKED_BILLING`... |
| 16 | `schedules` | Lịch dạy, thứ trong tuần, phòng | `section_id ➜ course_sections.id` | Bắt cặp thời gian start_date - end_date |
| 17 | `enrollments` | Kết quả đăng ký môn học | `student_id`, `section_id` | Trạng thái: `ENROLLED`, `CANCELLED` |
| 18 | `grades` | Bảng điểm 4 thành phần & chữ | `enrollment_id ➜ enrollments.id` | Trọng số: CC1 (5%), CC2 (5%), GK (30%), CK (60%) |

---

## 4. Hệ thống Database Views phục vụ Truy xuất dữ liệu siêu tốc

Để triệt tiêu lỗi **N+1 Query Storm** và giúp ứng dụng/API truy xuất dữ liệu tổng hợp chỉ trong **1 query duy nhất**, CSDL đã tích hợp sẵn 2 Database Views:

### View 1: `v_student_transcript` (Bảng điểm chi tiết toàn bộ học kỳ)
JOIN sẵn các bảng `enrollments`, `course_sections`, `subjects`, `semesters`, `grades`. Tự động tính toán:
* Điểm tổng kết hệ 10: `total_score = cc1*0.05 + cc2*0.05 + midterm*0.30 + final*0.60`.
* Điểm chữ hệ 4: `letter_grade` (A, B+, B, C+, C, D+, D, F) và `gpa_point` (4.0, 3.5, 3.0...).
* Cờ hoàn thành môn học: `is_passed = (final_score >= 4.0 AND total_score >= 4.0)`.

```sql
-- Truy xuất toàn bộ bảng điểm của 1 sinh viên trong 1 câu lệnh (Không N+1):
SELECT * FROM v_student_transcript 
WHERE student_id = 1 
ORDER BY semester_id ASC, subject_code ASC;
```

### View 2: `v_student_gpa` (GPA tích lũy & Tín chỉ tích lũy)
Tự động áp dụng quy tắc học chế tín chỉ:
1. Môn học thi lại (`RETAKE`): Chỉ lấy điểm của lần thi cao nhất (`MAX(gpa_point)`).
2. Điểm trượt (`F`): Không tính vào tín chỉ tích lũy nhưng vẫn tính vào mẫu số GPA tích lũy.

```sql
-- Truy xuất GPA tích lũy và tín chỉ đạt được của toàn bộ sinh viên trong khoa:
SELECT g.*, s.full_name, c.name AS class_name
FROM v_student_gpa g
JOIN students s ON g.student_id = s.id
JOIN classes c ON s.class_id = c.id
WHERE c.major_id = 1;
```

---

## 5. Chiến lược Indexing & Tối ưu hóa truy vấn (Performance Tuning)

Hệ thống đã triển khai sẵn **Composite Indexes** nhằm tối ưu hóa các điểm nghẽn hiệu năng thường gặp khi hàng ngàn sinh viên truy cập đồng thời:

| Tên Index | Bảng áp dụng | Các cột trong Index | Mục đích tối ưu hóa |
|:---|:---|:---|:---|
| `idx_enrollments_student_status` | `enrollments` | `(student_id, status)` | Tra cứu lịch học, thời khóa biểu, và tổng tín chỉ đã đăng ký theo sinh viên (`O(log N)`). |
| `idx_enrollments_section_status` | `enrollments` | `(section_id, status)` | Đếm sĩ số thực tế của lớp học phần, kiểm tra quá tải tức thì không scan full table. |
| `idx_sections_semester_status` | `course_sections` | `(semester_id, status)` | Lọc danh sách lớp học phần đang mở (`OPEN`) trong cổng đăng ký tín chỉ của học kỳ. |
| `idx_schedules_section_dates` | `schedules` | `(section_id, day_of_week, start_date, end_date)` | Phát hiện xung đột trùng lịch thời khóa biểu (Schedule Collision Detection). |
| `idx_curriculum_program_major_cohort` | `curriculum_programs` | `(major_id, cohort_id)` | Truy xuất cây khung chương trình đào tạo của sinh viên theo ngành và khóa nhập học. |
| `idx_block_subjects_subject` | `curriculum_block_subjects` | `(subject_id)` | Kiểm tra môn học thuộc khối kiến thức nào để tính điều kiện tốt nghiệp. |
| `idx_subject_prerequisites_required` | `subject_prerequisites` | `(prerequisite_id)` | Kiểm tra nhanh sinh viên đã đạt môn tiên quyết trước khi cho phép đăng ký lớp. |

---

## 6. Sổ tay Migration & Lịch sử nâng cấp CSDL

> [!IMPORTANT]
> **Quy tắc vàng khi khởi chạy CSDL mới:**
> Tệp `schema.sql` đã tích hợp đầy đủ và đồng bộ toàn bộ cấu trúc của các bản migration trước đó. Khi cài đặt lại từ đầu qua Docker (`docker compose up`), container sẽ tự động nạp `schema.sql` (bản hoàn chỉnh) và `seed.sql`. **Không chạy lại các tệp trong `migrations/`** để tránh lỗi `Duplicate column name` hoặc `Table already exists`.

### Bảng tra cứu tệp Migration:
* **`migration_academic_structure.sql`**: Chuyển đổi mô hình cũ sang mô hình 3 tầng (Khoa ➜ Ngành ➜ Khóa ➜ CTĐT 5 khối kiến thức).
* **`populate_curriculum_subjects.sql`**: Gán 60+ môn học mẫu vào các khối kiến thức cho ngành CNTT, Kỹ thuật Phần mềm, Trí tuệ Nhân tạo.
* **`migrate_split_cc.sql`**: Tách trường `cc_score` thành `cc1_score` và `cc2_score` theo quy chế đào tạo mới.
* **`migrate_grade_edit_window.sql`**: Bổ sung trường `finalized_at` cho bảng `grades` để hỗ trợ cơ chế khóa điểm mềm 7 ngày.
* **`migrate_grade_appeals.sql`**: Tạo bảng `grade_appeals` hỗ trợ sinh viên khiếu nại và phúc khảo điểm bài thi.
* **`migrate_special_class_billing.sql`**: Bổ sung bảng hóa đơn `student_invoices` và bảng đơn mở lớp `class_opening_requests`.
* **`migrate_add_must_change_password.sql`**: Thêm cờ `must_change_password` vào bảng `users` để bảo vệ tài khoản mới cấp.
* **`migrate_fix_section_capacity.sql`**: Chuẩn hóa sĩ số tối đa (`max_students`) và tối thiểu (`min_students`).

---

## 7. Mẫu truy vấn Tối ưu thường dùng (Best Practice SQL Recipes)

### 1. Kiểm tra sinh viên có bị trùng lịch học khi đăng ký lớp mới không:
```sql
SELECT s1.section_id AS conflicting_section, s1.day_of_week, s1.start_period, s1.end_period
FROM schedules s1
JOIN enrollments e ON s1.section_id = e.section_id AND e.status = 'ENROLLED'
JOIN schedules s2 ON s2.section_id = :target_section_id
WHERE e.student_id = :student_id
  AND s1.day_of_week = s2.day_of_week
  AND s1.start_date <= s2.end_date 
  AND s1.end_date >= s2.start_date
  AND s1.start_period <= s2.end_period 
  AND s1.end_period >= s2.start_period;
```

### 2. Cảnh báo học vụ: Lọc danh sách sinh viên có GPA học kỳ < 1.0 (Dùng Index & View):
```sql
SELECT t.student_id, t.student_code, t.student_name, t.semester_name,
       ROUND(SUM(t.gpa_point * t.credits) / SUM(t.credits), 2) AS semester_gpa
FROM v_student_transcript t
WHERE t.semester_id = :current_semester_id
  AND t.is_finalized = TRUE
GROUP BY t.student_id, t.student_code, t.student_name, t.semester_name
HAVING semester_gpa < 1.00;
```

### 3. Kiểm tra điều kiện tiên quyết trước khi đăng ký môn học:
```sql
-- Trả về các môn tiên quyết mà sinh viên CHƯA ĐẠT (is_passed != TRUE):
SELECT sp.prerequisite_id, sub.subject_code, sub.subject_name
FROM subject_prerequisites sp
JOIN subjects sub ON sp.prerequisite_id = sub.id
WHERE sp.subject_id = :target_subject_id
  AND sp.prerequisite_id NOT IN (
      SELECT DISTINCT t.subject_id 
      FROM v_student_transcript t
      WHERE t.student_id = :student_id 
        AND t.is_passed = TRUE
  );
```
