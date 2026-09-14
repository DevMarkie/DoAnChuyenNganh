# -*- coding: utf-8 -*-
"""
Biểu đồ Lớp Phân tích (Analysis Class Diagram - BCE) chuẩn UML theo kiến trúc
Business Component (Boundary - Control - Entity) chuẩn mực:
Mỗi chức năng (Use Case) được mô hình hóa riêng biệt thành 1 Tab chuyên biệt (không gộp lại),
gồm thẻ Business Component chuẩn kiến trúc:
📦 Business Component (e.g. "users")
[ |--O boundary ] → [ ↻ control ] → [ _O entity ]
kèm theo các lớp phân tích chi tiết (Giao diện, Điều khiển, Thực thể), kiểu dữ liệu chuẩn UML (int, String, boolean, double, Date, List, void...).
"""

import os
import sys
import xml.etree.ElementTree as ET
import xml.dom.minidom as minidom

sys.stdout.reconfigure(encoding='utf-8')

def add_cell(root, cid, value="", style="", vertex=False, edge=False, parent="1", source=None, target=None, geometry=None):
    attribs = {'id': str(cid)}
    if str(cid) == "0":
        return ET.SubElement(root, 'mxCell', attribs)
    elif str(cid) == "1":
        attribs['parent'] = '0'
        return ET.SubElement(root, 'mxCell', attribs)

    if value != "":
        attribs['value'] = str(value)
    if style:
        attribs['style'] = str(style)
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

# --- ACADEMIC UML BLACK & WHITE STYLES (TRẮNG ĐEN 100%, KHÔNG MÀU) ---
STYLE_TITLE = "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontStyle=1;fontSize=15;fontFamily=Helvetica,Arial,sans-serif;fontColor=#000000;"
STYLE_SUBTITLE = "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontStyle=0;fontSize=12;fontFamily=Helvetica,Arial,sans-serif;fontColor=#444444;"
STYLE_ACTOR = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fontStyle=1;fontSize=12;fontFamily=Helvetica,Arial,sans-serif;fontColor=#000000;strokeColor=#000000;fillColor=#ffffff;strokeWidth=1.5;"

# Column Header Cards (Thẻ tiêu đề phân tầng chuẩn UML BCE, có icon phân tầng)
STYLE_HDR_BND = "rounded=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.5;fontColor=#000000;fontFamily=Helvetica,Arial,sans-serif;align=center;verticalAlign=middle;html=1;spacingLeft=30;"
STYLE_HDR_CTRL = "rounded=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.5;fontColor=#000000;fontFamily=Helvetica,Arial,sans-serif;align=center;verticalAlign=middle;html=1;spacingLeft=30;"
STYLE_HDR_ENT = "rounded=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.5;fontColor=#000000;fontFamily=Helvetica,Arial,sans-serif;align=center;verticalAlign=middle;html=1;spacingLeft=30;"

# Icons phân tầng BCE
STYLE_ICON_BND = "shape=umlBoundary;whiteSpace=wrap;html=1;strokeColor=#000000;strokeWidth=1.5;fillColor=#ffffff;"
STYLE_ICON_CTRL = "shape=umlControl;whiteSpace=wrap;html=1;strokeColor=#000000;strokeWidth=1.5;fillColor=#ffffff;"
STYLE_ICON_ENT = "shape=umlEntity;whiteSpace=wrap;html=1;strokeColor=#000000;strokeWidth=1.5;fillColor=#ffffff;"

STYLE_FLOW_ARROW = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=block;endFill=1;strokeColor=#000000;strokeWidth=1.5;fillColor=none;"

# Class Boxes (Academic UML Monochrome 3-compartment class)
STYLE_CLASS_BND = "swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=44;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=0;marginBottom=0;html=1;strokeColor=#000000;strokeWidth=1.5;fillColor=#ffffff;fontColor=#000000;fontFamily=Helvetica,Arial,sans-serif;fontSize=12;rounded=1;arcSize=6;"
STYLE_CLASS_CTRL = "swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=44;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=0;marginBottom=0;html=1;strokeColor=#000000;strokeWidth=1.5;fillColor=#ffffff;fontColor=#000000;fontFamily=Helvetica,Arial,sans-serif;fontSize=12;rounded=1;arcSize=6;"
STYLE_CLASS_ENT = "swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=44;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=0;marginBottom=0;html=1;strokeColor=#000000;strokeWidth=1.5;fillColor=#ffffff;fontColor=#000000;fontFamily=Helvetica,Arial,sans-serif;fontSize=12;rounded=1;arcSize=6;"
STYLE_CLASS_DTO = "swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=44;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=0;marginBottom=0;html=1;strokeColor=#000000;strokeWidth=1.5;fillColor=#ffffff;fontColor=#000000;fontFamily=Helvetica,Arial,sans-serif;fontSize=12;rounded=1;arcSize=6;"

STYLE_ITEM_ATTR = "text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=10;spacingRight=8;spacingTop=4;spacingBottom=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;html=1;fontSize=11;fontColor=#000000;fontFamily=Helvetica,Arial,sans-serif;"
STYLE_ITEM_METHOD = "text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=10;spacingRight=8;spacingTop=4;spacingBottom=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;html=1;fontSize=11;fontColor=#000000;fontFamily=Helvetica,Arial,sans-serif;"
STYLE_DIVIDER = "line;strokeWidth=1;fillColor=none;align=left;verticalAlign=middle;spacingTop=-1;spacingLeft=3;spacingRight=3;rotatable=0;portConstraint=eastwest;strokeColor=#000000;"

STYLE_ASSOC = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=none;strokeWidth=1.5;strokeColor=#000000;labelBackgroundColor=#ffffff;labelBorderColor=none;fillColor=none;fontColor=#000000;fontSize=10;fontStyle=1;fontFamily=Helvetica,Arial,sans-serif;"
STYLE_CALL_ARROW = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=open;dashed=1;strokeColor=#000000;strokeWidth=1.5;labelBackgroundColor=#ffffff;labelBorderColor=none;fillColor=none;fontColor=#000000;fontSize=10;fontStyle=1;fontFamily=Helvetica,Arial,sans-serif;"
STYLE_DATA_ARROW = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=open;dashed=1;strokeColor=#000000;strokeWidth=1.5;labelBackgroundColor=#ffffff;labelBorderColor=none;fillColor=none;fontColor=#000000;fontSize=10;fontStyle=1;fontFamily=Helvetica,Arial,sans-serif;"

def create_base_model(page_w=1460, page_h=980):
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': str(page_w), 'pageHeight': str(page_h), 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")
    return model, root

def calc_class_height(attrs, methods, w=340):
    chars_per_line = int((w - 24) / 6.2)  # ~51 ký tự mỗi dòng
    num_attr_lines = 0
    if attrs:
        for a in attrs:
            num_attr_lines += max(1, (len(a) + chars_per_line - 1) // chars_per_line)
        attr_h = max(30, num_attr_lines * 18 + 12)
    else:
        attr_h = 26

    num_meth_lines = 0
    if methods:
        for m in methods:
            num_meth_lines += max(1, (len(m) + chars_per_line - 1) // chars_per_line)
        method_h = max(30, num_meth_lines * 18 + 12)
    else:
        method_h = 26

    header_h = 44
    divider_h = 4
    total_h = header_h + attr_h + divider_h + method_h
    return total_h, attr_h, method_h

def add_class_box(root, cid, stereotype, name, x, y, w, attrs, methods):
    st_lower = stereotype.lower()
    if 'giao' in st_lower or 'bound' in st_lower:
        style_box = STYLE_CLASS_BND
        st_vn = "Giao diện"
    elif 'điều' in st_lower or 'dieu' in st_lower or 'control' in st_lower:
        style_box = STYLE_CLASS_CTRL
        st_vn = "Điều khiển"
    elif 'truyền' in st_lower or 'truyen' in st_lower or 'dto' in st_lower:
        style_box = STYLE_CLASS_DTO
        st_vn = "Truyền dữ liệu"
    else:
        style_box = STYLE_CLASS_ENT
        st_vn = "Thực thể"

    total_h, attr_h, method_h = calc_class_height(attrs, methods, w)

    attr_text = "\n".join(attrs) if attrs else "(không có thuộc tính)"
    method_text = "\n".join(methods) if methods else "(không có phương thức)"
    header_val = f"<i>«{st_vn}»</i><br><b>{name}</b>"

    add_cell(root, cid, header_val, style_box, vertex=True, geometry={'x': x, 'y': y, 'width': w, 'height': total_h})
    add_cell(root, f"{cid}_attrs", attr_text, STYLE_ITEM_ATTR, vertex=True, parent=cid, geometry={'x': 0, 'y': 44, 'width': w, 'height': attr_h})
    add_cell(root, f"{cid}_div", "", STYLE_DIVIDER, vertex=True, parent=cid, geometry={'x': 0, 'y': 44 + attr_h, 'width': w, 'height': 4})
    add_cell(root, f"{cid}_methods", method_text, STYLE_ITEM_METHOD, vertex=True, parent=cid, geometry={'x': 0, 'y': 48 + attr_h, 'width': w, 'height': method_h})
    return total_h

def build_single_function_tab(func_code, func_title, comp_title, comp_example, actor_name,
                             bnd_classes, ctrl_classes, ent_classes, edges):
    """
    Xây dựng biểu đồ lớp phân tích BCE tối ưu hóa thẩm mỹ và tính học thuật:
    - Bỏ hoàn toàn bảng bao ngoài cồng kềnh (No outer container table/box).
    - 3 Cột định hướng phân tầng rõ nét với Icon biểu tượng UML BCE chính quy.
    - Trục ngang Row 2 (y = 400) khóa cứng [Controller] -> [Service] -> [Entity] giúp mũi tên đi ngang 100% thẳng thớm.
    - Trục dọc phụ Row 3 (y = 640) và Row 4 (y = 840) thông thoáng, nhãn nền trắng rõ nét.
    """
    page_h = 1040 if len(ent_classes) >= 3 else (920 if len(ctrl_classes) > 1 or len(ent_classes) > 1 else 840)
    model, root = create_base_model(1460, page_h)

    # 1. Tiêu đề trang chuẩn học thuật (Title & Subtitle)
    add_cell(root, "t_main", f"BIỂU ĐỒ LỚP PHÂN TÍCH (BCE) - CHỨC NĂNG: {func_title}", STYLE_TITLE, vertex=True,
             geometry={'x': 40, 'y': 20, 'width': 980, 'height': 25})
    add_cell(root, "st_main", "Kiến trúc phân tầng: Tác nhân ──> «Giao diện» (Boundary) ──> «Điều khiển» (Control) ──> «Thực thể» (Entity)",
             STYLE_SUBTITLE, vertex=True, geometry={'x': 40, 'y': 48, 'width': 1080, 'height': 20})

    # 2. Thẻ tiêu đề 3 Cột tích hợp Icon UML BCE chính quy (Không dùng bảng bao bọc)
    # Cột 1: Giao diện (x = 160, w = 340)
    bnd_hdr_id = f"hdr_bnd_{func_code}"
    add_cell(root, bnd_hdr_id, "<b>«Boundary» GIAO DIỆN</b><br><span style=\"font-size:10px;font-weight:normal;color:#444444;\">(Client UI &amp; REST API Endpoints)</span>",
             STYLE_HDR_BND, vertex=True, geometry={'x': 160, 'y': 78, 'width': 340, 'height': 42})
    add_cell(root, f"icon_bnd_{func_code}", "", STYLE_ICON_BND, vertex=True,
             geometry={'x': 172, 'y': 84, 'width': 30, 'height': 30})

    # Cột 2: Điều khiển (x = 600, w = 340)
    ctrl_hdr_id = f"hdr_ctrl_{func_code}"
    add_cell(root, ctrl_hdr_id, "<b>«Control» ĐIỀU KHIỂN</b><br><span style=\"font-size:10px;font-weight:normal;color:#444444;\">(Business Logic &amp; Security Services)</span>",
             STYLE_HDR_CTRL, vertex=True, geometry={'x': 600, 'y': 78, 'width': 340, 'height': 42})
    add_cell(root, f"icon_ctrl_{func_code}", "", STYLE_ICON_CTRL, vertex=True,
             geometry={'x': 612, 'y': 84, 'width': 30, 'height': 30})

    # Cột 3: Thực thể (x = 1040, w = 340)
    ent_hdr_id = f"hdr_ent_{func_code}"
    add_cell(root, ent_hdr_id, "<b>«Entity» THỰC THỂ</b><br><span style=\"font-size:10px;font-weight:normal;color:#444444;\">(Domain Entities, Tables &amp; DTOs)</span>",
             STYLE_HDR_ENT, vertex=True, geometry={'x': 1040, 'y': 78, 'width': 340, 'height': 42})
    add_cell(root, f"icon_ent_{func_code}", "", STYLE_ICON_ENT, vertex=True,
             geometry={'x': 1052, 'y': 84, 'width': 30, 'height': 30})

    # Mũi tên tiến trình trực giao giữa 3 thẻ tiêu đề phân tầng
    add_cell(root, f"flow_hdr1_{func_code}", "", STYLE_FLOW_ARROW, edge=True, source=bnd_hdr_id, target=ctrl_hdr_id)
    add_cell(root, f"flow_hdr2_{func_code}", "", STYLE_FLOW_ARROW, edge=True, source=ctrl_hdr_id, target=ent_hdr_id)

    # 3. Phân bổ các lớp Giao diện (Column 1: x = 160, w = 340)
    # bnd_1: Giao diện Client (Form / Modal / Page) đặt tại Row 1 (y = 145)
    # bnd_2: Giao diện REST Controller đặt tại Row 2 (y = 400)
    bnd_ids = []
    if len(bnd_classes) > 0:
        cid1 = f"bnd_{func_code}_1"
        bnd_ids.append(cid1)
        add_class_box(root, cid1, bnd_classes[0].get('stereo', 'Giao diện'), bnd_classes[0]['name'],
                      160, 145, 340, bnd_classes[0].get('attrs', []), bnd_classes[0].get('methods', []))

    if len(bnd_classes) > 1:
        cid2 = f"bnd_{func_code}_2"
        bnd_ids.append(cid2)
        add_class_box(root, cid2, bnd_classes[1].get('stereo', 'Giao diện'), bnd_classes[1]['name'],
                      160, 400, 340, bnd_classes[1].get('attrs', []), bnd_classes[1].get('methods', []))

    # 4. Tác nhân (Actor): Đặt bên trái, thẳng hàng ngang với bnd_1
    act_id = f"act_{func_code}"
    add_cell(root, act_id, actor_name, STYLE_ACTOR, vertex=True,
             geometry={'x': 40, 'y': 185, 'width': 60, 'height': 90})
    if bnd_ids:
        add_cell(root, f"e_act_{func_code}", "tương tác", STYLE_ASSOC, edge=True, source=act_id, target=bnd_ids[0])

    # 5. Phân bổ các lớp Điều khiển (Column 2: x = 600, w = 340)
    # ctrl_1: Dịch vụ nghiệp vụ chính (Service) đặt tại Row 2 (y = 400) - CÙNG TỌA ĐỘ Y VỚI bnd_2
    # ctrl_2 (nếu có): Đặt tại Row 3 (y = 640)
    ctrl_ids = []
    if len(ctrl_classes) > 0:
        cid1 = f"ctrl_{func_code}_1"
        ctrl_ids.append(cid1)
        add_class_box(root, cid1, ctrl_classes[0].get('stereo', 'Điều khiển'), ctrl_classes[0]['name'],
                      600, 400, 340, ctrl_classes[0].get('attrs', []), ctrl_classes[0].get('methods', []))

    if len(ctrl_classes) > 1:
        cid2 = f"ctrl_{func_code}_2"
        ctrl_ids.append(cid2)
        add_class_box(root, cid2, ctrl_classes[1].get('stereo', 'Điều khiển'), ctrl_classes[1]['name'],
                      600, 640, 340, ctrl_classes[1].get('attrs', []), ctrl_classes[1].get('methods', []))

    # 6. Phân bổ các lớp Thực thể (Column 3: x = 1040, w = 340)
    # ent_1: Thực thể chính / DTO đặt tại Row 2 (y = 400) - CÙNG TỌA ĐỘ Y VỚI ctrl_1
    # ent_2 (nếu có): Đặt tại Row 3 (y = 640)
    # ent_3 (nếu có): Đặt tại Row 4 (y = 840)
    ent_ids = []
    ent_y_positions = [400, 640, 840]
    for i, cls in enumerate(ent_classes):
        cid = f"ent_{func_code}_{i+1}"
        ent_ids.append(cid)
        y_pos = ent_y_positions[i] if i < len(ent_y_positions) else 400 + i * 220
        add_class_box(root, cid, cls.get('stereo', 'Thực thể'), cls['name'],
                      1040, y_pos, 340, cls.get('attrs', []), cls.get('methods', []))

    # 7. Các đường liên kết nghiệp vụ giữa các lớp (Orthogonal, nhãn nền trắng không đè chữ)
    for i, edge in enumerate(edges):
        src, tgt, lbl, is_data = edge
        style = STYLE_DATA_ARROW if is_data else STYLE_CALL_ARROW
        add_cell(root, f"edge_{func_code}_{i+1}", lbl, style, edge=True, source=src, target=tgt)

    return model


# ==========================================================
# 16 CHỨC NĂNG RIÊNG BIỆT (KHÔNG GỘP LẠI)
# ==========================================================

# 1. Đăng nhập hệ thống
def build_bce_1_login():
    return build_single_function_tab(
        func_code="login",
        func_title="ĐĂNG NHẬP HỆ THỐNG",
        comp_title="Xác thực & Đăng nhập",
        comp_example="auth_login",
        actor_name="Người dùng",
        bnd_classes=[
            {
                'name': "LoginForm", 'stereo': "Giao diện",
                'attrs': ["- txtTenDangNhap: String", "- txtMatKhau: String", "- btnDangNhap: Button"],
                'methods': ["+ guiYeuCauDangNhap(): void", "+ hienThiLoi(thongBao): void", "+ luuTokenVaDieuHuong(): void"]
            },
            {
                'name': "AuthController", 'stereo': "Giao diện",
                'attrs': ["- path: POST /api/auth/login", "- authService: AuthService"],
                'methods': ["+ dangNhap(thongTin: LoginRequest): ResponseEntity"]
            }
        ],
        ctrl_classes=[
            {
                'name': "AuthService", 'stereo': "Điều khiển",
                'attrs': ["- authManager: AuthenticationManager", "- jwtUtil: JwtTokenUtil", "- userRepo: UserRepository"],
                'methods': ["+ xacThucTaiKhoan(ten, mk): LoginResponse", "+ taoTokenTruyCap(user): String", "+ kiemTraHoatDong(user): boolean"]
            },
            {
                'name': "AuthenticationManager", 'stereo': "Điều khiển",
                'attrs': ["- userDetailsService: CustomUserDetailsService"],
                'methods': ["+ authenticate(auth): Authentication"]
            }
        ],
        ent_classes=[
            {
                'name': "User (Bảng users)", 'stereo': "Thực thể",
                'attrs': ["- id: int", "- username: String", "- password: String (mã hóa)", "- email: String", "- enabled: boolean"],
                'methods': ["+ layDanhSachQuyen(): Set<Role>", "+ dangHoatDong(): boolean"]
            },
            {
                'name': "Role (Bảng roles)", 'stereo': "Thực thể",
                'attrs': ["- id: int", "- name: String (ROLE_ADMIN, ...)"],
                'methods': ["+ layTenVaiTro(): String"]
            }
        ],
        edges=[
            ("bnd_login_1", "bnd_login_2", "gọi REST API", False),
            ("bnd_login_2", "ctrl_login_1", "chuyển xử lý", False),
            ("ctrl_login_1", "ctrl_login_2", "ủy quyền kiểm tra", False),
            ("ctrl_login_1", "ent_login_1", "truy vấn thông tin", True),
            ("ent_login_1", "ent_login_2", "phân quyền", False)
        ]
    )

# 2. Đổi mật khẩu tài khoản
def build_bce_2_change_password():
    return build_single_function_tab(
        func_code="changepwd",
        func_title="ĐỔI MẬT KHẨU TÀI KHOẢN",
        comp_title="Đổi mật khẩu người dùng",
        comp_example="auth_password",
        actor_name="Người dùng",
        bnd_classes=[
            {
                'name': "ChangePasswordModal", 'stereo': "Giao diện",
                'attrs': ["- matKhauHienTai: String", "- matKhauMoi: String", "- xacNhanMatKhau: String"],
                'methods': ["+ guiYeuCauDoiMK(): void", "+ kiemTraKhopMatKhau(): boolean", "+ thongBaoThanhCong(): void"]
            },
            {
                'name': "AuthController", 'stereo': "Giao diện",
                'attrs': ["- path: POST /api/auth/change-password"],
                'methods': ["+ doiMatKhau(req: ChangePasswordReq): ResponseEntity"]
            }
        ],
        ctrl_classes=[
            {
                'name': "AuthService", 'stereo': "Điều khiển",
                'attrs': ["- passwordEncoder: PasswordEncoder", "- userRepo: UserRepository"],
                'methods': ["+ doiMatKhau(userId, mkCu, mkMoi): boolean", "+ kiemTraMatKhauGoc(raw, enc): boolean"]
            },
            {
                'name': "PasswordEncoder", 'stereo': "Điều khiển",
                'attrs': ["- thuatToan: BCryptPasswordEncoder"],
                'methods': ["+ matches(raw, encoded): boolean", "+ encode(newRaw): String"]
            }
        ],
        ent_classes=[
            {
                'name': "User (Bảng users)", 'stereo': "Thực thể",
                'attrs': ["- id: int", "- username: String", "- password: String (mật khẩu mới đã băm)"],
                'methods': ["+ capNhatMatKhau(mkMoi): void"]
            }
        ],
        edges=[
            ("bnd_changepwd_1", "bnd_changepwd_2", "gửi form", False),
            ("bnd_changepwd_2", "ctrl_changepwd_1", "gọi nghiệp vụ", False),
            ("ctrl_changepwd_1", "ctrl_changepwd_2", "băm mật khẩu", False),
            ("ctrl_changepwd_1", "ent_changepwd_1", "cập nhật mật khẩu", True)
        ]
    )

# 3. Thêm mới Sinh viên & Cấp tài khoản
def build_bce_3_student_create():
    return build_single_function_tab(
        func_code="stu_create",
        func_title="THÊM MỚI SINH VIÊN & CẤP TÀI KHOẢN",
        comp_title="Thêm mới Sinh viên",
        comp_example="students_create",
        actor_name="Quản trị viên",
        bnd_classes=[
            {
                'name': "StudentFormModal", 'stereo': "Giao diện",
                'attrs': ["- maSinhVien: String", "- hoVaTen: String", "- ngaySinh: Date", "- gioiTinh: String", "- email: String", "- maLopSinhHoat: int"],
                'methods': ["+ kiemTraHopLe(): boolean", "+ guiLuuThongTin(): void", "+ hienThiLoi(msg): void"]
            },
            {
                'name': "StudentController", 'stereo': "Giao diện",
                'attrs': ["- path: POST /api/students"],
                'methods': ["+ themMoiSinhVien(req: StudentReq): ResponseEntity"]
            }
        ],
        ctrl_classes=[
            {
                'name': "StudentService", 'stereo': "Điều khiển",
                'attrs': ["- studentRepo: StudentRepository", "- userRepo: UserRepository", "- passwordEncoder: PasswordEncoder"],
                'methods': ["+ taoMoiSinhVien(req): Student", "+ kiemTraTrungMaVaEmail(ma, email): boolean", "+ taoTaiKhoanTuDong(maSV, email): User"]
            }
        ],
        ent_classes=[
            {
                'name': "Student (Bảng students)", 'stereo': "Thực thể",
                'attrs': ["- id: int", "- studentCode: String", "- fullName: String", "- dob: Date", "- email: String", "- status: String (Đang học)", "- classEntity: ClassEntity", "- user: User"],
                'methods': ["+ layHoTen(): String"]
            },
            {
                'name': "User (Bảng users)", 'stereo': "Thực thể",
                'attrs': ["- id: int", "- username: String (mã SV)", "- password: String (BCrypt)", "- enabled: boolean"],
                'methods': ["+ layTenDangNhap(): String"]
            },
            {
                'name': "ClassEntity (Bảng classes)", 'stereo': "Thực thể",
                'attrs': ["- id: int", "- className: String", "- academicYear: String"],
                'methods': ["+ layTenLop(): String"]
            }
        ],
        edges=[
            ("bnd_stu_create_1", "bnd_stu_create_2", "gửi dữ liệu form", False),
            ("bnd_stu_create_2", "ctrl_stu_create_1", "gọi nghiệp vụ", False),
            ("ctrl_stu_create_1", "ent_stu_create_1", "lưu sinh viên", True),
            ("ctrl_stu_create_1", "ent_stu_create_2", "sinh tài khoản", True),
            ("ent_stu_create_1", "ent_stu_create_3", "thuộc lớp", False)
        ]
    )

# 4. Cập nhật hồ sơ & Trạng thái Sinh viên
def build_bce_4_student_manage():
    return build_single_function_tab(
        func_code="stu_manage",
        func_title="CẬP NHẬT HỒ SƠ & TRẠNG THÁI SINH VIÊN",
        comp_title="Quản lý hồ sơ Sinh viên",
        comp_example="students_manage",
        actor_name="Quản trị viên",
        bnd_classes=[
            {
                'name': "StudentsPageView", 'stereo': "Giao diện",
                'attrs': ["- tuKhoaTimKiem: String", "- lopDaChonId: int", "- danhSachSV: List<Student>"],
                'methods': ["+ taiDanhSach(): void", "+ timKiem(tuKhoa): void", "+ doiTrangThaiSV(id, status): void"]
            },
            {
                'name': "StudentController", 'stereo': "Giao diện",
                'attrs': ["- path: PUT /api/students/{id}", "- path: PATCH /api/students/{id}/status"],
                'methods': ["+ capNhatSinhVien(id, req): ResponseEntity", "+ capNhatTrangThai(id, status): ResponseEntity"]
            }
        ],
        ctrl_classes=[
            {
                'name': "StudentService", 'stereo': "Điều khiển",
                'attrs': ["- studentRepo: StudentRepository"],
                'methods': ["+ timKiem(keyword, classId): List<Student>", "+ capNhat(id, req): Student", "+ doiTrangThai(id, newStatus): boolean"]
            }
        ],
        ent_classes=[
            {
                'name': "Student (Bảng students)", 'stereo': "Thực thể",
                'attrs': ["- id: int", "- studentCode: String", "- fullName: String", "- email: String", "- status: String (Đang học / Tốt nghiệp / Đình chỉ)"],
                'methods': ["+ capNhatTrangThai(status): void", "+ layThongTinChiTiet(): String"]
            }
        ],
        edges=[
            ("bnd_stu_manage_1", "bnd_stu_manage_2", "gọi cập nhật", False),
            ("bnd_stu_manage_2", "ctrl_stu_manage_1", "thực hiện", False),
            ("ctrl_stu_manage_1", "ent_stu_manage_1", "cập nhật trạng thái", True)
        ]
    )

# 5. Quản lý Khoa đào tạo & Lớp sinh hoạt
def build_bce_5_academic_structure():
    return build_single_function_tab(
        func_code="academic",
        func_title="QUẢN LÝ KHOA ĐÀO TẠO & LỚP SINH HOẠT",
        comp_title="Cơ cấu Khoa & Lớp sinh hoạt",
        comp_example="departments_classes",
        actor_name="Quản trị viên",
        bnd_classes=[
            {
                'name': "DepartmentsPageView & ClassesPageView", 'stereo': "Giao diện",
                'attrs': ["- danhSachKhoa: List<Department>", "- danhSachLop: List<ClassEntity>", "- khoaChonId: int"],
                'methods': ["+ taiDanhSachKhoa(): void", "+ themKhoaMoi(): void", "+ taiDanhSachLop(): void", "+ themLopMoi(): void"]
            },
            {
                'name': "DepartmentController & ClassController", 'stereo': "Giao diện",
                'attrs': ["- path: /api/departments", "- path: /api/classes"],
                'methods': ["+ layTatCaKhoa(): ResponseEntity", "+ themLop(req: ClassReq): ResponseEntity"]
            }
        ],
        ctrl_classes=[
            {
                'name': "AcademicService", 'stereo': "Điều khiển",
                'attrs': ["- deptRepo: DepartmentRepository", "- classRepo: ClassRepository"],
                'methods': ["+ layDanhSachKhoa(): List<Department>", "+ themKhoa(ma, ten): Department", "+ themLop(tenLop, nienKhoa, deptId): ClassEntity"]
            }
        ],
        ent_classes=[
            {
                'name': "Department (Bảng departments)", 'stereo': "Thực thể",
                'attrs': ["- id: int", "- deptCode: String", "- deptName: String"],
                'methods': ["+ layTenKhoa(): String"]
            },
            {
                'name': "ClassEntity (Bảng classes)", 'stereo': "Thực thể",
                'attrs': ["- id: int", "- className: String", "- academicYear: String", "- department: Department"],
                'methods': ["+ layTenLop(): String"]
            }
        ],
        edges=[
            ("bnd_academic_1", "bnd_academic_2", "truy vấn/thêm mới", False),
            ("bnd_academic_2", "ctrl_academic_1", "gọi nghiệp vụ", False),
            ("ctrl_academic_1", "ent_academic_1", "lưu Khoa", True),
            ("ctrl_academic_1", "ent_academic_2", "lưu Lớp", True),
            ("ent_academic_2", "ent_academic_1", "thuộc Khoa", False)
        ]
    )

# 6. Quản lý Giảng viên & Phân công
def build_bce_6_lecturers():
    return build_single_function_tab(
        func_code="lecturers",
        func_title="QUẢN LÝ HỒ SƠ GIẢNG VIÊN",
        comp_title="Quản lý Giảng viên",
        comp_example="lecturers",
        actor_name="Quản trị viên",
        bnd_classes=[
            {
                'name': "LecturersPageView", 'stereo': "Giao diện",
                'attrs': ["- danhSachGiangVien: List<Lecturer>", "- khoaBoMonId: int"],
                'methods': ["+ taiDanhSachGiangVien(): void", "+ moModalThemGiangVien(): void", "+ capNhatHocHamHocVi(): void"]
            },
            {
                'name': "LecturerController", 'stereo': "Giao diện",
                'attrs': ["- path: /api/lecturers"],
                'methods': ["+ layTatCaGiangVien(): ResponseEntity", "+ themGiangVien(req: LecturerReq): ResponseEntity"]
            }
        ],
        ctrl_classes=[
            {
                'name': "LecturerService", 'stereo': "Điều khiển",
                'attrs': ["- lecturerRepo: LecturerRepository", "- userRepo: UserRepository", "- passwordEncoder: PasswordEncoder"],
                'methods': ["+ layTatCa(): List<Lecturer>", "+ themGiangVien(req): Lecturer", "+ taoTaiKhoanGiangVien(gv, email): User"]
            }
        ],
        ent_classes=[
            {
                'name': "Lecturer (Bảng lecturers)", 'stereo': "Thực thể",
                'attrs': ["- id: int", "- lecturerCode: String", "- fullName: String", "- email: String", "- degree: String (ThS/TS/PGS)", "- department: Department", "- user: User"],
                'methods': ["+ layHoTen(): String", "+ layHocVi(): String"]
            }
        ],
        edges=[
            ("bnd_lecturers_1", "bnd_lecturers_2", "thêm/sửa GV", False),
            ("bnd_lecturers_2", "ctrl_lecturers_1", "gọi nghiệp vụ", False),
            ("ctrl_lecturers_1", "ent_lecturers_1", "lưu Giảng viên", True)
        ]
    )

# 7. Quản lý Môn học & Chương trình đào tạo
def build_bce_7_subjects():
    return build_single_function_tab(
        func_code="subjects",
        func_title="QUẢN LÝ MÔN HỌC & CHƯƠNG TRÌNH",
        comp_title="Quản lý Môn học",
        comp_example="subjects",
        actor_name="Quản trị viên",
        bnd_classes=[
            {
                'name': "SubjectsPageView", 'stereo': "Giao diện",
                'attrs': ["- danhSachMon: List<Subject>", "- tuKhoaTimKiem: String", "- khoaFilter: int"],
                'methods': ["+ taiDanhSachMon(): void", "+ onSearch(): void", "+ onSaveSubject(): void"]
            },
            {
                'name': "SubjectController", 'stereo': "Giao diện",
                'attrs': ["- path: /api/subjects"],
                'methods': ["+ layTatCaMonHoc(): ResponseEntity", "+ themMonHoc(req: SubjectReq): ResponseEntity"]
            }
        ],
        ctrl_classes=[
            {
                'name': "SubjectService", 'stereo': "Điều khiển",
                'attrs': ["- subjectRepo: SubjectRepository", "- deptRepo: DepartmentRepository"],
                'methods': ["+ layTatCa(): List<Subject>", "+ themMonHoc(req): Subject", "+ kiemTraTrungMaMon(code): boolean"]
            }
        ],
        ent_classes=[
            {
                'name': "Subject (Bảng subjects)", 'stereo': "Thực thể",
                'attrs': ["- id: int", "- subjectCode: String", "- subjectName: String", "- credits: int (1..6)", "- department: Department"],
                'methods': ["+ laySoTinChi(): int", "+ layTenMon(): String"]
            }
        ],
        edges=[
            ("bnd_subjects_1", "bnd_subjects_2", "lưu môn học", False),
            ("bnd_subjects_2", "ctrl_subjects_1", "xử lý nghiệp vụ", False),
            ("ctrl_subjects_1", "ent_subjects_1", "lưu thực thể", True)
        ]
    )

# 8. Cấu hình Học kỳ & Thời hạn ĐKHP
def build_bce_8_semesters():
    return build_single_function_tab(
        func_code="semesters",
        func_title="CẤU HÌNH HỌC KỲ & THỜI HẠN ĐKHP",
        comp_title="Cấu hình Học kỳ",
        comp_example="semesters",
        actor_name="Quản trị viên",
        bnd_classes=[
            {
                'name': "SemestersPageView", 'stereo': "Giao diện",
                'attrs': ["- danhSachHocKy: List<Semester>", "- hocKyHienTai: Semester"],
                'methods': ["+ taiDanhSachHocKy(): void", "+ themMoiHocKy(): void", "+ kichHoatHocKy(id): void"]
            },
            {
                'name': "SemesterController", 'stereo': "Giao diện",
                'attrs': ["- path: /api/semesters"],
                'methods': ["+ layTatCaHocKy(): ResponseEntity", "+ activateSemester(id): ResponseEntity"]
            }
        ],
        ctrl_classes=[
            {
                'name': "SemesterService", 'stereo': "Điều khiển",
                'attrs': ["- semesterRepo: SemesterRepository"],
                'methods': ["+ layTatCa(): List<Semester>", "+ themHocKy(req): Semester", "+ setHocKyHienTai(id): boolean", "+ layHocKyDangMoDK(): Semester"]
            }
        ],
        ent_classes=[
            {
                'name': "Semester (Bảng semesters)", 'stereo': "Thực thể",
                'attrs': ["- id: int", "- semesterName: String", "- academicYear: String", "- startDate: Date", "- endDate: Date", "- regStartDate: Date", "- regEndDate: Date", "- active: boolean"],
                'methods': ["+ trongHanDangKy(): boolean", "+ dangHoatDong(): boolean"]
            }
        ],
        edges=[
            ("bnd_semesters_1", "bnd_semesters_2", "thao tác cấu hình", False),
            ("bnd_semesters_2", "ctrl_semesters_1", "gọi nghiệp vụ", False),
            ("ctrl_semesters_1", "ent_semesters_1", "lưu Học kỳ", True)
        ]
    )

# 9. Mở mới Lớp học phần
def build_bce_9_course_sections():
    return build_single_function_tab(
        func_code="sections",
        func_title="MỞ MỚI LỚP HỌC PHẦN",
        comp_title="Mở lớp Học phần",
        comp_example="course_sections",
        actor_name="Quản trị viên",
        bnd_classes=[
            {
                'name': "CourseSectionsPageView", 'stereo': "Giao diện",
                'attrs': ["- hocKyId: int", "- monHocId: int", "- danhSachLopHP: List<CourseSection>"],
                'methods': ["+ taiDanhSachLopHP(): void", "+ moModalThemLopHP(): void", "+ dongMoLopHP(id, status): void"]
            },
            {
                'name': "CourseSectionController", 'stereo': "Giao diện",
                'attrs': ["- path: /api/sections"],
                'methods': ["+ layDanhSachLop(): ResponseEntity", "+ createSection(req: SectionReq): ResponseEntity"]
            }
        ],
        ctrl_classes=[
            {
                'name': "CourseSectionService", 'stereo': "Điều khiển",
                'attrs': ["- sectionRepo: CourseSectionRepository", "- subjectRepo: SubjectRepository"],
                'methods': ["+ moLopHocPhan(req): CourseSection", "+ capNhatSiSoToiDa(id, cap): CourseSection", "+ dongMoLop(id, status): boolean"]
            }
        ],
        ent_classes=[
            {
                'name': "CourseSection (Bảng course_sections)", 'stereo': "Thực thể",
                'attrs': ["- id: int", "- sectionCode: String", "- subject: Subject", "- semester: Semester", "- lecturer: Lecturer", "- maxCapacity: int", "- currentEnrolled: int (0)", "- status: String (OPEN)"],
                'methods': ["+ conChoTrong(): boolean", "+ laySiSoHienTai(): int"]
            }
        ],
        edges=[
            ("bnd_sections_1", "bnd_sections_2", "mở lớp", False),
            ("bnd_sections_2", "ctrl_sections_1", "xử lý nghiệp vụ", False),
            ("ctrl_sections_1", "ent_sections_1", "lưu Lớp học phần", True)
        ]
    )

# 10. Xếp Thời khóa biểu & Trùng lịch
def build_bce_10_scheduling():
    return build_single_function_tab(
        func_code="scheduling",
        func_title="XẾP THỜI KHÓA BIỂU & TRÙNG LỊCH",
        comp_title="Xếp Thời khóa biểu",
        comp_example="scheduling",
        actor_name="Quản trị viên",
        bnd_classes=[
            {
                'name': "SectionScheduleModal", 'stereo': "Giao diện",
                'attrs': ["- maLopHP: int", "- thuTrongTuan: int", "- caHoc: int", "- phongHoc: String"],
                'methods': ["+ kiemTraXungDotTruoc(): boolean", "+ guiLuuLichHoc(): void", "+ hienThiCanhBaoLoi(msg): void"]
            },
            {
                'name': "ScheduleController", 'stereo': "Giao diện",
                'attrs': ["- path: /api/schedules"],
                'methods': ["+ createSchedule(req: ScheduleReq): ResponseEntity", "+ checkConflict(req): ResponseEntity"]
            }
        ],
        ctrl_classes=[
            {
                'name': "ScheduleService", 'stereo': "Điều khiển",
                'attrs': ["- scheduleRepo: ScheduleRepository"],
                'methods': ["+ taoLichHoc(req): Schedule", "+ kiemTraTrungPhong(room, day, shift, semId): boolean", "+ kiemTraTrungGiangVien(lecId, day, shift, semId): boolean"]
            }
        ],
        ent_classes=[
            {
                'name': "Schedule (Bảng schedules)", 'stereo': "Thực thể",
                'attrs': ["- id: int", "- courseSection: CourseSection", "- dayOfWeek: int (2..7)", "- shift: int (1..6)", "- classroom: String"],
                'methods': ["+ layThu(): int", "+ layCa(): int", "+ layPhong(): String"]
            },
            {
                'name': "CourseSection (Bảng course_sections)", 'stereo': "Thực thể",
                'attrs': ["- id: int", "- sectionCode: String"],
                'methods': ["+ layMaLop(): String"]
            }
        ],
        edges=[
            ("bnd_scheduling_1", "bnd_scheduling_2", "lưu thời khóa biểu", False),
            ("bnd_scheduling_2", "ctrl_scheduling_1", "kiểm tra & xếp lịch", False),
            ("ctrl_scheduling_1", "ent_scheduling_1", "lưu Lịch học", True),
            ("ent_scheduling_1", "ent_scheduling_2", "gắn với Lớp HP", False)
        ]
    )

# 11. Đăng ký lớp Học phần
def build_bce_11_enrollment():
    return build_single_function_tab(
        func_code="enroll",
        func_title="ĐĂNG KÝ LỚP HỌC PHẦN",
        comp_title="Đăng ký lớp Học phần",
        comp_example="course_enrollment",
        actor_name="Sinh viên",
        bnd_classes=[
            {
                'name': "EnrollPageView", 'stereo': "Giao diện",
                'attrs': ["- danhSachLopMo: List<CourseSection>", "- tongTinChiDaChon: int", "- tkbTamThoi: List<Schedule>"],
                'methods': ["+ taiLopMoTrongKy(): void", "+ guiDangKy(sectionId): void", "+ hienThiKetQuaToast(): void"]
            },
            {
                'name': "EnrollmentController", 'stereo': "Giao diện",
                'attrs': ["- path: POST /api/enrollments"],
                'methods': ["+ enrollCourse(studentId, sectionId): ResponseEntity"]
            }
        ],
        ctrl_classes=[
            {
                'name': "EnrollmentService", 'stereo': "Điều khiển",
                'attrs': ["- enrollmentRepo: EnrollmentRepository", "- sectionRepo: CourseSectionRepository", "- studentRepo: StudentRepository"],
                'methods': ["+ dangKyHocPhan(svId, sectionId): Enrollment", "+ khoaBiQuanLopHP(id): CourseSection", "+ kiemTraSiSo(sec): boolean", "+ kiemTraTrungLich(svId, sec): boolean", "+ kiemTraGioiHanTinChi(svId, sec): boolean"]
            }
        ],
        ent_classes=[
            {
                'name': "Enrollment (Bảng enrollments)", 'stereo': "Thực thể",
                'attrs': ["- id: int", "- student: Student", "- courseSection: CourseSection", "- enrollDate: Date", "- status: String (ENROLLED)"],
                'methods': ["+ dangHieuLuc(): boolean"]
            },
            {
                'name': "CourseSection (Bảng course_sections)", 'stereo': "Thực thể",
                'attrs': ["- currentEnrolled: int (+1)", "- maxCapacity: int"],
                'methods': ["+ tangSiSo(): void"]
            }
        ],
        edges=[
            ("bnd_enroll_1", "bnd_enroll_2", "bấm Đăng ký", False),
            ("bnd_enroll_2", "ctrl_enroll_1", "xử lý đăng ký & khóa bi quan", False),
            ("ctrl_enroll_1", "ent_enroll_1", "tạo bản ghi đăng ký", True),
            ("ctrl_enroll_1", "ent_enroll_2", "tăng sĩ số (+1)", True)
        ]
    )

# 12. Hủy đăng ký Học phần
def build_bce_12_course_drop():
    return build_single_function_tab(
        func_code="drop",
        func_title="HỦY ĐĂNG KÝ HỌC PHẦN",
        comp_title="Hủy đăng ký học phần",
        comp_example="course_drop",
        actor_name="Sinh viên",
        bnd_classes=[
            {
                'name': "MyEnrollmentsPageView", 'stereo': "Giao diện",
                'attrs': ["- danhSachDaDK: List<Enrollment>", "- thoiGianConLai: String"],
                'methods': ["+ taiLopDaDangKy(): void", "+ guiYeuCauHuy(enrId): void", "+ moModalXacNhanHuy(): void"]
            },
            {
                'name': "EnrollmentController", 'stereo': "Giao diện",
                'attrs': ["- path: DELETE /api/enrollments/{id}"],
                'methods': ["+ dropCourse(studentId, enrId): ResponseEntity"]
            }
        ],
        ctrl_classes=[
            {
                'name': "EnrollmentService", 'stereo': "Điều khiển",
                'attrs': ["- enrollmentRepo: EnrollmentRepository", "- sectionRepo: CourseSectionRepository"],
                'methods': ["+ huyDangKy(svId, enrId): boolean", "+ kiemTraTrongHanHuy(semId): boolean", "+ giamSiSoLopHP(secId): void"]
            }
        ],
        ent_classes=[
            {
                'name': "Enrollment (Bảng enrollments)", 'stereo': "Thực thể",
                'attrs': ["- id: int", "- status: String (CANCELLED)"],
                'methods': ["+ huy(): void"]
            },
            {
                'name': "CourseSection (Bảng course_sections)", 'stereo': "Thực thể",
                'attrs': ["- currentEnrolled: int (-1)"],
                'methods': ["+ giamSiSo(): void"]
            }
        ],
        edges=[
            ("bnd_drop_1", "bnd_drop_2", "bấm Hủy học phần", False),
            ("bnd_drop_2", "ctrl_drop_1", "thực hiện hủy", False),
            ("ctrl_drop_1", "ent_drop_1", "cập nhật trạng thái", True),
            ("ctrl_drop_1", "ent_drop_2", "giảm sĩ số (-1)", True)
        ]
    )

# 13. Nhập điểm thành phần
def build_bce_13_grading_entry():
    return build_single_function_tab(
        func_code="grd_entry",
        func_title="NHẬP ĐIỂM THÀNH PHẦN",
        comp_title="Nhập điểm học phần",
        comp_example="grading_entry",
        actor_name="Giảng viên",
        bnd_classes=[
            {
                'name': "GradeEntryPageView", 'stereo': "Giao diện",
                'attrs': ["- lopHPDaChon: CourseSection", "- danhSachDiemSV: List<GradeDTO> (CC, GK, CK)"],
                'methods': ["+ taiDanhSachDiem(): void", "+ onScoreChange(svId, loai, diem): void", "+ onSaveDraft(): void"]
            },
            {
                'name': "GradeController", 'stereo': "Giao diện",
                'attrs': ["- path: GET /api/grades/{secId}", "- path: POST /api/grades"],
                'methods': ["+ layBangDiemLop(secId): ResponseEntity", "+ luuDiemTam(dto: GradeListDTO): ResponseEntity"]
            }
        ],
        ctrl_classes=[
            {
                'name': "GradeService", 'stereo': "Điều khiển",
                'attrs': ["- gradeRepo: GradeRepository", "- enrollmentRepo: EnrollmentRepository"],
                'methods': ["+ luuDiemTamThoi(gradeListDto): List<Grade>", "+ kiemTraDiemHopLe(0..10): boolean", "+ tinhDiemTongKet10(cc, gk, ck): double", "+ quyDoiHe4VaChu(total10): String"]
            }
        ],
        ent_classes=[
            {
                'name': "Grade (Bảng grades)", 'stereo': "Thực thể",
                'attrs': ["- id: int", "- enrollment: Enrollment", "- attendanceScore: double", "- midtermScore: double", "- finalScore: double", "- totalScore10: double", "- totalScore4: double", "- gradeLetter: String", "- isFinalized: boolean (false)"],
                'methods': ["+ tinhDiem(): void"]
            }
        ],
        edges=[
            ("bnd_grd_entry_1", "bnd_grd_entry_2", "lưu tạm điểm", False),
            ("bnd_grd_entry_2", "ctrl_grd_entry_1", "tính toán & lưu", False),
            ("ctrl_grd_entry_1", "ent_grd_entry_1", "ghi nhận điểm số", True)
        ]
    )

# 14. Chốt bảng điểm học phần
def build_bce_14_grading_finalize():
    return build_single_function_tab(
        func_code="grd_finalize",
        func_title="CHỐT BẢNG ĐIỂM HỌC PHẦN",
        comp_title="Chốt bảng điểm học phần",
        comp_example="grading_finalize",
        actor_name="Giảng viên",
        bnd_classes=[
            {
                'name': "FinalizeConfirmModal", 'stereo': "Giao diện",
                'attrs': ["- thongDiepCanhBao: String", "- soSVChuaDuDiem: int"],
                'methods': ["+ kiemTraDuDiem(): boolean", "+ xacNhanKhoaSo(sectionId): void", "+ dongModal(): void"]
            },
            {
                'name': "GradeController", 'stereo': "Giao diện",
                'attrs': ["- path: POST /api/grades/finalize"],
                'methods': ["+ chotBangDiem(sectionId): ResponseEntity"]
            }
        ],
        ctrl_classes=[
            {
                'name': "GradeService", 'stereo': "Điều khiển",
                'attrs': ["- gradeRepo: GradeRepository", "- sectionRepo: CourseSectionRepository"],
                'methods': ["+ chotBangDiem(secId): boolean", "+ kiemTraTatCaSVDaCoDiem(secId): boolean", "+ khoaSoChinhThuc(secId): void"]
            }
        ],
        ent_classes=[
            {
                'name': "Grade (Bảng grades)", 'stereo': "Thực thể",
                'attrs': ["- isFinalized: boolean (true)"],
                'methods': ["+ khoaSo(): void"]
            },
            {
                'name': "CourseSection (Bảng course_sections)", 'stereo': "Thực thể",
                'attrs': ["- status: String (GRADED)"],
                'methods': ["+ danhDauDaChotDiem(): void"]
            }
        ],
        edges=[
            ("bnd_grd_finalize_1", "bnd_grd_finalize_2", "xác nhận khóa sổ", False),
            ("bnd_grd_finalize_2", "ctrl_grd_finalize_1", "khóa bảng điểm", False),
            ("ctrl_grd_finalize_1", "ent_grd_finalize_1", "cập nhật isFinalized=true", True),
            ("ctrl_grd_finalize_1", "ent_grd_finalize_2", "đóng lớp học phần", True)
        ]
    )

# 15. Tra cứu Bảng điểm học tập & Điểm CPA
def build_bce_15_transcript_cpa():
    return build_single_function_tab(
        func_code="transcript",
        func_title="TRA CỨU BẢNG ĐIỂM & ĐIỂM CPA",
        comp_title="Bảng điểm & CPA",
        comp_example="transcript_cpa",
        actor_name="Sinh viên",
        bnd_classes=[
            {
                'name': "TranscriptPageView", 'stereo': "Giao diện",
                'attrs': ["- studentInfo: Student", "- transcriptBySemesters: List<SemesterResultDTO>", "- gpaPerSem: double", "- cpaCumulative: double"],
                'methods': ["+ taiBangDiem(): void", "+ xuatFilePDF(): void"]
            },
            {
                'name': "TranscriptController", 'stereo': "Giao diện",
                'attrs': ["- path: GET /api/transcripts/me"],
                'methods': ["+ getMyTranscript(): ResponseEntity"]
            }
        ],
        ctrl_classes=[
            {
                'name': "TranscriptService", 'stereo': "Điều khiển",
                'attrs': ["- gradeRepo: GradeRepository", "- studentRepo: StudentRepository"],
                'methods': ["+ buildTranscript(studentId): TranscriptResponse", "+ calculateSemesterGPA(svId, semId): double", "+ calculateCumulativeCPA(svId): double", "+ determineAcademicRank(cpa): String"]
            }
        ],
        ent_classes=[
            {
                'name': "TranscriptResponse", 'stereo': "Truyền dữ liệu",
                'attrs': ["- studentCode: String", "- fullName: String", "- semesterResults: List<SemesterResultDTO>", "- cumulativeCPA: double", "- totalCredits: int", "- academicRank: String"],
                'methods': ["+ layCPA(): double", "+ layXepLoai(): String"]
            }
        ],
        edges=[
            ("bnd_transcript_1", "bnd_transcript_2", "truy vấn bảng điểm", False),
            ("bnd_transcript_2", "ctrl_transcript_1", "tổng hợp kết quả & CPA", False),
            ("ctrl_transcript_1", "ent_transcript_1", "đóng gói DTO", True)
        ]
    )

# 16. Báo cáo Thống kê & Dashboard đào tạo
def build_bce_16_analytics_dashboard():
    return build_single_function_tab(
        func_code="dashboard",
        func_title="BÁO CÁO THỐNG KÊ & DASHBOARD",
        comp_title="Bảng điều khiển Thống kê",
        comp_example="analytics_dashboard",
        actor_name="Quản trị viên",
        bnd_classes=[
            {
                'name': "DashboardPageView", 'stereo': "Giao diện",
                'attrs': ["- theThongKeKPI: List<KPIItem>", "- bieuDoKhoa: PieChart", "- bieuDoTrangThai: BarChart", "- bangTienDoDiem: DataTable"],
                'methods': ["+ taiSoLieuThongKe(): void", "+ xemLopChuaChotDiem(): void", "+ xuatBaoCaoExcel(): void"]
            },
            {
                'name': "DashboardController", 'stereo': "Giao diện",
                'attrs': ["- path: GET /api/dashboard/stats", "- path: GET /api/dashboard/grades-progress"],
                'methods': ["+ getDashboardStats(): ResponseEntity", "+ getGradesProgress(): ResponseEntity"]
            }
        ],
        ctrl_classes=[
            {
                'name': "DashboardService", 'stereo': "Điều khiển",
                'attrs': ["- studentRepo: StudentRepository", "- deptRepo: DepartmentRepository", "- sectionRepo: CourseSectionRepository"],
                'methods': ["+ tongHopKPI(): DashboardResponse", "+ thongKeSinhVienTheoKhoa(): Map<String, Object>", "+ thongKeTrangThaiDaoTao(): Map<String, Object>", "+ kiemTraTienDoVaoDiem(): List<CourseSection>"]
            }
        ],
        ent_classes=[
            {
                'name': "DashboardResponse", 'stereo': "Truyền dữ liệu",
                'attrs': ["- totalStudents: int", "- totalLecturers: int", "- totalSections: int", "- deptDistribution: Map<String, Object>", "- statusDistribution: Map<String, Object>", "- pendingSections: List<CourseSection>"],
                'methods': ["+ layTongSinhVien(): int", "+ layDanhSachCanhBao(): List<String>"]
            }
        ],
        edges=[
            ("bnd_dashboard_1", "bnd_dashboard_2", "truy vấn số liệu", False),
            ("bnd_dashboard_2", "ctrl_dashboard_1", "phân tích & tổng hợp", False),
            ("ctrl_dashboard_1", "ent_dashboard_1", "đóng gói DTO", True)
        ]
    )

def main():
    mxfile = ET.Element('mxfile', {
        'host': 'app.diagrams.net',
        'modified': '2026-09-12T07:45:00.000Z',
        'agent': 'Antigravity AI Agent',
        'version': '21.0.0',
        'type': 'device'
    })

    tabs_data = [
        ('bce_login', '1. Đăng nhập hệ thống', build_bce_1_login()),
        ('bce_changepwd', '2. Đổi mật khẩu', build_bce_2_change_password()),
        ('bce_stu_create', '3. Thêm mới Sinh viên', build_bce_3_student_create()),
        ('bce_stu_manage', '4. Quản lý hồ sơ Sinh viên', build_bce_4_student_manage()),
        ('bce_academic', '5. Khoa & Lớp sinh hoạt', build_bce_5_academic_structure()),
        ('bce_lecturers', '6. Quản lý Giảng viên', build_bce_6_lecturers()),
        ('bce_subjects', '7. Quản lý Môn học', build_bce_7_subjects()),
        ('bce_semesters', '8. Cấu hình Học kỳ', build_bce_8_semesters()),
        ('bce_sections', '9. Mở lớp Học phần', build_bce_9_course_sections()),
        ('bce_scheduling', '10. Xếp Thời khóa biểu', build_bce_10_scheduling()),
        ('bce_enroll', '11. Đăng ký lớp Học phần', build_bce_11_enrollment()),
        ('bce_drop', '12. Hủy đăng ký Học phần', build_bce_12_course_drop()),
        ('bce_grd_entry', '13. Nhập điểm thành phần', build_bce_13_grading_entry()),
        ('bce_grd_finalize', '14. Chốt bảng điểm', build_bce_14_grading_finalize()),
        ('bce_transcript', '15. Bảng điểm & Điểm CPA', build_bce_15_transcript_cpa()),
        ('bce_dashboard', '16. Báo cáo Thống kê & Dashboard', build_bce_16_analytics_dashboard()),
    ]

    for diag_id, diag_name, model in tabs_data:
        d = ET.SubElement(mxfile, 'diagram', {'id': diag_id, 'name': diag_name})
        d.append(model)

    xml_str = ET.tostring(mxfile, encoding='utf-8')
    parsed = minidom.parseString(xml_str)
    pretty_xml = parsed.toprettyxml(indent='  ', encoding='utf-8')

    out_path = os.path.join('drawio', 'AnalysisClass_BCE_Diagrams.drawio')
    with open(out_path, 'wb') as f:
        f.write(pretty_xml)
    print(f"Generated successfully: {out_path} ({len(pretty_xml)} bytes, {len(tabs_data)} tabs)")

if __name__ == '__main__':
    main()
