# -*- coding: utf-8 -*-
"""
Script to generate SEPARATED, CRYSTAL-CLEAR Sequence Diagrams for Draw.io.
Key Improvements:
1. Separated tabs and separate files (NO cramming on one tall page!).
2. Explicit sourcePoint and targetPoint on each message arrow (perfectly horizontal lines, exactly 45-55px apart).
3. No bundled lines, no black boxes, no overlapping labels.
4. Clean black-and-white academic UML standards.
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

def add_message(root, id_val, text, x1, x2, y, is_reply=False, is_self=False):
    style_call = "html=1;verticalAlign=bottom;endArrow=block;strokeColor=#000000;strokeWidth=1.5;labelBackgroundColor=none;labelBorderColor=none;fillColor=none;fontColor=#000000;fontSize=11;fontStyle=1;"
    style_reply = "html=1;verticalAlign=bottom;endArrow=open;dashed=1;strokeColor=#000000;strokeWidth=1.5;labelBackgroundColor=none;labelBorderColor=none;fillColor=none;fontColor=#000000;fontSize=11;fontStyle=0;"
    style_self = "html=1;verticalAlign=bottom;endArrow=block;strokeColor=#000000;strokeWidth=1.5;labelBackgroundColor=none;labelBorderColor=none;fillColor=none;fontColor=#000000;fontSize=11;fontStyle=1;edgeStyle=orthogonalEdgeStyle;curved=0;rounded=0;"

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
        ET.SubElement(geom, 'mxPoint', {'x': str(x1 + 4), 'y': str(y + 35), 'as': 'targetPoint'})
        # Add array of waypoints for orthogonal self call
        array = ET.SubElement(geom, 'Array', {'as': 'points'})
        ET.SubElement(array, 'mxPoint', {'x': str(x1 + 45), 'y': str(y)})
        ET.SubElement(array, 'mxPoint', {'x': str(x1 + 45), 'y': str(y + 35)})
    else:
        ET.SubElement(geom, 'mxPoint', {'x': str(x1), 'y': str(y), 'as': 'sourcePoint'})
        ET.SubElement(geom, 'mxPoint', {'x': str(x2), 'y': str(y), 'as': 'targetPoint'})

    return cell

STYLE_TITLE = "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontStyle=1;fontSize=14;fontColor=#000000;"
STYLE_LIFELINE_ACTOR = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;strokeColor=#000000;strokeWidth=1.5;fillColor=#ffffff;fontStyle=1;fontSize=12;fontColor=#000000;size=70;"
STYLE_LIFELINE = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;strokeColor=#000000;strokeWidth=1.5;fillColor=#ffffff;fontStyle=1;fontSize=12;fontColor=#000000;size=45;"

# ==========================================================
# DIAGRAM 1: ĐĂNG KÝ LỚP HỌC PHẦN (COURSE REGISTRATION)
# ==========================================================
def build_seq_diagram_enrollment():
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': '1450', 'pageHeight': '880', 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")

    # Title
    add_cell(root, "t1", "2.2.1.1 BIỂU ĐỒ TRÌNH TỰ: ĐĂNG KÝ LỚP HỌC PHẦN (USE CASE: ĐĂNG KÝ HỌC PHẦN)", STYLE_TITLE, vertex=True, geometry={'x': 50, 'y': 25, 'width': 800, 'height': 30})

    # Lifelines
    # Centers: Stu=100, UI=325, Ctrl=555, Srv=785, Repo=1015, DB=1230
    add_cell(root, "ll_stu", ":Sinh viên", STYLE_LIFELINE_ACTOR, vertex=True, geometry={'x': 60, 'y': 75, 'width': 80, 'height': 730})
    add_cell(root, "ll_ui", ":CourseRegistrationUI\n«boundary»", STYLE_LIFELINE, vertex=True, geometry={'x': 245, 'y': 75, 'width': 160, 'height': 730})
    add_cell(root, "ll_ctrl", ":EnrollmentController\n«control»", STYLE_LIFELINE, vertex=True, geometry={'x': 475, 'y': 75, 'width': 160, 'height': 730})
    add_cell(root, "ll_srv", ":EnrollmentService\n«control»", STYLE_LIFELINE, vertex=True, geometry={'x': 705, 'y': 75, 'width': 160, 'height': 730})
    add_cell(root, "ll_repo", ":CourseSectionRepo\n«control»", STYLE_LIFELINE, vertex=True, geometry={'x': 935, 'y': 75, 'width': 160, 'height': 730})
    add_cell(root, "ll_db", ":Database\n«entity»", STYLE_LIFELINE, vertex=True, geometry={'x': 1165, 'y': 75, 'width': 130, 'height': 730})

    # Perfectly spaced horizontal messages (45-55px increments)
    add_message(root, "m1_1", "1: Chọn lớp học phần & Bấm \"Đăng ký\" (sectionId)", 100, 325, 175)
    add_message(root, "m1_2", "2: POST /api/enrollments/enroll (sectionId)", 325, 555, 225)
    add_message(root, "m1_3", "3: enroll(userId, sectionId)", 555, 785, 275)
    add_message(root, "m1_4", "4: findByIdForEnrollment(sectionId)", 785, 1015, 325)
    add_message(root, "m1_5", "5: Khóa bi quan & Trả về CourseSection", 1015, 785, 370, is_reply=True)
    add_message(root, "m1_6", "6: Kiểm tra: Hạn ĐKHP, Trùng môn, Sĩ số < Max, Tổng TC <= 30", 785, 785, 415, is_self=True)
    add_message(root, "m1_7", "7: INSERT INTO enrollments (status = 'ENROLLED')", 785, 1230, 485)
    add_message(root, "m1_8", "8: Lưu thành công & Kích hoạt trigger tăng sĩ số + 1", 1230, 785, 535, is_reply=True)
    add_message(root, "m1_9", "9: Trả về đối tượng Enrollment hợp lệ", 785, 555, 585, is_reply=True)
    add_message(root, "m1_10", "10: 200 OK + Enrollment Response DTO", 555, 325, 635, is_reply=True)
    add_message(root, "m1_11", "11: Hiển thị thông báo \"Đăng ký thành công!\" & Cập nhật TKB", 325, 100, 685, is_reply=True)

    return model

# ==========================================================
# DIAGRAM 2: NHẬP VÀ CHỐT SỔ ĐIỂM (GRADE PROCESSING)
# ==========================================================
def build_seq_diagram_grading():
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': '1450', 'pageHeight': '920', 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")

    # Title
    add_cell(root, "t2", "2.2.1.2 BIỂU ĐỒ TRÌNH TỰ: NHẬP VÀ CHỐT SỔ ĐIỂM HỌC PHẦN (USE CASE: NHẬP & CHỐT ĐIỂM)", STYLE_TITLE, vertex=True, geometry={'x': 50, 'y': 25, 'width': 850, 'height': 30})

    # Lifelines
    # Centers: Lec=100, UI=320, Ctrl=540, Srv=760, Repo=980, DB=1190
    add_cell(root, "ll_lec", ":Giảng viên", STYLE_LIFELINE_ACTOR, vertex=True, geometry={'x': 60, 'y': 75, 'width': 80, 'height': 770})
    add_cell(root, "ll_ui2", ":GradeEntryUI\n«boundary»", STYLE_LIFELINE, vertex=True, geometry={'x': 240, 'y': 75, 'width': 160, 'height': 770})
    add_cell(root, "ll_ctrl2", ":GradeController\n«control»", STYLE_LIFELINE, vertex=True, geometry={'x': 460, 'y': 75, 'width': 160, 'height': 770})
    add_cell(root, "ll_srv2", ":GradeService\n«control»", STYLE_LIFELINE, vertex=True, geometry={'x': 680, 'y': 75, 'width': 160, 'height': 770})
    add_cell(root, "ll_repo2", ":GradeRepository\n«control»", STYLE_LIFELINE, vertex=True, geometry={'x': 900, 'y': 75, 'width': 160, 'height': 770})
    add_cell(root, "ll_db2", ":Database\n«entity»", STYLE_LIFELINE, vertex=True, geometry={'x': 1125, 'y': 75, 'width': 130, 'height': 770})

    # Messages
    add_message(root, "m2_1", "1: Nhập điểm CC, GK, CK & Bấm \"Chốt bảng điểm\"", 100, 320, 175)
    add_message(root, "m2_2", "2: PUT /api/grades/batch (GradeRequest, finalize=true)", 320, 540, 225)
    add_message(root, "m2_3", "3: saveGrade(userId, request)", 540, 760, 275)
    add_message(root, "m2_4", "4: Kiểm tra: Giảng viên phụ trách đúng lớp & isFinalized == false", 760, 760, 320, is_self=True)
    add_message(root, "m2_5", "5: Tính Điểm TK = CC*0.1 + GK*0.3 + CK*0.6 & Quy đổi Hệ 4/Chữ", 760, 760, 385, is_self=True)
    add_message(root, "m2_6", "6: Đánh dấu isFinalized = true (Khóa chỉnh sửa chính thức)", 760, 760, 450, is_self=True)
    add_message(root, "m2_7", "7: saveAll(gradesList)", 760, 980, 515)
    add_message(root, "m2_8", "8: UPDATE grades SET scores..., is_finalized = true", 980, 1190, 560)
    add_message(root, "m2_9", "9: Cập nhật thành công & Hoàn tất giao dịch", 1190, 760, 605, is_reply=True)
    add_message(root, "m2_10", "10: Trả về danh sách bảng điểm đã chốt", 760, 540, 650, is_reply=True)
    add_message(root, "m2_11", "11: 200 OK + GradeBatchResponse", 540, 320, 695, is_reply=True)
    add_message(root, "m2_12", "12: Khóa toàn bộ ô nhập điểm & Thông báo hoàn tất", 320, 100, 740, is_reply=True)

    return model

# ==========================================================
# DIAGRAM 3: ĐĂNG NHẬP HỆ THỐNG (USER AUTHENTICATION)
# ==========================================================
def build_seq_diagram_auth():
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': '1450', 'pageHeight': '850', 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")

    # Title
    add_cell(root, "t3", "2.2.1.3 BIỂU ĐỒ TRÌNH TỰ: ĐĂNG NHẬP HỆ THỐNG (USE CASE: ĐĂNG NHẬP)", STYLE_TITLE, vertex=True, geometry={'x': 50, 'y': 25, 'width': 800, 'height': 30})

    # Lifelines
    # Centers: User=100, UI=340, Ctrl=580, Srv=820, Repo=1060, Jwt=1260
    add_cell(root, "ll_user3", ":Người dùng", STYLE_LIFELINE_ACTOR, vertex=True, geometry={'x': 60, 'y': 75, 'width': 80, 'height': 700})
    add_cell(root, "ll_ui3", ":LoginForm\n«boundary»", STYLE_LIFELINE, vertex=True, geometry={'x': 260, 'y': 75, 'width': 160, 'height': 700})
    add_cell(root, "ll_ctrl3", ":AuthController\n«control»", STYLE_LIFELINE, vertex=True, geometry={'x': 500, 'y': 75, 'width': 160, 'height': 700})
    add_cell(root, "ll_srv3", ":AuthService\n«control»", STYLE_LIFELINE, vertex=True, geometry={'x': 740, 'y': 75, 'width': 160, 'height': 700})
    add_cell(root, "ll_repo3", ":UserRepository\n«control»", STYLE_LIFELINE, vertex=True, geometry={'x': 980, 'y': 75, 'width': 160, 'height': 700})
    add_cell(root, "ll_jwt3", ":JwtUtil\n«control»", STYLE_LIFELINE, vertex=True, geometry={'x': 1195, 'y': 75, 'width': 130, 'height': 700})

    # Messages
    add_message(root, "m3_1", "1: Nhập Username, Password & Bấm \"Đăng nhập\"", 100, 340, 175)
    add_message(root, "m3_2", "2: POST /api/auth/login (LoginRequest)", 340, 580, 225)
    add_message(root, "m3_3", "3: login(loginRequest)", 580, 820, 275)
    add_message(root, "m3_4", "4: findByUsername(username)", 820, 1060, 325)
    add_message(root, "m3_5", "5: Trả về đối tượng User (hoặc null)", 1060, 820, 370, is_reply=True)
    add_message(root, "m3_6", "6: Kiểm tra mật khẩu (BCrypt) & Trạng thái ACTIVE", 820, 820, 415, is_self=True)
    add_message(root, "m3_7", "7: generateToken(user)", 820, 1260, 480)
    add_message(root, "m3_8", "8: Trả về chuỗi JWT Token", 1260, 820, 525, is_reply=True)
    add_message(root, "m3_9", "9: Trả về JwtResponse (Token, Role, UserInfo)", 820, 580, 570, is_reply=True)
    add_message(root, "m3_10", "10: 200 OK + JwtResponse DTO", 580, 340, 615, is_reply=True)
    add_message(root, "m3_11", "11: Lưu Token vào LocalStorage & Điều hướng theo Role", 340, 100, 660, is_reply=True)

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
    
    # 1. Multi-tab Sequence Diagrams file
    multi_file = ET.Element('mxfile', {
        'host': 'app.diagrams.net',
        'modified': '2026-09-10T02:00:00.000Z',
        'agent': 'Antigravity AI Agent',
        'version': '21.0.0',
        'type': 'device'
    })

    d1 = ET.SubElement(multi_file, 'diagram', {'id': 'seq_enr', 'name': '1. ĐK Học phần (Sequence)'})
    d1.append(build_seq_diagram_enrollment())

    d2 = ET.SubElement(multi_file, 'diagram', {'id': 'seq_grd', 'name': '2. Nhập & Chốt điểm (Sequence)'})
    d2.append(build_seq_diagram_grading())

    d3 = ET.SubElement(multi_file, 'diagram', {'id': 'seq_auth', 'name': '3. Đăng nhập (Sequence)'})
    d3.append(build_seq_diagram_auth())

    xml_str = ET.tostring(multi_file, encoding='utf-8')
    parsed = minidom.parseString(xml_str)
    pretty_xml = parsed.toprettyxml(indent='  ', encoding='utf-8')

    for path in ['1_BieuDo_TrinhTu_Sequence.drawio', 'docs/1_BieuDo_TrinhTu_Sequence.drawio']:
        with open(path, 'wb') as f:
            f.write(pretty_xml)
        print(f"Saved multi-page: {path}")

    # 2. Dedicated Single files for each sequence diagram
    save_single_diagram('Sequence_DangKyHocPhan.drawio', 'seq_enr', 'Sequence - Đăng ký học phần', build_seq_diagram_enrollment)
    save_single_diagram('Sequence_NhapChotDiem.drawio', 'seq_grd', 'Sequence - Nhập và Chốt điểm', build_seq_diagram_grading)
    save_single_diagram('Sequence_DangNhap.drawio', 'seq_auth', 'Sequence - Đăng nhập', build_seq_diagram_auth)

if __name__ == '__main__':
    main()
