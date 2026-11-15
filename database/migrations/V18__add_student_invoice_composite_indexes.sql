-- ============================================================
-- Migration V18: Add composite indexes to student_invoices table
-- Milestone M3: Database & Performance Optimization
-- Composite indexes on (student_id, status) and (section_id, status)
-- ============================================================

SET @idx_student_status = (SELECT COUNT(*) FROM information_schema.STATISTICS 
                           WHERE TABLE_SCHEMA = DATABASE() 
                             AND TABLE_NAME = 'student_invoices' 
                             AND INDEX_NAME = 'idx_student_invoices_student_status');
SET @sql_student_status = IF(@idx_student_status = 0, 
    'CREATE INDEX idx_student_invoices_student_status ON student_invoices (student_id, status);', 
    'SELECT "idx_student_invoices_student_status already exists";');
PREPARE stmt1 FROM @sql_student_status;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

SET @idx_section_status = (SELECT COUNT(*) FROM information_schema.STATISTICS 
                           WHERE TABLE_SCHEMA = DATABASE() 
                             AND TABLE_NAME = 'student_invoices' 
                             AND INDEX_NAME = 'idx_student_invoices_section_status');
SET @sql_section_status = IF(@idx_section_status = 0, 
    'CREATE INDEX idx_student_invoices_section_status ON student_invoices (section_id, status);', 
    'SELECT "idx_student_invoices_section_status already exists";');
PREPARE stmt2 FROM @sql_section_status;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
