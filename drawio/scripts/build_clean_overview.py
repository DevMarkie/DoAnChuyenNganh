# -*- coding: utf-8 -*-
"""
Generate an ACADEMIC HIGH-CONTRAST, CLEAN UML 2.5 Overview Use Case Diagram.
Preserves 100% of the original 29 use cases and 4 actors,
structured into 4 distinct Subsystem Packages for maximum clarity and zero visual clutter.
"""
import os
import sys
import subprocess
import xml.etree.ElementTree as ET
import xml.dom.minidom as minidom

sys.stdout.reconfigure(encoding='utf-8')

# Styles
STYLE_BOUNDARY = "rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;strokeWidth=2;dashed=1;verticalAlign=top;align=left;spacingLeft=25;spacingTop=15;fontStyle=1;fontSize=15;fontColor=#000000;"
STYLE_PKG = "rounded=1;whiteSpace=wrap;html=1;fillColor=#fafbfc;strokeColor=#888888;strokeWidth=1.2;dashed=1;verticalAlign=top;align=left;spacingLeft=18;spacingTop=12;fontStyle=1;fontSize=12;fontColor=#222222;"
STYLE_ACTOR = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fontStyle=1;fontSize=13;fontColor=#000000;strokeColor=#000000;fillColor=#ffffff;strokeWidth=1.5;"
STYLE_UC = "ellipse;whiteSpace=wrap;html=1;fontSize=11.5;fontStyle=0;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.4;fontColor=#000000;"
STYLE_ASSOC = "endArrow=none;html=1;strokeWidth=1.3;strokeColor=#000000;"

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

def build_model():
    model = ET.Element('mxGraphModel', {
        'dx': '1422', 'dy': '900', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': '1580', 'pageHeight': '1240', 'background': '#ffffff'
    })
    root = ET.SubElement(model, 'root')
    add_cell(root, "0")
    add_cell(root, "1")

    # Master System Boundary
    add_cell(root, "b1", "HỆ THỐNG QUẢN LÝ ĐÀO TẠO & SINH VIÊN (SMS)", STYLE_BOUNDARY, vertex=True, geometry={'x': 170, 'y': 30, 'width': 1240, 'height': 1170})

    # ================= LEFT SIDE (ADMIN & ĐÀO TẠO) =================
    # 1. Package Admin (Top-Left)
    add_cell(root, "pkg_admin", "PHÂN HỆ QUẢN TRỊ VIÊN HỆ THỐNG (ADMIN)", STYLE_PKG, vertex=True, geometry={'x': 230, 'y': 80, 'width': 370, 'height': 450})
    
    ucs_admin = [
        ("uc_a_usr", "Quản lý Tài khoản & Phân quyền RBAC", 255, 125, 320, 46),
        ("uc_a_pwdreset", "Phê duyệt Cấp lại Mật khẩu An toàn", 255, 185, 320, 46),
        ("uc_a_audit", "Giám sát Nhật ký Kiểm toán Điểm số", 255, 245, 320, 46),
        ("uc_a_kpi", "Báo cáo Thống kê Toàn trường & KPI", 255, 305, 320, 46),
        ("uc_a_unlock", "Mở khóa Sổ điểm Khẩn cấp", 255, 365, 320, 46),
        ("uc_a_backup", "Sao lưu & Khôi phục Cơ sở dữ liệu", 255, 425, 320, 46),
    ]
    # Actor Admin centered vertically alongside Admin Package (y = 270)
    add_cell(root, "act_admin", "Quản trị viên\nhệ thống (Admin)", STYLE_ACTOR, vertex=True, geometry={'x': 50, 'y': 265, 'width': 45, 'height': 80})

    for uid, uval, ux, uy, uw, uh in ucs_admin:
        add_cell(root, uid, uval, STYLE_UC, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_a_{uid}", "", STYLE_ASSOC, edge=True, source="act_admin", target=uid)

    # 2. Package Phòng Đào tạo (Bottom-Left)
    add_cell(root, "pkg_dt", "PHÂN HỆ CÁN BỘ PHÒNG ĐÀO TẠO", STYLE_PKG, vertex=True, geometry={'x': 230, 'y': 570, 'width': 370, 'height': 580})

    ucs_dt = [
        ("uc_dt_dept", "Thiết lập Khoa, Ngành & Lớp sinh hoạt", 255, 615, 320, 46),
        ("uc_dt_subj", "Quản lý Môn học & Môn tiên quyết (DAG)", 255, 675, 320, 46),
        ("uc_dt_sem", "Cấu hình Học kỳ & Đợt ĐKHP (Waves)", 255, 735, 320, 46),
        ("uc_dt_sec", "Mở mới & Điều phối Lớp học phần", 255, 795, 320, 46),
        ("uc_dt_sch", "Xếp Thời khóa biểu & Chống xung đột", 255, 855, 320, 46),
        ("uc_dt_tuition", "Quản lý Cổng Thu ngân & Học phí SV", 255, 915, 320, 46),
        ("uc_dt_exam", "Tổ chức Thi & Phân bổ Phòng tự động", 255, 975, 320, 46),
        ("uc_dt_grad", "Thẩm định Tốt nghiệp theo Thông tư 08", 255, 1035, 320, 46),
    ]
    # Actor Cán bộ Đào tạo centered vertically alongside Dao Tao Package (y = 825)
    add_cell(root, "act_dt", "Cán bộ\nPhòng Đào tạo", STYLE_ACTOR, vertex=True, geometry={'x': 50, 'y': 825, 'width': 45, 'height': 80})

    for uid, uval, ux, uy, uw, uh in ucs_dt:
        add_cell(root, uid, uval, STYLE_UC, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_dt_{uid}", "", STYLE_ASSOC, edge=True, source="act_dt", target=uid)

    # ================= RIGHT SIDE (GIẢNG VIÊN & SINH VIÊN) =================
    # 3. Package Giảng viên (Top-Right)
    add_cell(root, "pkg_lec", "PHÂN HỆ GIẢNG VIÊN (LECTURER)", STYLE_PKG, vertex=True, geometry={'x': 980, 'y': 80, 'width': 370, 'height': 505})

    ucs_lec = [
        ("uc_l_sch", "Tra cứu Lịch giảng dạy cá nhân tuần", 1005, 125, 320, 46),
        ("uc_l_sec", "Xem Danh sách SV & Hồ sơ lớp phụ trách", 1005, 185, 320, 46),
        ("uc_l_att", "Khởi tạo Điểm danh Mã PIN Trực tiếp", 1005, 245, 320, 46),
        ("uc_l_grd", "Nhập Điểm thành phần & Import Excel", 1005, 305, 320, 46),
        ("uc_l_fin", "Chốt & Công bố Bảng điểm (Hạn 7 ngày)", 1005, 365, 320, 46),
        ("uc_l_amend", "Lập Phiếu Đề xuất Đính chính điểm 3 cấp", 1005, 425, 320, 46),
        ("uc_l_appeal", "Tiếp nhận & Thẩm định Đơn Phúc khảo", 1005, 485, 320, 46),
    ]
    # Actor Giảng viên centered vertically alongside Lecturer Package (y = 300)
    add_cell(root, "act_lec", "Giảng viên\n(Lecturer)", STYLE_ACTOR, vertex=True, geometry={'x': 1485, 'y': 295, 'width': 45, 'height': 80})

    for uid, uval, ux, uy, uw, uh in ucs_lec:
        add_cell(root, uid, uval, STYLE_UC, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_l_{uid}", "", STYLE_ASSOC, edge=True, source="act_lec", target=uid)

    # 4. Package Sinh viên (Bottom-Right)
    add_cell(root, "pkg_stu", "PHÂN HỆ SINH VIÊN (STUDENT)", STYLE_PKG, vertex=True, geometry={'x': 980, 'y': 625, 'width': 370, 'height': 525})

    ucs_stu = [
        ("uc_s_sch", "Tra cứu Thời khóa biểu tuần cá nhân", 1005, 670, 320, 46),
        ("uc_s_enr", "Đăng ký Lớp học phần (Khóa bi quan)", 1005, 730, 320, 46),
        ("uc_s_drop", "Hủy Đăng ký Lớp học phần trong đợt", 1005, 790, 320, 46),
        ("uc_s_trans", "Tra cứu Bảng điểm, GPA kỳ & CPA tích lũy", 1005, 850, 320, 46),
        ("uc_s_curric", "Xem Bản đồ Lộ trình Khung CTĐT", 1005, 910, 320, 46),
        ("uc_s_tuition", "Tra cứu Hóa đơn & Nộp học phí trực tuyến", 1005, 970, 320, 46),
        ("uc_s_att", "Check-in Điểm danh ca học bằng Mã PIN", 1005, 1030, 320, 46),
        ("uc_s_appeal", "Nộp Đơn Phúc khảo Điểm thi trực tuyến", 1005, 1090, 320, 46),
    ]
    # Actor Sinh viên centered vertically alongside Student Package (y = 880)
    add_cell(root, "act_stu", "Sinh viên\n(Student)", STYLE_ACTOR, vertex=True, geometry={'x': 1485, 'y': 875, 'width': 45, 'height': 80})

    for uid, uval, ux, uy, uw, uh in ucs_stu:
        add_cell(root, uid, uval, STYLE_UC, vertex=True, geometry={'x': ux, 'y': uy, 'width': uw, 'height': uh})
        add_cell(root, f"e_s_{uid}", "", STYLE_ASSOC, edge=True, source="act_stu", target=uid)

    return model

def generate_svg():
    width = 1580
    height = 1240
    
    # Boundary
    bx, by, bw, bh = 170, 30, 1240, 1170
    
    # Packages:
    pkgs = [
        {'x': 230, 'y': 80, 'w': 370, 'h': 450, 'title': 'PHÂN HỆ QUẢN TRỊ VIÊN HỆ THỐNG (ADMIN)'},
        {'x': 230, 'y': 570, 'w': 370, 'h': 580, 'title': 'PHÂN HỆ CÁN BỘ PHÒNG ĐÀO TẠO'},
        {'x': 980, 'y': 80, 'w': 370, 'h': 505, 'title': 'PHÂN HỆ GIẢNG VIÊN (LECTURER)'},
        {'x': 980, 'y': 625, 'w': 370, 'h': 525, 'title': 'PHÂN HỆ SINH VIÊN (STUDENT)'},
    ]

    actors = {
        'admin': {'cx': 75, 'cy': 305, 'name': 'Quản trị viên\nhệ thống (Admin)'},
        'dt':    {'cx': 75, 'cy': 865, 'name': 'Cán bộ\nPhòng Đào tạo'},
        'lec':   {'cx': 1505, 'cy': 335, 'name': 'Giảng viên\n(Lecturer)'},
        'stu':   {'cx': 1505, 'cy': 915, 'name': 'Sinh viên\n(Student)'},
    }

    ucs_admin = [
        "Quản lý Tài khoản & Phân quyền RBAC",
        "Phê duyệt Cấp lại Mật khẩu An toàn",
        "Giám sát Nhật ký Kiểm toán Điểm số",
        "Báo cáo Thống kê Toàn trường & KPI",
        "Mở khóa Sổ điểm Khẩn cấp",
        "Sao lưu & Khôi phục Cơ sở dữ liệu",
    ]
    ucs_dt = [
        "Thiết lập Khoa, Ngành & Lớp sinh hoạt",
        "Quản lý Môn học & Môn tiên quyết (DAG)",
        "Cấu hình Học kỳ & Đợt ĐKHP (Waves)",
        "Mở mới & Điều phối Lớp học phần",
        "Xếp Thời khóa biểu & Chống xung đột",
        "Quản lý Cổng Thu ngân & Học phí SV",
        "Tổ chức Thi & Phân bổ Phòng tự động",
        "Thẩm định Tốt nghiệp theo Thông tư 08",
    ]
    ucs_lec = [
        "Tra cứu Lịch giảng dạy cá nhân tuần",
        "Xem Danh sách SV & Hồ sơ lớp phụ trách",
        "Khởi tạo Điểm danh Mã PIN Trực tiếp",
        "Nhập Điểm thành phần & Import Excel",
        "Chốt & Công bố Bảng điểm (Hạn 7 ngày)",
        "Lập Phiếu Đề xuất Đính chính điểm 3 cấp",
        "Tiếp nhận & Thẩm định Đơn Phúc khảo",
    ]
    ucs_stu = [
        "Tra cứu Thời khóa biểu tuần cá nhân",
        "Đăng ký Lớp học phần (Khóa bi quan)",
        "Hủy Đăng ký Lớp học phần trong đợt",
        "Tra cứu Bảng điểm, GPA kỳ & CPA tích lũy",
        "Xem Bản đồ Lộ trình Khung CTĐT",
        "Tra cứu Hóa đơn & Nộp học phí trực tuyến",
        "Check-in Điểm danh ca học bằng Mã PIN",
        "Nộp Đơn Phúc khảo Điểm thi trực tuyến",
    ]

    svg_lines = []
    svg_lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">')
    svg_lines.append('''
    <defs>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&amp;display=swap');
            text { font-family: 'Roboto', 'Segoe UI', Arial, sans-serif; }
            .boundary-title { font-size: 15px; font-weight: 700; fill: #000000; letter-spacing: 0.5px; }
            .pkg-title { font-size: 11.5px; font-weight: 700; fill: #222222; letter-spacing: 0.4px; }
            .actor-label { font-size: 12.5px; font-weight: 700; fill: #000000; text-anchor: middle; line-height: 1.25; }
            .uc-title { font-size: 12px; font-weight: 500; fill: #000000; text-anchor: middle; dominant-baseline: central; }
            .assoc-line { stroke: #000000; stroke-width: 1.3; stroke-linecap: round; }
            .boundary { fill: #ffffff; stroke: #000000; stroke-width: 2; stroke-dasharray: 6 4; }
            .pkg-box { fill: #fcfdfe; stroke: #666666; stroke-width: 1.2; stroke-dasharray: 4 3; rx: 8; ry: 8; }
            .uc-ellipse { fill: #ffffff; stroke: #000000; stroke-width: 1.4; }
            .actor-body { stroke: #000000; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; fill: #ffffff; }
        </style>
    </defs>
    <!-- Background -->
    <rect width="100%" height="100%" fill="#ffffff" />
    ''')

    # Master Boundary
    svg_lines.append(f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" class="boundary" />')
    svg_lines.append(f'<text x="{bx + 25}" y="{by + 28}" class="boundary-title">HỆ THỐNG QUẢN LÝ ĐÀO TẠO &amp; SINH VIÊN (SMS)</text>')

    # 4 Packages
    for pkg in pkgs:
        svg_lines.append(f'<rect x="{pkg["x"]}" y="{pkg["y"]}" width="{pkg["w"]}" height="{pkg["h"]}" class="pkg-box" />')
        svg_lines.append(f'<text x="{pkg["x"] + 16}" y="{pkg["y"] + 24}" class="pkg-title">{pkg["title"]}</text>')

    # Function to draw UCs and Lines
    uw, uh = 320, 46
    rx, ry = uw / 2, uh / 2

    def draw_uc_group(actor_key, ucs, start_x, start_y, step_y=60):
        actor = actors[actor_key]
        acx, acy = actor['cx'], actor['cy']
        cx = start_x + rx

        for i, text in enumerate(ucs):
            cy = start_y + i * step_y + ry
            # Draw Line
            if acx < cx: # Left
                x1 = acx + 22
                x2 = start_x
            else: # Right
                x1 = acx - 22
                x2 = start_x + uw
            y1 = acy
            y2 = cy
            # Draw line under ellipse
            svg_lines.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" class="assoc-line" />')
            # Draw ellipse
            safe_text = text.replace('&', '&amp;')
            svg_lines.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" class="uc-ellipse" />')
            svg_lines.append(f'<text x="{cx}" y="{cy}" class="uc-title">{safe_text}</text>')

    # Draw groups
    draw_uc_group('admin', ucs_admin, 255, 125, 60)
    draw_uc_group('dt', ucs_dt, 255, 615, 60)
    draw_uc_group('lec', ucs_lec, 1005, 125, 60)
    draw_uc_group('stu', ucs_stu, 1005, 670, 60)

    # Draw Actors
    for a_key, actor in actors.items():
        acx = actor['cx']
        acy = actor['cy']
        
        # Head
        svg_lines.append(f'<circle cx="{acx}" cy="{acy - 28}" r="11" class="actor-body" />')
        # Body
        svg_lines.append(f'<line x1="{acx}" y1="{acy - 17}" x2="{acx}" y2="{acy + 12}" class="actor-body" />')
        # Arms
        svg_lines.append(f'<line x1="{acx - 17}" y1="{acy - 7}" x2="{acx + 17}" y2="{acy - 7}" class="actor-body" />')
        # Left leg
        svg_lines.append(f'<line x1="{acx}" y1="{acy + 12}" x2="{acx - 13}" y2="{acy + 34}" class="actor-body" />')
        # Right leg
        svg_lines.append(f'<line x1="{acx}" y1="{acy + 12}" x2="{acx + 13}" y2="{acy + 34}" class="actor-body" />')
        
        # Labels
        lines = actor['name'].split('\n')
        if len(lines) == 1:
            svg_lines.append(f'<text x="{acx}" y="{acy + 52}" class="actor-label">{lines[0]}</text>')
        else:
            svg_lines.append(f'<text x="{acx}" y="{acy + 52}" class="actor-label">{lines[0]}</text>')
            svg_lines.append(f'<text x="{acx}" y="{acy + 68}" class="actor-label">{lines[1]}</text>')

    svg_lines.append('</svg>')
    return '\n'.join(svg_lines)

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    drawio_dir = os.path.join(root_dir, 'drawio')
    
    # 1. Update 1_UseCase_TongQuan.drawio
    model = build_model()
    single_file = ET.Element('mxfile', {
        'host': 'app.diagrams.net',
        'modified': '2026-10-28T00:00:00.000Z',
        'agent': 'Antigravity AI Agent',
        'version': '24.0.0',
        'type': 'device'
    })
    d = ET.SubElement(single_file, 'diagram', {'id': 'uc_overall', 'name': '1. Tổng quan toàn hệ thống'})
    d.append(model)
    xml_str = ET.tostring(single_file, encoding='utf-8')
    parsed = minidom.parseString(xml_str)
    pretty_xml = parsed.toprettyxml(indent='  ', encoding='utf-8')
    
    out_drawio = os.path.join(drawio_dir, '1_UseCase_TongQuan.drawio')
    with open(out_drawio, 'wb') as f:
        f.write(pretty_xml)
    print(f"✓ Saved Draw.io: {out_drawio}")

    # 2. Update Tab 1 in UseCase_Diagrams.drawio
    multi_file_path = os.path.join(drawio_dir, 'UseCase_Diagrams.drawio')
    if os.path.exists(multi_file_path):
        tree = ET.parse(multi_file_path)
        mroot = tree.getroot()
        tab1 = mroot.find(".//diagram[@id='uc_overall']")
        if tab1 is not None:
            for child in list(tab1):
                tab1.remove(child)
            tab1.append(model)
            xml_str_m = ET.tostring(mroot, encoding='utf-8')
            parsed_m = minidom.parseString(xml_str_m)
            with open(multi_file_path, 'wb') as f:
                f.write(parsed_m.toprettyxml(indent='  ', encoding='utf-8'))
            print(f"✓ Synchronized Tab 1 in: {multi_file_path}")

    # 3. Export SVG & High-Res PNG
    svg_content = generate_svg()
    svg_path = os.path.join(drawio_dir, '1_UseCase_TongQuan_Clean.svg')
    png_path = os.path.join(drawio_dir, '1_UseCase_TongQuan_Clean.png')
    html_path = os.path.join(drawio_dir, 'render_temp2.html')

    with open(svg_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    print(f"✓ Saved SVG: {svg_path}")

    html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {{ margin: 0; padding: 20px; background: #ffffff; display: flex; justify-content: center; align-items: center; }}
</style>
</head>
<body>
{svg_content}
</body>
</html>"""
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_path):
        edge_path = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

    cmd = [
        edge_path,
        "--headless",
        "--disable-gpu",
        "--force-device-scale-factor=2",
        "--window-size=1660,1320",
        f"--screenshot={png_path}",
        f"file:///{html_path.replace(os.sep, '/')}"
    ]
    subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(png_path):
        print(f"✓ Successfully rendered High-Res PNG: {png_path} ({os.path.getsize(png_path)} bytes)")

    if os.path.exists(html_path):
        os.remove(html_path)

if __name__ == '__main__':
    main()
