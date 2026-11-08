import pymysql
import random

# Database connection
conn = pymysql.connect(
    host='127.0.0.1',
    port=3308,
    user='sms_app',
    password='sms_dev_pw',
    database='student_management',
    cursorclass=pymysql.cursors.DictCursor
)

try:
    with conn.cursor() as cur:
        # Check student 11
        cur.execute("""
            SELECT s.id, s.student_code, s.full_name, c.major_id, c.cohort_id, p.id AS program_id, p.total_credits
            FROM students s
            JOIN classes c ON s.class_id = c.id
            JOIN curriculum_programs p ON c.major_id = p.major_id AND c.cohort_id = p.cohort_id
            WHERE s.id = 11;
        """)
        student11 = cur.fetchone()
        print("Student 11 info:", student11)

        # Get subjects already passed or enrolled for student 11
        cur.execute("""
            SELECT DISTINCT sec.subject_id
            FROM enrollments e
            JOIN course_sections sec ON e.section_id = sec.id
            WHERE e.student_id = 11;
        """)
        taken_subject_ids = {row['subject_id'] for row in cur.fetchall()}
        print(f"Student 11 currently taken/enrolled in {len(taken_subject_ids)} subjects.")

        # Get all subjects in student 11's program blocks
        cur.execute("""
            SELECT DISTINCT cbs.subject_id, s.subject_code, s.subject_name, s.credits, cb.code AS block_code
            FROM curriculum_blocks cb
            JOIN curriculum_block_subjects cbs ON cb.id = cbs.block_id
            JOIN subjects s ON cbs.subject_id = s.id
            WHERE cb.program_id = %s
            ORDER BY cb.display_order, s.id;
        """, (student11['program_id'],))
        all_program_subjects = cur.fetchall()
        print(f"Total available subjects in program blocks: {len(all_program_subjects)}")

        available_to_add = [s for s in all_program_subjects if s['subject_id'] not in taken_subject_ids and s['subject_id'] not in [262, 34]] # Exclude capstone
        print(f"Subjects available to add: {len(available_to_add)}")

        # Target: Add ~44 credits so 67 + 44 = 111 credits
        cur.execute("""
            SELECT SUM(s.credits) as curr_credits
            FROM grades g
            JOIN enrollments e ON g.enrollment_id = e.id
            JOIN course_sections sec ON e.section_id = sec.id
            JOIN subjects s ON sec.subject_id = s.id
            WHERE e.student_id = 11 AND g.is_finalized = 1 AND g.gpa_point >= 1.0;
        """)
        curr_credits = cur.fetchone()['curr_credits'] or 0
        print(f"Current passed credits: {curr_credits}")

        target_credits = 111
        needed = target_credits - curr_credits
        print(f"Needed credits to reach {target_credits}: {needed}")

        chosen_subjects = []
        acc = 0
        for s in available_to_add:
            if acc + s['credits'] <= needed:
                chosen_subjects.append(s)
                acc += s['credits']
            if acc >= needed:
                break
        
        print(f"Selected {len(chosen_subjects)} subjects totaling {acc} credits:")
        for s in chosen_subjects:
            print(f"  - [{s['block_code']}] {s['subject_code']} - {s['subject_name']} ({s['credits']} TC)")

finally:
    conn.close()
