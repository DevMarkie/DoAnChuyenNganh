# -*- coding: utf-8 -*-
import subprocess

sql = """
USE student_management;

CREATE OR REPLACE VIEW v_student_transcript AS
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

CREATE OR REPLACE VIEW v_student_gpa AS
WITH best_grades AS (
    SELECT
        e.student_id,
        cs.subject_id,
        sub.credits,
        MAX(g.gpa_point) AS best_gpa_point
    FROM enrollments e
        JOIN grades g ON g.enrollment_id = e.id AND g.is_finalized = TRUE
        JOIN course_sections cs ON e.section_id = cs.id
        JOIN subjects sub ON cs.subject_id = sub.id
    WHERE e.status != 'CANCELLED'
      AND g.gpa_point IS NOT NULL
    GROUP BY e.student_id, cs.subject_id, sub.credits
)
SELECT
    s.id                                                                               AS student_id,
    s.student_code,
    s.full_name,
    COUNT(CASE WHEN bg.best_gpa_point >= 1.0 THEN 1 END)                              AS completed_courses,
    COALESCE(SUM(CASE WHEN bg.best_gpa_point >= 1.0 THEN bg.credits ELSE 0 END), 0)    AS total_credits,
    ROUND(
        COALESCE(
            SUM(bg.best_gpa_point * bg.credits) / NULLIF(SUM(bg.credits), 0),
            0.00
        ),
        2
    )                                                                                  AS cumulative_gpa
FROM students s
    LEFT JOIN best_grades bg ON bg.student_id = s.id
GROUP BY s.id, s.student_code, s.full_name;
"""

cmd = ["docker", "exec", "-i", "student_management_db", "mysql", "-uroot", "--default-character-set=utf8mb4", "student_management"]
p = subprocess.run(cmd, input=sql.encode("utf-8"), capture_output=True)
if p.returncode == 0:
    print("SUCCESS: Views v_student_transcript and v_student_gpa created successfully!")
else:
    print(f"Error: {p.stderr.decode('utf-8', errors='replace')}")
