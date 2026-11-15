-- ============================================================
-- Migration V17: Add version column to students table for optimistic locking
-- Milestone M1: Concurrency and Lost Update Fix
-- ============================================================

SET @col_student_version = (SELECT COUNT(*) FROM information_schema.COLUMNS 
                            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'version');
SET @sql_student_version = IF(@col_student_version = 0, 
    'ALTER TABLE students ADD COLUMN version INT NOT NULL DEFAULT 0 AFTER financial_hold;', 
    'SELECT "version already exists in students";');
PREPARE stmt FROM @sql_student_version;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
