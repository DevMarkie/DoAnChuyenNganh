# -*- coding: utf-8 -*-
"""
Script to generate CLEAN, MINIMALIST, HIGH-CONTRAST Academic UML Draw.io diagrams.
FIXES ALL ISSUES:
1. Label black box fixed: labelBackgroundColor=none;labelBorderColor=none;fillColor=none;
2. Boundary title overlap fixed: align=left;spacingLeft=25;spacingTop=15; (No title in the center!)
3. Use case overlap fixed: Generous vertical spacing (at least 75-90px gap) and horizontal spacing (190px gap).
4. Full black-and-white high contrast academic UML standard.
"""

import xml.etree.ElementTree as ET
import xml.dom.minidom as minidom
import os

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

# --- ROBUST ACADEMIC UML STYLES (NO BLACK BOXES, NO OVERLAPS) ---
STYLE_BOUNDARY = "rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;strokeWidth=2;dashed=1;verticalAlign=top;align=left;spacingLeft=25;spacingTop=15;fontStyle=1;fontSize=15;fontColor=#000000;"
STYLE_ACTOR = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fontStyle=1;fontSize=13;fontColor=#000000;strokeColor=#000000;fillColor=#ffffff;strokeWidth=1.5;"
STYLE_UC_MAIN = "ellipse;whiteSpace=wrap;html=1;fontSize=12;fontStyle=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.5;fontColor=#000000;"
STYLE_UC_SUB = "ellipse;whiteSpace=wrap;html=1;fontSize=11;fontStyle=0;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontColor=#000000;"
STYLE_ASSOC = "endArrow=none;html=1;strokeWidth=1.5;strokeColor=#000000;"
STYLE_GEN = "endArrow=block;endFill=0;endSize=10;html=1;strokeWidth=1.5;strokeColor=#000000;"

# Crucial: labelBackgroundColor=none;labelBorderColor=none;fillColor=none prevents the black rectangle bug
STYLE_INC = "html=1;verticalAlign=bottom;labelBackgroundColor=none;labelBorderColor=none;fillColor=none;endArrow=open;endFill=0;dashed=1;strokeColor=#000000;strokeWidth=1.5;fontColor=#000000;fontSize=11;fontStyle=1;"
STYLE_EXT = "html=1;verticalAlign=bottom;labelBackgroundColor=none;labelBorderColor=none;fillColor=none;endArrow=open;endFill=0;dashed=1;strokeColor=#000000;strokeWidth=1.5;fontColor=#000000;fontSize=11;fontStyle=1;"

def build_diagram_1_overall():
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': '1550', 'pageHeight': '1150', 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")

    # Boundary with top-left title
    add_cell(root, "b1", "HỆ THỐNG QUẢN LÝ SINH VIÊN", STYLE_BOUNDARY, vertex=True, geometry={'x': 220, 'y': 30, 'width': 1050, 'height': 1050})

    # Actors
    add_cell(root, "act_u", "Người dùng", STYLE_ACTOR, vertex=True, geometry={'x': 60, 'y': 70, 'width': 45, 'height': 80})
    add_cell(root, "act_a", "Quản trị viên", STYLE_ACTOR, vertex=True, geometry={'x': 60, 'y': 400, 'width': 45, 'height': 80})
    add_cell(root, "act_l", "Giảng viên", STYLE_ACTOR, vertex=True, geometry={'x': 60, 'y': 820, 'width': 45, 'height': 80})
    add_cell(root, "act_s", "Sinh viên", STYLE_ACTOR, vertex=True, geometry={'x': 1340, 'y': 500, 'width': 45, 'height': 80})

    # Generalization
    add_cell(root, "g_au", "", STYLE_GEN, edge=True, source="act_a", target="act_u", geometry={'relative': 1})
    add_cell(root, "g_lu", "", STYLE_GEN, edge=True, source="act_l", target="act_u", geometry={'relative': 1})
    add_cell(root, "g_su", "", STYLE_GEN, edge=True, source="act_s", target="act_u", geometry={'relative': 1})

    # Row 1: Common UCs (User)
    ucs_user = [
        ("uc_login", "Đăng nhập hệ thống", 260, 80, 160, 45),
        ("uc_profile", "Xem thông tin cá nhân", 450, 80, 160, 45),
        ("uc_pwd", "Đổi mật khẩu", 640, 80, 150, 45),
        ("uc_logout", "Đăng xuất", 820, 80, 140, 45),
    ]
    for uid, uval, ux, uy, uw, uh in ucs_user:
        add_cell(root, uid, uval, STYLE_UC_MAIN, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_u_{uid}", "", STYLE_ASSOC, edge=True, source="act_u", target=uid, geometry={'relative': 1})

    # Left Column: Admin UCs
    ucs_admin = [
        ("uc_a_subj", "Thêm và Cập nhật Môn học", 260, 170, 220, 50),
        ("uc_a_sem", "Cấu hình Học kỳ & Hạn ĐKHP", 260, 250, 220, 50),
        ("uc_a_dept", "Thiết lập Khoa & Lớp sinh hoạt", 260, 330, 220, 50),
        ("uc_a_stu", "Thêm mới & Cập nhật Sinh viên", 260, 410, 220, 50),
        ("uc_a_lec", "Thêm mới & Cập nhật Giảng viên", 260, 490, 220, 50),
        ("uc_a_sec", "Mở lớp học phần mới", 260, 570, 220, 50),
        ("uc_a_ass", "Phân công Giảng viên phụ trách", 260, 650, 220, 50),
        ("uc_a_sch", "Xếp Thời khóa biểu toàn trường", 260, 730, 220, 50),
        ("uc_a_kpi", "Xem biểu đồ thống kê chỉ số đào tạo", 260, 810, 220, 50),
        ("uc_a_mon", "Theo dõi tiến độ vào điểm", 260, 890, 220, 50),
    ]
    for uid, uval, ux, uy, uw, uh in ucs_admin:
        add_cell(root, uid, uval, STYLE_UC_MAIN, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_a_{uid}", "", STYLE_ASSOC, edge=True, source="act_a", target=uid, geometry={'relative': 1})

    # Middle-bottom Column: Lecturer UCs
    ucs_lec = [
        ("uc_l_sch", "Tra cứu Lịch dạy theo tuần", 560, 710, 220, 50),
        ("uc_l_sec", "Xem danh sách sinh viên lớp", 560, 790, 220, 50),
        ("uc_l_grd", "Nhập điểm thành phần", 560, 870, 220, 50),
        ("uc_l_fin", "Chốt bảng điểm học phần", 560, 950, 220, 50),
    ]
    for uid, uval, ux, uy, uw, uh in ucs_lec:
        add_cell(root, uid, uval, STYLE_UC_MAIN, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_l_{uid}", "", STYLE_ASSOC, edge=True, source="act_l", target=uid, geometry={'relative': 1})

    # Right Column: Student UCs
    ucs_stu = [
        ("uc_s_sch", "Tra cứu Thời khóa biểu cá nhân", 880, 250, 230, 50),
        ("uc_s_search", "Tra cứu học phần mở trong kỳ", 880, 360, 230, 50),
        ("uc_s_enr", "Đăng ký lớp học phần", 880, 470, 230, 50),
        ("uc_s_drop", "Hủy đăng ký học phần", 880, 580, 230, 50),
        ("uc_s_trans", "Tra cứu Bảng điểm & Điểm tích lũy CPA", 880, 690, 230, 50),
    ]
    for uid, uval, ux, uy, uw, uh in ucs_stu:
        add_cell(root, uid, uval, STYLE_UC_MAIN, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_s_{uid}", "", STYLE_ASSOC, edge=True, source="act_s", target=uid, geometry={'relative': 1})

    # Include edge with NO black rectangle
    add_cell(root, "inc_enr_search", "«bao gồm»", STYLE_INC, edge=True, source="uc_s_enr", target="uc_s_search", geometry={'relative': 1})

    return model

def build_diagram_2_admin():
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': '1450', 'pageHeight': '1150', 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")

    # Boundary with top-left aligned title (leaves top center completely free!)
    add_cell(root, "b2", "PHÂN HỆ QUẢN TRỊ VIÊN", STYLE_BOUNDARY, vertex=True, geometry={'x': 220, 'y': 30, 'width': 1050, 'height': 1050})

    # Actor Admin
    add_cell(root, "act_a2", "Quản trị viên", STYLE_ACTOR, vertex=True, geometry={'x': 60, 'y': 480, 'width': 45, 'height': 80})

    # Column 1: Core UCs (Starts at y=110, safely below boundary title)
    main_ucs = [
        ("uc2_kpi", "Xem biểu đồ thống kê chỉ số đào tạo", 270, 110, 220, 50),
        ("uc2_subj", "Thêm và Cập nhật Môn học", 270, 210, 220, 50),
        ("uc2_sem", "Cấu hình Học kỳ & Hạn ĐKHP", 270, 300, 220, 50),
        ("uc2_dept", "Thiết lập Khoa & Lớp sinh hoạt", 270, 390, 220, 50),
        ("uc2_stu", "Thêm mới Hồ sơ Sinh viên", 270, 490, 220, 50),
        ("uc2_lec", "Thêm mới Hồ sơ Giảng viên", 270, 630, 220, 50),
        ("uc2_sec", "Mở mới Lớp học phần", 270, 740, 220, 50),
        ("uc2_sch", "Xếp Thời khóa biểu toàn trường", 270, 870, 220, 50),
        ("uc2_mon", "Theo dõi tiến độ vào điểm", 270, 960, 220, 50),
    ]
    for uid, uval, ux, uy, uw, uh in main_ucs:
        add_cell(root, uid, uval, STYLE_UC_MAIN, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_a2_{uid}", "", STYLE_ASSOC, edge=True, source="act_a2", target=uid, geometry={'relative': 1})

    # Column 2: Sub-cases (x=680 gives a 190px clean horizontal gap for dashed arrows and labels)
    # KPI sub-cases
    add_cell(root, "uc2_sub_fac", "Xem thống kê SV theo Khoa", STYLE_UC_SUB, vertex=True, geometry={'x': 680, 'y': 85, 'width': 220, 'height': 45})
    add_cell(root, "uc2_sub_stat", "Xem tỷ lệ trạng thái học tập", STYLE_UC_SUB, vertex=True, geometry={'x': 680, 'y': 145, 'width': 220, 'height': 45})
    add_cell(root, "inc_kpi1", "«bao gồm»", STYLE_INC, edge=True, source="uc2_kpi", target="uc2_sub_fac", geometry={'relative': 1})
    add_cell(root, "inc_kpi2", "«bao gồm»", STYLE_INC, edge=True, source="uc2_kpi", target="uc2_sub_stat", geometry={'relative': 1})

    # Student sub-cases
    add_cell(root, "uc2_sub_stuedit", "Sửa thông tin hồ sơ SV", STYLE_UC_SUB, vertex=True, geometry={'x': 680, 'y': 455, 'width': 220, 'height': 45})
    add_cell(root, "uc2_sub_stustat", "Thay đổi trạng thái đào tạo", STYLE_UC_SUB, vertex=True, geometry={'x': 680, 'y': 515, 'width': 220, 'height': 45})
    add_cell(root, "uc2_sub_stufilter", "Tìm kiếm và Lọc hồ sơ SV", STYLE_UC_SUB, vertex=True, geometry={'x': 680, 'y': 575, 'width': 220, 'height': 45})
    add_cell(root, "ext_stu1", "«mở rộng»", STYLE_EXT, edge=True, source="uc2_sub_stuedit", target="uc2_stu", geometry={'relative': 1})
    add_cell(root, "ext_stu2", "«mở rộng»", STYLE_EXT, edge=True, source="uc2_sub_stustat", target="uc2_stu", geometry={'relative': 1})
    add_cell(root, "inc_stu3", "«bao gồm»", STYLE_INC, edge=True, source="uc2_stu", target="uc2_sub_stufilter", geometry={'relative': 1})

    # Section sub-cases
    add_cell(root, "uc2_sub_secass", "Phân công Giảng viên phụ trách", STYLE_UC_SUB, vertex=True, geometry={'x': 680, 'y': 705, 'width': 230, 'height': 45})
    add_cell(root, "uc2_sub_seccfg", "Cấu hình Lịch học, Tiết và Phòng", STYLE_UC_SUB, vertex=True, geometry={'x': 680, 'y': 765, 'width': 230, 'height': 45})
    add_cell(root, "uc2_sub_secstat", "Đóng / Mở đợt đăng ký lớp", STYLE_UC_SUB, vertex=True, geometry={'x': 680, 'y': 825, 'width': 230, 'height': 45})
    add_cell(root, "inc_sec1", "«bao gồm»", STYLE_INC, edge=True, source="uc2_sec", target="uc2_sub_secass", geometry={'relative': 1})
    add_cell(root, "inc_sec2", "«bao gồm»", STYLE_INC, edge=True, source="uc2_sec", target="uc2_sub_seccfg", geometry={'relative': 1})
    add_cell(root, "ext_sec3", "«mở rộng»", STYLE_EXT, edge=True, source="uc2_sub_secstat", target="uc2_sec", geometry={'relative': 1})

    # Grade sub-case
    add_cell(root, "uc2_sub_viewgrd", "Xem chi tiết bảng điểm lớp HP", STYLE_UC_SUB, vertex=True, geometry={'x': 680, 'y': 960, 'width': 230, 'height': 50})
    add_cell(root, "inc_grd_view", "«bao gồm»", STYLE_INC, edge=True, source="uc2_mon", target="uc2_sub_viewgrd", geometry={'relative': 1})

    return model

def build_diagram_3_lecturer():
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': '1350', 'pageHeight': '880', 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")

    # Boundary
    add_cell(root, "b3", "PHÂN HỆ GIẢNG VIÊN", STYLE_BOUNDARY, vertex=True, geometry={'x': 220, 'y': 30, 'width': 980, 'height': 750})

    # Actor Lecturer
    add_cell(root, "act_l3", "Giảng viên", STYLE_ACTOR, vertex=True, geometry={'x': 60, 'y': 340, 'width': 45, 'height': 80})

    # Column 1: Main UCs
    main_ucs = [
        ("uc3_dash", "Xem Bảng điều khiển Giảng viên", 270, 90, 240, 50),
        ("uc3_sch", "Tra cứu Lịch dạy theo tuần", 270, 180, 240, 50),
        ("uc3_sec", "Tra cứu Danh sách lớp phụ trách", 270, 280, 240, 50),
        ("uc3_grd", "Nhập điểm thành phần (Chuyên cần, Giữa kỳ, Cuối kỳ)", 270, 410, 240, 55),
        ("uc3_prof", "Cập nhật thông tin cá nhân", 270, 540, 240, 50),
        ("uc3_pwd", "Đổi mật khẩu tài khoản", 270, 630, 240, 50),
    ]
    for uid, uval, ux, uy, uw, uh in main_ucs:
        add_cell(root, uid, uval, STYLE_UC_MAIN, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_l3_{uid}", "", STYLE_ASSOC, edge=True, source="act_l3", target=uid, geometry={'relative': 1})

    # Column 2: Sub-cases (Include & Extend)
    add_cell(root, "uc3_sub_stulist", "Xem Danh sách sinh viên theo lớp", STYLE_UC_SUB, vertex=True, geometry={'x': 680, 'y': 280, 'width': 240, 'height': 45})
    add_cell(root, "inc_sec_stu", "«bao gồm»", STYLE_INC, edge=True, source="uc3_sec", target="uc3_sub_stulist", geometry={'relative': 1})

    add_cell(root, "uc3_sub_calc", "Tính Điểm tổng kết & Quy đổi thang điểm", STYLE_UC_SUB, vertex=True, geometry={'x': 680, 'y': 370, 'width': 250, 'height': 50})
    add_cell(root, "uc3_sub_save", "Lưu tạm bảng điểm", STYLE_UC_SUB, vertex=True, geometry={'x': 680, 'y': 440, 'width': 210, 'height': 45})
    add_cell(root, "uc3_sub_fin", "Chốt bảng điểm học phần (Khóa sổ)", STYLE_UC_SUB, vertex=True, geometry={'x': 680, 'y': 510, 'width': 240, 'height': 50})

    add_cell(root, "inc_grd_calc", "«bao gồm»", STYLE_INC, edge=True, source="uc3_grd", target="uc3_sub_calc", geometry={'relative': 1})
    add_cell(root, "ext_grd_save", "«mở rộng»", STYLE_EXT, edge=True, source="uc3_sub_save", target="uc3_grd", geometry={'relative': 1})
    add_cell(root, "ext_grd_fin", "«mở rộng»", STYLE_EXT, edge=True, source="uc3_sub_fin", target="uc3_grd", geometry={'relative': 1})

    return model

def build_diagram_4_student():
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': '1400', 'pageHeight': '920', 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")

    # Boundary
    add_cell(root, "b4", "PHÂN HỆ SINH VIÊN", STYLE_BOUNDARY, vertex=True, geometry={'x': 220, 'y': 30, 'width': 980, 'height': 830})

    # Actor Student
    add_cell(root, "act_s4", "Sinh viên", STYLE_ACTOR, vertex=True, geometry={'x': 60, 'y': 380, 'width': 45, 'height': 80})

    # Column 1: Main UCs
    main_ucs = [
        ("uc4_dash", "Xem Bảng điều khiển tiến độ học tập", 270, 90, 240, 50),
        ("uc4_sch", "Tra cứu Thời khóa biểu tuần", 270, 180, 240, 50),
        ("uc4_enr", "Đăng ký lớp học phần", 270, 295, 240, 50),
        ("uc4_drop", "Hủy đăng ký học phần", 270, 440, 240, 50),
        ("uc4_trans", "Tra cứu Bảng điểm học tập", 270, 580, 240, 50),
        ("uc4_prof", "Xem và Cập nhật thông tin cá nhân", 270, 690, 240, 45),
        ("uc4_pwd", "Đổi mật khẩu tài khoản", 270, 760, 240, 45),
    ]
    for uid, uval, ux, uy, uw, uh in main_ucs:
        add_cell(root, uid, uval, STYLE_UC_MAIN, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_s4_{uid}", "", STYLE_ASSOC, edge=True, source="act_s4", target=uid, geometry={'relative': 1})

    # Column 2: Sub-cases (Includes)
    # Registration includes
    add_cell(root, "uc4_sub_search", "Tra cứu học phần mở trong kỳ", STYLE_UC_SUB, vertex=True, geometry={'x': 680, 'y': 265, 'width': 240, 'height': 45})
    add_cell(root, "uc4_sub_val", "Kiểm tra điều kiện (Sĩ số, Hạn, Tín chỉ)", STYLE_UC_SUB, vertex=True, geometry={'x': 680, 'y': 330, 'width': 240, 'height': 50})
    add_cell(root, "inc_enr_search", "«bao gồm»", STYLE_INC, edge=True, source="uc4_enr", target="uc4_sub_search", geometry={'relative': 1})
    add_cell(root, "inc_enr_val", "«bao gồm»", STYLE_INC, edge=True, source="uc4_enr", target="uc4_sub_val", geometry={'relative': 1})

    # Drop include
    add_cell(root, "uc4_sub_myenr", "Xem danh sách HP đã đăng ký", STYLE_UC_SUB, vertex=True, geometry={'x': 680, 'y': 440, 'width': 240, 'height': 45})
    add_cell(root, "inc_drop_myenr", "«bao gồm»", STYLE_INC, edge=True, source="uc4_drop", target="uc4_sub_myenr", geometry={'relative': 1})

    # Transcript includes
    add_cell(root, "uc4_sub_gpa", "Xem điểm GPA từng kỳ và CPA tích lũy", STYLE_UC_SUB, vertex=True, geometry={'x': 680, 'y': 550, 'width': 240, 'height': 45})
    add_cell(root, "uc4_sub_detail", "Xem chi tiết từng cột điểm (Chuyên cần, Giữa kỳ, Cuối kỳ)", STYLE_UC_SUB, vertex=True, geometry={'x': 680, 'y': 615, 'width': 240, 'height': 45})
    add_cell(root, "inc_trans_gpa", "«bao gồm»", STYLE_INC, edge=True, source="uc4_trans", target="uc4_sub_gpa", geometry={'relative': 1})
    add_cell(root, "inc_trans_det", "«bao gồm»", STYLE_INC, edge=True, source="uc4_trans", target="uc4_sub_detail", geometry={'relative': 1})

    return model

def save_single_diagram(filename, diag_id, diag_name, build_func):
    mxfile = ET.Element('mxfile', {
        'host': 'app.diagrams.net',
        'modified': '2026-09-10T02:00:00.000Z',
        'agent': 'Antigravity AI Agent',
        'version': '21.0.0',
        'type': 'device'
    })
    diag = ET.SubElement(mxfile, 'diagram', {'id': diag_id, 'name': diag_name})
    diag.append(build_func())
    
    xml_str = ET.tostring(mxfile, encoding='utf-8')
    parsed = minidom.parseString(xml_str)
    pretty_xml = parsed.toprettyxml(indent='  ', encoding='utf-8')

    with open(filename, 'wb') as f:
        f.write(pretty_xml)
    
    docs_path = os.path.join('docs', filename)
    with open(docs_path, 'wb') as f:
        f.write(pretty_xml)
    print(f"Saved: {filename} & {docs_path}")

def main():
    os.makedirs('docs', exist_ok=True)
    
    # 1. Multi-page diagram file
    multi_file = ET.Element('mxfile', {
        'host': 'app.diagrams.net',
        'modified': '2026-09-10T02:00:00.000Z',
        'agent': 'Antigravity AI Agent',
        'version': '21.0.0',
        'type': 'device'
    })

    d1 = ET.SubElement(multi_file, 'diagram', {'id': 'diag_overall', 'name': '1. Tổng quan toàn hệ thống'})
    d1.append(build_diagram_1_overall())

    d2 = ET.SubElement(multi_file, 'diagram', {'id': 'diag_admin', 'name': '2. Phân hệ Quản trị viên'})
    d2.append(build_diagram_2_admin())

    d3 = ET.SubElement(multi_file, 'diagram', {'id': 'diag_lecturer', 'name': '3. Phân hệ Giảng viên'})
    d3.append(build_diagram_3_lecturer())

    d4 = ET.SubElement(multi_file, 'diagram', {'id': 'diag_student', 'name': '4. Phân hệ Sinh viên'})
    d4.append(build_diagram_4_student())

    xml_str = ET.tostring(multi_file, encoding='utf-8')
    parsed = minidom.parseString(xml_str)
    pretty_xml = parsed.toprettyxml(indent='  ', encoding='utf-8')

    for path in ['HeThongQuanLySinhVien_UseCase.drawio', 'docs/HeThongQuanLySinhVien_UseCase.drawio']:
        with open(path, 'wb') as f:
            f.write(pretty_xml)
        print(f"Saved multi-page: {path}")

    # 2. Individual diagram files
    save_single_diagram('1_UseCase_TongQuan.drawio', 'diag_overall', '1. Tổng quan hệ thống', build_diagram_1_overall)
    save_single_diagram('2_UseCase_Admin.drawio', 'diag_admin', '2. Phân hệ Quản trị viên', build_diagram_2_admin)
    save_single_diagram('3_UseCase_GiangVien.drawio', 'diag_lecturer', '3. Phân hệ Giảng viên', build_diagram_3_lecturer)
    save_single_diagram('4_UseCase_SinhVien.drawio', 'diag_student', '4. Phân hệ Sinh viên', build_diagram_4_student)

if __name__ == '__main__':
    main()
