-- ============================================================
-- MIGRATION: Luồng 1 - Quy trình Sửa điểm sau khóa sổ & Nhật ký vết
-- (Grade Amendment & Audit Trail)
-- ============================================================

USE student_management;

-- 1. Tạo bảng grade_change_tickets
CREATE TABLE IF NOT EXISTS grade_change_tickets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    class_section_id BIGINT NOT NULL,
    component_type VARCHAR(20) NOT NULL COMMENT 'Cột điểm cần sửa: CC1, CC2, MIDTERM, FINAL',
    old_score DECIMAL(4,2) NOT NULL COMMENT 'Điểm số ban đầu của sinh viên',
    new_score DECIMAL(4,2) NOT NULL COMMENT 'Điểm số mới đề xuất (0 - 10)',
    reason TEXT NOT NULL COMMENT 'Lý do sửa điểm chi tiết',
    evidence_url VARCHAR(500) NOT NULL COMMENT 'Đường dẫn tệp minh chứng bài thi / biên bản',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_DEPT' COMMENT 'PENDING_DEPT, PENDING_ACADEMIC, APPROVED, REJECTED',
    
    -- Người tạo yêu cầu (Giảng viên)
    created_by BIGINT NOT NULL COMMENT 'ID user giảng viên tạo đơn',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Cấp 1: Thẩm định Bộ môn/Khoa
    dept_reviewer_id BIGINT NULL COMMENT 'ID user Trưởng bộ môn thẩm định',
    dept_reviewed_at DATETIME NULL,
    dept_notes TEXT NULL COMMENT 'Ý kiến thẩm định chuyên môn',
    
    -- Cấp 2: Phê duyệt Phòng Đào tạo
    approved_by BIGINT NULL COMMENT 'ID user cán bộ Phòng Đào tạo duyệt cuối',
    approved_at DATETIME NULL,
    
    -- Lý do từ chối (nếu bị REJECTED)
    rejection_reason TEXT NULL COMMENT 'Lý do từ chối',
    
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_gct_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_gct_section FOREIGN KEY (class_section_id) REFERENCES course_sections(id) ON DELETE CASCADE,
    CONSTRAINT fk_gct_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_gct_dept_reviewer FOREIGN KEY (dept_reviewer_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_gct_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT ck_gct_new_score CHECK (new_score >= 0.00 AND new_score <= 10.00),
    INDEX idx_gct_section_student (class_section_id, student_id),
    INDEX idx_gct_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Nâng cấp bảng grade_audit_logs để liên kết với ticket_id, student_id, ip_address
SET @col_ticket = (
    SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'student_management' 
    AND TABLE_NAME = 'grade_audit_logs' 
    AND COLUMN_NAME = 'ticket_id'
);
SET @sql_ticket = IF(@col_ticket = 0, 
    'ALTER TABLE grade_audit_logs ADD COLUMN ticket_id BIGINT NULL AFTER id, ADD CONSTRAINT fk_grade_audit_ticket FOREIGN KEY (ticket_id) REFERENCES grade_change_tickets(id) ON DELETE SET NULL', 
    'SELECT 1'
);
PREPARE stmt_t FROM @sql_ticket;
EXECUTE stmt_t;
DEALLOCATE PREPARE stmt_t;

SET @col_student = (
    SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'student_management' 
    AND TABLE_NAME = 'grade_audit_logs' 
    AND COLUMN_NAME = 'student_id'
);
SET @sql_student = IF(@col_student = 0, 
    'ALTER TABLE grade_audit_logs ADD COLUMN student_id BIGINT NULL AFTER ticket_id, ADD CONSTRAINT fk_grade_audit_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL', 
    'SELECT 1'
);
PREPARE stmt_s FROM @sql_student;
EXECUTE stmt_s;
DEALLOCATE PREPARE stmt_s;

SET @col_ip = (
    SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'student_management' 
    AND TABLE_NAME = 'grade_audit_logs' 
    AND COLUMN_NAME = 'ip_address'
);
SET @sql_ip = IF(@col_ip = 0, 
    'ALTER TABLE grade_audit_logs ADD COLUMN ip_address VARCHAR(50) NULL AFTER changed_by', 
    'SELECT 1'
);
PREPARE stmt_ip FROM @sql_ip;
EXECUTE stmt_ip;
DEALLOCATE PREPARE stmt_ip;
