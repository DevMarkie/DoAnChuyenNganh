# -*- coding: utf-8 -*-
"""
Biểu đồ Trình tự (Sequence Diagrams) chuẩn OMG UML 2.5 khớp 100% kiến trúc dự án thực tế:
Tác nhân (Actor) -> Giao diện React (Boundary) -> Spring REST Controller -> Business Service -> JPA Repository -> Cơ sở dữ liệu MySQL (+ Redis Sentinel Lock)

Đặc điểm thiết kế chuẩn học thuật:
1. Khớp 100% các Class, Controller, Service, Repository, DTO và Endpoint có thật trong source code backend/ và frontend/.
2. Thiết kế Trắng & Đen (Monochrome) độ tương phản cao, rõ nét, thanh lịch, dễ nhìn và tối ưu in ấn đồ án.
3. Nhãn thông điệp có nền trắng (labelBackgroundColor=#ffffff) chống bị đường lifeline cắt ngang chữ.
4. Tọa độ mũi tên ngang chuẩn xác từng pixel, khoảng cách giữa các thông điệp rộng rãi (40-50px).
5. Thanh kích hoạt (Activation boxes) khớp chính xác từng chu kỳ gọi và hoàn trả.
6. Đầy đủ 23 tab chức năng nghiệp vụ độc lập, đồng bộ 1-1 với Ma trận Chức năng cốt lõi đồ án.
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
    
    if edge and geometry is None:
        geometry = {'relative': '1'}

    if geometry:
        geom_attribs = {'as': 'geometry'}
        for k, v in geometry.items():
            geom_attribs[k] = str(v)
        ET.SubElement(cell, 'mxGeometry', geom_attribs)
    return cell

def add_message(root, id_val, text, x1, x2, y, is_reply=False, is_self=False):
    style_call = "html=1;verticalAlign=bottom;endArrow=block;endFill=1;strokeColor=#000000;strokeWidth=1.5;labelBackgroundColor=#ffffff;labelBorderColor=none;fillColor=none;fontColor=#000000;fontSize=11;fontStyle=1;rounded=0;"
    style_reply = "html=1;verticalAlign=bottom;endArrow=open;dashed=1;dashPattern=1 4;strokeColor=#000000;strokeWidth=1.4;labelBackgroundColor=#ffffff;labelBorderColor=none;fillColor=none;fontColor=#000000;fontSize=10.5;fontStyle=2;rounded=0;"
    style_self = "html=1;verticalAlign=bottom;endArrow=block;endFill=1;strokeColor=#000000;strokeWidth=1.5;labelBackgroundColor=#ffffff;labelBorderColor=none;fillColor=none;fontColor=#000000;fontSize=10.5;fontStyle=1;edgeStyle=orthogonalEdgeStyle;curved=0;rounded=0;"

    if is_self:
        style = style_self
    elif is_reply:
        style = style_reply
    else:
        style = style_call

    cell = ET.SubElement(root, 'mxCell', {
        'id': str(id_val),
        'value': text,
        'style': style,
        'edge': '1',
        'parent': '1'
    })
    geom = ET.SubElement(cell, 'mxGeometry', {'relative': '1', 'as': 'geometry'})
    
    if is_self:
        ET.SubElement(geom, 'mxPoint', {'x': str(x1), 'y': str(y), 'as': 'sourcePoint'})
        ET.SubElement(geom, 'mxPoint', {'x': str(x1 + 4), 'y': str(y + 30), 'as': 'targetPoint'})
    else:
        ET.SubElement(geom, 'mxPoint', {'x': str(x1), 'y': str(y), 'as': 'sourcePoint'})
        ET.SubElement(geom, 'mxPoint', {'x': str(x2), 'y': str(y), 'as': 'targetPoint'})
    return cell

# =========================================================================
# STYLES - ACADEMIC MONOCHROME HIGH CONTRAST (OMG UML 2.5)
# =========================================================================
STYLE_UI = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;strokeColor=#000000;strokeWidth=1.5;fillColor=#ffffff;fontColor=#000000;fontStyle=1;fontSize=12;rounded=1;arcSize=10;shadow=0;"
STYLE_CTRL = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;strokeColor=#000000;strokeWidth=1.5;fillColor=#ffffff;fontColor=#000000;fontStyle=1;fontSize=12;rounded=1;arcSize=10;shadow=0;"
STYLE_SRV = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;strokeColor=#000000;strokeWidth=1.5;fillColor=#ffffff;fontColor=#000000;fontStyle=1;fontSize=12;rounded=1;arcSize=10;shadow=0;"
STYLE_REDIS = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;strokeColor=#000000;strokeWidth=1.5;fillColor=#ffffff;fontColor=#000000;fontStyle=1;fontSize=12;rounded=1;arcSize=10;shadow=0;"
STYLE_REPO = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;strokeColor=#000000;strokeWidth=1.5;fillColor=#ffffff;fontColor=#000000;fontStyle=1;fontSize=12;rounded=1;arcSize=10;shadow=0;"
STYLE_DB = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;strokeColor=#000000;strokeWidth=1.5;fillColor=#ffffff;fontColor=#000000;fontStyle=1;fontSize=12;rounded=1;arcSize=10;shadow=0;"

STYLE_ACTIVATION = "html=1;points=[];perimeter=orthogonalPerimeter;strokeColor=#000000;strokeWidth=1.5;fillColor=#ffffff;shadow=0;"
STYLE_SD_FRAME = "shape=umlFrame;whiteSpace=wrap;html=1;width=340;height=36;strokeColor=#000000;strokeWidth=1.8;fillColor=none;fontColor=#000000;fontStyle=1;fontSize=13;rounded=1;shadow=0;arcSize=6;"
STYLE_COMBINED_FRAGMENT = "shape=umlFrame;whiteSpace=wrap;html=1;width=140;height=24;strokeColor=#000000;strokeWidth=1.3;fillColor=none;fontColor=#000000;fontStyle=2;fontSize=11;dashed=1;rounded=1;arcSize=6;"

STYLE_ACTOR = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;strokeColor=#000000;strokeWidth=1.8;fillColor=#ffffff;fontColor=#000000;fontStyle=1;fontSize=12;rounded=1;arcSize=14;shadow=0;"

def get_actor_config(actor_name):
    return f":{actor_name}\n«actor»", STYLE_ACTOR

def create_base_model(page_w=1380, page_h=900):
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '794', 'grid': '1', 'gridSize': '10',
        'guides': '1', 'tooltips': '1', 'connect': '1', 'arrows': '1',
        'fold': '1', 'page': '1', 'pageScale': '1',
        'pageWidth': str(page_w), 'pageHeight': str(page_h),
        'background': '#ffffff', 'math': '0', 'shadow': '0'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")
    return model, root

def setup_6_lifelines(root, actor_name, ui_name, ctrl_name, srv_name, repo_name, db_name="Database (MySQL)", height=760):
    actor_label, actor_style = get_actor_config(actor_name)
    add_cell(root, "ll_act", actor_label, actor_style, vertex=True, geometry={'x': 30, 'y': 65, 'width': 100, 'height': height})
    add_cell(root, "ll_ui", f":{ui_name}\n«boundary / React»", STYLE_UI, vertex=True, geometry={'x': 220, 'y': 65, 'width': 180, 'height': height})
    add_cell(root, "ll_ctrl", f":{ctrl_name}\n«control / Controller»", STYLE_CTRL, vertex=True, geometry={'x': 460, 'y': 65, 'width': 180, 'height': height})
    add_cell(root, "ll_srv", f":{srv_name}\n«control / Service»", STYLE_SRV, vertex=True, geometry={'x': 700, 'y': 65, 'width': 180, 'height': height})
    add_cell(root, "ll_repo", f":{repo_name}\n«entity / Repository»", STYLE_REPO, vertex=True, geometry={'x': 940, 'y': 65, 'width': 180, 'height': height})
    add_cell(root, "ll_db", f":{db_name}\n«persistence»", STYLE_DB, vertex=True, geometry={'x': 1170, 'y': 65, 'width': 160, 'height': height})

def setup_7_lifelines(root, actor_name, ui_name, ctrl_name, srv_name, redis_name, repo_name, db_name="Database (MySQL)", height=780):
    actor_label, actor_style = get_actor_config(actor_name)
    add_cell(root, "ll_act", actor_label, actor_style, vertex=True, geometry={'x': 20, 'y': 65, 'width': 100, 'height': height})
    add_cell(root, "ll_ui", f":{ui_name}\n«boundary / React»", STYLE_UI, vertex=True, geometry={'x': 190, 'y': 65, 'width': 170, 'height': height})
    add_cell(root, "ll_ctrl", f":{ctrl_name}\n«control / Controller»", STYLE_CTRL, vertex=True, geometry={'x': 400, 'y': 65, 'width': 170, 'height': height})
    add_cell(root, "ll_srv", f":{srv_name}\n«control / Service»", STYLE_SRV, vertex=True, geometry={'x': 610, 'y': 65, 'width': 170, 'height': height})
    add_cell(root, "ll_redis", f":{redis_name}\n«service / Redis Cache»", STYLE_REDIS, vertex=True, geometry={'x': 820, 'y': 65, 'width': 170, 'height': height})
    add_cell(root, "ll_repo", f":{repo_name}\n«entity / Repository»", STYLE_REPO, vertex=True, geometry={'x': 1030, 'y': 65, 'width': 170, 'height': height})
    add_cell(root, "ll_db", f":{db_name}\n«persistence»", STYLE_DB, vertex=True, geometry={'x': 1240, 'y': 65, 'width': 160, 'height': height})

# ==========================================================
# 23 BIỂU ĐỒ TRÌNH TỰ CHUẨN DỰ ÁN (RÕ NÉT - ĐÚNG CODE - ĐỘC LẬP)
# ==========================================================

# 1. ĐĂNG NHẬP HỆ THỐNG
def build_seq_1_login():
    model, root = create_base_model(1380, 940)
    add_cell(root, "frame_login", "sd UC-01: Đăng nhập & Xác thực hệ thống", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 890})
    setup_6_lifelines(root, "Người dùng", "PortalLoginPage", "AuthController", "AuthService", "UserRepository", "Database (MySQL)", height=800)

    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 640})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 540})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 450})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 150})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 90})

    add_message(root, "m1", "1: Nhập username, password & Click Đăng nhập", 80, 305, 135)
    add_message(root, "m2", "2: validateForm(username, password)", 315, 315, 160, is_self=True)
    add_message(root, "m3", "3: POST /api/auth/login (LoginRequest)", 315, 545, 185)
    add_message(root, "m4", "4: login(LoginRequest request)", 555, 785, 230)
    add_message(root, "m5", "5: authenticate(UsernamePasswordAuthenticationToken)", 795, 795, 255, is_self=True)
    add_message(root, "m6", "6: findByUsername(username)", 795, 1025, 275)
    add_message(root, "m7", "7: SELECT * FROM users WHERE username = ?", 1035, 1245, 315)
    add_message(root, "m8", "8: Trả về bản ghi User (password, role, is_active, must_change_pwd)", 1245, 1025, 355, is_reply=True)
    add_message(root, "m9", "9: Trả về UserPrincipal (thông tin người dùng)", 1025, 785, 385, is_reply=True)
    add_message(root, "m10", "10: passwordEncoder.matches(raw, hash) & check isActive", 795, 795, 415, is_self=True)
    add_message(root, "m11", "11: jwtTokenProvider.generateToken(userPrincipal)", 795, 795, 450, is_self=True)
    add_message(root, "m12", "12: Trả về LoginResponse(token, role, username, userId, mustChangePassword)", 785, 545, 485, is_reply=True)
    add_message(root, "m13", "13: 200 OK + ApiResponse.success(LoginResponse)", 545, 315, 520, is_reply=True)
    add_message(root, "m14", "14: localStorage.setItem('token', token) & check mustChangePassword", 315, 315, 555, is_self=True)
    add_message(root, "m15", "15: [mustChangePassword == false] -> Điều hướng Dashboard theo Role", 315, 80, 595, is_reply=True)

    add_cell(root, "alt_pwd", "alt [mustChangePassword == true]", STYLE_COMBINED_FRAGMENT, vertex=True, geometry={'x': 180, 'y': 635, 'width': 1050, 'height': 80})
    add_message(root, "m_alt_pwd1", "Chuyển hướng bắt buộc sang ForcePasswordChangeModal", 315, 80, 665, is_reply=True)
    add_message(root, "m_alt_pwd2", "Hiển thị form yêu cầu đổi mật khẩu lần đầu", 305, 80, 695, is_reply=True)

    add_cell(root, "alt_err", "opt [Xác thực thất bại / Tài khoản bị khóa]", STYLE_COMBINED_FRAGMENT, vertex=True, geometry={'x': 180, 'y': 730, 'width': 1050, 'height': 80})
    add_message(root, "m_err1", "401 Unauthorized / 400 Bad Request: Sai thông tin hoặc tài khoản bị khóa", 545, 315, 760, is_reply=True)
    add_message(root, "m_err2", "Hiển thị thông báo: Tên đăng nhập hoặc mật khẩu không chính xác", 305, 80, 790, is_reply=True)
    return model

# 2. ĐỔI MẬT KHẨU
def build_seq_2_change_password():
    model, root = create_base_model(1380, 940)
    add_cell(root, "frame_chgpwd", "sd UC-02: Đổi mật khẩu tài khoản cá nhân", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 890})
    setup_6_lifelines(root, "Người dùng", "ChangePasswordModal", "AuthController", "AuthService", "UserRepository", "Database (MySQL)", height=800)

    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 640})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 540})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 450})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 310})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 240})

    add_message(root, "m1", "1: Nhập currentPassword, newPassword, confirmPassword", 80, 305, 135)
    add_message(root, "m2", "2: validate(newPassword == confirmPassword && length >= 6)", 315, 315, 160, is_self=True)
    add_message(root, "m3", "3: PUT /api/auth/change-password (ChangePasswordRequest)", 315, 545, 185)
    add_message(root, "m4", "4: changePassword(userPrincipal.getId(), request)", 555, 785, 230)
    add_message(root, "m5", "5: findById(userId)", 795, 1025, 275)
    add_message(root, "m6", "6: SELECT * FROM users WHERE id = ?", 1035, 1245, 315)
    add_message(root, "m7", "7: Trả về User entity", 1245, 1025, 355, is_reply=True)
    add_message(root, "m8", "8: passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())", 795, 795, 395, is_self=True)
    add_message(root, "m9", "9: user.setPassword(bCrypt(newPassword)); user.setMustChangePassword(false)", 795, 795, 435, is_self=True)
    add_message(root, "m10", "10: userRepository.save(user)", 795, 1025, 475)
    add_message(root, "m11", "11: UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?", 1035, 1245, 505)
    add_message(root, "m12", "12: Ghi nhận AuditLog('CHANGE_PASSWORD_SUCCESS', userId)", 795, 795, 535, is_self=True)
    add_message(root, "m13", "13: 200 OK + ApiResponse.success('Đổi mật khẩu thành công')", 545, 315, 575, is_reply=True)
    add_message(root, "m14", "14: Hiển thị toast thành công & Tự động logout chuyển về /login", 305, 80, 615, is_reply=True)

    add_cell(root, "alt_err", "opt [Mật khẩu cũ không chính xác / Trùng mật khẩu hiện tại]", STYLE_COMBINED_FRAGMENT, vertex=True, geometry={'x': 180, 'y': 660, 'width': 1050, 'height': 80})
    add_message(root, "m_err1", "400 Bad Request: Mật khẩu hiện tại không đúng", 545, 315, 690, is_reply=True)
    add_message(root, "m_err2", "Hiển thị thông báo lỗi trên form đổi mật khẩu", 305, 80, 720, is_reply=True)
    return model

# 3. THÊM MỚI SINH VIÊN
def build_seq_3_student_create():
    model, root = create_base_model(1380, 940)
    add_cell(root, "frame_std", "sd UC-03: Thêm mới Sinh viên & Cấp tài khoản tự động", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 890})
    setup_6_lifelines(root, "Quản trị viên", "StudentsPage", "StudentController", "StudentService", "StudentRepository", "Database (MySQL)", height=800)

    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 640})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 540})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 450})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 310})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 250})

    add_message(root, "m1", "1: Nhập mã SV, họ tên, email, lớp sinh hoạt, ngày sinh...", 80, 305, 135)
    add_message(root, "m2", "2: validateForm() trên client", 315, 315, 160, is_self=True)
    add_message(root, "m3", "3: POST /api/students (StudentRequest)", 315, 545, 185)
    add_message(root, "m4", "4: create(StudentRequest request)", 555, 785, 230)
    add_message(root, "m5", "5: existsByStudentCode(code) || existsByEmail(email)", 795, 1025, 275)
    add_message(root, "m6", "6: SELECT COUNT(*) FROM students WHERE student_code = ? OR email = ?", 1035, 1245, 315)
    add_message(root, "m7", "7: Trả về count = 0 (Chưa tồn tại trùng lặp)", 1245, 1025, 355, is_reply=True)
    add_message(root, "m8", "8: Khởi tạo User: username=studentCode, pass=123456 (bCrypt), role=STUDENT", 795, 795, 395, is_self=True)
    add_message(root, "m9", "9: userRepository.save(user) & studentRepository.save(student)", 795, 1025, 435)
    add_message(root, "m10", "10: INSERT INTO users ... ; INSERT INTO students ...", 1035, 1245, 475)
    add_message(root, "m11", "11: Trả về bản ghi Student vừa được bền vững hóa", 1245, 1025, 515, is_reply=True)
    add_message(root, "m12", "12: 201 Created + ApiResponse.success('Thêm sinh viên thành công', student)", 545, 315, 555, is_reply=True)
    add_message(root, "m13", "13: loadStudents() - Làm mới danh sách sinh viên", 315, 315, 595, is_self=True)
    add_message(root, "m14", "14: Hiển thị toast thành công & Đóng Modal", 305, 80, 630, is_reply=True)

    add_cell(root, "alt_dup", "opt [Mã sinh viên hoặc Email đã tồn tại]", STYLE_COMBINED_FRAGMENT, vertex=True, geometry={'x': 180, 'y': 675, 'width': 1050, 'height': 80})
    add_message(root, "m_dup1", "400 Bad Request: Mã sinh viên hoặc Email đã được sử dụng", 545, 315, 705, is_reply=True)
    add_message(root, "m_dup2", "Hiển thị thông báo trùng lặp dữ liệu trên form", 305, 80, 735, is_reply=True)
    return model

# 4. QUẢN LÝ HỒ SƠ SINH VIÊN (STATUS / SUSPEND)
def build_seq_4_student_manage():
    model, root = create_base_model(1380, 940)
    add_cell(root, "frame_std_stat", "sd UC-04: Quản lý hồ sơ Sinh viên & Đình chỉ đào tạo", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 890})
    setup_6_lifelines(root, "Quản trị viên", "StudentsPage", "StudentController", "StudentService", "StudentRepository", "Database (MySQL)", height=800)

    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 600})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 500})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 420})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 290})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 230})

    add_message(root, "m1", "1: Chọn sinh viên & Chuyển trạng thái sang SUSPENDED (Đình chỉ)", 80, 305, 135)
    add_message(root, "m2", "2: PUT /api/students/{id}/status?status=SUSPENDED", 315, 545, 185)
    add_message(root, "m3", "3: updateStatus(id, 'SUSPENDED')", 555, 785, 230)
    add_message(root, "m4", "4: findById(id)", 795, 1025, 275)
    add_message(root, "m5", "5: SELECT * FROM students WHERE id = ?", 1035, 1245, 315)
    add_message(root, "m6", "6: Trả về Student entity và User liên kết", 1245, 1025, 355, is_reply=True)
    add_message(root, "m7", "7: student.setStatus(SUSPENDED); user.setIsActive(false)", 795, 795, 395, is_self=True)
    add_message(root, "m8", "8: studentRepository.save(student) & userRepository.save(user)", 795, 1025, 435)
    add_message(root, "m9", "9: UPDATE students SET status = 'SUSPENDED'; UPDATE users SET is_active = 0", 1035, 1245, 475)
    add_message(root, "m10", "10: Ghi nhận AuditLog('UPDATE_STUDENT_STATUS', id, 'SUSPENDED')", 795, 795, 510, is_self=True)
    add_message(root, "m11", "11: 200 OK + ApiResponse.success('Cập nhật trạng thái thành công')", 545, 315, 545, is_reply=True)
    add_message(root, "m12", "12: Hiển thị toast thành công & Cập nhật màu trạng thái trên bảng", 305, 80, 585, is_reply=True)
    return model

# 5. KHOA & LỚP SINH HOẠT
def build_seq_5_academic_structure():
    model, root = create_base_model(1380, 900)
    add_cell(root, "frame_cls", "sd UC-05: Quản lý Cơ cấu Đào tạo (Khoa, Ngành & Lớp)", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 850})
    setup_6_lifelines(root, "Quản trị viên", "ClassesPage", "ClassController", "ClassService", "ClassRepository", "Database (MySQL)", height=760)

    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 580})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 480})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 400})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 280})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 220})

    add_message(root, "m1", "1: Nhập tên lớp (className), mã lớp, khoa, ngành, niên khóa", 80, 305, 135)
    add_message(root, "m2", "2: POST /api/classes (ClassRequest)", 315, 545, 185)
    add_message(root, "m3", "3: create(ClassRequest request)", 555, 785, 230)
    add_message(root, "m4", "4: existsByClassCode(request.getClassCode())", 795, 1025, 275)
    add_message(root, "m5", "5: SELECT COUNT(*) FROM classes WHERE class_code = ?", 1035, 1245, 315)
    add_message(root, "m6", "6: Trả về count = 0 (Mã lớp hợp lệ)", 1245, 1025, 355, is_reply=True)
    add_message(root, "m7", "7: classRepository.save(new ClassEntity(...))", 795, 1025, 395)
    add_message(root, "m8", "8: INSERT INTO classes (class_code, class_name, department_id, cohort_id...)", 1035, 1245, 435)
    add_message(root, "m9", "9: 201 Created + ApiResponse.success('Tạo lớp sinh hoạt thành công', classDTO)", 545, 315, 485, is_reply=True)
    add_message(root, "m10", "10: Hiển thị toast thành công & Nạp lại danh sách lớp", 305, 80, 525, is_reply=True)
    return model

# 6. QUẢN LÝ GIẢNG VIÊN
def build_seq_6_lecturer_manage():
    model, root = create_base_model(1380, 900)
    add_cell(root, "frame_lec", "sd UC-06: Quản lý Giảng viên & Phân công đào tạo", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 850})
    setup_6_lifelines(root, "Quản trị viên", "LecturersPage", "LecturerController", "LecturerService", "LecturerRepository", "Database (MySQL)", height=760)

    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 580})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 480})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 400})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 290})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 230})

    add_message(root, "m1", "1: Nhập mã GV, họ tên, email, học vị, khoa trực thuộc", 80, 305, 135)
    add_message(root, "m2", "2: POST /api/lecturers (LecturerRequest)", 315, 545, 185)
    add_message(root, "m3", "3: create(LecturerRequest request)", 555, 785, 230)
    add_message(root, "m4", "4: existsByLecturerCode(code) || existsByEmail(email)", 795, 1025, 275)
    add_message(root, "m5", "5: SELECT COUNT(*) FROM lecturers WHERE lecturer_code = ? OR email = ?", 1035, 1245, 315)
    add_message(root, "m6", "6: Trả về count = 0 (Chưa tồn tại)", 1245, 1025, 355, is_reply=True)
    add_message(root, "m7", "7: Tạo User(role=LECTURER, pass=123456) & Lecturer entity", 795, 795, 395, is_self=True)
    add_message(root, "m8", "8: INSERT INTO users ... ; INSERT INTO lecturers ...", 1035, 1245, 435)
    add_message(root, "m9", "9: 201 Created + ApiResponse.success('Thêm giảng viên thành công', lecturer)", 545, 315, 485, is_reply=True)
    add_message(root, "m10", "10: Hiển thị toast thành công & Nạp lại danh sách giảng viên", 305, 80, 525, is_reply=True)
    return model

# 7. QUẢN LÝ MÔN HỌC & TIÊN QUYẾT
def build_seq_7_subject_manage():
    model, root = create_base_model(1380, 900)
    add_cell(root, "frame_sbj", "sd UC-07: Quản lý Môn học, Tín chỉ & Môn tiên quyết", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 850})
    setup_6_lifelines(root, "Quản trị viên", "SubjectsPage", "SubjectController", "SubjectService", "SubjectRepository", "Database (MySQL)", height=760)

    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 580})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 480})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 400})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 290})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 230})

    add_message(root, "m1", "1: Nhập mã môn, tên môn, số TC (LT/TH), môn tiên quyết", 80, 305, 135)
    add_message(root, "m2", "2: POST /api/subjects (SubjectRequest)", 315, 545, 185)
    add_message(root, "m3", "3: create(SubjectRequest request)", 555, 785, 230)
    add_message(root, "m4", "4: checkCircularPrerequisite(subjectCode, prerequisiteIds) qua DAG", 795, 795, 275, is_self=True)
    add_message(root, "m5", "5: subjectRepository.save(subject) & prerequisiteRepository.saveAll(...)", 795, 1025, 315)
    add_message(root, "m6", "6: INSERT INTO subjects ... ; INSERT INTO subject_prerequisites ...", 1035, 1245, 355)
    add_message(root, "m7", "7: Trả về Subject hoàn chỉnh kèm danh sách môn tiên quyết", 1245, 1025, 395, is_reply=True)
    add_message(root, "m8", "8: 201 Created + ApiResponse.success('Thêm môn học thành công')", 545, 315, 445, is_reply=True)
    add_message(root, "m9", "9: Hiển thị toast thành công & Cập nhật danh mục môn học", 305, 80, 485, is_reply=True)
    return model

# 8. CẤU HÌNH HỌC KỲ
def build_seq_8_semester_config():
    model, root = create_base_model(1380, 900)
    add_cell(root, "frame_sem", "sd UC-08: Cấu hình Học kỳ & Kích hoạt đợt đào tạo", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 850})
    setup_6_lifelines(root, "Quản trị viên", "SemestersPage", "SemesterController", "SemesterService", "SemesterRepository", "Database (MySQL)", height=760)

    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 580})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 480})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 400})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 290})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 230})

    add_message(root, "m1", "1: Chọn học kỳ và bấm 'Đặt làm học kỳ hiện tại'", 80, 305, 135)
    add_message(root, "m2", "2: PUT /api/semesters/{id}/set-current", 315, 545, 185)
    add_message(root, "m3", "3: setCurrentSemester(id)", 555, 785, 230)
    add_message(root, "m4", "4: semesterRepository.resetAllCurrentSemesters()", 795, 1025, 275)
    add_message(root, "m5", "5: UPDATE semesters SET is_current = 0 WHERE is_current = 1", 1035, 1245, 315)
    add_message(root, "m6", "6: UPDATE semesters SET is_current = 1 WHERE id = ?", 1035, 1245, 355)
    add_message(root, "m7", "7: Xóa cache REDIS key: 'current_semester'", 795, 795, 395, is_self=True)
    add_message(root, "m8", "8: 200 OK + ApiResponse.success('Cập nhật học kỳ hiện tại thành công')", 545, 315, 445, is_reply=True)
    add_message(root, "m9", "9: Hiển thị badge 'Học kỳ hiện tại' trên giao diện", 305, 80, 485, is_reply=True)
    return model

# 9. MỞ LỚP HỌC PHẦN
def build_seq_9_course_section_open():
    model, root = create_base_model(1380, 900)
    add_cell(root, "frame_sec", "sd UC-09: Mở mới & Điều phối Lớp học phần", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 850})
    setup_6_lifelines(root, "Cán bộ Đào tạo", "CourseSectionsPage", "CourseSectionController", "CourseSectionService", "CourseSectionRepository", "Database (MySQL)", height=760)

    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 580})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 480})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 400})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 290})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 230})

    add_message(root, "m1", "1: Chọn môn học, học kỳ, giảng viên, phòng học, sĩ số tối đa", 80, 305, 135)
    add_message(root, "m2", "2: POST /api/course-sections (CourseSectionRequest)", 315, 545, 185)
    add_message(root, "m3", "3: create(CourseSectionRequest request)", 555, 785, 230)
    add_message(root, "m4", "4: validateSemesterIsOpen & checkLecturerAvailable & RBAC Khoa (ACADEMIC_STAFF)", 795, 795, 275, is_self=True)
    add_message(root, "m5", "5: courseSectionRepository.save(newSection) [Optimistic Locking @Version]", 795, 1025, 315)
    add_message(root, "m6", "6: INSERT INTO course_sections (subject_id, semester_id, max_capacity, version...)", 1035, 1245, 355)
    add_message(root, "m7", "7: Trả về Section Entity (status = 'OPEN', current_students = 0)", 1245, 1025, 395, is_reply=True)
    add_message(root, "m8", "8: 201 Created + ApiResponse.success('Mở lớp học phần thành công')", 545, 315, 445, is_reply=True)
    add_message(root, "m9", "9: Hiển thị toast thành công & Hiển thị lớp trong danh sách", 305, 80, 485, is_reply=True)
    return model

# 10. XẾP THỜI KHÓA BIỂU
def build_seq_10_schedule_manage():
    model, root = create_base_model(1380, 940)
    add_cell(root, "frame_sch", "sd UC-10: Xếp Thời khóa biểu & Chống va chạm phòng/giờ", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 890})
    setup_6_lifelines(root, "Cán bộ Đào tạo", "SchedulesPage", "ScheduleController", "ScheduleService", "ScheduleRepository", "Database (MySQL)", height=800)

    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 640})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 540})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 450})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 310})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 250})

    add_message(root, "m1", "1: Chọn sectionId, phòng học (room), thứ, tiết bắt đầu - kết thúc", 80, 305, 135)
    add_message(root, "m2", "2: POST /api/schedules (ScheduleRequest)", 315, 545, 185)
    add_message(root, "m3", "3: create(ScheduleRequest request)", 555, 785, 230)
    add_message(root, "m4", "4: checkRoomConflict(room, dayOfWeek, startPeriod, endPeriod, dates)", 795, 1025, 275)
    add_message(root, "m5", "5: SELECT * FROM schedules WHERE room = ? AND day_of_week = ? ...", 1035, 1245, 315)
    add_message(root, "m6", "6: checkLecturerConflict(lecturerId, dayOfWeek, periods, dates)", 795, 1025, 355)
    add_message(root, "m7", "7: SELECT * FROM schedules WHERE lecturer_id = ? ...", 1035, 1245, 395)
    add_message(root, "m8", "8: scheduleRepository.save(newSchedule)", 795, 1025, 435)
    add_message(root, "m9", "9: INSERT INTO schedules (section_id, room, day_of_week, start_period...)", 1035, 1245, 475)
    add_message(root, "m10", "10: 201 Created + ApiResponse.success(schedule)", 545, 315, 520, is_reply=True)
    add_message(root, "m11", "11: Vẽ ô lịch vào lưới Thời khóa biểu tuần", 315, 80, 560, is_reply=True)

    add_cell(root, "alt_sch", "opt [Trùng phòng hoặc Trùng lịch giảng viên]", STYLE_COMBINED_FRAGMENT, vertex=True, geometry={'x': 180, 'y': 620, 'width': 1050, 'height': 80})
    add_message(root, "m_err1", "400 Bad Request: Xung đột lịch phòng học / Trùng lịch giảng viên!", 545, 315, 650, is_reply=True)
    add_message(root, "m_err2", "Cảnh báo xung đột chi tiết lên giao diện xếp lịch", 305, 80, 680, is_reply=True)
    return model

# 11. ĐĂNG KÝ LỚP HỌC PHẦN (REDIS LOCK & ATOMIC SQL INCREMENT)
def build_seq_11_enrollment():
    model, root = create_base_model(1480, 960)
    add_cell(root, "frame_enr", "sd UC-11: Sinh viên Đăng ký Tín chỉ (Redis Sentinel Lock & Atomic DB)", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1440, 'height': 910})
    setup_7_lifelines(root, "Sinh viên", "EnrollPage", "EnrollmentController", "EnrollmentService", "RedisLockService", "CourseSectionRepo", "Database (MySQL)", height=820)

    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 275, 'y': 135, 'width': 10, 'height': 690})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 485, 'y': 180, 'width': 10, 'height': 600})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 695, 'y': 220, 'width': 10, 'height': 520})
    add_cell(root, "act_redis", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 905, 'y': 260, 'width': 10, 'height': 420})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1115, 'y': 440, 'width': 10, 'height': 170})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1315, 'y': 475, 'width': 10, 'height': 120})

    add_message(root, "m1", "1: Chọn lớp học phần & Bấm 'Đăng ký' (sectionId)", 70, 275, 135)
    add_message(root, "m2", "2: POST /api/enrollments (EnrollmentRequest: sectionId)", 285, 485, 180)
    add_message(root, "m3", "3: enroll(studentId, request.getSectionId())", 495, 695, 220)
    add_message(root, "m4", "4: tryConsumeUserRateLimit(studentId, 5 req/3s)", 705, 905, 260)
    add_message(root, "m5", "5: true (Rate limit hợp lệ)", 905, 705, 295, is_reply=True)
    add_message(root, "m6", "6: acquireUserActionLock(studentId, 'ENROLL', 2s)", 705, 905, 330)
    add_message(root, "m7", "7: true (Đã chiếm giữ Idempotency lock chống spam click)", 905, 705, 365, is_reply=True)
    add_message(root, "m8", "8: checkPrerequisitesDAG() & checkScheduleConflict()", 705, 705, 400, is_self=True)
    add_message(root, "m9", "9: incrementCurrentStudentsAtomic(sectionId)", 705, 1115, 440)
    add_message(root, "m10", "10: UPDATE course_sections SET current_students = current_students + 1 WHERE id = ? AND current_students < max_students", 1125, 1315, 475)
    add_message(root, "m11", "11: 1 row affected (Chiếm giữ slot thành công)", 1315, 1125, 510, is_reply=True)
    add_message(root, "m12", "12: enrollmentRepository.save(new Enrollment(ENROLLED))", 705, 1115, 545)
    add_message(root, "m13", "13: INSERT INTO enrollments (student_id, section_id, status='ENROLLED')", 1125, 1315, 575)
    add_message(root, "m14", "14: releaseUserActionLock(studentId, 'ENROLL')", 705, 905, 610)
    add_message(root, "m15", "15: 200 OK + ApiResponse.success('Đăng ký thành công', enrollmentDTO)", 495, 285, 650, is_reply=True)
    add_message(root, "m16", "16: Hiển thị toast thành công & Cập nhật Thời khóa biểu", 275, 70, 690, is_reply=True)

    add_cell(root, "alt_enr_err", "opt [Lớp đã hết chỗ (rowsUpdated == 0) hoặc Spam click]", STYLE_COMBINED_FRAGMENT, vertex=True, geometry={'x': 180, 'y': 735, 'width': 1200, 'height': 80})
    add_message(root, "m_err1", "400 Bad Request: Lớp học phần đã hết chỗ / Yêu cầu đang được xử lý", 485, 285, 765, is_reply=True)
    add_message(root, "m_err2", "Cảnh báo lỗi chi tiết trên màn hình Đăng ký tín chỉ", 275, 70, 795, is_reply=True)
    return model

# 12. HỦY ĐĂNG KÝ HỌC PHẦN
def build_seq_12_cancel_enrollment():
    model, root = create_base_model(1380, 900)
    add_cell(root, "frame_cnl", "sd UC-12: Hủy đăng ký Học phần & Hoàn trả sĩ số lớp", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 850})
    setup_6_lifelines(root, "Sinh viên", "MyEnrollmentsPage", "EnrollmentController", "EnrollmentService", "EnrollmentRepository", "Database (MySQL)", height=760)

    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 600})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 500})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 420})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 300})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 240})

    add_message(root, "m1", "1: Chọn học phần đã đăng ký & Bấm 'Hủy đăng ký'", 80, 305, 135)
    add_message(root, "m2", "2: DELETE /api/enrollments/{enrollmentId}", 315, 545, 185)
    add_message(root, "m3", "3: cancel(studentId, enrollmentId)", 555, 785, 230)
    add_message(root, "m4", "4: findById(enrollmentId) & validateStudentOwnership", 795, 1025, 275)
    add_message(root, "m5", "5: decrementCurrentStudentsAtomic(sectionId)", 795, 1025, 315)
    add_message(root, "m6", "6: UPDATE course_sections SET current_students = current_students - 1 WHERE id = ?", 1035, 1245, 355)
    add_message(root, "m7", "7: enrollmentRepository.delete(enrollment)", 795, 1025, 395)
    add_message(root, "m8", "8: DELETE FROM enrollments WHERE id = ?", 1035, 1245, 435)
    add_message(root, "m9", "9: 200 OK + ApiResponse.success('Hủy môn thành công, đã hoàn trả slot')", 545, 315, 485, is_reply=True)
    add_message(root, "m10", "10: Gỡ môn khỏi bảng môn đã đăng ký & cập nhật tổng số TC", 305, 80, 525, is_reply=True)
    return model

# 13. NHẬP ĐIỂM THÀNH PHẦN
def build_seq_13_grade_entry():
    model, root = create_base_model(1380, 900)
    add_cell(root, "frame_grd", "sd UC-13: Giảng viên Nhập điểm thành phần & Tính GPA", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 850})
    setup_6_lifelines(root, "Giảng viên", "GradeEntryPage", "GradeController", "GradeService", "GradeRepository", "Database (MySQL)", height=760)

    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 580})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 480})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 400})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 290})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 230})

    add_message(root, "m1", "1: Giảng viên nhập điểm chuyên cần, giữa kỳ, thi cuối kỳ & bấm 'Lưu sổ điểm'", 80, 305, 135)
    add_message(root, "m2", "2: PUT /api/grades/batch (BatchGradeRequest)", 315, 545, 185)
    add_message(root, "m3", "3: saveBatch(lecturerId, request)", 555, 785, 230)
    add_message(root, "m4", "4: validateGradeRange(0.0 - 10.0) & calculateTotalFormula()", 795, 795, 275, is_self=True)
    add_message(root, "m5", "5: convertToGradeLetter(score10) & convertToGrade4()", 795, 795, 315, is_self=True)
    add_message(root, "m6", "6: gradeRepository.saveAll(grades)", 795, 1025, 355)
    add_message(root, "m7", "7: BATCH UPDATE grades SET score_cc=?, score_gk=?, score_ck=?, total=...", 1035, 1245, 395)
    add_message(root, "m8", "8: 200 OK + ApiResponse.success('Lưu điểm thành công')", 545, 315, 445, is_reply=True)
    add_message(root, "m9", "9: Hiển thị toast thành công & Cập nhật điểm chữ, điểm hệ 4 trên bảng", 305, 80, 485, is_reply=True)
    return model

# 14. KHÓA SỔ ĐIỂM (FINALIZE & 7 DAYS GRACE PERIOD)
def build_seq_14_grade_finalize():
    model, root = create_base_model(1380, 900)
    add_cell(root, "frame_fnl", "sd UC-14: Chốt sổ điểm & Cửa sổ ân hạn sửa điểm 7 ngày", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 850})
    setup_6_lifelines(root, "Giảng viên", "GradeEntryPage", "GradeController", "GradeService", "GradeRepository", "Database (MySQL)", height=760)

    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 580})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 480})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 400})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 290})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 230})

    add_message(root, "m1", "1: Giảng viên bấm 'Chốt sổ điểm & Công bố'", 80, 305, 135)
    add_message(root, "m2", "2: POST /api/grades/section/{sectionId}/publish", 315, 545, 185)
    add_message(root, "m3", "3: publishGrades(sectionId, lecturerId)", 555, 785, 230)
    add_message(root, "m4", "4: validateAllStudentsHaveGrades(sectionId)", 795, 795, 275, is_self=True)
    add_message(root, "m5", "5: setStatus(FINALIZED) & setLockDeadline(now + 7 days)", 795, 795, 315, is_self=True)
    add_message(root, "m6", "6: UPDATE grades SET is_final = 1, locked_at = ? WHERE section_id = ?", 1035, 1245, 355)
    add_message(root, "m7", "7: Gửi Notification tới tất cả sinh viên trong lớp học phần", 795, 795, 395, is_self=True)
    add_message(root, "m8", "8: 200 OK + ApiResponse.success('Đã công bố điểm chính thức')", 545, 315, 445, is_reply=True)
    add_message(root, "m9", "9: Chuyển giao diện sang chế độ Read-only & hiển thị đếm ngược 7 ngày", 305, 80, 485, is_reply=True)
    return model

# 15. TRA CỨU BẢNG ĐIỂM CPA
def build_seq_15_transcript():
    model, root = create_base_model(1380, 900)
    add_cell(root, "frame_tra", "sd UC-15: Tra cứu Bảng điểm, Tiến độ CTĐT & Điểm CPA", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 850})
    setup_6_lifelines(root, "Sinh viên", "TranscriptPage", "TranscriptController", "TranscriptService", "GradeRepository", "Database (MySQL)", height=760)

    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 580})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 480})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 400})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 290})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 230})

    add_message(root, "m1", "1: Sinh viên truy cập trang 'Bảng điểm & Tiến độ học tập'", 80, 305, 135)
    add_message(root, "m2", "2: GET /api/transcript/me", 315, 545, 185)
    add_message(root, "m3", "3: getMyTranscript(studentId)", 555, 785, 230)
    add_message(root, "m4", "4: findFinalizedGradesByStudentId(studentId)", 795, 1025, 275)
    add_message(root, "m5", "5: SELECT g, s FROM grades g JOIN subjects s WHERE g.student_id = ? AND is_final = 1", 1035, 1245, 315)
    add_message(root, "m6", "6: calculateSemesterGPA() & calculateCumulativeCPA() theo Thông tư 08", 795, 795, 355, is_self=True)
    add_message(root, "m7", "7: checkRetakePolicy() -> Giữ lại điểm cao nhất đối với môn học cải thiện", 795, 795, 395, is_self=True)
    add_message(root, "m8", "8: 200 OK + ApiResponse.success(TranscriptDTO)", 545, 315, 445, is_reply=True)
    add_message(root, "m9", "9: Render biểu đồ CPA qua từng kỳ, thanh tiến độ tín chỉ tích lũy", 305, 80, 485, is_reply=True)
    return model

# 16. DASHBOARD & CẢNH BÁO HỌC VỤ
def build_seq_16_dashboard():
    model, root = create_base_model(1380, 900)
    add_cell(root, "frame_dsh", "sd UC-16: Báo cáo Thống kê Toàn trường & Cảnh báo học vụ", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 850})
    setup_6_lifelines(root, "Quản trị viên", "DashboardPage", "DashboardController", "DashboardService", "StudentRepository", "Database (MySQL)", height=760)

    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 580})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 480})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 400})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 290})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 230})

    add_message(root, "m1", "1: Quản trị viên truy cập Bảng điều khiển Trung tâm", 80, 305, 135)
    add_message(root, "m2", "2: GET /api/dashboard", 315, 545, 185)
    add_message(root, "m3", "3: getDashboardMetrics()", 555, 785, 230)
    add_message(root, "m4", "4: countTotalStudents(), countActiveCourses(), countLecturers()", 795, 1025, 275)
    add_message(root, "m5", "5: SELECT COUNT(*) FROM students; SELECT COUNT(*) FROM course_sections...", 1035, 1245, 315)
    add_message(root, "m6", "6: queryAcademicWarningCandidates(cpa < 1.0 || cpa < 1.2)", 795, 1025, 355)
    add_message(root, "m7", "7: 200 OK + ApiResponse.success(DashboardDTO: kpiMetrics, chartData)", 545, 315, 415, is_reply=True)
    add_message(root, "m8", "8: Vẽ thẻ KPI (Tổng SV, Lớp HP, Tỷ lệ nộp học phí) và Biểu đồ cảnh báo học vụ", 305, 80, 465, is_reply=True)
    return model

# 17. QUẢN LÝ & THU HỌC PHÍ THEO TÍN CHỈ
def build_seq_17_tuition_management():
    model, root = create_base_model(1380, 900)
    add_cell(root, "frame_tui", "sd UC-17: Quản lý Tài chính & Thu học phí theo tín chỉ", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 850})
    setup_6_lifelines(root, "Thu ngân / Admin", "TuitionCashierPage", "TuitionController", "TuitionService", "StudentInvoiceRepository", "Database (MySQL)", height=760)

    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 580})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 480})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 400})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 290})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 230})

    add_message(root, "m1", "1: Thu ngân quét mã SV, kiểm tra học phí kỳ hiện tại & bấm 'Thu tiền mặt'", 80, 305, 135)
    add_message(root, "m2", "2: POST /api/admin/tuition/collect-cash (CashCollectionRequest)", 315, 545, 185)
    add_message(root, "m3", "3: collectCash(request, cashierId)", 555, 785, 230)
    add_message(root, "m4", "4: findByStudentAndSemester(studentId, semesterId)", 795, 1025, 275)
    add_message(root, "m5", "5: calculateDiscountPolicy(chính sách miễn giảm / học bổng)", 795, 795, 315, is_self=True)
    add_message(root, "m6", "6: invoice.setPaidAmount(amount); invoice.setStatus(PAID)", 795, 795, 355, is_self=True)
    add_message(root, "m7", "7: UPDATE student_invoices SET paid_amount=?, status='PAID' WHERE id=?", 1035, 1245, 395)
    add_message(root, "m8", "8: 200 OK + ApiResponse.success('Thu tiền thành công', receiptDTO)", 545, 315, 445, is_reply=True)
    add_message(root, "m9", "9: Hiển thị biên lai điện tử & Gửi thông báo xác nhận thanh toán", 305, 80, 485, is_reply=True)
    return model

# 18. ĐIỂM DANH LỚP HỌC TRỰC TIẾP QUA MÃ PIN 6 SỐ
def build_seq_18_live_attendance():
    model, root = create_base_model(1380, 940)
    add_cell(root, "frame_att", "sd UC-18: Điểm danh lớp học trực tiếp qua mã PIN 6 số", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 890})
    setup_6_lifelines(root, "Giảng viên & Sinh viên", "AttendancePortalUI", "AttendanceController", "AttendanceService", "AttendanceSessionRepo", "Database (MySQL)", height=800)

    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 640})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 540})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 450})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 310})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 250})

    add_message(root, "m1", "1: Giảng viên mở phiên điểm danh lớp học (sectionId, 15 phút)", 80, 305, 135)
    add_message(root, "m2", "2: POST /api/attendance/session/start (StartSessionRequest)", 315, 545, 185)
    add_message(root, "m3", "3: startSession(sectionId, durationMinutes)", 555, 785, 230)
    add_message(root, "m4", "4: Sinh mã PIN 6 số ngẫu nhiên & lưu cache REDIS (TTL = 15 phút)", 795, 795, 275, is_self=True)
    add_message(root, "m5", "5: INSERT INTO attendance_sessions (section_id, pin_code, expires_at...)", 1035, 1245, 315)
    add_message(root, "m6", "6: 200 OK: Trả về mã PIN lớn trên màn hình máy chiếu", 545, 305, 355, is_reply=True)
    add_message(root, "m7", "7: Sinh viên nhập mã PIN 6 số trên điện thoại & bấm 'Check-in'", 80, 305, 395)
    add_message(root, "m8", "8: POST /api/attendance/check-in (CheckInRequest: pin, studentId)", 315, 545, 435)
    add_message(root, "m9", "9: checkIn(studentId, pin) -> validatePINAndExpiration()", 555, 785, 475)
    add_message(root, "m10", "10: INSERT INTO attendance_records (session_id, student_id, status='PRESENT')", 1035, 1245, 515)
    add_message(root, "m11", "11: 200 OK + ApiResponse.success('Điểm danh thành công')", 545, 315, 555, is_reply=True)
    add_message(root, "m12", "12: Hiển thị trạng thái 'Đã điểm danh' và nhảy số sĩ số thời gian thực", 305, 80, 595, is_reply=True)

    add_cell(root, "alt_att", "opt [Mã PIN sai hoặc Phiên điểm danh đã hết hạn]", STYLE_COMBINED_FRAGMENT, vertex=True, geometry={'x': 180, 'y': 650, 'width': 1050, 'height': 80})
    add_message(root, "m_err1", "400 Bad Request: Mã PIN không đúng hoặc đã hết hạn điểm danh", 545, 315, 680, is_reply=True)
    add_message(root, "m_err2", "Cảnh báo lỗi check-in không hợp lệ trên màn hình sinh viên", 305, 80, 710, is_reply=True)
    return model

# 19. KHẢO THÍ & TỰ ĐỘNG PHÂN BỔ PHÒNG THI
def build_seq_19_exam_management():
    model, root = create_base_model(1380, 900)
    add_cell(root, "frame_exm", "sd UC-19: Khảo thí & Tự động phân bổ phòng thi", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 850})
    setup_6_lifelines(root, "Cán bộ Khảo thí", "ExamRoomsPageUI", "ExamController", "ExamService", "ExamRoomRepository", "Database (MySQL)", height=760)

    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 580})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 480})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 400})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 290})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 230})

    add_message(root, "m1", "1: Khảo thí tạo đợt thi & bấm 'Tự động chia phòng thi'", 80, 305, 135)
    add_message(root, "m2", "2: POST /api/exam-sessions/{sessionId}/auto-assign", 315, 545, 185)
    add_message(root, "m3", "3: autoAssignExamRooms(sessionId)", 555, 785, 230)
    add_message(root, "m4", "4: Lọc sinh viên đủ điều kiện dự thi (điểm danh >= 80% & không nợ học phí)", 795, 795, 275, is_self=True)
    add_message(root, "m5", "5: Thuật toán chia đều thí sinh vào phòng thi (mỗi phòng tối đa 40 chỗ)", 795, 795, 315, is_self=True)
    add_message(root, "m6", "6: saveAll(examRooms) & saveAll(examStudents)", 795, 1025, 355)
    add_message(root, "m7", "7: INSERT INTO exam_rooms ... ; INSERT INTO exam_students ...", 1035, 1245, 395)
    add_message(root, "m8", "8: 200 OK + ApiResponse.success('Phân phòng thi hoàn tất')", 545, 315, 445, is_reply=True)
    add_message(root, "m9", "9: Hiển thị danh sách phòng thi, SBD và nút Xuất danh sách điểm danh thi", 305, 80, 485, is_reply=True)
    return model

# 20. THẨM ĐỊNH QUY TRÌNH ĐÍNH CHÍNH ĐIỂM 3 CẤP
def build_seq_20_grade_amendment():
    model, root = create_base_model(1380, 940)
    add_cell(root, "frame_amd", "sd UC-20: Thẩm định Quy trình Đính chính điểm 3 cấp", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 890})
    setup_6_lifelines(root, "GV & BM & Phòng ĐT", "GradeAmendmentsUI", "GradeAmendmentCtrl", "GradeAmendmentSrv", "GradeAuditLogRepo", "Database (MySQL)", height=800)

    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 640})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 540})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 450})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 310})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 250})

    add_message(root, "m1", "1: Giảng viên nộp đơn sửa điểm kèm minh chứng bài thi (upload file PDF/ảnh)", 80, 305, 135)
    add_message(root, "m2", "2: POST /api/grade-amendments (GradeAmendmentRequest)", 315, 545, 185)
    add_message(root, "m3", "3: createAmendmentRequest(request, lecturerId)", 555, 785, 230)
    add_message(root, "m4", "4: INSERT INTO grade_change_tickets (status='PENDING_DEPT')", 1035, 1245, 275)
    add_message(root, "m5", "5: Trưởng Bộ môn thẩm định minh chứng & bấm 'Duyệt cấp Bộ môn'", 80, 305, 315)
    add_message(root, "m6", "6: PUT /api/grade-amendments/{id}/dept-review (approved=true)", 315, 545, 355)
    add_message(root, "m7", "7: deptReview() -> UPDATE grade_change_tickets SET status='DEPT_APPROVED'", 1035, 1245, 395)
    add_message(root, "m8", "8: Phòng Đào tạo thẩm định lần cuối & bấm 'Phê duyệt chính thức'", 80, 305, 435)
    add_message(root, "m9", "9: PUT /api/grade-amendments/{id}/academic-approval (approved=true)", 315, 545, 475)
    add_message(root, "m10", "10: academicApproval() -> @Transactional: (1) Cập nhật grades, (2) Ghi audit_logs", 795, 795, 515, is_self=True)
    add_message(root, "m11", "11: UPDATE grades SET score_ck=? WHERE id=?; INSERT INTO audit_logs...", 1035, 1245, 555)
    add_message(root, "m12", "12: recalculateGpaAndCpa(studentId) -> Đồng bộ CPA mới của sinh viên", 795, 795, 595, is_self=True)
    add_message(root, "m13", "13: 200 OK: Điểm chính thức được điều chỉnh & thông báo tới GV, SV", 545, 315, 635, is_reply=True)
    add_message(root, "m14", "14: Hiển thị trạng thái ticket: APPROVED và lịch sử kiểm toán toàn vẹn", 305, 80, 675, is_reply=True)
    return model

# 21. THẨM ĐỊNH CHUẨN TỐT NGHIỆP (DEGREE AUDIT TT08)
def build_seq_21_graduation_audit():
    model, root = create_base_model(1380, 900)
    add_cell(root, "frame_grd_adt", "sd UC-21: Thẩm định chuẩn tốt nghiệp đa tiêu chí TT08", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 850})
    setup_6_lifelines(root, "Cán bộ Đào tạo", "GraduationAuditUI", "GraduationController", "GraduationService", "GraduationRecordRepo", "Database (MySQL)", height=760)

    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 580})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 480})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 400})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 290})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 230})

    add_message(root, "m1", "1: Cán bộ Đào tạo chọn Khóa tốt nghiệp & bấm 'Thẩm định tốt nghiệp'", 80, 305, 135)
    add_message(root, "m2", "2: POST /api/graduation/evaluate-cohort/{cohortId}", 315, 545, 185)
    add_message(root, "m3", "3: assessCohortCandidates(cohortId) -> nạp toàn bộ hồ sơ sinh viên khóa", 555, 785, 230)
    add_message(root, "m4", "4: Kích hoạt Degree Audit Engine: 7 tiêu chí TT08 (Tín chỉ, CPA, CC, Công nợ)", 795, 795, 275, is_self=True)
    add_message(root, "m5", "5: Xếp loại tốt nghiệp (Xuất sắc/Giỏi/Khá/TB) & Kiểm tra hạ hạng do thi lại >5%", 795, 795, 315, is_self=True)
    add_message(root, "m6", "6: graduationRecordRepository.saveAll(records)", 795, 1025, 355)
    add_message(root, "m7", "7: BATCH INSERT/UPDATE INTO graduation_records (status, honors, cpa...)", 1035, 1245, 395)
    add_message(root, "m8", "8: 200 OK + ApiResponse.success(List<GraduationRecordDTO>)", 545, 315, 445, is_reply=True)
    add_message(root, "m9", "9: Cán bộ bấm 'Phê duyệt tốt nghiệp hàng loạt': POST /api/graduation/batch-approve/{cohortId}", 80, 305, 485)
    add_message(root, "m10", "10: 200 OK: Chuyển trạng thái sinh viên sang GRADUATED & cấp số Quyết định", 545, 80, 525, is_reply=True)
    return model

# 22. QUẢN LÝ NHÂN SỰ ĐÀO TẠO (ADMIN STAFF MANAGEMENT)
def build_seq_22_staff_management():
    model, root = create_base_model(1380, 940)
    add_cell(root, "frame_staff", "sd UC-22: Quản lý Nhân sự Đào tạo & Phân quyền cán bộ", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 890})
    setup_6_lifelines(root, "Quản trị viên (Admin)", "StaffsPageView", "AdminSystemController", "UserService", "UserRepository", "Database (MySQL)", height=800)

    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 650})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 560})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 490})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 400})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 320})

    add_message(root, "m1", "1: Admin truy cập trang Quản trị Nhân sự /admin/staffs", 80, 305, 135)
    add_message(root, "m2", "2: GET /api/admin/staffs?keyword=&role=&page=0", 315, 545, 175)
    add_message(root, "m3", "3: getAllStaffs(keyword, role, pageable) -> lọc cán bộ chuyên trách", 555, 785, 215)
    add_message(root, "m4", "4: findByRoleIn([ADMIN, ACADEMIC_AFFAIRS, ACADEMIC_STAFF, EXAMINATION_OFFICER])", 795, 1025, 255)
    add_message(root, "m5", "5: SELECT u FROM User u WHERE u.role IN (...) ORDER BY u.id DESC", 1035, 1245, 295)
    add_message(root, "m6", "6: Trả về trang Page<User> các tài khoản nhân sự", 1245, 785, 335, is_reply=True)
    add_message(root, "m7", "7: 200 OK + ApiResponse.success(Page<StaffResponse>)", 785, 315, 375, is_reply=True)
    add_message(root, "m8", "8: Admin điền form tạo cán bộ mới (chọn Role & Khoa nếu có)", 80, 305, 415)
    add_message(root, "m9", "9: POST /api/admin/staffs (CreateStaffRequest: fullName, email, roleName, departmentId, dateOfBirth)", 315, 545, 455)
    add_message(root, "m10", "10: createStaff(request) -> validateEmail & gán Khoa trực thuộc (nếu là Giáo vụ Khoa)", 555, 785, 495)
    add_message(root, "m11", "11: Khởi tạo User mới, băm mật khẩu theo DOB (ddmmyyyya@), gán Role & Khoa", 795, 795, 535, is_self=True)
    add_message(root, "m12", "12: userRepository.save(staff) -> INSERT INTO users (..., role_id, department_id)", 795, 1245, 575)
    add_message(root, "m13", "13: Trả về bản ghi User đã bền vững hóa trong CSDL", 1245, 785, 615, is_reply=True)
    add_message(root, "m14", "14: Ghi nhận AuditLog('CREATE_STAFF', targetUserId, adminId)", 795, 795, 655, is_self=True)
    add_message(root, "m15", "15: 201 Created + ApiResponse.success(StaffResponse)", 785, 80, 695, is_reply=True)
    return model

# 23. ĐẶT LẠI MẬT KHẨU HÀNG LOẠT (BULK PASSWORD RESET)
def build_seq_23_bulk_password_reset():
    model, root = create_base_model(1380, 940)
    add_cell(root, "frame_bulkpwd", "sd UC-23: Đặt lại Mật khẩu Hàng loạt (Bulk Password Reset)", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 890})
    setup_6_lifelines(root, "Quản trị viên (Admin)", "PasswordResetsView", "AdminSystemController", "UserService", "UserRepository", "Database (MySQL)", height=800)

    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 650})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 560})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 490})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 400})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 320})

    add_message(root, "m1", "1: Admin chọn 'Đặt lại mật khẩu hàng loạt' (chọn phạm vi toàn trường / khóa)", 80, 305, 135)
    add_message(root, "m2", "2: POST /api/admin/users/bulk-reset-password (BulkResetPasswordRequest)", 315, 545, 175)
    add_message(root, "m3", "3: bulkResetPasswords(request) -> Kiểm tra quyền Quản trị viên ROLE_ADMIN", 555, 785, 215)
    add_message(root, "m4", "4: findTargetUsersForReset(scope, cohortId, deptId) -> nạp danh sách User", 795, 1025, 255)
    add_message(root, "m5", "5: SELECT u.id, u.username, s.date_of_birth FROM users u LEFT JOIN students s ...", 1035, 1245, 295)
    add_message(root, "m6", "6: Danh sách tài khoản người dùng hợp lệ", 1245, 785, 335, is_reply=True)
    add_message(root, "m7", "7: Lặp danh sách: Format mật khẩu 'ddmmyyyya@' theo DOB & băm BCrypt", 795, 795, 375, is_self=True)
    add_message(root, "m8", "8: Thiết lập cờ requirePasswordChange = true bắt buộc đổi MK ở lần đăng nhập tới", 795, 795, 415, is_self=True)
    add_message(root, "m9", "9: executeBatchUpdate(users) -> BATCH UPDATE users SET password = ?, require_pwd = 1", 795, 1245, 455)
    add_message(root, "m10", "10: Cập nhật thành công N bản ghi tài khoản vào CSDL", 1245, 785, 495, is_reply=True)
    add_message(root, "m11", "11: Gửi thông báo hệ thống Notification & ghi AuditLog('BULK_RESET_PWD')", 795, 795, 535, is_self=True)
    add_message(root, "m12", "12: 200 OK + ApiResponse.success(BulkResetPasswordResponse)", 785, 315, 575, is_reply=True)
    add_message(root, "m13", "13: Hiển thị hộp thoại tổng kết: Tổng số tài khoản, thành công, thất bại", 305, 80, 615, is_reply=True)
    return model

# ==========================================================
# GENERATE MASTER MULTI-PAGE DRAWIO FILE (23 TABS)
# ==========================================================

def generate_all_sequence_diagrams():
    tabs = [
        ("1. Đăng nhập hệ thống", build_seq_1_login()),
        ("2. Đổi mật khẩu", build_seq_2_change_password()),
        ("3. Thêm mới Sinh viên", build_seq_3_student_create()),
        ("4. Quản lý hồ sơ Sinh viên", build_seq_4_student_manage()),
        ("5. Khoa & Lớp sinh hoạt", build_seq_5_academic_structure()),
        ("6. Quản lý Giảng viên", build_seq_6_lecturer_manage()),
        ("7. Quản lý Môn học", build_seq_7_subject_manage()),
        ("8. Cấu hình Học kỳ", build_seq_8_semester_config()),
        ("9. Mở lớp Học phần", build_seq_9_course_section_open()),
        ("10. Xếp Thời khóa biểu", build_seq_10_schedule_manage()),
        ("11. Đăng ký lớp Học phần", build_seq_11_enrollment()),
        ("12. Hủy đăng ký Học phần", build_seq_12_cancel_enrollment()),
        ("13. Nhập điểm thành phần", build_seq_13_grade_entry()),
        ("14. Chốt bảng điểm", build_seq_14_grade_finalize()),
        ("15. Bảng điểm & Điểm CPA", build_seq_15_transcript()),
        ("16. Báo cáo Thống kê & Dashboard", build_seq_16_dashboard()),
        ("17. Quản lý & Thu học phí", build_seq_17_tuition_management()),
        ("18. Điểm danh lớp học & Check-in trực tiếp", build_seq_18_live_attendance()),
        ("19. Khảo thí & Quản lý phòng thi", build_seq_19_exam_management()),
        ("20. Quy trình Đính chính điểm 3 cấp", build_seq_20_grade_amendment()),
        ("21. Thẩm định chuẩn tốt nghiệp (Degree Audit)", build_seq_21_graduation_audit()),
        ("22. Quản lý Nhân sự Đào tạo", build_seq_22_staff_management()),
        ("23. Đặt lại Mật khẩu Hàng loạt", build_seq_23_bulk_password_reset()),
    ]

    mxfile = ET.Element('mxfile', {
        'host': 'app.diagrams.net',
        'modified': '2026-11-06T09:30:00.000Z',
        'agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'etag': 'seq-suite-master-v23',
        'version': '24.0.0',
        'type': 'device'
    })

    for i, (name, model) in enumerate(tabs):
        diagram = ET.SubElement(mxfile, 'diagram', {
            'id': f'seq_tab_{i+1:02d}',
            'name': name
        })
        diagram.append(model)

    xml_str = ET.tostring(mxfile, encoding='utf-8')
    dom = minidom.parseString(xml_str)
    pretty_xml = dom.toprettyxml(indent='  ', encoding='utf-8').decode('utf-8')

    lines = [line for line in pretty_xml.split('\n') if line.strip()]
    cleaned_xml = '\n'.join(lines)

    out_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'Sequence_Diagrams.drawio')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(cleaned_xml)

    print(f"SUCCESS: Generated {len(tabs)} tabs in {out_path}")

if __name__ == '__main__':
    generate_all_sequence_diagrams()
