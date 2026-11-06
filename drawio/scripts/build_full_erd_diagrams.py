# -*- coding: utf-8 -*-
"""
Academic ERD (Entity Relationship Diagrams) Generator for SMS System.
OMG UML / IDEF1X Academic Monochrome High-Contrast (Clean Black & White with subtle modern accents).
Generates drawio/ERD_Diagrams.drawio with 8 dedicated tabs:
  1. ERD_01_TongQuan: Sơ đồ ERD Tổng quan Thực thể Cốt lõi (17 thực thể trọng tâm, 4 tầng bố cục luồng không cắt ngang)
  2. ERD_02_HeThong_NguoiDung: Phân hệ 1 - Hệ thống, Người dùng & Phân quyền (6 bảng)
  3. ERD_03_CoCau_KhungCTDT: Phân hệ 2 - Cơ cấu Học thuật & Khung CTĐT (9 bảng)
  4. ERD_04_HoSo_RenLuyen: Phân hệ 3 - Hồ sơ Người học & Rèn luyện (6 bảng)
  5. ERD_05_LopHocPhan_TKB: Phân hệ 4 - Lớp học phần & Xếp lịch (5 bảng)
  6. ERD_06_DangKy_DiemSo: Phân hệ 5 - Đăng ký tín chỉ & Sổ điểm (5 bảng)
  7. ERD_07_TaiChinh_HocPhi: Phân hệ 6 - Tài chính & Quản lý Thu học phí (4 bảng)
  8. ERD_08_KhaoThi_TotNghiep: Phân hệ 7 - Khảo thí, Kiểm toán & Tốt nghiệp (6 bảng)
"""

import os
import sys
import xml.etree.ElementTree as ET
import xml.dom.minidom as minidom

sys.stdout.reconfigure(encoding='utf-8')

def make_table_html(name, cols):
    """
    Render a single self-contained HTML table for Draw.io mxCell.
    Avoids childLayout=stackLayout overlapping text bugs completely.
    """
    h = '<table style="width:100%; border-collapse:collapse; font-family:Arial,Helvetica,sans-serif; font-size:11px; margin:0; padding:0;">'
    h += (
        f'<tr style="background:#0f172a; color:#ffffff; height:26px;">'
        f'<td colspan="2" align="center" style="font-weight:bold; font-size:12px; letter-spacing:0.5px;">{name.upper()}</td>'
        f'</tr>'
    )
    for cname, ctype, ckey in cols:
        bg = '#eff6ff' if 'PK' in ckey else '#ffffff'
        if 'PK' in ckey:
            k_str = f' <b style="color:#2563eb;">[{ckey}]</b>'
            name_style = 'font-weight:bold; color:#0f172a;'
        elif 'FK' in ckey:
            k_str = f' <i style="color:#d97706;">[{ckey}]</i>'
            name_style = 'font-style:italic; color:#334155;'
        else:
            k_str = ''
            name_style = 'color:#475569;'
            
        border = 'border-top:1px solid #e2e8f0;'
        h += (
            f'<tr style="background:{bg}; height:21px; {border}">'
            f'<td style="padding:2px 8px; text-align:left; {name_style}">+ {cname}</td>'
            f'<td style="padding:2px 8px; text-align:right; color:#64748b; font-size:10px;">{ctype}{k_str}</td>'
            f'</tr>'
        )
    h += '</table>'
    return h

def create_model(w=1650, h=1180):
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': str(w), 'pageHeight': str(h),
        'background': '#ffffff', 'math': '0', 'shadow': '0'
    })
    root = ET.SubElement(model, 'root')
    ET.SubElement(root, 'mxCell', {'id': '0'})
    ET.SubElement(root, 'mxCell', {'id': '1', 'parent': '0'})
    return model, root

def add_header(root, title, subtitle, x=50, y=25):
    t_cell = ET.SubElement(root, 'mxCell', {
        'id': 'header_title',
        'value': title,
        'style': 'text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontStyle=1;fontSize=15;fontFamily=Arial,Helvetica,sans-serif;fontColor=#0f172a;',
        'vertex': '1', 'parent': '1'
    })
    ET.SubElement(t_cell, 'mxGeometry', {'x': str(x), 'y': str(y), 'width': '1200', 'height': '26', 'as': 'geometry'})
    
    s_cell = ET.SubElement(root, 'mxCell', {
        'id': 'header_sub',
        'value': subtitle,
        'style': 'text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontStyle=0;fontSize=11;fontFamily=Arial,Helvetica,sans-serif;fontColor=#64748b;',
        'vertex': '1', 'parent': '1'
    })
    ET.SubElement(s_cell, 'mxGeometry', {'x': str(x), 'y': str(y + 24), 'width': '1200', 'height': '20', 'as': 'geometry'})

def add_table(root, tid, name, cols, x, y, w=240):
    h = 26 + len(cols) * 21
    cell = ET.SubElement(root, 'mxCell', {
        'id': tid,
        'value': make_table_html(name, cols),
        'style': 'rounded=1;arcSize=4;strokeColor=#334155;strokeWidth=1.5;fillColor=#ffffff;html=1;overflow=hidden;whiteSpace=wrap;',
        'vertex': '1',
        'parent': '1'
    })
    ET.SubElement(cell, 'mxGeometry', {'x': str(x), 'y': str(y), 'width': str(w), 'height': str(h), 'as': 'geometry'})
    return h

def add_edge(root, eid, source, target, label='1 - N', exit_p=None, entry_p=None, waypoints=None, is_1_1=False):
    style = (
        'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;'
        'strokeColor=#0f172a;strokeWidth=1.5;fontColor=#0f172a;fontSize=10;fontStyle=1;'
    )
    if is_1_1:
        style += 'endArrow=ERmandOne;endFill=0;startArrow=ERmandOne;startFill=0;'
    else:
        style += 'endArrow=ERmany;endFill=0;startArrow=ERmandOne;startFill=0;'
        
    if exit_p:
        style += f'exitX={exit_p[0]};exitY={exit_p[1]};exitDx=0;exitDy=0;'
    if entry_p:
        style += f'entryX={entry_p[0]};entryY={entry_p[1]};entryDx=0;entryDy=0;'
        
    cell = ET.SubElement(root, 'mxCell', {
        'id': eid,
        'value': label,
        'style': style,
        'edge': '1',
        'parent': '1',
        'source': source,
        'target': target
    })
    geom = ET.SubElement(cell, 'mxGeometry', {'relative': '1', 'as': 'geometry'})
    if waypoints:
        arr = ET.SubElement(geom, 'Array', {'as': 'points'})
        for px, py in waypoints:
            ET.SubElement(arr, 'mxPoint', {'x': str(px), 'y': str(py)})

# ==============================================================================
# TAB 1: Sơ đồ ERD Tổng quan Thực thể Cốt lõi (17 bảng, 4 tầng bố cục luồng)
# ==============================================================================
def build_erd_01_overview():
    model, root = create_model(w=1620, h=1180)
    add_header(
        root,
        "SƠ ĐỒ THỰC THỂ QUAN HỆ CSDL TỔNG QUAN (CORE CONCEPTUAL & RELATIONAL ERD)",
        "Mô hình hóa 17 thực thể cốt lõi, quan hệ tương tác trung tâm và chuẩn hóa toàn vẹn dữ liệu hệ thống SMS"
    )
    
    # Tier 1 (y = 90)
    add_table(root, 'roles', 'roles', [
        ('id', 'INT', 'PK'), ('name', 'VARCHAR(50)', 'UQ'), ('description', 'VARCHAR(255)', '')
    ], 50, 90, 220)
    
    add_table(root, 'users', 'users', [
        ('id', 'BIGINT', 'PK'), ('username', 'VARCHAR(50)', 'UQ'), ('email', 'VARCHAR(100)', 'UQ'),
        ('role_id', 'INT', 'FK'), ('department_id', 'BIGINT', 'FK'), ('full_name', 'VARCHAR(100)', ''),
        ('date_of_birth', 'DATE', ''), ('is_active', 'BOOLEAN', ''), ('must_change_password', 'BOOLEAN', '')
    ], 340, 90, 250)
    
    add_table(root, 'departments', 'departments', [
        ('id', 'BIGINT', 'PK'), ('department_code', 'VARCHAR(20)', 'UQ'),
        ('department_name', 'VARCHAR(100)', ''), ('contact_email', 'VARCHAR(100)', '')
    ], 660, 90, 240)
    
    add_table(root, 'cohorts', 'cohorts', [
        ('id', 'BIGINT', 'PK'), ('cohort_code', 'VARCHAR(20)', 'UQ'),
        ('start_year', 'INT', ''), ('end_year', 'INT', ''), ('is_active', 'BOOLEAN', '')
    ], 970, 90, 220)
    
    add_table(root, 'semesters', 'semesters', [
        ('id', 'BIGINT', 'PK'), ('semester_code', 'VARCHAR(20)', 'UQ'),
        ('academic_year', 'VARCHAR(20)', ''), ('is_current', 'BOOLEAN', ''), ('registration_open', 'BOOLEAN', '')
    ], 1270, 90, 240)
    
    # Tier 2 (y = 340)
    add_table(root, 'lecturers', 'lecturers', [
        ('id', 'BIGINT', 'PK'), ('user_id', 'BIGINT', 'FK/UQ'), ('department_id', 'BIGINT', 'FK'),
        ('lecturer_code', 'VARCHAR(20)', 'UQ'), ('full_name', 'VARCHAR(100)', ''), ('degree', 'VARCHAR(50)', '')
    ], 340, 340, 250)
    
    add_table(root, 'majors', 'majors', [
        ('id', 'BIGINT', 'PK'), ('department_id', 'BIGINT', 'FK'), ('major_code', 'VARCHAR(20)', 'UQ'),
        ('major_name', 'VARCHAR(100)', ''), ('total_credits_required', 'INT', '')
    ], 660, 340, 240)
    
    add_table(root, 'curriculum_programs', 'curriculum_programs', [
        ('id', 'BIGINT', 'PK'), ('major_id', 'BIGINT', 'FK'), ('cohort_id', 'BIGINT', 'FK'),
        ('program_name', 'VARCHAR(150)', ''), ('total_credits', 'INT', '')
    ], 970, 340, 230)
    
    add_table(root, 'subjects', 'subjects', [
        ('id', 'BIGINT', 'PK'), ('department_id', 'BIGINT', 'FK'), ('subject_code', 'VARCHAR(20)', 'UQ'),
        ('subject_name', 'VARCHAR(150)', ''), ('credits', 'INT', ''), ('version', 'INT', '')
    ], 1270, 340, 240)
    
    # Tier 3 (y = 580)
    add_table(root, 'students', 'students', [
        ('id', 'BIGINT', 'PK'), ('user_id', 'BIGINT', 'FK/UQ'), ('class_id', 'BIGINT', 'FK'),
        ('student_code', 'VARCHAR(20)', 'UQ'), ('full_name', 'VARCHAR(100)', ''),
        ('status', 'VARCHAR(30)', ''), ('has_financial_hold', 'BOOLEAN', '')
    ], 50, 580, 250)
    
    add_table(root, 'classes', 'classes', [
        ('id', 'BIGINT', 'PK'), ('major_id', 'BIGINT', 'FK'), ('cohort_id', 'BIGINT', 'FK'),
        ('class_code', 'VARCHAR(20)', 'UQ'), ('class_name', 'VARCHAR(100)', '')
    ], 360, 580, 230)
    
    add_table(root, 'course_sections', 'course_sections', [
        ('id', 'BIGINT', 'PK'), ('subject_id', 'BIGINT', 'FK'), ('lecturer_id', 'BIGINT', 'FK'),
        ('semester_id', 'BIGINT', 'FK'), ('section_code', 'VARCHAR(30)', 'UQ'),
        ('max_capacity', 'INT', ''), ('enrolled_count', 'INT', ''), ('status', 'VARCHAR(20)', ''),
        ('version', 'INT', '')
    ], 970, 580, 250)
    
    add_table(root, 'schedules', 'schedules', [
        ('id', 'BIGINT', 'PK'), ('section_id', 'BIGINT', 'FK'), ('day_of_week', 'INT', ''),
        ('start_period', 'INT', ''), ('end_period', 'INT', ''), ('room', 'VARCHAR(50)', ''),
        ('version', 'INT', '')
    ], 1280, 580, 230)
    
    # Tier 4 (y = 880)
    add_table(root, 'student_invoices', 'student_invoices', [
        ('id', 'BIGINT', 'PK'), ('student_id', 'BIGINT', 'FK'), ('semester_id', 'BIGINT', 'FK'),
        ('total_amount', 'DECIMAL', ''), ('paid_amount', 'DECIMAL', ''), ('status', 'VARCHAR(20)', '')
    ], 50, 880, 250)
    
    add_table(root, 'enrollments', 'enrollments', [
        ('id', 'BIGINT', 'PK'), ('student_id', 'BIGINT', 'FK'), ('section_id', 'BIGINT', 'FK'),
        ('enrollment_type', 'VARCHAR(20)', ''), ('status', 'VARCHAR(20)', ''), ('registered_at', 'DATETIME', '')
    ], 360, 880, 250)
    
    add_table(root, 'grades', 'grades', [
        ('id', 'BIGINT', 'PK'), ('enrollment_id', 'BIGINT', 'FK/UQ'), ('score_cc1', 'DECIMAL', ''),
        ('score_cc2', 'DECIMAL', ''), ('score_midterm', 'DECIMAL', ''), ('score_final', 'DECIMAL', ''),
        ('score_overall', 'DECIMAL', ''), ('grade_letter', 'VARCHAR(5)', ''), ('is_finalized', 'BOOLEAN', '')
    ], 680, 880, 250)
    
    add_table(root, 'exam_sessions', 'exam_sessions', [
        ('id', 'BIGINT', 'PK'), ('semester_id', 'BIGINT', 'FK'), ('subject_id', 'BIGINT', 'FK'),
        ('exam_date', 'DATE', ''), ('shift', 'INT', ''), ('exam_format', 'VARCHAR(50)', '')
    ], 1080, 880, 240)
    
    # EDGES
    # 1. roles -> users
    add_edge(root, 'e_roles_users', 'roles', 'users', '1 - N', exit_p=(1, 0.5), entry_p=(0, 0.35))
    
    # 1b. departments -> users (1 - N: Cán bộ/Giáo vụ phụ trách Khoa)
    add_edge(root, 'e_dept_users', 'departments', 'users', '1 - N (khoa)', exit_p=(0, 0.25), entry_p=(1, 0.25))
    
    # 2. users -> lecturers (1:1)
    add_edge(root, 'e_users_lecturers', 'users', 'lecturers', '1 - 1', exit_p=(0.5, 1), entry_p=(0.5, 0), is_1_1=True)
    
    # 3. users -> students (1:1) via left corridor x=175
    add_edge(root, 'e_users_students', 'users', 'students', '1 - 1', exit_p=(0, 0.7), entry_p=(0.5, 0),
             waypoints=[(175, 196), (175, 530)], is_1_1=True)
             
    # 4. departments -> majors
    add_edge(root, 'e_dept_majors', 'departments', 'majors', '1 - N', exit_p=(0.5, 1), entry_p=(0.5, 0))
    
    # 5. departments -> lecturers via corridor x=625
    add_edge(root, 'e_dept_lecturers', 'departments', 'lecturers', '1 - N', exit_p=(0, 0.5), entry_p=(1, 0.25),
             waypoints=[(625, 145), (625, 378)])
             
    # 6. departments -> subjects via corridor y=280
    add_edge(root, 'e_dept_subjects', 'departments', 'subjects', '1 - N', exit_p=(1, 0.5), entry_p=(0, 0.3),
             waypoints=[(935, 145), (935, 280), (1240, 280), (1240, 380)])
             
    # 7. majors -> curriculum_programs
    add_edge(root, 'e_majors_cp', 'majors', 'curriculum_programs', '1 - N', exit_p=(1, 0.5), entry_p=(0, 0.5))
    
    # 8. cohorts -> curriculum_programs
    add_edge(root, 'e_cohorts_cp', 'cohorts', 'curriculum_programs', '1 - N', exit_p=(0.5, 1), entry_p=(0.5, 0))
    
    # 9. majors -> classes via corridor y=530
    add_edge(root, 'e_majors_classes', 'majors', 'classes', '1 - N', exit_p=(0.3, 1), entry_p=(0.5, 0),
             waypoints=[(732, 471), (732, 530), (475, 530)])
             
    # 10. cohorts -> classes via corridor x=935, y=510
    add_edge(root, 'e_cohorts_classes', 'cohorts', 'classes', '1 - N', exit_p=(0, 0.6), entry_p=(0.74, 0),
             waypoints=[(935, 168), (935, 510), (530, 510)])
             
    # 11. classes -> students
    add_edge(root, 'e_classes_students', 'classes', 'students', '1 - N', exit_p=(0, 0.5), entry_p=(1, 0.38))
    
    # 12. lecturers -> course_sections via corridor x=625, y=540, x=940
    add_edge(root, 'e_lect_sections', 'lecturers', 'course_sections', '1 - N', exit_p=(1, 0.7), entry_p=(0, 0.25),
             waypoints=[(625, 446), (625, 540), (940, 540), (940, 628)])
             
    # 13. subjects -> course_sections via corridor y=530
    add_edge(root, 'e_subj_sections', 'subjects', 'course_sections', '1 - N', exit_p=(0, 0.7), entry_p=(0.72, 0),
             waypoints=[(1235, 431), (1235, 530), (1150, 530)])
             
    # 14. semesters -> course_sections via corridor x=1220, y=550
    add_edge(root, 'e_sem_sections', 'semesters', 'course_sections', '1 - N', exit_p=(0, 0.6), entry_p=(0.5, 0),
             waypoints=[(1220, 156), (1220, 550), (1095, 550)])
             
    # 15. course_sections -> schedules
    add_edge(root, 'e_sections_sched', 'course_sections', 'schedules', '1 - N', exit_p=(1, 0.45), entry_p=(0, 0.45))
    
    # 16. students -> student_invoices
    add_edge(root, 'e_stud_invoices', 'students', 'student_invoices', '1 - N', exit_p=(0.4, 1), entry_p=(0.4, 0))
    
    # 17. students -> enrollments via corridor y=820
    add_edge(root, 'e_stud_enroll', 'students', 'enrollments', '1 - N', exit_p=(0.8, 1), entry_p=(0.28, 0),
             waypoints=[(250, 753), (250, 820), (430, 820)])
             
    # 18. course_sections -> enrollments via corridor y=840
    add_edge(root, 'e_sec_enroll', 'course_sections', 'enrollments', '1 - N', exit_p=(0.3, 1), entry_p=(0.76, 0),
             waypoints=[(1045, 774), (1045, 840), (550, 840)])
             
    # 19. enrollments -> grades (1:1)
    add_edge(root, 'e_enroll_grades', 'enrollments', 'grades', '1 - 1', exit_p=(1, 0.5), entry_p=(0, 0.35), is_1_1=True)
    
    # 20. semesters -> exam_sessions via right margin corridor x=1550
    add_edge(root, 'e_sem_exams', 'semesters', 'exam_sessions', '1 - N', exit_p=(1, 0.5), entry_p=(0.67, 0),
             waypoints=[(1550, 145), (1550, 820), (1240, 820)])
             
    # 21. subjects -> exam_sessions via right margin corridor x=1530
    add_edge(root, 'e_subj_exams', 'subjects', 'exam_sessions', '1 - N', exit_p=(1, 0.5), entry_p=(0.33, 0),
             waypoints=[(1530, 405), (1530, 840), (1160, 840)])
             
    return model

# ==============================================================================
# TAB 2: Phân hệ 1 - Hệ thống, Người dùng & Phân quyền (6 bảng)
# ==============================================================================
def build_erd_02_system_users():
    model, root = create_model(w=1400, h=950)
    add_header(
        root,
        "PHÂN HỆ 1: HỆ THỐNG, NGƯỜI DÙNG & PHÂN QUYỀN (6 BẢNG)",
        "Đặc tả cấu trúc bảng xác thực tài khoản, kiểm soát phiên JWT, phân quyền RBAC và kiểm toán hệ thống"
    )
    
    add_table(root, 'roles', 'roles', [
        ('id', 'INT', 'PK'), ('name', 'VARCHAR(50)', 'UQ'), ('description', 'VARCHAR(255)', '')
    ], 80, 120, 260)
    
    add_table(root, 'users', 'users', [
        ('id', 'BIGINT', 'PK'), ('username', 'VARCHAR(50)', 'UQ'), ('password_hash', 'VARCHAR(255)', ''),
        ('email', 'VARCHAR(100)', 'UQ'), ('role_id', 'INT', 'FK'), ('department_id', 'BIGINT', 'FK'),
        ('full_name', 'VARCHAR(100)', ''),
        ('date_of_birth', 'DATE', ''), ('is_active', 'BOOLEAN', ''),
        ('must_change_password', 'BOOLEAN', ''), ('created_at', 'DATETIME', ''), ('updated_at', 'DATETIME', '')
    ], 440, 120, 280)
    
    add_table(root, 'password_reset_requests', 'password_reset_requests', [
        ('id', 'BIGINT', 'PK'), ('user_id', 'BIGINT', 'FK'), ('reason', 'TEXT', ''),
        ('status', 'VARCHAR(20)', ''), ('reviewed_by', 'BIGINT', 'FK'), ('reviewed_at', 'DATETIME', ''),
        ('admin_note', 'VARCHAR(255)', ''), ('created_at', 'DATETIME', '')
    ], 800, 120, 280)
    
    add_table(root, 'system_configs', 'system_configs', [
        ('id', 'BIGINT', 'PK'), ('config_key', 'VARCHAR(100)', 'UQ'), ('config_value', 'TEXT', ''),
        ('description', 'VARCHAR(255)', ''), ('created_at', 'DATETIME', ''), ('updated_at', 'DATETIME', '')
    ], 80, 480, 280)
    
    add_table(root, 'audit_logs', 'audit_logs', [
        ('id', 'BIGINT', 'PK'), ('user_id', 'BIGINT', 'FK'), ('username', 'VARCHAR(50)', ''),
        ('role', 'VARCHAR(30)', ''), ('action', 'VARCHAR(100)', ''), ('module', 'VARCHAR(50)', ''),
        ('ip_address', 'VARCHAR(45)', ''), ('created_at', 'DATETIME', '')
    ], 440, 480, 280)
    
    add_table(root, 'backup_histories', 'backup_histories', [
        ('id', 'BIGINT', 'PK'), ('file_name', 'VARCHAR(255)', ''), ('file_path', 'VARCHAR(500)', ''),
        ('file_size_bytes', 'BIGINT', ''), ('record_count', 'INT', ''), ('status', 'VARCHAR(30)', ''),
        ('triggered_by', 'BIGINT', 'FK'), ('created_at', 'DATETIME', '')
    ], 800, 480, 280)
    
    add_edge(root, 'e_r_u', 'roles', 'users', '1 - N (role_id)', exit_p=(1, 0.4), entry_p=(0, 0.4))
    add_edge(root, 'e_u_prr', 'users', 'password_reset_requests', '1 - N (user_id)', exit_p=(1, 0.4), entry_p=(0, 0.4))
    add_edge(root, 'e_u_al', 'users', 'audit_logs', '1 - N (user_id)', exit_p=(0.5, 1), entry_p=(0.5, 0))
    add_edge(root, 'e_u_bh', 'users', 'backup_histories', '1 - N (triggered_by)', exit_p=(0.8, 1), entry_p=(0.5, 0),
             waypoints=[(664, 420), (940, 420)])
    add_edge(root, 'e_u_sc', 'users', 'system_configs', '1 - N (thiết lập cấu hình)', exit_p=(0.2, 1), entry_p=(0.5, 0),
             waypoints=[(496, 420), (220, 420)])
             
    return model

# ==============================================================================
# TAB 3: Phân hệ 2 - Cơ cấu Học thuật & Khung CTĐT (9 bảng)
# ==============================================================================
def build_erd_03_academic_curriculum():
    model, root = create_model(w=1500, h=1050)
    add_header(
        root,
        "PHÂN HỆ 2: CƠ CẤU HỌC THUẬT & KHUNG CHƯƠNG TRÌNH ĐÀO TẠO (9 BẢNG)",
        "Đặc tả cấu trúc tổ chức Khoa, Ngành, Khóa tuyển sinh, Lớp sinh hoạt và Cây đồ thị Khung CTĐT"
    )
    
    # Row 1 (y=110)
    add_table(root, 'departments', 'departments', [
        ('id', 'BIGINT', 'PK'), ('department_code', 'VARCHAR(20)', 'UQ'), ('department_name', 'VARCHAR(100)', ''),
        ('office_location', 'VARCHAR(100)', ''), ('contact_email', 'VARCHAR(100)', '')
    ], 60, 110, 240)
    
    add_table(root, 'majors', 'majors', [
        ('id', 'BIGINT', 'PK'), ('department_id', 'BIGINT', 'FK'), ('major_code', 'VARCHAR(20)', 'UQ'),
        ('major_name', 'VARCHAR(100)', ''), ('total_credits_required', 'INT', '')
    ], 380, 110, 250)
    
    add_table(root, 'cohorts', 'cohorts', [
        ('id', 'BIGINT', 'PK'), ('cohort_code', 'VARCHAR(20)', 'UQ'), ('start_year', 'INT', ''),
        ('end_year', 'INT', ''), ('is_active', 'BOOLEAN', '')
    ], 710, 110, 230)
    
    add_table(root, 'curriculum_programs', 'curriculum_programs', [
        ('id', 'BIGINT', 'PK'), ('major_id', 'BIGINT', 'FK'), ('cohort_id', 'BIGINT', 'FK'),
        ('program_name', 'VARCHAR(150)', ''), ('total_credits', 'INT', '')
    ], 1020, 110, 250)
    
    # Row 2 (y=420)
    add_table(root, 'subjects', 'subjects', [
        ('id', 'BIGINT', 'PK'), ('department_id', 'BIGINT', 'FK'), ('subject_code', 'VARCHAR(20)', 'UQ'),
        ('subject_name', 'VARCHAR(150)', ''), ('credits', 'INT', ''), ('lecture_hours', 'INT', ''),
        ('lab_hours', 'INT', ''), ('version', 'INT', '')
    ], 60, 420, 250)
    
    add_table(root, 'classes', 'classes', [
        ('id', 'BIGINT', 'PK'), ('major_id', 'BIGINT', 'FK'), ('cohort_id', 'BIGINT', 'FK'),
        ('class_code', 'VARCHAR(20)', 'UQ'), ('class_name', 'VARCHAR(100)', '')
    ], 380, 420, 250)
    
    add_table(root, 'curriculum_blocks', 'curriculum_blocks', [
        ('id', 'BIGINT', 'PK'), ('program_id', 'BIGINT', 'FK'), ('block_code', 'VARCHAR(30)', ''),
        ('block_name', 'VARCHAR(100)', ''), ('block_type', 'VARCHAR(20)', ''), ('min_credits', 'INT', '')
    ], 1020, 420, 250)
    
    # Row 3 (y=740)
    add_table(root, 'subject_prerequisites', 'subject_prerequisites', [
        ('subject_id', 'BIGINT', 'PK/FK'), ('prerequisite_id', 'BIGINT', 'PK/FK'),
        ('prerequisite_type', 'VARCHAR(20)', '')
    ], 60, 740, 250)
    
    add_table(root, 'curriculum_block_subjects', 'curriculum_block_subjects', [
        ('block_id', 'BIGINT', 'PK/FK'), ('subject_id', 'BIGINT', 'PK/FK'),
        ('is_compulsory', 'BOOLEAN', ''), ('recommended_semester', 'INT', '')
    ], 710, 740, 260)
    
    # Edges
    add_edge(root, 'e_d_m', 'departments', 'majors', '1 - N', exit_p=(1, 0.4), entry_p=(0, 0.4))
    add_edge(root, 'e_d_s', 'departments', 'subjects', '1 - N', exit_p=(0.5, 1), entry_p=(0.5, 0))
    add_edge(root, 'e_m_cl', 'majors', 'classes', '1 - N', exit_p=(0.5, 1), entry_p=(0.5, 0))
    add_edge(root, 'e_c_cl', 'cohorts', 'classes', '1 - N', exit_p=(0.3, 1), entry_p=(0.5, 0),
             waypoints=[(779, 320), (505, 320)])
    add_edge(root, 'e_m_cp', 'majors', 'curriculum_programs', '1 - N', exit_p=(0.5, 0), entry_p=(0.4, 0),
             waypoints=[(505, 75), (1120, 75)])
    add_edge(root, 'e_c_cp', 'cohorts', 'curriculum_programs', '1 - N', exit_p=(1, 0.5), entry_p=(0, 0.5))
    add_edge(root, 'e_cp_cb', 'curriculum_programs', 'curriculum_blocks', '1 - N', exit_p=(0.5, 1), entry_p=(0.5, 0))
    add_edge(root, 'e_s_sp', 'subjects', 'subject_prerequisites', '1 - N (DAG)', exit_p=(0.5, 1), entry_p=(0.5, 0))
    add_edge(root, 'e_cb_cbs', 'curriculum_blocks', 'curriculum_block_subjects', '1 - N', exit_p=(0.4, 1), entry_p=(0.7, 0),
             waypoints=[(1120, 680), (892, 680)])
    add_edge(root, 'e_s_cbs', 'subjects', 'curriculum_block_subjects', '1 - N', exit_p=(0.8, 1), entry_p=(0, 0.5),
             waypoints=[(260, 660), (670, 660), (670, 780)])
             
    return model

# ==============================================================================
# TAB 4: Phân hệ 3 - Hồ sơ Người học & Rèn luyện (6 bảng)
# ==============================================================================
def build_erd_04_students_conduct():
    model, root = create_model(w=1400, h=950)
    add_header(
        root,
        "PHÂN HỆ 3: HỒ SƠ NGƯỜI HỌC, GIẢNG VIÊN, ĐIỂM RÈN LUYỆN & HỌC VỤ (6 BẢNG)",
        "Quản lý hồ sơ nhân thân sinh viên, giảng viên, điểm rèn luyện định kỳ, khen thưởng/kỷ luật và tổng kết học vụ GPA/CPA"
    )
    
    add_table(root, 'students', 'students', [
        ('id', 'BIGINT', 'PK'), ('user_id', 'BIGINT', 'FK/UQ'), ('class_id', 'BIGINT', 'FK'),
        ('student_code', 'VARCHAR(20)', 'UQ'), ('full_name', 'VARCHAR(100)', ''),
        ('dob', 'DATE', ''), ('gender', 'VARCHAR(10)', ''), ('phone', 'VARCHAR(20)', ''),
        ('status', 'VARCHAR(30)', ''), ('has_financial_hold', 'BOOLEAN', '')
    ], 60, 110, 270)
    
    add_table(root, 'lecturers', 'lecturers', [
        ('id', 'BIGINT', 'PK'), ('user_id', 'BIGINT', 'FK/UQ'), ('department_id', 'BIGINT', 'FK'),
        ('lecturer_code', 'VARCHAR(20)', 'UQ'), ('full_name', 'VARCHAR(100)', ''),
        ('degree', 'VARCHAR(50)', ''), ('specialization', 'VARCHAR(100)', '')
    ], 410, 110, 270)
    
    add_table(root, 'student_achievements_disciplines', 'student_achievements_disciplines', [
        ('id', 'BIGINT', 'PK'), ('student_id', 'BIGINT', 'FK'), ('type', 'VARCHAR(20)', ''),
        ('decision_number', 'VARCHAR(50)', ''), ('decision_date', 'DATE', ''),
        ('title', 'VARCHAR(200)', ''), ('description', 'TEXT', '')
    ], 760, 110, 290)
    
    add_table(root, 'student_training_points', 'student_training_points', [
        ('id', 'BIGINT', 'PK'), ('student_id', 'BIGINT', 'FK'), ('semester_id', 'BIGINT', 'FK'),
        ('total_points', 'INT', ''), ('rating', 'VARCHAR(30)', ''), ('status', 'VARCHAR(20)', '')
    ], 60, 520, 270)
    
    add_table(root, 'conduct_scores', 'conduct_scores', [
        ('id', 'BIGINT', 'PK'), ('student_id', 'BIGINT', 'FK'), ('semester_id', 'BIGINT', 'FK'),
        ('score', 'INT', ''), ('classification', 'VARCHAR(30)', ''), ('note', 'TEXT', '')
    ], 410, 520, 270)
    
    add_table(root, 'academic_summaries', 'academic_summaries', [
        ('id', 'BIGINT', 'PK'), ('student_id', 'BIGINT', 'FK'), ('semester_id', 'INT', 'FK'),
        ('semester_gpa', 'DECIMAL(4,2)', ''), ('cumulative_cpa', 'DECIMAL(4,2)', ''),
        ('semester_credits', 'INT', ''), ('accumulated_credits', 'INT', ''),
        ('debt_credits', 'INT', ''), ('warning_level', 'INT', ''), ('max_allowed_credits', 'INT', '')
    ], 760, 520, 290)
    
    # Edges
    add_edge(root, 'e_st_ach', 'students', 'student_achievements_disciplines', '1 - N', exit_p=(1, 0.2), entry_p=(0, 0.4),
             waypoints=[(360, 150), (360, 80), (720, 80), (720, 150)])
    add_edge(root, 'e_st_stp', 'students', 'student_training_points', '1 - N', exit_p=(0.5, 1), entry_p=(0.5, 0))
    add_edge(root, 'e_st_cs', 'students', 'conduct_scores', '1 - N', exit_p=(0.8, 1), entry_p=(0.2, 0),
             waypoints=[(276, 440), (464, 440)])
    add_edge(root, 'e_lec_cs', 'lecturers', 'conduct_scores', '1 - N (CVHT thẩm định)', exit_p=(0.5, 1), entry_p=(0.5, 0))
    add_edge(root, 'e_st_as', 'students', 'academic_summaries', '1 - N (tổng kết học kỳ)', exit_p=(0.9, 1), entry_p=(0.5, 0),
             waypoints=[(303, 460), (905, 460)])
             
    return model

# ==============================================================================
# TAB 5: Phân hệ 4 - Lớp học phần & Xếp lịch (4 bảng)
# ==============================================================================
def build_erd_05_sections_schedules():
    model, root = create_model(w=1400, h=900)
    add_header(
        root,
        "PHÂN HỆ 4: LỚP HỌC PHẦN, ĐỢT ĐĂNG KÝ & XẾP LỊCH HỌC (4 BẢNG)",
        "Tổ chức lớp học phần theo học kỳ, phân luồng đợt đăng ký tín chỉ (Registration Waves) và xếp phòng học ma trận"
    )
    
    add_table(root, 'semesters', 'semesters', [
        ('id', 'BIGINT', 'PK'), ('semester_code', 'VARCHAR(20)', 'UQ'), ('semester_name', 'VARCHAR(100)', ''),
        ('academic_year', 'VARCHAR(20)', ''), ('start_date', 'DATE', ''), ('end_date', 'DATE', ''),
        ('is_current', 'BOOLEAN', ''), ('registration_open', 'BOOLEAN', '')
    ], 80, 120, 260)
    
    add_table(root, 'registration_waves', 'registration_waves', [
        ('id', 'BIGINT', 'PK'), ('semester_id', 'BIGINT', 'FK'), ('wave_name', 'VARCHAR(100)', ''),
        ('target_cohort_id', 'BIGINT', 'FK'), ('start_time', 'DATETIME', ''), ('end_time', 'DATETIME', ''),
        ('is_active', 'BOOLEAN', '')
    ], 430, 120, 270)
    
    add_table(root, 'course_sections', 'course_sections', [
        ('id', 'BIGINT', 'PK'), ('subject_id', 'BIGINT', 'FK'), ('lecturer_id', 'BIGINT', 'FK'),
        ('semester_id', 'BIGINT', 'FK'), ('section_code', 'VARCHAR(30)', 'UQ'),
        ('max_capacity', 'INT', ''), ('enrolled_count', 'INT', ''), ('status', 'VARCHAR(20)', ''),
        ('version', 'INT', '')
    ], 780, 120, 280)
    
    add_table(root, 'schedules', 'schedules', [
        ('id', 'BIGINT', 'PK'), ('section_id', 'BIGINT', 'FK'), ('day_of_week', 'INT', ''),
        ('start_period', 'INT', ''), ('end_period', 'INT', ''), ('room', 'VARCHAR(50)', ''),
        ('building', 'VARCHAR(50)', ''), ('version', 'INT', '')
    ], 780, 480, 280)
    
    # Edges
    add_edge(root, 'e_sem_rw', 'semesters', 'registration_waves', '1 - N', exit_p=(1, 0.4), entry_p=(0, 0.4))
    add_edge(root, 'e_sem_cs', 'semesters', 'course_sections', '1 - N', exit_p=(1, 0.2), entry_p=(0, 0.2),
             waypoints=[(380, 160), (380, 80), (740, 80), (740, 160)])
    add_edge(root, 'e_cs_sch', 'course_sections', 'schedules', '1 - N', exit_p=(0.5, 1), entry_p=(0.5, 0))
    
    return model

# ==============================================================================
# TAB 6: Phân hệ 5 - Đăng ký tín chỉ & Sổ điểm (5 bảng)
# ==============================================================================
def build_erd_06_enrollments_grades():
    model, root = create_model(w=1400, h=950)
    add_header(
        root,
        "PHÂN HỆ 5: ĐĂNG KÝ HỌC PHẦN, SỔ ĐIỂM & ĐIỂM DANH LỚP HỌC (5 BẢNG)",
        "Kiểm soát lượt đăng ký tín chỉ (khóa bi quan), tính toán điểm học phần thang 10/4/chữ và điểm danh trực tiếp PIN 6 số"
    )
    
    add_table(root, 'enrollments', 'enrollments', [
        ('id', 'BIGINT', 'PK'), ('student_id', 'BIGINT', 'FK'), ('section_id', 'BIGINT', 'FK'),
        ('enrollment_type', 'VARCHAR(20)', ''), ('status', 'VARCHAR(20)', ''), ('registered_at', 'DATETIME', '')
    ], 80, 120, 260)
    
    add_table(root, 'grades', 'grades', [
        ('id', 'BIGINT', 'PK'), ('enrollment_id', 'BIGINT', 'FK/UQ'), ('score_cc1', 'DECIMAL(4,2)', ''),
        ('score_cc2', 'DECIMAL(4,2)', ''), ('score_midterm', 'DECIMAL(4,2)', ''),
        ('score_final', 'DECIMAL(4,2)', ''), ('score_overall', 'DECIMAL(4,2)', ''),
        ('grade_letter', 'VARCHAR(5)', ''), ('gpa_4', 'DECIMAL(3,2)', ''),
        ('is_finalized', 'BOOLEAN', ''), ('finalized_at', 'DATETIME', '')
    ], 430, 120, 270)
    
    add_table(root, 'grade_appeals', 'grade_appeals', [
        ('id', 'BIGINT', 'PK'), ('enrollment_id', 'BIGINT', 'FK'), ('student_id', 'BIGINT', 'FK'),
        ('target_component', 'VARCHAR(20)', ''), ('reason', 'TEXT', ''), ('status', 'VARCHAR(20)', ''),
        ('proposed_score', 'DECIMAL(4,2)', ''), ('final_score', 'DECIMAL(4,2)', ''), ('response_note', 'TEXT', '')
    ], 780, 120, 290)
    
    add_table(root, 'attendance_sessions', 'attendance_sessions', [
        ('id', 'BIGINT', 'PK'), ('section_id', 'BIGINT', 'FK'), ('session_date', 'DATE', ''),
        ('pin_code', 'VARCHAR(10)', ''), ('pin_expires_at', 'DATETIME', ''), ('is_closed', 'BOOLEAN', '')
    ], 80, 520, 260)
    
    add_table(root, 'attendance_records', 'attendance_records', [
        ('id', 'BIGINT', 'PK'), ('session_id', 'BIGINT', 'FK'), ('student_id', 'BIGINT', 'FK'),
        ('status', 'VARCHAR(20)', ''), ('check_in_time', 'DATETIME', '')
    ], 430, 520, 270)
    
    # Edges
    add_edge(root, 'e_enr_gr', 'enrollments', 'grades', '1 - 1', exit_p=(1, 0.4), entry_p=(0, 0.4), is_1_1=True)
    add_edge(root, 'e_enr_app', 'enrollments', 'grade_appeals', '1 - N', exit_p=(1, 0.2), entry_p=(0, 0.2),
             waypoints=[(380, 150), (380, 80), (740, 80), (740, 150)])
    add_edge(root, 'e_enr_att_rec', 'enrollments', 'attendance_records', '1 - N (chấm công ca học)', exit_p=(0.5, 1), entry_p=(0.3, 0),
             waypoints=[(210, 420), (511, 420)])
    add_edge(root, 'e_att_rec', 'attendance_sessions', 'attendance_records', '1 - N', exit_p=(1, 0.4), entry_p=(0, 0.4))
    
    return model

# ==============================================================================
# TAB 7: Phân hệ 6 - Tài chính & Thu học phí (3 bảng)
# ==============================================================================
def build_erd_07_tuition_finance():
    model, root = create_model(w=1350, h=850)
    add_header(
        root,
        "PHÂN HỆ 6: TÀI CHÍNH, ĐỊNH MỨC & THU HỌC PHÍ TÍN CHỈ (3 BẢNG)",
        "Tính toán học phí theo tín chỉ lý thuyết/thực hành, xuất hóa đơn công nợ và thông báo tài chính trực tuyến"
    )
    
    add_table(root, 'fee_scale_rules', 'fee_scale_rules', [
        ('id', 'BIGINT', 'PK'), ('academic_year', 'VARCHAR(20)', ''),
        ('fee_per_credit_theory', 'DECIMAL(12,2)', ''), ('fee_per_credit_practice', 'DECIMAL(12,2)', ''),
        ('fee_multiplier_retake', 'DECIMAL(4,2)', '')
    ], 120, 150, 300)
    
    add_table(root, 'student_invoices', 'student_invoices', [
        ('id', 'BIGINT', 'PK'), ('student_id', 'BIGINT', 'FK'), ('semester_id', 'BIGINT', 'FK'),
        ('total_amount', 'DECIMAL(12,2)', ''), ('discount_amount', 'DECIMAL(12,2)', ''),
        ('paid_amount', 'DECIMAL(12,2)', ''), ('status', 'VARCHAR(20)', ''),
        ('receipt_code', 'VARCHAR(50)', 'UQ'), ('payment_date', 'DATETIME', '')
    ], 580, 150, 310)
    
    add_table(root, 'notifications', 'notifications', [
        ('id', 'BIGINT', 'PK'), ('user_id', 'BIGINT', 'FK'), ('title', 'VARCHAR(150)', ''),
        ('message', 'TEXT', ''), ('type', 'VARCHAR(30)', ''), ('is_read', 'BOOLEAN', ''),
        ('created_at', 'DATETIME', '')
    ], 580, 480, 310)
    
    # Edges
    add_edge(root, 'e_fsr_inv', 'fee_scale_rules', 'student_invoices', 'áp dụng định mức', exit_p=(1, 0.4), entry_p=(0, 0.4))
    add_edge(root, 'e_inv_notif', 'student_invoices', 'notifications', '1 - N (thông báo công nợ)', exit_p=(0.5, 1), entry_p=(0.5, 0))
    
    return model

# ==============================================================================
# TAB 8: Phân hệ 7 - Khảo thí, Kiểm toán & Tốt nghiệp (6 bảng)
# ==============================================================================
def build_erd_08_exams_graduation():
    model, root = create_model(w=1450, h=950)
    add_header(
        root,
        "PHÂN HỆ 7: KHẢO THÍ, ĐÍNH CHÍNH ĐIỂM & XÉT TỐT NGHIỆP TT08 (6 BẢNG)",
        "Tự động chia phòng thi đánh SBD, quy trình sửa điểm 3 cấp với nhật ký kiểm toán bất biến và thẩm định tốt nghiệp"
    )
    
    add_table(root, 'exam_sessions', 'exam_sessions', [
        ('id', 'BIGINT', 'PK'), ('semester_id', 'BIGINT', 'FK'), ('subject_id', 'BIGINT', 'FK'),
        ('exam_date', 'DATE', ''), ('shift', 'INT', ''), ('exam_format', 'VARCHAR(50)', ''),
        ('status', 'VARCHAR(20)', '')
    ], 80, 120, 270)
    
    add_table(root, 'exam_rooms', 'exam_rooms', [
        ('id', 'BIGINT', 'PK'), ('session_id', 'BIGINT', 'FK'), ('room_code', 'VARCHAR(50)', ''),
        ('room_location', 'VARCHAR(100)', ''), ('capacity', 'INT', ''), ('status', 'VARCHAR(20)', '')
    ], 430, 120, 270)
    
    add_table(root, 'exam_rosters', 'exam_rosters', [
        ('id', 'BIGINT', 'PK'), ('exam_room_id', 'BIGINT', 'FK'), ('student_id', 'BIGINT', 'FK'),
        ('sbd', 'VARCHAR(30)', ''), ('score', 'DECIMAL(4,2)', ''), ('attendance_status', 'VARCHAR(20)', '')
    ], 780, 120, 280)
    
    add_table(root, 'grade_change_tickets', 'grade_change_tickets', [
        ('id', 'BIGINT', 'PK'), ('student_id', 'BIGINT', 'FK'), ('class_section_id', 'BIGINT', 'FK'),
        ('component_type', 'VARCHAR(20)', ''), ('old_score', 'DECIMAL(4,2)', ''),
        ('new_score', 'DECIMAL(4,2)', ''), ('reason', 'TEXT', ''), ('status', 'VARCHAR(30)', '')
    ], 80, 520, 270)
    
    add_table(root, 'grade_audit_logs', 'grade_audit_logs', [
        ('id', 'BIGINT', 'PK'), ('ticket_id', 'BIGINT', 'FK'), ('student_id', 'BIGINT', 'FK'),
        ('grade_id', 'BIGINT', 'FK'), ('component', 'VARCHAR(20)', ''), ('old_value', 'DECIMAL(4,2)', ''),
        ('new_value', 'DECIMAL(4,2)', ''), ('changed_by', 'BIGINT', 'FK'), ('created_at', 'DATETIME', '')
    ], 430, 520, 280)
    
    add_table(root, 'graduation_records', 'graduation_records', [
        ('id', 'BIGINT', 'PK'), ('student_id', 'BIGINT', 'FK'), ('cohort_id', 'BIGINT', 'FK'),
        ('total_credits_accumulated', 'INT', ''), ('cumulative_gpa', 'DECIMAL(3,2)', ''),
        ('classification', 'VARCHAR(30)', ''), ('decision_number', 'VARCHAR(50)', '')
    ], 780, 520, 280)
    
    add_edge(root, 'e_es_er', 'exam_sessions', 'exam_rooms', '1 - N', exit_p=(1, 0.4), entry_p=(0, 0.4))
    add_edge(root, 'e_er_ero', 'exam_rooms', 'exam_rosters', '1 - N', exit_p=(1, 0.4), entry_p=(0, 0.4))
    add_edge(root, 'e_gct_gal', 'grade_change_tickets', 'grade_audit_logs', '1 - N', exit_p=(1, 0.4), entry_p=(0, 0.4))
    add_edge(root, 'e_gal_grad', 'grade_audit_logs', 'graduation_records', '1 - N (thẩm định điều kiện)', exit_p=(1, 0.4), entry_p=(0, 0.4))
    add_edge(root, 'e_er_grad', 'exam_rosters', 'graduation_records', '1 - N (tích lũy tốt nghiệp)', exit_p=(0.5, 1), entry_p=(0.5, 0))
    
    return model

# ==============================================================================
# MAIN EXPORT
# ==============================================================================
def main():
    mxfile = ET.Element('mxfile', {
        'host': 'app.diagrams.net',
        'modified': '2026-10-30T14:45:00.000Z',
        'agent': 'Antigravity AI Agent',
        'version': '21.0.0',
        'type': 'device'
    })
    
    tabs = [
        ('erd_01', '1. Sơ đồ ERD Tổng quan Thực thể Cốt lõi', build_erd_01_overview()),
        ('erd_02', '2. Phân hệ 1 - Hệ thống & Phân quyền', build_erd_02_system_users()),
        ('erd_03', '3. Phân hệ 2 - Cơ cấu Đào tạo & Khung CTĐT', build_erd_03_academic_curriculum()),
        ('erd_04', '4. Phân hệ 3 - Hồ sơ Người học & Rèn luyện', build_erd_04_students_conduct()),
        ('erd_05', '5. Phân hệ 4 - Lớp học phần & Xếp lịch', build_erd_05_sections_schedules()),
        ('erd_06', '6. Phân hệ 5 - Đăng ký tín chỉ & Sổ điểm', build_erd_06_enrollments_grades()),
        ('erd_07', '7. Phân hệ 6 - Tài chính & Quản lý Học phí', build_erd_07_tuition_finance()),
        ('erd_08', '8. Phân hệ 7 - Khảo thí & Xét tốt nghiệp', build_erd_08_exams_graduation()),
    ]
    
    for diag_id, diag_name, model in tabs:
        d = ET.SubElement(mxfile, 'diagram', {'id': diag_id, 'name': diag_name})
        d.append(model)
        
    xml_str = ET.tostring(mxfile, encoding='utf-8')
    parsed = minidom.parseString(xml_str)
    pretty_xml = parsed.toprettyxml(indent='  ', encoding='utf-8')
    
    out_dir = 'drawio'
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, 'ERD_Diagrams.drawio')
    with open(out_path, 'wb') as f:
        f.write(pretty_xml)
    print(f"Generated successfully: {out_path} ({len(pretty_xml)} bytes, {len(tabs)} tabs)")

if __name__ == '__main__':
    main()
