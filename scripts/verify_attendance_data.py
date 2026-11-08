# -*- coding: utf-8 -*-
"""
Verification Script for Attendance Data & Cross-Cutting Rule Engine Consistency.
"""

import subprocess
import json

def run_query(sql):
    cmd = [
        "docker", "exec", "-i", "student_management_db",
        "mysql", "-uroot", "--default-character-set=utf8mb4", "-e", sql
    ]
    p = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if p.returncode != 0:
        print(f"SQL Error: {p.stderr}")
        return None
    return p.stdout.strip()

print("=" * 60)
print("SMS ATTENDANCE DATA VERIFICATION REPORT")
print("=" * 60)

print("\n1. Attendance Sessions Overview:")
print(run_query("""
SELECT 
    status, 
    COUNT(*) as total_sessions, 
    MIN(session_date) as earliest_date, 
    MAX(session_date) as latest_date
FROM student_management.attendance_sessions
GROUP BY status;
"""))

print("\n2. Attendance Sessions on Today (2026-11-08):")
print(run_query("""
SELECT id, section_id, session_date, attendance_keyword, status, expires_at
FROM student_management.attendance_sessions
WHERE session_date = '2026-11-08'
LIMIT 10;
"""))

print("\n3. Attendance Records Overview:")
print(run_query("""
SELECT 
    COUNT(*) as total_records,
    SUM(CASE WHEN is_present = 1 THEN 1 ELSE 0 END) as present_count,
    SUM(CASE WHEN is_present = 0 THEN 1 ELSE 0 END) as absent_count,
    ROUND(SUM(CASE WHEN is_present = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as present_rate_pct
FROM student_management.attendance_records;
"""))

print("\n4. Enrollments Attendance Status Distribution:")
print(run_query("""
SELECT 
    attendance_status,
    COUNT(*) as total_enrollments,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM student_management.enrollments), 2) as pct
FROM student_management.enrollments
GROUP BY attendance_status;
"""))

print("\n5. Cross-Cutting Rule Engine Verification:")
print("A. Are any DISQUALIFIED students in exam_rosters? (Should be 0):")
print(run_query("""
SELECT COUNT(*) as disqualified_in_exam_rosters
FROM student_management.exam_rosters er
JOIN student_management.enrollments e ON er.enrollment_id = e.id
WHERE e.attendance_status = 'DISQUALIFIED';
"""))

print("B. Do DISQUALIFIED students have grade F and CC1 = 0 in completed semesters? (Violations should be 0):")
print(run_query("""
SELECT COUNT(*) as disqualified_grade_violations
FROM student_management.grades g
JOIN student_management.enrollments e ON g.enrollment_id = e.id
JOIN student_management.course_sections cs ON e.section_id = cs.id
WHERE e.attendance_status = 'DISQUALIFIED'
  AND cs.semester_id <= 6
  AND (g.letter_grade != 'F' OR g.cc1_score != 0.0);
"""))

print("C. Warning notifications generated for DISQUALIFIED students:")
print(run_query("""
SELECT 
    type,
    COUNT(*) as total_notifs,
    SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_count,
    SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) as read_count
FROM student_management.notifications
GROUP BY type;
"""))

print("\n6. Sample CC1 Scores vs Absence Count for QUALIFIED students:")
print(run_query("""
SELECT 
    g.cc1_score,
    COUNT(*) as count
FROM student_management.grades g
JOIN student_management.enrollments e ON g.enrollment_id = e.id
WHERE e.attendance_status = 'QUALIFIED'
GROUP BY g.cc1_score
ORDER BY g.cc1_score DESC
LIMIT 10;
"""))

print("\n" + "=" * 60)
print("VERIFICATION COMPLETED")
print("=" * 60)
