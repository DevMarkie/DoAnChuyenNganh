USE student_management;

START TRANSACTION;

-- IT301-HK1-26 was historically seeded as one 160-student section.
-- Split the existing registrations into four sections of 40 students.
-- This migration is intentionally idempotent by section_code.

INSERT INTO course_sections (
    section_code, subject_id, lecturer_id, semester_id, max_students,
    enrolled_count, schedule, room, status
)
SELECT 'IT301-02-HK1-26', cs.subject_id, cs.lecturer_id, cs.semester_id,
       50, 0, 'Thứ Tư (07:00-09:30)', 'A104', cs.status
FROM course_sections cs
WHERE cs.section_code = 'IT301-01-HK1-26'
  AND NOT EXISTS (
      SELECT 1 FROM course_sections existing
      WHERE existing.section_code = 'IT301-02-HK1-26'
  );

INSERT INTO course_sections (
    section_code, subject_id, lecturer_id, semester_id, max_students,
    enrolled_count, schedule, room, status
)
SELECT 'IT301-03-HK1-26', cs.subject_id, cs.lecturer_id, cs.semester_id,
       50, 0, 'Thứ Sáu (07:00-09:30)', 'A205', cs.status
FROM course_sections cs
WHERE cs.section_code = 'IT301-01-HK1-26'
  AND NOT EXISTS (
      SELECT 1 FROM course_sections existing
      WHERE existing.section_code = 'IT301-03-HK1-26'
  );

INSERT INTO course_sections (
    section_code, subject_id, lecturer_id, semester_id, max_students,
    enrolled_count, schedule, room, status
)
SELECT 'IT301-04-HK1-26', cs.subject_id, cs.lecturer_id, cs.semester_id,
       50, 0, 'Thứ Năm (07:00-09:30)', 'A206', cs.status
FROM course_sections cs
WHERE cs.section_code = 'IT301-01-HK1-26'
  AND NOT EXISTS (
      SELECT 1 FROM course_sections existing
      WHERE existing.section_code = 'IT301-04-HK1-26'
  );

INSERT INTO schedules (
    section_id, class_id, day_of_week, start_period, end_period,
    room, start_date, end_date, note
)
SELECT cs.id, 4, 2, 1, 3, 'A101', sem.start_date, sem.end_date,
       'Phát triển ứng dụng Web - Lớp 01'
FROM course_sections cs
JOIN semesters sem ON sem.id = cs.semester_id
WHERE cs.section_code = 'IT301-01-HK1-26'
  AND NOT EXISTS (SELECT 1 FROM schedules s WHERE s.section_id = cs.id);

INSERT INTO schedules (
    section_id, class_id, day_of_week, start_period, end_period,
    room, start_date, end_date, note
)
SELECT cs.id, 4, 3, 1, 3, 'A104', sem.start_date, sem.end_date,
       'Phát triển ứng dụng Web - Lớp 02'
FROM course_sections cs
JOIN semesters sem ON sem.id = cs.semester_id
WHERE cs.section_code = 'IT301-02-HK1-26'
  AND NOT EXISTS (SELECT 1 FROM schedules s WHERE s.section_id = cs.id);

INSERT INTO schedules (
    section_id, class_id, day_of_week, start_period, end_period,
    room, start_date, end_date, note
)
SELECT cs.id, 4, 6, 1, 3, 'A205', sem.start_date, sem.end_date,
       'Phát triển ứng dụng Web - Lớp 03'
FROM course_sections cs
JOIN semesters sem ON sem.id = cs.semester_id
WHERE cs.section_code = 'IT301-03-HK1-26'
  AND NOT EXISTS (SELECT 1 FROM schedules s WHERE s.section_id = cs.id);

INSERT INTO schedules (
    section_id, class_id, day_of_week, start_period, end_period,
    room, start_date, end_date, note
)
SELECT cs.id, 4, 5, 1, 3, 'A206', sem.start_date, sem.end_date,
       'Phát triển ứng dụng Web - Lớp 04'
FROM course_sections cs
JOIN semesters sem ON sem.id = cs.semester_id
WHERE cs.section_code = 'IT301-04-HK1-26'
  AND NOT EXISTS (SELECT 1 FROM schedules s WHERE s.section_id = cs.id);

DROP TEMPORARY TABLE IF EXISTS tmp_it301_split;
CREATE TEMPORARY TABLE tmp_it301_split (
    enrollment_id BIGINT PRIMARY KEY,
    target_section_code VARCHAR(30) NOT NULL
);

INSERT INTO tmp_it301_split (enrollment_id, target_section_code)
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
    JOIN course_sections source_section ON source_section.id = e0.section_id
    WHERE source_section.section_code = 'IT301-01-HK1-26'
) ranked;

UPDATE enrollments e
JOIN tmp_it301_split split ON split.enrollment_id = e.id
JOIN course_sections target_section
  ON target_section.section_code = split.target_section_code
SET e.section_id = target_section.id
WHERE e.id IN (SELECT enrollment_id FROM tmp_it301_split);

DROP TEMPORARY TABLE tmp_it301_split;

UPDATE course_sections cs
SET cs.enrolled_count = (
    SELECT COUNT(*)
    FROM enrollments e
    WHERE e.section_id = cs.id
      AND e.status <> 'CANCELLED'
)
WHERE cs.section_code IN (
    'IT301-01-HK1-26', 'IT301-02-HK1-26',
    'IT301-03-HK1-26', 'IT301-04-HK1-26'
);

-- Restore the physical capacity after any older repair script may have
-- copied the legacy 160-student count into max_students.
UPDATE course_sections
SET max_students = 50
WHERE section_code IN (
    'IT301-01-HK1-26', 'IT301-02-HK1-26',
    'IT301-03-HK1-26', 'IT301-04-HK1-26'
);

COMMIT;
