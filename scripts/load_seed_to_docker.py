"""
Database Loader and Verifier for Docker MySQL
Loads database/seed.sql into student_management_db with clean table truncations.
"""

import sys
import subprocess
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

TRUNCATE_SQL = """
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE exam_rosters;
TRUNCATE TABLE exam_rooms;
TRUNCATE TABLE exam_sessions;
TRUNCATE TABLE grade_audit_logs;
TRUNCATE TABLE grade_appeals;
TRUNCATE TABLE grades;
TRUNCATE TABLE student_invoices;
TRUNCATE TABLE attendance_records;
TRUNCATE TABLE attendance_sessions;
TRUNCATE TABLE schedules;
TRUNCATE TABLE enrollments;
TRUNCATE TABLE course_sections;
TRUNCATE TABLE registration_waves;
TRUNCATE TABLE student_training_points;
TRUNCATE TABLE conduct_scores;
TRUNCATE TABLE notifications;
TRUNCATE TABLE student_achievements_disciplines;
TRUNCATE TABLE student_service_requests;
TRUNCATE TABLE graduation_records;
TRUNCATE TABLE academic_exceptions;
TRUNCATE TABLE academic_summaries;
TRUNCATE TABLE students;
TRUNCATE TABLE lecturers;
TRUNCATE TABLE classes;
TRUNCATE TABLE curriculum_block_subjects;
TRUNCATE TABLE curriculum_blocks;
TRUNCATE TABLE curriculum_programs;
TRUNCATE TABLE subject_prerequisites;
TRUNCATE TABLE subjects;
TRUNCATE TABLE fee_scale_rules;
TRUNCATE TABLE semesters;
TRUNCATE TABLE cohorts;
TRUNCATE TABLE majors;
TRUNCATE TABLE departments;
TRUNCATE TABLE users;
TRUNCATE TABLE roles;
SET FOREIGN_KEY_CHECKS = 1;
"""

def run_mysql(sql_bytes):
    cmd = [
        "docker", "exec", "-i", "student_management_db",
        "mysql", "--default-character-set=utf8mb4", "-usms_app", "-psms_dev_pw", "student_management"
    ]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = p.communicate(sql_bytes)
    return p.returncode, stdout.decode('utf-8', errors='replace'), stderr.decode('utf-8', errors='replace')

def main():
    print("=" * 60)
    print("STEP 1: TRUNCATING TABLES IN student_management_db")
    print("=" * 60)
    ret, out, err = run_mysql(TRUNCATE_SQL.encode('utf-8'))
    if ret != 0:
        print("Truncate Error:", err)
        sys.exit(1)
    print("[OK] All tables truncated cleanly.")

    print("=" * 60)
    print("STEP 2: LOADING database/seed.sql (5.8MB)...")
    print("=" * 60)
    start_time = time.time()
    with open("database/seed.sql", "rb") as f:
        seed_bytes = f.read()

    ret, out, err = run_mysql(seed_bytes)
    if ret != 0:
        print("Seed Import Error:", err)
        sys.exit(1)
    elapsed = time.time() - start_time
    print(f"[OK] Seed imported successfully in {elapsed:.2f} seconds!")

    print("=" * 60)
    print("STEP 3: RUNNING VERIFICATION QUERIES")
    print("=" * 60)
    VERIFY_SQL = """
    SELECT 'departments' AS tbl, count(*) AS count FROM departments
    UNION ALL SELECT 'majors', count(*) FROM majors
    UNION ALL SELECT 'cohorts', count(*) FROM cohorts
    UNION ALL SELECT 'classes', count(*) FROM classes
    UNION ALL SELECT 'users', count(*) FROM users
    UNION ALL SELECT 'lecturers', count(*) FROM lecturers
    UNION ALL SELECT 'students', count(*) FROM students
    UNION ALL SELECT 'subjects', count(*) FROM subjects
    UNION ALL SELECT 'subject_prerequisites', count(*) FROM subject_prerequisites
    UNION ALL SELECT 'curriculum_programs', count(*) FROM curriculum_programs
    UNION ALL SELECT 'curriculum_blocks', count(*) FROM curriculum_blocks
    UNION ALL SELECT 'curriculum_block_subjects', count(*) FROM curriculum_block_subjects
    UNION ALL SELECT 'semesters', count(*) FROM semesters
    UNION ALL SELECT 'course_sections', count(*) FROM course_sections
    UNION ALL SELECT 'enrollments', count(*) FROM enrollments
    UNION ALL SELECT 'grades', count(*) FROM grades
    UNION ALL SELECT 'student_invoices', count(*) FROM student_invoices
    UNION ALL SELECT 'exam_sessions', count(*) FROM exam_sessions
    UNION ALL SELECT 'exam_rosters', count(*) FROM exam_rosters
    UNION ALL SELECT 'student_training_points', count(*) FROM student_training_points;
    """
    ret, out, err = run_mysql(VERIFY_SQL.encode('utf-8'))
    if ret != 0:
        print("Verify Error:", err)
    else:
        print(out)

    print("=" * 60)
    print("VERIFICATION COMPLETED!")
    print("=" * 60)

if __name__ == "__main__":
    main()
