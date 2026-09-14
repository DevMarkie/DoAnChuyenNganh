# -*- coding: utf-8 -*-
"""
Biểu đồ Trình tự (Sequence Diagrams) chuẩn UML 2.5 khớp 100% kiến trúc dự án thực tế:
Tác nhân (Actor) ──> Giao diện React (Boundary) ──> Spring REST Controller ──> Business Service ──> JPA Repository ──> Cơ sở dữ liệu MySQL

Đặc điểm thiết kế chuẩn học thuật:
1. Khớp 100% các Class, Controller, Service, Repository, DTO và Endpoint có thật trong source code dự án.
2. Thiết kế Trắng & Đen (Monochrome) độ tương phản cao, rõ nét, thanh lịch, dễ nhìn và dễ hiểu.
3. Nhãn thông điệp có nền trắng (labelBackgroundColor=#ffffff) chống bị đường lifeline cắt ngang chữ.
4. Tọa độ mũi tên ngang chuẩn xác từng pixel, khoảng cách giữa các thông điệp rộng rãi (45-55px).
5. Thanh kích hoạt (Activation boxes) khớp chính xác từng chu kỳ gọi và hoàn trả.
6. Đầy đủ 16 tab chức năng độc lập, đồng bộ 1-1 với Use Case, BCE và Activity Diagrams.
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
    style_call = "html=1;verticalAlign=bottom;endArrow=block;strokeColor=#000000;strokeWidth=1.5;labelBackgroundColor=#ffffff;labelBorderColor=none;fillColor=none;fontColor=#000000;fontSize=11;fontStyle=1;"
    style_reply = "html=1;verticalAlign=bottom;endArrow=open;dashed=1;strokeColor=#000000;strokeWidth=1.5;labelBackgroundColor=#ffffff;labelBorderColor=none;fillColor=none;fontColor=#000000;fontSize=11;fontStyle=0;"
    style_self = "html=1;verticalAlign=bottom;endArrow=block;strokeColor=#000000;strokeWidth=1.5;labelBackgroundColor=#ffffff;labelBorderColor=none;fillColor=none;fontColor=#000000;fontSize=11;fontStyle=1;edgeStyle=orthogonalEdgeStyle;curved=0;rounded=0;"

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
        array = ET.SubElement(geom, 'Array', {'as': 'points'})
        ET.SubElement(array, 'mxPoint', {'x': str(x1 + 45), 'y': str(y)})
        ET.SubElement(array, 'mxPoint', {'x': str(x1 + 45), 'y': str(y + 30)})
    else:
        ET.SubElement(geom, 'mxPoint', {'x': str(x1), 'y': str(y), 'as': 'sourcePoint'})
        ET.SubElement(geom, 'mxPoint', {'x': str(x2), 'y': str(y), 'as': 'targetPoint'})

    return cell

# --- STYLES ---
STYLE_SD_FRAME = "shape=umlFrame;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;strokeWidth=1.5;width=420;height=30;fontStyle=1;fontSize=12;fontColor=#000000;align=left;spacingLeft=10;"
STYLE_LIFELINE_ACTOR = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;strokeColor=#000000;strokeWidth=1.5;fillColor=#ffffff;fontStyle=1;fontSize=12;fontColor=#000000;size=65;"
STYLE_LIFELINE = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;strokeColor=#000000;strokeWidth=1.5;fillColor=#ffffff;fontStyle=1;fontSize=11;fontColor=#000000;size=45;"
STYLE_ACTIVATION = "html=1;points=[];perimeter=orthogonalPerimeter;strokeColor=#000000;strokeWidth=1.2;fillColor=#ffffff;"
STYLE_COMBINED_FRAGMENT = "shape=umlFrame;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;strokeWidth=1.2;width=80;height=22;fontStyle=1;fontSize=11;fontColor=#000000;dashed=1;"

def create_base_model(page_w=1380, page_h=900):
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': str(page_w), 'pageHeight': str(page_h), 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")
    return model, root

def setup_6_lifelines(root, actor_name, ui_name, ctrl_name, srv_name, repo_name, db_name="Database (MySQL)", height=760):
    """
    Sets up the 6 real-world project lifelines:
    Centers:
    - Actor:      x = 80   (box x=40, w=80)
    - Boundary:   x = 310  (box x=220, w=180)
    - Controller: x = 550  (box x=460, w=180)
    - Service:    x = 790  (box x=700, w=180)
    - Repository: x = 1030 (box x=940, w=180)
    - Database:   x = 1250 (box x=1170, w=160)
    """
    add_cell(root, "ll_act", f":{actor_name}", STYLE_LIFELINE_ACTOR, vertex=True, geometry={'x': 40, 'y': 65, 'width': 80, 'height': height})
    add_cell(root, "ll_ui", f":{ui_name}\n«boundary»", STYLE_LIFELINE, vertex=True, geometry={'x': 220, 'y': 65, 'width': 180, 'height': height})
    add_cell(root, "ll_ctrl", f":{ctrl_name}\n«control»", STYLE_LIFELINE, vertex=True, geometry={'x': 460, 'y': 65, 'width': 180, 'height': height})
    add_cell(root, "ll_srv", f":{srv_name}\n«control»", STYLE_LIFELINE, vertex=True, geometry={'x': 700, 'y': 65, 'width': 180, 'height': height})
    add_cell(root, "ll_repo", f":{repo_name}\n«control»", STYLE_LIFELINE, vertex=True, geometry={'x': 940, 'y': 65, 'width': 180, 'height': height})
    add_cell(root, "ll_db", f":{db_name}\n«entity»", STYLE_LIFELINE, vertex=True, geometry={'x': 1170, 'y': 65, 'width': 160, 'height': height})

# ==========================================================
# 16 BIỂU ĐỒ TRÌNH TỰ CHUẨN DỰ ÁN (RÕ NÉT - ĐÚNG CODE - ĐỘC LẬP)
# ==========================================================

# 1. ĐĂNG NHẬP HỆ THỐNG
def build_seq_1_login():
    model, root = create_base_model(1380, 890)
    add_cell(root, "frame_login", "sd UC-01: Đăng nhập & Xác thực hệ thống", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 840})

    setup_6_lifelines(root, "Người dùng", "LoginPage", "AuthController", "AuthService", "UserRepository", "Database (MySQL)", height=750)

    # Activations
    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 580})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 230, 'width': 10, 'height': 430})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 275, 'width': 10, 'height': 340})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 320, 'width': 10, 'height': 100})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 360, 'width': 10, 'height': 50})

    # Messages
    add_message(root, "m1", "1: Nhập username, password & Click Đăng nhập", 80, 305, 135)
    add_message(root, "m2", "2: validateForm(username, password)", 315, 315, 180, is_self=True)
    add_message(root, "m3", "3: POST /api/auth/login (LoginRequest)", 315, 545, 230)
    add_message(root, "m4", "4: login(LoginRequest request)", 555, 785, 275)
    add_message(root, "m5", "5: authenticate(UsernamePasswordAuthenticationToken)", 785, 1025, 320)
    add_message(root, "m6", "6: SELECT * FROM users WHERE username = ?", 1035, 1245, 360)
    add_message(root, "m7", "7: Trả về bản ghi User (password_hash, role, is_active)", 1245, 1035, 405, is_reply=True)
    add_message(root, "m8", "8: Trả về UserPrincipal (thông tin người dùng)", 1025, 785, 435, is_reply=True)
    add_message(root, "m9", "9: passwordEncoder.matches(raw, hash) & check isActive", 795, 795, 475, is_self=True)
    add_message(root, "m10", "10: jwtUtil.generateToken(userPrincipal)", 795, 795, 525, is_self=True)
    add_message(root, "m11", "11: Trả về LoginResponse(token, role, username, userId)", 785, 555, 575, is_reply=True)
    add_message(root, "m12", "12: 200 OK + ApiResponse.success(LoginResponse)", 545, 315, 620, is_reply=True)
    add_message(root, "m13", "13: localStorage.setItem('token', token) & điều hướng", 315, 315, 665, is_self=True)
    add_message(root, "m14", "14: Hiển thị giao diện phân hệ (Admin/Lecturer/Student)", 305, 80, 710, is_reply=True)

    # Opt error
    add_cell(root, "alt_auth", "opt [Sai mật khẩu hoặc Tài khoản bị khóa]", STYLE_COMBINED_FRAGMENT, vertex=True, geometry={'x': 250, 'y': 735, 'width': 850, 'height': 85})
    add_message(root, "m_alt1", "401 Unauthorized / BadCredentialsException", 545, 315, 765, is_reply=True)
    add_message(root, "m_alt2", "Hiển thị thông báo: Tên đăng nhập hoặc mật khẩu không đúng", 305, 80, 805, is_reply=True)

    return model

# 2. ĐỔI MẬT KHẨU
def build_seq_2_change_password():
    model, root = create_base_model(1380, 880)
    add_cell(root, "frame_pwd", "sd UC-02: Đổi mật khẩu tài khoản", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 830})

    setup_6_lifelines(root, "Người dùng", "ChangePasswordModal", "AuthController", "AuthService", "UserRepository", "Database (MySQL)", height=740)

    # Activations
    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 580})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 225, 'width': 10, 'height': 440})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 270, 'width': 10, 'height': 350})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 315, 'width': 10, 'height': 250})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 355, 'width': 10, 'height': 200})

    # Messages
    add_message(root, "m1", "1: Nhập currentPassword, newPassword, confirmPassword", 80, 305, 135)
    add_message(root, "m2", "2: validate(newPassword == confirmPassword)", 315, 315, 180, is_self=True)
    add_message(root, "m3", "3: PUT /api/auth/change-password (ChangePasswordRequest)", 315, 545, 225)
    add_message(root, "m4", "4: changePassword(user.getId(), request)", 555, 785, 270)
    add_message(root, "m5", "5: findById(userId)", 795, 1025, 315)
    add_message(root, "m6", "6: SELECT * FROM users WHERE id = ?", 1035, 1245, 355)
    add_message(root, "m7", "7: Trả về User entity", 1245, 1035, 395, is_reply=True)
    add_message(root, "m8", "8: Trả về Optional<User>", 1025, 795, 425, is_reply=True)
    add_message(root, "m9", "9: passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())", 795, 795, 465, is_self=True)
    add_message(root, "m10", "10: user.setPassword(passwordEncoder.encode(newPassword))", 795, 795, 510, is_self=True)
    add_message(root, "m11", "11: save(user)", 795, 1025, 550)
    add_message(root, "m12", "12: UPDATE users SET password = ? WHERE id = ?", 1035, 1245, 575)
    add_message(root, "m13", "13: Hoàn tất cập nhật bản ghi mật khẩu", 1245, 1025, 605, is_reply=True)
    add_message(root, "m14", "14: Trả về kết quả thành công", 1025, 785, 615, is_reply=True)
    add_message(root, "m15", "15: 200 OK + ApiResponse.success('Đổi mật khẩu thành công')", 545, 315, 650, is_reply=True)
    add_message(root, "m16", "16: Hiển thị toast thông báo: Đổi mật khẩu thành công", 305, 80, 695, is_reply=True)

    # Opt error
    add_cell(root, "alt_pwd", "opt [Mật khẩu cũ không chính xác]", STYLE_COMBINED_FRAGMENT, vertex=True, geometry={'x': 250, 'y': 730, 'width': 850, 'height': 80})
    add_message(root, "m_alt1", "400 Bad Request: Mật khẩu cũ không đúng", 545, 315, 755, is_reply=True)
    add_message(root, "m_alt2", "Hiển thị thông báo lỗi trên form đổi mật khẩu", 305, 80, 790, is_reply=True)

    return model

# 3. THÊM MỚI SINH VIÊN
def build_seq_3_student_create():
    model, root = create_base_model(1380, 920)
    add_cell(root, "frame_stu_add", "sd UC-03: Thêm mới Sinh viên & Cấp tài khoản", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 870})

    setup_6_lifelines(root, "Quản trị viên", "StudentsPage", "StudentController", "StudentService", "StudentRepository", "Database (MySQL)", height=780)

    # Activations
    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 630})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 225, 'width': 10, 'height': 490})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 270, 'width': 10, 'height': 400})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 315, 'width': 10, 'height': 310})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 355, 'width': 10, 'height': 260})

    # Messages
    add_message(root, "m1", "1: Nhập mã SV, họ tên, email, lớp, ngày sinh, giới tính...", 80, 305, 135)
    add_message(root, "m2", "2: validateForm() trên client", 315, 315, 180, is_self=True)
    add_message(root, "m3", "3: POST /api/students (StudentRequest)", 315, 545, 225)
    add_message(root, "m4", "4: create(StudentRequest request)", 555, 785, 270)
    add_message(root, "m5", "5: existsByStudentCode(code) & existsByEmail(email)", 795, 1025, 315)
    add_message(root, "m6", "6: SELECT COUNT(*) FROM students WHERE student_code = ? OR email = ?", 1035, 1245, 355)
    add_message(root, "m7", "7: Trả về count = 0 (chưa tồn tại)", 1245, 1035, 395, is_reply=True)
    add_message(root, "m8", "8: Trả về false", 1025, 795, 425, is_reply=True)
    add_message(root, "m9", "9: classRepository.findById() & roleRepository.findByName('STUDENT')", 795, 795, 465, is_self=True)
    add_message(root, "m10", "10: Tạo User: username=studentCode, pass=123456 (encoded), role=STUDENT", 795, 795, 510, is_self=True)
    add_message(root, "m11", "11: userRepository.save(user) & studentRepository.save(student)", 795, 1025, 555)
    add_message(root, "m12", "12: INSERT INTO users ... ; INSERT INTO students ...", 1035, 1245, 585)
    add_message(root, "m13", "13: Trả về bản ghi Student vừa sinh", 1245, 1035, 615, is_reply=True)
    add_message(root, "m14", "14: Trả về Student entity hoàn chỉnh", 1025, 785, 630, is_reply=True)
    add_message(root, "m15", "15: 200 OK + ApiResponse.success('Thêm sinh viên thành công', student)", 545, 315, 660, is_reply=True)
    add_message(root, "m16", "16: loadStudents() - Làm mới danh sách sinh viên", 315, 315, 700, is_self=True)
    add_message(root, "m17", "17: Hiển thị thông báo: Thêm sinh viên thành công & Đóng Modal", 305, 80, 740, is_reply=True)

    # Opt duplicate
    add_cell(root, "alt_stu", "opt [Trùng mã sinh viên hoặc email]", STYLE_COMBINED_FRAGMENT, vertex=True, geometry={'x': 250, 'y': 770, 'width': 850, 'height': 80})
    add_message(root, "m_alt1", "400 Bad Request: Mã sinh viên hoặc Email đã tồn tại", 545, 315, 795, is_reply=True)
    add_message(root, "m_alt2", "Hiển thị thông báo lỗi trùng lặp dữ liệu trên form", 305, 80, 830, is_reply=True)

    return model

# 4. QUẢN LÝ HỒ SƠ VÀ TRẠNG THÁI SINH VIÊN
def build_seq_4_student_manage():
    model, root = create_base_model(1380, 900)
    add_cell(root, "frame_stu_mgr", "sd UC-04: Quản lý Hồ sơ & Khóa tài khoản Sinh viên", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 850})

    setup_6_lifelines(root, "Quản trị viên", "StudentsPage", "StudentController", "StudentService", "StudentRepository", "Database (MySQL)", height=760)

    # Activations
    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 600})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 500})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 410})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 310})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 260})

    # Messages
    add_message(root, "m1", "1: Chọn sinh viên & Chuyển trạng thái sang SUSPENDED (Đình chỉ)", 80, 305, 135)
    add_message(root, "m2", "2: PUT /api/students/{id}/status?status=SUSPENDED", 315, 545, 185)
    add_message(root, "m3", "3: updateStatus(id, 'SUSPENDED')", 555, 785, 230)
    add_message(root, "m4", "4: findById(id)", 795, 1025, 275)
    add_message(root, "m5", "5: SELECT * FROM students WHERE id = ?", 1035, 1245, 315)
    add_message(root, "m6", "6: Trả về Student entity và User liên kết", 1245, 1035, 355, is_reply=True)
    add_message(root, "m7", "7: Trả về Student", 1025, 795, 385, is_reply=True)
    add_message(root, "m8", "8: student.setStatus(SUSPENDED)", 795, 795, 425, is_self=True)
    add_message(root, "m9", "9: BR-Lifecycle: user.setIsActive(false) (Khóa tài khoản đăng nhập)", 795, 795, 470, is_self=True)
    add_message(root, "m10", "10: studentRepository.save(student) & userRepository.save(user)", 795, 1025, 515)
    add_message(root, "m11", "11: UPDATE students SET status = 'SUSPENDED'; UPDATE users SET is_active = 0", 1035, 1245, 545)
    add_message(root, "m12", "12: Xác nhận hoàn tất cập nhật", 1245, 1025, 575, is_reply=True)
    add_message(root, "m13", "13: Cập nhật thành công", 1025, 785, 595, is_reply=True)
    add_message(root, "m14", "14: 200 OK + ApiResponse.success('Cập nhật trạng thái thành công')", 545, 315, 630, is_reply=True)
    add_message(root, "m15", "15: Cập nhật badge hiển thị trạng thái sinh viên trên bảng", 315, 315, 675, is_self=True)
    add_message(root, "m16", "16: Hiển thị toast: Đã khóa tài khoản và đình chỉ sinh viên", 305, 80, 715, is_reply=True)

    return model

# 5. KHOA VÀ LỚP SINH HOẠT
def build_seq_5_academic_structure():
    model, root = create_base_model(1380, 880)
    add_cell(root, "frame_class", "sd UC-05: Quản lý Khoa & Lớp sinh hoạt", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 830})

    setup_6_lifelines(root, "Quản trị viên", "ClassesPage", "ClassController", "ClassService", "ClassRepository", "Database (MySQL)", height=740)

    # Activations
    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 580})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 480})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 390})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 290})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 240})

    # Messages
    add_message(root, "m1", "1: Nhập mã lớp (code), tên lớp, chọn khoa (departmentId), niên khóa", 80, 305, 135)
    add_message(root, "m2", "2: POST /api/classes (ClassRequest)", 315, 545, 185)
    add_message(root, "m3", "3: create(ClassRequest request)", 555, 785, 230)
    add_message(root, "m4", "4: existsByCode(request.getCode())", 795, 1025, 275)
    add_message(root, "m5", "5: SELECT COUNT(*) FROM classes WHERE code = ?", 1035, 1245, 315)
    add_message(root, "m6", "6: Trả về count = 0 (chưa tồn tại)", 1245, 1035, 355, is_reply=True)
    add_message(root, "m7", "7: Trả về false", 1025, 795, 385, is_reply=True)
    add_message(root, "m8", "8: departmentRepository.findById(request.getDepartmentId())", 795, 795, 425, is_self=True)
    add_message(root, "m9", "9: Khởi tạo ClassEntity (code, name, dept, academicYear, isActive=true)", 795, 795, 470, is_self=True)
    add_message(root, "m10", "10: save(ClassEntity cls)", 795, 1025, 515)
    add_message(root, "m11", "11: INSERT INTO classes (code, name, department_id, academic_year, is_active)", 1035, 1245, 545)
    add_message(root, "m12", "12: Trả về bản ghi ClassEntity vừa lưu", 1245, 1025, 575, is_reply=True)
    add_message(root, "m13", "13: Trả về ClassEntity", 1025, 785, 595, is_reply=True)
    add_message(root, "m14", "14: 200 OK + ApiResponse.success('Tạo lớp thành công', cls)", 545, 315, 625, is_reply=True)
    add_message(root, "m15", "15: Tải lại danh sách lớp học & Đóng modal", 315, 315, 665, is_self=True)
    add_message(root, "m16", "16: Hiển thị thông báo: Tạo lớp sinh hoạt thành công", 305, 80, 700, is_reply=True)

    return model

# 6. QUẢN LÝ GIẢNG VIÊN
def build_seq_6_lecturer_manage():
    model, root = create_base_model(1380, 900)
    add_cell(root, "frame_lec", "sd UC-06: Quản lý Giảng viên & Cấp tài khoản", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 850})

    setup_6_lifelines(root, "Quản trị viên", "LecturersPage", "LecturerController", "LecturerService", "LecturerRepository", "Database (MySQL)", height=760)

    # Activations
    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 600})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 500})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 410})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 310})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 260})

    # Messages
    add_message(root, "m1", "1: Nhập lecturerCode, fullName, email, departmentId, degree, specialization", 80, 305, 135)
    add_message(root, "m2", "2: POST /api/lecturers (LecturerRequest)", 315, 545, 185)
    add_message(root, "m3", "3: create(LecturerRequest request)", 555, 785, 230)
    add_message(root, "m4", "4: existsByLecturerCode(code) & existsByEmail(email)", 795, 1025, 275)
    add_message(root, "m5", "5: SELECT COUNT(*) FROM lecturers WHERE lecturer_code = ? OR email = ?", 1035, 1245, 315)
    add_message(root, "m6", "6: Trả về count = 0 (chưa tồn tại)", 1245, 1035, 355, is_reply=True)
    add_message(root, "m7", "7: Trả về false", 1025, 795, 385, is_reply=True)
    add_message(root, "m8", "8: departmentRepository.findById() & roleRepository.findByName('LECTURER')", 795, 795, 425, is_self=True)
    add_message(root, "m9", "9: Tạo User: username=code, pass=123456 (encoded), role=LECTURER", 795, 795, 470, is_self=True)
    add_message(root, "m10", "10: userRepository.save(user) & lecturerRepository.save(lecturer)", 795, 1025, 515)
    add_message(root, "m11", "11: INSERT INTO users ... ; INSERT INTO lecturers ...", 1035, 1245, 545)
    add_message(root, "m12", "12: Trả về bản ghi Lecturer vừa tạo", 1245, 1035, 575, is_reply=True)
    add_message(root, "m13", "13: Trả về Lecturer entity", 1025, 785, 595, is_reply=True)
    add_message(root, "m14", "14: 200 OK + ApiResponse.success('Thêm giảng viên thành công', lecturer)", 545, 315, 625, is_reply=True)
    add_message(root, "m15", "15: Làm mới bảng danh sách giảng viên & Đóng modal", 315, 315, 665, is_self=True)
    add_message(root, "m16", "16: Hiển thị thông báo: Cấp tài khoản & thêm giảng viên thành công", 305, 80, 705, is_reply=True)

    return model

# 7. QUẢN LÝ MÔN HỌC
def build_seq_7_subject_manage():
    model, root = create_base_model(1380, 880)
    add_cell(root, "frame_sub", "sd UC-07: Quản lý Danh mục Môn học & Tín chỉ", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 830})

    setup_6_lifelines(root, "Quản trị viên", "SubjectsPage", "SubjectController", "SubjectService", "SubjectRepository", "Database (MySQL)", height=740)

    # Activations
    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 580})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 480})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 390})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 290})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 240})

    # Messages
    add_message(root, "m1", "1: Nhập subjectCode, subjectName, credits, departmentId, description", 80, 305, 135)
    add_message(root, "m2", "2: POST /api/subjects (SubjectRequest)", 315, 545, 185)
    add_message(root, "m3", "3: create(SubjectRequest request)", 555, 785, 230)
    add_message(root, "m4", "4: existsBySubjectCode(request.getSubjectCode())", 795, 1025, 275)
    add_message(root, "m5", "5: SELECT COUNT(*) FROM subjects WHERE subject_code = ?", 1035, 1245, 315)
    add_message(root, "m6", "6: Trả về count = 0 (hợp lệ)", 1245, 1035, 355, is_reply=True)
    add_message(root, "m7", "7: Trả về false", 1025, 795, 385, is_reply=True)
    add_message(root, "m8", "8: departmentRepository.findById(deptId)", 795, 795, 425, is_self=True)
    add_message(root, "m9", "9: Khởi tạo Subject (code, name, credits, dept, isActive=true)", 795, 795, 470, is_self=True)
    add_message(root, "m10", "10: save(subject)", 795, 1025, 515)
    add_message(root, "m11", "11: INSERT INTO subjects (subject_code, subject_name, credits, department_id...)", 1035, 1245, 545)
    add_message(root, "m12", "12: Trả về Subject entity đã lưu & @CacheEvict('subjects')", 1245, 1025, 575, is_reply=True)
    add_message(root, "m13", "13: Trả về Subject", 1025, 785, 595, is_reply=True)
    add_message(root, "m14", "14: 200 OK + ApiResponse.success('Thêm môn học thành công', subject)", 545, 315, 625, is_reply=True)
    add_message(root, "m15", "15: Làm mới danh mục môn học trên bảng", 315, 315, 665, is_self=True)
    add_message(root, "m16", "16: Hiển thị thông báo: Thêm môn học mới thành công", 305, 80, 700, is_reply=True)

    return model

# 8. CẤU HÌNH HỌC KỲ
def build_seq_8_semester_config():
    model, root = create_base_model(1380, 890)
    add_cell(root, "frame_sem", "sd UC-08: Quản lý Học kỳ & Thiết lập Học kỳ hiện tại", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 840})

    setup_6_lifelines(root, "Quản trị viên", "SemestersPage", "SemesterController", "SemesterService", "SemesterRepository", "Database (MySQL)", height=750)

    # Activations
    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 580})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 480})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 390})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 300})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 250})

    # Messages
    add_message(root, "m1", "1: Chọn học kỳ và click Đặt làm học kỳ hiện tại", 80, 305, 135)
    add_message(root, "m2", "2: PUT /api/semesters/{id}/set-current", 315, 545, 185)
    add_message(root, "m3", "3: setCurrent(id)", 555, 785, 230)
    add_message(root, "m4", "4: clearCurrentSemester(id)", 795, 795, 275, is_self=True)
    add_message(root, "m5", "5: UPDATE semesters SET is_current = false WHERE is_current = true", 795, 1245, 315)
    add_message(root, "m6", "6: Xóa trạng thái học kỳ cũ thành công", 1245, 795, 355, is_reply=True)
    add_message(root, "m7", "7: findById(id)", 795, 1025, 395)
    add_message(root, "m8", "8: SELECT * FROM semesters WHERE id = ?", 1035, 1245, 430)
    add_message(root, "m9", "9: Trả về Semester entity", 1245, 1035, 460, is_reply=True)
    add_message(root, "m10", "10: semester.setIsCurrent(true) & save(semester)", 795, 1025, 495)
    add_message(root, "m11", "11: UPDATE semesters SET is_current = true WHERE id = ?", 1035, 1245, 530)
    add_message(root, "m12", "12: Xác nhận cập nhật & @CacheEvict('semesters')", 1245, 1025, 560, is_reply=True)
    add_message(root, "m13", "13: Hoàn tất chuyển đổi học kỳ", 1025, 785, 580, is_reply=True)
    add_message(root, "m14", "14: 200 OK + ApiResponse.success('Thiết lập học kỳ hiện tại thành công')", 545, 315, 615, is_reply=True)
    add_message(root, "m15", "15: Cập nhật thẻ HỌC KỲ HIỆN TẠI trên toàn hệ thống", 315, 315, 660, is_self=True)
    add_message(root, "m16", "16: Hiển thị toast: Đã kích hoạt học kỳ mới thành công", 305, 80, 700, is_reply=True)

    return model

# 9. MỞ LỚP HỌC PHẦN
def build_seq_9_course_section_open():
    model, root = create_base_model(1380, 910)
    add_cell(root, "frame_sec", "sd UC-09: Mở & Điều phối Lớp học phần", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 860})

    setup_6_lifelines(root, "Quản trị viên", "CourseSectionsPage", "CourseSectionController", "CourseSectionService", "CourseSectionRepository", "Database (MySQL)", height=770)

    # Activations
    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 600})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 500})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 410})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 310})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 260})

    # Messages
    add_message(root, "m1", "1: Nhập mã HP, chọn môn học, giảng viên, học kỳ, sĩ số tối đa (maxStudents)", 80, 305, 135)
    add_message(root, "m2", "2: POST /api/course-sections (CourseSectionRequest)", 315, 545, 185)
    add_message(root, "m3", "3: create(CourseSectionRequest request)", 555, 785, 230)
    add_message(root, "m4", "4: existsBySectionCode(request.getSectionCode())", 795, 1025, 275)
    add_message(root, "m5", "5: SELECT COUNT(*) FROM course_sections WHERE section_code = ?", 1035, 1245, 315)
    add_message(root, "m6", "6: Trả về count = 0 (hợp lệ)", 1245, 1035, 355, is_reply=True)
    add_message(root, "m7", "7: Trả về false", 1025, 795, 385, is_reply=True)
    add_message(root, "m8", "8: subjectRepo.findById() & lecturerRepo.findById() & semesterRepo.findById()", 795, 795, 425, is_self=True)
    add_message(root, "m9", "9: Khởi tạo CourseSection: status=OPEN, currentStudents=0, maxStudents=40", 795, 795, 470, is_self=True)
    add_message(root, "m10", "10: save(section)", 795, 1025, 515)
    add_message(root, "m11", "11: INSERT INTO course_sections (section_code, subject_id, lecturer_id, semester_id...)", 1035, 1245, 545)
    add_message(root, "m12", "12: Trả về bản ghi CourseSection vừa mở", 1245, 1035, 575, is_reply=True)
    add_message(root, "m13", "13: Trả về CourseSection", 1025, 785, 595, is_reply=True)
    add_message(root, "m14", "14: 200 OK + ApiResponse.success('Mở học phần thành công', section)", 545, 315, 625, is_reply=True)
    add_message(root, "m15", "15: Cập nhật danh sách học phần hiển thị trên bảng", 315, 315, 665, is_self=True)
    add_message(root, "m16", "16: Hiển thị thông báo: Mở lớp học phần thành công!", 305, 80, 705, is_reply=True)

    return model

# 10. XẾP THỜI KHÓA BIỂU
def build_seq_10_schedule_manage():
    model, root = create_base_model(1380, 930)
    add_cell(root, "frame_sch", "sd UC-10: Xếp Thời khóa biểu & Kiểm tra xung đột lịch", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 880})

    setup_6_lifelines(root, "Quản trị viên", "SchedulesPage", "ScheduleController", "ScheduleService", "ScheduleRepository", "Database (MySQL)", height=790)

    # Activations
    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 630})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 530})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 440})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 315, 'width': 10, 'height': 300})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 355, 'width': 10, 'height': 240})

    # Messages
    add_message(root, "m1", "1: Chọn sectionId, phòng học (room), thứ (dayOfWeek), tiết (start-end), ngày", 80, 305, 135)
    add_message(root, "m2", "2: POST /api/schedules (ScheduleRequest)", 315, 545, 185)
    add_message(root, "m3", "3: create(ScheduleRequest request)", 555, 785, 230)
    add_message(root, "m4", "4: validatePeriodsAndDates(startPeriod <= endPeriod & startDate <= endDate)", 795, 795, 275, is_self=True)
    add_message(root, "m5", "5: checkRoomConflict(room, dayOfWeek, startPeriod, endPeriod, dates)", 795, 1025, 315)
    add_message(root, "m6", "6: SELECT * FROM schedules WHERE room = ? AND day_of_week = ? ...", 1035, 1245, 355)
    add_message(root, "m7", "7: Trả về rỗng (Không có xung đột phòng học)", 1245, 1025, 395, is_reply=True)
    add_message(root, "m8", "8: checkLecturerConflict(lecturerId, dayOfWeek, periods, dates)", 795, 1025, 435)
    add_message(root, "m9", "9: SELECT * FROM schedules WHERE lecturer_id = ? ...", 1035, 1245, 470)
    add_message(root, "m10", "10: Trả về rỗng (Không có xung đột giảng viên)", 1245, 1025, 500, is_reply=True)
    add_message(root, "m11", "11: save(Schedule.builder().section().room().dayOfWeek()...build())", 795, 1025, 535)
    add_message(root, "m12", "12: INSERT INTO schedules (section_id, room, day_of_week, start_period...)", 1035, 1245, 565)
    add_message(root, "m13", "13: Trả về bản ghi Schedule đã lưu", 1245, 1025, 595, is_reply=True)
    add_message(root, "m14", "14: 200 OK + ApiResponse.success(schedule)", 545, 315, 630, is_reply=True)
    add_message(root, "m15", "15: Vẽ ô lịch vào lưới Thời khóa biểu tuần", 315, 315, 675, is_self=True)
    add_message(root, "m16", "16: Hiển thị toast: Xếp lịch học thành công", 305, 80, 715, is_reply=True)

    # Opt conflict
    add_cell(root, "alt_sch", "opt [Trùng phòng hoặc Trùng lịch giảng viên]", STYLE_COMBINED_FRAGMENT, vertex=True, geometry={'x': 250, 'y': 745, 'width': 850, 'height': 80})
    add_message(root, "m_alt1", "400 Bad Request: Trùng phòng học / Trùng lịch giảng viên!", 545, 315, 775, is_reply=True)
    add_message(root, "m_alt2", "Cảnh báo xung đột chi tiết lên giao diện xếp lịch", 305, 80, 810, is_reply=True)

    return model

# 11. ĐĂNG KÝ LỚP HỌC PHẦN
def build_seq_11_enrollment():
    model, root = create_base_model(1380, 940)
    add_cell(root, "frame_enr", "sd UC-11: Sinh viên Đăng ký lớp học phần", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 890})

    setup_6_lifelines(root, "Sinh viên", "EnrollPage", "EnrollmentController", "EnrollmentService", "CourseSectionRepository", "Database (MySQL)", height=800)

    # Activations
    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 640})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 540})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 450})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 310})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 250})

    # Messages
    add_message(root, "m1", "1: Chọn lớp học phần và click Đăng ký (sectionId)", 80, 305, 135)
    add_message(root, "m2", "2: POST /api/enrollments (EnrollmentRequest: sectionId)", 315, 545, 185)
    add_message(root, "m3", "3: enroll(user.getId(), request.getSectionId())", 555, 785, 230)
    add_message(root, "m4", "4: findByIdForEnrollment(sectionId) (Khóa bi quan PESSIMISTIC_WRITE)", 795, 1025, 275)
    add_message(root, "m5", "5: SELECT * FROM course_sections WHERE id = ? FOR UPDATE", 1035, 1245, 315)
    add_message(root, "m6", "6: Trả về CourseSection (Khóa bản ghi thành công)", 1245, 1035, 355, is_reply=True)
    add_message(root, "m7", "7: BR-04 & BR-05: Kiểm tra status == OPEN & hạn đăng ký học kỳ", 795, 795, 395, is_self=True)
    add_message(root, "m8", "8: BR-Capacity: currentStudents < maxStudents & chưa đăng ký trùng", 795, 795, 435, is_self=True)
    add_message(root, "m9", "9: BR-03: countEnrolledCredits() + credits <= 30", 795, 795, 475, is_self=True)
    add_message(root, "m10", "10: save(Enrollment: status = ENROLLED)", 795, 1025, 515)
    add_message(root, "m11", "11: INSERT INTO enrollments (student_id, section_id, status='ENROLLED')", 1035, 1245, 545)
    add_message(root, "m12", "12: Trigger after_enrollment_insert: current_students = current_students + 1", 1245, 1245, 575, is_self=True)
    add_message(root, "m13", "13: Trả về đối tượng Enrollment đã lưu", 1245, 785, 605, is_reply=True)
    add_message(root, "m14", "14: 200 OK + ApiResponse.success('Đăng ký học phần thành công', enrollment)", 545, 315, 640, is_reply=True)
    add_message(root, "m15", "15: Cập nhật sĩ số lớp học phần & Thêm vào TKB cá nhân", 315, 315, 685, is_self=True)
    add_message(root, "m16", "16: Hiển thị toast: Đăng ký học phần thành công!", 305, 80, 725, is_reply=True)

    # Opt error
    add_cell(root, "alt_enr", "opt [Lớp đã đầy / Vượt quá 30 tín chỉ / Hết hạn đăng ký]", STYLE_COMBINED_FRAGMENT, vertex=True, geometry={'x': 250, 'y': 755, 'width': 850, 'height': 80})
    add_message(root, "m_alt1", "400 Bad Request: Học phần đã đầy / Vượt quá tín chỉ tối đa", 545, 315, 785, is_reply=True)
    add_message(root, "m_alt2", "Hiển thị thông báo lỗi chi tiết trên màn hình Đăng ký", 305, 80, 820, is_reply=True)

    return model

# 12. HỦY ĐĂNG KÝ HỌC PHẦN
def build_seq_12_cancel_enrollment():
    model, root = create_base_model(1380, 900)
    add_cell(root, "frame_cnl", "sd UC-12: Hủy đăng ký học phần & Hoàn trả sĩ số", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 850})

    setup_6_lifelines(root, "Sinh viên", "MyEnrollmentsPage", "EnrollmentController", "EnrollmentService", "EnrollmentRepository", "Database (MySQL)", height=760)

    # Activations
    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 600})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 500})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 410})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 310})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 260})

    # Messages
    add_message(root, "m1", "1: Chọn học phần đã đăng ký & Bấm Hủy đăng ký", 80, 305, 135)
    add_message(root, "m2", "2: DELETE /api/enrollments/{enrollmentId}", 315, 545, 185)
    add_message(root, "m3", "3: cancelEnrollment(user.getId(), enrollmentId)", 555, 785, 230)
    add_message(root, "m4", "4: findById(enrollmentId)", 795, 1025, 275)
    add_message(root, "m5", "5: SELECT * FROM enrollments WHERE id = ?", 1035, 1245, 315)
    add_message(root, "m6", "6: Trả về Enrollment entity", 1245, 1035, 355, is_reply=True)
    add_message(root, "m7", "7: Kiểm tra: enrollment.studentId == currentStudentId & status == ENROLLED", 795, 795, 395, is_self=True)
    add_message(root, "m8", "8: courseSectionRepository.findByIdForEnrollment(sectionId) (Khóa hàng)", 795, 795, 440, is_self=True)
    add_message(root, "m9", "9: enrollment.setStatus(CANCELLED) & save(enrollment)", 795, 1025, 485)
    add_message(root, "m10", "10: UPDATE enrollments SET status = 'CANCELLED' WHERE id = ?", 1035, 1245, 515)
    add_message(root, "m11", "11: Trigger after_enrollment_update: current_students = current_students - 1", 1245, 1245, 545, is_self=True)
    add_message(root, "m12", "12: Hoàn tất hủy đăng ký & giải phóng chỗ", 1245, 1025, 575, is_reply=True)
    add_message(root, "m13", "13: 200 OK + ApiResponse.success('Hủy đăng ký thành công')", 545, 315, 615, is_reply=True)
    add_message(root, "m14", "14: Xóa học phần khỏi danh sách môn đã đăng ký của sinh viên", 315, 315, 660, is_self=True)
    add_message(root, "m15", "15: Hiển thị toast: Hủy đăng ký học phần thành công", 305, 80, 700, is_reply=True)

    return model

# 13. NHẬP ĐIỂM THÀNH PHẦN
def build_seq_13_grade_entry():
    model, root = create_base_model(1380, 930)
    add_cell(root, "frame_grd", "sd UC-13: Giảng viên nhập điểm thành phần & Tính tổng kết", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 880})

    setup_6_lifelines(root, "Giảng viên", "GradeEntryPage", "GradeController", "GradeService", "GradeRepository", "Database (MySQL)", height=790)

    # Activations
    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 630})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 530})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 440})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 315, 'width': 10, 'height': 300})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 355, 'width': 10, 'height': 240})

    # Messages
    add_message(root, "m1", "1: Nhập điểm CC, GK, CK cho danh sách sinh viên & Bấm Lưu tạm", 80, 305, 135)
    add_message(root, "m2", "2: PUT /api/grades/batch (List<GradeRequest>, finalize=false)", 315, 545, 185)
    add_message(root, "m3", "3: saveGrades(user.getId(), requests)", 555, 785, 230)
    add_message(root, "m4", "4: lecturerRepository.findByUserId(userId) & check quyền giảng viên", 795, 795, 275, is_self=True)
    add_message(root, "m5", "5: loop: findByEnrollmentId(request.getEnrollmentId())", 795, 1025, 315)
    add_message(root, "m6", "6: SELECT * FROM grades WHERE enrollment_id = ?", 1035, 1245, 355)
    add_message(root, "m7", "7: Trả về Grade entity (isFinalized == false)", 1245, 1025, 395, is_reply=True)
    add_message(root, "m8", "8: Set scores (CC, GK, CK) & gọi grade.calculateTotalScore()", 795, 795, 435, is_self=True)
    add_message(root, "m9", "9: Tự động tính: total = CC*0.1 + GK*0.3 + CK*0.6, letterGrade, gpaPoint", 795, 795, 480, is_self=True)
    add_message(root, "m10", "10: save(grade)", 795, 1025, 525)
    add_message(root, "m11", "11: UPDATE grades SET attendance_score=?, midterm_score=?, final_score=?, total_score=?...", 1035, 1245, 555)
    add_message(root, "m12", "12: Hoàn tất lưu điểm tạm thời cho cả lớp", 1245, 1025, 585, is_reply=True)
    add_message(root, "m13", "13: 200 OK + ApiResponse.success('Lưu điểm hàng loạt thành công')", 545, 315, 625, is_reply=True)
    add_message(root, "m14", "14: Cập nhật cột Điểm TK, Điểm Chữ và GPA hiển thị trên lưới", 315, 315, 670, is_self=True)
    add_message(root, "m15", "15: Hiển thị toast: Lưu bản nháp sổ điểm thành công", 305, 80, 715, is_reply=True)

    return model

# 14. CHỐT BẢNG ĐIỂM HỌC PHẦN
def build_seq_14_grade_finalize():
    model, root = create_base_model(1380, 930)
    add_cell(root, "frame_fnl", "sd UC-14: Chốt sổ điểm học phần & Khóa chỉnh sửa", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 880})

    setup_6_lifelines(root, "Giảng viên", "GradeEntryPage", "GradeController", "GradeService", "GradeRepository", "Database (MySQL)", height=790)

    # Activations
    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 630})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 530})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 440})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 315, 'width': 10, 'height': 300})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 355, 'width': 10, 'height': 240})

    # Messages
    add_message(root, "m1", "1: Kiểm tra bảng điểm toàn lớp & Bấm Chốt bảng điểm", 80, 305, 135)
    add_message(root, "m2", "2: PUT /api/grades (GradeRequest: finalize = true)", 315, 545, 185)
    add_message(root, "m3", "3: saveGrade(user.getId(), request)", 555, 785, 230)
    add_message(root, "m4", "4: check: grade.getIsFinalized() == false (chưa bị khóa trước đó)", 795, 795, 275, is_self=True)
    add_message(root, "m5", "5: check: grade.getTotalScore() != null (Không chốt khi chưa đủ điểm)", 795, 795, 320, is_self=True)
    add_message(root, "m6", "6: grade.setIsFinalized(true) (Khóa chính thức quyền sửa của Giảng viên)", 795, 795, 365, is_self=True)
    add_message(root, "m7", "7: save(grade)", 795, 1025, 410)
    add_message(root, "m8", "8: UPDATE grades SET is_finalized = true WHERE enrollment_id = ?", 1035, 1245, 450)
    add_message(root, "m9", "9: Xác nhận lưu trạng thái chốt sổ điểm thành công", 1245, 1025, 490, is_reply=True)
    add_message(root, "m10", "10: Trả về đối tượng Grade đã chốt", 1025, 785, 520, is_reply=True)
    add_message(root, "m11", "11: 200 OK + ApiResponse.success('Chốt điểm thành công', grade)", 545, 315, 560, is_reply=True)
    add_message(root, "m12", "12: Khóa toàn bộ các ô nhập điểm trên giao diện (disabled/readonly)", 315, 315, 605, is_self=True)
    add_message(root, "m13", "13: Hiển thị badge ĐÃ CHỐT ĐIỂM & Thông báo hoàn tất", 305, 80, 650, is_reply=True)

    # Opt error
    add_cell(root, "alt_fnl", "opt [Chưa nhập đủ điểm thành phần]", STYLE_COMBINED_FRAGMENT, vertex=True, geometry={'x': 250, 'y': 690, 'width': 850, 'height': 80})
    add_message(root, "m_alt1", "400 Bad Request: Không thể chốt điểm khi chưa nhập đủ điểm thành phần", 545, 315, 720, is_reply=True)
    add_message(root, "m_alt2", "Cảnh báo lỗi: Yêu cầu hoàn tất điểm trước khi chốt sổ", 305, 80, 755, is_reply=True)

    return model

# 15. TRA CỨU BẢNG ĐIỂM VÀ ĐIỂM CPA
def build_seq_15_transcript():
    model, root = create_base_model(1380, 920)
    add_cell(root, "frame_tra", "sd UC-15: Tra cứu bảng điểm, tính GPA học kỳ & CPA tích lũy", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 870})

    setup_6_lifelines(root, "Sinh viên", "TranscriptPage", "TranscriptController", "TranscriptService", "GradeRepository", "Database (MySQL)", height=780)

    # Activations
    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 620})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 520})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 430})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 150})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 80})

    # Messages
    add_message(root, "m1", "1: Truy cập màn hình Bảng điểm học tập", 80, 305, 135)
    add_message(root, "m2", "2: GET /api/transcript/me", 315, 545, 185)
    add_message(root, "m3", "3: studentService.findByUserId(user.getId()) -> studentId", 555, 785, 230)
    add_message(root, "m4", "4: getTranscript(studentId)", 555, 785, 275)
    add_message(root, "m5", "5: findFinalizedByStudentId(studentId) (Chỉ lấy điểm đã chốt isFinalized=true)", 795, 1025, 315)
    add_message(root, "m6", "6: SELECT * FROM grades g JOIN enrollments e ... WHERE e.student_id = ? AND is_finalized = true", 1035, 1245, 355)
    add_message(root, "m7", "7: Trả về danh sách Grade records đã chốt", 1245, 1035, 395, is_reply=True)
    add_message(root, "m8", "8: Trả về List<Grade>", 1025, 785, 425, is_reply=True)
    add_message(root, "m9", "9: Group by semester: gom nhóm danh sách điểm theo từng học kỳ", 795, 795, 465, is_self=True)
    add_message(root, "m10", "10: Tính GPA học kỳ: semGpa = sum(gpaPoint * credits) / semCredits", 795, 795, 510, is_self=True)
    add_message(root, "m11", "11: Tính CPA tích lũy: cumulativeGpa = totalWeightedGpa / totalCredits", 795, 795, 555, is_self=True)
    add_message(root, "m12", "12: Trả về TranscriptResponse(studentInfo, semesterGrades, cumulativeGpa)", 785, 555, 600, is_reply=True)
    add_message(root, "m13", "13: 200 OK + ApiResponse.success(TranscriptResponse)", 545, 315, 640, is_reply=True)
    add_message(root, "m14", "14: Hiển thị bảng điểm từng kỳ kèm GPA, tổng tín chỉ tích lũy & CPA", 305, 80, 685, is_reply=True)

    return model

# 16. BÁO CÁO THỐNG KÊ & DASHBOARD
def build_seq_16_dashboard():
    model, root = create_base_model(1380, 910)
    add_cell(root, "frame_dsh", "sd UC-16: Báo cáo Thống kê toàn trường & Dashboard", STYLE_SD_FRAME, vertex=True, geometry={'x': 20, 'y': 20, 'width': 1340, 'height': 860})

    setup_6_lifelines(root, "Quản trị viên", "DashboardPage", "DashboardController", "DashboardService", "StudentRepository", "Database (MySQL)", height=770)

    # Activations
    add_cell(root, "act_ui", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 305, 'y': 135, 'width': 10, 'height': 610})
    add_cell(root, "act_ctrl", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 545, 'y': 185, 'width': 10, 'height': 510})
    add_cell(root, "act_srv", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 785, 'y': 230, 'width': 10, 'height': 420})
    add_cell(root, "act_repo", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1025, 'y': 275, 'width': 10, 'height': 240})
    add_cell(root, "act_db", "", STYLE_ACTIVATION, vertex=True, geometry={'x': 1245, 'y': 315, 'width': 10, 'height': 170})

    # Messages
    add_message(root, "m1", "1: Truy cập Dashboard tổng quan", 80, 305, 135)
    add_message(root, "m2", "2: GET /api/dashboard", 315, 545, 185)
    add_message(root, "m3", "3: getDashboard()", 555, 785, 230)
    add_message(root, "m4", "4: count() & countByStatus(ACTIVE, GRADUATED, SUSPENDED, INACTIVE)", 795, 1025, 275)
    add_message(root, "m5", "5: countByDepartment(): SELECT dept_id, COUNT(*) FROM students GROUP BY dept_id", 795, 1025, 320)
    add_message(root, "m6", "6: SELECT COUNT(*) ... từ các bảng departments, classes, subjects, lecturers...", 1035, 1245, 360)
    add_message(root, "m7", "7: Trả về số liệu thống kê tổng hợp và cơ cấu sinh viên theo khoa", 1245, 1025, 410, is_reply=True)
    add_message(root, "m8", "8: Trả về dữ liệu KPI", 1025, 785, 450, is_reply=True)
    add_message(root, "m9", "9: Tổng hợp DashboardResponse (totalStudents, studentsByDept, studentsByStatus...)", 795, 795, 495, is_self=True)
    add_message(root, "m10", "10: Trả về DashboardResponse", 785, 555, 545, is_reply=True)
    add_message(root, "m11", "11: 200 OK + ApiResponse.success(DashboardResponse)", 545, 315, 590, is_reply=True)
    add_message(root, "m12", "12: Vẽ biểu đồ cột (Sinh viên theo khoa), biểu đồ tròn (Trạng thái) & Thẻ KPI", 305, 80, 640, is_reply=True)

    return model

# Aliases for compatibility
build_seq_6_lecturers = build_seq_6_lecturer_manage
build_seq_7_subjects = build_seq_7_subject_manage
build_seq_8_semesters = build_seq_8_semester_config
build_seq_9_course_sections = build_seq_9_course_section_open
build_seq_10_scheduling = build_seq_10_schedule_manage
build_seq_12_course_drop = build_seq_12_cancel_enrollment
build_seq_13_grading_entry = build_seq_13_grade_entry
build_seq_14_grading_finalize = build_seq_14_grade_finalize
build_seq_15_transcript_cpa = build_seq_15_transcript
build_seq_16_analytics_dashboard = build_seq_16_dashboard

# ==========================================================
# GHI TẤT CẢ 16 TAB VÀO FILE Sequence_Diagrams.drawio
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
    ]

    mxfile = ET.Element('mxfile', {
        'host': 'app.diagrams.net',
        'modified': '2026-09-11T19:40:00.000Z',
        'agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'version': '24.7.17',
        'type': 'device'
    })

    for i, (name, model) in enumerate(tabs):
        diagram = ET.SubElement(mxfile, 'diagram', {
            'id': f'seq_tab_{i+1:02d}',
            'name': name
        })
        diagram.append(model)

    raw_xml = ET.tostring(mxfile, encoding='utf-8')
    dom = minidom.parseString(raw_xml)
    pretty_xml = dom.toprettyxml(indent='  ', encoding='utf-8')

    out_dir = 'drawio'
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, 'Sequence_Diagrams.drawio')
    with open(out_file, 'wb') as f:
        f.write(pretty_xml)

    print(f"XUẤT THÀNH CÔNG: {out_file} với {len(tabs)} tab biểu đồ tuần tự độc lập chuẩn UML!")

if __name__ == '__main__':
    generate_all_sequence_diagrams()
