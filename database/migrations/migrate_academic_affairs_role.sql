-- ============================================================
-- Migration: Add ACADEMIC_AFFAIRS Role and Seed Demo User
-- Conforms to Role-Permission Matrix (Separation of Duties)
-- ============================================================

-- 1. Cập nhật Check Constraint bảng roles
ALTER TABLE roles DROP CHECK ck_roles_name;
ALTER TABLE roles ADD CONSTRAINT ck_roles_name CHECK (name IN ('ADMIN', 'LECTURER', 'STUDENT', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF'));

-- 2. Thêm vai trò ACADEMIC_AFFAIRS (ID = 4)
INSERT INTO roles (id, name) VALUES (4, 'ACADEMIC_AFFAIRS')
ON DUPLICATE KEY UPDATE name = 'ACADEMIC_AFFAIRS';

-- 3. Thêm tài khoản mẫu Cán bộ Đào tạo 'daotao'
-- Mật khẩu tuân thủ chuẩn an toàn quốc tế (>=12 ký tự, chữ hoa, chữ thường, số, ký tự đặc biệt): Daotao@2026!
-- BCrypt Hash: $2a$10$QrVpwhAW3aIYp9zMBzzl9ewuNuQdDkJO.6TUzUSkQKzzmF/kC7EDS
INSERT INTO users (username, password, email, role_id, is_active, must_change_password)
SELECT 'daotao', '$2a$10$QrVpwhAW3aIYp9zMBzzl9ewuNuQdDkJO.6TUzUSkQKzzmF/kC7EDS', 'daotao@sms.edu.vn', 4, TRUE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'daotao');

-- 4. Hỗ trợ trạng thái PROPOSED cho luồng phúc khảo 2 bước (Giảng viên đề xuất -> Cán bộ đào tạo duyệt)
ALTER TABLE grade_appeals MODIFY COLUMN status ENUM('PENDING', 'IN_REVIEW', 'PROPOSED', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING';
