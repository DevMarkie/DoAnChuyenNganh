-- ============================================================
-- MIGRATION: Luồng 3 - Bộ máy Kích hoạt Tự động liên thông (Cross-cutting Rule Engine)
-- Quy tắc liên thông B: Hạn học phí -> Đóng băng dịch vụ học vụ (FINANCIAL_HOLD)
-- ============================================================

ALTER TABLE students
    ADD COLUMN financial_hold BOOLEAN NOT NULL DEFAULT FALSE AFTER balance;

CREATE INDEX idx_students_financial_hold ON students (financial_hold);
