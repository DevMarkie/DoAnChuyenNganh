-- ============================================================
-- Migration: Exam Management & Exam Room Grade Import System
-- Module: Quản lý Khảo thí, Phòng thi & Nhập điểm thi
-- ============================================================

CREATE TABLE IF NOT EXISTS exam_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    semester_id INT NOT NULL,
    subject_id INT NOT NULL,
    session_name VARCHAR(150) NOT NULL,
    exam_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_exam_sessions_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
    CONSTRAINT fk_exam_sessions_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exam_rooms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    room_code VARCHAR(50) NOT NULL,
    room_location VARCHAR(100),
    capacity INT NOT NULL DEFAULT 40,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_exam_rooms_session FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exam_rosters (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    exam_room_id BIGINT NOT NULL,
    enrollment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    sbd VARCHAR(30) NOT NULL,
    score DECIMAL(4,2),
    special_grade VARCHAR(10) NOT NULL DEFAULT 'NONE',
    violation_note TEXT,
    scored_at DATETIME,
    scored_by BIGINT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_exam_rosters_room FOREIGN KEY (exam_room_id) REFERENCES exam_rooms(id) ON DELETE CASCADE,
    CONSTRAINT fk_exam_rosters_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    CONSTRAINT fk_exam_rosters_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_exam_rosters_scored_by FOREIGN KEY (scored_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_exam_rosters_sbd (sbd),
    INDEX idx_exam_rosters_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS grade_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    grade_id BIGINT NOT NULL,
    exam_room_id BIGINT,
    component VARCHAR(20) NOT NULL DEFAULT 'FINAL',
    old_score DECIMAL(4,2),
    new_score DECIMAL(4,2),
    old_special_grade VARCHAR(10),
    new_special_grade VARCHAR(10),
    reason TEXT,
    changed_by BIGINT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_grade_audit_logs_grade FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
    CONSTRAINT fk_grade_audit_logs_exam_room FOREIGN KEY (exam_room_id) REFERENCES exam_rooms(id) ON DELETE SET NULL,
    CONSTRAINT fk_grade_audit_logs_changed_by FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
