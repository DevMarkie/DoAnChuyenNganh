-- ============================================================
-- Migration: Bảng tổng hợp học vụ Snapshot (Academic Summary) & Cảnh báo học vụ
-- Mục C: BR-Grade04 & Quy chế xử lý học vụ tự động
-- ============================================================

CREATE TABLE IF NOT EXISTS academic_summaries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    semester_id INT NOT NULL,
    semester_gpa DECIMAL(4,2),
    cumulative_cpa DECIMAL(4,2),
    semester_credits INT DEFAULT 0,
    accumulated_credits INT DEFAULT 0,
    debt_credits INT DEFAULT 0,
    warning_level INT NOT NULL DEFAULT 0,
    max_allowed_credits INT DEFAULT 24,
    warning_notice TEXT,
    calculated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_student_semester_summary UNIQUE (student_id, semester_id),
    CONSTRAINT fk_summary_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_summary_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm cột academic_warning_level vào bảng students nếu chưa có
SET @dbname = DATABASE();
SET @tablename = "students";
SET @columnname = "academic_warning_level";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE students ADD COLUMN academic_warning_level INT NOT NULL DEFAULT 0;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Cấu hình mặc định khử trùng lặp CPA
INSERT INTO system_configs (config_key, config_value, description, created_at, updated_at)
VALUES ('cpa_deduplication_strategy', 'HIGHEST_SCORE', 'Chiến lược tính CPA khi học lại môn: HIGHEST_SCORE (lấy điểm cao nhất) hoặc LATEST_ATTEMPT (lấy lần thi gần nhất)', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();
