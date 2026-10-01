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
    SELECT 'GDDC' code, 'Khoi kien thuc giao duc dai cuong' name, 'COMPULSORY' block_type, 18 required_subject_count, 47 required_credits, 0 elective_subject_count, 0 elective_credits, 1 display_order
    UNION ALL SELECT 'CSNG', 'Khoi kien thuc co so nganh', 'COMPULSORY', 11, 30, 0, 0, 2
    UNION ALL SELECT 'CN', 'Khoi kien thuc chuyen nganh', 'COMPULSORY', 11, 30, 0, 0, 3
    UNION ALL SELECT 'TN', 'Thuc tap', 'COMPULSORY', 1, 4, 0, 0, 4
    UNION ALL SELECT 'TNK', 'Khoa luan tot nghiep', 'COMPULSORY', 1, 10, 0, 0, 5
    UNION ALL SELECT 'TC01', 'Giao duc the chat', 'ELECTIVE', 0, 0, 3, 3, 6
    UNION ALL SELECT 'TC02', 'Giao duc quoc phong - an ninh', 'ELECTIVE', 0, 0, 4, 8, 7
    UNION ALL SELECT 'TC03', 'Khoi kien thuc bo tro', 'ELECTIVE', 0, 0, 8, 16, 8
    UNION ALL SELECT 'TC04', 'Khoi kien thuc dieu kien', 'ELECTIVE', 0, 0, 8, 16, 9
    UNION ALL SELECT 'TC05', 'Khoi kien thuc chuyen nganh tu chon 1', 'ELECTIVE', 0, 0, 8, 16, 10
    UNION ALL SELECT 'TC06', 'Khoi kien thuc chuyen nganh tu chon 2', 'ELECTIVE', 0, 0, 8, 16, 11
    UNION ALL SELECT 'TC07', 'Do an/Khoa luan tot nghiep tu chon', 'ELECTIVE', 0, 0, 1, 10, 12
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

-- Put each subject into one curriculum block for every cohort of its department's major.
INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
WITH numbered_subjects AS (
    SELECT s.id AS subject_id,
           s.department_id,
           ROW_NUMBER() OVER (PARTITION BY s.department_id ORDER BY s.id) AS subject_order
    FROM subjects s
    WHERE s.is_active = TRUE
)
SELECT b.id,
       ns.subject_id,
       b.block_type = 'COMPULSORY'
FROM numbered_subjects ns
JOIN majors m ON m.department_id = ns.department_id
JOIN curriculum_programs p ON p.major_id = m.id
JOIN curriculum_blocks b ON b.program_id = p.id
WHERE b.code = CASE MOD(ns.subject_order - 1, 12)
    WHEN 0 THEN 'GDDC'
    WHEN 1 THEN 'CSNG'
    WHEN 2 THEN 'CN'
    WHEN 3 THEN 'TN'
    WHEN 4 THEN 'TNK'
    WHEN 5 THEN 'TC01'
    WHEN 6 THEN 'TC02'
    WHEN 7 THEN 'TC03'
    WHEN 8 THEN 'TC04'
    WHEN 9 THEN 'TC05'
    WHEN 10 THEN 'TC06'
    ELSE 'TC07'
END;

COMMIT;
