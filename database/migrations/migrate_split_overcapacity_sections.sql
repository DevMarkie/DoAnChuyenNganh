USE student_management;

-- ============================================================
-- MIGRATION: Split all over-capacity sections in HK1-26
-- ============================================================
-- Problem: Multiple sections have enrolled_count far exceeding
-- max_students (e.g. 80/50, 160/50). This migration creates
-- additional sections and redistributes enrollments so every
-- section stays within its physical capacity.
--
-- Strategy:
--   - 80 students → 2 sections of 40
--   - 160 students → 4 sections of 40 (IT301 only)
-- ============================================================

START TRANSACTION;

-- ============================================================
-- STEP 1: Create new sections for each overcapacity section
-- ============================================================

-- IT301-01-HK1-26 (id=37): 160/50 → 4 sections of 40 (needs 3 new ones)
INSERT INTO course_sections (section_code, subject_id, lecturer_id, semester_id, max_students, enrolled_count, schedule, room, status)
SELECT 'IT301-02-HK1-26', cs.subject_id, 2, cs.semester_id, 50, 0,
       'Thứ Tư (07:00-09:30)', 'A104', cs.status
FROM course_sections cs WHERE cs.id = 37
  AND NOT EXISTS (SELECT 1 FROM course_sections x WHERE x.section_code = 'IT301-02-HK1-26');

INSERT INTO course_sections (section_code, subject_id, lecturer_id, semester_id, max_students, enrolled_count, schedule, room, status)
SELECT 'IT301-03-HK1-26', cs.subject_id, 3, cs.semester_id, 50, 0,
       'Thứ Sáu (07:00-09:30)', 'A205', cs.status
FROM course_sections cs WHERE cs.id = 37
  AND NOT EXISTS (SELECT 1 FROM course_sections x WHERE x.section_code = 'IT301-03-HK1-26');

INSERT INTO course_sections (section_code, subject_id, lecturer_id, semester_id, max_students, enrolled_count, schedule, room, status)
SELECT 'IT301-04-HK1-26', cs.subject_id, 4, cs.semester_id, 50, 0,
       'Thứ Năm (07:00-09:30)', 'A206', cs.status
FROM course_sections cs WHERE cs.id = 37
  AND NOT EXISTS (SELECT 1 FROM course_sections x WHERE x.section_code = 'IT301-04-HK1-26');

-- IT304-01-HK1-26 (id=38): 80/50 → 2 sections
INSERT INTO course_sections (section_code, subject_id, lecturer_id, semester_id, max_students, enrolled_count, schedule, room, status)
SELECT 'IT304-02-HK1-26', cs.subject_id, 4, cs.semester_id, 50, 0,
       'Thứ Hai (07:00-09:30)', 'A207', cs.status
FROM course_sections cs WHERE cs.id = 38
  AND NOT EXISTS (SELECT 1 FROM course_sections x WHERE x.section_code = 'IT304-02-HK1-26');

-- IT305-01-HK1-26 (id=39): 80/50 → 2 sections
INSERT INTO course_sections (section_code, subject_id, lecturer_id, semester_id, max_students, enrolled_count, schedule, room, status)
SELECT 'IT305-02-HK1-26', cs.subject_id, 5, cs.semester_id, 50, 0,
       'Thứ Bảy (07:00-09:30)', 'A103', cs.status
FROM course_sections cs WHERE cs.id = 39
  AND NOT EXISTS (SELECT 1 FROM course_sections x WHERE x.section_code = 'IT305-02-HK1-26');

-- IT401-01-HK1-26 (id=40): 80/50 → 2 sections
INSERT INTO course_sections (section_code, subject_id, lecturer_id, semester_id, max_students, enrolled_count, schedule, room, status)
SELECT 'IT401-02-HK1-26', cs.subject_id, 1, cs.semester_id, 50, 0,
       'Thứ Bảy (13:20-15:50)', 'A201', cs.status
FROM course_sections cs WHERE cs.id = 40
  AND NOT EXISTS (SELECT 1 FROM course_sections x WHERE x.section_code = 'IT401-02-HK1-26');

-- IT303-01-HK1-26 (id=41): 80/50 → 2 sections
INSERT INTO course_sections (section_code, subject_id, lecturer_id, semester_id, max_students, enrolled_count, schedule, room, status)
SELECT 'IT303-02-HK1-26', cs.subject_id, 5, cs.semester_id, 50, 0,
       'Thứ Ba (13:20-15:50)', 'A202', cs.status
FROM course_sections cs WHERE cs.id = 41
  AND NOT EXISTS (SELECT 1 FROM course_sections x WHERE x.section_code = 'IT303-02-HK1-26');

-- BA301-01-HK1-26 (id=42): 80/55 → 2 sections
INSERT INTO course_sections (section_code, subject_id, lecturer_id, semester_id, max_students, enrolled_count, schedule, room, status)
SELECT 'BA301-02-HK1-26', cs.subject_id, 9, cs.semester_id, 55, 0,
       'Thứ Năm (07:00-09:30)', 'B101', cs.status
FROM course_sections cs WHERE cs.id = 42
  AND NOT EXISTS (SELECT 1 FROM course_sections x WHERE x.section_code = 'BA301-02-HK1-26');

-- EE301-01-HK1-26 (id=44): 80/45 → 2 sections
INSERT INTO course_sections (section_code, subject_id, lecturer_id, semester_id, max_students, enrolled_count, schedule, room, status)
SELECT 'EE301-02-HK1-26', cs.subject_id, 14, cs.semester_id, 45, 0,
       'Thứ Hai (13:20-15:50)', 'C103', cs.status
FROM course_sections cs WHERE cs.id = 44
  AND NOT EXISTS (SELECT 1 FROM course_sections x WHERE x.section_code = 'EE301-02-HK1-26');

-- ME202-01-HK1-26 (id=46): 80/45 → 2 sections
INSERT INTO course_sections (section_code, subject_id, lecturer_id, semester_id, max_students, enrolled_count, schedule, room, status)
SELECT 'ME202-02-HK1-26', cs.subject_id, 20, cs.semester_id, 45, 0,
       'Thứ Năm (07:00-10:20)', 'D103', cs.status
FROM course_sections cs WHERE cs.id = 46
  AND NOT EXISTS (SELECT 1 FROM course_sections x WHERE x.section_code = 'ME202-02-HK1-26');

-- EN101-01-HK1-26 (id=50): 80/45 → 2 sections
INSERT INTO course_sections (section_code, subject_id, lecturer_id, semester_id, max_students, enrolled_count, schedule, room, status)
SELECT 'EN101-02-HK1-26', cs.subject_id, 24, cs.semester_id, 45, 0,
       'Thứ Bảy (09:35-11:15)', 'C202', cs.status
FROM course_sections cs WHERE cs.id = 50
  AND NOT EXISTS (SELECT 1 FROM course_sections x WHERE x.section_code = 'EN101-02-HK1-26');

-- ============================================================
-- STEP 2: Create schedules for new sections
-- ============================================================

-- IT301-02: Wed P1-3, A104
INSERT INTO schedules (section_id, day_of_week, start_period, end_period, room, start_date, end_date, note)
SELECT cs.id, 4, 1, 3, 'A104', sem.start_date, sem.end_date, 'Phát triển ứng dụng Web - Lớp 02'
FROM course_sections cs JOIN semesters sem ON sem.id = cs.semester_id
WHERE cs.section_code = 'IT301-02-HK1-26'
  AND NOT EXISTS (SELECT 1 FROM schedules s WHERE s.section_id = cs.id);

-- IT301-03: Fri P1-3, A205
INSERT INTO schedules (section_id, day_of_week, start_period, end_period, room, start_date, end_date, note)
SELECT cs.id, 6, 1, 3, 'A205', sem.start_date, sem.end_date, 'Phát triển ứng dụng Web - Lớp 03'
FROM course_sections cs JOIN semesters sem ON sem.id = cs.semester_id
WHERE cs.section_code = 'IT301-03-HK1-26'
  AND NOT EXISTS (SELECT 1 FROM schedules s WHERE s.section_id = cs.id);

-- IT301-04: Thu P1-3, A206
INSERT INTO schedules (section_id, day_of_week, start_period, end_period, room, start_date, end_date, note)
SELECT cs.id, 5, 1, 3, 'A206', sem.start_date, sem.end_date, 'Phát triển ứng dụng Web - Lớp 04'
FROM course_sections cs JOIN semesters sem ON sem.id = cs.semester_id
WHERE cs.section_code = 'IT301-04-HK1-26'
  AND NOT EXISTS (SELECT 1 FROM schedules s WHERE s.section_id = cs.id);

-- IT304-02: Mon P1-3, A207
INSERT INTO schedules (section_id, day_of_week, start_period, end_period, room, start_date, end_date, note)
SELECT cs.id, 2, 1, 3, 'A207', sem.start_date, sem.end_date, 'Công nghệ phần mềm - Lớp 02'
FROM course_sections cs JOIN semesters sem ON sem.id = cs.semester_id
WHERE cs.section_code = 'IT304-02-HK1-26'
  AND NOT EXISTS (SELECT 1 FROM schedules s WHERE s.section_id = cs.id);

-- IT305-02: Sat P1-3, A103
INSERT INTO schedules (section_id, day_of_week, start_period, end_period, room, start_date, end_date, note)
SELECT cs.id, 7, 1, 3, 'A103', sem.start_date, sem.end_date, 'Kiểm thử phần mềm - Lớp 02'
FROM course_sections cs JOIN semesters sem ON sem.id = cs.semester_id
WHERE cs.section_code = 'IT305-02-HK1-26'
  AND NOT EXISTS (SELECT 1 FROM schedules s WHERE s.section_id = cs.id);

-- IT401-02: Sat P7-9, A201
INSERT INTO schedules (section_id, day_of_week, start_period, end_period, room, start_date, end_date, note)
SELECT cs.id, 7, 7, 9, 'A201', sem.start_date, sem.end_date, 'An toàn thông tin - Lớp 02'
FROM course_sections cs JOIN semesters sem ON sem.id = cs.semester_id
WHERE cs.section_code = 'IT401-02-HK1-26'
  AND NOT EXISTS (SELECT 1 FROM schedules s WHERE s.section_id = cs.id);

-- IT303-02: Tue P7-9, A202
INSERT INTO schedules (section_id, day_of_week, start_period, end_period, room, start_date, end_date, note)
SELECT cs.id, 3, 7, 9, 'A202', sem.start_date, sem.end_date, 'Trí tuệ nhân tạo - Lớp 02'
FROM course_sections cs JOIN semesters sem ON sem.id = cs.semester_id
WHERE cs.section_code = 'IT303-02-HK1-26'
  AND NOT EXISTS (SELECT 1 FROM schedules s WHERE s.section_id = cs.id);

-- BA301-02: Thu P1-3, B101
INSERT INTO schedules (section_id, day_of_week, start_period, end_period, room, start_date, end_date, note)
SELECT cs.id, 5, 1, 3, 'B101', sem.start_date, sem.end_date, 'Tài chính doanh nghiệp - Lớp 02'
FROM course_sections cs JOIN semesters sem ON sem.id = cs.semester_id
WHERE cs.section_code = 'BA301-02-HK1-26'
  AND NOT EXISTS (SELECT 1 FROM schedules s WHERE s.section_id = cs.id);

-- EE301-02: Mon P7-9, C103
INSERT INTO schedules (section_id, day_of_week, start_period, end_period, room, start_date, end_date, note)
SELECT cs.id, 2, 7, 9, 'C103', sem.start_date, sem.end_date, 'Đo lường và cảm biến - Lớp 02'
FROM course_sections cs JOIN semesters sem ON sem.id = cs.semester_id
WHERE cs.section_code = 'EE301-02-HK1-26'
  AND NOT EXISTS (SELECT 1 FROM schedules s WHERE s.section_id = cs.id);

-- ME202-02: Thu P1-4, D103
INSERT INTO schedules (section_id, day_of_week, start_period, end_period, room, start_date, end_date, note)
SELECT cs.id, 5, 1, 4, 'D103', sem.start_date, sem.end_date, 'Động cơ đốt trong - Lớp 02'
FROM course_sections cs JOIN semesters sem ON sem.id = cs.semester_id
WHERE cs.section_code = 'ME202-02-HK1-26'
  AND NOT EXISTS (SELECT 1 FROM schedules s WHERE s.section_id = cs.id);

-- EN101-02: Sat P4-6, C202
INSERT INTO schedules (section_id, day_of_week, start_period, end_period, room, start_date, end_date, note)
SELECT cs.id, 7, 4, 6, 'C202', sem.start_date, sem.end_date, 'Tiếng Anh 1 - Lớp 02'
FROM course_sections cs JOIN semesters sem ON sem.id = cs.semester_id
WHERE cs.section_code = 'EN101-02-HK1-26'
  AND NOT EXISTS (SELECT 1 FROM schedules s WHERE s.section_id = cs.id);

-- ============================================================
-- STEP 3: Redistribute enrollments using temp table + ranked rows
-- ============================================================

-- Generic approach: for each overcapacity section, move the second
-- half of enrollments (by enrollment ID order) to the new -02 section.
-- For IT301 with 160 students, split into 4 groups of 40.

DROP TEMPORARY TABLE IF EXISTS tmp_split;
CREATE TEMPORARY TABLE tmp_split (
    enrollment_id BIGINT PRIMARY KEY,
    target_section_code VARCHAR(30) NOT NULL
);

-- IT301-01 (160 students → 4 groups of 40)
INSERT INTO tmp_split (enrollment_id, target_section_code)
SELECT id,
       CASE
           WHEN row_num <= 40 THEN 'IT301-01-HK1-26'
           WHEN row_num <= 80 THEN 'IT301-02-HK1-26'
           WHEN row_num <= 120 THEN 'IT301-03-HK1-26'
           ELSE 'IT301-04-HK1-26'
       END
FROM (
    SELECT e0.id, ROW_NUMBER() OVER (ORDER BY e0.id) AS row_num
    FROM enrollments e0
    WHERE e0.section_id = 37
) ranked;

-- IT304-01 (80 → 2×40)
INSERT INTO tmp_split (enrollment_id, target_section_code)
SELECT id,
       CASE WHEN row_num <= 40 THEN 'IT304-01-HK1-26' ELSE 'IT304-02-HK1-26' END
FROM (
    SELECT e0.id, ROW_NUMBER() OVER (ORDER BY e0.id) AS row_num
    FROM enrollments e0
    WHERE e0.section_id = 38
) ranked;

-- IT305-01 (80 → 2×40)
INSERT INTO tmp_split (enrollment_id, target_section_code)
SELECT id,
       CASE WHEN row_num <= 40 THEN 'IT305-01-HK1-26' ELSE 'IT305-02-HK1-26' END
FROM (
    SELECT e0.id, ROW_NUMBER() OVER (ORDER BY e0.id) AS row_num
    FROM enrollments e0
    WHERE e0.section_id = 39
) ranked;

-- IT401-01 (80 → 2×40)
INSERT INTO tmp_split (enrollment_id, target_section_code)
SELECT id,
       CASE WHEN row_num <= 40 THEN 'IT401-01-HK1-26' ELSE 'IT401-02-HK1-26' END
FROM (
    SELECT e0.id, ROW_NUMBER() OVER (ORDER BY e0.id) AS row_num
    FROM enrollments e0
    WHERE e0.section_id = 40
) ranked;

-- IT303-01 (80 → 2×40)
INSERT INTO tmp_split (enrollment_id, target_section_code)
SELECT id,
       CASE WHEN row_num <= 40 THEN 'IT303-01-HK1-26' ELSE 'IT303-02-HK1-26' END
FROM (
    SELECT e0.id, ROW_NUMBER() OVER (ORDER BY e0.id) AS row_num
    FROM enrollments e0
    WHERE e0.section_id = 41
) ranked;

-- BA301-01 (80 → 2×40)
INSERT INTO tmp_split (enrollment_id, target_section_code)
SELECT id,
       CASE WHEN row_num <= 40 THEN 'BA301-01-HK1-26' ELSE 'BA301-02-HK1-26' END
FROM (
    SELECT e0.id, ROW_NUMBER() OVER (ORDER BY e0.id) AS row_num
    FROM enrollments e0
    WHERE e0.section_id = 42
) ranked;

-- EE301-01 (80 → 2×40)
INSERT INTO tmp_split (enrollment_id, target_section_code)
SELECT id,
       CASE WHEN row_num <= 40 THEN 'EE301-01-HK1-26' ELSE 'EE301-02-HK1-26' END
FROM (
    SELECT e0.id, ROW_NUMBER() OVER (ORDER BY e0.id) AS row_num
    FROM enrollments e0
    WHERE e0.section_id = 44
) ranked;

-- ME202-01 (80 → 2×40)
INSERT INTO tmp_split (enrollment_id, target_section_code)
SELECT id,
       CASE WHEN row_num <= 40 THEN 'ME202-01-HK1-26' ELSE 'ME202-02-HK1-26' END
FROM (
    SELECT e0.id, ROW_NUMBER() OVER (ORDER BY e0.id) AS row_num
    FROM enrollments e0
    WHERE e0.section_id = 46
) ranked;

-- EN101-01 (80 → 2×40)
INSERT INTO tmp_split (enrollment_id, target_section_code)
SELECT id,
       CASE WHEN row_num <= 40 THEN 'EN101-01-HK1-26' ELSE 'EN101-02-HK1-26' END
FROM (
    SELECT e0.id, ROW_NUMBER() OVER (ORDER BY e0.id) AS row_num
    FROM enrollments e0
    WHERE e0.section_id = 50
) ranked;

-- ============================================================
-- STEP 4: Move enrollments to their target sections
-- ============================================================

-- Disable the triggers temporarily to avoid double-counting
-- (we will recalculate enrolled_count in step 5)

UPDATE enrollments e
JOIN tmp_split split ON split.enrollment_id = e.id
JOIN course_sections target_cs ON target_cs.section_code = split.target_section_code
SET e.section_id = target_cs.id
WHERE e.section_id != target_cs.id;

DROP TEMPORARY TABLE tmp_split;

-- ============================================================
-- STEP 5: Recalculate enrolled_count for ALL affected sections
-- ============================================================

UPDATE course_sections cs
SET cs.enrolled_count = (
    SELECT COUNT(*)
    FROM enrollments e
    WHERE e.section_id = cs.id
      AND e.status <> 'CANCELLED'
)
WHERE cs.semester_id = 4;

-- ============================================================
-- STEP 6: Also fix any historical sections that were inflated
-- by the old seed repair script (max_students = enrolled_count)
-- ============================================================

-- For CLOSED (historical) sections, the seed had set
-- max_students = enrolled_count. Since those are finalized,
-- we keep them as-is (no students can register).
-- Only for OPEN sections do we enforce the physical capacity.
UPDATE course_sections
SET max_students = 50
WHERE section_code IN (
    'IT301-01-HK1-26', 'IT301-02-HK1-26',
    'IT301-03-HK1-26', 'IT301-04-HK1-26',
    'IT304-01-HK1-26', 'IT304-02-HK1-26',
    'IT305-01-HK1-26', 'IT305-02-HK1-26',
    'IT401-01-HK1-26', 'IT401-02-HK1-26',
    'IT303-01-HK1-26', 'IT303-02-HK1-26'
);

UPDATE course_sections
SET max_students = 55
WHERE section_code IN (
    'BA301-01-HK1-26', 'BA301-02-HK1-26'
);

UPDATE course_sections
SET max_students = 45
WHERE section_code IN (
    'EE301-01-HK1-26', 'EE301-02-HK1-26',
    'ME202-01-HK1-26', 'ME202-02-HK1-26',
    'EN101-01-HK1-26', 'EN101-02-HK1-26'
);

-- ============================================================
-- Verification query (run manually to check)
-- ============================================================
-- SELECT section_code, max_students, enrolled_count,
--        CASE WHEN enrolled_count > max_students THEN 'OVER!' ELSE 'OK' END AS status_check
-- FROM course_sections
-- WHERE semester_id = 4
-- ORDER BY section_code;

COMMIT;
