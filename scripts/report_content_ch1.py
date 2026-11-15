# -*- coding: utf-8 -*-
import docx
from docx.shared import Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx_helpers import set_cell_background, set_cell_margins, set_table_borders

def add_heading_1(doc, text):
    p = doc.add_paragraph(style='Heading 1')
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.first_line_indent = Cm(0)
    r = p.add_run(text)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.font.bold = True
    r.font.color.rgb = RGBColor(16, 44, 87)
    return p

def add_heading_2(doc, text):
    p = doc.add_paragraph(style='Heading 2')
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.first_line_indent = Cm(0)
    r = p.add_run(text)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(16, 44, 87)
    return p

def add_heading_3(doc, text):
    p = doc.add_paragraph(style='Heading 3')
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.first_line_indent = Cm(0)
    r = p.add_run(text)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    r.font.bold = True
    r.font.italic = False
    r.font.color.rgb = RGBColor(16, 44, 87)
    return p

def add_para(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.line_spacing = 1.30
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.first_line_indent = Cm(0.8)
    r = p.add_run(text)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    return p

def build_chapter_1(doc):
    doc.add_page_break()
    add_heading_1(doc, "CHƯƠNG 1. GIỚI THIỆU VÀ ĐẶT VẤN ĐỀ")
    
    add_heading_2(doc, "1.1. Bối cảnh chuyển đổi số giáo dục đại học và mô hình đào tạo tín chỉ")
    add_para(doc, 
        "Trong bối cảnh chuyển đổi số giáo dục đại học theo Quyết định số 131/QĐ-TTg của Thủ tướng Chính phủ và thực hiện học chế tín chỉ theo Thông tư số 08/2021/TT-BGDĐT của Bộ Giáo dục và Đào tạo, các cơ sở đại học đang đối mặt với yêu cầu hiện đại hóa công tác quản trị. Mô hình tín chỉ trao quyền chủ động cho sinh viên trong việc tự lập kế hoạch học tập, nhưng đồng thời tạo ra áp lực rất lớn lên hệ thống CNTT: hàng chục nghìn thời khóa biểu cá nhân hóa và áp lực truy cập đột biến (Peak Load) giờ mở cổng đăng ký học phần, dễ dẫn đến nghẽn mạng, sập cổng hoặc xung đột vượt sĩ số lớp học phần."
    )

    add_heading_2(doc, "1.2. Khảo sát thực trạng công tác quản lý đào tạo và trải nghiệm người học")
    add_para(doc,
        "Khảo sát thực tế trong tháng 10/2026 trên 30 cán bộ/giảng viên và 150 sinh viên tại Đại học Phenikaa cho thấy 2 bất cập chính: (1) Hơn 91% sinh viên gặp lỗi nghẽn hệ thống giờ mở cổng đăng ký; (2) Gần 94% cán bộ đào tạo quá tải vì các quy trình xét tốt nghiệp, đính chính điểm và đối soát dữ liệu thủ công bằng Excel (Bảng 2)."
    )

    # Table 2: Khảo sát thực trạng
    p_t = doc.add_paragraph()
    p_t.paragraph_format.space_before = Pt(4)
    p_t.paragraph_format.space_after = Pt(2)
    r = p_t.add_run("Bảng 2. Kết quả khảo sát thực trạng công tác quản lý đào tạo và trải nghiệm người học")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)
    r.font.bold = True
    
    t_ks = doc.add_table(rows=5, cols=4)
    t_ks.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_ks)
    
    headers_ks = ["Đối tượng", "Vấn đề thực tế ghi nhận", "Tỷ lệ đồng thuận", "Mức độ ảnh hưởng"]
    for c_i, h in enumerate(headers_ks):
        cell = t_ks.cell(0, c_i)
        set_cell_background(cell, "E2E8F0")
        set_cell_margins(cell, 35, 35, 50, 50)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(9)
        r.font.bold = True
        
    ks_data = [
        ("Cán bộ đào tạo (N=30)", "Xét tốt nghiệp và đối soát danh sách thi thủ công qua Excel, dễ sai sót.", "93.3% (28/30)", "Rất nghiêm trọng"),
        ("Giảng viên (N=30)", "Quy trình đính chính điểm giấy rườm rà, tốn nhiều thời gian xác nhận.", "86.7% (26/30)", "Nghiêm trọng"),
        ("Sinh viên (N=150)", "Gặp sự cố nghẽn mạng, sập cổng hoặc báo lỗi giờ cao điểm đăng ký tín chỉ.", "91.3% (137/150)", "Rất nghiêm trọng"),
        ("Sinh viên (N=150)", "Giao diện trên thiết bị di động bị vỡ khung, khó thao tác chọn môn học.", "84.7% (127/150)", "Cản trở lớn")
    ]
    for r_i, d in enumerate(ks_data, start=1):
        for c_i, val in enumerate(d):
            cell = t_ks.cell(r_i, c_i)
            set_cell_margins(cell, 30, 30, 45, 45)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_i in [0, 2, 3] else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = 1.1
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(1)
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(8.5)
            if c_i == 2:
                r.font.bold = True

    add_heading_2(doc, "1.3. Mục tiêu, đối tượng và phạm vi nghiên cứu của đề tài")
    add_para(doc,
        "Mục tiêu của đề tài là thiết kế và xây dựng Hệ thống Quản lý Đào tạo theo học chế tín chỉ (SMS), giải quyết 3 bài toán trọng tâm:"
    )
    
    bullet_points = [
        ("Kiến trúc chịu tải cao: ", "Sử dụng Spring Boot kết hợp Redis Redlock triệt tiêu Race Condition và lỗi quá tải giờ đăng ký tín chỉ."),
        ("Tự động hóa học vụ chuẩn TT08: ", "Kiểm soát đồ thị môn tiên quyết DAG, tự động tính GPA/CPA và thẩm định tốt nghiệp Degree Audit Engine."),
        ("Giao diện chuẩn công thái học: ", "Ứng dụng React 19 SPA, tối ưu responsive trên mọi thiết bị và hoàn thành 100% các ca kiểm thử tự động.")
    ]
    for b_title, b_desc in bullet_points:
        p_b = doc.add_paragraph()
        p_b.paragraph_format.line_spacing = 1.15
        p_b.paragraph_format.space_before = Pt(1)
        p_b.paragraph_format.space_after = Pt(2)
        p_b.paragraph_format.left_indent = Cm(0.6)
        r1 = p_b.add_run(f"• {b_title}")
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(11)
        r1.font.bold = True
        r2 = p_b.add_run(b_desc)
        r2.font.name = 'Times New Roman'
        r2.font.size = Pt(11)

    # Table 3: Bảng phân loại đối tượng người dùng
    p_t = doc.add_paragraph()
    p_t.paragraph_format.space_before = Pt(4)
    p_t.paragraph_format.space_after = Pt(2)
    r = p_t.add_run("Bảng 3. Bảng phân loại đối tượng người dùng và phạm vi trách nhiệm trong hệ thống SMS")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)
    r.font.bold = True
    
    t_usr = doc.add_table(rows=7, cols=3)
    t_usr.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_usr)
    
    headers_usr = ["Nhóm người dùng", "Vai trò (Role ID)", "Trách nhiệm và phạm vi nghiệp vụ chính"]
    for c_i, h in enumerate(headers_usr):
        cell = t_usr.cell(0, c_i)
        set_cell_background(cell, "E2E8F0")
        set_cell_margins(cell, 35, 35, 50, 50)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(9)
        r.font.bold = True
        
    usr_data = [
        ("Quản trị viên (Admin)", "ROLE_ADMIN", "Quản trị người dùng, phân quyền RBAC, giám sát nhật ký audit toàn hệ thống."),
        ("Phòng Đào tạo", "ROLE_ACADEMIC_AFFAIRS", "Quản lý khung CTĐT, mở lớp học phần, duyệt đính chính điểm Cấp 2, xét tốt nghiệp TT08."),
        ("Giáo vụ Khoa", "ROLE_ACADEMIC_STAFF", "Quản lý danh mục môn học thuộc Khoa, thẩm định đề xuất sửa điểm Cấp 1."),
        ("Cán bộ Khảo thí", "ROLE_EXAM_OFFICER", "Lập danh sách phòng thi, đánh số báo danh, nhập điểm thi kết thúc học phần, giải quyết phúc khảo."),
        ("Giảng viên", "ROLE_LECTURER", "Điểm danh mã PIN thời gian thực, nhập điểm 4 thành phần, tạo đề xuất sửa điểm 7 ngày."),
        ("Sinh viên", "ROLE_STUDENT", "Đăng ký tín chỉ trực tuyến, tra cứu TKB cá nhân, xem điểm CPA/GPA, nộp đơn phúc khảo.")
    ]
    for r_i, d in enumerate(usr_data, start=1):
        for c_i, val in enumerate(d):
            cell = t_usr.cell(r_i, c_i)
            set_cell_margins(cell, 30, 30, 45, 45)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_i in [0, 1] else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = 1.1
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(1)
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(8.5)
            if c_i == 0:
                r.font.bold = True

    add_heading_2(doc, "1.4. Khảo sát các giải pháp hiện có và khoảng trống nghiên cứu")
    add_para(doc,
        "Hiện nay các phần mềm quản lý đào tạo đại học phổ biến thường gặp hạn chế về kiến trúc phân tầng cũ, dễ nghẽn mạng giờ cao điểm và thiếu quy trình tự động hóa chuyên sâu theo Thông tư 08. Bảng 4 tổng hợp đối sánh giữa hệ thống đề tài và các giải pháp hiện nay."
    )

    # Table 4: Ma trận so sánh tính năng
    p_t = doc.add_paragraph()
    p_t.paragraph_format.space_before = Pt(4)
    p_t.paragraph_format.space_after = Pt(2)
    r = p_t.add_run("Bảng 4. Ma trận đối sánh tính năng giữa hệ thống SMS và các giải pháp hiện có")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)
    r.font.bold = True
    
    t_cmp = doc.add_table(rows=6, cols=4)
    t_cmp.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_cmp)
    
    headers_cmp = ["Tiêu chí đánh giá", "Hệ thống truyền thống (Edusoft)", "Cổng đào tạo cũ (Daotao.vn)", "Hệ thống đề tài (SMS)"]
    for c_i, h in enumerate(headers_cmp):
        cell = t_cmp.cell(0, c_i)
        set_cell_background(cell, "E2E8F0" if c_i < 3 else "FEF3C7")
        set_cell_margins(cell, 35, 35, 50, 50)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(9)
        r.font.bold = True
        
    cmp_data = [
        ("Kiến trúc phần mềm", "Monolith nguyên khối cũ", "Client-Server phân tán yếu", "Decoupled RESTful SPA phân tán"),
        ("Khả năng chịu tải ĐKHP", "Thường nghẽn giờ mở cổng", "Chậm giờ cao điểm", "Chịu tải cao (Redis Lock + Nginx)"),
        ("Kiểm soát Race Condition", "Dễ vượt quá sĩ số tối đa", "Dễ deadlock CSDL", "Khóa Redlock + Atomic DB (0% lỗi)"),
        ("Thẩm định tốt nghiệp TT08", "Thủ công bằng Excel", "Cấu hình cứng, khó tùy biến", "Động cơ Degree Audit Engine tự động"),
        ("Giao diện người dùng", "JSP / Web Forms cũ, vỡ mobile", "Giao diện cũ, khó dùng", "React 19 SPA, tối ưu đa thiết bị")
    ]
    for r_i, d in enumerate(cmp_data, start=1):
        for c_i, val in enumerate(d):
            cell = t_cmp.cell(r_i, c_i)
            if c_i == 3:
                set_cell_background(cell, "FFFBEB")
            set_cell_margins(cell, 30, 30, 45, 45)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_i in [1, 2] else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = 1.1
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(1)
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(8.5)
            if c_i == 3:
                r.font.bold = True

    add_heading_2(doc, "1.5. Đề xuất giải pháp hệ thống SMS và bố cục báo cáo")
    add_para(doc,
        "Đề tài đề xuất giải pháp hệ thống theo mô hình Decoupled Client-Server: Backend Spring Boot 3.5 (Java 23), Frontend React 19 SPA, MySQL 8 kết hợp Redis Redlock và Nginx Load Balancer. Bảng 5 tóm lược 4 câu hỏi định vị cốt lõi của đề tài. Báo cáo gồm 5 chương: Chương 1 Giới thiệu; Chương 2 Cơ sở lý thuyết; Chương 3 Phân tích thiết kế hệ thống; Chương 4 Hiện thực & Kiểm thử; Chương 5 Kết luận & Hướng phát triển."
    )
    
    # Table 5: Khung 4 câu hỏi cốt lõi
    p_t = doc.add_paragraph()
    p_t.paragraph_format.space_before = Pt(4)
    p_t.paragraph_format.space_after = Pt(2)
    r = p_t.add_run("Bảng 5. Khung tóm lược 4 câu hỏi định vị cốt lõi của đề tài đồ án chuyên ngành SMS")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)
    r.font.bold = True
    
    t_core_q = doc.add_table(rows=5, cols=3)
    t_core_q.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_core_q)
    
    headers_q = ["STT", "Câu hỏi định vị", "Tóm lược giải pháp và kết quả đạt được"]
    for c_i, h in enumerate(headers_q):
        cell = t_core_q.cell(0, c_i)
        set_cell_background(cell, "E2E8F0")
        set_cell_margins(cell, 35, 35, 50, 50)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(9)
        r.font.bold = True
        
    core_q_data = [
        ("1", "Tại sao chọn đề tài?\n(Tính cấp thiết)", 
         "Giải quyết triệt để 2 vấn đề lớn: (1) Nghẽn mạng và vượt sĩ số giờ cao điểm đăng ký tín chỉ; (2) Tự động hóa tính điểm GPA/CPA, đính chính điểm và xét tốt nghiệp thay vì làm thủ công."),
        ("2", "Sử dụng công nghệ gì?\n(Bộ công nghệ)", 
         "Backend Java 23 LTS, Spring Boot 3.5, Spring Security (Dual-Token JWT), JPA/Hibernate; Frontend React 19 SPA, Zustand; Dữ liệu & Phân tán: MySQL 8, Redis Redlock, Nginx, Docker Compose."),
        ("3", "Quy mô sản phẩm là gì?\n(Phạm vi & Tính năng)", 
         "Gồm 6 phân hệ vai trò (Admin, P. Đào tạo, Giáo vụ, Giảng viên, Khảo thí, Sinh viên); 39 bảng CSDL chuẩn 3NF; Động cơ kiểm tra tiên quyết DAG và Động cơ thẩm định tốt nghiệp TT08."),
        ("4", "Kết quả thực nghiệm ra sao?\n(Nghiệm thu)", 
         "Đạt 100% tỷ lệ Pass trên 528 ca kiểm thử tự động (409 JUnit, 105 Vitest, E2E). Kiểm thử áp lực k6 với 600 sinh viên đồng thời: Đạt 100% giao dịch thành công, 0% lỗi vượt sĩ số.")
    ]
    for r_i, d in enumerate(core_q_data, start=1):
        for c_i, val in enumerate(d):
            cell = t_core_q.cell(r_i, c_i)
            set_cell_margins(cell, 30, 30, 45, 45)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_i == 0 else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = 1.05
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(1)
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(8.5)
            if c_i in [0, 1]:
                r.font.bold = True

    return doc
