-- Academic structure: department -> major -> cohort -> curriculum -> blocks -> subjects.
-- Safe to run after the existing schema and scale data migrations.
USE student_management;

START TRANSACTION;

CREATE TABLE IF NOT EXISTS majors (
    id INT NOT NULL AUTO_INCREMENT,
    department_id INT NOT NULL,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_majors_code (code),
    UNIQUE KEY uq_majors_department_name (department_id, name),
    CONSTRAINT fk_majors_department FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS cohorts (
    id INT NOT NULL AUTO_INCREMENT,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    admission_year INT NOT NULL,
    graduation_year INT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    UNIQUE KEY uq_cohorts_code (code)
);

CREATE TABLE IF NOT EXISTS curriculum_programs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    major_id INT NOT NULL,
    cohort_id INT NOT NULL,
    code VARCHAR(40) NOT NULL,
    name VARCHAR(200) NOT NULL,
    total_credits INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    UNIQUE KEY uq_curriculum_program_major_cohort (major_id, cohort_id),
    UNIQUE KEY uq_curriculum_program_code (code),
    CONSTRAINT fk_curriculum_program_major FOREIGN KEY (major_id) REFERENCES majors(id),
    CONSTRAINT fk_curriculum_program_cohort FOREIGN KEY (cohort_id) REFERENCES cohorts(id)
);

CREATE TABLE IF NOT EXISTS curriculum_blocks (
    id BIGINT NOT NULL AUTO_INCREMENT,
    program_id BIGINT NOT NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(200) NOT NULL,
    block_type ENUM('COMPULSORY', 'ELECTIVE') NOT NULL,
    required_subject_count INT NOT NULL DEFAULT 0,
    required_credits INT NOT NULL DEFAULT 0,
    elective_subject_count INT NOT NULL DEFAULT 0,
    elective_credits INT NOT NULL DEFAULT 0,
    display_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_curriculum_block_code (program_id, code),
    CONSTRAINT fk_curriculum_block_program FOREIGN KEY (program_id) REFERENCES curriculum_programs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS curriculum_block_subjects (
    block_id BIGINT NOT NULL,
    subject_id INT NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (block_id, subject_id),
    CONSTRAINT fk_block_subject_block FOREIGN KEY (block_id) REFERENCES curriculum_blocks(id) ON DELETE CASCADE,
    CONSTRAINT fk_block_subject_subject FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

ALTER TABLE classes ADD COLUMN major_id INT NULL, ADD COLUMN cohort_id INT NULL;
ALTER TABLE classes ADD CONSTRAINT fk_classes_major FOREIGN KEY (major_id) REFERENCES majors(id);
ALTER TABLE classes ADD CONSTRAINT fk_classes_cohort FOREIGN KEY (cohort_id) REFERENCES cohorts(id);

CREATE INDEX idx_majors_department ON majors(department_id);
CREATE INDEX idx_curriculum_program_major_cohort ON curriculum_programs(major_id, cohort_id);
CREATE INDEX idx_curriculum_blocks_program ON curriculum_blocks(program_id);
CREATE INDEX idx_block_subjects_subject ON curriculum_block_subjects(subject_id);
CREATE INDEX idx_classes_major_cohort ON classes(major_id, cohort_id);

-- One representative major per faculty. These are stable business records, not test labels.
INSERT IGNORE INTO majors (id, department_id, code, name, description) VALUES
(1, 1, 'CNTT', 'Cong nghe thong tin', 'Ky thuat phan mem, tri tue nhan tao, an toan thong tin'),
(2, 2, 'QTKD', 'Quan tri kinh doanh', 'Quan tri doanh nghiep, marketing va thuong mai dien tu'),
(3, 3, 'DTVT', 'Dien - Dien tu', 'Dien tu vien thong, dieu khien va he thong nhung'),
(4, 4, 'CK', 'Co khi', 'Co dien tu, ky thuat o to va che tao may'),
(5, 5, 'NN', 'Ngoai ngu', 'Ngon ngu Anh, Nhat va bien phien dich'),
(6, 6, 'KT', 'Ke toan - Kiem toan', 'Ke toan tai chinh va kiem toan'),
(7, 7, 'LUAT', 'Luat', 'Luat kinh te va phap luat cong'),
(8, 8, 'XD', 'Ky thuat Xay dung', 'Ky thuat xay dung va quan ly cong trinh'),
(9, 9, 'YD', 'Y Duoc', 'Y khoa, duoc hoc va cham soc suc khoe'),
(10, 10, 'DL', 'Du lich', 'Quan tri du lich, khach san va dich vu'),
(11, 11, 'TT', 'Truyen thong', 'Truyen thong so, bao chi va quan he cong chung'),
(12, 12, 'XH', 'Khoa hoc Xa hoi', 'Tam ly, xa hoi hoc va quan tri nhan luc'),
(13, 13, 'NNG', 'Ngon ngu', 'Ngon ngu ung dung va giao tiep lien van hoa');

INSERT IGNORE INTO cohorts (id, code, name, admission_year, graduation_year) VALUES
(1, 'K16', 'Khoa 16', 2022, 2026),
(2, 'K17', 'Khoa 17', 2023, 2027),
(3, 'K18', 'Khoa 18', 2024, 2028),
(4, 'K19', 'Khoa 19', 2025, 2029);

-- Four programs per major, one for each cohort.
INSERT IGNORE INTO curriculum_programs (id, major_id, cohort_id, code, name, total_credits)
SELECT ((m.id - 1) * 4) + c.id,
       m.id,
       c.id,
       CONCAT(m.code, '-', c.code),
       CONCAT('Chuong trinh dao tao ', m.name, ' - ', c.name),
       145
FROM majors m CROSS JOIN cohorts c;

-- Five compulsory blocks and seven elective blocks per program, matching the curriculum view.
INSERT IGNORE INTO curriculum_blocks (program_id, code, name, block_type, required_subject_count, required_credits, elective_subject_count, elective_credits, display_order)
SELECT p.id, b.code, b.name, b.block_type, b.required_subject_count, b.required_credits, b.elective_subject_count, b.elective_credits, b.display_order
FROM curriculum_programs p
CROSS JOIN (
    SELECT 'GDDC' code, 'Khối kiến thức giáo dục đại cương' name, 'COMPULSORY' block_type, 18 required_subject_count, 47 required_credits, 0 elective_subject_count, 0 elective_credits, 1 display_order
    UNION ALL SELECT 'CSNG', 'Khối kiến thức cơ sở ngành', 'COMPULSORY', 11, 30, 0, 0, 2
    UNION ALL SELECT 'CN', 'Khối kiến thức chuyên ngành', 'COMPULSORY', 11, 30, 0, 0, 3
    UNION ALL SELECT 'TN', 'Thực tập', 'COMPULSORY', 1, 4, 0, 0, 4
    UNION ALL SELECT 'TNK', 'Khóa luận tốt nghiệp', 'COMPULSORY', 1, 10, 0, 0, 5
    UNION ALL SELECT 'TC01', 'Giáo dục thể chất', 'ELECTIVE', 0, 0, 3, 3, 6
    UNION ALL SELECT 'TC02', 'Giáo dục quốc phòng - an ninh', 'ELECTIVE', 0, 0, 4, 8, 7
    UNION ALL SELECT 'TC03', 'Khối kiến thức bổ trợ', 'ELECTIVE', 0, 0, 8, 16, 8
    UNION ALL SELECT 'TC04', 'Khối kiến thức điều kiện', 'ELECTIVE', 0, 0, 8, 16, 9
    UNION ALL SELECT 'TC05', 'Khối kiến thức chuyên ngành tự chọn 1', 'ELECTIVE', 0, 0, 8, 16, 10
    UNION ALL SELECT 'TC06', 'Khối kiến thức chuyên ngành tự chọn 2', 'ELECTIVE', 0, 0, 8, 16, 11
    UNION ALL SELECT 'TC07', 'Đồ án/Khóa luận tốt nghiệp tự chọn', 'ELECTIVE', 0, 0, 1, 10, 12
) b;

-- Link existing classes to their major and cohort using the class code/year.
UPDATE classes c
JOIN majors m ON m.department_id = c.department_id
JOIN cohorts h ON h.code = c.academic_year
SET c.major_id = m.id, c.cohort_id = h.id
WHERE c.major_id IS NULL;

-- Scale classes represent the current K19 intake.
UPDATE classes c
JOIN majors m ON m.department_id = c.department_id
JOIN cohorts h ON h.code = 'K19'
SET c.major_id = m.id, c.cohort_id = h.id
WHERE c.code LIKE 'SCALE-%' AND c.major_id IS NULL;

-- Phân bổ môn học chuẩn mực vào các khối chương trình đào tạo
-- 1. Khối GDDC (Giáo dục đại cương) cho toàn bộ các ngành
INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 1
FROM curriculum_blocks cb
CROSS JOIN subjects s
WHERE cb.code = 'GDDC' AND s.subject_code IN ('BS101', 'BS102', 'BS104', 'BS105', 'EN101');

-- Thêm Vật lý đại cương (BS103) cho các khối ngành kỹ thuật (CNTT, Điện - Điện tử, Cơ khí)
INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 1
FROM curriculum_blocks cb
JOIN curriculum_programs cp ON cb.program_id = cp.id
CROSS JOIN subjects s
WHERE cb.code = 'GDDC' AND cp.major_id IN (1, 3, 4) AND s.subject_code = 'BS103';

-- 2. Ngành Công nghệ thông tin (major_id = 1)
INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 1
FROM curriculum_blocks cb
JOIN curriculum_programs cp ON cb.program_id = cp.id
CROSS JOIN subjects s
WHERE cb.code = 'CSNG' AND cp.major_id = 1 AND s.subject_code IN ('IT101', 'IT201', 'IT202', 'IT203');

INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 1
FROM curriculum_blocks cb
JOIN curriculum_programs cp ON cb.program_id = cp.id
CROSS JOIN subjects s
WHERE cb.code = 'CN' AND cp.major_id = 1 AND s.subject_code IN ('IT301', 'IT302', 'IT303', 'IT304');

INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 0
FROM curriculum_blocks cb
JOIN curriculum_programs cp ON cb.program_id = cp.id
CROSS JOIN subjects s
WHERE cb.code = 'TC03' AND cp.major_id = 1 AND s.subject_code IN ('EN201', 'JA101');

INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 0
FROM curriculum_blocks cb
JOIN curriculum_programs cp ON cb.program_id = cp.id
CROSS JOIN subjects s
WHERE cb.code = 'TC05' AND cp.major_id = 1 AND s.subject_code = 'IT305';

INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 0
FROM curriculum_blocks cb
JOIN curriculum_programs cp ON cb.program_id = cp.id
CROSS JOIN subjects s
WHERE cb.code = 'TC06' AND cp.major_id = 1 AND s.subject_code = 'IT401';

-- 3. Ngành Quản trị kinh doanh (major_id = 2)
INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 1
FROM curriculum_blocks cb
JOIN curriculum_programs cp ON cb.program_id = cp.id
CROSS JOIN subjects s
WHERE cb.code = 'CSNG' AND cp.major_id = 2 AND s.subject_code IN ('BA101', 'BA102', 'BA103');

INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 1
FROM curriculum_blocks cb
JOIN curriculum_programs cp ON cb.program_id = cp.id
CROSS JOIN subjects s
WHERE cb.code = 'CN' AND cp.major_id = 2 AND s.subject_code IN ('BA201', 'BA202', 'BA301', 'BA302');

INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 0
FROM curriculum_blocks cb
JOIN curriculum_programs cp ON cb.program_id = cp.id
CROSS JOIN subjects s
WHERE cb.code = 'TC03' AND cp.major_id = 2 AND s.subject_code IN ('EN201', 'JA101');

-- 4. Ngành Điện - Điện tử (major_id = 3)
INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 1
FROM curriculum_blocks cb
JOIN curriculum_programs cp ON cb.program_id = cp.id
CROSS JOIN subjects s
WHERE cb.code = 'CSNG' AND cp.major_id = 3 AND s.subject_code IN ('EE101', 'IT101');

INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 1
FROM curriculum_blocks cb
JOIN curriculum_programs cp ON cb.program_id = cp.id
CROSS JOIN subjects s
WHERE cb.code = 'CN' AND cp.major_id = 3 AND s.subject_code IN ('EE201', 'EE202', 'EE301', 'EE302');

INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 0
FROM curriculum_blocks cb
JOIN curriculum_programs cp ON cb.program_id = cp.id
CROSS JOIN subjects s
WHERE cb.code = 'TC03' AND cp.major_id = 3 AND s.subject_code IN ('EN201', 'JA101');

-- 5. Ngành Cơ khí (major_id = 4)
INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 1
FROM curriculum_blocks cb
JOIN curriculum_programs cp ON cb.program_id = cp.id
CROSS JOIN subjects s
WHERE cb.code = 'CSNG' AND cp.major_id = 4 AND s.subject_code IN ('ME101', 'ME201');

INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 1
FROM curriculum_blocks cb
JOIN curriculum_programs cp ON cb.program_id = cp.id
CROSS JOIN subjects s
WHERE cb.code = 'CN' AND cp.major_id = 4 AND s.subject_code IN ('ME202', 'ME301', 'ME302');

INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 0
FROM curriculum_blocks cb
JOIN curriculum_programs cp ON cb.program_id = cp.id
CROSS JOIN subjects s
WHERE cb.code = 'TC03' AND cp.major_id = 4 AND s.subject_code IN ('EN201', 'JA101');

-- 6. Ngành Ngoại ngữ (major_id = 5)
INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 1
FROM curriculum_blocks cb
JOIN curriculum_programs cp ON cb.program_id = cp.id
CROSS JOIN subjects s
WHERE cb.code = 'CSNG' AND cp.major_id = 5 AND s.subject_code IN ('EN201', 'JA101');

INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 1
FROM curriculum_blocks cb
JOIN curriculum_programs cp ON cb.program_id = cp.id
CROSS JOIN subjects s
WHERE cb.code = 'CN' AND cp.major_id = 5 AND s.subject_code IN ('BA101', 'BA201');

-- 7. Ngành Kế toán - Kiểm toán (major_id = 6)
INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 1
FROM curriculum_blocks cb
JOIN curriculum_programs cp ON cb.program_id = cp.id
CROSS JOIN subjects s
WHERE cb.code = 'CSNG' AND cp.major_id = 6 AND s.subject_code IN ('BA101', 'BA102', 'BA103');

INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 1
FROM curriculum_blocks cb
JOIN curriculum_programs cp ON cb.program_id = cp.id
CROSS JOIN subjects s
WHERE cb.code = 'CN' AND cp.major_id = 6 AND s.subject_code IN ('BA202', 'BA301');

INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 0
FROM curriculum_blocks cb
JOIN curriculum_programs cp ON cb.program_id = cp.id
CROSS JOIN subjects s
WHERE cb.code = 'TC03' AND cp.major_id = 6 AND s.subject_code IN ('EN201', 'JA101');

COMMIT;
