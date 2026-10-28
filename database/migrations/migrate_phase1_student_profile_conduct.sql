-- ============================================================
-- MIGRATION: Phase 1 - Student Profile, Status & Conduct Management
-- File: migrate_phase1_student_profile_conduct.sql
-- ============================================================

USE student_management;

DROP PROCEDURE IF EXISTS add_student_profile_columns;

DELIMITER $$
CREATE PROCEDURE add_student_profile_columns()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'students' AND column_name = 'citizen_id') THEN
        ALTER TABLE students ADD COLUMN citizen_id VARCHAR(20) NULL AFTER student_code;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'students' AND column_name = 'hometown') THEN
        ALTER TABLE students ADD COLUMN hometown VARCHAR(200) NULL AFTER address;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'students' AND column_name = 'emergency_contact_name') THEN
        ALTER TABLE students ADD COLUMN emergency_contact_name VARCHAR(100) NULL AFTER hometown;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'students' AND column_name = 'emergency_contact_phone') THEN
        ALTER TABLE students ADD COLUMN emergency_contact_phone VARCHAR(20) NULL AFTER emergency_contact_name;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'students' AND column_name = 'emergency_contact_relationship') THEN
        ALTER TABLE students ADD COLUMN emergency_contact_relationship VARCHAR(50) NULL AFTER emergency_contact_phone;
    END IF;
END $$
DELIMITER ;

CALL add_student_profile_columns();
DROP PROCEDURE IF EXISTS add_student_profile_columns;

-- Cập nhật cột status để có thêm 'RESERVED' (Bảo lưu)
ALTER TABLE students 
    MODIFY COLUMN status ENUM('ACTIVE', 'INACTIVE', 'GRADUATED', 'SUSPENDED', 'RESERVED') NOT NULL DEFAULT 'ACTIVE';

-- 2. BẢNG: student_achievements_disciplines (Khen thưởng & Kỷ luật)
CREATE TABLE IF NOT EXISTS student_achievements_disciplines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    semester_id INT NULL,
    type ENUM('REWARD', 'DISCIPLINE') NOT NULL,
    decision_number VARCHAR(50) NOT NULL,
    issue_date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    level VARCHAR(50) NOT NULL DEFAULT 'TRUONG' COMMENT 'TRUONG, KHOA, CAP_TINH, BO_NGANH, QUOC_GIA',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sad_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_sad_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL,
    INDEX idx_sad_student (student_id),
    INDEX idx_sad_type (type),
    INDEX idx_sad_semester (semester_id),
    INDEX idx_sad_issue_date (issue_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BẢNG: student_training_points (Điểm rèn luyện theo kỳ)
CREATE TABLE IF NOT EXISTS student_training_points (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    semester_id INT NOT NULL,
    score INT NOT NULL,
    evaluation_grade VARCHAR(30) NOT NULL COMMENT 'XUAT_SAC, TOT, KHA, TRUNG_BINH, YEU, KEM',
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_stp_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_stp_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
    CONSTRAINT uq_stp_student_semester UNIQUE (student_id, semester_id),
    CONSTRAINT ck_stp_score CHECK (score >= 0 AND score <= 100),
    INDEX idx_stp_student (student_id),
    INDEX idx_stp_semester (semester_id),
    INDEX idx_stp_score (score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cập nhật dữ liệu mẫu cho CCCD và liên lạc khẩn cấp của các sinh viên hiện có
UPDATE students 
SET citizen_id = CONCAT('00120300', LPAD(id, 4, '0')),
    hometown = 'Hà Nội',
    emergency_contact_name = 'Phụ huynh SV',
    emergency_contact_phone = '0988776655',
    emergency_contact_relationship = 'Bố/Mẹ'
WHERE citizen_id IS NULL;
