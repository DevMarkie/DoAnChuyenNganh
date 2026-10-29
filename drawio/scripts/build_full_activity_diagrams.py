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
    model, root = create_base_model(1180, 1100)
    setup_activity_header(root, "BIỂU ĐỒ HOẠT ĐỘNG: ĐĂNG NHẬP & XÁC THỰC HỆ THỐNG",
                          "Quy trình xác thực danh tính người dùng bằng BCrypt, cấp JWT token, kiểm tra cờ mustChangePassword và điều hướng giao diện",
                          "Người dùng (Admin / Giảng viên / Sinh viên)", "Hệ thống (AuthService & Spring Security)", lane_h=970)

    # Actor Lane (Center x=240)
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_open", "Truy cập màn hình Đăng nhập\n(/login)", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_input", "Nhập Tên tài khoản\n& Mật khẩu", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 250, 'width': 200, 'height': 45})
    add_cell(root, "act_click", "Bấm nút Đăng nhập", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 325, 'width': 200, 'height': 45})

    add_cell(root, "dec_must_pwd", "Phải đổi MK?\n(mustChangePassword)", STYLE_DECISION, vertex=True, geometry={'x': 175, 'y': 800, 'width': 130, 'height': 50})
    add_cell(root, "act_redir_pwd", "Chuyển hướng bắt buộc sang\ntrang /change-password", STYLE_ACTIVITY, vertex=True, geometry={'x': 40, 'y': 880, 'width': 180, 'height': 45})
    add_cell(root, "end_pwd", "", STYLE_END, vertex=True, geometry={'x': 117.5, 'y': 950, 'width': 25, 'height': 25})

    add_cell(root, "act_redirect", "Lưu Token vào LocalStorage\n& Điều hướng Dashboard", STYLE_ACTIVITY, vertex=True, geometry={'x': 230, 'y': 880, 'width': 180, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 307.5, 'y': 950, 'width': 25, 'height': 25})

    # System Lane (Spine Center x=620, Error Center x=910)
    add_cell(root, "act_val", "Kiểm tra hợp lệ dữ liệu Form\n(Client-side Validation)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 325, 'width': 220, 'height': 45})
    add_cell(root, "dec_val", "Đầy đủ thông tin?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 400, 'width': 130, 'height': 50})
    add_cell(root, "act_err_val", "Báo lỗi: Vui lòng nhập đầy đủ\ntài khoản và mật khẩu", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 402.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err_val", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 475, 'width': 25, 'height': 25})

    add_cell(root, "act_query", "Tìm User trong CSDL & So khớp\nmật khẩu BCryptPasswordEncoder", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 485, 'width': 220, 'height': 45})
    add_cell(root, "dec_auth", "Tài khoản & MK đúng?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 560, 'width': 130, 'height': 50})
    add_cell(root, "act_err_auth", "Báo lỗi: Sai tài khoản hoặc mật khẩu\n(khóa 15 phút sau 5 lần sai) (400)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 562.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err_auth", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 635, 'width': 25, 'height': 25})

    add_cell(root, "dec_active", "Tài khoản hoạt động?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 645, 'width': 130, 'height': 50})
    add_cell(root, "act_err_locked", "Báo lỗi: Tài khoản đang bị khóa\nhoặc ngừng hoạt động", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 647.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err_locked", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 720, 'width': 25, 'height': 25})

    add_cell(root, "act_jwt", "Khởi tạo JWT Token & Đọc cờ\nmust_change_password từ User", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 725, 'width': 220, 'height': 45})
    add_cell(root, "act_resp", "Phản hồi 200 OK kèm Token\nvà mustChangePassword", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 800, 'width': 220, 'height': 45})

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
        ("f9", "", STYLE_FLOW, "act_resp", "dec_must_pwd"),
        ("f10_pwd", "[Có]", STYLE_FLOW, "dec_must_pwd", "act_redir_pwd"),
        ("f10_pend", "", STYLE_FLOW, "act_redir_pwd", "end_pwd"),
        ("f10_dash", "[Không]", STYLE_FLOW, "dec_must_pwd", "act_redirect"),
        ("f10_dend", "", STYLE_FLOW, "act_redirect", "end_ok"),
    ]
    for fid, fval, fsty, fsrc, ftgt in flows:
        add_cell(root, fid, fval, fsty, edge=True, source=fsrc, target=ftgt, geometry={'relative': 1})
    return model

# 2. ĐỔI MẬT KHẨU
def build_act_2_changepwd():
    model, root = create_base_model(1180, 1020)
    setup_activity_header(root, "BIỂU ĐỒ HOẠT ĐỘNG: ĐỔI MẬT KHẨU TÀI KHOẢN",
                          "Quy trình xác thực mật khẩu cũ, kiểm tra khác MK hiện tại, băm BCrypt mật khẩu mới và tự động đăng xuất",
                          "Người dùng (Sinh viên / Giảng viên)", "Hệ thống (AuthService & CSDL MySQL)", lane_h=880)

    # Actor Lane
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_open", "Mở Menu cá nhân\nHOẶC Modal bắt buộc đổi MK", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_input", "Nhập Mật khẩu hiện tại,\nMật khẩu mới & Xác nhận MK", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 250, 'width': 200, 'height': 45})
    add_cell(root, "act_click", "Bấm nút Xác nhận đổi", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 325, 'width': 200, 'height': 45})
    add_cell(root, "act_toast", "Nhận thông báo Toast thành công\n& Tự động đăng xuất tài khoản", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 780, 'width': 200, 'height': 45})
    add_cell(root, "act_login_redirect", "Chuyển về màn hình Đăng nhập\nđể đăng nhập với mật khẩu mới", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 855, 'width': 200, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 930, 'width': 25, 'height': 25})

    # System Lane
    add_cell(root, "act_val", "Kiểm tra MK mới khớp xác nhận,\nđộ dài >= 6 & khác MK tạm", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 325, 'width': 220, 'height': 45})
    add_cell(root, "dec_val", "Mật khẩu mới hợp lệ?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 400, 'width': 130, 'height': 50})
    add_cell(root, "act_err_val", "Báo lỗi: Mật khẩu mới không hợp lệ\n(không khớp, quá ngắn hoặc trùng MK cũ)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 402.5, 'width': 220, 'height': 45})
    add_cell(root, "end_err_val", "", STYLE_END, vertex=True, geometry={'x': 907.5, 'y': 475, 'width': 25, 'height': 25})

    add_cell(root, "act_check_old", "Lấy User từ CSDL & So khớp MK cũ\n(passwordEncoder.matches)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 485, 'width': 220, 'height': 45})
    add_cell(root, "dec_old", "Mật khẩu cũ đúng?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 560, 'width': 130, 'height': 50})
    add_cell(root, "act_err_old", "Báo lỗi: Mật khẩu cũ không đúng\n(400 Bad Request)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 562.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err_old", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 635, 'width': 25, 'height': 25})

    add_cell(root, "act_hash_save", "Mã hóa BCrypt mật khẩu mới,\ncập nhật mustChangePassword=false", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 650, 'width': 220, 'height': 45})
    add_cell(root, "act_audit", "Ghi Security Audit Log & Lưu DB\nUPDATE users SET password=...", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 715, 'width': 220, 'height': 45})
    add_cell(root, "act_resp", "Phản hồi 200 OK\nĐổi mật khẩu thành công", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 780, 'width': 220, 'height': 45})

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
        ("f7", "", STYLE_FLOW, "act_hash_save", "act_audit"),
        ("f7b", "", STYLE_FLOW, "act_audit", "act_resp"),
        ("f8", "", STYLE_FLOW, "act_resp", "act_toast"),
        ("f9", "", STYLE_FLOW, "act_toast", "act_login_redirect"),
        ("f10", "", STYLE_FLOW, "act_login_redirect", "end_ok"),
    ]
    for fid, fval, fsty, fsrc, ftgt in flows:
        add_cell(root, fid, fval, fsty, edge=True, source=fsrc, target=ftgt, geometry={'relative': 1})
    return model

# 3. THÊM MỚI SINH VIÊN
def build_act_3_stu_create():
    model, root = create_base_model(1180, 950)
    setup_activity_header(root, "BIỂU ĐỒ HOẠT ĐỘNG: THÊM MỚI SINH VIÊN & CẤP TÀI KHOẢN",
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
    add_cell(root, "act_resp", "Phản hồi 200 OK & Toast\nThêm sinh viên thành công!", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 730, 'width': 220, 'height': 45})

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
    setup_activity_header(root, "BIỂU ĐỒ HOẠT ĐỘNG: CẬP NHẬT HỒ SƠ & KHÓA TÀI KHOẢN SINH VIÊN",
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
    setup_activity_header(root, "BIỂU ĐỒ HOẠT ĐỘNG: QUẢN LÝ KHOA & LỚP SINH HOẠT",
                          "Quy trình thiết lập cơ cấu học vụ: Khởi tạo lớp sinh hoạt trực thuộc Khoa",
                          "Quản trị viên", "Hệ thống (ClassService & CSDL MySQL)", lane_h=750)

    # Actor Lane
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_nav", "Vào mục Khoa & Lớp sinh hoạt\n& Bấm Thêm lớp sinh hoạt", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_input", "Nhập Mã lớp, Tên lớp, Niên khóa\n& Chọn Khoa quản lý", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 250, 'width': 200, 'height': 45})
    add_cell(root, "act_submit", "Bấm nút Tạo lớp sinh hoạt", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 325, 'width': 200, 'height': 45})
    add_cell(root, "act_view", "Xem lớp mới xuất hiện trong danh sách\nlớp sinh hoạt & Đóng hộp thoại", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 635, 'width': 200, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 715, 'width': 25, 'height': 25})

    # System Lane
    add_cell(root, "act_check", "Kiểm tra trùng Mã lớp & verify\nKhoa (departmentId) tồn tại", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 325, 'width': 220, 'height': 45})
    add_cell(root, "dec_code", "Mã hợp lệ & chưa trùng?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 400, 'width': 130, 'height': 50})
    add_cell(root, "act_err_code", "Báo lỗi: Mã lớp đã tồn tại\nhoặc Khoa không hợp lệ (400)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 402.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 475, 'width': 25, 'height': 25})

    add_cell(root, "act_save", "INSERT INTO classes\n(code, name, department_id, academic_year)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 485, 'width': 220, 'height': 45})
    add_cell(root, "act_resp", "Phản hồi 200 OK\nTạo lớp sinh hoạt thành công", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 635, 'width': 220, 'height': 45})

    flows = [
        ("f1", "", STYLE_FLOW, "start", "act_nav"),
        ("f2", "", STYLE_FLOW, "act_nav", "act_input"),
        ("f3", "", STYLE_FLOW, "act_input", "act_submit"),
        ("f4", "", STYLE_FLOW, "act_submit", "act_check"),
        ("f5", "", STYLE_FLOW, "act_check", "dec_code"),
        ("f5_err", "[Sai/Trùng]", STYLE_FLOW, "dec_code", "act_err_code"),
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
    setup_activity_header(root, "BIỂU ĐỒ HOẠT ĐỘNG: QUẢN LÝ GIẢNG VIÊN & CẤP TÀI KHOẢN",
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
    add_cell(root, "act_resp", "Phản hồi 200 OK & Toast\nThêm giảng viên thành công!", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 710, 'width': 220, 'height': 45})

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
    setup_activity_header(root, "BIỂU ĐỒ HOẠT ĐỘNG: QUẢN LÝ MÔN HỌC & TÍN CHỈ",
                          "Quy trình tạo mới môn học, định nghĩa số tín chỉ đào tạo và đồng bộ xóa bộ nhớ đệm ứng dụng",
                          "Quản trị viên", "Hệ thống (SubjectService & CSDL MySQL)", lane_h=750)

    # Actor Lane
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_nav", "Vào Quản lý Môn học\n& Bấm Thêm môn học", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_input", "Nhập Mã môn, Tên môn, Tín chỉ (1..10),\nKhoa quản lý & Môn tiên quyết", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 250, 'width': 200, 'height': 45})
    add_cell(root, "act_submit", "Bấm nút Lưu môn học", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 325, 'width': 200, 'height': 45})
    add_cell(root, "act_view", "Cập nhật bảng danh mục môn học\n& Đóng hộp thoại thêm mới", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 635, 'width': 200, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 715, 'width': 25, 'height': 25})

    # System Lane
    add_cell(root, "act_check", "Kiểm tra trùng Mã môn học\n(existsBySubjectCode)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 325, 'width': 220, 'height': 45})
    add_cell(root, "dec_code", "Mã môn đã tồn tại?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 400, 'width': 130, 'height': 50})
    add_cell(root, "act_err_code", "Báo lỗi: Mã môn học đã tồn tại\ntrong hệ thống (400)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 402.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 475, 'width': 25, 'height': 25})

    add_cell(root, "act_save", "INSERT INTO subjects & Xóa bộ nhớ đệm\nmôn học (@CacheEvict('subjects'))", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 485, 'width': 220, 'height': 45})
    add_cell(root, "act_resp", "Phản hồi 200 OK kèm SubjectResponse (DTO)\nTạo môn học thành công", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 635, 'width': 220, 'height': 45})

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
    setup_activity_header(root, "BIỂU ĐỒ HOẠT ĐỘNG: CẤU HÌNH HỌC KỲ & ĐỢT ĐĂNG KÝ HỌC TẬP",
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
    setup_activity_header(root, "BIỂU ĐỒ HOẠT ĐỘNG: MỞ & ĐIỀU PHỐI LỚP HỌC PHẦN",
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
    setup_activity_header(root, "BIỂU ĐỒ HOẠT ĐỘNG: XẾP THỜI KHÓA BIỂU & KIỂM TRA XUNG ĐỘT",
                          "Quy trình phân bổ phòng học, thứ, tiết học và kiểm tra tự động xung đột trùng phòng hoặc trùng lịch giảng viên",
                          "Quản trị viên", "Hệ thống (ScheduleService & CSDL MySQL)", lane_h=820)

    # Actor Lane
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_input", "Chọn Lớp HP, Phòng học, Thứ (day),\nTiết bắt đầu - Tiết kết thúc, Ngày", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_submit", "Bấm nút Lưu thời khóa biểu", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 250, 'width': 200, 'height': 45})
    add_cell(root, "act_view", "Vẽ ô lịch học lên lưới Thời khóa biểu\n& Nhận thông báo xếp lịch thành công", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 710, 'width': 200, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 790, 'width': 25, 'height': 25})

    # System Lane
    add_cell(root, "act_check_room", "validatePeriodsAndDates (tiết, ngày hợp lệ)\n& Kiểm tra xung đột phòng: findRoomConflicts()", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 250, 'width': 220, 'height': 45})
    add_cell(root, "dec_room", "Tiết/ngày sai hoặc trùng phòng?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 335, 'width': 130, 'height': 50})
    add_cell(root, "act_err_room", "Báo lỗi: Tiết/ngày không hợp lệ hoặc\nphòng đã xếp cho lớp khác (400)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 337.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err_r", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 415, 'width': 25, 'height': 25})

    add_cell(root, "act_check_lec", "Kiểm tra xung đột lịch giảng viên & lịch\nsinh viên đã đăng ký (check Lecturer + Student)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 440, 'width': 220, 'height': 45})
    add_cell(root, "dec_lec", "Trùng lịch GV hoặc SV?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 525, 'width': 130, 'height': 50})
    add_cell(root, "act_err_lec", "Báo lỗi: Giảng viên hoặc sinh viên đã có\nlịch khác cùng thời điểm (400)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 527.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err_l", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 605, 'width': 25, 'height': 25})

    add_cell(root, "act_save", "INSERT INTO schedules & Lưu CSDL\nhoàn tất xếp thời khóa biểu", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 615, 'width': 220, 'height': 45})
    add_cell(root, "act_resp", "Phản hồi 200 OK\nXếp lịch học thành công", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 710, 'width': 220, 'height': 45})

    flows = [
        ("f1", "", STYLE_FLOW, "start", "act_input"),
        ("f2", "", STYLE_FLOW, "act_input", "act_submit"),
        ("f3", "", STYLE_FLOW, "act_submit", "act_check_room"),
        ("f4", "", STYLE_FLOW, "act_check_room", "dec_room"),
        ("f4_err", "[Sai/Trùng phòng]", STYLE_FLOW, "dec_room", "act_err_room"),
        ("f4_end", "", STYLE_FLOW, "act_err_room", "end_err_r"),
        ("f4_ok", "[Hợp lệ]", STYLE_FLOW, "dec_room", "act_check_lec"),
        ("f5", "", STYLE_FLOW, "act_check_lec", "dec_lec"),
        ("f5_err", "[Trùng lịch]", STYLE_FLOW, "dec_lec", "act_err_lec"),
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
    setup_activity_header(root, "BIỂU ĐỒ HOẠT ĐỘNG: SINH VIÊN ĐĂNG KÝ LỚP HỌC PHẦN",
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

    add_cell(root, "act_check_rules", "Kiểm tra: thuộc khung CTĐT, đạt môn tiên quyết,\nchưa đăng ký môn này, còn chỗ, không trùng lịch, <=30 TC", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 440, 'width': 220, 'height': 45})
    add_cell(root, "dec_rules", "Thỏa mọi điều kiện?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 525, 'width': 130, 'height': 50})
    add_cell(root, "act_err_rules", "Báo lỗi: Chưa đạt tiên quyết / Lớp đầy /\nTrùng lịch / Vượt 30 tín chỉ (400)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 527.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err_r", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 605, 'width': 25, 'height': 25})

    add_cell(root, "act_insert", "INSERT INTO enrollments (status=ENROLLED)\nTrigger MySQL: enrolled_count + 1", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 640, 'width': 220, 'height': 45})
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
    setup_activity_header(root, "BIỂU ĐỒ HOẠT ĐỘNG: HỦY ĐĂNG KÝ HỌC PHẦN & HOÀN TRẢ SĨ SỐ",
                          "Quy trình hủy đăng ký học phần, giải phóng chỗ trống và kích hoạt trigger tự động giảm sĩ số lớp học phần",
                          "Sinh viên", "Hệ thống (EnrollmentService & CSDL MySQL)", lane_h=750)

    # Actor Lane
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_view", "Vào mục Lớp học phần của tôi\n& Chọn môn học muốn hủy", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_click", "Bấm nút Hủy đăng ký", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 250, 'width': 200, 'height': 45})
    add_cell(root, "act_confirm", "Xác nhận môn học đã được rút\nkhỏi Thời khóa biểu học kỳ", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 635, 'width': 200, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 715, 'width': 25, 'height': 25})

    # System Lane
    add_cell(root, "act_check_owner", "Kiểm tra quyền sở hữu, status == ENROLLED,\ncòn trong hạn đăng ký & chưa có điểm", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 250, 'width': 220, 'height': 45})
    add_cell(root, "dec_owner", "Hợp lệ & Được hủy?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 335, 'width': 130, 'height': 50})
    add_cell(root, "act_err_owner", "Báo lỗi: Hết hạn đăng ký, đã có điểm\nhoặc không có quyền hủy (400)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 337.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 415, 'width': 25, 'height': 25})

    add_cell(root, "act_cancel", "UPDATE enrollments SET status='CANCELLED'\nTrigger MySQL: enrolled_count - 1", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 440, 'width': 220, 'height': 45})
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
    setup_activity_header(root, "BIỂU ĐỒ HOẠT ĐỘNG: GIẢNG VIÊN NHẬP ĐIỂM THÀNH PHẦN & TÍNH TỔNG KẾT",
                          "Quy trình giảng viên nhập điểm CC1 (5%), CC2 (5%), giữa kỳ (30%), cuối kỳ (60%), tự động tính hệ 10 và xét điểm liệt CK < 3.0",
                          "Giảng viên", "Hệ thống (GradeService & CSDL MySQL)", lane_h=800)

    # Actor Lane
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_open", "Mở Sổ điểm lớp học phần phụ trách\n& Nhập CC1 (5%), CC2 (5%), GK (30%), CK (60%)", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_click", "Bấm nút Lưu tạm (finalize=false)", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 250, 'width': 200, 'height': 45})
    add_cell(root, "act_view", "Xem điểm Tổng kết, Điểm Chữ & GPA\nhiển thị tự động trên sổ điểm", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 710, 'width': 200, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 790, 'width': 25, 'height': 25})

    # System Lane
    add_cell(root, "act_check_auth", "Kiểm tra quyền Giảng viên\nphụ trách đúng lớp học phần (RBAC)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 250, 'width': 220, 'height': 45})
    add_cell(root, "dec_auth", "Đúng GV phụ trách?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 335, 'width': 130, 'height': 50})
    add_cell(root, "act_err_auth", "Báo lỗi: Bạn không có quyền nhập điểm\ncho lớp học phần này (400)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 337.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 415, 'width': 25, 'height': 25})

    add_cell(root, "act_calc", "BR-07: calculateTotalScore():\nTotal = CC1*0.05 + CC2*0.05 + GK*0.3 + CK*0.6\n(BR-08: Điểm liệt CK < 3.0 -> Xếp F)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 440, 'width': 220, 'height': 50})
    add_cell(root, "act_convert", "Quy đổi Hệ 4 & Điểm chữ\n(A, B+, B, C+, C, D+, D, F)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 525, 'width': 220, 'height': 45})
    add_cell(root, "act_save", "UPDATE grades SET cc1_score, cc2_score...\nis_finalized=false (Lưu bản nháp)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 610, 'width': 220, 'height': 45})
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
    model, root = create_base_model(1180, 980)
    setup_activity_header(root, "BIỂU ĐỒ HOẠT ĐỘNG: CHỐT SỔ ĐIỂM HỌC PHẦN & CỬA SỔ SỬA ĐIỂM 7 NGÀY",
                          "Quy trình chốt sổ điểm, công bố kết quả cho sinh viên, quản lý cửa sổ ân hạn 7 ngày và cơ chế Admin mở khóa",
                          "Giảng viên & Admin", "Hệ thống (GradeService & CSDL MySQL)", lane_h=850)

    # Actor Lane
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 120, 'width': 25, 'height': 25})
    add_cell(root, "act_review", "Kiểm tra lại toàn bộ điểm các cột\n& Bấm nút Chốt bảng điểm", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 175, 'width': 200, 'height': 45})
    add_cell(root, "act_lock_ui", "Hiển thị Badge ĐÃ CÔNG BỐ\n(Mở cửa sổ 7 ngày cho phép sửa)", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 550, 'width': 200, 'height': 45})

    add_cell(root, "dec_time", "Sửa trong hạn 7 ngày?", STYLE_DECISION, vertex=True, geometry={'x': 175, 'y': 635, 'width': 130, 'height': 50})
    add_cell(root, "act_edit_grace", "GV sửa điểm trong 7 ngày\n(Mốc 7 ngày không gia hạn)", STYLE_ACTIVITY, vertex=True, geometry={'x': 40, 'y': 715, 'width': 180, 'height': 45})
    add_cell(root, "act_hard_lock", "Quá 7 ngày -> Khóa cứng GV\n(Chỉ Admin mở khóa được)", STYLE_ACTIVITY, vertex=True, geometry={'x': 230, 'y': 715, 'width': 180, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 800, 'width': 25, 'height': 25})

    # System Lane
    add_cell(root, "act_check_full", "Kiểm tra toàn bộ sinh viên trong lớp\nđã nhập đủ các cột điểm thành phần", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 175, 'width': 220, 'height': 45})
    add_cell(root, "dec_full", "Đã nhập đủ 100% điểm?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 260, 'width': 130, 'height': 50})
    add_cell(root, "act_err_full", "Báo lỗi: Không thể chốt điểm\nkhi chưa nhập đủ điểm thành phần (400)", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 262.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 340, 'width': 25, 'height': 25})

    add_cell(root, "act_set_lock", "Ghi nhận is_finalized = true\nvà finalized_at = NOW() (Công bố cho SV)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 370, 'width': 220, 'height': 45})
    add_cell(root, "act_save", "UPDATE grades SET is_finalized=true, finalized_at=NOW()\nWHERE enrollment_id IN (...)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 460, 'width': 220, 'height': 45})
    add_cell(root, "act_resp", "Phản hồi 200 OK\nLưu điểm thành công", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 550, 'width': 220, 'height': 45})

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
        ("f7", "", STYLE_FLOW, "act_lock_ui", "dec_time"),
        ("f8_in", "[<= 7 ngày]", STYLE_FLOW, "dec_time", "act_edit_grace"),
        ("f8_out", "[> 7 ngày]", STYLE_FLOW, "dec_time", "act_hard_lock"),
        ("f8_loop", "", STYLE_FLOW, "act_edit_grace", "end_ok"),
        ("f8_end", "", STYLE_FLOW, "act_hard_lock", "end_ok"),
    ]
    for fid, fval, fsty, fsrc, ftgt in flows:
        add_cell(root, fid, fval, fsty, edge=True, source=fsrc, target=ftgt, geometry={'relative': 1})
    return model

# 15. BẢNG ĐIỂM & ĐIỂM CPA
def build_act_15_transcript():
    model, root = create_base_model(1180, 830)
    setup_activity_header(root, "BIỂU ĐỒ HOẠT ĐỘNG: TRA CỨU BẢNG ĐIỂM & TÍNH ĐIỂM GPA / CPA",
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
    add_cell(root, "act_cpa", "Tính CPA tích lũy (lấy lần học tốt nhất mỗi môn):\ncumulativeGpa = totalWeightedGpa / totalCredits", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 430, 'width': 220, 'height': 45})
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
    setup_activity_header(root, "BIỂU ĐỒ HOẠT ĐỘNG: BÁO CÁO THỐNG KÊ TOÀN TRƯỜNG & DASHBOARD",
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


# ==========================================
# 17. QUẢN LÝ & THU HỌC PHÍ (TUITION)
# ==========================================
def build_act_17_tuition_management():
    model, root = create_base_model(1180, 1100)
    setup_activity_header(root, "BIỂU ĐỒ HOẠT ĐỘNG: QUẢN LÝ & THU HỌC PHÍ",
                          "Quy trình đối soát công nợ, thu tiền học phí theo tín chỉ, lập biên lai thu tiền và xét duyệt gia hạn nộp học phí",
                          "Quản trị viên / Thu ngân / Sinh viên", "Hệ thống (TuitionService & MySQL Database)", lane_h=980)

    # Actor Lane (Center x=240)
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 115, 'width': 25, 'height': 25})
    add_cell(root, "act_open", "Truy cập Phân hệ Thu ngân\n(/admin/tuition)", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 165, 'width': 200, 'height': 45})
    add_cell(root, "act_search", "Nhập MSSV hoặc Mã học kỳ\nđể tra cứu công nợ", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 240, 'width': 200, 'height': 45})
    add_cell(root, "act_choose", "Chọn hình thức xử lý:\nThu tiền mặt hoặc Gia hạn", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 510, 'width': 200, 'height': 45})

    add_cell(root, "dec_act", "Tác vụ lựa chọn?", STYLE_DECISION, vertex=True, geometry={'x': 175, 'y': 585, 'width': 130, 'height': 50})
    
    # Sub-flow 1: Thu tiền
    add_cell(root, "act_input_pay", "Nhập số tiền thực thu,\nphương thức & ghi chú", STYLE_ACTIVITY, vertex=True, geometry={'x': 40, 'y': 665, 'width': 180, 'height': 45})
    add_cell(root, "act_receipt", "In biên lai thu tiền\nđiện tử cho Sinh viên", STYLE_ACTIVITY, vertex=True, geometry={'x': 40, 'y': 875, 'width': 180, 'height': 45})
    add_cell(root, "end_pay", "", STYLE_END, vertex=True, geometry={'x': 117.5, 'y': 945, 'width': 25, 'height': 25})

    # Sub-flow 2: Gia hạn
    add_cell(root, "act_input_ext", "Nhập ngày gia hạn mới\n& lý do đơn xin hoãn", STYLE_ACTIVITY, vertex=True, geometry={'x': 230, 'y': 665, 'width': 180, 'height': 45})
    add_cell(root, "act_conf_ext", "Xác nhận gia hạn\nhạn nộp học phí", STYLE_ACTIVITY, vertex=True, geometry={'x': 230, 'y': 875, 'width': 180, 'height': 45})
    add_cell(root, "end_ext", "", STYLE_END, vertex=True, geometry={'x': 307.5, 'y': 945, 'width': 25, 'height': 25})

    # System Lane (Center x=620, Error x=910)
    add_cell(root, "act_query", "Truy vấn StudentInvoice &\ntổng hợp tín chỉ học phần", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 240, 'width': 220, 'height': 45})
    add_cell(root, "dec_inv", "Có hóa đơn học kỳ?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 315, 'width': 130, 'height': 50})
    add_cell(root, "act_err_inv", "Báo lỗi: Chưa phát sinh hóa đơn\nhọc phí trong kỳ này", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 317.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err_inv", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 390, 'width': 25, 'height': 25})

    add_cell(root, "act_show", "Trả về TuitionSummaryResponse:\nHọc phí gốc, Đã nộp, Còn nợ", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 430, 'width': 220, 'height': 45})
    add_cell(root, "act_val_pay", "Kiểm tra hợp lệ số tiền:\n(0 < Tiền thu <= Nợ còn lại)", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 665, 'width': 220, 'height': 45})
    add_cell(root, "dec_val_pay", "Số tiền hợp lệ?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 740, 'width': 130, 'height': 50})
    add_cell(root, "act_err_pay", "Báo lỗi: Số tiền thu vượt quá\ncông nợ hiện tại", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 742.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err_pay", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 815, 'width': 25, 'height': 25})

    add_cell(root, "act_save_pay", "Cập nhật paid_amount, balance,\nchuyển status='PAID' & sinh Receipt", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 825, 'width': 220, 'height': 45})
    add_cell(root, "act_save_ext", "Cập nhật dueDate mới\n& ghi log gia hạn", STYLE_ACTIVITY, vertex=True, geometry={'x': 750, 'y': 825, 'width': 200, 'height': 45})

    # Flows
    add_cell(root, "f1", "", STYLE_FLOW, edge=True, source="start", target="act_open")
    add_cell(root, "f2", "", STYLE_FLOW, edge=True, source="act_open", target="act_search")
    add_cell(root, "f3", "", STYLE_FLOW, edge=True, source="act_search", target="act_query")
    add_cell(root, "f4", "", STYLE_FLOW, edge=True, source="act_query", target="dec_inv")
    add_cell(root, "f5", "[Không]", STYLE_FLOW, edge=True, source="dec_inv", target="act_err_inv")
    add_cell(root, "f6", "", STYLE_FLOW, edge=True, source="act_err_inv", target="end_err_inv")
    add_cell(root, "f7", "[Có]", STYLE_FLOW, edge=True, source="dec_inv", target="act_show")
    add_cell(root, "f8", "", STYLE_FLOW, edge=True, source="act_show", target="act_choose")
    add_cell(root, "f9", "", STYLE_FLOW, edge=True, source="act_choose", target="dec_act")
    add_cell(root, "f10", "[Thu tiền]", STYLE_FLOW, edge=True, source="dec_act", target="act_input_pay")
    add_cell(root, "f11", "[Gia hạn]", STYLE_FLOW, edge=True, source="dec_act", target="act_input_ext")
    add_cell(root, "f12", "", STYLE_FLOW, edge=True, source="act_input_pay", target="act_val_pay")
    add_cell(root, "f13", "", STYLE_FLOW, edge=True, source="act_val_pay", target="dec_val_pay")
    add_cell(root, "f14", "[Không]", STYLE_FLOW, edge=True, source="dec_val_pay", target="act_err_pay")
    add_cell(root, "f15", "", STYLE_FLOW, edge=True, source="act_err_pay", target="end_err_pay")
    add_cell(root, "f16", "[Hợp lệ]", STYLE_FLOW, edge=True, source="dec_val_pay", target="act_save_pay")
    add_cell(root, "f17", "", STYLE_FLOW, edge=True, source="act_save_pay", target="act_receipt")
    add_cell(root, "f18", "", STYLE_FLOW, edge=True, source="act_receipt", target="end_pay")
    add_cell(root, "f19", "", STYLE_FLOW, edge=True, source="act_input_ext", target="act_save_ext")
    add_cell(root, "f20", "", STYLE_FLOW, edge=True, source="act_save_ext", target="act_conf_ext")
    add_cell(root, "f21", "", STYLE_FLOW, edge=True, source="act_conf_ext", target="end_ext")

    return model

# ==========================================
# 18. ĐIỂM DANH LỚP HỌC & CHECK-IN TRỰC TIẾP (ATTENDANCE)
# ==========================================
def build_act_18_live_attendance():
    model, root = create_base_model(1180, 1100)
    setup_activity_header(root, "BIỂU ĐỒ HOẠT ĐỘNG: ĐIỂM DANH LỚP HỌC & CHECK-IN TRỰC TIẾP",
                          "Quy trình mở phiên điểm danh phát mã PIN thời gian thực, sinh viên check-in và chốt danh sách chuyên cần",
                          "Giảng viên & Sinh viên", "Hệ thống (AttendanceService & MySQL Database)", lane_h=980)

    # Actor Lane (Center x=240)
    add_cell(root, "start", "", STYLE_START, vertex=True, geometry={'x': 227.5, 'y': 115, 'width': 25, 'height': 25})
    add_cell(root, "act_open", "Giảng viên chọn lớp học phần\nvà bấm 'Mở phiên điểm danh'", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 165, 'width': 200, 'height': 45})
    add_cell(root, "act_stu_pin", "Sinh viên mở Portal, nhập mã PIN\nvà bấm 'Xác nhận check-in'", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 430, 'width': 200, 'height': 45})
    add_cell(root, "act_lec_review", "Giảng viên theo dõi sĩ số realtime,\nđiều chỉnh vắng có phép nếu có", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 690, 'width': 200, 'height': 45})
    add_cell(root, "act_lec_close", "Giảng viên bấm 'Chốt sổ &\nKết thúc phiên điểm danh'", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 765, 'width': 200, 'height': 45})
    add_cell(root, "act_conf_done", "Xem tỷ lệ chuyên cần buổi học\nvà danh sách sinh viên vắng", STYLE_ACTIVITY, vertex=True, geometry={'x': 140, 'y': 895, 'width': 200, 'height': 45})
    add_cell(root, "end_ok", "", STYLE_END, vertex=True, geometry={'x': 227.5, 'y': 965, 'width': 25, 'height': 25})

    # System Lane (Center x=620, Error x=910)
    add_cell(root, "act_create_ses", "Khởi tạo AttendanceSession,\nsinh mã PIN 6 số & hạn 10 phút", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 165, 'width': 220, 'height': 45})
    add_cell(root, "act_show_pin", "Trình chiếu mã PIN & đồng hồ\nđếm ngược lên màn hình lớp", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 240, 'width': 220, 'height': 45})
    add_cell(root, "act_val_checkin", "Kiểm tra: Đúng mã PIN,\ntrong hạn & có trong danh sách lớp", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 430, 'width': 220, 'height': 45})
    add_cell(root, "dec_checkin", "Check-in hợp lệ?", STYLE_DECISION, vertex=True, geometry={'x': 555, 'y': 505, 'width': 130, 'height': 50})
    add_cell(root, "act_err_pin", "Báo lỗi: Mã PIN không đúng\nhoặc ca học đã hết hạn", STYLE_ACTIVITY, vertex=True, geometry={'x': 810, 'y': 507.5, 'width': 200, 'height': 45})
    add_cell(root, "end_err_pin", "", STYLE_END, vertex=True, geometry={'x': 897.5, 'y': 580, 'width': 25, 'height': 25})

    add_cell(root, "act_save_present", "Ghi nhận 'PRESENT' vào CSDL\nvà cập nhật số đếm thời gian thực", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 600, 'width': 220, 'height': 45})
    add_cell(root, "act_finalize_db", "Tự động gán trạng thái 'ABSENT'\ncho các SV không check-in", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 765, 'width': 220, 'height': 45})
    add_cell(root, "act_save_all", "Khóa phiên (is_finalized=true)\nvà lưu toàn bộ AttendanceRecord", STYLE_ACTIVITY, vertex=True, geometry={'x': 510, 'y': 840, 'width': 220, 'height': 45})

    # Flows
    add_cell(root, "f1", "", STYLE_FLOW, edge=True, source="start", target="act_open")
    add_cell(root, "f2", "", STYLE_FLOW, edge=True, source="act_open", target="act_create_ses")
    add_cell(root, "f3", "", STYLE_FLOW, edge=True, source="act_create_ses", target="act_show_pin")
    add_cell(root, "f4", "", STYLE_FLOW, edge=True, source="act_show_pin", target="act_stu_pin")
    add_cell(root, "f5", "", STYLE_FLOW, edge=True, source="act_stu_pin", target="act_val_checkin")
    add_cell(root, "f6", "", STYLE_FLOW, edge=True, source="act_val_checkin", target="dec_checkin")
    add_cell(root, "f7", "[Không]", STYLE_FLOW, edge=True, source="dec_checkin", target="act_err_pin")
    add_cell(root, "f8", "", STYLE_FLOW, edge=True, source="act_err_pin", target="end_err_pin")
    add_cell(root, "f9", "[Hợp lệ]", STYLE_FLOW, edge=True, source="dec_checkin", target="act_save_present")
    add_cell(root, "f10", "", STYLE_FLOW, edge=True, source="act_save_present", target="act_lec_review")
    add_cell(root, "f11", "", STYLE_FLOW, edge=True, source="act_lec_review", target="act_lec_close")
    add_cell(root, "f12", "", STYLE_FLOW, edge=True, source="act_lec_close", target="act_finalize_db")
    add_cell(root, "f13", "", STYLE_FLOW, edge=True, source="act_finalize_db", target="act_save_all")
    add_cell(root, "f14", "", STYLE_FLOW, edge=True, source="act_save_all", target="act_conf_done")
    add_cell(root, "f15", "", STYLE_FLOW, edge=True, source="act_conf_done", target="end_ok")

    return model

# Aliases matching generate_all_4_diagrams.py
build_act_2_change_password = build_act_2_changepwd
build_act_3_student_create = build_act_3_stu_create
build_act_4_student_manage = build_act_4_stu_manage
build_act_5_academic_structure = build_act_5_academic
build_act_9_course_sections = build_act_9_sections
build_act_15_transcript_cpa = build_act_15_transcript
build_act_16_analytics_dashboard = build_act_16_dashboard
build_act_17_tuition = build_act_17_tuition_management
build_act_18_attendance = build_act_18_live_attendance

# ==========================================
# GHI TẤT CẢ 18 TAB VÀO Activity_Diagrams.drawio
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
        ("14. Chốt bảng điểm & Cửa sổ 7 ngày", build_act_14_grading_finalize()),
        ("15. Bảng điểm & Điểm CPA", build_act_15_transcript_cpa()),
        ("16. Báo cáo Thống kê & Dashboard", build_act_16_dashboard()),
        ("17. Quản lý & Thu học phí", build_act_17_tuition_management()),
        ("18. Điểm danh lớp học & Check-in trực tiếp", build_act_18_live_attendance()),
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
