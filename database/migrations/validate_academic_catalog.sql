-- Data quality checks for the academic catalog.
-- Every query should return zero rows except the two count queries.
USE student_management;

SELECT 'departments' AS entity, COUNT(*) AS total FROM departments;
SELECT 'active_subjects' AS entity, COUNT(*) AS total FROM subjects WHERE is_active = TRUE;

SELECT s.id, s.subject_code, s.subject_name
FROM subjects s
LEFT JOIN departments d ON d.id = s.department_id
WHERE d.id IS NULL OR s.subject_code REGEXP '^SC[0-9]+' OR s.subject_name LIKE 'Scale Subject%';

SELECT subject_code, COUNT(*) AS duplicates
FROM subjects
GROUP BY subject_code
HAVING COUNT(*) > 1;

SELECT cs.id, cs.section_code
FROM course_sections cs
LEFT JOIN subjects s ON s.id = cs.subject_id
LEFT JOIN lecturers l ON l.id = cs.lecturer_id
LEFT JOIN semesters sem ON sem.id = cs.semester_id
WHERE s.id IS NULL OR l.id IS NULL OR sem.id IS NULL;

SELECT c.id, c.code
FROM classes c
LEFT JOIN departments d ON d.id = c.department_id
WHERE d.id IS NULL;