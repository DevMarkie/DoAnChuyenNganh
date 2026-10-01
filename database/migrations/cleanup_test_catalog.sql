-- Remove records created by CRUD tests and remove synthetic scale catalog rows.
-- Run after target_scale_seed.sql and balance_scale_students.sql.
USE student_management;
START TRANSACTION;

DELETE FROM classes WHERE id IN (16, 17, 18);
DELETE s
FROM subjects s
LEFT JOIN course_sections cs ON cs.subject_id = s.id
WHERE s.id >= 38
    AND cs.id IS NULL;

UPDATE classes c
JOIN departments d ON d.id = c.department_id
SET c.code = CONCAT('SCALE-', d.code, '-', LPAD(c.id - 18, 2, '0')),
    c.name = CONCAT('Lop du lieu ', d.name, ' ', LPAD(c.id - 18, 2, '0'))
WHERE c.id BETWEEN 19 AND 31;

UPDATE lecturers l
JOIN departments d ON d.id = l.department_id
SET l.full_name = CONCAT('Giang vien ', d.code, ' ', LPAD(l.id - 25, 3, '0')),
    l.specialization = CONCAT('Chuyen mon ', d.name)
WHERE l.id BETWEEN 26 AND 500;

COMMIT;