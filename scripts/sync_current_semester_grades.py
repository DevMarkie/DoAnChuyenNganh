# -*- coding: utf-8 -*-
"""
Script dong bo du lieu diem hoc ky hien tai (HK1-2026) theo tien do thuc te tuan 10 (08/11/2026).
- 100% lop hoc phan da co diem CC1
- ~90% lop hoc phan da co diem CC2
- ~85% lop hoc phan da cham xong va co diem Giua ky (Midterm)
- Diem cuoi ky (Final) va Tong ket giu NULL (chua thi)
- Phan bo diem theo chi so nang luc hoc tap (ability) cua tung sinh vien
"""

import sys
import random
import subprocess
from collections import defaultdict

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

RANDOM_SEED = 2026
random.seed(RANDOM_SEED)

def run_mysql_query(sql):
    cmd = [
        "docker", "exec", "-i", "student_management_db",
        "mysql", "-uroot", "--default-character-set=utf8mb4", "-B", "-N", "student_management"
    ]
    p = subprocess.run(cmd, input=sql, encoding="utf-8", errors="replace", capture_output=True)
    if p.returncode != 0:
        raise RuntimeError(f"MySQL Query Error: {p.stderr}")
    return p.stdout.strip()

def run_mysql_execute(sql):
    cmd = [
        "docker", "exec", "-i", "student_management_db",
        "mysql", "-uroot", "--default-character-set=utf8mb4", "student_management"
    ]
    p = subprocess.run(cmd, input=sql, encoding="utf-8", errors="replace", capture_output=True)
    if p.returncode != 0:
        raise RuntimeError(f"MySQL Execute Error: {p.stderr}")

def main():
    print("==================================================================")
    print("  DONG BO DU LIEU DIEM HK1-2026 THEO TIEN DO HE THONG (08/11/2026)")
    print("==================================================================")

    # 1. Lay thong tin hoc ky hien tai
    print("\n[1/5] Kiem tra hoc ky hien hanh...")
    sem_info = run_mysql_query("SELECT id, semester_code, semester_name, start_date, end_date FROM semesters WHERE is_current = 1 LIMIT 1;")
    if not sem_info:
        print("ERROR: Khong tim thay hoc ky is_current = 1!")
        return
    
    parts = sem_info.split("\t")
    sem_id = int(parts[0])
    sem_code = parts[1]
    sem_name = parts[2]
    sem_start = parts[3]
    sem_end = parts[4]
    print(f"  -> Hoc ky: {sem_code} (ID: {sem_id}) - {sem_name}")
    print(f"  -> Thoi gian: {sem_start} den {sem_end}")

    # 2. Lay danh sach cac lop hoc phan cua HK1-2026
    print("\n[2/5] Phan bo tien do nhap diem theo lop hoc phan...")
    raw_sections = run_mysql_query(f"SELECT id FROM course_sections WHERE semester_id = {sem_id} ORDER BY id;")
    section_ids = [int(line.strip()) for line in raw_sections.split("\n") if line.strip()]
    total_sections = len(section_ids)
    print(f"  -> Tong so lop hoc phan trong ky: {total_sections}")

    # Xao tron danh sach de chon ngau nhien lop co CC2 va Midterm theo ty le
    shuffled_sec = list(section_ids)
    random.shuffle(shuffled_sec)

    cc1_count = total_sections  # 100%
    cc2_count = int(round(total_sections * 0.90))  # ~90%
    mid_count = int(round(total_sections * 0.85))  # ~85%

    cc1_sections = set(shuffled_sec)
    cc2_sections = set(shuffled_sec[:cc2_count])
    # Lop co Midterm duoc uu tien nam trong so cac lop da co CC2
    midterm_sections = set(shuffled_sec[:mid_count])

    print(f"  -> So lop da co CC1: {len(cc1_sections)}/{total_sections} (100%)")
    print(f"  -> So lop da co CC2: {len(cc2_sections)}/{total_sections} ({len(cc2_sections)*100/total_sections:.1f}%)")
    print(f"  -> So lop da co Midterm: {len(midterm_sections)}/{total_sections} ({len(midterm_sections)*100/total_sections:.1f}%)")

    # 3. Trich xuat nang luc hoc tap (ability) cua tung sinh vien
    print("\n[3/5] Tinh toan chi so nang luc hoc thuat (ability) cua sinh vien...")
    raw_history = run_mysql_query(f"""
        SELECT e.student_id, AVG(g.total_score)
        FROM grades g
        JOIN enrollments e ON g.enrollment_id = e.id
        JOIN course_sections cs ON e.section_id = cs.id
        WHERE cs.semester_id < {sem_id} AND g.total_score IS NOT NULL
        GROUP BY e.student_id;
    """)
    student_abilities = {}
    if raw_history:
        for line in raw_history.split("\n"):
            line = line.strip()
            if not line:
                continue
            s_id, avg_score = line.split("\t")
            student_abilities[int(s_id)] = float(avg_score)

    print(f"  -> Sinh vien co lich su diem cac ky truoc: {len(student_abilities)}")

    # 4. Lay danh sach grades can cap nhat trong HK1-2026
    print("\n[4/5] Doc du lieu diem HK1-2026 tu database...")
    raw_grades = run_mysql_query(f"""
        SELECT g.id, e.student_id, cs.id
        FROM grades g
        JOIN enrollments e ON g.enrollment_id = e.id
        JOIN course_sections cs ON e.section_id = cs.id
        WHERE cs.semester_id = {sem_id}
        ORDER BY g.id;
    """)
    grade_rows = []
    for line in raw_grades.split("\n"):
        line = line.strip()
        if not line:
            continue
        g_id, st_id, sec_id = line.split("\t")
        grade_rows.append((int(g_id), int(st_id), int(sec_id)))

    print(f"  -> Tong so ban ghi diem can dong bo: {len(grade_rows)}")

    # Sinh diem cho tung ban ghi
    updates = []
    sample_midterms = []
    
    # Cache ability cho sinh vien chua co lich su (K19) de nhat quan giua cac mon cung ky
    k19_abilities = {}

    for g_id, st_id, sec_id in grade_rows:
        if st_id in student_abilities:
            ability = student_abilities[st_id]
        else:
            if st_id not in k19_abilities:
                ab = round(random.gauss(7.0, 1.25), 2)
                ab = max(2.5, min(9.8, ab))
                k19_abilities[st_id] = ab
            ability = k19_abilities[st_id]

        # CC1 (100% lop)
        cc1 = round(min(10.0, max(5.0, ability + random.gauss(0.5, 0.4))), 1)

        # CC2 (~90% lop)
        if sec_id in cc2_sections:
            cc2 = round(min(10.0, max(5.0, ability + random.gauss(0.4, 0.4))), 1)
        else:
            cc2 = None

        # Midterm (~85% lop)
        if sec_id in midterm_sections:
            mid = round(min(10.0, max(1.0, ability + random.gauss(0.0, 0.8))), 1)
            sample_midterms.append(mid)
        else:
            mid = None

        updates.append((g_id, cc1, cc2, mid))

    # Thuc hien cap nhat theo batch 500 ban ghi
    print("\n[5/5] Dang thuc thi batch UPDATE vao MySQL...")
    batch_size = 500
    for i in range(0, len(updates), batch_size):
        chunk = updates[i:i + batch_size]
        
        # Xay dung cau lenh UPDATE su dung CASE WHEN
        case_cc1 = []
        case_cc2 = []
        case_mid = []
        ids = []

        for g_id, cc1, cc2, mid in chunk:
            ids.append(str(g_id))
            case_cc1.append(f"WHEN {g_id} THEN {cc1}")
            case_cc2.append(f"WHEN {g_id} THEN {cc2}" if cc2 is not None else f"WHEN {g_id} THEN NULL")
            case_mid.append(f"WHEN {g_id} THEN {mid}" if mid is not None else f"WHEN {g_id} THEN NULL")

        id_list = ",".join(ids)
        sql = f"""
            UPDATE grades
            SET cc1_score = CASE id {" ".join(case_cc1)} END,
                cc2_score = CASE id {" ".join(case_cc2)} END,
                midterm_score = CASE id {" ".join(case_mid)} END,
                final_score = NULL,
                total_score = NULL,
                letter_grade = NULL,
                gpa_point = NULL,
                is_finalized = 0,
                finalized_at = NULL,
                special_grade = 'NONE'
            WHERE id IN ({id_list});
        """
        run_mysql_execute(sql)
        print(f"  -> Da cap nhat {min(i + batch_size, len(updates))}/{len(updates)} ban ghi...")

    print("\n==================================================================")
    print("  KET QUA THONG KE SAU KHI DONG BO DIEM HK1-2026")
    print("==================================================================")
    stats = run_mysql_query(f"""
        SELECT
            count(g.id) as total_grades,
            sum(case when g.cc1_score is not null then 1 else 0 end) as has_cc1,
            sum(case when g.cc2_score is not null then 1 else 0 end) as has_cc2,
            sum(case when g.midterm_score is not null then 1 else 0 end) as has_midterm,
            sum(case when g.final_score is not null then 1 else 0 end) as has_final,
            sum(case when g.is_finalized = 1 then 1 else 0 end) as is_finalized_cnt
        FROM grades g
        JOIN enrollments e ON g.enrollment_id = e.id
        JOIN course_sections cs ON e.section_id = cs.id
        WHERE cs.semester_id = {sem_id};
    """)
    s_parts = stats.split("\t")
    print(f"  * Tong so diem HK1-2026:   {s_parts[0]}")
    print(f"  * Co diem CC1:             {s_parts[1]} ({int(s_parts[1])*100/int(s_parts[0]):.1f}%)")
    print(f"  * Co diem CC2:             {s_parts[2]} ({int(s_parts[2])*100/int(s_parts[0]):.1f}%)")
    print(f"  * Co diem Giua ky:         {s_parts[3]} ({int(s_parts[3])*100/int(s_parts[0]):.1f}%)")
    print(f"  * Co diem Cuoi ky:         {s_parts[4]} (Chua thi)")
    print(f"  * Da chot diem (finalized):{s_parts[5]} (Dang hoc)")

    if sample_midterms:
        avg_mid = sum(sample_midterms) / len(sample_midterms)
        fail_mid = sum(1 for m in sample_midterms if m < 4.0)
        print(f"  * Diem Giua ky trung binh: {avg_mid:.2f}")
        print(f"  * Diem Giua ky < 4.0:      {fail_mid} ({fail_mid*100/len(sample_midterms):.1f}%)")

    print("\nDONG BO HOAN TAT THANH CONG!")

if __name__ == "__main__":
    main()
