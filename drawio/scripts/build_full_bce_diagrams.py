# -*- coding: utf-8 -*-
"""
Biểu đồ Lớp Phân tích (Analysis Class Diagram - BCE) chuẩn UML theo kiến trúc
Boundary - Control - Entity (BCE):
Mỗi chức năng (Use Case) được mô hình hóa riêng biệt thành 1 Tab chuyên biệt (23 Tabs chuẩn hóa),
gồm 3 cột phân tầng:
  [ «Boundary» Giao diện & REST Endpoints ]
    → [ «Control» Logic Nghiệp vụ & Dịch vụ Bảo mật ]
      → [ «Entity» Thực thể Miền CSDL & DTOs ]
Khớp 100% mã nguồn thực tế: Spring Boot 3 Backend + React SPA Frontend + MySQL Database.
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

# Column Header Cards
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

def create_base_model(page_w=1480, page_h=980):
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': str(page_w), 'pageHeight': str(page_h), 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")
    return model, root

def calc_class_height(attrs, methods, w=350):
    chars_per_line = int((w - 24) / 6.2)
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
        st_vn = "Boundary"
    elif 'điều' in st_lower or 'dieu' in st_lower or 'control' in st_lower:
        style_box = STYLE_CLASS_CTRL
        st_vn = "Control"
    elif 'truyền' in st_lower or 'truyen' in st_lower or 'dto' in st_lower:
        style_box = STYLE_CLASS_DTO
        st_vn = "DTO"
    else:
        style_box = STYLE_CLASS_ENT
        st_vn = "Entity"

    total_h, attr_h, method_h = calc_class_height(attrs, methods, w)

    attr_text = "\n".join(attrs) if attrs else "(no attributes)"
    method_text = "\n".join(methods) if methods else "(no methods)"
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
    - 3 Cột định hướng phân tầng rõ nét với Icon biểu tượng UML BCE chính quy.
    - Cột 1 (x=160, w=350): Lớp Biên (Boundary)
    - Cột 2 (x=600, w=350): Lớp Điều khiển (Control)
    - Cột 3 (x=1040, w=350): Lớp Thực thể & DTO (Entity/DTO)
    - Mũi tên trực giao, không gạch ngang chữ, nhãn nền trắng.
    """
    page_h = 1060 if len(ent_classes) >= 3 else (940 if len(ctrl_classes) > 1 or len(ent_classes) > 1 else 860)
    model, root = create_base_model(1480, page_h)

    # 1. Tiêu đề trang chuẩn học thuật
    add_cell(root, "t_main", f"BIỂU ĐỒ LỚP PHÂN TÍCH (BCE) - CHỨC NĂNG: {func_title}", STYLE_TITLE, vertex=True,
             geometry={'x': 40, 'y': 20, 'width': 1000, 'height': 25})
    add_cell(root, "st_main", f"Kiến trúc phân tầng: {comp_title} | Tác nhân ➜ Boundary (Giao diện & API) ➜ Control (Nghiệp vụ) ➜ Entity (CSDL & DTO)",
             STYLE_SUBTITLE, vertex=True, geometry={'x': 40, 'y': 48, 'width': 1100, 'height': 20})

    # 2. Thẻ tiêu đề 3 Cột tích hợp Icon UML BCE chính quy
    bnd_hdr_id = f"hdr_bnd_{func_code}"
    add_cell(root, bnd_hdr_id, "<b>«Boundary» GIAO DIỆN &amp; API</b><br><span style=\"font-size:10px;font-weight:normal;color:#444444;\">(React UI Page &amp; Spring Boot REST Endpoints)</span>",
             STYLE_HDR_BND, vertex=True, geometry={'x': 160, 'y': 78, 'width': 350, 'height': 42})
    add_cell(root, f"icon_bnd_{func_code}", "", STYLE_ICON_BND, vertex=True,
             geometry={'x': 172, 'y': 84, 'width': 30, 'height': 30})

    ctrl_hdr_id = f"hdr_ctrl_{func_code}"
    add_cell(root, ctrl_hdr_id, "<b>«Control» ĐIỀU KHIỂN &amp; XỬ LÝ</b><br><span style=\"font-size:10px;font-weight:normal;color:#444444;\">(Business Logic, Security &amp; Repository Services)</span>",
             STYLE_HDR_CTRL, vertex=True, geometry={'x': 600, 'y': 78, 'width': 350, 'height': 42})
    add_cell(root, f"icon_ctrl_{func_code}", "", STYLE_ICON_CTRL, vertex=True,
             geometry={'x': 612, 'y': 84, 'width': 30, 'height': 30})

    ent_hdr_id = f"hdr_ent_{func_code}"
    add_cell(root, ent_hdr_id, "<b>«Entity» THỰC THỂ &amp; DTO</b><br><span style=\"font-size:10px;font-weight:normal;color:#444444;\">(Domain JPA Entities, Database Tables &amp; DTOs)</span>",
             STYLE_HDR_ENT, vertex=True, geometry={'x': 1040, 'y': 78, 'width': 350, 'height': 42})
    add_cell(root, f"icon_ent_{func_code}", "", STYLE_ICON_ENT, vertex=True,
             geometry={'x': 1052, 'y': 84, 'width': 30, 'height': 30})

    # Mũi tên tiến trình trực giao giữa 3 thẻ tiêu đề
    add_cell(root, f"flow_hdr1_{func_code}", "", STYLE_FLOW_ARROW, edge=True, source=bnd_hdr_id, target=ctrl_hdr_id)
    add_cell(root, f"flow_hdr2_{func_code}", "", STYLE_FLOW_ARROW, edge=True, source=ctrl_hdr_id, target=ent_hdr_id)

    # 3. Phân bổ các lớp Giao diện (Column 1: x = 160, w = 350)
    bnd_ids = []
    if len(bnd_classes) > 0:
        cid1 = f"bnd_{func_code}_1"
        bnd_ids.append(cid1)
        add_class_box(root, cid1, bnd_classes[0].get('stereo', 'Boundary'), bnd_classes[0]['name'],
                      160, 145, 350, bnd_classes[0].get('attrs', []), bnd_classes[0].get('methods', []))

    if len(bnd_classes) > 1:
        cid2 = f"bnd_{func_code}_2"
        bnd_ids.append(cid2)
        add_class_box(root, cid2, bnd_classes[1].get('stereo', 'Boundary'), bnd_classes[1]['name'],
                      160, 410, 350, bnd_classes[1].get('attrs', []), bnd_classes[1].get('methods', []))

    # 4. Tác nhân (Actor): Đặt bên trái, thẳng hàng ngang với bnd_1
    act_id = f"act_{func_code}"
    add_cell(root, act_id, actor_name, STYLE_ACTOR, vertex=True,
             geometry={'x': 40, 'y': 185, 'width': 60, 'height': 90})
    if bnd_ids:
        add_cell(root, f"e_act_{func_code}", "tương tác", STYLE_ASSOC, edge=True, source=act_id, target=bnd_ids[0])

    # 5. Phân bổ các lớp Điều khiển (Column 2: x = 600, w = 350)
    ctrl_ids = []
    if len(ctrl_classes) > 0:
        cid1 = f"ctrl_{func_code}_1"
        ctrl_ids.append(cid1)
        add_class_box(root, cid1, ctrl_classes[0].get('stereo', 'Control'), ctrl_classes[0]['name'],
                      600, 410, 350, ctrl_classes[0].get('attrs', []), ctrl_classes[0].get('methods', []))

    if len(ctrl_classes) > 1:
        cid2 = f"ctrl_{func_code}_2"
        ctrl_ids.append(cid2)
        add_class_box(root, cid2, ctrl_classes[1].get('stereo', 'Control'), ctrl_classes[1]['name'],
                      600, 660, 350, ctrl_classes[1].get('attrs', []), ctrl_classes[1].get('methods', []))

    # 6. Phân bổ các lớp Thực thể (Column 3: x = 1040, w = 350)
    ent_ids = []
    ent_y_positions = [410, 660, 870]
    for i, cls in enumerate(ent_classes):
        cid = f"ent_{func_code}_{i+1}"
        ent_ids.append(cid)
        y_pos = ent_y_positions[i] if i < len(ent_y_positions) else 410 + i * 220
        add_class_box(root, cid, cls.get('stereo', 'Entity'), cls['name'],
                      1040, y_pos, 350, cls.get('attrs', []), cls.get('methods', []))

    # 7. Các đường liên kết nghiệp vụ giữa các lớp
    for i, edge in enumerate(edges):
        src, tgt, lbl, is_data = edge
        base_style = STYLE_DATA_ARROW if is_data else STYLE_CALL_ARROW
        if src.startswith('bnd_') and tgt.startswith('bnd_'):
            edge_style = base_style + ";exitX=0.5;exitY=1;entryX=0.5;entryY=0;"
        elif src.startswith('ctrl_') and tgt.startswith('ctrl_'):
            edge_style = base_style + ";exitX=0.5;exitY=1;entryX=0.5;entryY=0;"
        elif src.startswith('bnd_') and tgt.startswith('ctrl_'):
            edge_style = base_style + ";exitX=1;exitY=0.5;entryX=0;entryY=0.5;"
        elif src.startswith('ctrl_') and tgt.startswith('ent_'):
            if tgt.endswith('_1'):
                edge_style = base_style + ";exitX=1;exitY=0.35;entryX=0;entryY=0.35;"
            elif tgt.endswith('_2'):
                edge_style = base_style + ";exitX=1;exitY=0.65;entryX=0;entryY=0.35;"
            else:
                edge_style = base_style + ";exitX=1;exitY=0.85;entryX=0;entryY=0.35;"
        else:
            edge_style = base_style + ";exitX=1;exitY=0.5;entryX=0;entryY=0.5;"
        add_cell(root, f"edge_{func_code}_{i+1}", lbl, edge_style, edge=True, source=src, target=tgt,
                 geometry={'relative': '1', 'y': '-12'})

    return model


# ==========================================================
# 23 CHỨC NĂNG CHUẨN HÓA KHỚP 100% CODEBASE DỰ ÁN
# ==========================================================

# 01. Đăng nhập hệ thống & Cấp phát JWT kép
def build_bce_1_login():
    return build_single_function_tab(
        func_code="login",
        func_title="01. Đăng nhập hệ thống & Cấp phát JWT kép",
        comp_title="Xác thực & Quản lý Truy cập",
        comp_example="AuthController",
        actor_name="Người dùng",
        bnd_classes=[
            {
                'name': "PortalLoginPage", 'stereo': "Boundary",
                'attrs': ["- username: String", "- password: String", "- isSubmitting: boolean", "- showPassword: boolean"],
                'methods': ["+ handleLogin(e: FormEvent): void", "+ validateCredentials(): boolean", "+ redirectByRole(role: Role): void"]
            },
            {
                'name': "AuthController", 'stereo': "Boundary",
                'attrs': ["- authService: AuthService", "- path: POST /api/auth/login"],
                'methods': ["+ login(request: LoginRequest): ResponseEntity<ApiResponse<LoginResponse>>", "+ logout(): ResponseEntity<ApiResponse<Void>>"]
            }
        ],
        ctrl_classes=[
            {
                'name': "AuthService", 'stereo': "Control",
                'attrs': ["- authenticationManager: AuthenticationManager", "- tokenProvider: JwtTokenProvider", "- userRepository: UserRepository"],
                'methods': ["+ authenticate(request: LoginRequest): LoginResponse", "+ generateTokenPair(user: User): TokenPair", "+ checkMustChangePassword(user: User): boolean"]
            },
            {
                'name': "AuthenticationManager", 'stereo': "Control",
                'attrs': ["- userDetailsService: CustomUserDetailsService", "- passwordEncoder: PasswordEncoder"],
                'methods': ["+ authenticate(auth: Authentication): Authentication"]
            }
        ],
        ent_classes=[
            {
                'name': "User", 'stereo': "Entity",
                'attrs': ["- id: Long", "- username: String", "- password: String (BCrypt)", "- email: String", "- role: Role", "- isActive: boolean", "- mustChangePassword: boolean"],
                'methods': ["+ getAuthorities(): Collection<GrantedAuthority>", "+ isEnabled(): boolean", "+ isMustChangePassword(): boolean"]
            },
            {
                'name': "LoginResponse", 'stereo': "DTO",
                'attrs': ["- accessToken: String", "- refreshToken: String", "- tokenType: String", "- userId: Long", "- username: String", "- role: String", "- mustChangePassword: boolean"],
                'methods': ["+ getAccessToken(): String", "+ getRole(): String"]
            },
            {
                'name': "LoginRequest", 'stereo': "DTO",
                'attrs': ["- username: String", "- password: String"],
                'methods': ["+ getUsername(): String", "+ getPassword(): String"]
            }
        ],
        edges=[
            ("bnd_login_1", "bnd_login_2", "HTTP POST /api/auth/login", False),
            ("bnd_login_2", "ctrl_login_1", "ủy quyền authenticate()", False),
            ("ctrl_login_1", "ctrl_login_2", "ủy quyền xác thực Spring Security", False),
            ("ctrl_login_1", "ent_login_1", "truy vấn thông tin User & flag", True),
            ("ctrl_login_1", "ent_login_2", "đóng gói DTO LoginResponse", True)
        ]
    )

# 02. Đổi mật khẩu tài khoản cá nhân
def build_bce_2_change_password():
    return build_single_function_tab(
        func_code="changepwd",
        func_title="02. Đổi mật khẩu tài khoản cá nhân",
        comp_title="Đổi mật khẩu người dùng",
        comp_example="AuthController",
        actor_name="Người dùng",
        bnd_classes=[
            {
                'name': "ChangePasswordModal", 'stereo': "Boundary",
                'attrs': ["- currentPassword: String", "- newPassword: String", "- confirmPassword: String", "- errorMessage: String"],
                'methods': ["+ handleSubmit(): void", "+ validatePasswordComplexity(): boolean", "+ resetForm(): void"]
            },
            {
                'name': "AuthController", 'stereo': "Boundary",
                'attrs': ["- authService: AuthService", "- path: PUT /api/auth/change-password"],
                'methods': ["+ changePassword(user: UserPrincipal, req: ChangePasswordRequest): ResponseEntity<ApiResponse<Void>>"]
            }
        ],
        ctrl_classes=[
            {
                'name': "AuthService", 'stereo': "Control",
                'attrs': ["- userRepository: UserRepository", "- passwordEncoder: PasswordEncoder", "- auditLogService: AuditLogService"],
                'methods': ["+ changePassword(userId: Long, req: ChangePasswordRequest): void", "+ validateOldPassword(raw: String, encoded: String): boolean"]
            },
            {
                'name': "PasswordEncoder", 'stereo': "Control",
                'attrs': ["- encoder: BCryptPasswordEncoder(12)"],
                'methods': ["+ matches(raw: CharSequence, encoded: String): boolean", "+ encode(raw: CharSequence): String"]
            }
        ],
        ent_classes=[
            {
                'name': "User", 'stereo': "Entity",
                'attrs': ["- id: Long", "- username: String", "- password: String (Hashed)", "- mustChangePassword: boolean", "- updatedAt: LocalDateTime"],
                'methods': ["+ setPassword(encoded: String): void", "+ setMustChangePassword(flag: boolean): void"]
            },
            {
                'name': "ChangePasswordRequest", 'stereo': "DTO",
                'attrs': ["- currentPassword: String", "- newPassword: String", "- confirmPassword: String"],
                'methods': ["+ getCurrentPassword(): String", "+ getNewPassword(): String"]
            }
        ],
        edges=[
            ("bnd_changepwd_1", "bnd_changepwd_2", "HTTP PUT /api/auth/change-password", False),
            ("bnd_changepwd_2", "ctrl_changepwd_1", "gọi changePassword()", False),
            ("ctrl_changepwd_1", "ctrl_changepwd_2", "băm mật khẩu BCrypt", False),
            ("ctrl_changepwd_1", "ent_changepwd_1", "cập nhật mật khẩu băm mới", True)
        ]
    )

# 03. Thêm mới Sinh viên & Cấp tài khoản tự động
def build_bce_3_student_create():
    return build_single_function_tab(
        func_code="stu_create",
        func_title="03. Thêm mới Sinh viên & Cấp tài khoản tự động",
        comp_title="Thêm mới Sinh viên",
        comp_example="StudentController",
        actor_name="Quản trị viên (Admin)",
        bnd_classes=[
            {
                'name': "StudentFormModal", 'stereo': "Boundary",
                'attrs': ["- studentCode: String", "- fullName: String", "- email: String", "- dob: LocalDate", "- classId: Integer"],
                'methods': ["+ onSubmit(data: StudentFormData): void", "+ generateStudentCode(): void", "+ handleValidation(): boolean"]
            },
            {
                'name': "StudentController", 'stereo': "Boundary",
                'attrs': ["- studentService: StudentService", "- path: POST /api/students"],
                'methods': ["+ createStudent(request: StudentRequest): ResponseEntity<ApiResponse<Student>>"]
            }
        ],
        ctrl_classes=[
            {
                'name': "StudentService", 'stereo': "Control",
                'attrs': ["- studentRepository: StudentRepository", "- userRepository: UserRepository", "- classRepository: ClassRepository", "- passwordEncoder: PasswordEncoder"],
                'methods': ["+ createStudent(req: StudentRequest): Student", "+ autoProvisionUserAccount(student: Student): User", "+ validateUniqueStudentCodeAndEmail(code: String, email: String): void"]
            },
            {
                'name': "UserRepository", 'stereo': "Control",
                'attrs': ["- entityManager: EntityManager"],
                'methods': ["+ existsByUsername(username: String): boolean", "+ existsByEmail(email: String): boolean", "+ save(user: User): User"]
            }
        ],
        ent_classes=[
            {
                'name': "Student", 'stereo': "Entity",
                'attrs': ["- id: Long", "- studentCode: String", "- fullName: String", "- email: String", "- dob: LocalDate", "- status: StudentStatus", "- classEntity: ClassEntity", "- user: User"],
                'methods': ["+ getStudentCode(): String", "+ getStatus(): StudentStatus", "+ setClassEntity(clazz: ClassEntity): void"]
            },
            {
                'name': "User", 'stereo': "Entity",
                'attrs': ["- id: Long", "- username: String (studentCode)", "- password: String (BCrypt)", "- role: Role.STUDENT", "- isActive: boolean", "- mustChangePassword: true"],
                'methods': ["+ setRole(role: Role): void", "+ setActive(active: boolean): void"]
            },
            {
                'name': "StudentRequest", 'stereo': "DTO",
                'attrs': ["- studentCode: String", "- fullName: String", "- email: String", "- phone: String", "- classId: Integer", "- dob: LocalDate"],
                'methods': ["+ getStudentCode(): String", "+ getClassId(): Integer"]
            }
        ],
        edges=[
            ("bnd_stu_create_1", "bnd_stu_create_2", "HTTP POST /api/students", False),
            ("bnd_stu_create_2", "ctrl_stu_create_1", "ủy quyền createStudent()", False),
            ("ctrl_stu_create_1", "ctrl_stu_create_2", "lưu tài khoản User", False),
            ("ctrl_stu_create_1", "ent_stu_create_1", "bền vững hóa thực thể Student", True),
            ("ctrl_stu_create_2", "ent_stu_create_2", "bền vững hóa thực thể User", True)
        ]
    )

# 04. Quản lý Hồ sơ Sinh viên & Đình chỉ đào tạo
def build_bce_4_student_manage():
    return build_single_function_tab(
        func_code="stu_manage",
        func_title="04. Quản lý Hồ sơ Sinh viên & Đình chỉ đào tạo",
        comp_title="Quản lý hồ sơ Sinh viên",
        comp_example="StudentController",
        actor_name="Quản trị viên (Admin)",
        bnd_classes=[
            {
                'name': "StudentsPageView", 'stereo': "Boundary",
                'attrs': ["- students: List<Student>", "- searchKeyword: String", "- statusFilter: StudentStatus", "- selectedStudent: Student"],
                'methods': ["+ fetchStudents(pageable: Pageable): void", "+ handleStatusChange(id: Long, status: StudentStatus): void", "+ handleSearch(keyword: String): void"]
            },
            {
                'name': "StudentController", 'stereo': "Boundary",
                'attrs': ["- studentService: StudentService", "- path: PUT /api/students/{id}/status, PUT /api/students/{id}"],
                'methods': ["+ updateStudent(id: Long, req: StudentRequest): ResponseEntity<ApiResponse<Student>>", "+ updateStatus(id: Long, req: UpdateStudentStatusRequest): ResponseEntity<ApiResponse<Void>>"]
            }
        ],
        ctrl_classes=[
            {
                'name': "StudentService", 'stereo': "Control",
                'attrs': ["- studentRepository: StudentRepository", "- userRepository: UserRepository", "- auditLogService: AuditLogService"],
                'methods': ["+ updateStudent(id: Long, req: StudentRequest): Student", "+ updateStudentStatus(id: Long, status: StudentStatus): void", "+ syncUserStatus(student: Student, active: boolean): void"]
            },
            {
                'name': "StudentRepository", 'stereo': "Control",
                'attrs': ["- entityManager: EntityManager"],
                'methods': ["+ findById(id: Long): Optional<Student>", "+ findByStudentCode(code: String): Optional<Student>", "+ save(student: Student): Student"]
            }
        ],
        ent_classes=[
            {
                'name': "Student", 'stereo': "Entity",
                'attrs': ["- id: Long", "- studentCode: String", "- fullName: String", "- status: StudentStatus", "- address: String", "- gender: String"],
                'methods': ["+ setStatus(status: StudentStatus): void", "+ isActive(): boolean"]
            },
            {
                'name': "AuditLog", 'stereo': "Entity",
                'attrs': ["- id: Long", "- action: String (UPDATE_STATUS)", "- performedBy: String", "- details: String", "- timestamp: LocalDateTime"],
                'methods': ["+ getAction(): String", "+ getTimestamp(): LocalDateTime"]
            }
        ],
        edges=[
            ("bnd_stu_manage_1", "bnd_stu_manage_2", "HTTP PUT /api/students/{id}/status", False),
            ("bnd_stu_manage_2", "ctrl_stu_manage_1", "ủy quyền updateStudentStatus()", False),
            ("ctrl_stu_manage_1", "ctrl_stu_manage_2", "truy vấn & cập nhật Student", False),
            ("ctrl_stu_manage_2", "ent_stu_manage_1", "lưu trạng thái mới vào CSDL", True),
            ("ctrl_stu_manage_1", "ent_stu_manage_2", "ghi nhật ký AuditLog", True)
        ]
    )

# 05. Quản lý Cơ cấu Đào tạo (Khoa, Ngành, Lớp sinh hoạt)
def build_bce_5_academic_structure():
    return build_single_function_tab(
        func_code="academic",
        func_title="05. Cơ cấu Đào tạo (Khoa, Ngành, Lớp)",
        comp_title="Cơ cấu Khoa, Ngành & Lớp",
        comp_example="DepartmentController",
        actor_name="Quản trị viên (Admin)",
        bnd_classes=[
            {
                'name': "AcademicStructurePageView", 'stereo': "Boundary",
                'attrs': ["- departments: List<Department>", "- classes: List<ClassEntity>", "- selectedDeptId: Integer", "- isClassModalOpen: boolean"],
                'methods': ["+ loadDepartments(): void", "+ loadClassesByDepartment(deptId: Integer): void", "+ handleCreateClass(req: ClassRequest): void"]
            },
            {
                'name': "DepartmentController & ClassController", 'stereo': "Boundary",
                'attrs': ["- departmentService: DepartmentService", "- classService: ClassService", "- path: /api/departments, /api/classes"],
                'methods': ["+ getAllDepartments(): ResponseEntity<ApiResponse<List<Department>>>", "+ createClass(req: ClassRequest): ResponseEntity<ApiResponse<ClassEntity>>", "+ getClassesByDept(deptId: Integer): ResponseEntity<ApiResponse<List<ClassEntity>>>"]
            }
        ],
        ctrl_classes=[
            {
                'name': "DepartmentService & ClassService", 'stereo': "Control",
                'attrs': ["- departmentRepository: DepartmentRepository", "- classRepository: ClassRepository"],
                'methods': ["+ getAllDepartments(): List<Department>", "+ createClass(req: ClassRequest): ClassEntity", "+ validateClassCodeNotDuplicate(code: String): void"]
            },
            {
                'name': "ClassRepository", 'stereo': "Control",
                'attrs': ["- entityManager: EntityManager"],
                'methods': ["+ findByDepartmentId(deptId: Integer): List<ClassEntity>", "+ existsByClassCode(code: String): boolean", "+ save(clazz: ClassEntity): ClassEntity"]
            }
        ],
        ent_classes=[
            {
                'name': "Department", 'stereo': "Entity",
                'attrs': ["- id: Integer", "- departmentCode: String", "- departmentName: String", "- phone: String", "- email: String", "- isActive: boolean"],
                'methods': ["+ getDepartmentCode(): String", "+ getDepartmentName(): String"]
            },
            {
                'name': "ClassEntity", 'stereo': "Entity",
                'attrs': ["- id: Integer", "- classCode: String", "- className: String", "- academicYear: String", "- department: Department", "- major: Major"],
                'methods': ["+ getClassCode(): String", "+ getDepartment(): Department"]
            },
            {
                'name': "ClassRequest", 'stereo': "DTO",
                'attrs': ["- classCode: String", "- className: String", "- departmentId: Integer", "- majorId: Integer", "- academicYear: String"],
                'methods': ["+ getClassCode(): String", "+ getDepartmentId(): Integer"]
            }
        ],
        edges=[
            ("bnd_academic_1", "bnd_academic_2", "HTTP POST /api/classes", False),
            ("bnd_academic_2", "ctrl_academic_1", "ủy quyền createClass()", False),
            ("ctrl_academic_1", "ctrl_academic_2", "kiểm tra trùng & lưu CSDL", False),
            ("ctrl_academic_1", "ent_academic_1", "liên kết thực thể Department", True),
            ("ctrl_academic_2", "ent_academic_2", "bền vững hóa thực thể ClassEntity", True)
        ]
    )

# 06. Quản lý Giảng viên & Phân công giảng dạy
def build_bce_6_lecturers():
    return build_single_function_tab(
        func_code="lecturers",
        func_title="06. Quản lý Giảng viên & Phân công giảng dạy",
        comp_title="Quản lý Giảng viên",
        comp_example="LecturerController",
        actor_name="Quản trị viên (Admin)",
        bnd_classes=[
            {
                'name': "LecturersPageView", 'stereo': "Boundary",
                'attrs': ["- lecturers: List<Lecturer>", "- searchKeyword: String", "- deptFilter: Integer", "- isModalOpen: boolean"],
                'methods': ["+ fetchLecturers(): void", "+ handleSaveLecturer(req: LecturerRequest): void", "+ handleToggleStatus(id: Long): void"]
            },
            {
                'name': "LecturerController", 'stereo': "Boundary",
                'attrs': ["- lecturerService: LecturerService", "- path: GET/POST/PUT /api/lecturers"],
                'methods': ["+ getAll(): ResponseEntity<ApiResponse<List<Lecturer>>>", "+ create(req: LecturerRequest): ResponseEntity<ApiResponse<Lecturer>>", "+ update(id: Long, req: LecturerRequest): ResponseEntity<ApiResponse<Lecturer>>"]
            }
        ],
        ctrl_classes=[
            {
                'name': "LecturerService", 'stereo': "Control",
                'attrs': ["- lecturerRepository: LecturerRepository", "- userRepository: UserRepository", "- departmentRepository: DepartmentRepository"],
                'methods': ["+ getAllLecturers(): List<Lecturer>", "+ createLecturer(req: LecturerRequest): Lecturer", "+ autoProvisionLecturerAccount(lecturer: Lecturer): User"]
            },
            {
                'name': "LecturerRepository", 'stereo': "Control",
                'attrs': ["- entityManager: EntityManager"],
                'methods': ["+ findByLecturerCode(code: String): Optional<Lecturer>", "+ existsByEmail(email: String): boolean", "+ save(lecturer: Lecturer): Lecturer"]
            }
        ],
        ent_classes=[
            {
                'name': "Lecturer", 'stereo': "Entity",
                'attrs': ["- id: Long", "- lecturerCode: String", "- fullName: String", "- email: String", "- phone: String", "- academicDegree: String", "- department: Department", "- user: User"],
                'methods': ["+ getLecturerCode(): String", "+ getAcademicDegree(): String", "+ getDepartment(): Department"]
            },
            {
                'name': "User", 'stereo': "Entity",
                'attrs': ["- id: Long", "- username: String (lecturerCode)", "- password: String (BCrypt)", "- role: Role.LECTURER", "- isActive: boolean"],
                'methods': ["+ getRole(): Role", "+ isEnabled(): boolean"]
            },
            {
                'name': "LecturerRequest", 'stereo': "DTO",
                'attrs': ["- lecturerCode: String", "- fullName: String", "- email: String", "- phone: String", "- academicDegree: String", "- departmentId: Integer"],
                'methods': ["+ getLecturerCode(): String", "+ getDepartmentId(): Integer"]
            }
        ],
        edges=[
            ("bnd_lecturers_1", "bnd_lecturers_2", "HTTP POST /api/lecturers", False),
            ("bnd_lecturers_2", "ctrl_lecturers_1", "ủy quyền createLecturer()", False),
            ("ctrl_lecturers_1", "ctrl_lecturers_2", "lưu giảng viên vào CSDL", False),
            ("ctrl_lecturers_2", "ent_lecturers_1", "bền vững hóa thực thể Lecturer", True),
            ("ctrl_lecturers_1", "ent_lecturers_2", "cấp tài khoản User tương ứng", True)
        ]
    )

# 07. Quản lý Môn học, Tín chỉ & Môn tiên quyết
def build_bce_7_subjects():
    return build_single_function_tab(
        func_code="subjects",
        func_title="07. Quản lý Môn học, Tín chỉ & Tiên quyết",
        comp_title="Quản lý Môn học",
        comp_example="SubjectController",
        actor_name="Quản trị viên (Admin)",
        bnd_classes=[
            {
                'name': "SubjectsPageView", 'stereo': "Boundary",
                'attrs': ["- subjects: List<SubjectResponse>", "- keyword: String", "- deptFilter: Integer", "- isCreateModalOpen: boolean"],
                'methods': ["+ fetchSubjects(): void", "+ handleCreateSubject(req: SubjectRequest): void", "+ handleConfigurePrerequisites(id: Integer): void"]
            },
            {
                'name': "SubjectController", 'stereo': "Boundary",
                'attrs': ["- subjectService: SubjectService", "- path: GET/POST/PUT /api/subjects"],
                'methods': ["+ getAll(): ResponseEntity<ApiResponse<List<SubjectResponse>>>", "+ create(req: SubjectRequest): ResponseEntity<ApiResponse<SubjectResponse>>", "+ update(id: Integer, req: SubjectRequest): ResponseEntity<ApiResponse<SubjectResponse>>"]
            }
        ],
        ctrl_classes=[
            {
                'name': "SubjectService", 'stereo': "Control",
                'attrs': ["- subjectRepository: SubjectRepository", "- prerequisiteEngine: PrerequisiteGraphEngine", "- departmentRepository: DepartmentRepository"],
                'methods': ["+ getAllSubjects(): List<SubjectResponse>", "+ createSubject(req: SubjectRequest): SubjectResponse", "+ validateNoCyclicPrerequisite(subjectId: int, prereqId: int): void"]
            },
            {
                'name': "PrerequisiteGraphEngine", 'stereo': "Control",
                'attrs': ["- graphNodes: Map<Integer, Set<Integer>>"],
                'methods': ["+ buildDependencyGraph(): void", "+ hasCycle(sourceId: Integer, targetId: Integer): boolean", "+ getPrerequisiteTree(subjectId: Integer): List<Integer>"]
            }
        ],
        ent_classes=[
            {
                'name': "Subject", 'stereo': "Entity",
                'attrs': ["- id: Integer", "- subjectCode: String", "- subjectName: String", "- credits: Integer", "- theoryHours: Integer", "- practicalHours: Integer", "- department: Department", "- version: Integer (@Version)"],
                'methods': ["+ getSubjectCode(): String", "+ getCredits(): Integer", "+ getVersion(): Integer"]
            },
            {
                'name': "SubjectResponse", 'stereo': "DTO",
                'attrs': ["- id: Integer", "- subjectCode: String", "- subjectName: String", "- credits: Integer", "- departmentName: String", "- prerequisiteCodes: List<String>", "- version: Integer"],
                'methods': ["+ getPrerequisiteCodes(): List<String>"]
            },
            {
                'name': "SubjectRequest", 'stereo': "DTO",
                'attrs': ["- subjectCode: String", "- subjectName: String", "- credits: Integer", "- departmentId: Integer", "- prerequisiteIds: List<Integer>", "- version: Integer"],
                'methods': ["+ getSubjectCode(): String", "+ getCredits(): Integer"]
            }
        ],
        edges=[
            ("bnd_subjects_1", "bnd_subjects_2", "HTTP POST /api/subjects", False),
            ("bnd_subjects_2", "ctrl_subjects_1", "ủy quyền createSubject()", False),
            ("ctrl_subjects_1", "ctrl_subjects_2", "kiểm tra chu trình DAG", False),
            ("ctrl_subjects_1", "ent_subjects_1", "bền vững hóa thực thể Subject", True),
            ("ctrl_subjects_1", "ent_subjects_2", "chuyển đổi SubjectResponse DTO", True)
        ]
    )

# 08. Cấu hình Học kỳ & Kích hoạt đợt đào tạo
def build_bce_8_semesters():
    return build_single_function_tab(
        func_code="semesters",
        func_title="08. Cấu hình Học kỳ & Kích hoạt đợt đào tạo",
        comp_title="Cấu hình Học kỳ",
        comp_example="SemesterController",
        actor_name="Quản trị viên (Admin)",
        bnd_classes=[
            {
                'name': "SemestersPageView", 'stereo': "Boundary",
                'attrs': ["- semesters: List<Semester>", "- currentSemesterId: Integer", "- isCreateModalOpen: boolean"],
                'methods': ["+ fetchSemesters(): void", "+ handleSetCurrent(id: Integer): void", "+ handleCreateSemester(req: SemesterRequest): void"]
            },
            {
                'name': "SemesterController", 'stereo': "Boundary",
                'attrs': ["- semesterService: SemesterService", "- path: GET/POST/PUT /api/semesters"],
                'methods': ["+ getAll(): ResponseEntity<ApiResponse<List<Semester>>>", "+ create(req: SemesterRequest): ResponseEntity<ApiResponse<Semester>>", "+ setCurrent(id: Integer): ResponseEntity<ApiResponse<Void>>"]
            }
        ],
        ctrl_classes=[
            {
                'name': "SemesterService", 'stereo': "Control",
                'attrs': ["- semesterRepository: SemesterRepository", "- auditLogService: AuditLogService"],
                'methods': ["+ getAllSemesters(): List<Semester>", "+ createSemester(req: SemesterRequest): Semester", "+ setCurrentSemester(id: Integer): void", "+ validateTimeline(start: LocalDate, end: LocalDate): void"]
            },
            {
                'name': "SemesterRepository", 'stereo': "Control",
                'attrs': ["- entityManager: EntityManager"],
                'methods': ["+ findByIsCurrentTrue(): Optional<Semester>", "+ existsBySemesterCode(code: String): boolean", "+ resetAllCurrentFlags(): void"]
            }
        ],
        ent_classes=[
            {
                'name': "Semester", 'stereo': "Entity",
                'attrs': ["- id: Integer", "- semesterCode: String", "- semesterName: String", "- academicYear: String", "- startDate: LocalDate", "- endDate: LocalDate", "- isCurrent: boolean"],
                'methods': ["+ getSemesterCode(): String", "+ isCurrent(): boolean", "+ isWithinTimeline(date: LocalDate): boolean"]
            },
            {
                'name': "SemesterRequest", 'stereo': "DTO",
                'attrs': ["- semesterCode: String", "- semesterName: String", "- academicYear: String", "- startDate: LocalDate", "- endDate: LocalDate", "- isCurrent: boolean"],
                'methods': ["+ getSemesterCode(): String", "+ getStartDate(): LocalDate"]
            }
        ],
        edges=[
            ("bnd_semesters_1", "bnd_semesters_2", "HTTP POST /api/semesters", False),
            ("bnd_semesters_2", "ctrl_semesters_1", "ủy quyền createSemester()", False),
            ("ctrl_semesters_1", "ctrl_semesters_2", "đặt cờ isCurrent & lưu CSDL", False),
            ("ctrl_semesters_2", "ent_semesters_1", "bền vững hóa thực thể Semester", True)
        ]
    )

# 09. Mở mới & Điều phối Lớp học phần
def build_bce_9_course_sections():
    return build_single_function_tab(
        func_code="sections",
        func_title="09. Mở mới & Điều phối Lớp học phần",
        comp_title="Mở lớp Học phần",
        comp_example="CourseSectionController",
        actor_name="Cán bộ Đào tạo / Admin",
        bnd_classes=[
            {
                'name': "CourseSectionsPageView", 'stereo': "Boundary",
                'attrs': ["- sections: List<CourseSection>", "- semesterFilter: Integer", "- subjectFilter: Integer", "- isModalOpen: boolean"],
                'methods': ["+ fetchSections(): void", "+ handleCreateSection(req: CourseSectionRequest): void", "+ handleStatusToggle(id: Long): void"]
            },
            {
                'name': "CourseSectionController", 'stereo': "Boundary",
                'attrs': ["- courseSectionService: CourseSectionService", "- path: GET/POST/PUT /api/course-sections"],
                'methods': ["+ getBySemester(semId: Integer): ResponseEntity<ApiResponse<List<CourseSection>>>", "+ create(req: CourseSectionRequest): ResponseEntity<ApiResponse<CourseSection>>", "+ updateStatus(id: Long, status: String): ResponseEntity<ApiResponse<Void>>"]
            }
        ],
        ctrl_classes=[
            {
                'name': "CourseSectionService", 'stereo': "Control",
                'attrs': ["- courseSectionRepository: CourseSectionRepository", "- subjectRepository: SubjectRepository", "- semesterRepository: SemesterRepository", "- lecturerRepository: LecturerRepository"],
                'methods': ["+ createCourseSection(req: CourseSectionRequest): CourseSection", "+ validateSectionCapacity(capacity: int): void", "+ initializeSectionEnrollmentCount(section: CourseSection): void"]
            },
            {
                'name': "CourseSectionRepository", 'stereo': "Control",
                'attrs': ["- entityManager: EntityManager"],
                'methods': ["+ findBySemesterId(semId: Integer): List<CourseSection>", "+ existsBySectionCode(code: String): boolean", "+ save(section: CourseSection): CourseSection"]
            }
        ],
        ent_classes=[
            {
                'name': "CourseSection", 'stereo': "Entity",
                'attrs': ["- id: Long", "- sectionCode: String", "- subject: Subject", "- semester: Semester", "- lecturer: Lecturer", "- maxCapacity: Integer", "- currentEnrolled: Integer", "- status: SectionStatus", "- version: Integer (@Version)"],
                'methods': ["+ getSectionCode(): String", "+ getAvailableSeats(): int", "+ isFull(): boolean", "+ getVersion(): Integer"]
            },
            {
                'name': "CourseSectionRequest", 'stereo': "DTO",
                'attrs': ["- sectionCode: String", "- subjectId: Integer", "- semesterId: Integer", "- lecturerId: Long", "- maxCapacity: Integer", "- version: Integer"],
                'methods': ["+ getSectionCode(): String", "+ getMaxCapacity(): Integer"]
            }
        ],
        edges=[
            ("bnd_sections_1", "bnd_sections_2", "HTTP POST /api/course-sections", False),
            ("bnd_sections_2", "ctrl_sections_1", "ủy quyền createCourseSection()", False),
            ("ctrl_sections_1", "ctrl_sections_2", "kiểm tra sức chứa & lưu CSDL", False),
            ("ctrl_sections_2", "ent_sections_1", "bền vững hóa thực thể CourseSection", True)
        ]
    )

# 10. Xếp Thời khóa biểu & Chống va chạm phòng/giờ
def build_bce_10_scheduling():
    return build_single_function_tab(
        func_code="scheduling",
        func_title="10. Xếp Thời khóa biểu & Chống va chạm phòng/giờ",
        comp_title="Xếp Thời khóa biểu",
        comp_example="ScheduleController",
        actor_name="Cán bộ Đào tạo / Admin",
        bnd_classes=[
            {
                'name': "SectionScheduleModal", 'stereo': "Boundary",
                'attrs': ["- sectionId: Long", "- dayOfWeek: DayOfWeek", "- startPeriod: int", "- endPeriod: int", "- roomName: String"],
                'methods': ["+ submitSchedule(): void", "+ checkConflictPreview(): void", "+ handleClose(): void"]
            },
            {
                'name': "ScheduleController", 'stereo': "Boundary",
                'attrs': ["- scheduleService: ScheduleService", "- path: POST/PUT/DELETE /api/schedules"],
                'methods': ["+ createSchedule(req: ScheduleRequest): ResponseEntity<ApiResponse<Schedule>>", "+ getBySection(sectionId: Long): ResponseEntity<ApiResponse<List<Schedule>>>", "+ deleteSchedule(id: Long): ResponseEntity<ApiResponse<Void>>"]
            }
        ],
        ctrl_classes=[
            {
                'name': "ScheduleService", 'stereo': "Control",
                'attrs': ["- scheduleRepository: ScheduleRepository", "- courseSectionRepository: CourseSectionRepository", "- auditLogService: AuditLogService"],
                'methods': ["+ createSchedule(req: ScheduleRequest): Schedule", "+ detectRoomAndPeriodConflict(room: String, day: int, start: int, end: int, semId: int): void", "+ detectLecturerConflict(lecId: Long, day: int, start: int, end: int, semId: int): void"]
            },
            {
                'name': "ScheduleRepository", 'stereo': "Control",
                'attrs': ["- entityManager: EntityManager"],
                'methods': ["+ findConflictingSchedules(room: String, day: int, start: int, end: int, semId: int): List<Schedule>", "+ findByCourseSectionId(sectionId: Long): List<Schedule>"]
            }
        ],
        ent_classes=[
            {
                'name': "Schedule", 'stereo': "Entity",
                'attrs': ["- id: Long", "- courseSection: CourseSection", "- dayOfWeek: Integer (2..8)", "- startPeriod: Integer (1..12)", "- endPeriod: Integer (1..12)", "- room: String", "- version: Integer (@Version)"],
                'methods': ["+ overlapsWith(other: Schedule): boolean", "+ getRoom(): String", "+ getCourseSection(): CourseSection"]
            },
            {
                'name': "ScheduleRequest", 'stereo': "DTO",
                'attrs': ["- courseSectionId: Long", "- dayOfWeek: Integer", "- startPeriod: Integer", "- endPeriod: Integer", "- room: String"],
                'methods': ["+ getCourseSectionId(): Long", "+ getRoom(): String"]
            }
        ],
        edges=[
            ("bnd_scheduling_1", "bnd_scheduling_2", "HTTP POST /api/schedules", False),
            ("bnd_scheduling_2", "ctrl_scheduling_1", "ủy quyền createSchedule()", False),
            ("ctrl_scheduling_1", "ctrl_scheduling_2", "quét va chạm phòng và giảng viên", False),
            ("ctrl_scheduling_2", "ent_scheduling_1", "bền vững hóa thực thể Schedule", True)
        ]
    )

# 11. Sinh viên Đăng ký Tín chỉ (Khóa phân tán Redis)
def build_bce_11_enrollment():
    return build_single_function_tab(
        func_code="enroll",
        func_title="11. Sinh viên Đăng ký Tín chỉ (Khóa Redis)",
        comp_title="Đăng ký lớp Học phần",
        comp_example="EnrollmentController",
        actor_name="Sinh viên",
        bnd_classes=[
            {
                'name': "EnrollPageView", 'stereo': "Boundary",
                'attrs': ["- openSections: List<CourseSectionDTO>", "- selectedSectionIds: Set<Long>", "- totalCredits: int", "- isEnrolling: boolean"],
                'methods': ["+ fetchAvailableSections(): void", "+ handleEnroll(sectionId: Long): void", "+ validateCreditLimit(credits: int): boolean"]
            },
            {
                'name': "EnrollmentController", 'stereo': "Boundary",
                'attrs': ["- enrollmentService: EnrollmentService", "- path: POST /api/enrollments"],
                'methods': ["+ enroll(user: UserPrincipal, req: EnrollmentRequest): ResponseEntity<ApiResponse<Enrollment>>"]
            }
        ],
        ctrl_classes=[
            {
                'name': "EnrollmentService", 'stereo': "Control",
                'attrs': ["- enrollmentRepository: EnrollmentRepository", "- redisLockService: RedisLockService", "- prerequisiteEngine: PrerequisiteGraphEngine", "- sectionRepository: CourseSectionRepository"],
                'methods': ["+ enrollCourse(studentId: Long, sectionId: Long): Enrollment", "+ validatePrerequisitesPassed(studentId: Long, subjectId: int): void", "+ validateScheduleNotOverlap(studentId: Long, sectionId: Long): void"]
            },
            {
                'name': "RedisLockService", 'stereo': "Control",
                'attrs': ["- redissonClient: RedissonClient", "- lockTimeoutMs: 5000"],
                'methods': ["+ acquireLock(lockKey: String): boolean", "+ releaseLock(lockKey: String): void"]
            }
        ],
        ent_classes=[
            {
                'name': "Enrollment", 'stereo': "Entity",
                'attrs': ["- id: Long", "- student: Student", "- courseSection: CourseSection", "- enrollmentDate: LocalDateTime", "- status: EnrollmentStatus.ENROLLED"],
                'methods': ["+ getStudent(): Student", "+ getCourseSection(): CourseSection"]
            },
            {
                'name': "CourseSection", 'stereo': "Entity",
                'attrs': ["- id: Long", "- currentEnrolled: Integer", "- maxCapacity: Integer", "- version: Long (@Version)"],
                'methods': ["+ incrementEnrolled(): void", "+ isCapacityFull(): boolean"]
            },
            {
                'name': "EnrollmentRequest", 'stereo': "DTO",
                'attrs': ["- courseSectionId: Long", "- semesterId: Integer"],
                'methods': ["+ getCourseSectionId(): Long"]
            }
        ],
        edges=[
            ("bnd_enroll_1", "bnd_enroll_2", "HTTP POST /api/enrollments", False),
            ("bnd_enroll_2", "ctrl_enroll_1", "ủy quyền enrollCourse()", False),
            ("ctrl_enroll_1", "ctrl_enroll_2", "chiếm giữ Redis Distributed Lock", False),
            ("ctrl_enroll_1", "ent_enroll_1", "lưu bản ghi Enrollment", True),
            ("ctrl_enroll_1", "ent_enroll_2", "tăng sĩ số currentEnrolled +1", True)
        ]
    )

# 12. Hủy Đăng ký Học phần & Hoàn trả sĩ số lớp
def build_bce_12_course_drop():
    return build_single_function_tab(
        func_code="drop",
        func_title="12. Hủy Đăng ký Học phần & Hoàn trả sĩ số",
        comp_title="Hủy đăng ký học phần",
        comp_example="EnrollmentController",
        actor_name="Sinh viên",
        bnd_classes=[
            {
                'name': "MyEnrollmentsPage", 'stereo': "Boundary",
                'attrs': ["- enrolledList: List<EnrollmentDTO>", "- currentSemesterId: Integer", "- confirmDropModal: Modal"],
                'methods': ["+ fetchMyEnrollments(): void", "+ handleDropCourse(enrollmentId: Long): void", "+ confirmDropAction(): void"]
            },
            {
                'name': "EnrollmentController", 'stereo': "Boundary",
                'attrs': ["- enrollmentService: EnrollmentService", "- path: DELETE /api/enrollments/{id}"],
                'methods': ["+ drop(user: UserPrincipal, id: Long): ResponseEntity<ApiResponse<Void>>"]
            }
        ],
        ctrl_classes=[
            {
                'name': "EnrollmentService", 'stereo': "Control",
                'attrs': ["- enrollmentRepository: EnrollmentRepository", "- sectionRepository: CourseSectionRepository", "- registrationWaveService: RegistrationWaveService"],
                'methods': ["+ dropCourse(studentId: Long, enrollmentId: Long): void", "+ validateDropWaveActive(semesterId: int): void", "+ decrementSectionEnrolledCount(sectionId: Long): void"]
            },
            {
                'name': "CourseSectionRepository", 'stereo': "Control",
                'attrs': ["- entityManager: EntityManager"],
                'methods': ["+ decrementEnrolledSeats(sectionId: Long): int", "+ findById(id: Long): Optional<CourseSection>"]
            }
        ],
        ent_classes=[
            {
                'name': "Enrollment", 'stereo': "Entity",
                'attrs': ["- id: Long", "- status: EnrollmentStatus.DROPPED", "- droppedAt: LocalDateTime"],
                'methods': ["+ markAsDropped(): void", "+ getStatus(): EnrollmentStatus"]
            },
            {
                'name': "CourseSection", 'stereo': "Entity",
                'attrs': ["- id: Long", "- currentEnrolled: Integer", "- maxCapacity: Integer"],
                'methods': ["+ decrementEnrolled(): void"]
            }
        ],
        edges=[
            ("bnd_drop_1", "bnd_drop_2", "HTTP DELETE /api/enrollments/{id}", False),
            ("bnd_drop_2", "ctrl_drop_1", "ủy quyền dropCourse()", False),
            ("ctrl_drop_1", "ctrl_drop_2", "hoàn trả 1 chỗ trống sĩ số lớp", False),
            ("ctrl_drop_1", "ent_drop_1", "cập nhật trạng thái DROPPED", True),
            ("ctrl_drop_2", "ent_drop_2", "giảm currentEnrolled -1", True)
        ]
    )

# 13. Giảng viên Nhập điểm thành phần & Tính GPA
def build_bce_13_grading_entry():
    return build_single_function_tab(
        func_code="grd_entry",
        func_title="13. Giảng viên Nhập điểm thành phần & Tính GPA",
        comp_title="Nhập điểm học phần",
        comp_example="GradeController",
        actor_name="Giảng viên",
        bnd_classes=[
            {
                'name': "GradeEntryPageView", 'stereo': "Boundary",
                'attrs': ["- studentGrades: List<GradeRowDTO>", "- sectionId: Long", "- isFinalized: boolean", "- isSaving: boolean"],
                'methods': ["+ fetchSectionGrades(sectionId: Long): void", "+ handleCellChange(studentId: Long, col: String, val: Double): void", "+ handleSaveDraft(): void"]
            },
            {
                'name': "GradeController", 'stereo': "Boundary",
                'attrs': ["- gradeService: GradeService", "- path: POST/PUT /api/grades"],
                'methods': ["+ saveGrades(user: UserPrincipal, req: GradeEntryRequest): ResponseEntity<ApiResponse<Void>>", "+ getBySection(sectionId: Long): ResponseEntity<ApiResponse<List<GradeDTO>>>"]
            }
        ],
        ctrl_classes=[
            {
                'name': "GradeService", 'stereo': "Control",
                'attrs': ["- gradeRepository: GradeRepository", "- courseSectionRepository: CourseSectionRepository", "- gradeCalculationEngine: GradeCalculationEngine"],
                'methods': ["+ saveDraftGrades(sectionId: Long, grades: List<GradeItemDTO>): void", "+ calculateCompositeGrade(att: Double, mid: Double, fin: Double): Double", "+ convertToGradeLetterAndFourScale(total10: Double): GradeScalePair"]
            },
            {
                'name': "GradeRepository", 'stereo': "Control",
                'attrs': ["- entityManager: EntityManager"],
                'methods': ["+ findByCourseSectionId(sectionId: Long): List<Grade>", "+ findByEnrollmentId(enrollmentId: Long): Optional<Grade>", "+ saveAll(grades: List<Grade>): List<Grade>"]
            }
        ],
        ent_classes=[
            {
                'name': "Grade", 'stereo': "Entity",
                'attrs': ["- id: Long", "- enrollment: Enrollment", "- attendanceScore: Double", "- midtermScore: Double", "- finalExamScore: Double", "- totalScore10: Double", "- totalScore4: Double", "- letterGrade: String", "- isFinalized: boolean"],
                'methods': ["+ computeFinalScores(): void", "+ getLetterGrade(): String"]
            },
            {
                'name': "GradeEntryRequest", 'stereo': "DTO",
                'attrs': ["- courseSectionId: Long", "- grades: List<StudentGradeInputDTO>"],
                'methods': ["+ getCourseSectionId(): Long", "+ getGrades(): List<StudentGradeInputDTO>"]
            }
        ],
        edges=[
            ("bnd_grd_entry_1", "bnd_grd_entry_2", "HTTP POST /api/grades", False),
            ("bnd_grd_entry_2", "ctrl_grd_entry_1", "ủy quyền saveDraftGrades()", False),
            ("ctrl_grd_entry_1", "ctrl_grd_entry_2", "tính điểm hệ 4 và lưu CSDL", False),
            ("ctrl_grd_entry_2", "ent_grd_entry_1", "bền vững hóa thực thể Grade", True)
        ]
    )

# 14. Chốt Sổ điểm & Cửa sổ ân hạn sửa điểm 7 ngày
def build_bce_14_grading_finalize():
    return build_single_function_tab(
        func_code="grd_finalize",
        func_title="14. Chốt Sổ điểm & Cửa sổ ân hạn 7 ngày",
        comp_title="Chốt bảng điểm học phần",
        comp_example="GradeController",
        actor_name="Giảng viên & Admin",
        bnd_classes=[
            {
                'name': "FinalizeConfirmModal", 'stereo': "Boundary",
                'attrs': ["- sectionId: Long", "- verificationCode: String", "- confirmationChecked: boolean"],
                'methods': ["+ openFinalizeModal(): void", "+ handleConfirmFinalize(): void", "+ showSuccessNotification(): void"]
            },
            {
                'name': "GradeController", 'stereo': "Boundary",
                'attrs': ["- gradeService: GradeService", "- path: PUT /api/grades/sections/{id}/finalize"],
                'methods': ["+ finalizeSectionGrades(id: Long, user: UserPrincipal): ResponseEntity<ApiResponse<Void>>"]
            }
        ],
        ctrl_classes=[
            {
                'name': "GradeService", 'stereo': "Control",
                'attrs': ["- gradeRepository: GradeRepository", "- courseSectionRepository: CourseSectionRepository", "- auditLogService: AuditLogService"],
                'methods': ["+ finalizeGrades(sectionId: Long, lecturerId: Long): void", "+ validateAllScoresPresent(sectionId: Long): void", "+ recordGradeFinalizeAudit(sectionId: Long, userId: Long): void"]
            },
            {
                'name': "AuditLogService", 'stereo': "Control",
                'attrs': ["- auditLogRepository: AuditLogRepository"],
                'methods': ["+ logEvent(action: String, entityId: String, performedBy: String, details: String): void"]
            }
        ],
        ent_classes=[
            {
                'name': "Grade", 'stereo': "Entity",
                'attrs': ["- id: Long", "- isFinalized: true", "- finalizedAt: LocalDateTime", "- amendmentGracePeriodEnd: LocalDateTime (7 days)"],
                'methods': ["+ setFinalized(flag: boolean): void", "+ isWithinGracePeriod(): boolean"]
            },
            {
                'name': "GradeAuditLog", 'stereo': "Entity",
                'attrs': ["- id: Long", "- courseSectionId: Long", "- action: String (FINALIZE_SECTION_GRADES)", "- operatorId: Long", "- timestamp: LocalDateTime"],
                'methods': ["+ getAction(): String", "+ getTimestamp(): LocalDateTime"]
            }
        ],
        edges=[
            ("bnd_grd_finalize_1", "bnd_grd_finalize_2", "HTTP PUT /api/grades/sections/{id}/finalize", False),
            ("bnd_grd_finalize_2", "ctrl_grd_finalize_1", "ủy quyền finalizeGrades()", False),
            ("ctrl_grd_finalize_1", "ctrl_grd_finalize_2", "ghi log kiểm toán đóng sổ", False),
            ("ctrl_grd_finalize_1", "ent_grd_finalize_1", "khóa isFinalized=true và mốc 7 ngày", True),
            ("ctrl_grd_finalize_2", "ent_grd_finalize_2", "lưu nhật ký kiểm toán GradeAuditLog", True)
        ]
    )

# 15. Tra cứu Bảng điểm, Tiến độ CTĐT & Điểm CPA
def build_bce_15_transcript_cpa():
    return build_single_function_tab(
        func_code="transcript",
        func_title="15. Tra cứu Bảng điểm & Điểm CPA",
        comp_title="Bảng điểm & CPA",
        comp_example="TranscriptController",
        actor_name="Sinh viên",
        bnd_classes=[
            {
                'name': "TranscriptPageView", 'stereo': "Boundary",
                'attrs': ["- transcriptData: TranscriptResponse", "- gpaBySemester: List<SemesterGpaDTO>", "- cumulativeCpa: Double", "- totalCreditsEarned: int"],
                'methods': ["+ fetchMyTranscript(): void", "+ calculateGpaOverview(): void", "+ handleExportPdf(): void"]
            },
            {
                'name': "TranscriptController", 'stereo': "Boundary",
                'attrs': ["- transcriptService: TranscriptService", "- path: GET /api/transcripts/me"],
                'methods': ["+ getMyTranscript(user: UserPrincipal): ResponseEntity<ApiResponse<TranscriptResponse>>", "+ getStudentTranscript(studentId: Long): ResponseEntity<ApiResponse<TranscriptResponse>>"]
            }
        ],
        ctrl_classes=[
            {
                'name': "TranscriptService", 'stereo': "Control",
                'attrs': ["- gradeRepository: GradeRepository", "- studentRepository: StudentRepository", "- degreeAuditEngine: DegreeAuditEngine"],
                'methods': ["+ getStudentTranscript(studentId: Long): TranscriptResponse", "+ computeSemesterGpa(grades: List<Grade>): Double", "+ computeCumulativeCpa(allGrades: List<Grade>): Double"]
            },
            {
                'name': "DegreeAuditEngine", 'stereo': "Control",
                'attrs': ["- curriculumRepository: CurriculumRepository"],
                'methods': ["+ calculateEarnedCredits(grades: List<Grade>): int", "+ evaluateCurriculumProgress(studentId: Long): CurriculumProgressDTO"]
            }
        ],
        ent_classes=[
            {
                'name': "TranscriptResponse", 'stereo': "DTO",
                'attrs': ["- studentCode: String", "- fullName: String", "- cpa: Double", "- totalCredits: Integer", "- semesters: List<SemesterTranscriptDTO>"],
                'methods': ["+ getCpa(): Double", "+ getTotalCredits(): Integer"]
            },
            {
                'name': "Grade", 'stereo': "Entity",
                'attrs': ["- id: Long", "- totalScore4: Double", "- letterGrade: String", "- isFinalized: boolean"],
                'methods': ["+ isPassed(): boolean", "+ getTotalScore4(): Double"]
            }
        ],
        edges=[
            ("bnd_transcript_1", "bnd_transcript_2", "HTTP GET /api/transcripts/me", False),
            ("bnd_transcript_2", "ctrl_transcript_1", "ủy quyền getStudentTranscript()", False),
            ("ctrl_transcript_1", "ctrl_transcript_2", "tính toán tín chỉ tích lũy & CPA", False),
            ("ctrl_transcript_1", "ent_transcript_2", "truy vấn điểm đã chốt sổ (Grade)", True),
            ("ctrl_transcript_1", "ent_transcript_1", "đóng gói DTO TranscriptResponse", True)
        ]
    )

# 16. Báo cáo Thống kê Toàn trường, Cảnh báo học vụ
def build_bce_16_analytics_dashboard():
    return build_single_function_tab(
        func_code="dashboard",
        func_title="16. Báo cáo Thống kê & Dashboard",
        comp_title="Bảng điều khiển Thống kê",
        comp_example="DashboardController",
        actor_name="Quản trị viên (Admin)",
        bnd_classes=[
            {
                'name': "DashboardPageView", 'stereo': "Boundary",
                'attrs': ["- kpiStats: DashboardResponse", "- studentDistribution: ChartData", "- enrollmentTrends: ChartData", "- isLoading: boolean"],
                'methods': ["+ loadDashboardData(): void", "+ renderDepartmentCharts(): void", "+ exportStatisticsReport(): void"]
            },
            {
                'name': "DashboardController", 'stereo': "Boundary",
                'attrs': ["- dashboardService: DashboardService", "- path: GET /api/dashboard"],
                'methods': ["+ getDashboard(): ResponseEntity<ApiResponse<DashboardResponse>>"]
            }
        ],
        ctrl_classes=[
            {
                'name': "DashboardService", 'stereo': "Control",
                'attrs': ["- studentRepository: StudentRepository", "- lecturerRepository: LecturerRepository", "- enrollmentRepository: EnrollmentRepository", "- warningService: AcademicWarningService"],
                'methods': ["+ getAggregatedDashboardData(): DashboardResponse", "+ computeTotalActiveStudents(): long", "+ getAcademicWarningStats(): WarningStatsDTO"]
            },
            {
                'name': "AcademicWarningService", 'stereo': "Control",
                'attrs': ["- warningRepository: AcademicWarningRepository"],
                'methods': ["+ scanStudentsAtAcademicRisk(semesterId: int): List<AcademicWarning>", "+ generateWarningReport(): WarningSummaryDTO"]
            }
        ],
        ent_classes=[
            {
                'name': "DashboardResponse", 'stereo': "DTO",
                'attrs': ["- totalStudents: Long", "- totalLecturers: Long", "- totalCourseSections: Long", "- totalRevenue: BigDecimal", "- warningsCount: Integer"],
                'methods': ["+ getTotalStudents(): Long", "+ getTotalRevenue(): BigDecimal"]
            },
            {
                'name': "AcademicWarning", 'stereo': "Entity",
                'attrs': ["- id: Long", "- student: Student", "- semester: Semester", "- warningLevel: Integer (1..3)", "- currentCpa: Double", "- noticeDate: LocalDate"],
                'methods': ["+ getWarningLevel(): Integer", "+ getStudent(): Student"]
            }
        ],
        edges=[
            ("bnd_dashboard_1", "bnd_dashboard_2", "HTTP GET /api/dashboard", False),
            ("bnd_dashboard_2", "ctrl_dashboard_1", "ủy quyền getDashboardData()", False),
            ("ctrl_dashboard_1", "ctrl_dashboard_2", "quét sinh viên diện cảnh báo học vụ", False),
            ("ctrl_dashboard_2", "ent_dashboard_2", "truy vấn thực thể AcademicWarning", True),
            ("ctrl_dashboard_1", "ent_dashboard_1", "đóng gói DTO DashboardResponse", True)
        ]
    )

# 17. Quản lý Tài chính & Thu học phí theo tín chỉ
def build_bce_17_tuition_management():
    return build_single_function_tab(
        func_code="tuition",
        func_title="17. Quản lý Tài chính & Thu học phí",
        comp_title="Quản lý Tài chính & Thu học phí",
        comp_example="TuitionController",
        actor_name="Thu ngân / Admin",
        bnd_classes=[
            {
                'name': "TuitionCashierPage", 'stereo': "Boundary",
                'attrs': ["- studentSearch: String", "- activeInvoice: StudentInvoice", "- paymentAmount: BigDecimal", "- paymentMethod: PaymentMethod"],
                'methods': ["+ searchStudentInvoice(code: String): void", "+ handleCollectCash(): void", "+ handlePrintReceipt(receiptId: Long): void"]
            },
            {
                'name': "TuitionController", 'stereo': "Boundary",
                'attrs': ["- tuitionService: TuitionService", "- path: GET/POST /api/tuition"],
                'methods': ["+ getStudentTuition(studentId: Long): ResponseEntity<ApiResponse<TuitionSummaryResponse>>", "+ collectCash(req: CashPaymentRequest): ResponseEntity<ApiResponse<ReceiptResponse>>"]
            }
        ],
        ctrl_classes=[
            {
                'name': "TuitionService", 'stereo': "Control",
                'attrs': ["- studentInvoiceRepository: StudentInvoiceRepository", "- enrollmentRepository: EnrollmentRepository", "- feeScaleRuleRepository: FeeScaleRuleRepository"],
                'methods': ["+ calculateTuitionForSemester(studentId: Long, semesterId: int): StudentInvoice", "+ collectTuitionPayment(invoiceId: Long, amount: BigDecimal, cashierId: Long): ReceiptResponse"]
            },
            {
                'name': "StudentInvoiceRepository", 'stereo': "Control",
                'attrs': ["- entityManager: EntityManager"],
                'methods': ["+ findByStudentIdAndSemesterId(studentId: Long, semId: int): Optional<StudentInvoice>", "+ save(invoice: StudentInvoice): StudentInvoice"]
            }
        ],
        ent_classes=[
            {
                'name': "StudentInvoice", 'stereo': "Entity",
                'attrs': ["- id: Long", "- student: Student", "- semester: Semester", "- totalCredits: Integer", "- totalAmount: BigDecimal", "- paidAmount: BigDecimal", "- balanceAmount: BigDecimal", "- status: InvoiceStatus"],
                'methods': ["+ recordPayment(amount: BigDecimal): void", "+ isFullyPaid(): boolean"]
            },
            {
                'name': "ReceiptResponse", 'stereo': "DTO",
                'attrs': ["- receiptNumber: String", "- studentCode: String", "- amountPaid: BigDecimal", "- remainingBalance: BigDecimal", "- transactionTime: LocalDateTime"],
                'methods': ["+ getReceiptNumber(): String", "+ getAmountPaid(): BigDecimal"]
            }
        ],
        edges=[
            ("bnd_tuition_1", "bnd_tuition_2", "HTTP POST /api/tuition/collect-cash", False),
            ("bnd_tuition_2", "ctrl_tuition_1", "ủy quyền collectTuitionPayment()", False),
            ("ctrl_tuition_1", "ctrl_tuition_2", "lưu giao dịch thu học phí", False),
            ("ctrl_tuition_2", "ent_tuition_1", "cập nhật công nợ StudentInvoice", True),
            ("ctrl_tuition_1", "ent_tuition_2", "xuất biên lai ReceiptResponse DTO", True)
        ]
    )

# 18. Điểm danh lớp học trực tiếp qua mã PIN 6 số
def build_bce_18_live_attendance():
    return build_single_function_tab(
        func_code="attendance",
        func_title="18. Điểm danh Lớp học Trực tiếp PIN 6 số",
        comp_title="Quản lý Chuyên cần & Điểm danh trực tiếp",
        comp_example="AttendanceController",
        actor_name="Giảng viên & Sinh viên",
        bnd_classes=[
            {
                'name': "LecturerAttendancePage", 'stereo': "Boundary",
                'attrs': ["- activeSession: AttendanceLiveSessionResponse", "- pinCode: String", "- checkedInStudents: List<AttendanceRecord>", "- isLive: boolean"],
                'methods': ["+ handleStartLiveSession(sectionId: Long): void", "+ handleCloseSession(): void", "+ handleManualCheckIn(studentId: Long): void"]
            },
            {
                'name': "AttendanceController", 'stereo': "Boundary",
                'attrs': ["- attendanceService: AttendanceService", "- path: POST /api/attendance/session/start, POST /api/attendance/check-in"],
                'methods': ["+ startSession(req: AttendanceStartRequest): ResponseEntity<ApiResponse<AttendanceLiveSessionResponse>>", "+ checkIn(req: CheckInRequest): ResponseEntity<ApiResponse<Map<String, Object>>>"]
            }
        ],
        ctrl_classes=[
            {
                'name': "AttendanceService", 'stereo': "Control",
                'attrs': ["- sessionRepository: AttendanceSessionRepository", "- recordRepository: AttendanceRecordRepository", "- enrollmentRepository: EnrollmentRepository"],
                'methods': ["+ createLiveSession(sectionId: Long, durationMins: int): AttendanceSession", "+ verifyPinAndCheckIn(studentId: Long, sessionId: Long, pin: String): AttendanceRecord", "+ generateRandom6DigitPin(): String"]
            },
            {
                'name': "AttendanceSessionRepository", 'stereo': "Control",
                'attrs': ["- entityManager: EntityManager"],
                'methods': ["+ findActiveSessionBySection(sectionId: Long): Optional<AttendanceSession>", "+ save(session: AttendanceSession): AttendanceSession"]
            }
        ],
        ent_classes=[
            {
                'name': "AttendanceSession", 'stereo': "Entity",
                'attrs': ["- id: Long", "- courseSection: CourseSection", "- sessionDate: LocalDate", "- pinCode: String (6 digits)", "- expiresAt: LocalDateTime", "- isActive: boolean"],
                'methods': ["+ isExpired(): boolean", "+ validatePin(inputPin: String): boolean"]
            },
            {
                'name': "AttendanceRecord", 'stereo': "Entity",
                'attrs': ["- id: Long", "- session: AttendanceSession", "- student: Student", "- checkInTime: LocalDateTime", "- status: AttendanceStatus (PRESENT/LATE/ABSENT)"],
                'methods': ["+ getStatus(): AttendanceStatus", "+ getCheckInTime(): LocalDateTime"]
            }
        ],
        edges=[
            ("bnd_attendance_1", "bnd_attendance_2", "HTTP POST /api/attendance/check-in", False),
            ("bnd_attendance_2", "ctrl_attendance_1", "ủy quyền verifyPinAndCheckIn()", False),
            ("ctrl_attendance_1", "ctrl_attendance_2", "kiểm tra phiên & PIN hợp lệ", False),
            ("ctrl_attendance_2", "ent_attendance_1", "xác thực thực thể AttendanceSession", True),
            ("ctrl_attendance_1", "ent_attendance_2", "lưu bản ghi AttendanceRecord", True)
        ]
    )

# 19. Khảo thí & Tự động phân bổ phòng thi
def build_bce_19_exam_management():
    return build_single_function_tab(
        func_code="exam",
        func_title="19. Khảo thí & Tự động phân bổ phòng thi",
        comp_title="Khảo thí & Phân bổ phòng thi",
        comp_example="ExamController",
        actor_name="Cán bộ Khảo thí / Admin",
        bnd_classes=[
            {
                'name': "ExamRoomsPage", 'stereo': "Boundary",
                'attrs': ["- examSessions: List<ExamSessionResponse>", "- selectedSessionId: Long", "- roomList: List<ExamRoomResponse>", "- isGenerateModalOpen: boolean"],
                'methods': ["+ fetchExamSessions(): void", "+ handleAutoAllocateRooms(sessionId: Long): void", "+ handlePrintExamRoster(roomId: Long): void"]
            },
            {
                'name': "ExamController", 'stereo': "Boundary",
                'attrs': ["- examService: ExamService", "- path: POST /api/exam/exam-sessions, POST /api/exam/exam-sessions/{id}/rooms"],
                'methods': ["+ createSession(req: ExamSessionRequest): ResponseEntity<ApiResponse<ExamSessionResponse>>", "+ createRoom(sessionId: Long, req: ExamRoomRequest): ResponseEntity<ApiResponse<ExamRoomResponse>>", "+ getRoomsBySession(sessionId: Long): ResponseEntity<ApiResponse<List<ExamRoomResponse>>>"]
            }
        ],
        ctrl_classes=[
            {
                'name': "ExamService", 'stereo': "Control",
                'attrs': ["- examSessionRepository: ExamSessionRepository", "- examRoomRepository: ExamRoomRepository", "- examRosterRepository: ExamRosterRepository"],
                'methods': ["+ createExamSession(req: ExamSessionRequest): ExamSession", "+ autoAssignStudentsToRooms(sessionId: Long, capacity: int): List<ExamRoom>", "+ generateExamRoster(roomId: Long): ExamRosterResponse"]
            },
            {
                'name': "ExamRoomRepository", 'stereo': "Control",
                'attrs': ["- entityManager: EntityManager"],
                'methods': ["+ findByExamSessionId(sessionId: Long): List<ExamRoom>", "+ save(room: ExamRoom): ExamRoom"]
            }
        ],
        ent_classes=[
            {
                'name': "ExamSession", 'stereo': "Entity",
                'attrs': ["- id: Long", "- subject: Subject", "- semester: Semester", "- examDate: LocalDate", "- startTime: LocalTime", "- examType: ExamType"],
                'methods': ["+ getExamDate(): LocalDate", "+ getSubject(): Subject"]
            },
            {
                'name': "ExamRoom", 'stereo': "Entity",
                'attrs': ["- id: Long", "- examSession: ExamSession", "- roomName: String", "- maxSeats: Integer", "- assignedStudentsCount: Integer", "- status: ExamRoomStatus"],
                'methods': ["+ getRoomName(): String", "+ isFull(): boolean"]
            },
            {
                'name': "ExamRoomResponse", 'stereo': "DTO",
                'attrs': ["- id: Long", "- roomName: String", "- maxSeats: Integer", "- enrolledCount: Integer", "- examDate: LocalDate", "- startTime: String"],
                'methods': ["+ getRoomName(): String"]
            }
        ],
        edges=[
            ("bnd_exam_1", "bnd_exam_2", "HTTP POST /api/exam/exam-sessions/{id}/rooms", False),
            ("bnd_exam_2", "ctrl_exam_1", "ủy quyền autoAssignStudentsToRooms()", False),
            ("ctrl_exam_1", "ctrl_exam_2", "phân bổ danh sách thí sinh vào phòng thi", False),
            ("ctrl_exam_1", "ent_exam_1", "liên kết đợt thi ExamSession", True),
            ("ctrl_exam_2", "ent_exam_2", "bền vững hóa thực thể ExamRoom", True)
        ]
    )

# 20. Thẩm định Quy trình Đính chính điểm 3 cấp
def build_bce_20_grade_amendment():
    return build_single_function_tab(
        func_code="amendment",
        func_title="20. Quy trình Đính chính điểm 3 cấp",
        comp_title="Đính chính điểm & Kiểm toán số liệu",
        comp_example="GradeAmendmentController",
        actor_name="Giảng viên & Trưởng BM & P.ĐT",
        bnd_classes=[
            {
                'name': "GradeAmendmentsPage", 'stereo': "Boundary",
                'attrs': ["- amendmentTickets: List<GradeAmendmentResponse>", "- statusFilter: TicketStatus", "- reviewModalTicket: GradeAmendmentResponse", "- isReviewing: boolean"],
                'methods': ["+ fetchAmendmentTickets(): void", "+ handleDeptReview(id: Long, approved: boolean): void", "+ handleAcademicApproval(id: Long, approved: boolean): void"]
            },
            {
                'name': "GradeAmendmentController", 'stereo': "Boundary",
                'attrs': ["- amendmentService: GradeAmendmentService", "- path: POST/PUT /api/grade-amendments"],
                'methods': ["+ create(req: CreateAmendmentRequest): ResponseEntity<ApiResponse<GradeAmendmentResponse>>", "+ deptReview(id: Long, req: DeptReviewRequest): ResponseEntity<ApiResponse<GradeAmendmentResponse>>", "+ academicApproval(id: Long, req: AcademicApprovalRequest): ResponseEntity<ApiResponse<GradeAmendmentResponse>>"]
            }
        ],
        ctrl_classes=[
            {
                'name': "GradeAmendmentService", 'stereo': "Control",
                'attrs': ["- auditLogRepository: GradeAuditLogRepository", "- gradeRepository: GradeRepository", "- auditLogService: AuditLogService"],
                'methods': ["+ createAmendmentTicket(req: CreateAmendmentRequest, lecId: Long): GradeChangeTicket", "+ reviewByDeptHead(id: Long, headId: Long, approve: boolean, note: String): void", "+ approveByAcademicAffairs(id: Long, officerId: Long, approve: boolean): void", "+ applyNewScoreToGradeEntity(gradeId: Long, score: Double): void"]
            },
            {
                'name': "GradeAuditLogRepository", 'stereo': "Control",
                'attrs': ["- entityManager: EntityManager"],
                'methods': ["+ findByTicketId(ticketId: Long): List<GradeAuditLog>", "+ save(log: GradeAuditLog): GradeAuditLog"]
            }
        ],
        ent_classes=[
            {
                'name': "GradeChangeTicket", 'stereo': "Entity",
                'attrs': ["- id: Long", "- grade: Grade", "- oldScore: Double", "- newScore: Double", "- reason: String", "- status: AmendmentStatus (PENDING_DEPT/PENDING_ACADEMIC/APPROVED/REJECTED)"],
                'methods': ["+ approveByDept(): void", "+ approveByAcademic(): void", "+ getStatus(): AmendmentStatus"]
            },
            {
                'name': "GradeAuditLog", 'stereo': "Entity",
                'attrs': ["- id: Long", "- ticketId: Long", "- action: String (DEPT_APPROVE/ACADEMIC_APPROVE)", "- actorId: Long", "- timestamp: LocalDateTime"],
                'methods': ["+ getAction(): String", "+ getTimestamp(): LocalDateTime"]
            },
            {
                'name': "GradeAmendmentResponse", 'stereo': "DTO",
                'attrs': ["- id: Long", "- studentCode: String", "- studentName: String", "- subjectName: String", "- oldScore: Double", "- newScore: Double", "- status: String"],
                'methods': ["+ getStatus(): String", "+ getNewScore(): Double"]
            }
        ],
        edges=[
            ("bnd_amendment_1", "bnd_amendment_2", "HTTP PUT /api/grade-amendments/{id}/academic-approval", False),
            ("bnd_amendment_2", "ctrl_amendment_1", "ủy quyền approveByAcademicAffairs()", False),
            ("ctrl_amendment_1", "ctrl_amendment_2", "ghi log kiểm toán phê duyệt 3 cấp", False),
            ("ctrl_amendment_1", "ent_amendment_1", "cập nhật trạng thái phiếu GradeChangeTicket", True),
            ("ctrl_amendment_2", "ent_amendment_2", "lưu nhật ký vết duyệt GradeAuditLog", True)
        ]
    )

# 21. Thẩm định chuẩn tốt nghiệp đa tiêu chí TT08
def build_bce_21_graduation_audit():
    return build_single_function_tab(
        func_code="graduation",
        func_title="21. Thẩm định Chuẩn tốt nghiệp đa tiêu chí TT08",
        comp_title="Thẩm định tốt nghiệp & Cấp bằng",
        comp_example="GraduationController",
        actor_name="Cán bộ Đào tạo / Sinh viên",
        bnd_classes=[
            {
                'name': "GraduationPageView", 'stereo': "Boundary",
                'attrs': ["- cohortFilter: Integer", "- evaluationResults: List<GraduationRecord>", "- isEvaluating: boolean", "- selectedRecord: GraduationRecord"],
                'methods': ["+ handleEvaluateCohort(cohortId: Integer): void", "+ handleBatchApprove(cohortId: Integer): void", "+ handleExportGraduationDecision(): void"]
            },
            {
                'name': "GraduationController", 'stereo': "Boundary",
                'attrs': ["- graduationService: GraduationService", "- path: POST /api/graduation/evaluate-cohort/{cohortId}"],
                'methods': ["+ evaluateCohort(cohortId: Integer): ResponseEntity<ApiResponse<List<GraduationRecord>>>", "+ batchApprove(cohortId: Integer): ResponseEntity<ApiResponse<List<GraduationRecord>>>", "+ approveRecord(recordId: Long): ResponseEntity<ApiResponse<GraduationRecord>>"]
            }
        ],
        ctrl_classes=[
            {
                'name': "GraduationService", 'stereo': "Control",
                'attrs': ["- graduationRecordRepository: GraduationRecordRepository", "- degreeAuditEngine: DegreeAuditEngine", "- academicSummaryRepository: AcademicSummaryRepository"],
                'methods': ["+ evaluateCohortGraduation(cohortId: Integer): List<GraduationRecord>", "+ evaluateSingleStudentEligibility(studentId: Long): DegreeAuditResultDTO", "+ batchApproveGraduation(cohortId: Integer): List<GraduationRecord>"]
            },
            {
                'name': "DegreeAuditEngine", 'stereo': "Control",
                'attrs': ["- curriculumProgramRepository: CurriculumProgramRepository", "- gradeRepository: GradeRepository"],
                'methods': ["+ checkTotalEarnedCredits(studentId: Long, minCredits: int): boolean", "+ checkCpaThreshold(cpa: Double, minCpa: Double): boolean", "+ checkDisciplineAndConduct(studentId: Long): boolean"]
            }
        ],
        ent_classes=[
            {
                'name': "GraduationRecord", 'stereo': "Entity",
                'attrs': ["- id: Long", "- student: Student", "- cohort: Cohort", "- totalCreditsEarned: Integer", "- finalCpa: Double", "- graduationRank: GraduationRank", "- status: GraduationStatus"],
                'methods': ["+ isEligible(): boolean", "+ getGraduationRank(): GraduationRank"]
            },
            {
                'name': "AcademicSummary", 'stereo': "Entity",
                'attrs': ["- id: Long", "- student: Student", "- cumulativeCredits: Integer", "- cumulativeCpa: Double", "- academicStanding: String"],
                'methods': ["+ getCumulativeCpa(): Double", "+ getCumulativeCredits(): Integer"]
            },
            {
                'name': "DegreeAuditResultDTO", 'stereo': "DTO",
                'attrs': ["- studentId: Long", "- isEligible: boolean", "- earnedCredits: int", "- requiredCredits: int", "- cpa: Double", "- missingSubjectCodes: List<String>"],
                'methods': ["+ isEligible(): boolean", "+ getMissingSubjectCodes(): List<String>"]
            }
        ],
        edges=[
            ("bnd_graduation_1", "bnd_graduation_2", "HTTP POST /api/graduation/evaluate-cohort/{id}", False),
            ("bnd_graduation_2", "ctrl_graduation_1", "ủy quyền evaluateCohortGraduation()", False),
            ("ctrl_graduation_1", "ctrl_graduation_2", "thẩm định điều kiện tốt nghiệp TT08", False),
            ("ctrl_graduation_1", "ent_graduation_1", "lưu hồ sơ xét tốt nghiệp GraduationRecord", True),
            ("ctrl_graduation_1", "ent_graduation_2", "truy vấn dữ liệu tổng hợp AcademicSummary", True)
        ]
    )

# 22. Quản lý Nhân sự Đào tạo & Phân quyền cán bộ
def build_bce_22_staff_management():
    return build_single_function_tab(
        func_code="staff",
        func_title="22. Quản lý Nhân sự Đào tạo & Phân quyền cán bộ",
        comp_title="Quản trị nhân sự & Chuyên viên đào tạo",
        comp_example="AdminSystemController",
        actor_name="Quản trị viên (Admin)",
        bnd_classes=[
            {
                'name': "StaffsPageView", 'stereo': "Boundary",
                'attrs': ["- staffList: List<StaffResponse>", "- searchKeyword: String", "- roleFilter: String", "- isCreateModalOpen: boolean"],
                'methods': ["+ fetchStaffList(): void", "+ handleCreateStaff(req: CreateStaffRequest): void", "+ handleUpdateStaff(id: Long, req: UpdateStaffRequest): void", "+ handleToggleStatus(id: Long): void"]
            },
            {
                'name': "AdminSystemController", 'stereo': "Boundary",
                'attrs': ["- userService: UserService", "- passwordResetService: PasswordResetService", "- path: GET/POST/PUT /api/admin/staffs"],
                'methods': ["+ getAllStaffs(): ResponseEntity<ApiResponse<List<StaffResponse>>>", "+ createStaff(req: CreateStaffRequest): ResponseEntity<ApiResponse<StaffResponse>>", "+ updateStaff(id: Long, req: UpdateStaffRequest): ResponseEntity<ApiResponse<StaffResponse>>", "+ resetStaffPassword(id: Long): ResponseEntity<ApiResponse<Map<String, String>>>"]
            }
        ],
        ctrl_classes=[
            {
                'name': "UserService", 'stereo': "Control",
                'attrs': ["- userRepository: UserRepository", "- passwordEncoder: PasswordEncoder", "- auditLogService: AuditLogService"],
                'methods': ["+ createStaffAccount(req: CreateStaffRequest): StaffResponse", "+ updateStaffProfile(id: Long, req: UpdateStaffRequest): StaffResponse", "+ toggleStaffActiveStatus(id: Long): boolean", "+ validateEmailNotDuplicate(email: String): void"]
            },
            {
                'name': "UserRepository", 'stereo': "Control",
                'attrs': ["- entityManager: EntityManager"],
                'methods': ["+ findByRoleIn(roles: List<Role>): List<User>", "+ findByEmail(email: String): Optional<User>", "+ save(user: User): User"]
            }
        ],
        ent_classes=[
            {
                'name': "User", 'stereo': "Entity",
                'attrs': ["- id: Long", "- username: String", "- email: String", "- fullName: String", "- dateOfBirth: LocalDate", "- role: Role (ADMIN / ACADEMIC_AFFAIRS / ACADEMIC_STAFF / EXAM)", "- department: Department (Khoa phụ trách)", "- isActive: boolean"],
                'methods': ["+ getRole(): Role", "+ getDepartment(): Department", "+ isAccountNonLocked(): boolean"]
            },
            {
                'name': "StaffResponse", 'stereo': "DTO",
                'attrs': ["- id: Long", "- username: String", "- fullName: String", "- email: String", "- role: String", "- roleDisplayName: String", "- departmentId: Integer", "- departmentName: String", "- isActive: boolean"],
                'methods': ["+ fromEntity(user: User): StaffResponse", "+ getDepartmentName(): String"]
            },
            {
                'name': "CreateStaffRequest", 'stereo': "DTO",
                'attrs': ["- fullName: String", "- email: String", "- roleName: String", "- departmentId: Integer", "- dateOfBirth: LocalDate"],
                'methods': ["+ getEmail(): String", "+ getRoleName(): String", "+ getDepartmentId(): Integer"]
            }
        ],
        edges=[
            ("bnd_staff_1", "bnd_staff_2", "HTTP POST /api/admin/staffs", False),
            ("bnd_staff_2", "ctrl_staff_1", "ủy quyền createStaffAccount()", False),
            ("ctrl_staff_1", "ctrl_staff_2", "lưu và phân quyền cán bộ", False),
            ("ctrl_staff_2", "ent_staff_1", "bền vững hóa thực thể User nhân sự", True),
            ("ctrl_staff_1", "ent_staff_2", "chuyển đổi thông tin sang StaffResponse DTO", True)
        ]
    )

# 23. Đặt lại Mật khẩu Hàng loạt (ddmmyyyya@)
def build_bce_23_bulk_password_reset():
    return build_single_function_tab(
        func_code="bulkpwd",
        func_title="23. Đặt lại Mật khẩu Hàng loạt (ddmmyyyya@)",
        comp_title="Reset mật khẩu toàn trường theo ngày sinh",
        comp_example="AdminSystemController",
        actor_name="Quản trị viên (Admin)",
        bnd_classes=[
            {
                'name': "PasswordResetsPage", 'stereo': "Boundary",
                'attrs': ["- selectedScope: ResetScope (ALL/COHORT/DEPARTMENT)", "- cohortId: Integer", "- departmentId: Integer", "- confirmModalOpen: boolean"],
                'methods': ["+ handleExecuteBulkReset(): void", "+ handleScopeChange(scope: ResetScope): void", "+ displaySummaryReport(res: BulkResetPasswordResponse): void"]
            },
            {
                'name': "AdminSystemController", 'stereo': "Boundary",
                'attrs': ["- passwordResetService: PasswordResetService", "- path: POST /api/admin/users/bulk-reset-password"],
                'methods': ["+ bulkResetPasswords(req: BulkResetPasswordRequest): ResponseEntity<ApiResponse<BulkResetPasswordResponse>>"]
            }
        ],
        ctrl_classes=[
            {
                'name': "PasswordResetService", 'stereo': "Control",
                'attrs': ["- userRepository: UserRepository", "- studentRepository: StudentRepository", "- passwordEncoder: PasswordEncoder", "- auditLogService: AuditLogService"],
                'methods': ["+ executeBulkPasswordReset(req: BulkResetPasswordRequest): BulkResetPasswordResponse", "+ formatDobPassword(dob: LocalDate): String (ddmmyyyya@)", "+ batchUpdateHashedPasswords(users: List<User>): int"]
            },
            {
                'name': "UserRepository", 'stereo': "Control",
                'attrs': ["- entityManager: EntityManager"],
                'methods': ["+ findActiveStudentsByCohort(cohortId: Integer): List<User>", "+ findActiveStudentsByDepartment(deptId: Integer): List<User>", "+ saveAll(users: List<User>): List<User>"]
            }
        ],
        ent_classes=[
            {
                'name': "User", 'stereo': "Entity",
                'attrs': ["- id: Long", "- password: String (BCrypt)", "- mustChangePassword: true", "- lastPasswordResetAt: LocalDateTime"],
                'methods': ["+ setPassword(pwd: String): void", "+ setMustChangePassword(flag: boolean): void"]
            },
            {
                'name': "BulkResetPasswordResponse", 'stereo': "DTO",
                'attrs': ["- totalTargetUsers: Integer", "- successfullyResetCount: Integer", "- failedCount: Integer", "- passwordPatternApplied: String (ddmmyyyya@)", "- executionTimeMs: Long"],
                'methods': ["+ getSuccessfullyResetCount(): Integer", "+ getFailedCount(): Integer"]
            },
            {
                'name': "BulkResetPasswordRequest", 'stereo': "DTO",
                'attrs': ["- scope: ResetScope (ALL/COHORT/DEPARTMENT)", "- targetId: Integer", "- reason: String"],
                'methods': ["+ getScope(): ResetScope", "+ getTargetId(): Integer"]
            }
        ],
        edges=[
            ("bnd_bulkpwd_1", "bnd_bulkpwd_2", "HTTP POST /api/admin/users/bulk-reset-password", False),
            ("bnd_bulkpwd_2", "ctrl_bulkpwd_1", "ủy quyền executeBulkPasswordReset()", False),
            ("ctrl_bulkpwd_1", "ctrl_bulkpwd_2", "batch update mật khẩu đã băm", False),
            ("ctrl_bulkpwd_2", "ent_bulkpwd_1", "cập nhật thuộc tính mật khẩu User", True),
            ("ctrl_bulkpwd_1", "ent_bulkpwd_2", "trả về báo cáo tổng kết tỷ lệ thành công", True)
        ]
    )


# ==========================================================
# MAIN EXECUTION: BUILD ALL 23 TABS TO XML
# ==========================================================
def main():
    mxfile = ET.Element('mxfile', {
        'host': 'app.diagrams.net',
        'modified': '2026-11-06T09:30:00.000Z',
        'agent': 'Antigravity AI Agent (Phenikaa SMS BCE Suite)',
        'version': '24.0.0',
        'type': 'device'
    })

    tabs_data = [
        ('bce_01_login', '01. Đăng nhập hệ thống', build_bce_1_login()),
        ('bce_02_changepwd', '02. Đổi mật khẩu', build_bce_2_change_password()),
        ('bce_03_stu_create', '03. Thêm mới Sinh viên', build_bce_3_student_create()),
        ('bce_04_stu_manage', '04. Quản lý hồ sơ Sinh viên', build_bce_4_student_manage()),
        ('bce_05_academic', '05. Khoa & Lớp sinh hoạt', build_bce_5_academic_structure()),
        ('bce_06_lecturers', '06. Quản lý Giảng viên', build_bce_6_lecturers()),
        ('bce_07_subjects', '07. Quản lý Môn học', build_bce_7_subjects()),
        ('bce_08_semesters', '08. Cấu hình Học kỳ', build_bce_8_semesters()),
        ('bce_09_sections', '09. Mở lớp Học phần', build_bce_9_course_sections()),
        ('bce_10_scheduling', '10. Xếp Thời khóa biểu', build_bce_10_scheduling()),
        ('bce_11_enroll', '11. Đăng ký lớp Học phần', build_bce_11_enrollment()),
        ('bce_12_drop', '12. Hủy đăng ký Học phần', build_bce_12_course_drop()),
        ('bce_13_grd_entry', '13. Nhập điểm thành phần', build_bce_13_grading_entry()),
        ('bce_14_grd_finalize', '14. Chốt bảng điểm', build_bce_14_grading_finalize()),
        ('bce_15_transcript', '15. Bảng điểm & Điểm CPA', build_bce_15_transcript_cpa()),
        ('bce_16_dashboard', '16. Báo cáo Thống kê & Dashboard', build_bce_16_analytics_dashboard()),
        ('bce_17_tuition', '17. Quản lý & Thu học phí', build_bce_17_tuition_management()),
        ('bce_18_attendance', '18. Điểm danh lớp học PIN 6 số', build_bce_18_live_attendance()),
        ('bce_19_exam', '19. Khảo thí & Quản lý phòng thi', build_bce_19_exam_management()),
        ('bce_20_amendment', '20. Quy trình Đính chính điểm 3 cấp', build_bce_20_grade_amendment()),
        ('bce_21_graduation', '21. Thẩm định chuẩn tốt nghiệp TT08', build_bce_21_graduation_audit()),
        ('bce_22_staff', '22. Quản lý Nhân sự Đào tạo', build_bce_22_staff_management()),
        ('bce_23_bulkpwd', '23. Đặt lại Mật khẩu Hàng loạt', build_bce_23_bulk_password_reset()),
    ]

    for diag_id, name, model in tabs_data:
        diag = ET.SubElement(mxfile, 'diagram', {'id': diag_id, 'name': name})
        diag.append(model)

    out_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'AnalysisClass_BCE_Diagrams.drawio')
    raw_xml = ET.tostring(mxfile, encoding='utf-8')
    dom = minidom.parseString(raw_xml)
    pretty_xml = dom.toprettyxml(indent='  ', encoding='utf-8')

    # Remove extra blank lines generated by toprettyxml
    clean_lines = [line for line in pretty_xml.decode('utf-8').split('\n') if line.strip()]
    final_xml = '\n'.join(clean_lines) + '\n'

    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(final_xml)

    print(f"✓ Successfully generated {len(tabs_data)} BCE diagrams into:")
    print(f"  ➜ {out_path}")

if __name__ == '__main__':
    main()
