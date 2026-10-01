USE student_management;

ALTER TABLE grades DROP CHECK ck_grades_attendance;

ALTER TABLE grades CHANGE attendance_score cc1_score DECIMAL(4,2) COMMENT 'Điểm chuyên cần (0-10), trọng số 5%';
ALTER TABLE grades ADD COLUMN cc2_score DECIMAL(4,2) COMMENT 'Điểm bài tập/phát biểu (0-10), trọng số 5%' AFTER cc1_score;
ALTER TABLE grades ADD CONSTRAINT ck_grades_cc1 CHECK (cc1_score IS NULL OR (cc1_score >= 0 AND cc1_score <= 10));
ALTER TABLE grades ADD CONSTRAINT ck_grades_cc2 CHECK (cc2_score IS NULL OR (cc2_score >= 0 AND cc2_score <= 10));

DROP VIEW v_student_transcript;
CREATE VIEW v_student_transcript AS
SELECT
    s.id              AS student_id,
    s.student_code,
    s.full_name       AS student_name,
    cl.name           AS class_name,
    sem.id            AS semester_id,
    sem.semester_name,
    sem.academic_year,
    sub.subject_code,
    sub.subject_name,
    sub.credits,
    g.cc1_score,
    g.cc2_score,
    g.midterm_score,
    g.final_score,
    g.total_score,
    g.letter_grade,
    g.gpa_point,
    g.is_finalized,
    e.status          AS enrollment_status
FROM students s
    JOIN classes cl ON s.class_id = cl.id
    JOIN enrollments e ON e.student_id = s.id
    JOIN course_sections cs ON e.section_id = cs.id
    JOIN subjects sub ON cs.subject_id = sub.id
    JOIN semesters sem ON cs.semester_id = sem.id
    LEFT JOIN grades g ON g.enrollment_id = e.id
WHERE e.status != 'CANCELLED';
