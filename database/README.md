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
6. [Sổ tay Migration & Lịch sử nâng cấp CSDL (27 bản vá)](#6-sổ-tay-migration--lịch-sử-nâng-cấp-csdl-27-bản-vá)
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

```text
database/
├── schema.sql                 # Canonical DDL: toàn bộ 18+ bảng, views, composite indexes hoàn chỉnh
├── seed.sql                   # Bộ dữ liệu mẫu chuẩn (Khoa, ngành, môn học, khung CTĐT, tài khoản demo)
├── migrations/                # Kho lưu trữ 27 bản migration theo tiến trình nâng cấp dự án
└── README.md                  # Cẩm nang tài liệu kỹ thuật này
```

---

## 3. Danh mục 18 Bảng Cốt lõi & Ràng buộc

| STT | Tên bảng | Chức năng chính | Khóa ngoại chính | Ghi chú toàn vẹn |
|:---:|:---|:---|:---|:---|
| 1 | `roles` | Phân quyền hệ thống | — | ENUM: `ADMIN`, `LECTURER`, `STUDENT`, `EXAMINATION_OFFICER`, `ACADEMIC_AFFAIRS` |
| 2 | `users` | Tài khoản đăng nhập, hash bcrypt | `role_id ➜ roles.id` | Unique `username`, `email`, cờ `must_change_password` |
| 3 | `departments` | Khoa đào tạo | — | Unique `code`, `name` |
| 4 | `majors` | Ngành đào tạo | `department_id ➜ departments.id` | Unique `code` |
| 5 | `cohorts` | Khóa tuyển sinh (K16, K17...) | — | Unique `year`, `code` |
| 6 | `classes` | Lớp hành chính / Lớp sinh hoạt | `major_id`, `cohort_id` | Unique `class_code` |
| 7 | `students` | Hồ sơ sinh viên, tiến độ học | `user_id`, `class_id` | Unique `student_code` |
| 8 | `lecturers` | Hồ sơ giảng viên | `user_id`, `department_id` | Unique `lecturer_code` |
| 9 | `subjects` | Danh mục học phần, số tín chỉ | `department_id` | Unique `code` |
| 10 | `subject_prerequisites` | Môn học tiên quyết / song hành | `subject_id`, `prerequisite_id` | Chống chu trình phụ thuộc vòng |
| 11 | `curriculum_programs` | Khung CTĐT theo ngành + khóa | `major_id`, `cohort_id` | Ràng buộc tổng 135–140 tín chỉ |
| 12 | `curriculum_blocks` | 5 khối kiến thức chuẩn | `program_id` | Đại cương, Cơ sở nhóm ngành, Chuyên ngành... |
| 13 | `curriculum_block_subjects` | Môn học thuộc khối kiến thức | `block_id`, `subject_id` | Cờ môn bắt buộc / tự chọn |
| 14 | `semesters` | Học kỳ đào tạo | — | Trạng thái: `OPEN_REG`, `ONGOING`, `FINISHED` |
| 15 | `course_sections` | Lớp học phần mở trong kỳ | `subject_id`, `semester_id`, `lecturer_id` | Sĩ số max/min, atomic update |
| 16 | `schedules` | Thời khóa biểu chi tiết | `section_id` | Ca học, phòng học, thứ trong tuần |
| 17 | `enrollments` | Kết quả đăng ký tín chỉ | `student_id`, `section_id` | Trạng thái: `ENROLLED`, `DROPPED`, `CANCELLED` |
| 18 | `grades` | Bảng điểm 4 thành phần | `enrollment_id` | CC1 (5%), CC2 (5%), GK (30%), CK (60%) |

---

## 4. Hệ thống Database Views phục vụ Truy xuất dữ liệu siêu tốc

### 1. `v_student_transcript`
Tổng hợp bảng điểm toàn diện của sinh viên: tên môn, số tín chỉ, điểm chi tiết, điểm tổng kết hệ 10, hệ 4, điểm chữ và trạng thái ĐẠT/HỌC LẠI. Khử hoàn toàn bài toán N+1 truy vấn khi render bảng điểm.

### 2. `v_student_gpa`
Tự động tính toán GPA học kỳ và CPA tích lũy thời gian thực. Hỗ trợ áp dụng cơ chế "Best-Grade": khi sinh viên học cải thiện môn học, hệ thống tự động ưu tiên lấy điểm cao nhất để tính vào điểm tích lũy tốt nghiệp.

---

## 5. Chiến lược Indexing & Tối ưu hóa truy vấn (Performance Tuning)

| Tên Index | Bảng | Cột áp dụng | Mục đích tối ưu |
|:---|:---|:---|:---|
| `idx_enrollments_student_section` | `enrollments` | `(student_id, section_id)` | Kiểm tra sinh viên đã đăng ký học phần hay chưa (O(1)). |
| `idx_sections_semester_status` | `course_sections` | `(semester_id, status)` | Lọc danh sách lớp học phần đang mở (`OPEN`) trong cổng đăng ký tín chỉ. |
| `idx_schedules_section_dates` | `schedules` | `(section_id, day_of_week, start_date, end_date)` | Phát hiện xung đột trùng lịch thời khóa biểu (Schedule Collision Detection). |
| `idx_curriculum_program_major_cohort` | `curriculum_programs` | `(major_id, cohort_id)` | Truy xuất cây khung chương trình đào tạo của sinh viên theo ngành và khóa. |
| `idx_block_subjects_subject` | `curriculum_block_subjects` | `(subject_id)` | Kiểm tra môn học thuộc khối kiến thức nào để tính điều kiện tốt nghiệp. |
| `idx_subject_prerequisites_required` | `subject_prerequisites` | `(prerequisite_id)` | Kiểm tra sinh viên đã đạt môn tiên quyết trước khi cho phép đăng ký lớp. |

---

## 6. Sổ tay Migration & Lịch sử nâng cấp CSDL (27 bản vá)

> [!IMPORTANT]
> **Quy tắc khi khởi chạy CSDL mới:**
> Tệp `schema.sql` đã tích hợp đầy đủ và đồng bộ toàn bộ cấu trúc của tất cả các bản migration. Khi cài đặt mới qua Docker (`docker compose up`), container sẽ tự động nạp `schema.sql` và `seed.sql`. Các bản vá trong `migrations/` dùng để tra cứu lịch sử nâng cấp và áp dụng cho cơ sở dữ liệu production đang chạy.

### Danh mục đầy đủ 27 tệp Migration:

#### Nhóm 1: Khung CTĐT & Danh mục Học vụ
1. `migration_academic_structure.sql`: Chuyển đổi mô hình sang cấu trúc 3 tầng (Khoa ➜ Ngành ➜ Khóa ➜ CTĐT 5 khối kiến thức).
2. `populate_curriculum_subjects.sql`: Gán môn học vào các khối kiến thức cho 22 ngành đào tạo.
3. `migrate_curriculum_block_names_vi.sql`: Chuẩn hóa tên các khối kiến thức đào tạo bằng tiếng Việt có dấu.
4. `validate_academic_catalog.sql`: Script kiểm định tính toàn vẹn quan hệ giữa danh mục môn học và khung CTĐT.

#### Nhóm 2: Lớp học phần & Xếp lịch
5. `migrate_fix_section_capacity.sql`: Đồng bộ và chuẩn hóa giới hạn sĩ số tối đa/tối thiểu của lớp học phần.
6. `migrate_split_overcapacity_sections.sql`: Tách lớp học phần quá tải sinh viên thành các phân lớp con.
7. `migrate_luong1_registration_shifts_and_majors.sql`: Phân ca đăng ký tín chỉ theo thời gian và mở rộng ngành đào tạo.
8. `migrate_luong1_registration_waves.sql`: Thiết lập các đợt mở cổng đăng ký tín chỉ theo từng khóa sinh viên.

#### Nhóm 3: Sổ điểm, Khóa sổ & Phúc khảo
9. `migrate_split_cc.sql`: Tách điểm chuyên cần thành 2 cột độc lập: CC1 (5%) và CC2 (5%).
10. `migrate_grade_edit_window.sql`: Bổ sung trường `finalized_at` cho bảng `grades`, kích hoạt cửa sổ ân hạn sửa điểm 7 ngày.
11. `migrate_grade_appeals.sql`: Tạo bảng `grade_appeals` phục vụ quy trình sinh viên khiếu nại và phúc khảo bài thi.
12. `migrate_luong1_grade_amendment_and_audit.sql`: Bổ sung cơ chế đề xuất - xét duyệt sửa điểm sau khi khóa sổ và ghi vết audit log.
13. `migrate_luong2_grade_submission_and_appeals.sql`: Hoàn thiện quy trình nộp bảng điểm và xét duyệt phúc khảo đa cấp.

#### Nhóm 4: Khảo thí, Phòng thi & Điểm thi
14. `migrate_examination_officer_role_and_audit.sql`: Bổ sung vai trò Cán bộ khảo thí (`EXAMINATION_OFFICER`) và phân quyền audit.
15. `migrate_exam_management_and_scoring.sql`: Quản lý danh sách phòng thi, số báo danh và quy trình nhập điểm thi độc lập.
16. `migrate_past_semesters_and_exams.sql`: Nạp dữ liệu các kỳ thi và học kỳ trước để kiểm thử lịch sử kết quả học tập.

#### Nhóm 5: Học vụ, Cảnh báo & Tài chính
17. `migrate_academic_affairs_role.sql`: Bổ sung vai trò Chuyên viên Phòng Đào tạo (`ACADEMIC_AFFAIRS`).
18. `migrate_academic_summary_and_warning.sql`: Xử lý rà soát tự động cảnh báo học vụ (Mức 1, Mức 2, Buộc thôi học) theo quy chế.
19. `migrate_phase1_student_profile_conduct.sql`: Quản lý hồ sơ cá nhân và điểm rèn luyện định kỳ của sinh viên.
20. `migrate_special_class_billing.sql`: Bổ sung bảng hóa đơn `student_invoices` và tính học phí lớp riêng theo quy mô sĩ số.
21. `migrate_admin_coordination_and_tuition.sql`: Quản lý bàn thu ngân, gia hạn nộp học phí và điều phối đào tạo.
22. `migrate_student_balance_and_business_rules.sql`: Quản lý số dư tài khoản sinh viên và ví học phí đào tạo.
23. `migrate_luong3_rule_b_financial_hold.sql`: Chặn đăng ký học phần khi còn nợ học phí quá hạn (Rule B).
24. `migrate_luong3_rule_engine.sql`: Tích hợp bộ quy tắc nghiệp vụ liên thông (Cross-cutting rule engine).
25. `migrate_notifications_upgrade.sql`: Nâng cấp hệ thống thông báo realtime cho người dùng.
26. `migrate_v3_actors_and_modules.sql`: Đồng bộ toàn bộ các vai trò và phân hệ phiên bản V3.
27. `fix_vietnamese_encoding.sql`: Vá lỗi mã hóa bảng mã tiếng Việt Unicode trên toàn bộ cơ sở dữ liệu.

---

## 7. Mẫu truy vấn Tối ưu thường dùng (Best Practice SQL Recipes)

### 1. Kiểm tra trùng lịch học khi đăng ký lớp mới:
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

### 2. Lọc danh sách sinh viên bị cảnh báo học vụ (GPA học kỳ < 1.0):
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
