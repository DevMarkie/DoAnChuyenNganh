-- ============================================================
-- V16__phenikaa_university_curriculum_standardization.sql
-- Chuẩn hóa Khung Chương trình Đào tạo toàn trường (112 CTĐT)
-- Đại học Phenikaa - Tuân thủ Thông tư 17/2021/TT-BGDĐT
-- ============================================================

-- 1. Chuẩn hóa total_credits cho 112 chương trình đào tạo
-- Nhóm Sức khỏe / Y Dược (department_id = 5): 150 tín chỉ
-- Các nhóm ngành còn lại (Kỹ thuật, Công nghệ, Kinh tế, Xã hội, Luật, Du lịch): 135 tín chỉ
UPDATE curriculum_programs p
JOIN majors m ON p.major_id = m.id
SET p.total_credits = CASE 
    WHEN m.department_id = 5 THEN 150
    ELSE 135
END;

UPDATE curriculum_programs
SET name = 'Chương trình đào tạo Công nghệ thông tin - Khóa 16 (Phenikaa Standardized)'
WHERE id = 1;

-- 2. Cân đối tín chỉ yêu cầu của 5 khối kiến thức chuẩn
-- Khối 135 TC: GDDC (42) + CSNG (31) + CN (38) + TC (14) + TOTNGHIEP (10) = 135 TC
-- Khối 150 TC: GDDC (45) + CSNG (35) + CN (42) + TC (16) + TOTNGHIEP (12) = 150 TC
UPDATE curriculum_blocks b
JOIN curriculum_programs p ON b.program_id = p.id
JOIN majors m ON p.major_id = m.id
SET 
    b.required_credits = CASE 
        WHEN m.department_id = 5 AND b.code = 'GDDC' THEN 45
        WHEN m.department_id = 5 AND b.code = 'CSNG' THEN 35
        WHEN m.department_id = 5 AND b.code = 'CN' THEN 42
        WHEN m.department_id = 5 AND b.code = 'TOTNGHIEP' THEN 12
        WHEN b.code = 'GDDC' THEN 42
        WHEN b.code = 'CSNG' THEN 31
        WHEN b.code = 'CN' THEN 38
        WHEN b.code = 'TOTNGHIEP' THEN 10
        ELSE b.required_credits
    END,
    b.elective_credits = CASE 
        WHEN m.department_id = 5 AND b.code = 'TC' THEN 16
        WHEN b.code = 'TC' THEN 14
        ELSE b.elective_credits
    END
WHERE p.id != 6; -- Giữ nguyên program 6 đã cấu trúc 7 khối chi tiết ở V13

-- 3. Bổ sung các môn học Phenikaa (201..270) vào các khối của Program 1 (CNTT-K16)
-- Khối 1: GDDC (block_id = 1)
INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT 1, id, 1 FROM subjects WHERE id BETWEEN 201 AND 218;

-- Khối 2: CSNG (block_id = 2)
INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT 2, id, 1 FROM subjects WHERE id BETWEEN 219 AND 229;

-- Khối 3: CN (block_id = 3)
INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT 3, id, 1 FROM subjects WHERE id BETWEEN 236 AND 246;

-- Khối 4: TC (block_id = 4)
INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT 4, id, 0 FROM subjects WHERE id BETWEEN 247 AND 260;

-- Khối 5: TOTNGHIEP (block_id = 5)
INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT 5, id, 1 FROM subjects WHERE id IN (261, 262);
