USE student_management;
START TRANSACTION;

-- Gán major và cohort cho các lớp nếu chưa có
UPDATE classes c
JOIN majors m ON m.department_id = c.department_id
JOIN cohorts h ON h.code = 'K19'
SET c.major_id = m.id, c.cohort_id = h.id
WHERE c.code LIKE 'SCALE-%' AND c.major_id IS NULL;

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
-- Cơ sở ngành (CSNG)
INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 1
FROM curriculum_blocks cb
JOIN curriculum_programs cp ON cb.program_id = cp.id
CROSS JOIN subjects s
WHERE cb.code = 'CSNG' AND cp.major_id = 1 AND s.subject_code IN ('IT101', 'IT201', 'IT202', 'IT203');

-- Chuyên ngành (CN)
INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 1
FROM curriculum_blocks cb
JOIN curriculum_programs cp ON cb.program_id = cp.id
CROSS JOIN subjects s
WHERE cb.code = 'CN' AND cp.major_id = 1 AND s.subject_code IN ('IT301', 'IT302', 'IT303', 'IT304');

-- Tự chọn chuyên ngành & Bổ trợ (TC03, TC05, TC06)
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
