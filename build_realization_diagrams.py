# -*- coding: utf-8 -*-
"""
Script to generate standard Draw.io (.drawio) XML files for:
SECTION 2.2: USE-CASE REALIZATIONS (HIỆN THỰC HÓA USE CASE)
2.2.1 Sequence Diagrams (Biểu đồ trình tự)
2.2.2 Activity Diagrams (Biểu đồ hoạt động)
2.2.3 Analysis Class Diagrams - BCE (Biểu đồ lớp phân tích BCE)

Outputs:
1. HienThucHoa_UseCase_Realizations.drawio (Multi-page diagram with 3 tabs)
2. 1_BieuDo_TrinhTu_Sequence.drawio
3. 2_BieuDo_HoatDong_Activity.drawio
4. 3_BieuDo_LopPhanTich_BCE.drawio
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

# --- CLEAN ACADEMIC STYLES ---
STYLE_TITLE = "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontStyle=1;fontSize=15;fontColor=#000000;"
STYLE_SUBTITLE = "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontStyle=1;fontSize=13;fontColor=#000000;"

# Sequence Diagram styles
STYLE_LIFELINE_ACTOR = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;strokeColor=#000000;strokeWidth=1.5;fillColor=#ffffff;fontStyle=1;fontSize=12;fontColor=#000000;size=70;"
STYLE_LIFELINE = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;strokeColor=#000000;strokeWidth=1.5;fillColor=#ffffff;fontStyle=1;fontSize=12;fontColor=#000000;size=40;"
STYLE_ACTIVATION = "html=1;points=[];perimeter=orthogonalPerimeter;strokeColor=#000000;strokeWidth=1.2;fillColor=#ffffff;"
STYLE_CALL = "html=1;verticalAlign=bottom;endArrow=block;strokeColor=#000000;strokeWidth=1.4;labelBackgroundColor=none;labelBorderColor=none;fillColor=none;fontColor=#000000;fontSize=11;fontStyle=1;"
STYLE_REPLY = "html=1;verticalAlign=bottom;endArrow=open;dashed=1;strokeColor=#000000;strokeWidth=1.4;labelBackgroundColor=none;labelBorderColor=none;fillColor=none;fontColor=#000000;fontSize=11;fontStyle=0;"
STYLE_ALT_FRAME = "shape=umlFrame;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;strokeWidth=1.4;width=60;height=25;fontStyle=1;fontSize=11;fontColor=#000000;"

# Activity Diagram styles
STYLE_START = "ellipse;html=1;shape=startState;fillColor=#000000;strokeColor=#000000;"
STYLE_END = "ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#000000;"
STYLE_ACTIVITY = "rounded=1;whiteSpace=wrap;html=1;arcSize=40;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=11;fontColor=#000000;"
STYLE_DECISION = "rhombus;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=11;fontColor=#000000;"
STYLE_SWIMLANE = "swimlane;startSize=30;html=1;fillColor=none;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontColor=#000000;"
STYLE_FLOW = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;strokeColor=#000000;strokeWidth=1.5;labelBackgroundColor=none;labelBorderColor=none;fillColor=none;fontColor=#000000;fontSize=11;fontStyle=1;"

# BCE Class styles
STYLE_BCE_BOX = "swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=45;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=0;marginBottom=0;html=1;strokeColor=#000000;strokeWidth=1.5;fillColor=#ffffff;fontColor=#000000;fontSize=12;"
STYLE_BCE_ITEM = "text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;html=1;fontSize=11;fontColor=#000000;"
STYLE_BCE_DIVIDER = "line;strokeWidth=1;fillColor=none;align=left;verticalAlign=middle;spacingTop=-1;spacingLeft=3;spacingRight=3;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;strokeColor=#000000;"
STYLE_BCE_EDGE = "html=1;endArrow=open;dashed=1;strokeColor=#000000;strokeWidth=1.5;labelBackgroundColor=none;labelBorderColor=none;fillColor=none;fontColor=#000000;fontSize=11;fontStyle=1;"
STYLE_ASSOC_SOLID = "endArrow=none;html=1;strokeWidth=1.5;strokeColor=#000000;"

# ==========================================
# 1. SEQUENCE DIAGRAMS TAB
# ==========================================
def build_diagram_1_sequence():
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': '1650', 'pageHeight': '1400', 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")

    # Title
    add_cell(root, "t_seq", "2.2.1 CÁC BIỂU ĐỒ TRÌNH TỰ (SEQUENCE DIAGRAMS)", STYLE_TITLE, vertex=True, geometry={'x': 40, 'y': 20, 'width': 700, 'height': 30})

    # --- SƠ ĐỒ 1: ĐĂNG KÝ HỌC PHẦN (UC-04) ---
    add_cell(root, "t_seq1", "1. Biểu đồ trình tự: Đăng ký lớp học phần (Use Case: Đăng ký Học phần)", STYLE_SUBTITLE, vertex=True, geometry={'x': 40, 'y': 65, 'width': 650, 'height': 25})

    # Lifelines for Enrollment
    # x positions: Stu(80), UI(270), Ctrl(480), Srv(700), Repo(940), DB(1160)
    add_cell(root, "ll_s1_stu", ":Sinh viên", STYLE_LIFELINE_ACTOR, vertex=True, geometry={'x': 60, 'y': 100, 'width': 70, 'height': 520})
    add_cell(root, "ll_s1_ui", ":EnrollmentUI", STYLE_LIFELINE, vertex=True, geometry={'x': 220, 'y': 100, 'width': 120, 'height': 520})
    add_cell(root, "ll_s1_ctrl", ":EnrollmentCtrl", STYLE_LIFELINE, vertex=True, geometry={'x': 430, 'y': 100, 'width': 120, 'height': 520})
    add_cell(root, "ll_s1_srv", ":EnrollmentService", STYLE_LIFELINE, vertex=True, geometry={'x': 640, 'y': 100, 'width': 140, 'height': 520})
    add_cell(root, "ll_s1_repo", ":SectionRepo", STYLE_LIFELINE, vertex=True, geometry={'x': 870, 'y': 100, 'width': 120, 'height': 520})
    add_cell(root, "ll_s1_db", ":Database", STYLE_LIFELINE, vertex=True, geometry={'x': 1080, 'y': 100, 'width': 100, 'height': 520})

    # Sequence Messages
    msgs_s1 = [
        # (id, label, style, source, target, y)
        ("m1_1", "1: Chọn lớp học phần & Bấm Đăng ký (sectionId)", STYLE_CALL, "ll_s1_stu", "ll_s1_ui", 180),
        ("m1_2", "2: POST /api/enrollments/enroll (sectionId)", STYLE_CALL, "ll_s1_ui", "ll_s1_ctrl", 215),
        ("m1_3", "3: enroll(userId, sectionId)", STYLE_CALL, "ll_s1_ctrl", "ll_s1_srv", 250),
        ("m1_4", "4: findByIdForEnrollment(sectionId)", STYLE_CALL, "ll_s1_srv", "ll_s1_repo", 285),
        ("m1_5", "5: Khóa bi quan & Trả về CourseSection", STYLE_REPLY, "ll_s1_repo", "ll_s1_srv", 320),
        ("m1_6", "6: Kiểm tra hạn ĐKHP & Sĩ số (current < max) & Max 30 TC", STYLE_CALL, "ll_s1_srv", "ll_s1_srv", 365),
        ("m1_7", "7: save(new Enrollment(status=ENROLLED))", STYLE_CALL, "ll_s1_srv", "ll_s1_db", 410),
        ("m1_8", "8: Lưu thành công & Trigger tăng sĩ số + 1", STYLE_REPLY, "ll_s1_db", "ll_s1_srv", 450),
        ("m1_9", "9: Trả về đối tượng Enrollment hợp lệ", STYLE_REPLY, "ll_s1_srv", "ll_s1_ctrl", 490),
        ("m1_10", "10: 200 OK + Enrollment Response", STYLE_REPLY, "ll_s1_ctrl", "ll_s1_ui", 525),
        ("m1_11", "11: Hiển thị thông báo \"Đăng ký thành công!\"", STYLE_REPLY, "ll_s1_ui", "ll_s1_stu", 560),
    ]

    for mid, mval, msty, msrc, mtgt, my in msgs_s1:
        cell = add_cell(root, mid, mval, msty, edge=True, source=msrc, target=mtgt)
        cell_geom = ET.SubElement(cell, 'mxGeometry', {'relative': '1', 'as': 'geometry'})
        # Offset vertical point
        cell_geom.attrib['y'] = str(my)

    # --- SƠ ĐỒ 2: NHẬP VÀ CHỐT SỔ ĐIỂM (UC-06 & UC-07) ---
    y_offset = 670
    add_cell(root, "t_seq2", "2. Biểu đồ trình tự: Nhập và Chốt sổ điểm học phần (Use Case: Nhập & Chốt điểm)", STYLE_SUBTITLE, vertex=True, geometry={'x': 40, 'y': y_offset, 'width': 700, 'height': 25})

    add_cell(root, "ll_s2_lec", ":Giảng viên", STYLE_LIFELINE_ACTOR, vertex=True, geometry={'x': 60, 'y': y_offset + 35, 'width': 70, 'height': 530})
    add_cell(root, "ll_s2_ui", ":GradeEntryUI", STYLE_LIFELINE, vertex=True, geometry={'x': 220, 'y': y_offset + 35, 'width': 120, 'height': 530})
    add_cell(root, "ll_s2_ctrl", ":GradeCtrl", STYLE_LIFELINE, vertex=True, geometry={'x': 430, 'y': y_offset + 35, 'width': 120, 'height': 530})
    add_cell(root, "ll_s2_srv", ":GradeService", STYLE_LIFELINE, vertex=True, geometry={'x': 640, 'y': y_offset + 35, 'width': 140, 'height': 530})
    add_cell(root, "ll_s2_repo", ":GradeRepo", STYLE_LIFELINE, vertex=True, geometry={'x': 870, 'y': y_offset + 35, 'width': 120, 'height': 530})
    add_cell(root, "ll_s2_db", ":Database", STYLE_LIFELINE, vertex=True, geometry={'x': 1080, 'y': y_offset + 35, 'width': 100, 'height': 530})

    msgs_s2 = [
        ("m2_1", "1: Nhập điểm CC, GK, CK & Bấm Chốt điểm (finalize=true)", STYLE_CALL, "ll_s2_lec", "ll_s2_ui", y_offset + 110),
        ("m2_2", "2: PUT /api/grades/batch (GradeRequest)", STYLE_CALL, "ll_s2_ui", "ll_s2_ctrl", y_offset + 145),
        ("m2_3", "3: saveGrade(userId, request)", STYLE_CALL, "ll_s2_ctrl", "ll_s2_srv", y_offset + 180),
        ("m2_4", "4: Kiểm tra: Giảng viên phụ trách đúng lớp & isFinalized == false", STYLE_CALL, "ll_s2_srv", "ll_s2_srv", y_offset + 225),
        ("m2_5", "5: Tính điểm TK = (CC*0.1) + (GK*0.3) + (CK*0.6) & Quy đổi Hệ 4/Chữ", STYLE_CALL, "ll_s2_srv", "ll_s2_srv", y_offset + 280),
        ("m2_6", "6: Đánh dấu isFinalized = true (Khóa chỉnh sửa)", STYLE_CALL, "ll_s2_srv", "ll_s2_srv", y_offset + 330),
        ("m2_7", "7: save(grade)", STYLE_CALL, "ll_s2_srv", "ll_s2_repo", y_offset + 375),
        ("m2_8", "8: Cập nhật bản ghi Grade vào CSDL", STYLE_CALL, "ll_s2_repo", "ll_s2_db", y_offset + 410),
        ("m2_9", "9: Cập nhật thành công", STYLE_REPLY, "ll_s2_db", "ll_s2_srv", y_offset + 445),
        ("m2_10", "10: 200 OK + Grade Response", STYLE_REPLY, "ll_s2_srv", "ll_s2_ctrl", y_offset + 480),
        ("m2_11", "11: 200 OK (Chốt điểm thành công)", STYLE_REPLY, "ll_s2_ctrl", "ll_s2_ui", y_offset + 510),
        ("m2_12", "12: Khóa toàn bộ ô nhập điểm & Thông báo hoàn tất", STYLE_REPLY, "ll_s2_ui", "ll_s2_lec", y_offset + 540),
    ]

    for mid, mval, msty, msrc, mtgt, my in msgs_s2:
        cell = add_cell(root, mid, mval, msty, edge=True, source=msrc, target=mtgt)
        cell_geom = ET.SubElement(cell, 'mxGeometry', {'relative': '1', 'as': 'geometry'})
        cell_geom.attrib['y'] = str(my)

    return model

# ==========================================
# 2. ACTIVITY DIAGRAMS TAB
# ==========================================
def build_diagram_2_activity():
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': '1550', 'pageHeight': '1250', 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")

    add_cell(root, "t_act", "2.2.2 CÁC BIỂU ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAMS)", STYLE_TITLE, vertex=True, geometry={'x': 40, 'y': 20, 'width': 700, 'height': 30})

    # --- SƠ ĐỒ HOẠT ĐỘNG: ĐĂNG KÝ HỌC PHẦN (SWIMLANES: SINH VIÊN vs HỆ THỐNG) ---
    add_cell(root, "t_act1", "1. Biểu đồ hoạt động: Quy trình Đăng ký lớp học phần (Phân hệ Sinh viên)", STYLE_SUBTITLE, vertex=True, geometry={'x': 40, 'y': 65, 'width': 650, 'height': 25})

    # Swimlane 1: Sinh viên
    add_cell(root, "lane_stu", "Sinh viên", STYLE_SWIMLANE, vertex=True, geometry={'x': 60, 'y': 100, 'width': 440, 'height': 980})
    # Swimlane 2: Hệ thống
    add_cell(root, "lane_sys", "Hệ thống (Web App & Server)", STYLE_SWIMLANE, vertex=True, geometry={'x': 500, 'y': 100, 'width': 780, 'height': 980})

    # Nodes in Sinh viên Lane
    add_cell(root, "a_start", "", STYLE_START, vertex=True, geometry={'x': 255, 'y': 145, 'width': 25, 'height': 25})
    add_cell(root, "act_open_reg", "Truy cập màn hình ĐKHP", STYLE_ACTIVITY, vertex=True, geometry={'x': 180, 'y': 200, 'width': 180, 'height': 45})
    add_cell(root, "act_select_sec", "Chọn lớp học phần\n& Bấm \"Đăng ký\"", STYLE_ACTIVITY, vertex=True, geometry={'x': 180, 'y': 340, 'width': 180, 'height': 50})
    add_cell(root, "act_view_success", "Xem học phần trong TKB cá nhân\n& Tóm tắt tín chỉ", STYLE_ACTIVITY, vertex=True, geometry={'x': 175, 'y': 940, 'width': 190, 'height': 50})

    # Nodes in Hệ thống Lane
    add_cell(root, "act_load_secs", "Tải danh mục Học phần mở (OPEN)\ntheo Học kỳ hiện tại", STYLE_ACTIVITY, vertex=True, geometry={'x': 660, 'y': 200, 'width': 220, 'height': 45})
    
    # Decision 1: Hạn ĐKHP
    add_cell(root, "dec_time", "Trong hạn ĐKHP?", STYLE_DECISION, vertex=True, geometry={'x': 700, 'y': 335, 'width': 140, 'height': 60})
    add_cell(root, "act_err_time", "Báo lỗi: Hết thời gian đăng ký", STYLE_ACTIVITY, vertex=True, geometry={'x': 950, 'y': 342, 'width': 180, 'height': 45})
    
    # Decision 2: Trùng môn
    add_cell(root, "dec_dup", "Đã đăng ký trước đó?", STYLE_DECISION, vertex=True, geometry={'x': 700, 'y': 445, 'width': 140, 'height': 60})
    add_cell(root, "act_err_dup", "Báo lỗi: Đã đăng ký môn này", STYLE_ACTIVITY, vertex=True, geometry={'x': 950, 'y': 452, 'width': 180, 'height': 45})

    # Decision 3: Sĩ số
    add_cell(root, "dec_cap", "Sĩ số hiện tại < Tối đa?", STYLE_DECISION, vertex=True, geometry={'x': 700, 'y': 555, 'width': 140, 'height': 60})
    add_cell(root, "act_err_cap", "Báo lỗi: Lớp đã đầy chỗ", STYLE_ACTIVITY, vertex=True, geometry={'x': 950, 'y': 562, 'width': 180, 'height': 45})

    # Decision 4: Tổng TC <= 30
    add_cell(root, "dec_credit", "Tổng TC kỳ này <= 30?", STYLE_DECISION, vertex=True, geometry={'x': 700, 'y': 665, 'width': 140, 'height': 60})
    add_cell(root, "act_err_credit", "Báo lỗi: Vượt quá 30 TC / kỳ", STYLE_ACTIVITY, vertex=True, geometry={'x': 950, 'y': 672, 'width': 180, 'height': 45})

    # Success Actions
    add_cell(root, "act_save_enr", "Tạo bản ghi Enrollment (ENROLLED)\n& Khóa bi quan giao dịch", STYLE_ACTIVITY, vertex=True, geometry={'x': 660, 'y': 780, 'width': 220, 'height': 50})
    add_cell(root, "act_inc_count", "Tự động tăng sĩ số lớp + 1\n(Trigger DB cập nhật)", STYLE_ACTIVITY, vertex=True, geometry={'x': 660, 'y': 860, 'width': 220, 'height': 45})
    add_cell(root, "act_toast_success", "Thông báo: Đăng ký thành công!", STYLE_ACTIVITY, vertex=True, geometry={'x': 660, 'y': 940, 'width': 220, 'height': 45})

    # End Node
    add_cell(root, "a_end", "", STYLE_END, vertex=True, geometry={'x': 1025, 'y': 950, 'width': 25, 'height': 25})

    # Flow Edges
    flows = [
        ("fl1", "", STYLE_FLOW, "a_start", "act_open_reg"),
        ("fl2", "", STYLE_FLOW, "act_open_reg", "act_load_secs"),
        ("fl3", "", STYLE_FLOW, "act_load_secs", "act_select_sec"),
        ("fl4", "", STYLE_FLOW, "act_select_sec", "dec_time"),
        ("fl5_err", "[Không]", STYLE_FLOW, "dec_time", "act_err_time"),
        ("fl5_ok", "[Hợp lệ]", STYLE_FLOW, "dec_time", "dec_dup"),
        ("fl6_err", "[Đã ĐK]", STYLE_FLOW, "dec_dup", "act_err_dup"),
        ("fl6_ok", "[Chưa]", STYLE_FLOW, "dec_dup", "dec_cap"),
        ("fl7_err", "[Đầy chỗ]", STYLE_FLOW, "dec_cap", "act_err_cap"),
        ("fl7_ok", "[Còn chỗ]", STYLE_FLOW, "dec_cap", "dec_credit"),
        ("fl8_err", "[> 30 TC]", STYLE_FLOW, "dec_credit", "act_err_credit"),
        ("fl8_ok", "[Đủ ĐK]", STYLE_FLOW, "dec_credit", "act_save_enr"),
        ("fl9", "", STYLE_FLOW, "act_save_enr", "act_inc_count"),
        ("fl10", "", STYLE_FLOW, "act_inc_count", "act_toast_success"),
        ("fl11", "", STYLE_FLOW, "act_toast_success", "act_view_success"),
        ("fl12", "", STYLE_FLOW, "act_view_success", "a_end"),
        ("fl_e1", "", STYLE_FLOW, "act_err_time", "a_end"),
        ("fl_e2", "", STYLE_FLOW, "act_err_dup", "a_end"),
        ("fl_e3", "", STYLE_FLOW, "act_err_cap", "a_end"),
        ("fl_e4", "", STYLE_FLOW, "act_err_credit", "a_end"),
    ]

    for fid, fval, fsty, fsrc, ftgt in flows:
        add_cell(root, fid, fval, fsty, edge=True, source=fsrc, target=ftgt, geometry={'relative': 1})

    return model

# ==========================================
# 3. ANALYSIS CLASS DIAGRAM (BCE) TAB
# ==========================================
def build_diagram_3_bce():
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': '1650', 'pageHeight': '1150', 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")

    add_cell(root, "t_bce", "2.2.3 BIỂU ĐỒ LỚP PHÂN TÍCH (ANALYSIS CLASS DIAGRAM - BCE)", STYLE_TITLE, vertex=True, geometry={'x': 40, 'y': 20, 'width': 750, 'height': 30})

    # --- CỘT 1: BOUNDARY CLASSES (Giao diện) ---
    add_cell(root, "hdr_bnd", "«boundary»\nCÁC LỚP GIAO DIỆN", STYLE_SUBTITLE, vertex=True, geometry={'x': 60, 'y': 65, 'width': 250, 'height': 30})

    # Box: LoginForm
    b1 = add_cell(root, "bce_login_form", "«boundary»\nLoginForm", STYLE_BCE_BOX, vertex=True, geometry={'x': 60, 'y': 110, 'width': 220, 'height': 110})
    add_cell(root, "b1_1", "- txtUsername: String\n- txtPassword: String", STYLE_BCE_ITEM, vertex=True, parent="bce_login_form", geometry={'x': 0, 'y': 45, 'width': 220, 'height': 30})
    add_cell(root, "b1_div", "", STYLE_BCE_DIVIDER, vertex=True, parent="bce_login_form", geometry={'x': 0, 'y': 75, 'width': 220, 'height': 5})
    add_cell(root, "b1_2", "+ onLoginSubmit()\n+ displayLoginError()", STYLE_BCE_ITEM, vertex=True, parent="bce_login_form", geometry={'x': 0, 'y': 80, 'width': 220, 'height': 30})

    # Box: CourseRegistrationView
    b2 = add_cell(root, "bce_enr_view", "«boundary»\nCourseRegistrationView", STYLE_BCE_BOX, vertex=True, geometry={'x': 60, 'y': 260, 'width': 220, 'height': 130})
    add_cell(root, "b2_1", "- selectedSectionId: Long\n- availableSectionsList: List", STYLE_BCE_ITEM, vertex=True, parent="bce_enr_view", geometry={'x': 0, 'y': 45, 'width': 220, 'height': 30})
    add_cell(root, "b2_div", "", STYLE_BCE_DIVIDER, vertex=True, parent="bce_enr_view", geometry={'x': 0, 'y': 75, 'width': 220, 'height': 5})
    add_cell(root, "b2_2", "+ onEnrollClick()\n+ onDropClick()\n+ displayEnrolledToast()", STYLE_BCE_ITEM, vertex=True, parent="bce_enr_view", geometry={'x': 0, 'y': 80, 'width': 220, 'height': 45})

    # Box: GradeEntryView
    b3 = add_cell(root, "bce_grd_view", "«boundary»\nGradeEntryView", STYLE_BCE_BOX, vertex=True, geometry={'x': 60, 'y': 430, 'width': 220, 'height': 130})
    add_cell(root, "b3_1", "- sectionId: Long\n- gradeTableData: List", STYLE_BCE_ITEM, vertex=True, parent="bce_grd_view", geometry={'x': 0, 'y': 45, 'width': 220, 'height': 30})
    add_cell(root, "b3_div", "", STYLE_BCE_DIVIDER, vertex=True, parent="bce_grd_view", geometry={'x': 0, 'y': 75, 'width': 220, 'height': 5})
    add_cell(root, "b3_2", "+ onScoreChange()\n+ onSaveDraft()\n+ onFinalizeSubmit()", STYLE_BCE_ITEM, vertex=True, parent="bce_grd_view", geometry={'x': 0, 'y': 80, 'width': 220, 'height': 45})

    # Box: TranscriptView
    b4 = add_cell(root, "bce_trans_view", "«boundary»\nTranscriptView", STYLE_BCE_BOX, vertex=True, geometry={'x': 60, 'y': 600, 'width': 220, 'height': 120})
    add_cell(root, "b4_1", "- cpaScore: Double\n- semesterGpaList: List", STYLE_BCE_ITEM, vertex=True, parent="bce_trans_view", geometry={'x': 0, 'y': 45, 'width': 220, 'height': 30})
    add_cell(root, "b4_div", "", STYLE_BCE_DIVIDER, vertex=True, parent="bce_trans_view", geometry={'x': 0, 'y': 75, 'width': 220, 'height': 5})
    add_cell(root, "b4_2", "+ displayTranscript()\n+ filterBySemester()", STYLE_BCE_ITEM, vertex=True, parent="bce_trans_view", geometry={'x': 0, 'y': 80, 'width': 220, 'height': 35})

    # --- CỘT 2: CONTROL CLASSES (Điều khiển & Nghiệp vụ) ---
    add_cell(root, "hdr_ctrl", "«control»\nCÁC LỚP ĐIỀU KHIỂN & XỬ LÝ", STYLE_SUBTITLE, vertex=True, geometry={'x': 450, 'y': 65, 'width': 300, 'height': 30})

    # Box: AuthController & Service
    c1 = add_cell(root, "bce_auth_ctrl", "«control»\nAuthController / AuthService", STYLE_BCE_BOX, vertex=True, geometry={'x': 450, 'y': 110, 'width': 260, 'height': 110})
    add_cell(root, "c1_1", "- jwtUtil: JwtUtil\n- passwordEncoder: BCrypt", STYLE_BCE_ITEM, vertex=True, parent="bce_auth_ctrl", geometry={'x': 0, 'y': 45, 'width': 260, 'height': 30})
    add_cell(root, "c1_div", "", STYLE_BCE_DIVIDER, vertex=True, parent="bce_auth_ctrl", geometry={'x': 0, 'y': 75, 'width': 260, 'height': 5})
    add_cell(root, "c1_2", "+ login(username, pwd): JwtDto\n+ changePassword(userId, newPwd)", STYLE_BCE_ITEM, vertex=True, parent="bce_auth_ctrl", geometry={'x': 0, 'y': 80, 'width': 260, 'height': 30})

    # Box: EnrollmentController & Service
    c2 = add_cell(root, "bce_enr_ctrl", "«control»\nEnrollmentController / Service", STYLE_BCE_BOX, vertex=True, geometry={'x': 450, 'y': 260, 'width': 260, 'height': 130})
    add_cell(root, "c2_1", "- MAX_CREDITS_PER_SEM = 30", STYLE_BCE_ITEM, vertex=True, parent="bce_enr_ctrl", geometry={'x': 0, 'y': 45, 'width': 260, 'height': 30})
    add_cell(root, "c2_div", "", STYLE_BCE_DIVIDER, vertex=True, parent="bce_enr_ctrl", geometry={'x': 0, 'y': 75, 'width': 260, 'height': 5})
    add_cell(root, "c2_2", "+ enroll(userId, secId): Enrollment\n+ drop(userId, enrId): void\n+ checkCapacity(secId): boolean", STYLE_BCE_ITEM, vertex=True, parent="bce_enr_ctrl", geometry={'x': 0, 'y': 80, 'width': 260, 'height': 45})

    # Box: GradeController & Service
    c3 = add_cell(root, "bce_grd_ctrl", "«control»\nGradeController / GradeService", STYLE_BCE_BOX, vertex=True, geometry={'x': 450, 'y': 430, 'width': 260, 'height': 130})
    add_cell(root, "c3_1", "- gradeFormula: CC*0.1+GK*0.3+CK*0.6", STYLE_BCE_ITEM, vertex=True, parent="bce_grd_ctrl", geometry={'x': 0, 'y': 45, 'width': 260, 'height': 30})
    add_cell(root, "c3_div", "", STYLE_BCE_DIVIDER, vertex=True, parent="bce_grd_ctrl", geometry={'x': 0, 'y': 75, 'width': 260, 'height': 5})
    add_cell(root, "c3_2", "+ saveGrade(userId, req): Grade\n+ finalizeSectionGrades(secId)\n+ calculateTotalScore(cc, gk, ck)", STYLE_BCE_ITEM, vertex=True, parent="bce_grd_ctrl", geometry={'x': 0, 'y': 80, 'width': 260, 'height': 45})

    # Box: TranscriptController & Service
    c4 = add_cell(root, "bce_trans_ctrl", "«control»\nTranscriptController / Service", STYLE_BCE_BOX, vertex=True, geometry={'x': 450, 'y': 600, 'width': 260, 'height': 120})
    add_cell(root, "c4_1", "- transcriptViewRepo: ViewRepo", STYLE_BCE_ITEM, vertex=True, parent="bce_trans_ctrl", geometry={'x': 0, 'y': 45, 'width': 260, 'height': 30})
    add_cell(root, "c4_div", "", STYLE_BCE_DIVIDER, vertex=True, parent="bce_trans_ctrl", geometry={'x': 0, 'y': 75, 'width': 260, 'height': 5})
    add_cell(root, "c4_2", "+ getStudentTranscript(userId)\n+ calculateCPA(studentId): Double", STYLE_BCE_ITEM, vertex=True, parent="bce_trans_ctrl", geometry={'x': 0, 'y': 80, 'width': 260, 'height': 35})

    # --- CỘT 3: ENTITY CLASSES (Thực thể CSDL) ---
    add_cell(root, "hdr_ent", "«entity»\nCÁC THỰC THỂ DỮ LIỆU", STYLE_SUBTITLE, vertex=True, geometry={'x': 900, 'y': 65, 'width': 300, 'height': 30})

    # Entity: User
    e1 = add_cell(root, "bce_ent_user", "«entity»\nUser", STYLE_BCE_BOX, vertex=True, geometry={'x': 900, 'y': 110, 'width': 210, 'height': 90})
    add_cell(root, "e1_1", "- id: Long\n- username: String\n- role: RoleType\n- status: UserStatus", STYLE_BCE_ITEM, vertex=True, parent="bce_ent_user", geometry={'x': 0, 'y': 45, 'width': 210, 'height': 45})

    # Entity: Student
    e2 = add_cell(root, "bce_ent_stu", "«entity»\nStudent", STYLE_BCE_BOX, vertex=True, geometry={'x': 900, 'y': 240, 'width': 210, 'height': 100})
    add_cell(root, "e2_1", "- id: Long\n- studentCode: String\n- fullName: String\n- classId: Long", STYLE_BCE_ITEM, vertex=True, parent="bce_ent_stu", geometry={'x': 0, 'y': 45, 'width': 210, 'height': 55})

    # Entity: CourseSection
    e3 = add_cell(root, "bce_ent_sec", "«entity»\nCourseSection", STYLE_BCE_BOX, vertex=True, geometry={'x': 1200, 'y': 240, 'width': 220, 'height': 120})
    add_cell(root, "e3_1", "- id: Long\n- sectionCode: String\n- maxStudents: Integer\n- currentStudents: Integer\n- status: SectionStatus", STYLE_BCE_ITEM, vertex=True, parent="bce_ent_sec", geometry={'x': 0, 'y': 45, 'width': 220, 'height': 70})

    # Entity: Enrollment
    e4 = add_cell(root, "bce_ent_enr", "«entity»\nEnrollment", STYLE_BCE_BOX, vertex=True, geometry={'x': 1050, 'y': 420, 'width': 210, 'height': 100})
    add_cell(root, "e4_1", "- id: Long\n- studentId: Long\n- sectionId: Long\n- status: EnrollmentStatus", STYLE_BCE_ITEM, vertex=True, parent="bce_ent_enr", geometry={'x': 0, 'y': 45, 'width': 210, 'height': 55})

    # Entity: Grade
    e5 = add_cell(root, "bce_ent_grd", "«entity»\nGrade", STYLE_BCE_BOX, vertex=True, geometry={'x': 1050, 'y': 580, 'width': 210, 'height': 130})
    add_cell(root, "e5_1", "- id: Long\n- enrollmentId: Long\n- attendanceScore: Double\n- midtermScore: Double\n- finalScore: Double\n- totalScore: Double\n- isFinalized: Boolean", STYLE_BCE_ITEM, vertex=True, parent="bce_ent_grd", geometry={'x': 0, 'y': 45, 'width': 210, 'height': 80})

    # Connections between Boundary and Control
    add_cell(root, "e_bc1", "", STYLE_BCE_EDGE, edge=True, source="bce_login_form", target="bce_auth_ctrl", geometry={'relative': 1})
    add_cell(root, "e_bc2", "", STYLE_BCE_EDGE, edge=True, source="bce_enr_view", target="bce_enr_ctrl", geometry={'relative': 1})
    add_cell(root, "e_bc3", "", STYLE_BCE_EDGE, edge=True, source="bce_grd_view", target="bce_grd_ctrl", geometry={'relative': 1})
    add_cell(root, "e_bc4", "", STYLE_BCE_EDGE, edge=True, source="bce_trans_view", target="bce_trans_ctrl", geometry={'relative': 1})

    # Connections between Control and Entity
    add_cell(root, "e_ce1", "", STYLE_BCE_EDGE, edge=True, source="bce_auth_ctrl", target="bce_ent_user", geometry={'relative': 1})
    add_cell(root, "e_ce2_stu", "", STYLE_BCE_EDGE, edge=True, source="bce_enr_ctrl", target="bce_ent_stu", geometry={'relative': 1})
    add_cell(root, "e_ce2_sec", "", STYLE_BCE_EDGE, edge=True, source="bce_enr_ctrl", target="bce_ent_sec", geometry={'relative': 1})
    add_cell(root, "e_ce2_enr", "", STYLE_BCE_EDGE, edge=True, source="bce_enr_ctrl", target="bce_ent_enr", geometry={'relative': 1})
    add_cell(root, "e_ce3_grd", "", STYLE_BCE_EDGE, edge=True, source="bce_grd_ctrl", target="bce_ent_grd", geometry={'relative': 1})
    add_cell(root, "e_ce4_trans", "", STYLE_BCE_EDGE, edge=True, source="bce_trans_ctrl", target="bce_ent_grd", geometry={'relative': 1})

    # Entity Relationships
    add_cell(root, "e_stu_user", "1:1", STYLE_ASSOC_SOLID, edge=True, source="bce_ent_user", target="bce_ent_stu", geometry={'relative': 1})
    add_cell(root, "e_stu_enr", "1..*", STYLE_ASSOC_SOLID, edge=True, source="bce_ent_stu", target="bce_ent_enr", geometry={'relative': 1})
    add_cell(root, "e_sec_enr", "1..*", STYLE_ASSOC_SOLID, edge=True, source="bce_ent_sec", target="bce_ent_enr", geometry={'relative': 1})
    add_cell(root, "e_enr_grd", "1:1", STYLE_ASSOC_SOLID, edge=True, source="bce_ent_enr", target="bce_ent_grd", geometry={'relative': 1})

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

    d1 = ET.SubElement(multi_file, 'diagram', {'id': 'diag_seq', 'name': '2.2.1 Biểu đồ trình tự (Sequence)'})
    d1.append(build_diagram_1_sequence())

    d2 = ET.SubElement(multi_file, 'diagram', {'id': 'diag_act', 'name': '2.2.2 Biểu đồ hoạt động (Activity)'})
    d2.append(build_diagram_2_activity())

    d3 = ET.SubElement(multi_file, 'diagram', {'id': 'diag_bce', 'name': '2.2.3 Biểu đồ lớp phân tích (BCE)'})
    d3.append(build_diagram_3_bce())

    xml_str = ET.tostring(multi_file, encoding='utf-8')
    parsed = minidom.parseString(xml_str)
    pretty_xml = parsed.toprettyxml(indent='  ', encoding='utf-8')

    for path in ['HienThucHoa_UseCase_Realizations.drawio', 'docs/HienThucHoa_UseCase_Realizations.drawio']:
        with open(path, 'wb') as f:
            f.write(pretty_xml)
        print(f"Saved multi-page: {path}")

    # 2. Individual diagram files
    save_single_diagram('1_BieuDo_TrinhTu_Sequence.drawio', 'diag_seq', '2.2.1 Biểu đồ trình tự', build_diagram_1_sequence)
    save_single_diagram('2_BieuDo_HoatDong_Activity.drawio', 'diag_act', '2.2.2 Biểu đồ hoạt động', build_diagram_2_activity)
    save_single_diagram('3_BieuDo_LopPhanTich_BCE.drawio', 'diag_bce', '2.2.3 Biểu đồ lớp phân tích BCE', build_diagram_3_bce)

if __name__ == '__main__':
    main()
