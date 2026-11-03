# -*- coding: utf-8 -*-
"""
Script to generate CLEAN, MINIMALIST, HIGH-CONTRAST Academic UML Draw.io diagrams.
Covers 100% of the Graduation Project (Đồ án chuyên ngành SMS):
1. Sơ đồ Use Case - Tổng quan toàn hệ thống (4 Tác nhân chính: Admin, Đào tạo, Giảng viên, Sinh viên)
2. Sơ đồ Use Case - Phân hệ Quản trị viên hệ thống (System Administrator)
3. Sơ đồ Use Case - Phân hệ Cán bộ Phòng Đào tạo (Academic Affairs Officer)
4. Sơ đồ Use Case - Phân hệ Giảng viên (Lecturer)
5. Sơ đồ Use Case - Phân hệ Sinh viên (Student)

Standards:
- Nền trắng (background="#ffffff"), không đổ bóng đen, không đè nhãn.
- Ranh giới hệ thống (system boundary) tiêu đề căn lề trái, trên cùng.
- Khoảng cách dọc và ngang rộng rãi (65-80px), không đè chồng hình elip.
- Nhãn «bao gồm» (include) và «mở rộng» (extend) rõ ràng, chuẩn UML 2.5.
- Đầy đủ mxGeometry relative=1 cho 100% các edge.
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
    
    if geometry is None and edge:
        geometry = {'relative': '1'}

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
# 1. TỔNG QUAN TOÀN HỆ THỐNG (4 TÁC NHÂN CHÍNH + NGƯỜI DÙNG KẾ THỪA)
# ==============================================================================
def build_diagram_1_overall():
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': '1600', 'pageHeight': '1120', 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")

    # Boundary
    add_cell(root, "b1", "HỆ THỐNG QUẢN LÝ ĐÀO TẠO & SINH VIÊN (SMS)", STYLE_BOUNDARY, vertex=True, geometry={'x': 180, 'y': 30, 'width': 1240, 'height': 1050})

    # 4 Actors đối xứng: 2 Bên trái (Admin, Đào tạo), 2 Bên phải (Giảng viên, Sinh viên)
    add_cell(root, "act_admin", "Quản trị viên\nhệ thống (Admin)", STYLE_ACTOR, vertex=True, geometry={'x': 45, 'y': 230, 'width': 45, 'height': 80})
    add_cell(root, "act_dt", "Cán bộ\nPhòng Đào tạo", STYLE_ACTOR, vertex=True, geometry={'x': 45, 'y': 730, 'width': 45, 'height': 80})
    add_cell(root, "act_lec", "Giảng viên\n(Lecturer)", STYLE_ACTOR, vertex=True, geometry={'x': 1505, 'y': 230, 'width': 45, 'height': 80})
    add_cell(root, "act_stu", "Sinh viên\n(Student)", STYLE_ACTOR, vertex=True, geometry={'x': 1505, 'y': 730, 'width': 45, 'height': 80})

    # 1. Quản trị viên hệ thống UCs (Admin) - Cột Trái Trên (x=240, w=300, h=45)
    ucs_admin = [
        ("uc_a_usr", "Quản lý Tài khoản & Phân quyền RBAC", 240, 90, 300, 45),
        ("uc_a_pwdreset", "Phê duyệt Cấp lại Mật khẩu An toàn", 240, 155, 300, 45),
        ("uc_a_audit", "Giám sát Nhật ký Kiểm toán Điểm số", 240, 220, 300, 45),
        ("uc_a_kpi", "Báo cáo Thống kê Toàn trường & KPI", 240, 285, 300, 45),
        ("uc_a_unlock", "Mở khóa Sổ điểm Khẩn cấp", 240, 350, 300, 45),
        ("uc_a_backup", "Sao lưu & Khôi phục Cơ sở dữ liệu", 240, 415, 300, 45),
    ]
    for uid, uval, ux, uy, uw, uh in ucs_admin:
        add_cell(root, uid, uval, STYLE_UC_MAIN, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_a_{uid}", "", STYLE_ASSOC, edge=True, source="act_admin", target=uid)

    # 2. Cán bộ Phòng Đào tạo UCs (Academic Affairs) - Cột Trái Dưới (x=240, w=300, h=45)
    ucs_dt = [
        ("uc_dt_dept", "Thiết lập Khoa, Ngành & Lớp sinh hoạt", 240, 520, 300, 45),
        ("uc_dt_subj", "Quản lý Môn học & Môn tiên quyết (DAG)", 240, 585, 300, 45),
        ("uc_dt_sem", "Cấu hình Học kỳ & Đợt ĐKHP (Waves)", 240, 650, 300, 45),
        ("uc_dt_sec", "Mở mới & Điều phối Lớp học phần", 240, 715, 300, 45),
        ("uc_dt_sch", "Xếp Thời khóa biểu & Chống xung đột", 240, 780, 300, 45),
        ("uc_dt_tuition", "Quản lý Cổng Thu ngân & Học phí SV", 240, 845, 300, 45),
        ("uc_dt_exam", "Tổ chức Thi & Phân bổ Phòng tự động", 240, 910, 300, 45),
        ("uc_dt_grad", "Thẩm định Tốt nghiệp theo Thông tư 08", 240, 975, 300, 45),
    ]
    for uid, uval, ux, uy, uw, uh in ucs_dt:
        add_cell(root, uid, uval, STYLE_UC_MAIN, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_dt_{uid}", "", STYLE_ASSOC, edge=True, source="act_dt", target=uid)

    # 3. Giảng viên UCs (Lecturer) - Cột Phải Trên (x=1060, w=300, h=45)
    ucs_lec = [
        ("uc_l_sch", "Tra cứu Lịch giảng dạy cá nhân tuần", 1060, 90, 300, 45),
        ("uc_l_sec", "Xem Danh sách SV & Hồ sơ lớp phụ trách", 1060, 155, 300, 45),
        ("uc_l_att", "Khởi tạo Điểm danh Mã PIN Trực tiếp", 1060, 220, 300, 45),
        ("uc_l_grd", "Nhập Điểm thành phần & Import Excel", 1060, 285, 300, 45),
        ("uc_l_fin", "Chốt & Công bố Bảng điểm (Hạn 7 ngày)", 1060, 350, 300, 45),
        ("uc_l_amend", "Lập Phiếu Đề xuất Đính chính điểm 3 cấp", 1060, 415, 300, 45),
        ("uc_l_appeal", "Tiếp nhận & Thẩm định Đơn Phúc khảo", 1060, 480, 300, 45),
    ]
    for uid, uval, ux, uy, uw, uh in ucs_lec:
        add_cell(root, uid, uval, STYLE_UC_MAIN, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_l_{uid}", "", STYLE_ASSOC, edge=True, source="act_lec", target=uid)

    # 4. Sinh viên UCs (Student) - Cột Phải Dưới (x=1060, w=300, h=45)
    ucs_stu = [
        ("uc_s_sch", "Tra cứu Thời khóa biểu tuần cá nhân", 1060, 520, 300, 45),
        ("uc_s_enr", "Đăng ký Lớp học phần (Khóa bi quan)", 1060, 585, 300, 45),
        ("uc_s_drop", "Hủy Đăng ký Lớp học phần trong đợt", 1060, 650, 300, 45),
        ("uc_s_trans", "Tra cứu Bảng điểm, GPA kỳ & CPA tích lũy", 1060, 715, 300, 45),
        ("uc_s_curric", "Xem Bản đồ Lộ trình Khung CTĐT", 1060, 780, 300, 45),
        ("uc_s_tuition", "Tra cứu Hóa đơn & Nộp học phí trực tuyến", 1060, 845, 300, 45),
        ("uc_s_att", "Check-in Điểm danh ca học bằng Mã PIN", 1060, 910, 300, 45),
        ("uc_s_appeal", "Nộp Đơn Phúc khảo Điểm thi trực tuyến", 1060, 975, 300, 45),
    ]
    for uid, uval, ux, uy, uw, uh in ucs_stu:
        add_cell(root, uid, uval, STYLE_UC_MAIN, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_s_{uid}", "", STYLE_ASSOC, edge=True, source="act_stu", target=uid)

    return model

def build_diagram_2_admin():
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': '1550', 'pageHeight': '1150', 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")

    # Boundary
    add_cell(root, "b2", "PHÂN HỆ QUẢN TRỊ VIÊN HỆ THỐNG (SYSTEM ADMIN)", STYLE_BOUNDARY, vertex=True, geometry={'x': 210, 'y': 30, 'width': 1180, 'height': 1050})

    # Actor Admin
    add_cell(root, "act_a2", "Quản trị viên\nhệ thống", STYLE_ACTOR, vertex=True, geometry={'x': 60, 'y': 480, 'width': 45, 'height': 80})

    # Column 1: Core UCs
    main_ucs = [
        ("uc2_kpi", "Báo cáo thống kê toàn trường & Dashboard", 260, 90, 260, 48),
        ("uc2_user", "Quản lý Tài khoản & Phân quyền RBAC", 260, 220, 260, 48),
        ("uc2_pwdreset", "Quản trị & Phê duyệt cấp lại Mật khẩu", 260, 380, 260, 48),
        ("uc2_audit", "Giám sát Nhật ký Kiểm toán Điểm số", 260, 540, 260, 48),
        ("uc2_conduct", "Quản lý Điểm rèn luyện & Kỷ luật", 260, 700, 260, 48),
        ("uc2_unlock", "Quản trị phân quyền & Mở khóa sổ điểm", 260, 860, 260, 48),
    ]
    for uid, uval, ux, uy, uw, uh in main_ucs:
        add_cell(root, uid, uval, STYLE_UC_MAIN, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_a2_{uid}", "", STYLE_ASSOC, edge=True, source="act_a2", target=uid)

    # Column 2: Sub-cases (Include & Extend)
    # 1. KPI
    add_cell(root, "uc2_sub_fac", "Xem phân bố SV theo Khoa", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 70, 'width': 240, 'height': 45})
    add_cell(root, "uc2_sub_stat", "Xem tỷ lệ trạng thái đào tạo", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 125, 'width': 240, 'height': 45})
    add_cell(root, "inc_kpi1", "«bao gồm»", STYLE_INC, edge=True, source="uc2_kpi", target="uc2_sub_fac")
    add_cell(root, "inc_kpi2", "«bao gồm»", STYLE_INC, edge=True, source="uc2_kpi", target="uc2_sub_stat")

    # 2. User & RBAC
    add_cell(root, "uc2_sub_lock", "Khóa / Mở khóa tài khoản đăng nhập", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 180, 'width': 260, 'height': 42})
    add_cell(root, "uc2_sub_role", "Cấu hình vai trò & Quyền hạn", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 230, 'width': 260, 'height': 42})
    add_cell(root, "uc2_sub_staff", "Quản lý Cán bộ & Nhân viên (Staff)", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 280, 'width': 260, 'height': 42})
    add_cell(root, "inc_user_lock", "«bao gồm»", STYLE_INC, edge=True, source="uc2_user", target="uc2_sub_lock")
    add_cell(root, "inc_user_role", "«bao gồm»", STYLE_INC, edge=True, source="uc2_user", target="uc2_sub_role")
    add_cell(root, "inc_user_staff", "«bao gồm»", STYLE_INC, edge=True, source="uc2_user", target="uc2_sub_staff")

    # 3. Password Reset
    add_cell(root, "uc2_sub_mask", "Bảo vệ thông tin & Ẩn danh Email", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 345, 'width': 260, 'height': 42})
    add_cell(root, "uc2_sub_genpwd", "Sinh mật khẩu ngẫu nhiên an toàn 8 ký tự", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 395, 'width': 260, 'height': 42})
    add_cell(root, "uc2_sub_bulkpwd", "Đặt lại mật khẩu toàn trường (ddmmyyyya@)", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 445, 'width': 260, 'height': 42})
    add_cell(root, "inc_pwd_mask", "«bao gồm»", STYLE_INC, edge=True, source="uc2_pwdreset", target="uc2_sub_mask")
    add_cell(root, "inc_pwd_gen", "«bao gồm»", STYLE_INC, edge=True, source="uc2_pwdreset", target="uc2_sub_genpwd")
    add_cell(root, "ext_pwd_bulk", "«mở rộng»", STYLE_EXT, edge=True, source="uc2_sub_bulkpwd", target="uc2_pwdreset")

    # 4. Audit Log
    add_cell(root, "uc2_sub_logtrace", "Truy vết người sửa, điểm cũ, điểm mới", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 515, 'width': 250, 'height': 45})
    add_cell(root, "uc2_sub_logip", "Lưu vết thời điểm & Địa chỉ IP truy cập", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 570, 'width': 250, 'height': 45})
    add_cell(root, "inc_log_trace", "«bao gồm»", STYLE_INC, edge=True, source="uc2_audit", target="uc2_sub_logtrace")
    add_cell(root, "inc_log_ip", "«bao gồm»", STYLE_INC, edge=True, source="uc2_audit", target="uc2_sub_logip")

    # 5. Conduct
    add_cell(root, "uc2_sub_conduct_sc", "Tính điểm rèn luyện theo thang điểm chuẩn", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 675, 'width': 250, 'height': 45})
    add_cell(root, "uc2_sub_conduct_dis", "Ghi nhận Quyết định Khen thưởng / Kỷ luật", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 730, 'width': 250, 'height': 45})
    add_cell(root, "inc_conduct_sc", "«bao gồm»", STYLE_INC, edge=True, source="uc2_conduct", target="uc2_sub_conduct_sc")
    add_cell(root, "inc_conduct_dis", "«bao gồm»", STYLE_INC, edge=True, source="uc2_conduct", target="uc2_sub_conduct_dis")

    # 6. Unlock
    add_cell(root, "uc2_sub_overdue", "Mở khóa sổ điểm đã quá hạn 7 ngày", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 860, 'width': 250, 'height': 45})
    add_cell(root, "ext_unlock_over", "«mở rộng»", STYLE_EXT, edge=True, source="uc2_sub_overdue", target="uc2_unlock")

    return model

# ==============================================================================
# 3. PHÂN HỆ CÁN BỘ PHÒNG ĐÀO TẠO (ACADEMIC AFFAIRS)
# ==============================================================================
def build_diagram_3_academic():
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': '1550', 'pageHeight': '1450', 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")

    # Boundary
    add_cell(root, "b3", "PHÂN HỆ CÁN BỘ PHÒNG ĐÀO TẠO (ACADEMIC AFFAIRS)", STYLE_BOUNDARY, vertex=True, geometry={'x': 210, 'y': 30, 'width': 1180, 'height': 1360})

    # Actor Academic Affairs
    add_cell(root, "act_dt3", "Cán bộ\nPhòng Đào tạo", STYLE_ACTOR, vertex=True, geometry={'x': 60, 'y': 620, 'width': 45, 'height': 80})

    # Column 1: Main Academic UCs
    main_ucs = [
        ("uc3_dept", "Quản lý Cơ cấu Khoa & Lớp sinh hoạt", 260, 80, 250, 48),
        ("uc3_subj", "Quản lý Môn học & Môn tiên quyết", 260, 195, 250, 48),
        ("uc3_sem", "Cấu hình Học kỳ & Đợt ĐKHP (Waves)", 260, 310, 250, 48),
        ("uc3_sec", "Mở mới & Điều phối Lớp học phần", 260, 435, 250, 48),
        ("uc3_sch", "Xếp Thời khóa biểu & Chống xung đột", 260, 560, 250, 48),
        ("uc3_tuition", "Quản lý & Thu học phí sinh viên", 260, 685, 250, 48),
        ("uc3_exam", "Tổ chức thi & Phân bổ phòng tự động", 260, 810, 250, 48),
        ("uc3_warn", "Quản lý Cảnh báo học vụ 3 mức độ", 260, 935, 250, 48),
        ("uc3_grad", "Thẩm định tốt nghiệp theo Thông tư 08", 260, 1070, 250, 48),
    ]
    for uid, uval, ux, uy, uw, uh in main_ucs:
        add_cell(root, uid, uval, STYLE_UC_MAIN, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_dt3_{uid}", "", STYLE_ASSOC, edge=True, source="act_dt3", target=uid)

    # Column 2: Sub-cases
    # 1. Dept & Class
    add_cell(root, "uc3_sub_batchclass", "Sinh mã lớp SH hàng loạt theo khóa", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 80, 'width': 250, 'height': 45})
    add_cell(root, "ext_batch_class", "«mở rộng»", STYLE_EXT, edge=True, source="uc3_sub_batchclass", target="uc3_dept")

    # 2. Subject
    add_cell(root, "uc3_sub_prereq", "Cấu hình môn học tiên quyết bắt buộc", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 195, 'width': 250, 'height': 45})
    add_cell(root, "inc_subj_pre", "«bao gồm»", STYLE_INC, edge=True, source="uc3_subj", target="uc3_sub_prereq")

    # 3. Semester & Waves
    add_cell(root, "uc3_sub_currsem", "Kích hoạt Học kỳ hiện tại", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 285, 'width': 250, 'height': 45})
    add_cell(root, "uc3_sub_wave", "Mở đợt đăng ký theo Khóa/Khoa", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 340, 'width': 250, 'height': 45})
    add_cell(root, "inc_sem1", "«bao gồm»", STYLE_INC, edge=True, source="uc3_sem", target="uc3_sub_currsem")
    add_cell(root, "inc_sem2", "«bao gồm»", STYLE_INC, edge=True, source="uc3_sem", target="uc3_sub_wave")

    # 4. Course Section
    add_cell(root, "uc3_sub_secass", "Phân công Giảng viên phụ trách", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 410, 'width': 250, 'height': 45})
    add_cell(root, "uc3_sub_seccfg", "Cấu hình ca học & Sĩ số tối đa", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 465, 'width': 250, 'height': 45})
    add_cell(root, "inc_sec1", "«bao gồm»", STYLE_INC, edge=True, source="uc3_sec", target="uc3_sub_secass")
    add_cell(root, "inc_sec2", "«bao gồm»", STYLE_INC, edge=True, source="uc3_sec", target="uc3_sub_seccfg")

    # 5. Schedules
    add_cell(root, "uc3_sub_schroom", "Quét xung đột phòng học", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 535, 'width': 250, 'height': 45})
    add_cell(root, "uc3_sub_schlec", "Quét trùng lịch giảng viên", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 590, 'width': 250, 'height': 45})
    add_cell(root, "inc_sch1", "«bao gồm»", STYLE_INC, edge=True, source="uc3_sch", target="uc3_sub_schroom")
    add_cell(root, "inc_sch2", "«bao gồm»", STYLE_INC, edge=True, source="uc3_sch", target="uc3_sub_schlec")

    # 6. Tuition
    add_cell(root, "uc3_sub_tuition_pay", "Thu tiền mặt tại quầy & Xuất biên lai", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 660, 'width': 250, 'height': 45})
    add_cell(root, "uc3_sub_tuition_ext", "Xét duyệt đơn xin gia hạn học phí", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 715, 'width': 250, 'height': 45})
    add_cell(root, "inc_tui_pay", "«bao gồm»", STYLE_INC, edge=True, source="uc3_tuition", target="uc3_sub_tuition_pay")
    add_cell(root, "ext_tui_ext", "«mở rộng»", STYLE_EXT, edge=True, source="uc3_sub_tuition_ext", target="uc3_tuition")

    # 7. Exam
    add_cell(root, "uc3_sub_roster", "Tự động chia phòng thi & Đánh SBD", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 785, 'width': 250, 'height': 45})
    add_cell(root, "uc3_sub_examimport", "Import bảng điểm rọc phách từ Excel", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 840, 'width': 250, 'height': 45})
    add_cell(root, "inc_exam_roster", "«bao gồm»", STYLE_INC, edge=True, source="uc3_exam", target="uc3_sub_roster")
    add_cell(root, "ext_exam_import", "«mở rộng»", STYLE_EXT, edge=True, source="uc3_sub_examimport", target="uc3_exam")

    # 8. Warnings
    add_cell(root, "uc3_sub_warnfilter", "Quét tự động sinh viên theo CPA", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 910, 'width': 250, 'height': 45})
    add_cell(root, "uc3_sub_warnexport", "Xuất danh sách xử lý học vụ CSV", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 965, 'width': 250, 'height': 45})
    add_cell(root, "inc_warn_filter", "«bao gồm»", STYLE_INC, edge=True, source="uc3_warn", target="uc3_sub_warnfilter")
    add_cell(root, "ext_warn_export", "«mở rộng»", STYLE_EXT, edge=True, source="uc3_sub_warnexport", target="uc3_warn")

    # 9. Graduation TT08
    add_cell(root, "uc3_sub_gradaudit", "Degree Audit Engine đối soát 7 tiêu chí", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 1045, 'width': 260, 'height': 45})
    add_cell(root, "uc3_sub_graddec", "Xuất Quyết định tốt nghiệp & Sổ cấp bằng", STYLE_UC_SUB, vertex=True, geometry={'x': 740, 'y': 1100, 'width': 260, 'height': 45})
    add_cell(root, "inc_grad_audit", "«bao gồm»", STYLE_INC, edge=True, source="uc3_grad", target="uc3_sub_gradaudit")
    add_cell(root, "ext_grad_dec", "«mở rộng»", STYLE_EXT, edge=True, source="uc3_sub_graddec", target="uc3_grad")

    return model

# ==============================================================================
# 4. PHÂN HỆ GIẢNG VIÊN (LECTURER)
# ==============================================================================
def build_diagram_4_lecturer():
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': '1420', 'pageHeight': '1150', 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")

    # Boundary
    add_cell(root, "b4", "PHÂN HỆ GIẢNG VIÊN (LECTURER)", STYLE_BOUNDARY, vertex=True, geometry={'x': 210, 'y': 30, 'width': 1050, 'height': 1060})

    # Actor Lecturer
    add_cell(root, "act_l4", "Giảng viên", STYLE_ACTOR, vertex=True, geometry={'x': 60, 'y': 500, 'width': 45, 'height': 80})

    # Column 1: Main UCs
    main_ucs = [
        ("uc4_dash", "Xem Bảng điều khiển Giảng viên", 260, 85, 250, 48),
        ("uc4_sch", "Tra cứu Lịch dạy theo tuần", 260, 175, 250, 48),
        ("uc4_sec", "Quản lý Danh sách lớp phụ trách", 260, 265, 250, 48),
        ("uc4_grd", "Nhập điểm thành phần (CC, GK, CK)", 260, 375, 250, 48),
        ("uc4_fin", "Chốt & Công bố bảng điểm học phần", 260, 500, 250, 48),
        ("uc4_att", "Quản lý Điểm danh lớp học", 260, 625, 250, 48),
        ("uc4_appeal", "Xét duyệt & Chấm phúc khảo điểm", 260, 745, 250, 48),
        ("uc4_amend", "Lập đơn Đính chính điểm 3 cấp", 260, 865, 250, 48),
        ("uc4_prof", "Xem hồ sơ & Đổi mật khẩu cá nhân", 260, 975, 250, 48),
    ]
    for uid, uval, ux, uy, uw, uh in main_ucs:
        add_cell(root, uid, uval, STYLE_UC_MAIN, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_l4_{uid}", "", STYLE_ASSOC, edge=True, source="act_l4", target=uid)

    # Column 2: Sub-cases
    # Dashboard
    add_cell(root, "uc4_sub_dashstat", "Thống kê sĩ số và tiến độ các lớp dạy", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 85, 'width': 260, 'height': 45})
    add_cell(root, "inc_dash_stat", "«bao gồm»", STYLE_INC, edge=True, source="uc4_dash", target="uc4_sub_dashstat")

    # Schedule
    add_cell(root, "uc4_sub_schdetail", "Xem phòng học, ca dạy và sĩ số", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 175, 'width': 260, 'height': 45})
    add_cell(root, "inc_sch_detail", "«bao gồm»", STYLE_INC, edge=True, source="uc4_sch", target="uc4_sub_schdetail")

    # Section
    add_cell(root, "uc4_sub_stulist", "Xem & Xuất danh sách SV ra Excel", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 265, 'width': 260, 'height': 45})
    add_cell(root, "inc_sec_stu", "«bao gồm»", STYLE_INC, edge=True, source="uc4_sec", target="uc4_sub_stulist")

    # Grade Entry
    add_cell(root, "uc4_sub_calc", "Tự động tính điểm TK, hệ 4 và điểm chữ", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 340, 'width': 260, 'height': 45})
    add_cell(root, "uc4_sub_save", "Lưu tạm bản nháp sổ điểm", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 395, 'width': 230, 'height': 45})
    add_cell(root, "uc4_sub_excel", "Import điểm từ file mẫu Excel", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 450, 'width': 230, 'height': 45})
    add_cell(root, "inc_grd_calc", "«bao gồm»", STYLE_INC, edge=True, source="uc4_grd", target="uc4_sub_calc")
    add_cell(root, "ext_grd_save", "«mở rộng»", STYLE_EXT, edge=True, source="uc4_sub_save", target="uc4_grd")
    add_cell(root, "ext_grd_excel", "«mở rộng»", STYLE_EXT, edge=True, source="uc4_sub_excel", target="uc4_grd")

    # Finalize & 7-day
    add_cell(root, "uc4_sub_check100", "Kiểm tra điều kiện 100% SV đủ điểm", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 505, 'width': 260, 'height': 45})
    add_cell(root, "uc4_sub_edit7d", "Chỉnh sửa điểm trong cửa sổ 7 ngày", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 560, 'width': 260, 'height': 45})
    add_cell(root, "inc_grd_100", "«bao gồm»", STYLE_INC, edge=True, source="uc4_fin", target="uc4_sub_check100")
    add_cell(root, "ext_grd_7d", "«mở rộng»", STYLE_EXT, edge=True, source="uc4_sub_edit7d", target="uc4_fin")

    # Attendance
    add_cell(root, "uc4_sub_att_live", "Mở phiên realtime & Phát mã PIN 6 số", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 620, 'width': 260, 'height': 45})
    add_cell(root, "uc4_sub_att_manual", "Chốt sĩ số & Ghi nhận vắng/muộn", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 675, 'width': 260, 'height': 45})
    add_cell(root, "inc_att_live", "«bao gồm»", STYLE_INC, edge=True, source="uc4_att", target="uc4_sub_att_live")
    add_cell(root, "inc_att_manual", "«bao gồm»", STYLE_INC, edge=True, source="uc4_att", target="uc4_sub_att_manual")

    # Grade Appeal
    add_cell(root, "uc4_sub_appealview", "Xem đơn phúc khảo & lý do của SV", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 735, 'width': 260, 'height': 45})
    add_cell(root, "uc4_sub_appealupdate", "Cập nhật điểm phúc khảo & Lý do", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 790, 'width': 260, 'height': 45})
    add_cell(root, "inc_app_view", "«bao gồm»", STYLE_INC, edge=True, source="uc4_appeal", target="uc4_sub_appealview")
    add_cell(root, "ext_app_update", "«mở rộng»", STYLE_EXT, edge=True, source="uc4_sub_appealupdate", target="uc4_appeal")

    # Amendment
    add_cell(root, "uc4_sub_amend_proof", "Tải minh chứng bài thi scan & Giải trình", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 865, 'width': 260, 'height': 45})
    add_cell(root, "inc_amend_proof", "«bao gồm»", STYLE_INC, edge=True, source="uc4_amend", target="uc4_sub_amend_proof")

    return model

# ==============================================================================
# 5. PHÂN HỆ SINH VIÊN (STUDENT)
# ==============================================================================
def build_diagram_5_student():
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': '1420', 'pageHeight': '1180', 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")

    # Boundary
    add_cell(root, "b5", "PHÂN HỆ SINH VIÊN (STUDENT)", STYLE_BOUNDARY, vertex=True, geometry={'x': 210, 'y': 30, 'width': 1050, 'height': 1100})

    # Actor Student
    add_cell(root, "act_s5", "Sinh viên", STYLE_ACTOR, vertex=True, geometry={'x': 60, 'y': 500, 'width': 45, 'height': 80})

    # Column 1: Main UCs
    main_ucs = [
        ("uc5_dash", "Xem Bảng điều khiển tiến độ học tập", 260, 80, 250, 48),
        ("uc5_sch", "Tra cứu Thời khóa biểu dạng tuần", 260, 165, 250, 48),
        ("uc5_enr", "Đăng ký lớp học phần trong kỳ", 260, 275, 250, 48),
        ("uc5_drop", "Hủy đăng ký học phần", 260, 410, 250, 48),
        ("uc5_trans", "Tra cứu Bảng điểm học tập", 260, 525, 250, 48),
        ("uc5_curric", "Xem Lộ trình khung chương trình đào tạo", 260, 635, 250, 48),
        ("uc5_appeal", "Gửi đơn phúc khảo điểm học phần", 260, 745, 250, 48),
        ("uc5_tuition", "Tra cứu & Thanh toán học phí", 260, 845, 250, 48),
        ("uc5_att", "Điểm danh trực tiếp (Check-in)", 260, 955, 250, 48),
        ("uc5_prof", "Xem hồ sơ & Đổi mật khẩu cá nhân", 260, 1030, 250, 48),
    ]
    for uid, uval, ux, uy, uw, uh in main_ucs:
        add_cell(root, uid, uval, STYLE_UC_MAIN, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_s5_{uid}", "", STYLE_ASSOC, edge=True, source="act_s5", target=uid)

    # Column 2: Sub-cases
    # Dashboard
    add_cell(root, "uc5_sub_dash", "Theo dõi GPA/CPA và tín chỉ tích lũy", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 80, 'width': 260, 'height': 45})
    add_cell(root, "inc_dash_gpa", "«bao gồm»", STYLE_INC, edge=True, source="uc5_dash", target="uc5_sub_dash")

    # Schedule
    add_cell(root, "uc5_sub_sch", "Xem chi tiết ca học, phòng & GV", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 165, 'width': 260, 'height': 45})
    add_cell(root, "inc_sch_ca", "«bao gồm»", STYLE_INC, edge=True, source="uc5_sch", target="uc5_sub_sch")

    # Enrollment
    add_cell(root, "uc5_sub_search", "Tra cứu học phần đang mở trong kỳ", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 245, 'width': 260, 'height': 45})
    add_cell(root, "uc5_sub_val", "Kiểm tra tiên quyết, sĩ số & trùng lịch", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 300, 'width': 260, 'height': 45})
    add_cell(root, "uc5_sub_smart", "Trợ lý xếp TKB thông minh (Backtracking)", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 355, 'width': 260, 'height': 45})
    add_cell(root, "inc_enr_search", "«bao gồm»", STYLE_INC, edge=True, source="uc5_enr", target="uc5_sub_search")
    add_cell(root, "inc_enr_val", "«bao gồm»", STYLE_INC, edge=True, source="uc5_enr", target="uc5_sub_val")
    add_cell(root, "ext_enr_smart", "«mở rộng»", STYLE_EXT, edge=True, source="uc5_sub_smart", target="uc5_enr")

    # Drop
    add_cell(root, "uc5_sub_myenr", "Xem danh sách học phần đã đăng ký", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 410, 'width': 260, 'height': 45})
    add_cell(root, "uc5_sub_nodiem", "Kiểm tra điều kiện chưa có điểm thi", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 465, 'width': 260, 'height': 45})
    add_cell(root, "inc_drop_myenr", "«bao gồm»", STYLE_INC, edge=True, source="uc5_drop", target="uc5_sub_myenr")
    add_cell(root, "inc_drop_nodiem", "«bao gồm»", STYLE_INC, edge=True, source="uc5_drop", target="uc5_sub_nodiem")

    # Transcript
    add_cell(root, "uc5_sub_gpa", "Theo dõi GPA từng kỳ và CPA tích lũy", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 520, 'width': 260, 'height': 45})
    add_cell(root, "uc5_sub_detail", "Xem chi tiết từng cột điểm thành phần", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 575, 'width': 260, 'height': 45})
    add_cell(root, "inc_trans_gpa", "«bao gồm»", STYLE_INC, edge=True, source="uc5_trans", target="uc5_sub_gpa")
    add_cell(root, "inc_trans_det", "«bao gồm»", STYLE_INC, edge=True, source="uc5_trans", target="uc5_sub_detail")

    # Curriculum
    add_cell(root, "uc5_sub_curric", "Xem tiến độ tích lũy theo khối kiến thức", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 635, 'width': 260, 'height': 45})
    add_cell(root, "inc_curric_det", "«bao gồm»", STYLE_INC, edge=True, source="uc5_curric", target="uc5_sub_curric")

    # Grade Appeal
    add_cell(root, "uc5_sub_appnew", "Chọn thành phần điểm & Nhập lý do", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 720, 'width': 260, 'height': 45})
    add_cell(root, "uc5_sub_appstat", "Theo dõi trạng thái xét duyệt phúc khảo", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 775, 'width': 260, 'height': 45})
    add_cell(root, "inc_app_new", "«bao gồm»", STYLE_INC, edge=True, source="uc5_appeal", target="uc5_sub_appnew")
    add_cell(root, "ext_app_stat", "«mở rộng»", STYLE_EXT, edge=True, source="uc5_sub_appstat", target="uc5_appeal")

    # Tuition
    add_cell(root, "uc5_sub_tuidet", "Xem bảng kê học phí theo tín chỉ", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 840, 'width': 260, 'height': 45})
    add_cell(root, "uc5_sub_tuipay", "Nộp học phí trực tuyến & Nhận biên lai", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 895, 'width': 260, 'height': 45})
    add_cell(root, "inc_tui_det", "«bao gồm»", STYLE_INC, edge=True, source="uc5_tuition", target="uc5_sub_tuidet")
    add_cell(root, "ext_tui_pay", "«mở rộng»", STYLE_EXT, edge=True, source="uc5_sub_tuipay", target="uc5_tuition")

    # Attendance
    add_cell(root, "uc5_sub_att_pin", "Nhập mã PIN xác nhận có mặt", STYLE_UC_SUB, vertex=True, geometry={'x': 700, 'y': 955, 'width': 260, 'height': 45})
    add_cell(root, "inc_stu_att", "«bao gồm»", STYLE_INC, edge=True, source="uc5_att", target="uc5_sub_att_pin")

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

    # Multi-page UseCase_Diagrams.drawio (5 Tabs)
    multi_file = ET.Element('mxfile', {
        'host': 'app.diagrams.net',
        'modified': '2026-10-28T00:00:00.000Z',
        'agent': 'Antigravity AI Agent',
        'version': '24.0.0',
        'type': 'device'
    })

    tabs = [
        ('uc_overall', '1. Tổng quan toàn hệ thống', build_diagram_1_overall()),
        ('uc_admin', '2. Phân hệ Quản trị viên hệ thống', build_diagram_2_admin()),
        ('uc_academic', '3. Phân hệ Cán bộ Phòng Đào tạo', build_diagram_3_academic()),
        ('uc_lecturer', '4. Phân hệ Giảng viên', build_diagram_4_lecturer()),
        ('uc_student', '5. Phân hệ Sinh viên', build_diagram_5_student())
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
    print(f"✓ Saved multi-page UseCase diagram (5 tabs): {target_path}")

    # Individual single-tab drawio files in drawio/
    save_single_diagram('1_UseCase_TongQuan.drawio', 'uc_overall', '1. Tổng quan toàn hệ thống', build_diagram_1_overall)
    save_single_diagram('2_UseCase_Admin.drawio', 'uc_admin', '2. Phân hệ Quản trị viên hệ thống', build_diagram_2_admin)
    save_single_diagram('3_UseCase_DaoTao.drawio', 'uc_academic', '3. Phân hệ Cán bộ Phòng Đào tạo', build_diagram_3_academic)
    save_single_diagram('4_UseCase_GiangVien.drawio', 'uc_lecturer', '4. Phân hệ Giảng viên', build_diagram_4_lecturer)
    save_single_diagram('5_UseCase_SinhVien.drawio', 'uc_student', '5. Phân hệ Sinh viên', build_diagram_5_student)

if __name__ == '__main__':
    main()
