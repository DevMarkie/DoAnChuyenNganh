-- ============================================================
-- HỆ THỐNG QUẢN LÝ SINH VIÊN (Student Management System)
-- File: schema.sql
-- Version: 2.0 — Rebuild from BA Analysis
-- ============================================================

CREATE DATABASE IF NOT EXISTS student_management
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE student_management;
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================================
-- BẢNG 1: roles – Vai trò người dùng
-- ============================================================
CREATE TABLE roles (
    id   INT          NOT NULL AUTO_INCREMENT,
    name VARCHAR(20)  NOT NULL,
    CONSTRAINT pk_roles PRIMARY KEY (id),
    CONSTRAINT uq_roles_name UNIQUE (name),
    CONSTRAINT ck_roles_name CHECK (name IN ('ADMIN', 'LECTURER', 'STUDENT'))
);

-- ============================================================
-- BẢNG 2: users – Tài khoản người dùng
-- ============================================================
CREATE TABLE users (
    id                   BIGINT       NOT NULL AUTO_INCREMENT,
    username             VARCHAR(50)  NOT NULL,
    password             VARCHAR(255) NOT NULL,
    email                VARCHAR(100) NOT NULL,
    role_id              INT          NOT NULL,
    is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id)
);

-- ============================================================
-- BẢNG 3: departments – Khoa
-- ============================================================
CREATE TABLE departments (
    id          INT          NOT NULL AUTO_INCREMENT,
    code        VARCHAR(10)  NOT NULL,
    name        VARCHAR(100) NOT NULL,
    description TEXT         NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_departments PRIMARY KEY (id),
    CONSTRAINT uq_departments_code UNIQUE (code),
    CONSTRAINT uq_departments_name UNIQUE (name)
);

-- ============================================================
-- BẢNG 3.1: majors – Chuyên ngành đào tạo
-- ============================================================
CREATE TABLE majors (
    id            INT          NOT NULL AUTO_INCREMENT,
    department_id INT          NOT NULL,
    code          VARCHAR(30)  NOT NULL,
    name          VARCHAR(150) NOT NULL,
    description   TEXT         NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_majors PRIMARY KEY (id),
    CONSTRAINT uq_majors_code UNIQUE (code),
    CONSTRAINT fk_majors_department FOREIGN KEY (department_id) REFERENCES departments (id)
);

-- ============================================================
-- BẢNG 3.2: cohorts – Khóa học (K16, K17, K18, K19...)
-- ============================================================
CREATE TABLE cohorts (
    id              INT          NOT NULL AUTO_INCREMENT,
    code            VARCHAR(20)  NOT NULL,
    name            VARCHAR(100) NOT NULL,
    admission_year  INT          NOT NULL,
    graduation_year INT          NOT NULL,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_cohorts PRIMARY KEY (id),
    CONSTRAINT uq_cohorts_code UNIQUE (code)
);

-- ============================================================
-- BẢNG 3.3: curriculum_programs – Khung chương trình đào tạo
-- ============================================================
CREATE TABLE curriculum_programs (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    major_id      INT          NOT NULL,
    cohort_id     INT          NOT NULL,
    code          VARCHAR(50)  NOT NULL,
    name          VARCHAR(200) NOT NULL,
    total_credits INT          NOT NULL DEFAULT 140,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_curriculum_programs PRIMARY KEY (id),
    CONSTRAINT uq_curriculum_program_major_cohort UNIQUE (major_id, cohort_id),
    CONSTRAINT uq_curriculum_program_code UNIQUE (code),
    CONSTRAINT fk_curriculum_program_major FOREIGN KEY (major_id) REFERENCES majors (id),
    CONSTRAINT fk_curriculum_program_cohort FOREIGN KEY (cohort_id) REFERENCES cohorts (id)
);

-- ============================================================
-- BẢNG 3.4: curriculum_blocks – Khối kiến thức (5 khối chuẩn tín chỉ)
-- ============================================================
CREATE TABLE curriculum_blocks (
    id                     BIGINT       NOT NULL AUTO_INCREMENT,
    program_id             BIGINT       NOT NULL,
    code                   VARCHAR(30)  NOT NULL,
    name                   VARCHAR(200) NOT NULL,
    block_type             ENUM('COMPULSORY', 'ELECTIVE') NOT NULL,
    required_subject_count INT          NOT NULL DEFAULT 0,
    required_credits       INT          NOT NULL DEFAULT 0,
    elective_subject_count INT          NOT NULL DEFAULT 0,
    elective_credits       INT          NOT NULL DEFAULT 0,
    display_order          INT          NOT NULL DEFAULT 0,
    CONSTRAINT pk_curriculum_blocks PRIMARY KEY (id),
    CONSTRAINT uq_curriculum_block_code UNIQUE (program_id, code),
    CONSTRAINT fk_curriculum_block_program FOREIGN KEY (program_id) REFERENCES curriculum_programs (id) ON DELETE CASCADE
);

-- ============================================================
-- BẢNG 4: classes – Lớp sinh hoạt / Hành chính
-- ============================================================
CREATE TABLE classes (
    id            INT          NOT NULL AUTO_INCREMENT,
    code          VARCHAR(20)  NOT NULL,
    name          VARCHAR(100) NOT NULL,
    department_id INT          NOT NULL,
    major_id      INT          NULL,
    cohort_id     INT          NULL,
    academic_year VARCHAR(10)  NOT NULL  COMMENT 'VD: K18, K19, K20',
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_classes PRIMARY KEY (id),
    CONSTRAINT uq_classes_code UNIQUE (code),
    CONSTRAINT fk_classes_department FOREIGN KEY (department_id) REFERENCES departments (id),
    CONSTRAINT fk_classes_major FOREIGN KEY (major_id) REFERENCES majors (id),
    CONSTRAINT fk_classes_cohort FOREIGN KEY (cohort_id) REFERENCES cohorts (id)
);

-- ============================================================
-- BẢNG 5: students – Sinh viên
-- ============================================================
CREATE TABLE students (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    user_id       BIGINT       NOT NULL,
    student_code  VARCHAR(20)  NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    date_of_birth DATE         NOT NULL,
    gender        ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    email         VARCHAR(100) NOT NULL,
    phone         VARCHAR(15)  NULL,
    address       TEXT         NULL,
    class_id      INT          NOT NULL,
    status        ENUM('ACTIVE', 'INACTIVE', 'GRADUATED', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_students PRIMARY KEY (id),
    CONSTRAINT uq_students_user_id UNIQUE (user_id),
    CONSTRAINT uq_students_code UNIQUE (student_code),
    CONSTRAINT uq_students_email UNIQUE (email),
    CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_students_class FOREIGN KEY (class_id) REFERENCES classes (id)
);

-- ============================================================
-- BẢNG 6: lecturers – Giảng viên
-- ============================================================
CREATE TABLE lecturers (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    user_id        BIGINT       NOT NULL,
    lecturer_code  VARCHAR(20)  NOT NULL,
    full_name      VARCHAR(100) NOT NULL,
    date_of_birth  DATE         NULL,
    gender         ENUM('MALE', 'FEMALE', 'OTHER') NULL,
    email          VARCHAR(100) NOT NULL,
    phone          VARCHAR(15)  NULL,
    department_id  INT          NOT NULL,
    degree         VARCHAR(50)  NULL     COMMENT 'Học vị: ThS, TS, PGS, GS',
    specialization VARCHAR(100) NULL     COMMENT 'Chuyên môn',
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_lecturers PRIMARY KEY (id),
    CONSTRAINT uq_lecturers_user_id UNIQUE (user_id),
    CONSTRAINT uq_lecturers_code UNIQUE (lecturer_code),
    CONSTRAINT uq_lecturers_email UNIQUE (email),
    CONSTRAINT fk_lecturers_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_lecturers_department FOREIGN KEY (department_id) REFERENCES departments (id)
);

-- ============================================================
-- BẢNG 7: subjects – Môn học
-- ============================================================
CREATE TABLE subjects (
    id            INT          NOT NULL AUTO_INCREMENT,
    subject_code  VARCHAR(20)  NOT NULL,
    subject_name  VARCHAR(100) NOT NULL,
    credits       INT          NOT NULL,
    description   TEXT         NULL,
    department_id INT          NOT NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_subjects PRIMARY KEY (id),
    CONSTRAINT uq_subjects_code UNIQUE (subject_code),
    CONSTRAINT ck_subjects_credits CHECK (credits > 0 AND credits <= 10),
    CONSTRAINT fk_subjects_department FOREIGN KEY (department_id) REFERENCES departments (id)
);

-- ============================================================
-- BẢNG 7.1: curriculum_block_subjects – Môn học trong khối kiến thức
-- ============================================================
CREATE TABLE curriculum_block_subjects (
    block_id    BIGINT  NOT NULL,
    subject_id  INT     NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_curriculum_block_subjects PRIMARY KEY (block_id, subject_id),
    CONSTRAINT fk_block_subject_block FOREIGN KEY (block_id) REFERENCES curriculum_blocks (id) ON DELETE CASCADE,
    CONSTRAINT fk_block_subject_subject FOREIGN KEY (subject_id) REFERENCES subjects (id)
);

-- ============================================================
-- BẢNG 8: semesters – Học kỳ
-- ============================================================
CREATE TABLE semesters (
    id                 INT          NOT NULL AUTO_INCREMENT,
    semester_code      VARCHAR(20)  NOT NULL,
    semester_name      VARCHAR(100) NOT NULL,
    academic_year      VARCHAR(20)  NOT NULL  COMMENT 'VD: 2025-2026',
    semester_number    INT          NOT NULL  COMMENT '1: HK1, 2: HK2, 3: HK hè',
    start_date         DATE         NOT NULL,
    end_date           DATE         NOT NULL,
    registration_start DATE         NULL,
    registration_end   DATE         NULL,
    is_current         BOOLEAN      NOT NULL DEFAULT FALSE,
    status             ENUM('UPCOMING', 'ACTIVE', 'COMPLETED') NOT NULL DEFAULT 'UPCOMING',
    created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_semesters PRIMARY KEY (id),
    CONSTRAINT uq_semesters_code UNIQUE (semester_code),
    CONSTRAINT ck_semesters_number CHECK (semester_number IN (1, 2, 3)),
    CONSTRAINT ck_semesters_dates CHECK (end_date > start_date)
);

-- ============================================================
-- BẢNG 9: course_sections – Học phần (lớp học phần)
-- ============================================================
CREATE TABLE course_sections (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    section_code   VARCHAR(30)  NOT NULL,
    subject_id     INT          NOT NULL,
    lecturer_id    BIGINT       NOT NULL,
    semester_id    INT          NOT NULL,
    max_students   INT          NOT NULL DEFAULT 40,
    enrolled_count INT          NOT NULL DEFAULT 0,
    schedule       VARCHAR(200) NULL     COMMENT 'VD: Thứ 2 (7:30-9:30), Thứ 4 (7:30-9:30)',
    room           VARCHAR(50)  NULL,
    status         ENUM('OPEN', 'CLOSED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_course_sections PRIMARY KEY (id),
    CONSTRAINT uq_course_sections_code UNIQUE (section_code),
    CONSTRAINT ck_course_sections_max CHECK (max_students > 0),
    CONSTRAINT ck_course_sections_enrolled CHECK (enrolled_count >= 0),
    CONSTRAINT fk_course_sections_subject FOREIGN KEY (subject_id) REFERENCES subjects (id),
    CONSTRAINT fk_course_sections_lecturer FOREIGN KEY (lecturer_id) REFERENCES lecturers (id),
    CONSTRAINT fk_course_sections_semester FOREIGN KEY (semester_id) REFERENCES semesters (id)
);

-- ============================================================
-- BẢNG 10: enrollments – Đăng ký học phần
-- ============================================================
CREATE TABLE enrollments (
    id          BIGINT   NOT NULL AUTO_INCREMENT,
    student_id  BIGINT   NOT NULL,
    section_id  BIGINT   NOT NULL,
    enrolled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status      ENUM('ENROLLED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'ENROLLED',
    CONSTRAINT pk_enrollments PRIMARY KEY (id),
    CONSTRAINT uq_enrollments_student_section UNIQUE (student_id, section_id),
    CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES students (id),
    CONSTRAINT fk_enrollments_section FOREIGN KEY (section_id) REFERENCES course_sections (id)
);

-- ============================================================
-- BẢNG 11: grades – Điểm số
-- Công thức: Chuyên cần (CC1 5% + CC2 5%) + Giữa kỳ 30% + Cuối kỳ 60%
-- ============================================================
CREATE TABLE grades (
    id               BIGINT        NOT NULL AUTO_INCREMENT,
    enrollment_id    BIGINT        NOT NULL,
    cc1_score        DECIMAL(4,2)  NULL     COMMENT 'Điểm chuyên cần (0-10), trọng số 5%',
    cc2_score        DECIMAL(4,2)  NULL     COMMENT 'Điểm bài tập/phát biểu (0-10), trọng số 5%',
    midterm_score    DECIMAL(4,2)  NULL     COMMENT 'Điểm giữa kỳ (0-10), trọng số 30%',
    final_score      DECIMAL(4,2)  NULL     COMMENT 'Điểm cuối kỳ (0-10), trọng số 60%',
    total_score      DECIMAL(4,2)  NULL     COMMENT 'Điểm tổng kết = CC1*0.05 + CC2*0.05 + GK*0.3 + CK*0.6',
    letter_grade     VARCHAR(2)    NULL     COMMENT 'A, B+, B, C+, C, D+, D, F',
    gpa_point        DECIMAL(3,2)  NULL     COMMENT 'Điểm GPA theo thang 4.0',
    is_finalized     BOOLEAN       NOT NULL DEFAULT FALSE COMMENT 'Đã chốt điểm chưa',
    finalized_at     DATETIME      NULL     COMMENT 'Thời điểm chốt; GV được sửa trong 7 ngày kể từ mốc này',
    updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_grades PRIMARY KEY (id),
    CONSTRAINT uq_grades_enrollment UNIQUE (enrollment_id),
    CONSTRAINT ck_grades_cc1 CHECK (cc1_score IS NULL OR (cc1_score >= 0 AND cc1_score <= 10)),
    CONSTRAINT ck_grades_cc2 CHECK (cc2_score IS NULL OR (cc2_score >= 0 AND cc2_score <= 10)),
    CONSTRAINT ck_grades_midterm CHECK (midterm_score IS NULL OR (midterm_score >= 0 AND midterm_score <= 10)),
    CONSTRAINT ck_grades_final CHECK (final_score IS NULL OR (final_score >= 0 AND final_score <= 10)),
    CONSTRAINT fk_grades_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments (id) ON DELETE CASCADE
);

-- ============================================================
-- BẢNG 12: schedules – Thời khóa biểu học phần
-- ============================================================
CREATE TABLE schedules (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    section_id   BIGINT       NOT NULL,
    class_id     INT          NULL,
    day_of_week  INT          NOT NULL COMMENT '2: Thứ Hai, 3: Thứ Ba, ..., 8: Chủ Nhật',
    start_period INT          NOT NULL COMMENT 'Tiết bắt đầu: 1-12',
    end_period   INT          NOT NULL COMMENT 'Tiết kết thúc: 1-12',
    room         VARCHAR(50)  NOT NULL,
    start_date   DATE         NOT NULL,
    end_date     DATE         NOT NULL,
    note         VARCHAR(255) NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_schedules PRIMARY KEY (id),
    CONSTRAINT fk_schedules_section FOREIGN KEY (section_id) REFERENCES course_sections (id) ON DELETE CASCADE,
    CONSTRAINT fk_schedules_class FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE SET NULL
);

-- ============================================================
-- BẢNG 13: password_reset_requests – Yêu cầu cấp lại mật khẩu
-- ============================================================

CREATE TABLE password_reset_requests (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    user_id        BIGINT       NOT NULL,
    username       VARCHAR(50)  NOT NULL,
    full_name      VARCHAR(100) NOT NULL,
    role           VARCHAR(20)  NOT NULL,
    email          VARCHAR(100) NOT NULL,
    phone          VARCHAR(20)  NULL,
    reason         TEXT         NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    admin_notes    TEXT         NULL,
    processed_by   BIGINT       NULL,
    processed_at   DATETIME     NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_password_reset_requests PRIMARY KEY (id),
    CONSTRAINT fk_prr_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_prr_admin FOREIGN KEY (processed_by) REFERENCES users (id)
);

-- ============================================================
-- INDEXES – Tối ưu hiệu suất truy vấn
-- ============================================================

CREATE INDEX idx_students_class ON students (class_id);
CREATE INDEX idx_students_status ON students (status);
CREATE INDEX idx_students_name ON students (full_name);

CREATE INDEX idx_lecturers_department ON lecturers (department_id);
CREATE INDEX idx_lecturers_name ON lecturers (full_name);

CREATE INDEX idx_subjects_department ON subjects (department_id);

CREATE INDEX idx_sections_subject ON course_sections (subject_id);
CREATE INDEX idx_sections_lecturer ON course_sections (lecturer_id);
CREATE INDEX idx_sections_semester ON course_sections (semester_id);
CREATE INDEX idx_sections_status ON course_sections (status);

CREATE INDEX idx_enrollments_student ON enrollments (student_id);
CREATE INDEX idx_enrollments_section ON enrollments (section_id);
CREATE INDEX idx_enrollments_status ON enrollments (status);
-- Composite indexes for the high-volume registration and transcript queries.
CREATE INDEX idx_enrollments_student_status ON enrollments (student_id, status);
CREATE INDEX idx_enrollments_section_status ON enrollments (section_id, status);

CREATE INDEX idx_grades_enrollment ON grades (enrollment_id);

CREATE INDEX idx_sections_semester_status ON course_sections (semester_id, status);
CREATE INDEX idx_schedules_section_dates ON schedules (section_id, day_of_week, start_date, end_date);

-- Academic Curriculum Indexes
CREATE INDEX idx_majors_department ON majors (department_id);
CREATE INDEX idx_curriculum_program_major_cohort ON curriculum_programs (major_id, cohort_id);
CREATE INDEX idx_curriculum_blocks_program ON curriculum_blocks (program_id);
CREATE INDEX idx_block_subjects_subject ON curriculum_block_subjects (subject_id);
CREATE INDEX idx_classes_major_cohort ON classes (major_id, cohort_id);

-- ============================================================
-- TRIGGERS – Tự động cập nhật enrolled_count
-- ============================================================

DELIMITER //

CREATE TRIGGER trg_enrollment_insert_after
    AFTER INSERT ON enrollments
    FOR EACH ROW
BEGIN
    IF NEW.status = 'ENROLLED' THEN
        UPDATE course_sections
        SET enrolled_count = enrolled_count + 1
        WHERE id = NEW.section_id;
    END IF;
END //

CREATE TRIGGER trg_enrollment_update_after
    AFTER UPDATE ON enrollments
    FOR EACH ROW
BEGIN
    IF NEW.status = 'CANCELLED' AND OLD.status <> 'CANCELLED' THEN
        UPDATE course_sections
        SET enrolled_count = enrolled_count - 1
        WHERE id = NEW.section_id;
    END IF;

    IF OLD.status = 'CANCELLED' AND NEW.status = 'ENROLLED' THEN
        UPDATE course_sections
        SET enrolled_count = enrolled_count + 1
        WHERE id = NEW.section_id;
    END IF;
END //

DELIMITER ;

-- ============================================================
-- VIEW: Bảng điểm sinh viên
-- ============================================================

CREATE VIEW v_student_transcript AS
SELECT
    s.id              AS student_id,
    s.student_code,
    s.full_name       AS student_name,
    cl.name           AS class_name,
    sem.id            AS semester_id,
    sem.semester_name,
    sem.academic_year,
    sub.subject_code,
    sub.subject_name,
    sub.credits,
    g.cc1_score,
    g.cc2_score,
    g.midterm_score,
    g.final_score,
    g.total_score,
    g.letter_grade,
    g.gpa_point,
    g.is_finalized,
    e.status          AS enrollment_status
FROM students s
    JOIN classes cl ON s.class_id = cl.id
    JOIN enrollments e ON e.student_id = s.id
    JOIN course_sections cs ON e.section_id = cs.id
    JOIN subjects sub ON cs.subject_id = sub.id
    JOIN semesters sem ON cs.semester_id = sem.id
    LEFT JOIN grades g ON g.enrollment_id = e.id
WHERE e.status != 'CANCELLED';

-- ============================================================
-- VIEW: GPA tổng hợp sinh viên
-- ============================================================

CREATE VIEW v_student_gpa AS
SELECT
    s.id                                                                        AS student_id,
    s.student_code,
    s.full_name,
    COUNT(CASE WHEN g.gpa_point IS NOT NULL THEN 1 END)                        AS completed_courses,
    COALESCE(SUM(CASE WHEN g.gpa_point IS NOT NULL THEN sub.credits ELSE 0 END), 0) AS total_credits,
    ROUND(
        SUM(CASE WHEN g.gpa_point IS NOT NULL THEN g.gpa_point * sub.credits ELSE 0 END)
        / NULLIF(SUM(CASE WHEN g.gpa_point IS NOT NULL THEN sub.credits ELSE 0 END), 0),
        2
    )                                                                           AS cumulative_gpa
FROM students s
    LEFT JOIN enrollments e ON e.student_id = s.id AND e.status != 'CANCELLED'
    LEFT JOIN grades g ON g.enrollment_id = e.id AND g.is_finalized = TRUE
    LEFT JOIN course_sections cs ON e.section_id = cs.id
    LEFT JOIN subjects sub ON cs.subject_id = sub.id
GROUP BY s.id, s.student_code, s.full_name;
