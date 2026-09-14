# -*- coding: utf-8 -*-
"""
Biểu đồ Hoạt động (UML Activity Diagrams) chuẩn học thuật độ phân giải cao:
Thiết kế theo mô hình 2 làn bơi (Swimlanes):
- Làn 1 (Tác nhân): Người dùng / Quản trị viên / Giảng viên / Sinh viên
- Làn 2 (Hệ thống): Ứng dụng Web SMS & CSDL MySQL

Quy chuẩn thiết kế đỉnh cao (Clear - Crisp - Beautiful - Academic UML 2.5):
1. Grid căn chỉnh chuẩn từng pixel:
   - Trục tâm làn Tác nhân: x = 240 (Hộp tác vụ x=140, w=200)
   - Trục chính làn Hệ thống: x = 620 (Hộp tác vụ x=510, w=220; Hình thoi x=555, w=130)
   - Trục nhánh rẽ lỗi Hệ thống: x = 910 (Hộp lỗi x=810, w=200)
2. 100% mũi tên trực giao thẳng thớm (Orthogonal):
   - Mũi tên tiến trình chính đi thẳng đứng xuống (x1 == x2).
   - Mũi tên tương tác qua lại giữa 2 làn đi ngang chuẩn xác (y1 == y2).
   - Mũi tên rẽ nhánh rẽ ngang sang phải không bao giờ cắt qua các hộp khác.
3. Độ tương phản cao, 100% Trắng & Đen (Monochrome):
   - fillColor=#ffffff, strokeColor=#000000, fontColor=#000000.
   - Nhãn điều kiện rẽ nhánh [Hợp lệ], [Không hợp lệ] có labelBackgroundColor=#ffffff không bị đường kẻ cắt ngang chữ.
4. Độc lập 16 tab chức năng nghiệp vụ, khớp 100% với mã nguồn dự án thực tế.
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

# --- STYLES (MONOCHROME, ELEGANT, CRISP) ---
STYLE_TITLE = "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontStyle=1;fontSize=14;fontColor=#000000;"
STYLE_SUBTITLE = "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontStyle=2;fontSize=11;fontColor=#333333;"
STYLE_START = "ellipse;html=1;shape=startState;fillColor=#000000;strokeColor=#000000;"
STYLE_END = "ellipse;html=1;shape=endState;fillColor=#ffffff;strokeColor=#000000;strokeWidth=2;"
STYLE_ACTIVITY = "rounded=1;whiteSpace=wrap;html=1;arcSize=20;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=11;fontColor=#000000;spacing=4;"
STYLE_DECISION = "rhombus;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=10;fontColor=#000000;spacing=2;"
STYLE_SWIMLANE = "swimlane;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=12;fontColor=#000000;startSize=30;collapsible=0;recursiveResize=0;"
STYLE_FLOW = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;strokeColor=#000000;strokeWidth=1.5;labelBackgroundColor=#ffffff;labelBorderColor=none;fillColor=none;fontColor=#000000;fontSize=10;fontStyle=1;"

def create_base_model(page_w=1180, page_h=980):
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': str(page_w), 'pageHeight': str(page_h), 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")
    return model, root

def setup_activity_header(root, title_text, subtitle_text, actor_name, sys_name="Hệ thống (Web App & CSDL MySQL)", lane_h=830):
    add_cell(root, "t", title_text, STYLE_TITLE, vertex=True, geometry={'x': 40, 'y': 20, 'width': 850, 'height': 25})
    add_cell(root, "st", subtitle_text, STYLE_SUBTITLE, vertex=True, geometry={'x': 40, 'y': 48, 'width': 950, 'height': 20})

    # Lane 1 (Actor): x=50, w=380. Center = 240
    add_cell(root, "lane_act", actor_name, STYLE_SWIMLANE, vertex=True, geometry={'x': 50, 'y': 75, 'width': 380, 'height': lane_h})
    # Lane 2 (System): x=430, w=660. Center = 620, Branch Center = 910
    add_cell(root, "lane_sys", sys_name, STYLE_SWIMLANE, vertex=True, geometry={'x': 430, 'y': 75, 'width': 660, 'height': lane_h})

# ==========================================
# 1. ĐĂNG NHẬP HỆ THỐNG (LOGIN)
# ==========================================
def build_act_1_login():
    model, root = create_base_model(1180, 1020)
    setup_activity_header(root, "2.2.2.1 BIỂU ĐỒ HOẠT ĐỘNG: ĐĂNG NHẬP & XÁC THỰC HỆ THỐNG",
                          "Quy trình xác thực danh tính người dùng bằng mã hóa BCrypt, cấp JWT token và điều hướng giao diện theo vai trò",
                          "Người dùng (Admin / Giảng viên / Sinh viên)", "Hệ thống (AuthService & Spring Security)", lane_h=890)

    # Actor Lane (Center x=240)
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_open", "Truy cập màn hình Đăng nhập\n(/login)", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_input", "Nhập Tên tài khoản\n& Mật khẩu", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 250, 'width': 200, 'height': 45})
    add_cell(root, "act_click", "Bấm nút Đăng nhập", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 325, 'width': 200, 'height': 45})
    add_cell(root, "act_redirect", "Lưu Token vào LocalStorage\n& Điều hướng màn hình Dashboard", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 800, 'width': 200, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 880, 'width': 25, 'height': 25})

    # System Lane (Spine Center x=620, Error Center x=910)
    add_cell(root, "act_val", "Kiểm tra hợp lệ dữ liệu Form\n(Client-side Validation)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 325, 'width': 220, 'height': 45})
    add_cell(root, "dec_val", "Đầy đủ thông tin?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 400, 'width': 130, 'height': 50})
    add_cell(root, "act_err_val", "Báo lỗi: Vui lòng nhập đầy đủ\ntài khoản và mật khẩu", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 402.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err_val", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 475, 'width': 25, 'height': 25})

    add_cell(root, "act_query", "Tìm User trong CSDL & So khớp\nmật khẩu BCryptPasswordEncoder", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 485, 'width': 220, 'height': 45})
    add_cell(root, "dec_auth", "Tài khoản & MK đúng?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 560, 'width': 130, 'height': 50})
    add_cell(root, "act_err_auth", "Báo lỗi: Sai tên đăng nhập\nhoặc mật khẩu (401)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 562.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err_auth", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 635, 'width': 25, 'height': 25})

    add_cell(root, "dec_active", "Tài khoản hoạt động?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 645, 'width': 130, 'height': 50})
    add_cell(root, "act_err_locked", "Báo lỗi: Tài khoản đang bị khóa\nhoặc ngừng hoạt động", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 647.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err_locked", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 720, 'width': 25, 'height': 25})

    add_cell(root, "act_jwt", "Khởi tạo JWT Token chứa ID,\nUsername & Phân quyền (Role)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 725, 'width': 220, 'height': 45})
    add_cell(root, "act_resp", "Phản hồi 200 OK kèm Token\nvà thông tin người dùng", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 800, 'width': 220, 'height': 45})

    flows = [
        ("f1", "", STYLE_FLOW, "start", "act_open"),
        ("f2", "", STYLE_FLOW, "act_open", "act_input"),
        ("f3", "", STYLE_FLOW, "act_input", "act_click"),
        ("f4", "", STYLE_FLOW, "act_click", "act_val"),
        ("f5", "", STYLE_FLOW, "act_val", "dec_val"),
        ("f5_err", "[Thiếu]", STYLE_FLOW, "dec_val", "act_err_val"),
        ("f5_end", "", STYLE_FLOW, "act_err_val", "end_err_val"),
        ("f5_ok", "[Hợp lệ]", STYLE_FLOW, "dec_val", "act_query"),
        ("f6", "", STYLE_FLOW, "act_query", "dec_auth"),
        ("f6_err", "[Sai thông tin]", STYLE_FLOW, "dec_auth", "act_err_auth"),
        ("f6_end", "", STYLE_FLOW, "act_err_auth", "end_err_auth"),
        ("f6_ok", "[Chính xác]", STYLE_FLOW, "dec_auth", "dec_active"),
        ("f7_err", "[Bị khóa]", STYLE_FLOW, "dec_active", "act_err_locked"),
        ("f7_end", "", STYLE_FLOW, "act_err_locked", "end_err_locked"),
        ("f7_ok", "[Hoạt động]", STYLE_FLOW, "dec_active", "act_jwt"),
        ("f8", "", STYLE_FLOW, "act_jwt", "act_resp"),
        ("f9", "", STYLE_FLOW, "act_resp", "act_redirect"),
        ("f10", "", STYLE_FLOW, "act_redirect", "end_ok"),
    ]
    for fid, fval, fsty, fsrc, ftgt in flows:
        add_cell(root, fid, fval, fsty, edge=True, source=fsrc, target=ftgt, geometry={'relative': 1})
    return model

# 2. ĐỔI MẬT KHẨU
def build_act_2_changepwd():
    model, root = create_base_model(1180, 950)
    setup_activity_header(root, "2.2.2.2 BIỂU ĐỒ HOẠT ĐỘNG: ĐỔI MẬT KHẨU TÀI KHOẢN",
                          "Quy trình xác thực mật khẩu cũ, băm mật khẩu mới an toàn bằng BCrypt và cập nhật cơ sở dữ liệu",
                          "Người dùng (Đã đăng nhập)", "Hệ thống (AuthService & CSDL MySQL)", lane_h=820)

    # Actor Lane
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_open", "Mở Menu cá nhân\n& Chọn Đổi mật khẩu", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_input", "Nhập Mật khẩu hiện tại,\nMật khẩu mới & Xác nhận MK", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 250, 'width': 200, 'height': 45})
    add_cell(root, "act_click", "Bấm nút Xác nhận đổi", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 325, 'width': 200, 'height': 45})
    add_cell(root, "act_toast", "Nhận thông báo Toast thành công\n& Đóng hộp thoại đổi mật khẩu", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 730, 'width': 200, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 810, 'width': 25, 'height': 25})

    # System Lane
    add_cell(root, "act_val", "Kiểm tra MK mới khớp xác nhận\n& Độ dài tối thiểu >= 6 ký tự", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 325, 'width': 220, 'height': 45})
    add_cell(root, "dec_val", "Mật khẩu mới hợp lệ?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 400, 'width': 130, 'height': 50})
    add_cell(root, "act_err_val", "Báo lỗi: Mật khẩu mới không khớp\nhoặc độ dài dưới 6 ký tự", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 402.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err_val", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 475, 'width': 25, 'height': 25})

    add_cell(root, "act_check_old", "Lấy User từ CSDL & So khớp MK cũ\n(passwordEncoder.matches)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 485, 'width': 220, 'height': 45})
    add_cell(root, "dec_old", "Mật khẩu cũ đúng?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 560, 'width': 130, 'height': 50})
    add_cell(root, "act_err_old", "Báo lỗi: Mật khẩu cũ không đúng\n(400 Bad Request)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 562.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err_old", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 635, 'width': 25, 'height': 25})

    add_cell(root, "act_hash_save", "Mã hóa BCrypt mật khẩu mới\n& UPDATE users SET password = ...", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 650, 'width': 220, 'height': 45})
    add_cell(root, "act_resp", "Phản hồi 200 OK\nĐổi mật khẩu thành công", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 730, 'width': 220, 'height': 45})

    flows = [
        ("f1", "", STYLE_FLOW, "start", "act_open"),
        ("f2", "", STYLE_FLOW, "act_open", "act_input"),
        ("f3", "", STYLE_FLOW, "act_input", "act_click"),
        ("f4", "", STYLE_FLOW, "act_click", "act_val"),
        ("f5", "", STYLE_FLOW, "act_val", "dec_val"),
        ("f5_err", "[Không hợp lệ]", STYLE_FLOW, "dec_val", "act_err_val"),
        ("f5_end", "", STYLE_FLOW, "act_err_val", "end_err_val"),
        ("f5_ok", "[Hợp lệ]", STYLE_FLOW, "dec_val", "act_check_old"),
        ("f6", "", STYLE_FLOW, "act_check_old", "dec_old"),
        ("f6_err", "[Sai MK cũ]", STYLE_FLOW, "dec_old", "act_err_old"),
        ("f6_end", "", STYLE_FLOW, "act_err_old", "end_err_old"),
        ("f6_ok", "[Chính xác]", STYLE_FLOW, "dec_old", "act_hash_save"),
        ("f7", "", STYLE_FLOW, "act_hash_save", "act_resp"),
        ("f8", "", STYLE_FLOW, "act_resp", "act_toast"),
        ("f9", "", STYLE_FLOW, "act_toast", "end_ok"),
    ]
    for fid, fval, fsty, fsrc, ftgt in flows:
        add_cell(root, fid, fval, fsty, edge=True, source=fsrc, target=ftgt, geometry={'relative': 1})
    return model

# 3. THÊM MỚI SINH VIÊN
def build_act_3_stu_create():
    model, root = create_base_model(1180, 950)
    setup_activity_header(root, "2.2.2.3 BIỂU ĐỒ HOẠT ĐỘNG: THÊM MỚI SINH VIÊN & CẤP TÀI KHOẢN",
                          "Quy trình khởi tạo hồ sơ sinh viên, kiểm tra trùng lặp và tự động cấp tài khoản đăng nhập gắn vai trò ROLE_STUDENT",
                          "Quản trị viên", "Hệ thống (StudentService & CSDL MySQL)", lane_h=820)

    # Actor Lane
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_nav", "Vào Quản lý Sinh viên\n& Bấm Thêm sinh viên", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_fill", "Điền Form: Mã SV, Họ tên, Email,\nNgày sinh, Giới tính, Lớp học", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 250, 'width': 200, 'height': 45})
    add_cell(root, "act_submit", "Bấm nút Lưu hồ sơ", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 325, 'width': 200, 'height': 45})
    add_cell(root, "act_view", "Xem sinh viên mới hiển thị trên bảng\n& Đóng hộp thoại thêm mới", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 730, 'width': 200, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 810, 'width': 25, 'height': 25})

    # System Lane
    add_cell(root, "act_val", "Kiểm tra định dạng Form\n(Email hợp lệ, các trường bắt buộc)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 325, 'width': 220, 'height': 45})
    add_cell(root, "dec_val", "Định dạng hợp lệ?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 400, 'width': 130, 'height': 50})
    add_cell(root, "act_err_val", "Báo lỗi: Email hoặc ngày sinh\nkhông đúng định dạng", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 402.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err_val", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 475, 'width': 25, 'height': 25})

    add_cell(root, "act_dup", "Kiểm tra trùng Mã SV hoặc Email\n(existsByStudentCode / existsByEmail)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 485, 'width': 220, 'height': 45})
    add_cell(root, "dec_dup", "Mã SV / Email đã có?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 560, 'width': 130, 'height': 50})
    add_cell(root, "act_err_dup", "Báo lỗi: Mã SV hoặc Email\nđã tồn tại trong hệ thống", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 562.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err_dup", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 635, 'width': 25, 'height': 25})

    add_cell(root, "act_tx", "Transaction: Tạo User (pass=123456)\n& INSERT sinh viên vào CSDL", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 650, 'width': 220, 'height': 45})
    add_cell(root, "act_resp", "Phản hồi 201 Created & Toast\nThêm sinh viên thành công!", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 730, 'width': 220, 'height': 45})

    flows = [
        ("f1", "", STYLE_FLOW, "start", "act_nav"),
        ("f2", "", STYLE_FLOW, "act_nav", "act_fill"),
        ("f3", "", STYLE_FLOW, "act_fill", "act_submit"),
        ("f4", "", STYLE_FLOW, "act_submit", "act_val"),
        ("f5", "", STYLE_FLOW, "act_val", "dec_val"),
        ("f5_err", "[Sai định dạng]", STYLE_FLOW, "dec_val", "act_err_val"),
        ("f5_end", "", STYLE_FLOW, "act_err_val", "end_err_val"),
        ("f5_ok", "[Hợp lệ]", STYLE_FLOW, "dec_val", "act_dup"),
        ("f6", "", STYLE_FLOW, "act_dup", "dec_dup"),
        ("f6_err", "[Trùng lặp]", STYLE_FLOW, "dec_dup", "act_err_dup"),
        ("f6_end", "", STYLE_FLOW, "act_err_dup", "end_err_dup"),
        ("f6_ok", "[Chưa có]", STYLE_FLOW, "dec_dup", "act_tx"),
        ("f7", "", STYLE_FLOW, "act_tx", "act_resp"),
        ("f8", "", STYLE_FLOW, "act_resp", "act_view"),
        ("f9", "", STYLE_FLOW, "act_view", "end_ok"),
    ]
    for fid, fval, fsty, fsrc, ftgt in flows:
        add_cell(root, fid, fval, fsty, edge=True, source=fsrc, target=ftgt, geometry={'relative': 1})
    return model

# 4. QUẢN LÝ HỒ SƠ SINH VIÊN
def build_act_4_stu_manage():
    model, root = create_base_model(1180, 930)
    setup_activity_header(root, "2.2.2.4 BIỂU ĐỒ HOẠT ĐỘNG: CẬP NHẬT HỒ SƠ & KHÓA TÀI KHOẢN SINH VIÊN",
                          "Quy trình cập nhật thông tin lý lịch sinh viên và đồng bộ khóa tài khoản người dùng khi chuyển sang trạng thái Đình chỉ",
                          "Quản trị viên", "Hệ thống (StudentService & CSDL MySQL)", lane_h=800)

    # Actor Lane
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_select", "Tìm kiếm & Chọn sinh viên\ncần chỉnh sửa thông tin", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_edit", "Sửa thông tin hoặc thay đổi\nTrạng thái (SUSPENDED/INACTIVE)", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 250, 'width': 200, 'height': 45})
    add_cell(root, "act_save", "Bấm nút Lưu thay đổi", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 325, 'width': 200, 'height': 45})
    add_cell(root, "act_view", "Xem dữ liệu và Badge trạng thái mới\nđược cập nhật trên bảng", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 710, 'width': 200, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 790, 'width': 25, 'height': 25})

    # System Lane
    add_cell(root, "act_val", "Kiểm tra tính hợp lệ của dữ liệu\n(Format ngày sinh, độ dài ký tự)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 325, 'width': 220, 'height': 45})
    add_cell(root, "dec_val", "Dữ liệu hợp lệ?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 400, 'width': 130, 'height': 50})
    add_cell(root, "act_err_val", "Báo lỗi: Thông tin cập nhật\nkhông đúng định dạng chuẩn", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 402.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err_val", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 475, 'width': 25, 'height': 25})

    add_cell(root, "dec_status", "Đình chỉ / Thôi học?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 485, 'width': 130, 'height': 50})
    add_cell(root, "act_lock_user", "BR-Lifecycle: users.is_active = false\n(Khóa tài khoản đăng nhập)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 487.5, 'width': 200, 'height': 45})

    add_cell(root, "act_update_db", "Thực thi UPDATE CSDL sinh viên\n& userRepository.save(user)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 625, 'width': 220, 'height': 45})
    add_cell(root, "act_resp", "Phản hồi 200 OK\nCập nhật trạng thái thành công", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 710, 'width': 220, 'height': 45})

    flows = [
        ("f1", "", STYLE_FLOW, "start", "act_select"),
        ("f2", "", STYLE_FLOW, "act_select", "act_edit"),
        ("f3", "", STYLE_FLOW, "act_edit", "act_save"),
        ("f4", "", STYLE_FLOW, "act_save", "act_val"),
        ("f5", "", STYLE_FLOW, "act_val", "dec_val"),
        ("f5_err", "[Không hợp lệ]", STYLE_FLOW, "dec_val", "act_err_val"),
        ("f5_end", "", STYLE_FLOW, "act_err_val", "end_err_val"),
        ("f5_ok", "[Hợp lệ]", STYLE_FLOW, "dec_val", "dec_status"),
        ("f6_lock", "[Có]", STYLE_FLOW, "dec_status", "act_lock_user"),
        ("f6_merge", "", STYLE_FLOW, "act_lock_user", "act_update_db"),
        ("f6_normal", "[Không]", STYLE_FLOW, "dec_status", "act_update_db"),
        ("f7", "", STYLE_FLOW, "act_update_db", "act_resp"),
        ("f8", "", STYLE_FLOW, "act_resp", "act_view"),
        ("f9", "", STYLE_FLOW, "act_view", "end_ok"),
    ]
    for fid, fval, fsty, fsrc, ftgt in flows:
        add_cell(root, fid, fval, fsty, edge=True, source=fsrc, target=ftgt, geometry={'relative': 1})
    return model

# 5. KHOA & LỚP SINH HOẠT
def build_act_5_academic():
    model, root = create_base_model(1180, 880)
    setup_activity_header(root, "2.2.2.5 BIỂU ĐỒ HOẠT ĐỘNG: QUẢN LÝ KHOA & LỚP SINH HOẠT",
                          "Quy trình thiết lập cơ cấu học vụ: Khởi tạo lớp sinh hoạt trực thuộc Khoa đào tạo và gán niên khóa học tập",
                          "Quản trị viên", "Hệ thống (ClassService & CSDL MySQL)", lane_h=750)

    # Actor Lane
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_nav", "Vào mục Cơ cấu đào tạo\n& Bấm Thêm lớp sinh hoạt", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_input", "Nhập Mã lớp, Tên lớp, Niên khóa\n& Chọn Khoa chủ quản", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 250, 'width': 200, 'height': 45})
    add_cell(root, "act_submit", "Bấm nút Tạo lớp sinh hoạt", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 325, 'width': 200, 'height': 45})
    add_cell(root, "act_view", "Xem lớp mới xuất hiện trên cây cơ cấu\nKhoa - Lớp & Đóng hộp thoại", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 635, 'width': 200, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 715, 'width': 25, 'height': 25})

    # System Lane
    add_cell(root, "act_check", "Kiểm tra trùng Mã lớp trong CSDL\n(classRepository.existsByCode)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 325, 'width': 220, 'height': 45})
    add_cell(root, "dec_code", "Mã lớp đã tồn tại?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 400, 'width': 130, 'height': 50})
    add_cell(root, "act_err_code", "Báo lỗi: Mã lớp sinh hoạt\nđã tồn tại trong hệ thống (400)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 402.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 475, 'width': 25, 'height': 25})

    add_cell(root, "act_save", "INSERT INTO classes\n(code, name, department_id, ...)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 485, 'width': 220, 'height': 45})
    add_cell(root, "act_resp", "Phản hồi 201 Created\nTạo lớp sinh hoạt thành công", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 635, 'width': 220, 'height': 45})

    flows = [
        ("f1", "", STYLE_FLOW, "start", "act_nav"),
        ("f2", "", STYLE_FLOW, "act_nav", "act_input"),
        ("f3", "", STYLE_FLOW, "act_input", "act_submit"),
        ("f4", "", STYLE_FLOW, "act_submit", "act_check"),
        ("f5", "", STYLE_FLOW, "act_check", "dec_code"),
        ("f5_err", "[Đã có]", STYLE_FLOW, "dec_code", "act_err_code"),
        ("f5_end", "", STYLE_FLOW, "act_err_code", "end_err"),
        ("f5_ok", "[Hợp lệ]", STYLE_FLOW, "dec_code", "act_save"),
        ("f6", "", STYLE_FLOW, "act_save", "act_resp"),
        ("f7", "", STYLE_FLOW, "act_resp", "act_view"),
        ("f8", "", STYLE_FLOW, "act_view", "end_ok"),
    ]
    for fid, fval, fsty, fsrc, ftgt in flows:
        add_cell(root, fid, fval, fsty, edge=True, source=fsrc, target=ftgt, geometry={'relative': 1})
    return model

# 6. QUẢN LÝ GIẢNG VIÊN
def build_act_6_lecturers():
    model, root = create_base_model(1180, 930)
    setup_activity_header(root, "2.2.2.6 BIỂU ĐỒ HOẠT ĐỘNG: QUẢN LÝ GIẢNG VIÊN & CẤP TÀI KHOẢN",
                          "Quy trình tiếp nhận hồ sơ giảng viên, cấp tài khoản hệ thống với vai trò ROLE_LECTURER và phân bổ về Khoa chủ quản",
                          "Quản trị viên", "Hệ thống (LecturerService & CSDL MySQL)", lane_h=800)

    # Actor Lane
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_nav", "Vào Quản lý Giảng viên\n& Bấm Thêm giảng viên", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_input", "Điền thông tin: Mã GV, Họ tên,\nEmail, Khoa, Học vị, Chuyên môn", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 250, 'width': 200, 'height': 45})
    add_cell(root, "act_submit", "Bấm nút Lưu giảng viên", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 325, 'width': 200, 'height': 45})
    add_cell(root, "act_view", "Xem giảng viên mới trên danh sách\n& Nhận thông báo hoàn tất", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 710, 'width': 200, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 790, 'width': 25, 'height': 25})

    # System Lane
    add_cell(root, "act_dup", "Kiểm tra trùng Mã GV hoặc Email\n(existsByLecturerCode / existsByEmail)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 325, 'width': 220, 'height': 45})
    add_cell(root, "dec_dup", "Mã GV / Email đã có?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 400, 'width': 130, 'height': 50})
    add_cell(root, "act_err_dup", "Báo lỗi: Mã GV hoặc Email\nđã tồn tại trong hệ thống (400)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 402.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 475, 'width': 25, 'height': 25})

    add_cell(root, "act_tx_user", "Tạo User (username=mã GV, pass=123456)\nkèm phân quyền ROLE_LECTURER", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 485, 'width': 220, 'height': 45})
    add_cell(root, "act_tx_lec", "INSERT INTO lecturers gắn kết\nvới User và Khoa đào tạo", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 560, 'width': 220, 'height': 45})
    add_cell(root, "act_resp", "Phản hồi 201 Created & Toast\nThêm giảng viên thành công!", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 710, 'width': 220, 'height': 45})

    flows = [
        ("f1", "", STYLE_FLOW, "start", "act_nav"),
        ("f2", "", STYLE_FLOW, "act_nav", "act_input"),
        ("f3", "", STYLE_FLOW, "act_input", "act_submit"),
        ("f4", "", STYLE_FLOW, "act_submit", "act_dup"),
        ("f5", "", STYLE_FLOW, "act_dup", "dec_dup"),
        ("f5_err", "[Trùng lặp]", STYLE_FLOW, "dec_dup", "act_err_dup"),
        ("f5_end", "", STYLE_FLOW, "act_err_dup", "end_err"),
        ("f5_ok", "[Chưa có]", STYLE_FLOW, "dec_dup", "act_tx_user"),
        ("f6", "", STYLE_FLOW, "act_tx_user", "act_tx_lec"),
        ("f7", "", STYLE_FLOW, "act_tx_lec", "act_resp"),
        ("f8", "", STYLE_FLOW, "act_resp", "act_view"),
        ("f9", "", STYLE_FLOW, "act_view", "end_ok"),
    ]
    for fid, fval, fsty, fsrc, ftgt in flows:
        add_cell(root, fid, fval, fsty, edge=True, source=fsrc, target=ftgt, geometry={'relative': 1})
    return model

# 7. QUẢN LÝ MÔN HỌC
def build_act_7_subjects():
    model, root = create_base_model(1180, 880)
    setup_activity_header(root, "2.2.2.7 BIỂU ĐỒ HOẠT ĐỘNG: QUẢN LÝ MÔN HỌC & TÍN CHỈ",
                          "Quy trình tạo mới môn học, định nghĩa số tín chỉ đào tạo và đồng bộ xóa bộ nhớ đệm ứng dụng",
                          "Quản trị viên", "Hệ thống (SubjectService & CSDL MySQL)", lane_h=750)

    # Actor Lane
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_nav", "Vào Quản lý Môn học\n& Bấm Thêm môn học", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_input", "Nhập Mã môn, Tên môn, Số tín chỉ\n(credits), Chọn Khoa quản lý", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 250, 'width': 200, 'height': 45})
    add_cell(root, "act_submit", "Bấm nút Lưu môn học", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 325, 'width': 200, 'height': 45})
    add_cell(root, "act_view", "Cập nhật bảng danh mục môn học\n& Đóng hộp thoại thêm mới", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 635, 'width': 200, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 715, 'width': 25, 'height': 25})

    # System Lane
    add_cell(root, "act_check", "Kiểm tra trùng Mã môn học\n(existsBySubjectCode)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 325, 'width': 220, 'height': 45})
    add_cell(root, "dec_code", "Mã môn đã tồn tại?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 400, 'width': 130, 'height': 50})
    add_cell(root, "act_err_code", "Báo lỗi: Mã môn học đã tồn tại\ntrong hệ thống (400)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 402.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 475, 'width': 25, 'height': 25})

    add_cell(root, "act_save", "INSERT INTO subjects & Xóa Cache\nRedis (@CacheEvict('subjects'))", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 485, 'width': 220, 'height': 45})
    add_cell(root, "act_resp", "Phản hồi 200 OK kèm Subject entity\nThêm môn học thành công", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 635, 'width': 220, 'height': 45})

    flows = [
        ("f1", "", STYLE_FLOW, "start", "act_nav"),
        ("f2", "", STYLE_FLOW, "act_nav", "act_input"),
        ("f3", "", STYLE_FLOW, "act_input", "act_submit"),
        ("f4", "", STYLE_FLOW, "act_submit", "act_check"),
        ("f5", "", STYLE_FLOW, "act_check", "dec_code"),
        ("f5_err", "[Đã có]", STYLE_FLOW, "dec_code", "act_err_code"),
        ("f5_end", "", STYLE_FLOW, "act_err_code", "end_err"),
        ("f5_ok", "[Hợp lệ]", STYLE_FLOW, "dec_code", "act_save"),
        ("f6", "", STYLE_FLOW, "act_save", "act_resp"),
        ("f7", "", STYLE_FLOW, "act_resp", "act_view"),
        ("f8", "", STYLE_FLOW, "act_view", "end_ok"),
    ]
    for fid, fval, fsty, fsrc, ftgt in flows:
        add_cell(root, fid, fval, fsty, edge=True, source=fsrc, target=ftgt, geometry={'relative': 1})
    return model

# 8. CẤU HÌNH HỌC KỲ
def build_act_8_semesters():
    model, root = create_base_model(1180, 830)
    setup_activity_header(root, "2.2.2.8 BIỂU ĐỒ HOẠT ĐỘNG: CẤU HÌNH HỌC KỲ & ĐỢT ĐĂNG KÝ HỌC TẬP",
                          "Quy trình kích hoạt học kỳ hiện tại, giải phóng cờ học kỳ cũ và làm mới bộ nhớ đệm hệ thống",
                          "Quản trị viên", "Hệ thống (SemesterService & CSDL MySQL)", lane_h=700)

    # Actor Lane
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_nav", "Mở Quản lý Học kỳ & Chọn học kỳ\ncần thiết lập trạng thái", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_click", "Bấm nút Đặt làm học kỳ hiện tại", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 250, 'width': 200, 'height': 45})
    add_cell(root, "act_view", "Gắn nhãn HỌC KỲ HIỆN TẠI\ntrên toàn bộ giao diện đào tạo", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 580, 'width': 200, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 660, 'width': 25, 'height': 25})

    # System Lane
    add_cell(root, "act_clear", "clearCurrentSemester(): Hủy cờ\nUPDATE semesters SET is_current = false", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 250, 'width': 220, 'height': 45})
    add_cell(root, "act_set", "Kích hoạt học kỳ mới:\nUPDATE semesters SET is_current = true", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 335, 'width': 220, 'height': 45})
    add_cell(root, "act_cache", "Xóa bộ nhớ đệm học kỳ\n@CacheEvict('semesters')", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 420, 'width': 220, 'height': 45})
    add_cell(root, "act_resp", "Phản hồi 200 OK\nThiết lập học kỳ hiện tại thành công", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 580, 'width': 220, 'height': 45})

    flows = [
        ("f1", "", STYLE_FLOW, "start", "act_nav"),
        ("f2", "", STYLE_FLOW, "act_nav", "act_click"),
        ("f3", "", STYLE_FLOW, "act_click", "act_clear"),
        ("f4", "", STYLE_FLOW, "act_clear", "act_set"),
        ("f5", "", STYLE_FLOW, "act_set", "act_cache"),
        ("f6", "", STYLE_FLOW, "act_cache", "act_resp"),
        ("f7", "", STYLE_FLOW, "act_resp", "act_view"),
        ("f8", "", STYLE_FLOW, "act_view", "end_ok"),
    ]
    for fid, fval, fsty, fsrc, ftgt in flows:
        add_cell(root, fid, fval, fsty, edge=True, source=fsrc, target=ftgt, geometry={'relative': 1})
    return model

# 9. MỞ LỚP HỌC PHẦN
def build_act_9_sections():
    model, root = create_base_model(1180, 880)
    setup_activity_header(root, "2.2.2.9 BIỂU ĐỒ HOẠT ĐỘNG: MỞ & ĐIỀU PHỐI LỚP HỌC PHẦN",
                          "Quy trình mở lớp học phần trong học kỳ, ấn định giảng viên phụ trách, phòng học và giới hạn sĩ số tối đa",
                          "Quản trị viên", "Hệ thống (CourseSectionService & CSDL MySQL)", lane_h=750)

    # Actor Lane
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_input", "Chọn Môn học, Học kỳ, Giảng viên;\nNhập Mã lớp HP, Sĩ số tối đa (Max)", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_submit", "Bấm nút Mở lớp học phần", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 250, 'width': 200, 'height': 45})
    add_cell(root, "act_view", "Thêm lớp HP vào danh mục điều phối\n& Mở cho sinh viên đăng ký", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 635, 'width': 200, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 715, 'width': 25, 'height': 25})

    # System Lane
    add_cell(root, "act_check", "Kiểm tra trùng Mã học phần\n(existsBySectionCode)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 250, 'width': 220, 'height': 45})
    add_cell(root, "dec_code", "Mã học phần đã có?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 335, 'width': 130, 'height': 50})
    add_cell(root, "act_err_code", "Báo lỗi: Mã lớp học phần\nđã tồn tại trong hệ thống (400)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 337.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 415, 'width': 25, 'height': 25})

    add_cell(root, "act_save", "INSERT INTO course_sections\n(status=OPEN, currentStudents=0, ...)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 440, 'width': 220, 'height': 45})
    add_cell(root, "act_resp", "Phản hồi 200 OK kèm CourseSection\nMở lớp học phần thành công!", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 635, 'width': 220, 'height': 45})

    flows = [
        ("f1", "", STYLE_FLOW, "start", "act_input"),
        ("f2", "", STYLE_FLOW, "act_input", "act_submit"),
        ("f3", "", STYLE_FLOW, "act_submit", "act_check"),
        ("f4", "", STYLE_FLOW, "act_check", "dec_code"),
        ("f4_err", "[Đã có]", STYLE_FLOW, "dec_code", "act_err_code"),
        ("f4_end", "", STYLE_FLOW, "act_err_code", "end_err"),
        ("f4_ok", "[Hợp lệ]", STYLE_FLOW, "dec_code", "act_save"),
        ("f5", "", STYLE_FLOW, "act_save", "act_resp"),
        ("f6", "", STYLE_FLOW, "act_resp", "act_view"),
        ("f7", "", STYLE_FLOW, "act_view", "end_ok"),
    ]
    for fid, fval, fsty, fsrc, ftgt in flows:
        add_cell(root, fid, fval, fsty, edge=True, source=fsrc, target=ftgt, geometry={'relative': 1})
    return model

# 10. XẾP THỜI KHÓA BIỂU
def build_act_10_scheduling():
    model, root = create_base_model(1180, 950)
    setup_activity_header(root, "2.2.2.10 BIỂU ĐỒ HOẠT ĐỘNG: XẾP THỜI KHÓA BIỂU & KIỂM TRA XUNG ĐỘT",
                          "Quy trình phân bổ phòng học, thứ, tiết học và kiểm tra tự động xung đột trùng phòng hoặc trùng lịch giảng viên",
                          "Quản trị viên", "Hệ thống (ScheduleService & CSDL MySQL)", lane_h=820)

    # Actor Lane
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_input", "Chọn Lớp HP, Phòng học, Thứ (day),\nTiết bắt đầu - Tiết kết thúc, Ngày", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_submit", "Bấm nút Lưu thời khóa biểu", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 250, 'width': 200, 'height': 45})
    add_cell(root, "act_view", "Vẽ ô lịch học lên lưới Thời khóa biểu\n& Nhận thông báo xếp lịch thành công", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 710, 'width': 200, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 790, 'width': 25, 'height': 25})

    # System Lane
    add_cell(root, "act_check_room", "Kiểm tra xung đột phòng học:\nfindRoomConflicts()", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 250, 'width': 220, 'height': 45})
    add_cell(root, "dec_room", "Trùng phòng học?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 335, 'width': 130, 'height': 50})
    add_cell(root, "act_err_room", "Báo lỗi: Phòng học đã được xếp\ncho lớp khác cùng khung giờ (400)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 337.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err_r", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 415, 'width': 25, 'height': 25})

    add_cell(root, "act_check_lec", "Kiểm tra xung đột lịch giảng viên:\nfindLecturerConflicts()", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 440, 'width': 220, 'height': 45})
    add_cell(root, "dec_lec", "Trùng lịch giảng viên?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 525, 'width': 130, 'height': 50})
    add_cell(root, "act_err_lec", "Báo lỗi: Giảng viên đã có lịch\ndạy lớp khác cùng thời điểm (400)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 527.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err_l", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 605, 'width': 25, 'height': 25})

    add_cell(root, "act_save", "INSERT INTO schedules & Lưu CSDL\nhoàn tất xếp thời khóa biểu", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 615, 'width': 220, 'height': 45})
    add_cell(root, "act_resp", "Phản hồi 200 OK\nXếp lịch học thành công", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 710, 'width': 220, 'height': 45})

    flows = [
        ("f1", "", STYLE_FLOW, "start", "act_input"),
        ("f2", "", STYLE_FLOW, "act_input", "act_submit"),
        ("f3", "", STYLE_FLOW, "act_submit", "act_check_room"),
        ("f4", "", STYLE_FLOW, "act_check_room", "dec_room"),
        ("f4_err", "[Trùng phòng]", STYLE_FLOW, "dec_room", "act_err_room"),
        ("f4_end", "", STYLE_FLOW, "act_err_room", "end_err_r"),
        ("f4_ok", "[Trống phòng]", STYLE_FLOW, "dec_room", "act_check_lec"),
        ("f5", "", STYLE_FLOW, "act_check_lec", "dec_lec"),
        ("f5_err", "[Trùng lịch GV]", STYLE_FLOW, "dec_lec", "act_err_lec"),
        ("f5_end", "", STYLE_FLOW, "act_err_lec", "end_err_l"),
        ("f5_ok", "[Trống lịch]", STYLE_FLOW, "dec_lec", "act_save"),
        ("f6", "", STYLE_FLOW, "act_save", "act_resp"),
        ("f7", "", STYLE_FLOW, "act_resp", "act_view"),
        ("f8", "", STYLE_FLOW, "act_view", "end_ok"),
    ]
    for fid, fval, fsty, fsrc, ftgt in flows:
        add_cell(root, fid, fval, fsty, edge=True, source=fsrc, target=ftgt, geometry={'relative': 1})
    return model

# 11. ĐĂNG KÝ LỚP HỌC PHẦN
def build_act_11_enrollment():
    model, root = create_base_model(1180, 980)
    setup_activity_header(root, "2.2.2.11 BIỂU ĐỒ HOẠT ĐỘNG: SINH VIÊN ĐĂNG KÝ LỚP HỌC PHẦN",
                          "Quy trình đăng ký học phần với khóa bi quan PESSIMISTIC_WRITE, kiểm tra giới hạn 30 tín chỉ và trigger tăng sĩ số",
                          "Sinh viên", "Hệ thống (EnrollmentService & CSDL MySQL)", lane_h=850)

    # Actor Lane
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_view_open", "Mở Cổng đăng ký học phần (/enroll)\n& Xem danh sách học phần mở", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_select", "Chọn lớp học phần phù hợp\n& Bấm nút Đăng ký", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 250, 'width': 200, 'height': 45})
    add_cell(root, "act_view_ok", "Nhận Toast thành công & Thêm môn\nvào Thời khóa biểu cá nhân", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 760, 'width': 200, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 840, 'width': 25, 'height': 25})

    # System Lane
    add_cell(root, "act_lock", "Khóa bi quan hàng bản ghi học phần\n(PESSIMISTIC_WRITE - FOR UPDATE)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 250, 'width': 220, 'height': 45})
    add_cell(root, "dec_open", "HP đang mở & trong đợt?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 335, 'width': 130, 'height': 50})
    add_cell(root, "act_err_open", "Báo lỗi: Học phần đã đóng\nhoặc hết hạn đăng ký (400)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 337.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err_o", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 415, 'width': 25, 'height': 25})

    add_cell(root, "act_check_rules", "Kiểm tra BR-Capacity (sĩ số < max)\n& BR-03 (Tổng tín chỉ kỳ <= 30)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 440, 'width': 220, 'height': 45})
    add_cell(root, "dec_rules", "Đủ chỗ & Tín chỉ <= 30?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 525, 'width': 130, 'height': 50})
    add_cell(root, "act_err_rules", "Báo lỗi: Lớp đã đầy sĩ số\nhoặc vượt quá 30 tín chỉ (400)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 527.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err_r", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 605, 'width': 25, 'height': 25})

    add_cell(root, "act_insert", "INSERT INTO enrollments (status=ENROLLED)\nTrigger MySQL: current_students + 1", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 640, 'width': 220, 'height': 45})
    add_cell(root, "act_resp", "Phản hồi 200 OK\nĐăng ký học phần thành công!", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 760, 'width': 220, 'height': 45})

    flows = [
        ("f1", "", STYLE_FLOW, "start", "act_view_open"),
        ("f2", "", STYLE_FLOW, "act_view_open", "act_select"),
        ("f3", "", STYLE_FLOW, "act_select", "act_lock"),
        ("f4", "", STYLE_FLOW, "act_lock", "dec_open"),
        ("f4_err", "[Hết hạn/Đóng]", STYLE_FLOW, "dec_open", "act_err_open"),
        ("f4_end", "", STYLE_FLOW, "act_err_open", "end_err_o"),
        ("f4_ok", "[Đang mở]", STYLE_FLOW, "dec_open", "act_check_rules"),
        ("f5", "", STYLE_FLOW, "act_check_rules", "dec_rules"),
        ("f5_err", "[Hết chỗ/Quá TC]", STYLE_FLOW, "dec_rules", "act_err_rules"),
        ("f5_end", "", STYLE_FLOW, "act_err_rules", "end_err_r"),
        ("f5_ok", "[Đủ điều kiện]", STYLE_FLOW, "dec_rules", "act_insert"),
        ("f6", "", STYLE_FLOW, "act_insert", "act_resp"),
        ("f7", "", STYLE_FLOW, "act_resp", "act_view_ok"),
        ("f8", "", STYLE_FLOW, "act_view_ok", "end_ok"),
    ]
    for fid, fval, fsty, fsrc, ftgt in flows:
        add_cell(root, fid, fval, fsty, edge=True, source=fsrc, target=ftgt, geometry={'relative': 1})
    return model

# 12. HỦY ĐĂNG KÝ HỌC PHẦN
def build_act_12_course_drop():
    model, root = create_base_model(1180, 880)
    setup_activity_header(root, "2.2.2.12 BIỂU ĐỒ HOẠT ĐỘNG: HỦY ĐĂNG KÝ HỌC PHẦN & HOÀN TRẢ SĨ SỐ",
                          "Quy trình hủy đăng ký học phần, giải phóng chỗ trống và kích hoạt trigger tự động giảm sĩ số lớp học phần",
                          "Sinh viên", "Hệ thống (EnrollmentService & CSDL MySQL)", lane_h=750)

    # Actor Lane
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_view", "Vào mục Lớp học phần của tôi\n& Chọn môn học muốn hủy", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_click", "Bấm nút Hủy đăng ký", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 250, 'width': 200, 'height': 45})
    add_cell(root, "act_confirm", "Xác nhận môn học đã được rút\nkhỏi Thời khóa biểu học kỳ", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 635, 'width': 200, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 715, 'width': 25, 'height': 25})

    # System Lane
    add_cell(root, "act_check_owner", "Kiểm tra quyền sở hữu đăng ký\n& Trạng thái enrollment == ENROLLED", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 250, 'width': 220, 'height': 45})
    add_cell(root, "dec_owner", "Hợp lệ & Được hủy?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 335, 'width': 130, 'height': 50})
    add_cell(root, "act_err_owner", "Báo lỗi: Không có quyền hủy\nhoặc đăng ký không hợp lệ (400)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 337.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 415, 'width': 25, 'height': 25})

    add_cell(root, "act_cancel", "UPDATE enrollments SET status='CANCELLED'\nTrigger MySQL: current_students - 1", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 440, 'width': 220, 'height': 45})
    add_cell(root, "act_resp", "Phản hồi 200 OK\nHủy đăng ký thành công", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 635, 'width': 220, 'height': 45})

    flows = [
        ("f1", "", STYLE_FLOW, "start", "act_view"),
        ("f2", "", STYLE_FLOW, "act_view", "act_click"),
        ("f3", "", STYLE_FLOW, "act_click", "act_check_owner"),
        ("f4", "", STYLE_FLOW, "act_check_owner", "dec_owner"),
        ("f4_err", "[Không hợp lệ]", STYLE_FLOW, "dec_owner", "act_err_owner"),
        ("f4_end", "", STYLE_FLOW, "act_err_owner", "end_err"),
        ("f4_ok", "[Hợp lệ]", STYLE_FLOW, "dec_owner", "act_cancel"),
        ("f5", "", STYLE_FLOW, "act_cancel", "act_resp"),
        ("f6", "", STYLE_FLOW, "act_resp", "act_confirm"),
        ("f7", "", STYLE_FLOW, "act_confirm", "end_ok"),
    ]
    for fid, fval, fsty, fsrc, ftgt in flows:
        add_cell(root, fid, fval, fsty, edge=True, source=fsrc, target=ftgt, geometry={'relative': 1})
    return model

# 13. NHẬP ĐIỂM THÀNH PHẦN
def build_act_13_grading_entry():
    model, root = create_base_model(1180, 930)
    setup_activity_header(root, "2.2.2.13 BIỂU ĐỒ HOẠT ĐỘNG: GIẢNG VIÊN NHẬP ĐIỂM THÀNH PHẦN & TÍNH TỔNG KẾT",
                          "Quy trình giảng viên nhập điểm chuyên cần, giữa kỳ, cuối kỳ, hệ thống tự động tính điểm tổng kết và quy đổi điểm chữ",
                          "Giảng viên", "Hệ thống (GradeService & CSDL MySQL)", lane_h=800)

    # Actor Lane
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_open", "Mở Sổ điểm lớp học phần phụ trách\n& Nhập điểm CC, GK, CK cho sinh viên", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_click", "Bấm nút Lưu tạm (finalize=false)", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 250, 'width': 200, 'height': 45})
    add_cell(root, "act_view", "Xem điểm Tổng kết, Điểm Chữ & GPA\nhiển thị tự động trên sổ điểm", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 710, 'width': 200, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 790, 'width': 25, 'height': 25})

    # System Lane
    add_cell(root, "act_check_auth", "BR-07: Kiểm tra quyền Giảng viên\nphụ trách đúng lớp học phần", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 250, 'width': 220, 'height': 45})
    add_cell(root, "dec_auth", "Đúng GV phụ trách?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 335, 'width': 130, 'height': 50})
    add_cell(root, "act_err_auth", "Báo lỗi: Bạn không có quyền nhập điểm\ncho lớp học phần này (403)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 337.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 415, 'width': 25, 'height': 25})

    add_cell(root, "act_calc", "calculateTotalScore():\nTotal = CC*0.1 + GK*0.3 + CK*0.6", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 440, 'width': 220, 'height': 45})
    add_cell(root, "act_convert", "Quy đổi Hệ 4 & Điểm chữ\n(A, B+, B, C+, C, D+, D, F)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 525, 'width': 220, 'height': 45})
    add_cell(root, "act_save", "UPDATE grades SET scores, is_finalized=false\nhoàn tất lưu bản nháp", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 610, 'width': 220, 'height': 45})
    add_cell(root, "act_resp", "Phản hồi 200 OK\nLưu điểm hàng loạt thành công", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 710, 'width': 220, 'height': 45})

    flows = [
        ("f1", "", STYLE_FLOW, "start", "act_open"),
        ("f2", "", STYLE_FLOW, "act_open", "act_click"),
        ("f3", "", STYLE_FLOW, "act_click", "act_check_auth"),
        ("f4", "", STYLE_FLOW, "act_check_auth", "dec_auth"),
        ("f4_err", "[Sai quyền]", STYLE_FLOW, "dec_auth", "act_err_auth"),
        ("f4_end", "", STYLE_FLOW, "act_err_auth", "end_err"),
        ("f4_ok", "[Hợp lệ]", STYLE_FLOW, "dec_auth", "act_calc"),
        ("f5", "", STYLE_FLOW, "act_calc", "act_convert"),
        ("f6", "", STYLE_FLOW, "act_convert", "act_save"),
        ("f7", "", STYLE_FLOW, "act_save", "act_resp"),
        ("f8", "", STYLE_FLOW, "act_resp", "act_view"),
        ("f9", "", STYLE_FLOW, "act_view", "end_ok"),
    ]
    for fid, fval, fsty, fsrc, ftgt in flows:
        add_cell(root, fid, fval, fsty, edge=True, source=fsrc, target=ftgt, geometry={'relative': 1})
    return model

# 14. CHỐT BẢNG ĐIỂM
def build_act_14_grading_finalize():
    model, root = create_base_model(1180, 880)
    setup_activity_header(root, "2.2.2.14 BIỂU ĐỒ HOẠT ĐỘNG: CHỐT SỔ ĐIỂM HỌC PHẦN & KHÓA CHỈNH SỬA",
                          "Quy trình chốt sổ điểm chính thức, kiểm tra đầy đủ điểm 100% sinh viên và khóa quyền chỉnh sửa của giảng viên",
                          "Giảng viên", "Hệ thống (GradeService & CSDL MySQL)", lane_h=750)

    # Actor Lane
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_review", "Kiểm tra lại toàn bộ điểm các cột\n& Bấm nút Chốt bảng điểm", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_lock_ui", "Khóa toàn bộ ô nhập điểm (disabled)\n& Hiển thị Badge ĐÃ CHỐT ĐIỂM", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 635, 'width': 200, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 715, 'width': 25, 'height': 25})

    # System Lane
    add_cell(root, "act_check_full", "Kiểm tra toàn bộ sinh viên trong lớp\nđã nhập đủ các cột điểm thành phần", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 175, 'width': 220, 'height': 45})
    add_cell(root, "dec_full", "Đã nhập đủ 100% điểm?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 260, 'width': 130, 'height': 50})
    add_cell(root, "act_err_full", "Báo lỗi: Không thể chốt điểm\nkhi chưa nhập đủ điểm thành phần (400)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 262.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 340, 'width': 25, 'height': 25})

    add_cell(root, "act_set_lock", "Đánh dấu is_finalized = true\n(Khóa quyền sửa của Giảng viên)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 370, 'width': 220, 'height': 45})
    add_cell(root, "act_save", "UPDATE grades SET is_finalized=true\nWHERE enrollment_id IN (...)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 460, 'width': 220, 'height': 45})
    add_cell(root, "act_resp", "Phản hồi 200 OK\nChốt điểm thành công!", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 635, 'width': 220, 'height': 45})

    flows = [
        ("f1", "", STYLE_FLOW, "start", "act_review"),
        ("f2", "", STYLE_FLOW, "act_review", "act_check_full"),
        ("f3", "", STYLE_FLOW, "act_check_full", "dec_full"),
        ("f3_err", "[Thiếu điểm]", STYLE_FLOW, "dec_full", "act_err_full"),
        ("f3_end", "", STYLE_FLOW, "act_err_full", "end_err"),
        ("f3_ok", "[Đầy đủ]", STYLE_FLOW, "dec_full", "act_set_lock"),
        ("f4", "", STYLE_FLOW, "act_set_lock", "act_save"),
        ("f5", "", STYLE_FLOW, "act_save", "act_resp"),
        ("f6", "", STYLE_FLOW, "act_resp", "act_lock_ui"),
        ("f7", "", STYLE_FLOW, "act_lock_ui", "end_ok"),
    ]
    for fid, fval, fsty, fsrc, ftgt in flows:
        add_cell(root, fid, fval, fsty, edge=True, source=fsrc, target=ftgt, geometry={'relative': 1})
    return model

# 15. BẢNG ĐIỂM & ĐIỂM CPA
def build_act_15_transcript():
    model, root = create_base_model(1180, 830)
    setup_activity_header(root, "2.2.2.15 BIỂU ĐỒ HOẠT ĐỘNG: TRA CỨU BẢNG ĐIỂM & TÍNH ĐIỂM GPA / CPA",
                          "Quy trình truy xuất các điểm đã chốt sổ, gom nhóm theo học kỳ, tính điểm GPA học kỳ và CPA tích lũy toàn khóa",
                          "Sinh viên", "Hệ thống (TranscriptService & CSDL MySQL)", lane_h=700)

    # Actor Lane
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_open", "Mở màn hình Bảng điểm cá nhân\n(/transcript) để theo dõi tiến độ", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_view", "Xem bảng điểm từng kỳ, số tín chỉ tích lũy\nvà biểu đồ tiến độ GPA / CPA", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 580, 'width': 200, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 660, 'width': 25, 'height': 25})

    # System Lane
    add_cell(root, "act_query", "findFinalizedByStudentId(studentId):\nChỉ lấy các môn có is_finalized = true", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 175, 'width': 220, 'height': 45})
    add_cell(root, "act_group", "Gom nhóm điểm theo từng Học kỳ\n(Collectors.groupingBy semesterId)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 260, 'width': 220, 'height': 45})
    add_cell(root, "act_gpa", "Tính GPA học kỳ:\nsemGpa = sum(gpaPoint * credits) / semCredits", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 345, 'width': 220, 'height': 45})
    add_cell(root, "act_cpa", "Tính CPA tích lũy:\ncumulativeGpa = totalWeightedGpa / totalCredits", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 430, 'width': 220, 'height': 45})
    add_cell(root, "act_resp", "Phản hồi 200 OK kèm TranscriptResponse\nchứa danh sách kỳ và điểm số", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 580, 'width': 220, 'height': 45})

    flows = [
        ("f1", "", STYLE_FLOW, "start", "act_open"),
        ("f2", "", STYLE_FLOW, "act_open", "act_query"),
        ("f3", "", STYLE_FLOW, "act_query", "act_group"),
        ("f4", "", STYLE_FLOW, "act_group", "act_gpa"),
        ("f5", "", STYLE_FLOW, "act_gpa", "act_cpa"),
        ("f6", "", STYLE_FLOW, "act_cpa", "act_resp"),
        ("f7", "", STYLE_FLOW, "act_resp", "act_view"),
        ("f8", "", STYLE_FLOW, "act_view", "end_ok"),
    ]
    for fid, fval, fsty, fsrc, ftgt in flows:
        add_cell(root, fid, fval, fsty, edge=True, source=fsrc, target=ftgt, geometry={'relative': 1})
    return model

# 16. BÁO CÁO THỐNG KÊ & DASHBOARD
def build_act_16_dashboard():
    model, root = create_base_model(1180, 830)
    setup_activity_header(root, "2.2.2.16 BIỂU ĐỒ HOẠT ĐỘNG: BÁO CÁO THỐNG KÊ TOÀN TRƯỜNG & DASHBOARD",
                          "Quy trình tổng hợp KPI, phân tích cơ cấu sinh viên theo Khoa và thống kê tỷ lệ học lực, tình trạng đào tạo",
                          "Quản trị viên", "Hệ thống (DashboardService & CSDL MySQL)", lane_h=700)

    # Actor Lane
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_open", "Mở Bảng điều khiển Quản trị\n(/admin/dashboard) tổng quan", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_view", "Xem Biểu đồ Cột (Khoa), Biểu đồ Tròn\n(Trạng thái) và Thẻ chỉ số KPI", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 580, 'width': 200, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 660, 'width': 25, 'height': 25})

    # System Lane
    add_cell(root, "act_query_stu", "Đếm tổng SV & Phân loại trạng thái:\nACTIVE, GRADUATED, SUSPENDED...", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 175, 'width': 220, 'height': 45})
    add_cell(root, "act_dept_group", "countByDepartment(): Gom nhóm số lượng\nsinh viên theo từng Khoa", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 260, 'width': 220, 'height': 45})
    add_cell(root, "act_counts", "Đếm tổng số Khoa, Lớp, Môn học,\nGiảng viên & Lớp học phần", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 345, 'width': 220, 'height': 45})
    add_cell(root, "act_dto", "Đóng gói DashboardResponse DTO\nchuẩn bị số liệu trực quan hóa", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 430, 'width': 220, 'height': 45})
    add_cell(root, "act_resp", "Phản hồi 200 OK\nkèm số liệu thống kê tổng hợp", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 580, 'width': 220, 'height': 45})

    flows = [
        ("f1", "", STYLE_FLOW, "start", "act_open"),
        ("f2", "", STYLE_FLOW, "act_open", "act_query_stu"),
        ("f3", "", STYLE_FLOW, "act_query_stu", "act_dept_group"),
        ("f4", "", STYLE_FLOW, "act_dept_group", "act_counts"),
        ("f5", "", STYLE_FLOW, "act_counts", "act_dto"),
        ("f6", "", STYLE_FLOW, "act_dto", "act_resp"),
        ("f7", "", STYLE_FLOW, "act_resp", "act_view"),
        ("f8", "", STYLE_FLOW, "act_view", "end_ok"),
    ]
    for fid, fval, fsty, fsrc, ftgt in flows:
        add_cell(root, fid, fval, fsty, edge=True, source=fsrc, target=ftgt, geometry={'relative': 1})
    return model

# Aliases matching generate_all_4_diagrams.py
build_act_2_change_password = build_act_2_changepwd
build_act_3_student_create = build_act_3_stu_create
build_act_4_student_manage = build_act_4_stu_manage
build_act_5_academic_structure = build_act_5_academic
build_act_9_course_sections = build_act_9_sections
build_act_15_transcript_cpa = build_act_15_transcript
build_act_16_analytics_dashboard = build_act_16_dashboard

# ==========================================
# GHI TẤT CẢ 16 TAB VÀO Activity_Diagrams.drawio
# ==========================================
def generate_all_activity_diagrams():
    tabs = [
        ("1. Đăng nhập hệ thống", build_act_1_login()),
        ("2. Đổi mật khẩu", build_act_2_changepwd()),
        ("3. Thêm mới Sinh viên", build_act_3_stu_create()),
        ("4. Quản lý hồ sơ Sinh viên", build_act_4_stu_manage()),
        ("5. Khoa & Lớp sinh hoạt", build_act_5_academic()),
        ("6. Quản lý Giảng viên", build_act_6_lecturers()),
        ("7. Quản lý Môn học", build_act_7_subjects()),
        ("8. Cấu hình Học kỳ", build_act_8_semesters()),
        ("9. Mở lớp Học phần", build_act_9_sections()),
        ("10. Xếp Thời khóa biểu", build_act_10_scheduling()),
        ("11. Đăng ký lớp Học phần", build_act_11_enrollment()),
        ("12. Hủy đăng ký Học phần", build_act_12_course_drop()),
        ("13. Nhập điểm thành phần", build_act_13_grading_entry()),
        ("14. Chốt bảng điểm", build_act_14_grading_finalize()),
        ("15. Bảng điểm & Điểm CPA", build_act_15_transcript()),
        ("16. Báo cáo Thống kê & Dashboard", build_act_16_dashboard()),
    ]

    mxfile = ET.Element('mxfile', {
        'host': 'app.diagrams.net',
        'modified': '2026-09-11T20:20:00.000Z',
        'agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'version': '24.7.17',
        'type': 'device'
    })

    for i, (name, model) in enumerate(tabs):
        diagram = ET.SubElement(mxfile, 'diagram', {
            'id': f'act_tab_{i+1:02d}',
            'name': name
        })
        diagram.append(model)

    raw_xml = ET.tostring(mxfile, encoding='utf-8')
    dom = minidom.parseString(raw_xml)
    pretty_xml = dom.toprettyxml(indent='  ', encoding='utf-8')

    out_dir = 'drawio'
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, 'Activity_Diagrams.drawio')
    with open(out_file, 'wb') as f:
        f.write(pretty_xml)

    print(f"XUẤT THÀNH CÔNG: {out_file} với {len(tabs)} tab biểu đồ hoạt động đẹp, chuẩn UML!")

if __name__ == '__main__':
    generate_all_activity_diagrams()
