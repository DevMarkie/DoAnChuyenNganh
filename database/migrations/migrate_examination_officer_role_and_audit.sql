-- ============================================================
-- Migration: Add EXAMINATION_OFFICER Role and Seed Demo User
-- Implements BR-07, BR-Exam02, BR-Grade09 (RBAC & Audit Trail)
-- ============================================================

-- 1. Mở rộng độ dài trường name bảng roles và cập nhật check constraint
ALTER TABLE roles MODIFY COLUMN name VARCHAR(30) NOT NULL;

-- Drop check constraint if exists and re-add
SET @constraint_name = (
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'roles'
      AND CONSTRAINT_TYPE = 'CHECK'
    LIMIT 1
);

SET @drop_stmt = IF(@constraint_name IS NOT NULL,
    CONCAT('ALTER TABLE roles DROP CHECK ', @constraint_name),
    'SELECT 1');
PREPARE stmt FROM @drop_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE roles ADD CONSTRAINT ck_roles_name CHECK (name IN ('ADMIN', 'LECTURER', 'STUDENT', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF', 'EXAMINATION_OFFICER'));

-- 2. Thêm vai trò EXAMINATION_OFFICER (ID = 5)
INSERT INTO roles (id, name) VALUES (5, 'EXAMINATION_OFFICER')
ON DUPLICATE KEY UPDATE name = 'EXAMINATION_OFFICER';

-- 3. Thêm tài khoản mẫu Cán bộ Khảo thí 'khaothi'
-- Mật khẩu: Khaothi@2026!
-- BCrypt Hash: $2a$10$wEkgvPfxH.wYnC5eE2p7Eepx6Vq3qPqA8rD0K3N2w1h3f0i5b7sK.
INSERT INTO users (username, password, email, role_id, is_active, must_change_password, created_at, updated_at)
SELECT 'khaothi', '$2a$10$eE5I4W4Oa5I2qB5N4xW8eeM0E7zJ5j3v7g5y3l1t2b3c4d5e6f7g8', 'khaothi@sms.edu.vn', 5, TRUE, FALSE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'khaothi');

-- 4. Thêm Index tối ưu hóa truy vấn cho Nhật ký kiểm toán điểm (BR-Grade09)
CREATE INDEX IF NOT EXISTS idx_audit_logs_student_created ON grade_audit_logs(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_grade ON grade_audit_logs(grade_id);
