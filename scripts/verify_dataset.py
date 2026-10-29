# -*- coding: utf-8 -*-
"""
Verification script for 3,000 students dataset
"""
import sys
import subprocess

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def run_query(sql):
    cmd = ["docker", "exec", "-i", "student_management_db", "mysql", "-uroot", "-N", "--default-character-set=utf8mb4", "-e", sql, "student_management"]
    p = subprocess.run(cmd, capture_output=True)
    if p.returncode != 0:
        err = p.stderr.decode("utf-8", errors="replace")
        print(f"Query error: {err}")
        return ""
    return p.stdout.decode("utf-8", errors="replace").strip()

print("--- 1. ROW COUNTS ---")
tables = [
    "departments", "majors", "cohorts", "classes", "users", "lecturers",
    "students", "subjects", "subject_prerequisites", "curriculum_programs",
    "curriculum_blocks", "curriculum_block_subjects", "semesters",
    "course_sections", "schedules", "enrollments", "grades", "student_invoices",
    "exam_sessions", "exam_rooms", "exam_rosters", "conduct_scores", "system_configs"
]

for t in tables:
    cnt = run_query(f"SELECT COUNT(*) FROM {t};")
    print(f"  {t:26s}: {cnt}")

print("\n--- 2. STUDENTS PER COHORT ---")
res = run_query("""
SELECT c.code, c.name, COUNT(s.id) as student_count
FROM cohorts c
JOIN classes cl ON cl.cohort_id = c.id
JOIN students s ON s.class_id = cl.id
GROUP BY c.code, c.name, c.id
ORDER BY c.id;
""")
print(res)

print("\n--- 3. GRADE DISTRIBUTION (PHỔ ĐIỂM HỌC KỲ QUÁ KHỨ) ---")
res = run_query("""
SELECT 
    g.letter_grade,
    COUNT(*) as total_grades,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM grades WHERE is_finalized = 1), 2) as pct
FROM grades g
WHERE g.is_finalized = 1
GROUP BY g.letter_grade
ORDER BY FIELD(g.letter_grade, 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F');
""")
print(res)

print("\n--- 4. GPA & ACCUMULATED CREDITS PER COHORT (VIEW v_student_gpa) ---")
res = run_query("""
SELECT 
    c.code AS cohort,
    COUNT(DISTINCT v.student_id) as num_students,
    ROUND(AVG(v.total_credits), 1) as avg_credits,
    MIN(v.total_credits) as min_credits,
    MAX(v.total_credits) as max_credits,
    ROUND(AVG(v.cumulative_gpa), 2) as avg_gpa,
    MIN(v.cumulative_gpa) as min_gpa,
    MAX(v.cumulative_gpa) as max_gpa
FROM v_student_gpa v
JOIN students s ON s.id = v.student_id
JOIN classes cl ON s.class_id = cl.id
JOIN cohorts c ON cl.cohort_id = c.id
GROUP BY c.code, c.id
ORDER BY c.id;
""")
print(res)

print("\n--- 5. ACTIVE SEMESTER (HK1-2026) STATUS ---")
res = run_query("""
SELECT 
    cs.status,
    COUNT(DISTINCT cs.id) as total_sections,
    COUNT(e.id) as total_enrollments
FROM course_sections cs
JOIN enrollments e ON e.section_id = cs.id
WHERE cs.semester_id = 5
GROUP BY cs.status;
""")
print(res)
