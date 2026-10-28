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
SET FOREIGN_KEY_CHECKS = 0;

-- Clean slate: Drop existing views and tables in reverse dependency order
DROP VIEW IF EXISTS v_student_gpa;
DROP VIEW IF EXISTS v_student_transcript;

DROP TABLE IF EXISTS grade_audit_logs;
DROP TABLE IF EXISTS grade_change_tickets;
DROP TABLE IF EXISTS exam_rosters;
DROP TABLE IF EXISTS exam_rooms;
DROP TABLE IF EXISTS exam_sessions;
DROP TABLE IF EXISTS attendance_records;
DROP TABLE IF EXISTS attendance_sessions;
DROP TABLE IF EXISTS student_invoices;
DROP TABLE IF EXISTS fee_scale_rules;
DROP TABLE IF EXISTS class_opening_requests;
DROP TABLE IF EXISTS grade_appeals;
DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS course_sections;
DROP TABLE IF EXISTS semesters;
DROP TABLE IF EXISTS curriculum_block_subjects;
DROP TABLE IF EXISTS curriculum_blocks;
DROP TABLE IF EXISTS curriculum_programs;
DROP TABLE IF EXISTS cohorts;
DROP TABLE IF EXISTS majors;
DROP TABLE IF EXISTS subject_prerequisites;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS lecturers;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS password_reset_requests;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

SET CHARACTER SET utf8mb4;

-- ============================================================
-- BẢNG 1: roles – Vai trò người dùng
-- ============================================================
CREATE TABLE roles (
    id   INT          NOT NULL AUTO_INCREMENT,
    name VARCHAR(20)  NOT NULL,
    CONSTRAINT pk_roles PRIMARY KEY (id),
    CONSTRAINT uq_roles_name UNIQUE (name),
    CONSTRAINT ck_roles_name CHECK (name IN ('ADMIN', 'ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF', 'LECTURER', 'STUDENT'))
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
    head_lecturer_id BIGINT  NULL     COMMENT 'Giảng viên giữ chức vụ Trưởng bộ môn/Trưởng khoa',
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
    id                             BIGINT       NOT NULL AUTO_INCREMENT,
    user_id                        BIGINT       NOT NULL,
    student_code                   VARCHAR(20)  NOT NULL,
    citizen_id                     VARCHAR(20)  NULL,
    full_name                      VARCHAR(100) NOT NULL,
    date_of_birth                  DATE         NOT NULL,
    gender                         ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    email                          VARCHAR(100) NOT NULL,
    phone                          VARCHAR(15)  NULL,
    address                        TEXT         NULL,
    hometown                       VARCHAR(200) NULL,
    emergency_contact_name         VARCHAR(100) NULL,
    emergency_contact_phone        VARCHAR(20)  NULL,
    emergency_contact_relationship VARCHAR(50)  NULL,
    class_id                       INT          NOT NULL,
    status                         ENUM('ACTIVE', 'INACTIVE', 'GRADUATED', 'SUSPENDED', 'RESERVED') NOT NULL DEFAULT 'ACTIVE',
    balance                        DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    financial_hold                 BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at                     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_students PRIMARY KEY (id),
    CONSTRAINT uq_students_user_id UNIQUE (user_id),
    CONSTRAINT uq_students_code UNIQUE (student_code),
    CONSTRAINT uq_students_email UNIQUE (email),
    CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_students_class FOREIGN KEY (class_id) REFERENCES classes (id)
);

-- ============================================================
-- BẢNG 5.1: student_achievements_disciplines – Khen thưởng & Kỷ luật
-- ============================================================
CREATE TABLE student_achievements_disciplines (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    student_id      BIGINT       NOT NULL,
    semester_id     INT          NULL,
    type            ENUM('REWARD', 'DISCIPLINE') NOT NULL,
    decision_number VARCHAR(50)  NOT NULL,
    issue_date      DATE         NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT         NULL,
    level           VARCHAR(50)  NOT NULL DEFAULT 'TRUONG',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_student_achievements_disciplines PRIMARY KEY (id),
    CONSTRAINT fk_sad_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    CONSTRAINT fk_sad_semester FOREIGN KEY (semester_id) REFERENCES semesters (id) ON DELETE SET NULL
);

-- ============================================================
-- BẢNG 5.2: student_training_points – Điểm rèn luyện theo kỳ
-- ============================================================
CREATE TABLE student_training_points (
    id               BIGINT      NOT NULL AUTO_INCREMENT,
    student_id       BIGINT      NOT NULL,
    semester_id      INT         NOT NULL,
    score            INT         NOT NULL,
    evaluation_grade VARCHAR(30) NOT NULL COMMENT 'XUAT_SAC, TOT, KHA, TRUNG_BINH, YEU, KEM',
    notes            TEXT        NULL,
    created_at       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_student_training_points PRIMARY KEY (id),
    CONSTRAINT fk_stp_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    CONSTRAINT fk_stp_semester FOREIGN KEY (semester_id) REFERENCES semesters (id) ON DELETE CASCADE,
    CONSTRAINT uq_stp_student_semester UNIQUE (student_id, semester_id),
    CONSTRAINT ck_stp_score CHECK (score >= 0 AND score <= 100)
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

ALTER TABLE departments
    ADD CONSTRAINT fk_departments_head_lecturer FOREIGN KEY (head_lecturer_id) REFERENCES lecturers (id) ON DELETE SET NULL;


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

-- BẢNG 7A: subject_prerequisites - Quan hệ học phần tiên quyết
CREATE TABLE subject_prerequisites (
    subject_id       INT NOT NULL,
    prerequisite_id  INT NOT NULL,
    CONSTRAINT pk_subject_prerequisites PRIMARY KEY (subject_id, prerequisite_id),
    CONSTRAINT fk_subject_prereq_subject FOREIGN KEY (subject_id) REFERENCES subjects (id),
    CONSTRAINT fk_subject_prereq_required FOREIGN KEY (prerequisite_id) REFERENCES subjects (id),
    CONSTRAINT ck_subject_prereq_not_self CHECK (subject_id <> prerequisite_id)
);

CREATE INDEX idx_subject_prerequisites_required ON subject_prerequisites (prerequisite_id);

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
-- BẢNG 8b: registration_waves – Đợt/Ca đăng ký tín chỉ phân bổ theo Khóa/Khoa/Ngành
-- ============================================================
CREATE TABLE IF NOT EXISTS registration_waves (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    semester_id    INT          NOT NULL,
    name           VARCHAR(150) NOT NULL,
    shift_name     VARCHAR(100) NULL,
    cohort_id      INT          NULL,
    department_id  INT          NULL,
    major_id       INT          NULL,
    start_time     DATETIME     NOT NULL,
    end_time       DATETIME     NOT NULL,
    description    TEXT         NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_registration_waves PRIMARY KEY (id),
    CONSTRAINT fk_reg_waves_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
    CONSTRAINT fk_reg_waves_cohort FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE SET NULL,
    CONSTRAINT fk_reg_waves_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_reg_waves_major FOREIGN KEY (major_id) REFERENCES majors(id) ON DELETE SET NULL,
    INDEX idx_reg_waves_semester_active (semester_id, is_active),
    INDEX idx_reg_waves_time (start_time, end_time),
    INDEX idx_reg_waves_major (major_id)
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
    section_type   ENUM('REGULAR', 'SPECIAL') NOT NULL DEFAULT 'REGULAR',
    min_students   INT          NOT NULL DEFAULT 1,
    enrolled_count INT          NOT NULL DEFAULT 0,
    scale_coefficient DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    base_tuition_rate DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    schedule       VARCHAR(200) NULL     COMMENT 'VD: Thứ 2 (7:30-9:30), Thứ 4 (7:30-9:30)',
    room           VARCHAR(50)  NULL,
    grade_submission_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    published_at   DATETIME     NULL     COMMENT 'Thời điểm Phòng Đào tạo duyệt và phát hành điểm',
    grade_return_reason TEXT    NULL     COMMENT 'Lý do Phòng Đào tạo trả về yêu cầu sửa điểm',
    status         ENUM('OPEN', 'ACTIVE', 'CLOSED', 'CANCELLED', 'PENDING_FEE', 'LOCKED_BILLING', 'COMPLETED') NOT NULL DEFAULT 'OPEN',
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

CREATE TABLE class_opening_requests (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    subject_id INT NOT NULL,
    semester_id INT NOT NULL,
    request_type ENUM('LEARN_AGAIN', 'IMPROVE', 'NEW') NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_class_opening_requests PRIMARY KEY (id),
    CONSTRAINT uq_opening_request_student_course_semester UNIQUE (student_id, subject_id, semester_id),
    CONSTRAINT fk_opening_request_student FOREIGN KEY (student_id) REFERENCES students (id),
    CONSTRAINT fk_opening_request_subject FOREIGN KEY (subject_id) REFERENCES subjects (id),
    CONSTRAINT fk_opening_request_semester FOREIGN KEY (semester_id) REFERENCES semesters (id)
);

CREATE TABLE fee_scale_rules (
    id BIGINT NOT NULL AUTO_INCREMENT,
    min_students INT NOT NULL,
    max_students INT NOT NULL,
    coefficient DECIMAL(3,2) NOT NULL,
    CONSTRAINT pk_fee_scale_rules PRIMARY KEY (id)
);

CREATE TABLE student_invoices (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    section_id BIGINT NOT NULL,
    credits INT NOT NULL,
    base_rate DECIMAL(12,2) NOT NULL,
    coefficient DECIMAL(3,2) NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    status ENUM('UNPAID', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'UNPAID',
    paid_at DATETIME NULL,
    paid_method VARCHAR(30) NULL DEFAULT 'CASH',
    receipt_number VARCHAR(50) NULL,
    cashier_user_id BIGINT NULL,
    extended_deadline DATE NULL,
    extension_reason VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_student_invoices PRIMARY KEY (id),
    CONSTRAINT uq_invoice_student_section UNIQUE (student_id, section_id),
    CONSTRAINT fk_invoice_student FOREIGN KEY (student_id) REFERENCES students (id),
    CONSTRAINT fk_invoice_section FOREIGN KEY (section_id) REFERENCES course_sections (id)
);

CREATE TABLE attendance_sessions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    section_id BIGINT NOT NULL,
    session_date DATE NOT NULL,
    attendance_keyword VARCHAR(255) NULL,
    status VARCHAR(50) NULL DEFAULT 'OPEN',
    expires_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_attendance_sessions PRIMARY KEY (id),
    CONSTRAINT fk_attendance_sessions_section FOREIGN KEY (section_id) REFERENCES course_sections (id) ON DELETE CASCADE,
    CONSTRAINT uq_attendance_session UNIQUE (section_id, session_date)
);

CREATE TABLE attendance_records (
    id BIGINT NOT NULL AUTO_INCREMENT,
    session_id BIGINT NOT NULL,
    enrollment_id BIGINT NOT NULL,
    is_present BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_attendance_records PRIMARY KEY (id),
    CONSTRAINT fk_attendance_records_session FOREIGN KEY (session_id) REFERENCES attendance_sessions (id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_records_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments (id) ON DELETE CASCADE,
    CONSTRAINT uq_attendance_record UNIQUE (session_id, enrollment_id)
);

CREATE INDEX idx_attendance_records_enrollment ON attendance_records (enrollment_id);

CREATE TABLE notifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'GRADE_UPDATED',
    related_id BIGINT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_notifications PRIMARY KEY (id),
    CONSTRAINT fk_notifications_student FOREIGN KEY (student_id) REFERENCES students (id),
    INDEX idx_notifications_student_read (student_id, is_read),
    INDEX idx_notifications_student_created (student_id, created_at DESC)
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
    enrollment_type ENUM('FIRST_TIME', 'RETAKE', 'IMPROVE') NOT NULL DEFAULT 'FIRST_TIME',
    attendance_status VARCHAR(20) NOT NULL DEFAULT 'QUALIFIED',
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
    special_grade    ENUM('NONE', 'V', 'I', 'M') NOT NULL DEFAULT 'NONE' COMMENT 'Mã điểm đặc biệt',
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
-- BẢNG 11A: grade_appeals – Đơn phúc khảo điểm
-- ============================================================
CREATE TABLE grade_appeals (
    id BIGINT NOT NULL AUTO_INCREMENT,
    enrollment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    score_component ENUM('CC2', 'MIDTERM', 'FINAL', 'ALL') NOT NULL DEFAULT 'FINAL',
    current_score DECIMAL(4,2) NOT NULL,
    desired_score DECIMAL(4,2) NULL,
    reason TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, ASSIGNED, REJECTED_NO_CHANGE, PENDING_HEAD_APPROVAL, HEAD_APPROVED, APPROVED_AND_APPLIED, REJECTED',
    assigned_lecturer_id BIGINT NULL COMMENT 'Cán bộ chấm phúc khảo độc lập',
    assigned_at DATETIME NULL,
    has_mechanical_error BOOLEAN NOT NULL DEFAULT FALSE,
    score_diff DECIMAL(4,2) NULL,
    exceeds_threshold BOOLEAN NOT NULL DEFAULT FALSE,
    reviewer_id BIGINT NULL,
    review_notes TEXT NULL,
    new_score DECIMAL(4,2) NULL,
    head_reviewer_id BIGINT NULL COMMENT 'Trưởng bộ môn / Trưởng khoa ký duyệt',
    head_approved_at DATETIME NULL,
    head_signature_hash VARCHAR(128) NULL COMMENT 'Mã băm SHA-256 ký số điện tử nội bộ',
    head_review_notes TEXT NULL,
    final_adjustment_reason TEXT NULL COMMENT 'Lý do điều chỉnh chính thức của Phòng Đào tạo',
    applied_by_user_id BIGINT NULL COMMENT 'Cán bộ Phòng Đào tạo cập nhật điểm',
    applied_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    reviewed_at DATETIME NULL,
    CONSTRAINT pk_grade_appeals PRIMARY KEY (id),
    CONSTRAINT fk_appeal_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments (id) ON DELETE CASCADE,
    CONSTRAINT fk_appeal_student FOREIGN KEY (student_id) REFERENCES students (id),
    CONSTRAINT fk_appeal_reviewer FOREIGN KEY (reviewer_id) REFERENCES users (id),
    CONSTRAINT fk_appeal_assigned_lecturer FOREIGN KEY (assigned_lecturer_id) REFERENCES lecturers (id) ON DELETE SET NULL,
    CONSTRAINT fk_appeal_head_reviewer FOREIGN KEY (head_reviewer_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_appeal_applied_by FOREIGN KEY (applied_by_user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_appeals_student ON grade_appeals (student_id);
CREATE INDEX idx_appeals_status ON grade_appeals (status);
CREATE INDEX idx_appeals_assigned_lecturer ON grade_appeals (assigned_lecturer_id);
CREATE INDEX idx_appeals_head_reviewer ON grade_appeals (head_reviewer_id);

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
CREATE INDEX idx_students_financial_hold ON students (financial_hold);

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
-- LƯU Ý KIẾN TRÚC: Quản lý sĩ số (enrolled_count)
-- Đã loại bỏ Database Triggers (trg_enrollment_insert_after,
-- trg_enrollment_update_after) nhằm tránh deadlock và xung đột
-- với khóa bi quan (PESSIMISTIC_WRITE) / 1st-level cache của JPA.
-- Sĩ số được cập nhật trực tiếp bởi backend Spring Boot trong cùng
-- một Transaction với lệnh đăng ký/hủy môn.
-- ============================================================

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

CREATE OR REPLACE VIEW v_student_gpa AS
WITH best_grades AS (
    SELECT
        e.student_id,
        cs.subject_id,
        sub.credits,
        MAX(g.gpa_point) AS best_gpa_point
    FROM enrollments e
        JOIN grades g ON g.enrollment_id = e.id AND g.is_finalized = TRUE
        JOIN course_sections cs ON e.section_id = cs.id
        JOIN subjects sub ON cs.subject_id = sub.id
    WHERE e.status != 'CANCELLED'
      AND g.gpa_point IS NOT NULL
    GROUP BY e.student_id, cs.subject_id, sub.credits
)
SELECT
    s.id                                                                               AS student_id,
    s.student_code,
    s.full_name,
    COUNT(CASE WHEN bg.best_gpa_point >= 1.0 THEN 1 END)                              AS completed_courses,
    COALESCE(SUM(CASE WHEN bg.best_gpa_point >= 1.0 THEN bg.credits ELSE 0 END), 0)    AS total_credits,
    ROUND(
        COALESCE(
            SUM(bg.best_gpa_point * bg.credits) / NULLIF(SUM(bg.credits), 0),
            0.00
        ),
        2
    )                                                                                  AS cumulative_gpa
FROM students s
    LEFT JOIN best_grades bg ON bg.student_id = s.id
GROUP BY s.id, s.student_code, s.full_name;

-- ============================================================
-- 15. EXAM MANAGEMENT & ROOM SCORING (KHẢO THÍ & PHÒNG THI)
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

CREATE TABLE IF NOT EXISTS grade_change_tickets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    class_section_id BIGINT NOT NULL,
    component_type VARCHAR(20) NOT NULL COMMENT 'Cột điểm cần sửa: CC1, CC2, MIDTERM, FINAL',
    old_score DECIMAL(4,2) NOT NULL COMMENT 'Điểm số ban đầu của sinh viên',
    new_score DECIMAL(4,2) NOT NULL COMMENT 'Điểm số mới đề xuất (0 - 10)',
    reason TEXT NOT NULL COMMENT 'Lý do sửa điểm chi tiết',
    evidence_url VARCHAR(500) NOT NULL COMMENT 'Đường dẫn tệp minh chứng bài thi / biên bản',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_DEPT' COMMENT 'PENDING_DEPT, PENDING_ACADEMIC, APPROVED, REJECTED',
    created_by BIGINT NOT NULL COMMENT 'ID user giảng viên tạo đơn',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dept_reviewer_id BIGINT NULL COMMENT 'ID user Trưởng bộ môn thẩm định',
    dept_reviewed_at DATETIME NULL,
    dept_notes TEXT NULL COMMENT 'Ý kiến thẩm định chuyên môn',
    approved_by BIGINT NULL COMMENT 'ID user cán bộ Phòng Đào tạo duyệt cuối',
    approved_at DATETIME NULL,
    rejection_reason TEXT NULL COMMENT 'Lý do từ chối',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_gct_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_gct_section FOREIGN KEY (class_section_id) REFERENCES course_sections(id) ON DELETE CASCADE,
    CONSTRAINT fk_gct_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_gct_dept_reviewer FOREIGN KEY (dept_reviewer_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_gct_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT ck_gct_new_score CHECK (new_score >= 0.00 AND new_score <= 10.00),
    INDEX idx_gct_section_student (class_section_id, student_id),
    INDEX idx_gct_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS grade_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_id BIGINT,
    student_id BIGINT,
    grade_id BIGINT NOT NULL,
    exam_room_id BIGINT,
    component VARCHAR(20) NOT NULL DEFAULT 'FINAL',
    old_score DECIMAL(4,2),
    new_score DECIMAL(4,2),
    old_special_grade VARCHAR(10),
    new_special_grade VARCHAR(10),
    reason TEXT,
    changed_by BIGINT,
    ip_address VARCHAR(50),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_grade_audit_ticket FOREIGN KEY (ticket_id) REFERENCES grade_change_tickets(id) ON DELETE SET NULL,
    CONSTRAINT fk_grade_audit_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
    CONSTRAINT fk_grade_audit_logs_grade FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
    CONSTRAINT fk_grade_audit_logs_exam_room FOREIGN KEY (exam_room_id) REFERENCES exam_rooms(id) ON DELETE SET NULL,
    CONSTRAINT fk_grade_audit_logs_changed_by FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 16. SMS 3.0 MODULES (CONFIGS, AUDIT, BACKUP, EXCEPTIONS, GRADUATION, CONDUCT, ONE-STOP)
-- ============================================================

CREATE TABLE IF NOT EXISTS system_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    description VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_system_configs_key UNIQUE (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE IF NOT EXISTS academic_exceptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    exception_type VARCHAR(50) NOT NULL,
    course_section_id BIGINT,
    subject_id INT,
    semester_id INT,
    reason TEXT NOT NULL,
    attachment_url VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
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
    system_recommendation VARCHAR(30) NOT NULL DEFAULT 'DISQUALIFIED',
    official_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
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

CREATE TABLE IF NOT EXISTS conduct_scores (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    semester_id INT NOT NULL,
    score INT NOT NULL DEFAULT 80,
    classification VARCHAR(30) NOT NULL DEFAULT 'TOT',
    note TEXT,
    rated_by BIGINT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_conduct_scores_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_conduct_scores_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
    CONSTRAINT fk_conduct_scores_rated_by FOREIGN KEY (rated_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uq_student_semester_conduct UNIQUE (student_id, semester_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS student_service_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    request_type VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    purpose TEXT,
    verification_code VARCHAR(64) NOT NULL,
    pickup_method VARCHAR(30) NOT NULL DEFAULT 'ONLINE_PDF',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
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

SET FOREIGN_KEY_CHECKS = 1;
