-- ============================================================
-- MIGRATION: Luồng 2 - Nhập điểm, khóa sổ và phúc khảo
-- ============================================================

-- 1. Bổ sung Trưởng bộ môn / Trưởng khoa vào bảng departments
ALTER TABLE departments
    ADD COLUMN head_lecturer_id BIGINT NULL AFTER is_active,
    ADD CONSTRAINT fk_departments_head_lecturer 
        FOREIGN KEY (head_lecturer_id) REFERENCES lecturers (id) ON DELETE SET NULL;

-- 2. Bổ sung thời điểm phát hành và lý do trả về vào course_sections
ALTER TABLE course_sections
    ADD COLUMN published_at DATETIME NULL AFTER grade_submission_status,
    ADD COLUMN grade_return_reason TEXT NULL AFTER published_at;

-- 3. Nâng cấp bảng grade_appeals để hỗ trợ phân công chấm độc lập và ký duyệt điện tử cấp Khoa
ALTER TABLE grade_appeals
    MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN assigned_lecturer_id BIGINT NULL AFTER status,
    ADD COLUMN assigned_at DATETIME NULL AFTER assigned_lecturer_id,
    ADD COLUMN has_mechanical_error BOOLEAN NOT NULL DEFAULT FALSE AFTER assigned_at,
    ADD COLUMN score_diff DECIMAL(4,2) NULL AFTER has_mechanical_error,
    ADD COLUMN exceeds_threshold BOOLEAN NOT NULL DEFAULT FALSE AFTER score_diff,
    ADD COLUMN head_reviewer_id BIGINT NULL AFTER exceeds_threshold,
    ADD COLUMN head_approved_at DATETIME NULL AFTER head_reviewer_id,
    ADD COLUMN head_signature_hash VARCHAR(128) NULL AFTER head_approved_at,
    ADD COLUMN head_review_notes TEXT NULL AFTER head_signature_hash,
    ADD COLUMN final_adjustment_reason TEXT NULL AFTER head_review_notes,
    ADD COLUMN applied_by_user_id BIGINT NULL AFTER final_adjustment_reason,
    ADD COLUMN applied_at DATETIME NULL AFTER applied_by_user_id,
    ADD CONSTRAINT fk_appeal_assigned_lecturer FOREIGN KEY (assigned_lecturer_id) REFERENCES lecturers (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_appeal_head_reviewer FOREIGN KEY (head_reviewer_id) REFERENCES users (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_appeal_applied_by FOREIGN KEY (applied_by_user_id) REFERENCES users (id) ON DELETE SET NULL;

CREATE INDEX idx_appeals_assigned_lecturer ON grade_appeals (assigned_lecturer_id);
CREATE INDEX idx_appeals_head_reviewer ON grade_appeals (head_reviewer_id);

-- Cập nhật mặc định Trưởng khoa cho các khoa hiện có nếu có giảng viên tương ứng
UPDATE departments d
JOIN lecturers l ON l.department_id = d.id
SET d.head_lecturer_id = l.id
WHERE d.head_lecturer_id IS NULL
  AND l.id = (SELECT MIN(l2.id) FROM lecturers l2 WHERE l2.department_id = d.id);
