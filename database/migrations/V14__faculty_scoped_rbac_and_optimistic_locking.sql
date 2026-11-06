-- ============================================================
-- V14__faculty_scoped_rbac_and_optimistic_locking.sql
-- Mở rộng phân quyền Cán bộ Đào tạo theo Khoa & Khóa lạc quan chống xung đột dữ liệu
-- ============================================================

SET NAMES 'utf8mb4';

-- 1. Đảm bảo vai trò ACADEMIC_STAFF tồn tại trong roles
INSERT INTO roles (id, name) VALUES (6, 'ACADEMIC_STAFF')
ON DUPLICATE KEY UPDATE name = 'ACADEMIC_STAFF';

-- 2. Thêm cột department_id vào users nếu chưa tồn tại
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'department_id');
SET @sql_users = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN department_id INT NULL AFTER role_id, ADD CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;', 
    'SELECT "department_id already exists in users";');
PREPARE stmt FROM @sql_users;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Thêm cột version vào course_sections
SET @col_cs_version = (SELECT COUNT(*) FROM information_schema.COLUMNS 
                       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'course_sections' AND COLUMN_NAME = 'version');
SET @sql_cs = IF(@col_cs_version = 0, 
    'ALTER TABLE course_sections ADD COLUMN version INT NOT NULL DEFAULT 0 AFTER room;', 
    'SELECT "version already exists in course_sections";');
PREPARE stmt FROM @sql_cs;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Thêm cột version vào subjects
SET @col_sub_version = (SELECT COUNT(*) FROM information_schema.COLUMNS 
                        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subjects' AND COLUMN_NAME = 'version');
SET @sql_sub = IF(@col_sub_version = 0, 
    'ALTER TABLE subjects ADD COLUMN version INT NOT NULL DEFAULT 0 AFTER description;', 
    'SELECT "version already exists in subjects";');
PREPARE stmt FROM @sql_sub;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Thêm cột version vào schedules
SET @col_sched_version = (SELECT COUNT(*) FROM information_schema.COLUMNS 
                          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'schedules' AND COLUMN_NAME = 'version');
SET @sql_sched = IF(@col_sched_version = 0, 
    'ALTER TABLE schedules ADD COLUMN version INT NOT NULL DEFAULT 0 AFTER note;', 
    'SELECT "version already exists in schedules";');
PREPARE stmt FROM @sql_sched;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. Chuẩn hóa dữ liệu tài khoản và phân công Cán bộ theo Khoa
-- Quản trị viên trưởng
UPDATE users 
SET username = 'admin',
    full_name = 'Nguyễn Hoàng Long', 
    email = 'admin@sms.edu.vn',
    role_id = (SELECT id FROM roles WHERE name = 'ADMIN'),
    department_id = NULL 
WHERE username = 'admin';

-- Quản trị viên kỹ thuật
UPDATE users 
SET username = 'admin_tech',
    full_name = 'Lê Hoàng Nam', 
    email = 'admin.tech@sms.edu.vn',
    role_id = (SELECT id FROM roles WHERE name = 'ADMIN'),
    department_id = NULL 
WHERE username IN ('admin_tech', 'AD001');

-- Cán bộ Đào tạo cấp Trường (Toàn trường, department_id = NULL)
UPDATE users 
SET username = 'daotao',
    full_name = 'Nguyễn Văn Đào', 
    email = 'daotao@sms.edu.vn',
    role_id = (SELECT id FROM roles WHERE name = 'ACADEMIC_AFFAIRS'),
    department_id = NULL 
WHERE username = 'daotao';

-- Giáo vụ Khoa Công nghệ Thông tin (department_id = 1)
UPDATE users 
SET username = 'giaovu_cntt',
    full_name = 'Lê Thị Thanh', 
    email = 'giaovu.cntt@sms.edu.vn',
    role_id = (SELECT id FROM roles WHERE name = 'ACADEMIC_STAFF'),
    department_id = 1 
WHERE username IN ('giaovu_cntt', 'daotao01');

-- Giáo vụ Khoa Kỹ thuật & Công nghệ Ô tô (department_id = 2)
UPDATE users 
SET username = 'giaovu_oto',
    full_name = 'Phạm Thanh Tùng', 
    email = 'giaovu.oto@sms.edu.vn',
    role_id = (SELECT id FROM roles WHERE name = 'ACADEMIC_STAFF'),
    department_id = 2 
WHERE username IN ('giaovu_oto', 'NV001');

-- Giáo vụ Khoa Kinh tế & Quản trị Kinh doanh (department_id = 3)
UPDATE users 
SET username = 'giaovu_kt',
    full_name = 'Đặng Quốc Huy', 
    email = 'giaovu.kt@sms.edu.vn',
    role_id = (SELECT id FROM roles WHERE name = 'ACADEMIC_STAFF'),
    department_id = 3 
WHERE username IN ('giaovu_kt', 'CB001');

-- Cán bộ Khảo thí
UPDATE users 
SET username = 'khaothi',
    full_name = 'Trần Thị Khảo', 
    email = 'khaothi@sms.edu.vn',
    role_id = (SELECT id FROM roles WHERE name = 'EXAMINATION_OFFICER'),
    department_id = NULL 
WHERE username = 'khaothi';
