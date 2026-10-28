-- ============================================================
-- MIGRATION: Luồng 3 - Bộ máy Kích hoạt Tự động liên thông (Cross-cutting Rule Engine)
-- Quy tắc liên thông A: Điểm danh -> Cấm thi tự động
-- ============================================================

-- 1. Bổ sung cột attendance_status vào bảng enrollments để theo dõi điều kiện dự thi
ALTER TABLE enrollments
    ADD COLUMN attendance_status VARCHAR(20) NOT NULL DEFAULT 'QUALIFIED' AFTER enrollment_type;

CREATE INDEX idx_enrollments_attendance_status ON enrollments (attendance_status);
