SET NAMES utf8mb4;

UPDATE curriculum_programs p
JOIN majors m ON p.major_id = m.id
JOIN cohorts c ON p.cohort_id = c.id
SET p.name = CONCAT('Chương trình đào tạo ', m.name, ' - ', c.name);

UPDATE curriculum_programs
SET name = 'Chương trình đào tạo Công nghệ thông tin - Khóa 16 (Phenikaa Standardized)'
WHERE id = 1;

UPDATE curriculum_programs
SET name = 'Chương trình đào tạo Kỹ thuật phần mềm - Khóa 17 (Phenikaa Standardized)'
WHERE id = 6;
