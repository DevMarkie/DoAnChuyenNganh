# -*- coding: utf-8 -*-
import os
import docx
from docx.shared import Pt, RGBColor, Inches, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx_helpers import set_cell_background, set_cell_margins, set_table_borders, add_page_number_to_section, add_toc_hyperlink, add_list_hyperlink, toc_title_to_bm

def build_frontmatter(doc, extracted_images_dir):
    # ================= PAGE 1: COVER =================
    sec0 = doc.sections[0]
    sec0.top_margin = Cm(2.5)
    sec0.bottom_margin = Cm(2.5)
    sec0.left_margin = Cm(3.5)
    sec0.right_margin = Cm(2.0)
    
    # Title Header
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run("ĐẠI HỌC PHENIKAA\nTRƯỜNG CÔNG NGHỆ THÔNG TIN")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(16, 44, 87)
    
    p_line = doc.add_paragraph()
    p_line.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_line.paragraph_format.space_after = Pt(14)
    r_line = p_line.add_run("___***___")
    r_line.font.name = 'Times New Roman'
    r_line.font.size = Pt(11)
    r_line.font.bold = True
    
    # Logo
    logo_path = f"{extracted_images_dir}/logo.png"
    p_logo = doc.add_paragraph()
    p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_logo.paragraph_format.space_after = Pt(18)
    p_logo.paragraph_format.space_before = Pt(6)
    if os.path.exists(logo_path):
        doc.add_picture(logo_path, width=Cm(4.2))
        p_last = doc.paragraphs[-1]
        p_last.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_last.paragraph_format.space_after = Pt(20)
    
    # Project Title
    p_proj = doc.add_paragraph()
    p_proj.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_proj.paragraph_format.space_after = Pt(8)
    r_sub = p_proj.add_run("BÁO CÁO ĐỒ ÁN CHUYÊN NGÀNH\n")
    r_sub.font.name = 'Times New Roman'
    r_sub.font.size = Pt(16)
    r_sub.font.bold = True
    r_sub.font.color.rgb = RGBColor(192, 0, 0)
    
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(24)
    p_title.paragraph_format.line_spacing = 1.25
    r_title = p_title.add_run("XÂY DỰNG HỆ THỐNG QUẢN LÝ ĐÀO TẠO VÀ\nĐĂNG KÝ HỌC PHẦN TRỰC TUYẾN THEO HỌC CHẾ TÍN CHỈ (SMS)")
    r_title.font.name = 'Times New Roman'
    r_title.font.size = Pt(15)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(16, 44, 87)
    
    # Metadata Table / Text
    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_before = Pt(36)
    p_meta.paragraph_format.space_after = Pt(4)
    p_meta.paragraph_format.line_spacing = 1.3
    p_meta.paragraph_format.left_indent = Cm(2.5)
    
    meta_items = [
        ("Giảng viên hướng dẫn: ", "ThS. Vũ Văn Quang"),
        ("Sinh viên thực hiện: ", "Nguyễn Duy Minh"),
        ("Mã sinh viên: ", "23010339"),
        ("Khoá đào tạo: ", "K17 (2023 - 2027)"),
        ("Lớp tín chỉ: ", "Đồ án chuyên ngành - 1 - 1 - 26 (N03)"),
        ("Chương trình đào tạo: ", "Đại học chính quy - Công nghệ Thông tin")
    ]
    for label, val in meta_items:
        r1 = p_meta.add_run(label)
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(12.5)
        r1.font.bold = True
        r2 = p_meta.add_run(f"{val}\n")
        r2.font.name = 'Times New Roman'
        r2.font.size = Pt(12.5)
        r2.font.bold = False
        
    p_date = doc.add_paragraph()
    p_date.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_date.paragraph_format.space_before = Pt(40)
    p_date.paragraph_format.space_after = Pt(0)
    r_date = p_date.add_run("Hà Nội, tháng 11 năm 2026")
    r_date.font.name = 'Times New Roman'
    r_date.font.size = Pt(12)
    r_date.font.italic = True
    
    # ================= SECTION BREAK -> SECTION 1 (MAIN DOCUMENT) =================
    new_sec = doc.add_section(docx.enum.section.WD_SECTION.NEW_PAGE)
    new_sec.top_margin = Cm(2.5)
    new_sec.bottom_margin = Cm(2.5)
    new_sec.left_margin = Cm(3.5)
    new_sec.right_margin = Cm(2.0)
    
    add_page_number_to_section(new_sec)
    
    # ================= PAGE 2: KẾ HOẠCH VÀ TIẾN ĐỘ THỰC HIỆN ĐỒ ÁN (TIMELINE 9 TUẦN) =================
    p_h = doc.add_paragraph()
    p_h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_h.paragraph_format.space_before = Pt(0)
    p_h.paragraph_format.space_after = Pt(4)
    r = p_h.add_run("KẾ HOẠCH VÀ TIẾN ĐỘ THỰC HIỆN ĐỒ ÁN (TIMELINE 9 TUẦN)")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(16, 44, 87)
    
    p_desc = doc.add_paragraph()
    p_desc.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_desc.paragraph_format.line_spacing = 1.15
    p_desc.paragraph_format.space_after = Pt(3)
    p_desc.paragraph_format.first_line_indent = Cm(1.0)
    r = p_desc.add_run(
        "Đồ án chuyên ngành được sinh viên Nguyễn Duy Minh thực hiện độc lập dưới sự hướng dẫn khoa học trực tiếp của ThS. Vũ Văn Quang trong thời gian 9 tuần (từ ngày 07/09/2026 đến hạn cuối ngày 08/11/2026, Học kỳ 1 năm học 2026 - 2027). Tiến trình triển khai gồm 5 giai đoạn trọng tâm từ khảo sát thực tế, phân tích nghiệp vụ Thông tư 08/2021/TT-BGDĐT, thiết kế kiến trúc phân tán High-Availability, xây dựng CSDL 41 bảng chuẩn 3NF, lập trình Spring Boot 3.5.6 / React 19, kiểm thử tự động 8 trụ cột QA và hoàn thành nghiệm thu đúng hạn ngày 08/11/2026."
    )
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10.5)
    
    # Table 1: Tiến độ thực hiện đồ án (Timeline 9 tuần)
    p_t1 = doc.add_paragraph()
    p_t1.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_t1.paragraph_format.space_before = Pt(2)
    p_t1.paragraph_format.space_after = Pt(2)
    r = p_t1.add_run("Bảng 1. Kế hoạch và tiến độ triển khai đồ án chi tiết (Timeline 9 tuần: 07/09/2026 - 08/11/2026)")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(9.5)
    r.font.bold = True
    
    table1 = doc.add_table(rows=6, cols=4)
    table1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table1)
    
    headers = ["Tuần / Thời gian", "Nội dung công việc trọng tâm (Milestones)", "Sản phẩm & Kết quả bàn giao", "Tiến độ"]
    for col_idx, text in enumerate(headers):
        cell = table1.cell(0, col_idx)
        set_cell_background(cell, "E2E8F0")
        set_cell_margins(cell, 25, 25, 40, 40)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing = 1.05
        p.paragraph_format.space_after = Pt(1)
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(9.0)
        r.font.bold = True
        
    tasks_data = [
        ("Tuần 1 - 2\n(07/09 - 20/09/2026)", 
         "Khảo sát quy chế TT 08/2021/TT-BGDĐT; phát phiếu và khảo sát 30 cán bộ & 150 sinh viên; đánh giá bất cập hệ thống cũ; duyệt đề cương chi tiết.", 
         "Đề cương chi tiết đồ án được duyệt; Báo cáo tổng hợp số liệu khảo sát thực tế.", 
         "100%\n(Hoàn thành)"),
        ("Tuần 3 - 4\n(21/09 - 04/10/2026)", 
         "Đặc tả yêu cầu chức năng 4 vai trò & NFR; xây dựng 16 quy trình nghiệp vụ (WF-01..16), 55 quy tắc ràng buộc (BR-01..09) và 5 sơ đồ Use Case.", 
         "Tài liệu đặc tả yêu cầu phần mềm (SRS); Ma trận quy trình nghiệp vụ; 5 sơ đồ Use Case.", 
         "100%\n(Hoàn thành)"),
        ("Tuần 5 - 6\n(05/10 - 18/10/2026)", 
         "Thiết kế kiến trúc Client-Server phân tán (RESTful SPA); chuẩn hóa CSDL 41 bảng chuẩn 3NF; giải thuật đồ thị DAG và khóa phân tán Redis Lock.", 
         "Sơ đồ kiến trúc tổng thể; Thiết kế CSDL thực thể quan hệ (ERD 41 bảng); Thiết kế 6 giải pháp.", 
         "100%\n(Hoàn thành)"),
        ("Tuần 7 - 8\n(19/10 - 01/11/2026)", 
         "Lập trình Backend Spring Boot 3.5.6 (Java 23, 33 Controllers, Dual-Token JWT, JPA); phát triển Frontend React 19 SPA (Zustand, Apple Vision UI).", 
         "Toàn bộ mã nguồn mở Backend & Frontend; Hệ thống RESTful API 33 bộ điều khiển tích hợp.", 
         "100%\n(Hoàn thành)"),
        ("Tuần 9\n(02/11 - 08/11/2026)", 
         "Thực thi 8 trụ cột QA (409 JUnit, 105 Vitest, 65 E2E); đo tải k6 với 600 SV đồng thời; đóng gói Docker Compose; hoàn thiện báo cáo nộp hạn 08/11.", 
         "Bộ kịch bản kiểm thử tự động đa tầng; Báo cáo đo tải & JaCoCo 72%; Báo cáo 70 trang hoàn chỉnh.", 
         "100%\n(Hoàn thành)")
    ]
    for row_idx, data in enumerate(tasks_data, start=1):
        for col_idx, text in enumerate(data):
            cell = table1.cell(row_idx, col_idx)
            set_cell_margins(cell, 20, 20, 40, 40)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if col_idx in [0, 3] else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = 1.05
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(1)
            r = p.add_run(text)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(8.0)
            if col_idx in [0, 3]:
                r.font.bold = True
                
    # Signatures on Page 2
    p_sig = doc.add_paragraph()
    p_sig.paragraph_format.space_before = Pt(4)
    p_sig.paragraph_format.space_after = Pt(0)
    
    table_sig = doc.add_table(rows=2, cols=2)
    table_sig.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    cell_l = table_sig.cell(0, 0)
    cell_r = table_sig.cell(0, 1)
    
    p_l = cell_l.paragraphs[0]
    p_l.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_l = p_l.add_run("GIẢNG VIÊN HƯỚNG DẪN\n(Ký và ghi rõ họ tên)\n\nThS. Vũ Văn Quang")
    r_l.font.name = 'Times New Roman'
    r_l.font.size = Pt(10)
    r_l.font.bold = True
    
    p_r = cell_r.paragraphs[0]
    p_r.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_r = p_r.add_run("SINH VIÊN THỰC HIỆN\n(Ký và ghi rõ họ tên)\n\nNguyễn Duy Minh")
    r_r.font.name = 'Times New Roman'
    r_r.font.size = Pt(10)
    r_r.font.bold = True

    # ================= PAGE 3: LỜI CAM ĐOAN VÀ LỜI CẢM ƠN (GỘP GỌN 1 TRANG) =================
    doc.add_page_break()
    
    # 1. LỜI CAM ĐOAN
    p_cd = doc.add_paragraph()
    p_cd.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cd.paragraph_format.space_before = Pt(8)
    p_cd.paragraph_format.space_after = Pt(6)
    r = p_cd.add_run("LỜI CAM ĐOAN")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(16, 44, 87)
    
    p_cdt = doc.add_paragraph()
    p_cdt.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_cdt.paragraph_format.line_spacing = 1.2
    p_cdt.paragraph_format.space_after = Pt(6)
    p_cdt.paragraph_format.first_line_indent = Cm(1.0)
    r = p_cdt.add_run(
        "Tôi xin khẳng định và cam kết rằng báo cáo đồ án chuyên ngành đề tài “Xây dựng hệ thống quản lý đào tạo và đăng ký học phần trực tuyến theo học chế tín chỉ (SMS)” là kết quả làm việc, nghiên cứu và xây dựng hoàn toàn độc lập của cá nhân tôi, dưới sự hướng dẫn khoa học trực tiếp của ThS. Vũ Văn Quang trong suốt 9 tuần (07/09/2026 - 08/11/2026). Mọi số liệu khảo sát, kết quả kiểm thử tự động (409 test JUnit 5, 105 Vitest, JaCoCo Coverage 72%, đo tải 600 VU) và mã nguồn hệ thống được trình bày trong báo cáo đều là số liệu thực nghiệm trung thực, trích dẫn tài liệu tham khảo theo đúng chuẩn IEEE và không sao chép từ bất kỳ công trình nào khác. Tôi xin hoàn toàn chịu trách nhiệm trước Hội đồng và Nhà trường về tính liêm chính khoa học của công trình này."
    )
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)

    # 2. LỜI CẢM ƠN
    p_co = doc.add_paragraph()
    p_co.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_co.paragraph_format.space_before = Pt(12)
    p_co.paragraph_format.space_after = Pt(6)
    r = p_co.add_run("LỜI CẢM ƠN")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(16, 44, 87)
    
    p_cot = doc.add_paragraph()
    p_cot.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_cot.paragraph_format.line_spacing = 1.2
    p_cot.paragraph_format.space_after = Pt(8)
    p_cot.paragraph_format.first_line_indent = Cm(1.0)
    r = p_cot.add_run(
        "Em xin được bày tỏ lòng biết ơn sâu sắc và chân thành nhất tới ThS. Vũ Văn Quang – người thầy đã tận tình định hướng phương pháp luận khoa học, truyền đạt kinh nghiệm thực tế quý báu và luôn đồng hành, khích lệ em hoàn thành đồ án đúng hạn ngày 08/11/2026. Em xin trân trọng cảm ơn Ban Giám hiệu Trường Đại học Phenikaa cùng toàn thể các thầy cô giáo Khoa Công nghệ Thông tin đã tận tâm giảng dạy, trang bị tri thức nền tảng vững chắc và tạo điều kiện hạ tầng máy chủ tốt nhất trong suốt khóa học. Cuối cùng, con xin gửi lời cảm ơn vô hạn tới gia đình và bạn bè đã luôn là điểm tựa tinh thần vững chắc, tiếp thêm động lực to lớn cho em."
    )
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)

    p_sig = doc.add_paragraph()
    p_sig.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_sig.paragraph_format.space_before = Pt(14)
    p_sig.paragraph_format.space_after = Pt(0)
    r = p_sig.add_run("Hà Nội, ngày 08 tháng 11 năm 2026\nSinh viên thực hiện\n\n\nNguyễn Duy Minh")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)
    r.font.italic = True

    # ================= PAGE 5-6: MỤC LỤC =================
    doc.add_page_break()
    p_ml = doc.add_paragraph()
    p_ml.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_ml.paragraph_format.space_before = Pt(12)
    p_ml.paragraph_format.space_after = Pt(14)
    r = p_ml.add_run("MỤC LỤC")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(15)
    r.font.bold = True
    r.font.color.rgb = RGBColor(16, 44, 87)
    
    toc_entries = [
        ("KẾ HOẠCH VÀ TIẾN ĐỘ THỰC HIỆN ĐỒ ÁN (TIMELINE)", "2", True),
        ("LỜI CAM ĐOAN VÀ LỜI CẢM ƠN", "3", True),
        ("DANH MỤC BẢNG BIỂU VÀ TỪ VIẾT TẮT", "6", True),
        ("DANH MỤC HÌNH ẢNH TIÊU BIỂU", "7", True),
        ("CHƯƠNG 1. GIỚI THIỆU VÀ ĐẶT VẤN ĐỀ", "10", True),
        ("  1.1. Bối cảnh chuyển đổi số giáo dục đại học và học chế tín chỉ", "8", False),
        ("  1.2. Khảo sát thực trạng công tác quản lý đào tạo và trải nghiệm người học", "8", False),
        ("  1.3. Mục tiêu, đối tượng và phạm vi nghiên cứu của đề tài", "9", False),
        ("  1.4. Khảo sát các giải pháp hiện có và khoảng trống nghiên cứu", "10", False),
        ("  1.5. Đề xuất giải pháp hệ thống SMS và bố cục báo cáo", "10", False),
        ("CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ NỀN TẢNG CÔNG NGHỆ", "11", True),
        ("  2.1. Nghiệp vụ đào tạo tín chỉ theo chuẩn Thông tư 08/2021/TT-BGDĐT", "11", False),
        ("  2.2. Kiến trúc tổng thể Client-Server tách rời và phong cách RESTful API", "11", False),
        ("  2.3. Nền tảng Backend: Spring Boot 3.5, Spring Security và JPA/Hibernate", "12", False),
        ("  2.4. Xác thực và phân quyền phi trạng thái với Dual-Token JWT", "12", False),
        ("  2.5. Nền tảng Frontend: React 19 SPA, Vite và Quản lý trạng thái Zustand", "12", False),
        ("  2.6. Cơ sở dữ liệu quan hệ MySQL, giao dịch ACID và điều khiển đồng thời", "13", False),
        ("  2.7. Nền tảng phân tán: Redis Lock, Nginx Reverse Proxy và Docker", "13", False),
        ("  2.8. Các mẫu thiết kế phần mềm (Design Patterns) được áp dụng", "13", False),
        ("CHƯƠNG 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG", "14", True),
        ("  3.1. Đặc tả yêu cầu chức năng 4 vai trò và yêu cầu phi chức năng", "14", False),
        ("  3.2. Giả định, ràng buộc công nghệ và bộ quy tắc nghiệp vụ tập trung", "14", False),
        ("  3.3. Phân tích các quy trình nghiệp vụ cốt lõi (BPA) & Ma trận luồng xử lý", "15", False),
        ("  3.4. Mô hình hóa Use Case hệ thống & Đặc tả 6 Use Case trọng tâm", "14", False),
        ("  3.5. Thiết kế Cơ sở dữ liệu quan hệ (ERD & Từ điển 11 bảng nòng cốt)", "14", False),
        ("  3.6. Thiết kế giải pháp kiến trúc cho các thách thức kỹ thuật trọng yếu", "17", False),
        ("    3.6.1. Thách thức 1: Điều khiển tranh chấp tài nguyên và chống vượt sĩ số", "17", False),
        ("    3.6.2. Thách thức 2: Xử lý đồ thị môn học tiên quyết DAG & Xếp TKB", "19", False),
        ("    3.6.3. Thách thức 3: Quy trình điểm số 2 cấp & Đính chính điểm 3 cấp", "20", False),
        ("    3.6.4. Thách thức 4: Tối ưu hóa truy vấn CSDL, khử N+1 & Phân tải ngang", "22", False),
        ("    3.6.5. Thách thức 5: Bộ máy tự động thẩm định chuẩn tốt nghiệp Thông tư 08", "23", False),
        ("    3.6.6. Thách thức 6: Phân định trách nhiệm Scoped RBAC & Chống Lost Update", "24", False),
        ("    3.6.7. Mô hình kiến trúc phân tầng chuyên sâu và điều phối sự kiện bất đồng bộ", "24", False),
        ("    3.6.8. Thuật toán tối ưu hóa xếp thời khóa biểu dựa trên mô hình CSP & MRV", "25", False),
        ("    3.6.9. Thuật toán phân tích đồ thị môn học DAG và Giảm thiểu bắc cầu", "26", False),
        ("    3.6.10. Mô hình toán học tính toán chỉ số GPA/CPA theo Thông tư 08", "28", False),
        ("CHƯƠNG 4. HIỆN THỰC, TRIỂN KHAI VÀ KIỂM THỬ HỆ THỐNG", "30", True),
        ("  4.1. Hiện thực các phân hệ nghiệp vụ cốt lõi phía Backend", "30", False),
        ("  4.2. Hiện thực và minh chứng giao diện người dùng các phân hệ chính", "32", False),
        ("  4.3. Đóng gói container hóa Docker Compose và kiến trúc vận hành cụm", "37", False),
        ("  4.4. Chiến lược và kết quả kiểm thử đa tầng (Khung 8 trụ cột QA)", "38", False),
        ("  4.5. Đánh giá thực nghiệm hiệu năng và kiểm thử tải áp lực 600 sinh viên", "44", False),
        ("CHƯƠNG 5. KẾT LUẬN, ĐẠO ĐỨC NGHỀ NGHIỆP VÀ HƯỚNG PHÁT TRIỂN", "48", True),
        ("  5.1. Tổng kết các kết quả đạt được đối chiếu mục tiêu ban đầu", "48", False),
        ("  5.2. Đạo đức nghề nghiệp, bảo mật dữ liệu người học theo Nghị định 13/2023/NĐ-CP", "48", False),
        ("  5.3. Hạn chế còn tồn đọng và hướng phát triển trong tương lai", "49", False),
        ("TÀI LIỆU THAM KHẢO", "50", True)
    ]
    
    for title, page_str, is_bold in toc_entries:
        bm = toc_title_to_bm(title)
        is_chapter = is_bold and "CHƯƠNG" in title
        add_toc_hyperlink(doc, title, page_str, bm, is_bold=is_bold, is_chapter=is_chapter)

    # ================= PAGE 6: DANH MỤC BẢNG BIỂU VÀ TỪ VIẾT TẮT =================
    doc.add_page_break()
    p_lh = doc.add_paragraph()
    p_lh.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_lh.paragraph_format.space_before = Pt(8)
    p_lh.paragraph_format.space_after = Pt(6)
    r = p_lh.add_run("DANH MỤC BẢNG BIỂU VÀ TỪ VIẾT TẮT")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(16, 44, 87)
    
    # Danh mục bảng biểu
    p_tb = doc.add_paragraph()
    p_tb.paragraph_format.space_before = Pt(4)
    p_tb.paragraph_format.space_after = Pt(2)
    r = p_tb.add_run("1. Danh mục bảng biểu")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)
    r.font.bold = True
    
    tables_list = [
        ("Bảng 1. Kế hoạch và tiến độ triển khai đồ án chi tiết (Timeline 9 tuần)", "2"),
        ("Bảng 2. Kết quả khảo sát thực trạng công tác quản lý đào tạo và trải nghiệm", "8"),
        ("Bảng 3. Phân loại đối tượng người dùng và phạm vi trách nhiệm trong hệ thống", "8"),
        ("Bảng 4. Ma trận đối sánh tính năng giữa hệ thống SMS và các giải pháp hiện có", "9"),
        ("Bảng 5. Khung tóm lược 4 câu hỏi định vị cốt lõi của đề tài đồ án SMS", "9"),
        ("Bảng 6. So sánh các mô hình kiến trúc phần mềm và lý do lựa chọn cho SMS", "11"),
        ("Bảng 7. Danh mục bộ công nghệ triển khai hệ thống theo từng tầng kiến trúc", "11"),
        ("Bảng 8. So sánh cơ chế khóa lạc quan và khóa bi quan trong đăng ký học phần", "12"),
        ("Bảng 9. Tổng hợp các quy tắc nghiệp vụ tập trung cốt lõi (Business Rules)", "14"),
        ("Bảng 10. Ma trận 16 luồng quy trình nghiệp vụ chuẩn hóa (WF-01 đến WF-16)", "15"),
        ("Bảng 11. Phân loại 41 bảng cơ sở dữ liệu theo 7 phân hệ chức năng", "15"),
        ("Bảng 12. Cấu trúc và từ điển dữ liệu các bảng cơ sở dữ liệu hạt nhân", "14"),
        ("Bảng 13. Khung ma trận kiểm thử 8 trụ cột QA toàn diện của hệ thống SMS", "38"),
        ("Bảng 14. Danh mục 10 ca kiểm thử bảo mật và phân quyền tiêu biểu", "39"),
        ("Bảng 15. Kết quả kiểm thử các ca biên ngoại lệ và xử lý lỗi hệ thống", "39"),
        ("Bảng 16. Ma trận 10 ca kiểm thử tự động nghiệp vụ Điểm số và Cảnh báo học vụ theo TT08", "43"),
        ("Bảng 17. Kết quả phân tích chất lượng mã nguồn tĩnh và cổng bảo mật SonarQube", "43"),
        ("Bảng 18. Kết quả đo đạc kiểm thử tải áp lực 600 sinh viên ảo đồng thời (k6)", "44"),
        ("Bảng 19. Phân bổ độ trễ chi tiết (Percentiles) của 6 Endpoint trọng yếu tải 600 VU", "44"),
        ("Bảng 20. Kết quả đo đạc chỉ số hiệu năng và Core Web Vitals trên Google DevTools", "45"),
        ("Bảng 21. Đối chiếu mục tiêu nghiên cứu ban đầu và kết quả thực nghiệm", "48")
    ]
    for i, (tt, tp) in enumerate(tables_list):
        bm = f"bm_tbl_{i+1}"
        add_list_hyperlink(doc, tt, tp, bm)

    # Danh mục từ viết tắt
    p_vt = doc.add_paragraph()
    p_vt.paragraph_format.space_before = Pt(6)
    p_vt.paragraph_format.space_after = Pt(2)
    r = p_vt.add_run("2. Danh mục các từ viết tắt chuyên ngành")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)
    r.font.bold = True
    
    abbr_data = [
        ("SMS / UAMS", "Student Management System / University Academic Management System"),
        ("GPA / CPA", "Grade Point Average (Điểm TB học kỳ) / Cumulative Point Average (Điểm TB tích lũy)"),
        ("TT08", "Thông tư 08/2021/TT-BGDĐT ban hành Quy chế đào tạo trình độ đại học"),
        ("JWT", "JSON Web Token (Phương thức xác thực phân quyền không trạng thái)"),
        ("RBAC", "Role-Based Access Control (Kiểm soát truy cập dựa trên vai trò)"),
        ("DAG", "Directed Acyclic Graph (Đồ thị có hướng không chu trình - xử lý tiên quyết)"),
        ("NFR", "Non-Functional Requirements (Các yêu cầu phi chức năng của phần mềm)"),
        ("E2E", "End-to-End Testing (Kiểm thử đầu - cuối toàn diện luồng người dùng)")
    ]
    for code, desc in abbr_data:
        p_item = doc.add_paragraph()
        p_item.paragraph_format.line_spacing = 1.10
        p_item.paragraph_format.space_after = Pt(1.0)
        r_c = p_item.add_run(f" • {code:12} : ")
        r_c.font.name = 'Times New Roman'
        r_c.font.size = Pt(9.0)
        r_c.font.bold = True
        r_d = p_item.add_run(desc)
        r_d.font.name = 'Times New Roman'
        r_d.font.size = Pt(9.0)

    # ================= PAGE 7: DANH MỤC HÌNH ẢNH =================
    doc.add_page_break()
    p_lh2 = doc.add_paragraph()
    p_lh2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_lh2.paragraph_format.space_before = Pt(8)
    p_lh2.paragraph_format.space_after = Pt(6)
    r = p_lh2.add_run("DANH MỤC HÌNH ẢNH TIÊU BIỂU")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(16, 44, 87)
    
    figs_list = [
        ("Hình 1. Sơ đồ Use Case tổng quan 4 tác nhân chính toàn hệ thống", "14"),
        ("Hình 2. Sơ đồ Use Case phân hệ Quản trị viên hệ thống (Admin)", "15"),
        ("Hình 3. Sơ đồ Use Case phân hệ Cán bộ Phòng Đào tạo", "14"),
        ("Hình 4. Sơ đồ Use Case phân hệ Giảng viên", "15"),
        ("Hình 5. Sơ đồ Use Case phân hệ Sinh viên", "14"),
        ("Hình 6. Biểu đồ tuần tự: Đăng nhập hệ thống & Cấp phát JWT kép", "15"),
        ("Hình 7. Sơ đồ Thực thể Quan hệ CSDL Tổng quan (Core Relational ERD 41 bảng)", "15"),
        ("Hình 8. Biểu đồ tuần tự: Sinh viên đăng ký tín chỉ & Khóa phân tán Redis", "15"),
        ("Hình 9. Biểu đồ tuần tự: Quy trình Xếp thời khóa biểu & Chống va chạm", "14"),
        ("Hình 10. Biểu đồ tuần tự: Giảng viên Nhập điểm thành phần & Tính GPA", "15"),
        ("Hình 11. Biểu đồ tuần tự: Thẩm định Quy trình Đính chính điểm số 3 cấp", "14"),
        ("Hình 12. Biểu đồ tuần tự: Động cơ thẩm định chuẩn tốt nghiệp Thông tư 08", "15"),
        ("Hình 13. Cổng chuyển đổi tập trung phân hệ SMS Portal Hub", "15"),
        ("Hình 14. Bảng điều khiển KPI Quản trị viên & Phân quyền hệ thống", "14"),
        ("Hình 15. Phân hệ Đào tạo: Động cơ thẩm định chuẩn tốt nghiệp Thông tư 08", "14"),
        ("Hình 16. Phân hệ Giảng viên: Sổ điểm điện tử 4 thành phần & Chốt sổ điểm", "15"),
        ("Hình 17. Phân hệ Sinh viên: Cổng đăng ký học phần thông minh & TKB", "15"),
        ("Hình 18. Phân hệ Sinh viên: Tra cứu bảng điểm tích lũy & CPA", "16"),
        ("Hình 19. Phân hệ Sinh viên: Thời khóa biểu tuần cá nhân trực quan", "16"),
        ("Hình 20. Phân hệ Sinh viên: Bản đồ tiến độ CTĐT & Đồ thị tiên quyết", "17"),
        ("Hình 21. Minh chứng Terminal: Kết quả kiểm thử Backend 409 tests PASS", "21"),
        ("Hình 22. Minh chứng Terminal: Kết quả kiểm thử Frontend Vitest 105 tests PASS", "22"),
        ("Hình 23. Minh chứng báo cáo độ phủ mã JaCoCo Code Coverage 72% toàn hệ thống", "22"),
        ("Hình 24. Minh chứng thực nghiệm hiển thị Responsive di động", "27")
    ]
    for i, (ft, fp) in enumerate(figs_list):
        bm = f"bm_fig_{i+1}"
        add_list_hyperlink(doc, ft, fp, bm)

print("Frontmatter synchronized with exact page numbers.")
