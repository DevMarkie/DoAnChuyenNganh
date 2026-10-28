-- Migration: Bảng quản lý đợt đăng ký tín chỉ (Registration Waves) phân bổ theo Khóa/Khoa
CREATE TABLE IF NOT EXISTS registration_waves (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    semester_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    cohort_id INT NULL,
    department_id INT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reg_waves_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
    CONSTRAINT fk_reg_waves_cohort FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE SET NULL,
    CONSTRAINT fk_reg_waves_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

CREATE INDEX idx_reg_waves_semester_active ON registration_waves (semester_id, is_active);
CREATE INDEX idx_reg_waves_time ON registration_waves (start_time, end_time);

-- Seed đợt đăng ký mặc định cho học kỳ đang kích hoạt (HK1-2026, ID=4)
INSERT INTO registration_waves (semester_id, name, cohort_id, department_id, start_time, end_time, description, is_active)
SELECT 
    s.id,
    CONCAT('Đợt đăng ký chính thức - ', s.semester_name),
    NULL,
    NULL,
    DATE_SUB(NOW(), INTERVAL 7 DAY),
    DATE_ADD(NOW(), INTERVAL 30 DAY),
    'Đợt đăng ký mở toàn trường cho mọi khóa và chuyên ngành',
    TRUE
FROM semesters s
WHERE s.is_current = TRUE
LIMIT 1;
