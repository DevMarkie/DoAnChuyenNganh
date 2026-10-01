-- Balance the 9,400 generated scale students across all 13 departments.
-- Run after target_scale_seed.sql on the standard seed database.
USE student_management;
START TRANSACTION;

INSERT IGNORE INTO classes (id, code, name, department_id, academic_year, is_active)
VALUES
  (19, 'SCALE-D01', 'Scale Class Department 01', 1, 'SCALE', TRUE),
  (20, 'SCALE-D02', 'Scale Class Department 02', 2, 'SCALE', TRUE),
  (21, 'SCALE-D03', 'Scale Class Department 03', 3, 'SCALE', TRUE),
  (22, 'SCALE-D04', 'Scale Class Department 04', 4, 'SCALE', TRUE),
  (23, 'SCALE-D05', 'Scale Class Department 05', 5, 'SCALE', TRUE),
  (24, 'SCALE-D06', 'Scale Class Department 06', 6, 'SCALE', TRUE),
  (25, 'SCALE-D07', 'Scale Class Department 07', 7, 'SCALE', TRUE),
  (26, 'SCALE-D08', 'Scale Class Department 08', 8, 'SCALE', TRUE),
  (27, 'SCALE-D09', 'Scale Class Department 09', 9, 'SCALE', TRUE),
  (28, 'SCALE-D10', 'Scale Class Department 10', 10, 'SCALE', TRUE),
  (29, 'SCALE-D11', 'Scale Class Department 11', 11, 'SCALE', TRUE),
  (30, 'SCALE-D12', 'Scale Class Department 12', 12, 'SCALE', TRUE),
  (31, 'SCALE-D13', 'Scale Class Department 13', 13, 'SCALE', TRUE);

UPDATE students
SET class_id = CASE
  WHEN id BETWEEN 601 AND 1129 THEN 19
  WHEN id BETWEEN 1130 AND 1778 THEN 20
  WHEN id BETWEEN 1779 AND 2427 THEN 21
  WHEN id BETWEEN 2428 AND 3116 THEN 22
  WHEN id BETWEEN 3117 AND 3845 THEN 23
  WHEN id BETWEEN 3846 AND 4615 THEN 24
  WHEN id BETWEEN 4616 AND 5385 THEN 25
  WHEN id BETWEEN 5386 AND 6155 THEN 26
  WHEN id BETWEEN 6156 AND 6924 THEN 27
  WHEN id BETWEEN 6925 AND 7693 THEN 28
  WHEN id BETWEEN 7694 AND 8462 THEN 29
  WHEN id BETWEEN 8463 AND 9231 THEN 30
  ELSE 31
END
WHERE id BETWEEN 601 AND 10000;

COMMIT;
