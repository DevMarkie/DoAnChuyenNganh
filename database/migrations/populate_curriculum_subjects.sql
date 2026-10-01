USE student_management;
START TRANSACTION;

UPDATE classes c
JOIN majors m ON m.department_id = c.department_id
JOIN cohorts h ON h.code = 'K19'
SET c.major_id = m.id, c.cohort_id = h.id
WHERE c.code LIKE 'SCALE-%' AND c.major_id IS NULL;

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
