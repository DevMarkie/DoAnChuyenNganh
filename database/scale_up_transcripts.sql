-- ============================================================
-- SCALE-UP ACADEMIC TRANSCRIPTS FOR 3,000 STUDENTS
-- Khóa 16: ~114 TC tích lũy (Năm 4 - chuẩn bị tốt nghiệp)
-- Khóa 17: ~70 TC tích lũy (Năm 3)
-- Khóa 18: ~37 TC tích lũy (Năm 2)
-- Khóa 19: Giữ nguyên (Năm 1, kỳ 1)
-- ============================================================

-- 1. Tạo các lớp học phần chuẩn trong các kỳ đã qua (Semesters 1..6)
INSERT INTO course_sections (section_code, subject_id, lecturer_id, semester_id, max_students, enrolled_count, status, section_type, min_students, scale_coefficient, base_tuition_rate, grade_submission_status)
SELECT 
    CONCAT(s.subject_code, '-SEC-SEM', sem.id),
    s.id,
    1,
    sem.id,
    2000,
    0,
    'COMPLETED',
    'REGULAR',
    1,
    1.00,
    0.00,
    'PUBLISHED'
FROM subjects s
CROSS JOIN semesters sem
WHERE s.id IN (203, 208, 209, 210, 212, 221, 227, 228, 229, 230, 231, 241, 242, 244, 245, 246, 243)
  AND sem.id = CASE 
      WHEN s.id IN (203, 210) THEN 1
      WHEN s.id IN (208, 221) THEN 2
      WHEN s.id IN (209, 227) THEN 3
      WHEN s.id IN (212, 228, 241) THEN 4
      WHEN s.id IN (229, 230, 242, 244) THEN 5
      ELSE 6
  END
ON DUPLICATE KEY UPDATE max_students=VALUES(max_students);

-- 2. Gán các môn này vào tất cả các chương trình đào tạo để DegreeAudit nhận diện
INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 1
FROM curriculum_blocks cb
CROSS JOIN subjects s
WHERE s.id IN (203, 208, 209, 210, 212) AND cb.code = 'GDDC';

INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 1
FROM curriculum_blocks cb
CROSS JOIN subjects s
WHERE s.id IN (221, 227, 228, 229, 230, 231) AND cb.code = 'CSNG';

INSERT IGNORE INTO curriculum_block_subjects (block_id, subject_id, is_required)
SELECT cb.id, s.id, 1
FROM curriculum_blocks cb
CROSS JOIN subjects s
WHERE s.id IN (241, 242, 244, 245, 246, 243) AND cb.code = 'CN';

-- 3. Bổ sung ghi danh (enrollments) cho Khóa 16 (Semesters 1..6)
INSERT INTO enrollments (student_id, section_id, status, enrollment_type, attendance_status)
SELECT s.id, cs.id, 'COMPLETED', 'FIRST_TIME', 'QUALIFIED'
FROM students s
JOIN classes c ON s.class_id = c.id
CROSS JOIN course_sections cs
WHERE c.cohort_id = 1
  AND cs.section_code LIKE '%-SEC-SEM%'
  AND NOT EXISTS (
      SELECT 1 FROM enrollments e2 
      JOIN course_sections cs2 ON e2.section_id = cs2.id 
      WHERE e2.student_id = s.id AND cs2.subject_id = cs.subject_id
  );

-- 4. Bổ sung ghi danh cho Khóa 17 (Semesters 1..4)
INSERT INTO enrollments (student_id, section_id, status, enrollment_type, attendance_status)
SELECT s.id, cs.id, 'COMPLETED', 'FIRST_TIME', 'QUALIFIED'
FROM students s
JOIN classes c ON s.class_id = c.id
CROSS JOIN course_sections cs
WHERE c.cohort_id = 2
  AND cs.section_code LIKE '%-SEC-SEM%'
  AND cs.semester_id <= 4
  AND NOT EXISTS (
      SELECT 1 FROM enrollments e2 
      JOIN course_sections cs2 ON e2.section_id = cs2.id 
      WHERE e2.student_id = s.id AND cs2.subject_id = cs.subject_id
  );

-- 5. Bổ sung ghi danh cho Khóa 18 (Semesters 1..2)
INSERT INTO enrollments (student_id, section_id, status, enrollment_type, attendance_status)
SELECT s.id, cs.id, 'COMPLETED', 'FIRST_TIME', 'QUALIFIED'
FROM students s
JOIN classes c ON s.class_id = c.id
CROSS JOIN course_sections cs
WHERE c.cohort_id = 3
  AND cs.section_code LIKE '%-SEC-SEM%'
  AND cs.semester_id <= 2
  AND NOT EXISTS (
      SELECT 1 FROM enrollments e2 
      JOIN course_sections cs2 ON e2.section_id = cs2.id 
      WHERE e2.student_id = s.id AND cs2.subject_id = cs.subject_id
  );

-- 6. Tạo điểm tổng kết (finalized grades) đầy đủ điểm quá trình & thi cho toàn bộ các ghi danh mới
INSERT INTO grades (enrollment_id, cc1_score, cc2_score, midterm_score, final_score, total_score, letter_grade, gpa_point, is_finalized, finalized_at, special_grade)
SELECT 
    e.id,
    sim.cc1,
    sim.cc2,
    sim.mid,
    sim.final,
    sim.total,
    CASE 
        WHEN sim.total >= 8.50 AND sim.final >= 3.00 THEN 'A'
        WHEN sim.total >= 8.00 AND sim.final >= 3.00 THEN 'B+'
        WHEN sim.total >= 7.00 AND sim.final >= 3.00 THEN 'B'
        WHEN sim.total >= 6.50 AND sim.final >= 3.00 THEN 'C+'
        WHEN sim.total >= 5.50 AND sim.final >= 3.00 THEN 'C'
        WHEN sim.total >= 5.00 AND sim.final >= 3.00 THEN 'D+'
        WHEN sim.total >= 4.00 AND sim.final >= 3.00 THEN 'D'
        ELSE 'F'
    END,
    CASE 
        WHEN sim.total >= 8.50 AND sim.final >= 3.00 THEN 4.00
        WHEN sim.total >= 8.00 AND sim.final >= 3.00 THEN 3.50
        WHEN sim.total >= 7.00 AND sim.final >= 3.00 THEN 3.00
        WHEN sim.total >= 6.50 AND sim.final >= 3.00 THEN 2.50
        WHEN sim.total >= 5.50 AND sim.final >= 3.00 THEN 2.00
        WHEN sim.total >= 5.00 AND sim.final >= 3.00 THEN 1.50
        WHEN sim.total >= 4.00 AND sim.final >= 3.00 THEN 1.00
        ELSE 0.00
    END,
    1,
    CONCAT(sem.end_date, ' 17:00:00'),
    'NONE'
FROM enrollments e
JOIN course_sections cs ON e.section_id = cs.id
JOIN semesters sem ON cs.semester_id = sem.id
CROSS JOIN LATERAL (
    SELECT 
        CASE 
            WHEN ((e.id + cs.subject_id) % 5) = 0 THEN 9.00
            WHEN ((e.id + cs.subject_id) % 5) = 1 THEN 9.50
            ELSE 10.00
        END AS cc1,
        CASE 
            WHEN ((e.id + cs.subject_id * 3) % 4) = 0 THEN 8.50
            WHEN ((e.id + cs.subject_id * 3) % 4) = 1 THEN 9.00
            WHEN ((e.id + cs.subject_id * 3) % 4) = 2 THEN 9.50
            ELSE 10.00
        END AS cc2,
        ROUND(7.5 + ((e.id * 13 + cs.subject_id * 7 + e.student_id) % 22) * 0.1, 1) AS mid,
        ROUND(7.6 + ((e.id * 19 + cs.subject_id * 11 + e.student_id) % 23) * 0.1, 1) AS final,
        ROUND(
            (CASE WHEN ((e.id + cs.subject_id) % 5) = 0 THEN 9.00 WHEN ((e.id + cs.subject_id) % 5) = 1 THEN 9.50 ELSE 10.00 END) * 0.05 +
            (CASE WHEN ((e.id + cs.subject_id * 3) % 4) = 0 THEN 8.50 WHEN ((e.id + cs.subject_id * 3) % 4) = 1 THEN 9.00 WHEN ((e.id + cs.subject_id * 3) % 4) = 2 THEN 9.50 ELSE 10.00 END) * 0.05 +
            (ROUND(7.5 + ((e.id * 13 + cs.subject_id * 7 + e.student_id) % 22) * 0.1, 1)) * 0.30 +
            (ROUND(7.6 + ((e.id * 19 + cs.subject_id * 11 + e.student_id) % 23) * 0.1, 1)) * 0.60
        , 2) AS total
) sim
WHERE cs.section_code LIKE '%-SEC-SEM%'
  AND NOT EXISTS (SELECT 1 FROM grades g WHERE g.enrollment_id = e.id);

-- 7. Cập nhật published_at cho các lớp học phần kỳ trước
UPDATE course_sections cs
JOIN semesters sem ON cs.semester_id = sem.id
SET cs.published_at = CONCAT(sem.end_date, ' 17:00:00')
WHERE cs.section_code LIKE '%-SEC-SEM%' AND cs.published_at IS NULL;
