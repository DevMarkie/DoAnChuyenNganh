# -*- coding: utf-8 -*-
"""
Script to generate CLEAN, MINIMALIST, HIGH-CONTRAST Academic UML Draw.io diagrams.
Covers 100% of the Graduation Project (Đồ án chuyên ngành SMS):
1. Sơ đồ Use Case - Tổng quan toàn hệ thống (All actors & system boundary)
2. Sơ đồ Use Case - Phân hệ Quản trị viên (Admin & Academic Affairs)
3. Sơ đồ Use Case - Phân hệ Giảng viên (Lecturers)
4. Sơ đồ Use Case - Phân hệ Sinh viên (Students)

Standards:
- Nền trắng (background="#ffffff"), không đổ bóng đen, không đè nhãn.
- Ranh giới hệ thống (system boundary) tiêu đề căn lề trái, trên cùng.
- Khoảng cách dọc và ngang rộng rãi (65-80px), không đè chồng hình elip.
- Nhãn «bao gồm» (include) và «mở rộng» (extend) rõ ràng, chuẩn UML 2.5.
- Không trùng lặp bất kỳ ID hoặc ô nào.
"""

import xml.etree.ElementTree as ET
import xml.dom.minidom as minidom
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def add_cell(root, id_val, value="", style="", vertex=False, edge=False, source=None, target=None, parent="1", geometry=None):
    attribs = {'id': str(id_val)}
    if str(id_val) == "0":
        return ET.SubElement(root, 'mxCell', attribs)
    elif str(id_val) == "1":
        attribs['parent'] = '0'
        return ET.SubElement(root, 'mxCell', attribs)

    if value != "":
        attribs['value'] = value
    if style != "":
        attribs['style'] = style
    if parent:
        attribs['parent'] = str(parent)
    if vertex:
        attribs['vertex'] = '1'
    if edge:
        attribs['edge'] = '1'
    if source:
        attribs['source'] = str(source)
    if target:
        attribs['target'] = str(target)
    
    cell = ET.SubElement(root, 'mxCell', attribs)
    
    if geometry:
        geom_attribs = {'as': 'geometry'}
        for k, v in geometry.items():
            geom_attribs[k] = str(v)
        ET.SubElement(cell, 'mxGeometry', geom_attribs)
    return cell

# --- ROBUST ACADEMIC UML STYLES ---
STYLE_BOUNDARY = "rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;strokeWidth=2;dashed=1;verticalAlign=top;align=left;spacingLeft=25;spacingTop=15;fontStyle=1;fontSize=15;fontColor=#000000;"
STYLE_ACTOR = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fontStyle=1;fontSize=13;fontColor=#000000;strokeColor=#000000;fillColor=#ffffff;strokeWidth=1.5;"
STYLE_UC_MAIN = "ellipse;whiteSpace=wrap;html=1;fontSize=12;fontStyle=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.5;fontColor=#000000;"
STYLE_UC_SUB = "ellipse;whiteSpace=wrap;html=1;fontSize=11;fontStyle=0;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontColor=#000000;"
STYLE_ASSOC = "endArrow=none;html=1;strokeWidth=1.5;strokeColor=#000000;"
STYLE_GEN = "endArrow=block;endFill=0;endSize=10;html=1;strokeWidth=1.5;strokeColor=#000000;"
STYLE_INC = "html=1;verticalAlign=bottom;labelBackgroundColor=none;labelBorderColor=none;fillColor=none;endArrow=open;endFill=0;dashed=1;strokeColor=#000000;strokeWidth=1.5;fontColor=#000000;fontSize=11;fontStyle=1;"
STYLE_EXT = "html=1;verticalAlign=bottom;labelBackgroundColor=none;labelBorderColor=none;fillColor=none;endArrow=open;endFill=0;dashed=1;strokeColor=#000000;strokeWidth=1.5;fontColor=#000000;fontSize=11;fontStyle=1;"

# ==============================================================================
# 1. TỔNG QUAN TOÀN HỆ THỐNG
# ==============================================================================
def build_diagram_1_overall():
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': '1650', 'pageHeight': '1380', 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")

    # Boundary
    add_cell(root, "b1", "HỆ THỐNG QUẢN LÝ ĐÀO TẠO & SINH VIÊN (SMS)", STYLE_BOUNDARY, vertex=True, geometry={'x': 210, 'y': 30, 'width': 1220, 'height': 1300})

    # Actors
    add_cell(root, "act_u", "Người dùng", STYLE_ACTOR, vertex=True, geometry={'x': 60, 'y': 70, 'width': 45, 'height': 80})
    add_cell(root, "act_a", "Quản trị viên", STYLE_ACTOR, vertex=True, geometry={'x': 60, 'y': 520, 'width': 45, 'height': 80})
    add_cell(root, "act_l", "Giảng viên", STYLE_ACTOR, vertex=True, geometry={'x': 60, 'y': 1020, 'width': 45, 'height': 80})
    add_cell(root, "act_s", "Sinh viên", STYLE_ACTOR, vertex=True, geometry={'x': 1510, 'y': 520, 'width': 45, 'height': 80})

    # Generalization (Inheritance)
    add_cell(root, "g_au", "", STYLE_GEN, edge=True, source="act_a", target="act_u", geometry={'relative': 1})
    add_cell(root, "g_lu", "", STYLE_GEN, edge=True, source="act_l", target="act_u", geometry={'relative': 1})
    add_cell(root, "g_su", "", STYLE_GEN, edge=True, source="act_s", target="act_u", geometry={'relative': 1})

    # Row 1: Common UCs (Shared by all logged-in users)
    ucs_user = [
        ("uc_login", "Đăng nhập hệ thống (JWT)", 250, 75, 170, 45),
        ("uc_profile", "Xem thông tin cá nhân", 450, 75, 170, 45),
        ("uc_pwd", "Đổi mật khẩu tài khoản", 650, 75, 170, 45),
        ("uc_logout", "Đăng xuất an toàn", 850, 75, 150, 45),
    ]
    style_u_assoc = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=none;strokeWidth=1.5;strokeColor=#000000;exitX=1;exitY=0.3;entryX=0.5;entryY=0;"
    for uid, uval, ux, uy, uw, uh in ucs_user:
        add_cell(root, uid, uval, STYLE_UC_MAIN, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_u_{uid}", "", style_u_assoc, edge=True, source="act_u", target=uid, geometry={'relative': 1})

    # Left Column: Admin UCs
    ucs_admin = [
        ("uc_a_dept", "Thiết lập Khoa & Lớp sinh hoạt", 250, 150, 230, 46),
        ("uc_a_subj", "Quản lý Môn học & Tiên quyết", 250, 220, 230, 46),
        ("uc_a_sem", "Cấu hình Học kỳ & Đợt ĐKHP", 250, 290, 230, 46),
        ("uc_a_stu", "Quản lý Hồ sơ Sinh viên", 250, 360, 230, 46),
        ("uc_a_lec", "Quản lý Hồ sơ Giảng viên", 250, 430, 230, 46),
        ("uc_a_sec", "Mở lớp học phần mới", 250, 500, 230, 46),
        ("uc_a_ass", "Phân công Giảng viên phụ trách", 250, 570, 230, 46),
        ("uc_a_sch", "Xếp Thời khóa biểu toàn trường", 250, 640, 230, 46),
        ("uc_a_kpi", "Báo cáo thống kê & Dashboard", 250, 710, 230, 46),
        ("uc_a_mon", "Quản lý bảng điểm các lớp", 250, 780, 230, 46),
        ("uc_a_tuition", "Quản lý & Thu học phí", 250, 850, 230, 46),
        ("uc_a_exam", "Quản lý Thi & Phòng thi", 250, 920, 230, 46),
        ("uc_a_warn", "Quản lý Cảnh báo học vụ", 250, 990, 230, 46),
        ("uc_a_grad", "Xét tốt nghiệp & Chuẩn đầu ra", 250, 1060, 230, 46),
    ]
    for uid, uval, ux, uy, uw, uh in ucs_admin:
        add_cell(root, uid, uval, STYLE_UC_MAIN, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_a_{uid}", "", STYLE_ASSOC, edge=True, source="act_a", target=uid, geometry={'relative': 1})

    # Middle Column: Lecturer UCs
    ucs_lec = [
        ("uc_l_sch", "Tra cứu Lịch dạy theo tuần", 580, 750, 230, 48),
        ("uc_l_sec", "Xem danh sách sinh viên lớp", 580, 830, 230, 48),
        ("uc_l_grd", "Nhập điểm thành phần & Import", 580, 910, 230, 48),
        ("uc_l_fin", "Chốt & Công bố bảng điểm (7 ngày)", 580, 990, 230, 48),
        ("uc_l_att", "Quản lý Điểm danh lớp học", 580, 1070, 230, 48),
        ("uc_l_appeal", "Xét duyệt & Chấm phúc khảo", 580, 1150, 230, 48),
    ]
    for uid, uval, ux, uy, uw, uh in ucs_lec:
        add_cell(root, uid, uval, STYLE_UC_MAIN, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_l_{uid}", "", STYLE_ASSOC, edge=True, source="act_l", target=uid, geometry={'relative': 1})

    # Right Column: Student UCs
    ucs_stu = [
        ("uc_s_sch", "Tra cứu Thời khóa biểu tuần", 940, 200, 230, 48),
        ("uc_s_search", "Tra cứu học phần mở trong kỳ", 940, 280, 230, 48),
        ("uc_s_enr", "Đăng ký lớp học phần", 940, 360, 230, 48),
        ("uc_s_drop", "Hủy đăng ký học phần", 940, 440, 230, 48),
        ("uc_s_trans", "Tra cứu Bảng điểm & CPA", 940, 520, 230, 48),
        ("uc_s_curric", "Xem Lộ trình khung CTĐT", 940, 600, 230, 48),
        ("uc_s_appeal", "Gửi đơn phúc khảo điểm", 940, 680, 230, 48),
        ("uc_s_tuition", "Tra cứu & Nộp học phí", 940, 760, 230, 48),
        ("uc_s_att", "Điểm danh trực tiếp (mã PIN)", 940, 840, 230, 48),
    ]
    for uid, uval, ux, uy, uw, uh in ucs_stu:
        add_cell(root, uid, uval, STYLE_UC_MAIN, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_s_{uid}", "", STYLE_ASSOC, edge=True, source="act_s", target=uid, geometry={'relative': 1})

    # Include edge
    add_cell(root, "inc_enr_search", "«bao gồm»", STYLE_INC, edge=True, source="uc_s_enr", target="uc_s_search", geometry={'relative': 1})

    return model

# ==============================================================================
# 2. PHÂN HỆ QUẢN TRỊ VIÊN
# ==============================================================================
def build_diagram_2_admin():
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': '1550', 'pageHeight': '1550', 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")

    # Boundary
    add_cell(root, "b2", "PHÂN HỆ QUẢN TRỊ VIÊN / PHÒNG ĐÀO TẠO", STYLE_BOUNDARY, vertex=True, geometry={'x': 210, 'y': 30, 'width': 1180, 'height': 1480})

    # Actor Admin
    add_cell(root, "act_a2", "Quản trị viên", STYLE_ACTOR, vertex=True, geometry={'x': 60, 'y': 620, 'width': 45, 'height': 80})

    # Column 1: Core UCs
    main_ucs = [
        ("uc2_kpi", "Báo cáo thống kê đào tạo & KPI", 260, 90, 240, 48),
        ("uc2_subj", "Quản lý Danh mục Môn học", 260, 180, 240, 48),
        ("uc2_sem", "Cấu hình Học kỳ & Đợt ĐKHP", 260, 270, 240, 48),
        ("uc2_dept", "Thiết lập Khoa & Lớp sinh hoạt", 260, 360, 240, 48),
        ("uc2_stu", "Quản lý Hồ sơ Sinh viên", 260, 460, 240, 48),
        ("uc2_lec", "Quản lý Hồ sơ Giảng viên", 260, 580, 240, 48),
        ("uc2_sec", "Mở mới & Điều phối Lớp học phần", 260, 685, 240, 48),
        ("uc2_sch", "Xếp Thời khóa biểu toàn trường", 260, 800, 240, 48),
        ("uc2_mon", "Quản lý Bảng điểm các lớp", 260, 910, 240, 48),
        ("uc2_exam", "Quản lý Thi & Tổ chức phòng thi", 260, 1020, 240, 48),
        ("uc2_warn", "Quản lý Cảnh báo học vụ", 260, 1130, 240, 48),
        ("uc2_tuition", "Quản lý & Thu học phí", 260, 1240, 240, 48),
        ("uc2_grad", "Xét tốt nghiệp & Chuẩn đầu ra", 260, 1360, 240, 48),
    ]
    for uid, uval, ux, uy, uw, uh in main_ucs:
        add_cell(root, uid, uval, STYLE_UC_MAIN, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_a2_{uid}", "", STYLE_ASSOC, edge=True, source="act_a2", target=uid, geometry={'relative': 1})

    # Column 2: Sub-cases (Include & Extend)
    # 1. KPI
    add_cell(root, "uc2_sub_fac", "Xem phân bố SV theo Khoa", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 70, 'width': 240, 'height': 45})
    add_cell(root, "uc2_sub_stat", "Xem tỷ lệ trạng thái đào tạo", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 125, 'width': 240, 'height': 45})
    add_cell(root, "inc_kpi1", "«bao gồm»", STYLE_INC, edge=True, source="uc2_kpi", target="uc2_sub_fac", geometry={'relative': 1})
    add_cell(root, "inc_kpi2", "«bao gồm»", STYLE_INC, edge=True, source="uc2_kpi", target="uc2_sub_stat", geometry={'relative': 1})

    # 2. Subject
    add_cell(root, "uc2_sub_prereq", "Cấu hình môn học tiên quyết", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 180, 'width': 240, 'height': 45})
    add_cell(root, "inc_subj_pre", "«bao gồm»", STYLE_INC, edge=True, source="uc2_subj", target="uc2_sub_prereq", geometry={'relative': 1})

    # 3. Semester
    add_cell(root, "uc2_sub_currsem", "Kích hoạt Học kỳ hiện tại", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 245, 'width': 240, 'height': 45})
    add_cell(root, "uc2_sub_wave", "Mở đợt đăng ký theo khóa/ngành", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 300, 'width': 240, 'height': 45})
    add_cell(root, "inc_sem1", "«bao gồm»", STYLE_INC, edge=True, source="uc2_sem", target="uc2_sub_currsem", geometry={'relative': 1})
    add_cell(root, "inc_sem2", "«bao gồm»", STYLE_INC, edge=True, source="uc2_sem", target="uc2_sub_wave", geometry={'relative': 1})

    # 4. Department & Class
    add_cell(root, "uc2_sub_batchclass", "Sinh lớp SH hàng loạt theo khóa", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 360, 'width': 240, 'height': 45})
    add_cell(root, "ext_batch_class", "«mở rộng»", STYLE_EXT, edge=True, source="uc2_sub_batchclass", target="uc2_dept", geometry={'relative': 1})

    # 5. Student
    add_cell(root, "uc2_sub_stufilter", "Tìm kiếm & Lọc hồ sơ đa tiêu chí", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 420, 'width': 240, 'height': 45})
    add_cell(root, "uc2_sub_stustat", "Đổi trạng thái học tập / Đình chỉ", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 475, 'width': 240, 'height': 45})
    add_cell(root, "uc2_sub_stuimport", "Import sinh viên từ file Excel", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 530, 'width': 240, 'height': 45})
    add_cell(root, "inc_stu_filter", "«bao gồm»", STYLE_INC, edge=True, source="uc2_stu", target="uc2_sub_stufilter", geometry={'relative': 1})
    add_cell(root, "ext_stu_stat", "«mở rộng»", STYLE_EXT, edge=True, source="uc2_sub_stustat", target="uc2_stu", geometry={'relative': 1})
    add_cell(root, "ext_stu_import", "«mở rộng»", STYLE_EXT, edge=True, source="uc2_sub_stuimport", target="uc2_stu", geometry={'relative': 1})

    # 6. Lecturer
    add_cell(root, "uc2_sub_lecacc", "Phân khoa & Cấp tài khoản tự động", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 580, 'width': 240, 'height': 45})
    add_cell(root, "inc_lec_acc", "«bao gồm»", STYLE_INC, edge=True, source="uc2_lec", target="uc2_sub_lecacc", geometry={'relative': 1})

    # 7. Course Section
    add_cell(root, "uc2_sub_secass", "Phân công Giảng viên phụ trách", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 640, 'width': 250, 'height': 45})
    add_cell(root, "uc2_sub_seccfg", "Cấu hình Lịch học, Tiết và Phòng", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 695, 'width': 250, 'height': 45})
    add_cell(root, "uc2_sub_secbatch", "Khởi tạo nhanh nhiều lớp theo khóa", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 750, 'width': 250, 'height': 45})
    add_cell(root, "inc_sec1", "«bao gồm»", STYLE_INC, edge=True, source="uc2_sec", target="uc2_sub_secass", geometry={'relative': 1})
    add_cell(root, "inc_sec2", "«bao gồm»", STYLE_INC, edge=True, source="uc2_sec", target="uc2_sub_seccfg", geometry={'relative': 1})
    add_cell(root, "ext_sec_batch", "«mở rộng»", STYLE_EXT, edge=True, source="uc2_sub_secbatch", target="uc2_sec", geometry={'relative': 1})

    # 8. Schedules
    add_cell(root, "uc2_sub_schroom", "Quét xung đột phòng học", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 810, 'width': 240, 'height': 45})
    add_cell(root, "uc2_sub_schlec", "Quét trùng lịch giảng viên", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 865, 'width': 240, 'height': 45})
    add_cell(root, "inc_sch1", "«bao gồm»", STYLE_INC, edge=True, source="uc2_sch", target="uc2_sub_schroom", geometry={'relative': 1})
    add_cell(root, "inc_sch2", "«bao gồm»", STYLE_INC, edge=True, source="uc2_sch", target="uc2_sub_schlec", geometry={'relative': 1})

    # 9. Grades
    add_cell(root, "uc2_sub_viewgrd", "Xem chi tiết bảng điểm & lịch sử", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 920, 'width': 250, 'height': 45})
    add_cell(root, "uc2_sub_unlock", "Mở khóa sổ điểm (Quá 7 ngày)", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 975, 'width': 250, 'height': 45})
    add_cell(root, "inc_grd_view", "«bao gồm»", STYLE_INC, edge=True, source="uc2_mon", target="uc2_sub_viewgrd", geometry={'relative': 1})
    add_cell(root, "ext_unlock", "«mở rộng»", STYLE_EXT, edge=True, source="uc2_sub_unlock", target="uc2_mon", geometry={'relative': 1})

    # 10. Exam
    add_cell(root, "uc2_sub_roster", "Tự động chia phòng thi & Đánh SBD", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 1030, 'width': 250, 'height': 45})
    add_cell(root, "uc2_sub_examimport", "Import điểm thi từ Excel & Khóa điểm", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 1085, 'width': 250, 'height': 45})
    add_cell(root, "inc_exam_roster", "«bao gồm»", STYLE_INC, edge=True, source="uc2_exam", target="uc2_sub_roster", geometry={'relative': 1})
    add_cell(root, "ext_exam_import", "«mở rộng»", STYLE_EXT, edge=True, source="uc2_sub_examimport", target="uc2_exam", geometry={'relative': 1})

    # 11. Academic Warnings
    add_cell(root, "uc2_sub_warnfilter", "Quét tự động sinh viên theo CPA", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 1140, 'width': 250, 'height': 45})
    add_cell(root, "uc2_sub_warnexport", "Xuất danh sách xử lý học vụ", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 1195, 'width': 250, 'height': 45})
    add_cell(root, "inc_warn_filter", "«bao gồm»", STYLE_INC, edge=True, source="uc2_warn", target="uc2_sub_warnfilter", geometry={'relative': 1})
    add_cell(root, "ext_warn_export", "«mở rộng»", STYLE_EXT, edge=True, source="uc2_sub_warnexport", target="uc2_warn", geometry={'relative': 1})

    # 12. Tuition
    add_cell(root, "uc2_sub_tuition_inv", "Lập bảng kê hóa đơn học kỳ", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 1250, 'width': 240, 'height': 45})
    add_cell(root, "uc2_sub_tuition_pay", "Thu học phí & Xuất biên lai", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 1305, 'width': 240, 'height': 45})
    add_cell(root, "uc2_sub_tuition_ext", "Xét duyệt gia hạn nộp học phí", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 1360, 'width': 240, 'height': 45})
    add_cell(root, "inc_tuition_inv", "«bao gồm»", STYLE_INC, edge=True, source="uc2_tuition", target="uc2_sub_tuition_inv", geometry={'relative': 1})
    add_cell(root, "inc_tuition_pay", "«bao gồm»", STYLE_INC, edge=True, source="uc2_tuition", target="uc2_sub_tuition_pay", geometry={'relative': 1})
    add_cell(root, "ext_tuition_ext", "«mở rộng»", STYLE_EXT, edge=True, source="uc2_sub_tuition_ext", target="uc2_tuition", geometry={'relative': 1})

    # 13. Graduation
    add_cell(root, "uc2_sub_gradaudit", "Đối soát tích lũy theo khung CTĐT", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 1420, 'width': 250, 'height': 45})
    add_cell(root, "inc_grad_audit", "«bao gồm»", STYLE_INC, edge=True, source="uc2_grad", target="uc2_sub_gradaudit", geometry={'relative': 1})

    return model

# ==============================================================================
# 3. PHÂN HỆ GIẢNG VIÊN
# ==============================================================================
def build_diagram_3_lecturer():
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': '1420', 'pageHeight': '1050', 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")

    # Boundary
    add_cell(root, "b3", "PHÂN HỆ GIẢNG VIÊN", STYLE_BOUNDARY, vertex=True, geometry={'x': 210, 'y': 30, 'width': 1050, 'height': 970})

    # Actor Lecturer
    add_cell(root, "act_l3", "Giảng viên", STYLE_ACTOR, vertex=True, geometry={'x': 60, 'y': 440, 'width': 45, 'height': 80})

    # Column 1: Main UCs
    main_ucs = [
        ("uc3_dash", "Xem Bảng điều khiển Giảng viên", 260, 85, 250, 48),
        ("uc3_sch", "Tra cứu Lịch dạy theo tuần", 260, 175, 250, 48),
        ("uc3_sec", "Quản lý Danh sách lớp phụ trách", 260, 265, 250, 48),
        ("uc3_grd", "Nhập điểm thành phần (CC, GK, CK)", 260, 375, 250, 48),
        ("uc3_fin", "Chốt & Công bố bảng điểm học phần", 260, 500, 250, 48),
        ("uc3_att", "Quản lý Điểm danh lớp học", 260, 625, 250, 48),
        ("uc3_appeal", "Xét duyệt & Chấm phúc khảo điểm", 260, 745, 250, 48),
        ("uc3_prof", "Xem hồ sơ & Đổi mật khẩu cá nhân", 260, 855, 250, 48),
    ]
    for uid, uval, ux, uy, uw, uh in main_ucs:
        add_cell(root, uid, uval, STYLE_UC_MAIN, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_l3_{uid}", "", STYLE_ASSOC, edge=True, source="act_l3", target=uid, geometry={'relative': 1})

    # Column 2: Sub-cases
    # Dashboard
    add_cell(root, "uc3_sub_dashstat", "Thống kê sĩ số và tiến độ các lớp dạy", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 85, 'width': 260, 'height': 45})
    add_cell(root, "inc_dash_stat", "«bao gồm»", STYLE_INC, edge=True, source="uc3_dash", target="uc3_sub_dashstat", geometry={'relative': 1})

    # Schedule
    add_cell(root, "uc3_sub_schdetail", "Xem phòng học, ca dạy và sĩ số", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 175, 'width': 260, 'height': 45})
    add_cell(root, "inc_sch_detail", "«bao gồm»", STYLE_INC, edge=True, source="uc3_sch", target="uc3_sub_schdetail", geometry={'relative': 1})

    # Section
    add_cell(root, "uc3_sub_stulist", "Xem & Xuất danh sách SV ra Excel", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 265, 'width': 260, 'height': 45})
    add_cell(root, "inc_sec_stu", "«bao gồm»", STYLE_INC, edge=True, source="uc3_sec", target="uc3_sub_stulist", geometry={'relative': 1})

    # Grade Entry
    add_cell(root, "uc3_sub_calc", "Tự động tính điểm TK, hệ 4 và điểm chữ", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 340, 'width': 260, 'height': 45})
    add_cell(root, "uc3_sub_save", "Lưu tạm bản nháp sổ điểm", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 395, 'width': 230, 'height': 45})
    add_cell(root, "uc3_sub_excel", "Import điểm từ file mẫu Excel", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 450, 'width': 230, 'height': 45})
    add_cell(root, "inc_grd_calc", "«bao gồm»", STYLE_INC, edge=True, source="uc3_grd", target="uc3_sub_calc", geometry={'relative': 1})
    add_cell(root, "ext_grd_save", "«mở rộng»", STYLE_EXT, edge=True, source="uc3_sub_save", target="uc3_grd", geometry={'relative': 1})
    add_cell(root, "ext_grd_excel", "«mở rộng»", STYLE_EXT, edge=True, source="uc3_sub_excel", target="uc3_grd", geometry={'relative': 1})

    # Finalize & 7-day
    add_cell(root, "uc3_sub_check100", "Kiểm tra điều kiện 100% SV đủ điểm", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 505, 'width': 260, 'height': 45})
    add_cell(root, "uc3_sub_edit7d", "Chỉnh sửa điểm trong cửa sổ 7 ngày", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 560, 'width': 260, 'height': 45})
    add_cell(root, "inc_grd_100", "«bao gồm»", STYLE_INC, edge=True, source="uc3_fin", target="uc3_sub_check100", geometry={'relative': 1})
    add_cell(root, "ext_grd_7d", "«mở rộng»", STYLE_EXT, edge=True, source="uc3_sub_edit7d", target="uc3_fin", geometry={'relative': 1})

    # Attendance
    add_cell(root, "uc3_sub_att_live", "Mở phiên realtime & Phát mã PIN 6 số", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 620, 'width': 260, 'height': 45})
    add_cell(root, "uc3_sub_att_manual", "Chốt sĩ số & Ghi nhận vắng/muộn", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 675, 'width': 260, 'height': 45})
    add_cell(root, "inc_att_live", "«bao gồm»", STYLE_INC, edge=True, source="uc3_att", target="uc3_sub_att_live", geometry={'relative': 1})
    add_cell(root, "inc_att_manual", "«bao gồm»", STYLE_INC, edge=True, source="uc3_att", target="uc3_sub_att_manual", geometry={'relative': 1})

    # Grade Appeal
    add_cell(root, "uc3_sub_appealview", "Xem đơn phúc khảo & lý do của SV", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 735, 'width': 260, 'height': 45})
    add_cell(root, "uc3_sub_appealupdate", "Cập nhật điểm phúc khảo & Lý do", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 790, 'width': 260, 'height': 45})
    add_cell(root, "inc_app_view", "«bao gồm»", STYLE_INC, edge=True, source="uc3_appeal", target="uc3_sub_appealview", geometry={'relative': 1})
    add_cell(root, "ext_app_update", "«mở rộng»", STYLE_EXT, edge=True, source="uc3_sub_appealupdate", target="uc3_appeal", geometry={'relative': 1})

    return model

# ==============================================================================
# 4. PHÂN HỆ SINH VIÊN
# ==============================================================================
def build_diagram_4_student():
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': '1420', 'pageHeight': '1180', 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")

    # Boundary
    add_cell(root, "b4", "PHÂN HỆ SINH VIÊN", STYLE_BOUNDARY, vertex=True, geometry={'x': 210, 'y': 30, 'width': 1050, 'height': 1100})

    # Actor Student
    add_cell(root, "act_s4", "Sinh viên", STYLE_ACTOR, vertex=True, geometry={'x': 60, 'y': 500, 'width': 45, 'height': 80})

    # Column 1: Main UCs
    main_ucs = [
        ("uc4_dash", "Xem Bảng điều khiển tiến độ học tập", 260, 80, 250, 48),
        ("uc4_sch", "Tra cứu Thời khóa biểu dạng tuần", 260, 165, 250, 48),
        ("uc4_enr", "Đăng ký lớp học phần trong kỳ", 260, 275, 250, 48),
        ("uc4_drop", "Hủy đăng ký học phần", 260, 410, 250, 48),
        ("uc4_trans", "Tra cứu Bảng điểm học tập", 260, 525, 250, 48),
        ("uc4_curric", "Xem Lộ trình khung chương trình đào tạo", 260, 635, 250, 48),
        ("uc4_appeal", "Gửi đơn phúc khảo điểm học phần", 260, 745, 250, 48),
        ("uc4_tuition", "Tra cứu & Thanh toán học phí", 260, 845, 250, 48),
        ("uc4_att", "Điểm danh trực tiếp (Check-in)", 260, 955, 250, 48),
        ("uc4_prof", "Xem hồ sơ & Đổi mật khẩu cá nhân", 260, 1030, 250, 48),
    ]
    for uid, uval, ux, uy, uw, uh in main_ucs:
        add_cell(root, uid, uval, STYLE_UC_MAIN, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_s4_{uid}", "", STYLE_ASSOC, edge=True, source="act_s4", target=uid, geometry={'relative': 1})

    # Column 2: Sub-cases
    # Dashboard
    add_cell(root, "uc4_sub_dash", "Theo dõi GPA/CPA và tín chỉ tích lũy", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 80, 'width': 260, 'height': 45})
    add_cell(root, "inc_dash_gpa", "«bao gồm»", STYLE_INC, edge=True, source="uc4_dash", target="uc4_sub_dash", geometry={'relative': 1})

    # Schedule
    add_cell(root, "uc4_sub_sch", "Xem chi tiết ca học, phòng & GV", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 165, 'width': 260, 'height': 45})
    add_cell(root, "inc_sch_ca", "«bao gồm»", STYLE_INC, edge=True, source="uc4_sch", target="uc4_sub_sch", geometry={'relative': 1})

    # Enrollment
    add_cell(root, "uc4_sub_search", "Tra cứu học phần đang mở trong kỳ", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 245, 'width': 260, 'height': 45})
    add_cell(root, "uc4_sub_val", "Kiểm tra tiên quyết, sĩ số & trùng lịch", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 300, 'width': 260, 'height': 45})
    add_cell(root, "uc4_sub_smart", "Trợ lý xếp TKB thông minh (Backtracking)", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 355, 'width': 260, 'height': 45})
    add_cell(root, "inc_enr_search", "«bao gồm»", STYLE_INC, edge=True, source="uc4_enr", target="uc4_sub_search", geometry={'relative': 1})
    add_cell(root, "inc_enr_val", "«bao gồm»", STYLE_INC, edge=True, source="uc4_enr", target="uc4_sub_val", geometry={'relative': 1})
    add_cell(root, "ext_enr_smart", "«mở rộng»", STYLE_EXT, edge=True, source="uc4_sub_smart", target="uc4_enr", geometry={'relative': 1})

    # Drop
    add_cell(root, "uc4_sub_myenr", "Xem danh sách học phần đã đăng ký", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 410, 'width': 260, 'height': 45})
    add_cell(root, "uc4_sub_nodiem", "Kiểm tra điều kiện chưa có điểm thi", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 465, 'width': 260, 'height': 45})
    add_cell(root, "inc_drop_myenr", "«bao gồm»", STYLE_INC, edge=True, source="uc4_drop", target="uc4_sub_myenr", geometry={'relative': 1})
    add_cell(root, "inc_drop_nodiem", "«bao gồm»", STYLE_INC, edge=True, source="uc4_drop", target="uc4_sub_nodiem", geometry={'relative': 1})

    # Transcript
    add_cell(root, "uc4_sub_gpa", "Theo dõi GPA từng kỳ và CPA tích lũy", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 520, 'width': 260, 'height': 45})
    add_cell(root, "uc4_sub_detail", "Xem chi tiết từng cột điểm thành phần", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 575, 'width': 260, 'height': 45})
    add_cell(root, "inc_trans_gpa", "«bao gồm»", STYLE_INC, edge=True, source="uc4_trans", target="uc4_sub_gpa", geometry={'relative': 1})
    add_cell(root, "inc_trans_det", "«bao gồm»", STYLE_INC, edge=True, source="uc4_trans", target="uc4_sub_detail", geometry={'relative': 1})

    # Curriculum
    add_cell(root, "uc4_sub_curric", "Xem tiến độ tích lũy theo khối kiến thức", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 635, 'width': 260, 'height': 45})
    add_cell(root, "inc_curric_det", "«bao gồm»", STYLE_INC, edge=True, source="uc4_curric", target="uc4_sub_curric", geometry={'relative': 1})

    # Grade Appeal
    add_cell(root, "uc4_sub_appnew", "Chọn thành phần điểm & Nhập lý do", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 720, 'width': 260, 'height': 45})
    add_cell(root, "uc4_sub_appstat", "Theo dõi trạng thái xét duyệt phúc khảo", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 775, 'width': 260, 'height': 45})
    add_cell(root, "inc_app_new", "«bao gồm»", STYLE_INC, edge=True, source="uc4_appeal", target="uc4_sub_appnew", geometry={'relative': 1})
    add_cell(root, "ext_app_stat", "«mở rộng»", STYLE_EXT, edge=True, source="uc4_sub_appstat", target="uc4_appeal", geometry={'relative': 1})

    # Tuition
    add_cell(root, "uc4_sub_tuidet", "Xem bảng kê học phí theo tín chỉ", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 840, 'width': 260, 'height': 45})
    add_cell(root, "uc4_sub_tuipay", "Nộp học phí trực tuyến & Nhận biên lai", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 895, 'width': 260, 'height': 45})
    add_cell(root, "inc_tui_det", "«bao gồm»", STYLE_INC, edge=True, source="uc4_tuition", target="uc4_sub_tuidet", geometry={'relative': 1})
    add_cell(root, "ext_tui_pay", "«mở rộng»", STYLE_EXT, edge=True, source="uc4_sub_tuipay", target="uc4_tuition", geometry={'relative': 1})

    # Attendance
    add_cell(root, "uc4_sub_att_pin", "Nhập mã PIN xác nhận có mặt", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 955, 'width': 260, 'height': 45})
    add_cell(root, "inc_stu_att", "«bao gồm»", STYLE_INC, edge=True, source="uc4_att", target="uc4_sub_att_pin", geometry={'relative': 1})

    return model

# ==============================================================================
# LƯU FILE DRAWIO
# ==============================================================================
def save_single_diagram(filename, diag_id, diag_name, build_func):
    mxfile = ET.Element('mxfile', {
        'host': 'app.diagrams.net',
        'modified': '2026-10-28T00:00:00.000Z',
        'agent': 'Antigravity AI Agent',
        'version': '24.0.0',
        'type': 'device'
    })
    diag = ET.SubElement(mxfile, 'diagram', {'id': diag_id, 'name': diag_name})
    diag.append(build_func())
    
    xml_str = ET.tostring(mxfile, encoding='utf-8')
    parsed = minidom.parseString(xml_str)
    pretty_xml = parsed.toprettyxml(indent='  ', encoding='utf-8')

    drawio_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    os.makedirs(drawio_dir, exist_ok=True)
    target_path = os.path.join(drawio_dir, filename)
    with open(target_path, 'wb') as f:
        f.write(pretty_xml)
    print(f"✓ Saved single diagram: {target_path}")

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    drawio_dir = os.path.join(root_dir, 'drawio')
    os.makedirs(drawio_dir, exist_ok=True)

    # Multi-page UseCase_Diagrams.drawio (in drawio/)
    multi_file = ET.Element('mxfile', {
        'host': 'app.diagrams.net',
        'modified': '2026-10-28T00:00:00.000Z',
        'agent': 'Antigravity AI Agent',
        'version': '24.0.0',
        'type': 'device'
    })

    tabs = [
        ('uc_overall', '1. Tổng quan toàn hệ thống', build_diagram_1_overall()),
        ('uc_admin', '2. Phân hệ Quản trị viên', build_diagram_2_admin()),
        ('uc_lecturer', '3. Phân hệ Giảng viên', build_diagram_3_lecturer()),
        ('uc_student', '4. Phân hệ Sinh viên', build_diagram_4_student())
    ]

    for diag_id, diag_name, model in tabs:
        d = ET.SubElement(multi_file, 'diagram', {'id': diag_id, 'name': diag_name})
        d.append(model)

    xml_str = ET.tostring(multi_file, encoding='utf-8')
    parsed = minidom.parseString(xml_str)
    pretty_xml = parsed.toprettyxml(indent='  ', encoding='utf-8')

    target_path = os.path.join(drawio_dir, 'UseCase_Diagrams.drawio')
    with open(target_path, 'wb') as f:
        f.write(pretty_xml)
    print(f"✓ Saved multi-page UseCase diagram: {target_path}")

    # Individual single-tab drawio files in drawio/
    save_single_diagram('1_UseCase_TongQuan.drawio', 'uc_overall', '1. Tổng quan hệ thống', build_diagram_1_overall)
    save_single_diagram('2_UseCase_Admin.drawio', 'uc_admin', '2. Phân hệ Quản trị viên', build_diagram_2_admin)
    save_single_diagram('3_UseCase_GiangVien.drawio', 'uc_lecturer', '3. Phân hệ Giảng viên', build_diagram_3_lecturer)
    save_single_diagram('4_UseCase_SinhVien.drawio', 'uc_student', '4. Phân hệ Sinh viên', build_diagram_4_student)

if __name__ == '__main__':
    main()
