-- ============================================================
-- MIGRATION: SMS v3.0 - 4 ACTORS & NEW FUNCTIONAL MODULES
-- Targets: ACADEMIC_STAFF role, System Configs, Audit Logs,
-- Backup Histories, Academic Exceptions, Graduation Records,
-- Conduct Scores, Student Service Requests, Grade Submission Status
-- ============================================================

USE student_management;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. UPDATE ROLES TABLE CONSTRAINT & ADD ACADEMIC_STAFF
ALTER TABLE roles DROP CHECK ck_roles_name;
ALTER TABLE roles ADD CONSTRAINT ck_roles_name CHECK (name IN ('ADMIN', 'ACADEMIC_STAFF', 'LECTURER', 'STUDENT'));

INSERT INTO roles (id, name) VALUES (4, 'ACADEMIC_STAFF')
ON DUPLICATE KEY UPDATE name = 'ACADEMIC_STAFF';

-- 2. CREATE STAFF USER (Password: 123456)
INSERT INTO users (username, password, email, role_id, is_active, must_change_password)
VALUES ('staff', '$2a$10$s2ivIIT7Cjhf0iL2WrXiteC.rcBvNLSbPq2c3CwV38YrpDgh4h0wm', 'daotao@sms.edu.vn', 4, TRUE, FALSE)
ON DUPLICATE KEY UPDATE role_id = 4, is_active = TRUE;

-- 3. ADD GRADE SUBMISSION STATUS TO COURSE_SECTIONS
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'student_management' 
    AND TABLE_NAME = 'course_sections' 
    AND COLUMN_NAME = 'grade_submission_status'
);

SET @stmt = IF(@col_exists = 0, 
    'ALTER TABLE course_sections ADD COLUMN grade_submission_status VARCHAR(20) NOT NULL DEFAULT ''DRAFT''', 
    'SELECT 1'
);
PREPARE stmt_exec FROM @stmt;
EXECUTE stmt_exec;
DEALLOCATE PREPARE stmt_exec;

-- 4. SYSTEM CONFIGS TABLE (Cấu hình tham số hệ thống)
CREATE TABLE IF NOT EXISTS system_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    description VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_system_configs_key UNIQUE (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO system_configs (config_key, config_value, description) VALUES
('CURRENT_SEMESTER_ID', '1', 'ID học kỳ hiện tại đang hoạt động'),
('CREDIT_TUITION_FEE_VND', '450000', 'Mức học phí chuẩn mỗi tín chỉ (VND)'),
('MIN_ENROLLMENT_CREDITS', '10', 'Số tín chỉ đăng ký tối thiểu mỗi kỳ'),
('MAX_ENROLLMENT_CREDITS', '24', 'Số tín chỉ đăng ký tối đa mỗi kỳ'),
('ABSENCE_BAN_THRESHOLD_PERCENT', '20', 'Ngưỡng phần trăm số tiết vắng mặt tối đa trước khi bị cấm thi'),
('APPEAL_WINDOW_DAYS', '7', 'Số ngày mở cửa sổ phúc khảo sau khi công bố điểm'),
('ENROLLMENT_PORTAL_OPEN', 'true', 'Trạng thái mở cổng đăng ký tín chỉ trực tuyến (true/false)')
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), description = VALUES(description);

-- 5. AUDIT LOGS TABLE (Nhật ký truy cập và thao tác nhạy cảm)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    username VARCHAR(50),
    role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    ip_address VARCHAR(50),
    details TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_module (module),
    INDEX idx_audit_logs_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. BACKUP HISTORIES TABLE (Lịch sử sao lưu CSDL)
CREATE TABLE IF NOT EXISTS backup_histories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    record_count BIGINT DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
    created_by BIGINT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_backup_histories_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_backup_histories_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. ACADEMIC EXCEPTIONS TABLE (Ngoại lệ học vụ: Rút môn, Miễn giảm tín chỉ)
CREATE TABLE IF NOT EXISTS academic_exceptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    exception_type VARCHAR(50) NOT NULL, -- COURSE_WITHDRAWAL, CREDIT_EXEMPTION, TUITION_REDUCTION, LATE_ENROLLMENT
    course_section_id BIGINT,
    subject_id INT,
    semester_id INT,
    reason TEXT NOT NULL,
    attachment_url VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    reviewed_by BIGINT,
    reviewer_note TEXT,
    reviewed_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_academic_exceptions_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_academic_exceptions_section FOREIGN KEY (course_section_id) REFERENCES course_sections(id) ON DELETE SET NULL,
    CONSTRAINT fk_academic_exceptions_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    CONSTRAINT fk_academic_exceptions_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL,
    CONSTRAINT fk_academic_exceptions_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_academic_exceptions_status (status),
    INDEX idx_academic_exceptions_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. GRADUATION RECORDS TABLE (Xét tốt nghiệp bán tự động)
CREATE TABLE IF NOT EXISTS graduation_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    cohort_id INT,
    total_credits_accumulated INT NOT NULL DEFAULT 0,
    cumulative_gpa DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    tuition_cleared BOOLEAN NOT NULL DEFAULT FALSE,
    physical_education_passed BOOLEAN NOT NULL DEFAULT FALSE,
    defense_education_passed BOOLEAN NOT NULL DEFAULT FALSE,
    english_certificate_status BOOLEAN NOT NULL DEFAULT FALSE,
    system_recommendation VARCHAR(30) NOT NULL DEFAULT 'DISQUALIFIED', -- QUALIFIED, DISQUALIFIED
    official_status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    graduation_decision_no VARCHAR(100),
    decision_date DATE,
    assessed_by BIGINT,
    note TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_graduation_records_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_graduation_records_cohort FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE SET NULL,
    CONSTRAINT fk_graduation_records_assessed_by FOREIGN KEY (assessed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_graduation_records_student (student_id),
    INDEX idx_graduation_records_status (official_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. CONDUCT SCORES TABLE (Điểm rèn luyện)
CREATE TABLE IF NOT EXISTS conduct_scores (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    semester_id INT NOT NULL,
    score INT NOT NULL DEFAULT 80,
    classification VARCHAR(30) NOT NULL DEFAULT 'TOT', -- XUAT_SAC, TOT, KHA, TRUNG_BINH, YEU, KEM
    note TEXT,
    rated_by BIGINT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_conduct_scores_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_conduct_scores_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
    CONSTRAINT fk_conduct_scores_rated_by FOREIGN KEY (rated_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uq_student_semester_conduct UNIQUE (student_id, semester_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. STUDENT SERVICE REQUESTS TABLE (Dịch vụ sinh viên 1 cửa)
CREATE TABLE IF NOT EXISTS student_service_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    request_type VARCHAR(50) NOT NULL, -- STUDENT_CONFIRMATION, TRANSCRIPT_COPY, MILITARY_DEFERRAL, LOAN_CONFIRMATION
    quantity INT NOT NULL DEFAULT 1,
    purpose TEXT,
    verification_code VARCHAR(64) NOT NULL,
    pickup_method VARCHAR(30) NOT NULL DEFAULT 'ONLINE_PDF', -- ONLINE_PDF, OFFICE_PICKUP
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, REJECTED
    processed_by BIGINT,
    admin_note TEXT,
    completed_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_service_requests_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_service_requests_processed_by FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uq_service_verification_code UNIQUE (verification_code),
    INDEX idx_service_requests_status (status),
    INDEX idx_service_requests_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. SEED CONDUCT SCORES FOR EXISTING STUDENTS (Demo data)
INSERT IGNORE INTO conduct_scores (student_id, semester_id, score, classification, note)
SELECT s.id, 1, 85, 'TOT', 'Tích cực tham gia phong trào Đoàn - Hội'
FROM students s;

SET FOREIGN_KEY_CHECKS = 1;
