# -*- coding: utf-8 -*-
"""
Generate an Academic Monochrome UML 2.5 Master Use Case Diagram.
Renders to ultra-high-resolution SVG and PNG (via headless Edge).
"""
import os
import sys
import subprocess

sys.stdout.reconfigure(encoding='utf-8')

def create_svg():
    width = 1440
    height = 860
    
    # Boundary box: (180, 40, 1080, 770)
    bx, by, bw, bh = 180, 40, 1080, 770
    
    # Actors:
    # Admin (left top), DaoTao (left bottom)
    # GiangVien (right top), SinhVien (right bottom)
    actors = {
        'admin': {'cx': 80, 'cy': 140, 'name': 'Quản trị viên\nhệ thống (Admin)'},
        'dt':    {'cx': 80, 'cy': 500, 'name': 'Cán bộ\nPhòng Đào tạo'},
        'lec':   {'cx': 1360, 'cy': 280, 'name': 'Giảng viên\n(Lecturer)'},
        'stu':   {'cx': 1360, 'cy': 600, 'name': 'Sinh viên\n(Student)'},
    }
    
    # 6 Macro Use Cases in the center
    # Center X = 720. Box width = 560, height = 75. Ellipse rx = 280, ry = 37.5.
    cx = 720
    rx = 280
    ry = 38
    
    ucs = [
        {
            'id': 'm1', 'cy': 120,
            'title': 'Quản trị Hệ thống, Tài khoản &amp; Phân quyền RBAC',
            'sub': '(Bảo mật tài khoản, Audit Log điểm số, Sao lưu dữ liệu)'
        },
        {
            'id': 'm2', 'cy': 235,
            'title': 'Quản lý Cơ cấu &amp; Chương trình Đào tạo',
            'sub': '(Khoa, Ngành, Lớp sinh hoạt, Môn học &amp; Môn tiên quyết DAG)'
        },
        {
            'id': 'm3', 'cy': 350,
            'title': 'Kế hoạch Đào tạo, Xếp TKB &amp; Đăng ký Tín chỉ',
            'sub': '(Cấu hình đợt Waves, Mở lớp học phần, Xếp TKB, Đăng ký môn)'
        },
        {
            'id': 'm4', 'cy': 465,
            'title': 'Quản lý Giảng dạy, Điểm danh &amp; Nhập điểm',
            'sub': '(Lịch giảng dạy, Điểm danh PIN Realtime, Nhập điểm &amp; Chốt sổ 7 ngày)'
        },
        {
            'id': 'm5', 'cy': 580,
            'title': 'Khảo thí, Xử lý Phúc khảo &amp; Xét tốt nghiệp',
            'sub': '(Tổ chức phòng thi, Đơn phúc khảo &amp; Đính chính điểm, Chuẩn TT08)'
        },
        {
            'id': 'm6', 'cy': 695,
            'title': 'Quản lý Học phí &amp; Cổng Thanh toán Trực tuyến',
            'sub': '(Biểu phí tín chỉ, Hóa đơn điện tử, Thu ngân tại quầy &amp; Trực tuyến)'
        },
    ]

    # Connections: (actor_key, uc_id)
    conns = [
        # Admin
        ('admin', 'm1'),
        # Dao Tao
        ('dt', 'm2'),
        ('dt', 'm3'),
        ('dt', 'm5'),
        ('dt', 'm6'),
        # Giang Vien
        ('lec', 'm3'),
        ('lec', 'm4'),
        ('lec', 'm5'),
        # Sinh Vien
        ('stu', 'm3'),
        ('stu', 'm4'),
        ('stu', 'm5'),
        ('stu', 'm6'),
    ]

    svg_lines = []
    svg_lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">')
    svg_lines.append('''
    <defs>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&amp;display=swap');
            text { font-family: 'Roboto', 'Segoe UI', Arial, sans-serif; }
            .boundary-title { font-size: 15px; font-weight: 700; fill: #000000; letter-spacing: 0.5px; }
            .actor-label { font-size: 13px; font-weight: 700; fill: #000000; text-anchor: middle; line-height: 1.25; }
            .uc-title { font-size: 13.5px; font-weight: 700; fill: #000000; text-anchor: middle; }
            .uc-sub { font-size: 11px; font-weight: 400; fill: #444444; text-anchor: middle; }
            .assoc-line { stroke: #000000; stroke-width: 1.6; stroke-linecap: round; }
            .boundary { fill: #ffffff; stroke: #000000; stroke-width: 2; stroke-dasharray: 6 4; }
            .uc-ellipse { fill: #ffffff; stroke: #000000; stroke-width: 1.8; }
            .actor-body { stroke: #000000; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; fill: #ffffff; }
        </style>
    </defs>
    <!-- Background -->
    <rect width="100%" height="100%" fill="#ffffff" />
    ''')

    # Draw System Boundary
    svg_lines.append(f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" class="boundary" />')
    svg_lines.append(f'<text x="{bx + 25}" y="{by + 28}" class="boundary-title">HỆ THỐNG QUẢN LÝ ĐÀO TẠO &amp; SINH VIÊN (SMS)</text>')

    # Map UC positions
    uc_map = {uc['id']: uc for uc in ucs}

    # Draw Association Lines first (so they sit under nodes)
    for a_key, uc_id in conns:
        actor = actors[a_key]
        uc = uc_map[uc_id]
        
        # Connect from actor side toward ellipse edge
        acx = actor['cx']
        acy = actor['cy']
        
        if acx < cx: # Left actor
            x1 = acx + 22
            y1 = acy
            x2 = cx - rx + 3
            y2 = uc['cy']
        else: # Right actor
            x1 = acx - 22
            y1 = acy
            x2 = cx + rx - 3
            y2 = uc['cy']
            
        svg_lines.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" class="assoc-line" />')

    # Draw Macro Use Cases
    for uc in ucs:
        uc_y = uc['cy']
        svg_lines.append(f'<ellipse cx="{cx}" cy="{uc_y}" rx="{rx}" ry="{ry}" class="uc-ellipse" />')
        svg_lines.append(f'<text x="{cx}" y="{uc_y - 7}" class="uc-title">{uc["title"]}</text>')
        svg_lines.append(f'<text x="{cx}" y="{uc_y + 14}" class="uc-sub">{uc["sub"]}</text>')

    # Draw Actors
    for a_key, actor in actors.items():
        acx = actor['cx']
        acy = actor['cy']
        
        # Head
        svg_lines.append(f'<circle cx="{acx}" cy="{acy - 30}" r="11" class="actor-body" />')
        # Body
        svg_lines.append(f'<line x1="{acx}" y1="{acy - 19}" x2="{acx}" y2="{acy + 12}" class="actor-body" />')
        # Arms
        svg_lines.append(f'<line x1="{acx - 18}" y1="{acy - 8}" x2="{acx + 18}" y2="{acy - 8}" class="actor-body" />')
        # Left leg
        svg_lines.append(f'<line x1="{acx}" y1="{acy + 12}" x2="{acx - 14}" y2="{acy + 36}" class="actor-body" />')
        # Right leg
        svg_lines.append(f'<line x1="{acx}" y1="{acy + 12}" x2="{acx + 14}" y2="{acy + 36}" class="actor-body" />')
        
        # Labels
        lines = actor['name'].split('\n')
        if len(lines) == 1:
            svg_lines.append(f'<text x="{acx}" y="{acy + 54}" class="actor-label">{lines[0]}</text>')
        else:
            svg_lines.append(f'<text x="{acx}" y="{acy + 53}" class="actor-label">{lines[0]}</text>')
            svg_lines.append(f'<text x="{acx}" y="{acy + 69}" class="actor-label">{lines[1]}</text>')

    svg_lines.append('</svg>')
    
    svg_content = '\n'.join(svg_lines)
    return svg_content

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    svg_path = os.path.join(root_dir, 'drawio', '1_UseCase_TongQuan_Clean.svg')
    png_path = os.path.join(root_dir, 'drawio', '1_UseCase_TongQuan_Clean.png')
    html_path = os.path.join(root_dir, 'drawio', 'render_temp.html')
    
    svg_data = create_svg()
    with open(svg_path, 'w', encoding='utf-8') as f:
        f.write(svg_data)
    print(f"✓ Saved SVG: {svg_path}")

    # Create HTML wrapper to render via Edge headless at 2x resolution
    html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {{ margin: 0; padding: 20px; background: #ffffff; display: flex; justify-content: center; align-items: center; }}
  svg {{ box-shadow: none; }}
</style>
</head>
<body>
{svg_data}
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
        f"--window-size=1520,940",
        f"--screenshot={png_path}",
        f"file:///{html_path.replace(os.sep, '/')}"
    ]
    
    print("Rendering PNG with Edge headless...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(png_path):
        print(f"✓ Successfully rendered High-Res PNG: {png_path} ({os.path.getsize(png_path)} bytes)")
    else:
        print(f"Failed to render PNG: {res.stderr}")

if __name__ == '__main__':
    main()
