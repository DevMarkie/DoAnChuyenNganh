# -*- coding: utf-8 -*-
import docx
from docx.shared import Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx_helpers import set_cell_background, set_cell_margins, set_table_borders
from report_content_ch1 import add_heading_1, add_heading_2, add_heading_3, add_para

def build_chapter_5_and_references(doc):
    doc.add_page_break()
    add_heading_1(doc, "CHƯƠNG 5. KẾT LUẬN, ĐẠO ĐỨC NGHỀ NGHIỆP VÀ HƯỚNG PHÁT TRIỂN")
    
    add_heading_2(doc, "5.1. Tổng kết các kết quả đạt được đối chiếu mục tiêu ban đầu")
    add_para(doc,
        "Đồ án chuyên ngành “Xây dựng hệ thống quản lý đào tạo và đăng ký học phần trực tuyến theo học chế tín chỉ (SMS)” đã hoàn thành toàn diện 100% các mục tiêu nghiên cứu và phát triển đặt ra ban đầu. Hệ thống được triển khai thử nghiệm thực tế trên cụm phân tán High-Availability, đạt độ ổn định và tin cậy cao. Bảng 21 tổng hợp đối chiếu giữa mục tiêu ban đầu và kết quả nghiệm thu thực tế."
    )

    # Table 21: Đối chiếu mục tiêu và kết quả
    p_t = doc.add_paragraph()
    p_t.paragraph_format.space_before = Pt(4)
    p_t.paragraph_format.space_after = Pt(2)
    r = p_t.add_run("Bảng 21. Bảng đối chiếu mục tiêu nghiên cứu ban đầu và kết quả nghiệm thu thực tế")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)
    r.font.bold = True
    
    t_res = doc.add_table(rows=7, cols=3)
    t_res.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_res)
    
    headers_res = ["Mục tiêu đề ra ban đầu", "Kết quả hiện thực & Nghiệm thu thực tế", "Mức độ hoàn thành"]
    for c_i, h in enumerate(headers_res):
        cell = t_res.cell(0, c_i)
        set_cell_background(cell, "E2E8F0")
        set_cell_margins(cell, 35, 35, 50, 50)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(9)
        r.font.bold = True
        
    res_data = [
        ("Kiến trúc phân tán chịu tải cao", "Mô hình Decoupled Client-Server: Nginx Reverse Proxy, Spring Boot đa thực thể, Redis Lock.", "100% Đạt"),
        ("Kiểm soát tranh chấp & Race Condition", "Khóa phân tán Redlock (2.500ms) + Atomic Update tại MySQL. Đo tải 600 VU đạt 0% lỗi vượt sĩ số.", "100% Đạt"),
        ("Tự động hóa nghiệp vụ học vụ TT08", "Động cơ duyệt DAG tiên quyết, động cơ tính GPA/CPA tự động và Động cơ Thẩm định tốt nghiệp TT08.", "100% Đạt"),
        ("Quy trình Đính chính điểm 3 cấp", "Số hóa toàn diện quy trình sửa điểm với Audit Log bất biến lưu vết chi tiết và minh chứng bài thi scan.", "100% Đạt"),
        ("Giao diện chuẩn công thái học", "SPA React 19, Zustand Store, cảm hứng Apple Vision UI, tương thích hoàn hảo thiết bị di động.", "100% Đạt"),
        ("Kiểm thử chất lượng công nghiệp", "Khung 8 trụ cột QA: 409 test JUnit 5, 105 test Vitest, 65 test E2E (Pass 100%), kiểm thử tải k6 600 VU.", "100% Đạt")
    ]
    for r_i, d in enumerate(res_data, start=1):
        for c_i, val in enumerate(d):
            cell = t_res.cell(r_i, c_i)
            set_cell_margins(cell, 30, 30, 50, 50)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_i in [0, 2] else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = 1.1
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(1)
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(8.5)
            if c_i == 2:
                r.font.bold = True

    add_heading_2(doc, "5.2. Đạo đức nghề nghiệp, bảo mật dữ liệu người học theo Nghị định 13/2023/NĐ-CP")
    add_para(doc,
        "Hệ thống quản lý khối lượng lớn dữ liệu cá nhân của người học và cán bộ giáo viên (thông tin định danh, CCCD, tình trạng học phí, bảng điểm). Đồ án tuân thủ nghiêm ngặt chuẩn mực đạo đức kỹ sư phần mềm (ACM/IEEE Code of Ethics) và Nghị định số 13/2023/NĐ-CP của Chính phủ về Bảo vệ dữ liệu cá nhân thông qua 3 trụ cột kỹ thuật: (1) Mật khẩu được băm một chiều an toàn bằng thuật toán BCrypt với Salt ngẫu nhiên; (2) Phân định quyền truy cập tối thiểu Scoped RBAC, ngăn chặn mọi hành vi leo thang đặc quyền IDOR; (3) Tính toàn vẹn và bất biến của dữ liệu học thuật được bảo vệ tuyệt đối qua cơ chế Audit Log ghi nhận mọi biến động điểm số."
    )

    add_heading_2(doc, "5.3. Hạn chế còn tồn đọng và hướng phát triển trong tương lai")
    add_para(doc,
        "Mặc dù đã hoàn thành toàn diện các yêu cầu nghiệp vụ và kỹ thuật cốt lõi, đồ án vẫn còn một số điểm hạn chế: phân hệ tài chính mới dừng ở mức quản lý công nợ và đối soát hóa đơn thủ công (chưa liên kết trực tiếp cổng thanh toán trực tuyến VNPay/MoMo); hệ thống chưa tích hợp trí tuệ nhân tạo để gợi ý lộ trình học tập cá nhân hóa cho sinh viên; và hệ thống chưa đóng gói triển khai trên nền tảng điều phối cụm Kubernetes (K8s)."
    )
    add_para(doc,
        "Trong thời gian tới, các định hướng phát triển trọng tâm bao gồm: (1) Tích hợp cổng thanh toán trực tuyến tự động gạch nợ học phí theo thời gian thực; (2) Ứng dụng mô hình học máy (Machine Learning) hỗ trợ dự báo tiến độ tốt nghiệp và cảnh báo sớm sinh viên có nguy cơ thôi học; (3) Nâng cấp hạ tầng triển khai lên cụm Kubernetes với khả năng tự động co giãn tài nguyên (Horizontal Pod Autoscaler - HPA) theo lưu lượng truy cập thực tế của từng kỳ đăng ký học phần."
    )

    # ================= TÀI LIỆU THAM KHẢO =================
    doc.add_page_break()
    add_heading_1(doc, "TÀI LIỆU THAM KHẢO")
    
    add_para(doc,
        "Danh mục các văn bản pháp quy, quy chế đào tạo, sách chuyên khảo, bài báo khoa học và tài liệu kỹ thuật chuẩn IEEE được sử dụng trong đề tài:"
    )
    
    ref_items = [
        ('[1]', 'Bộ Giáo dục và Đào tạo, "Thông tư số 08/2021/TT-BGDĐT: Ban hành Quy chế đào tạo trình độ đại học," Hà Nội, ban hành ngày 18 tháng 03 năm 2021.'),
        ('[2]', 'Trường Đại học Phenikaa, "Quy chế đào tạo trình độ đại học theo hệ thống tín chỉ (Ban hành kèm theo Quyết định số 562/QĐ-ĐHP-ĐT ngày 15/09/2021 của Hiệu trưởng Trường Đại học Phenikaa)," Hà Nội, 2021.'),
        ('[3]', 'Chính phủ nước CHXHCN Việt Nam, "Nghị định số 13/2023/NĐ-CP: Về bảo vệ dữ liệu cá nhân," Hà Nội, ban hành ngày 17 tháng 04 năm 2023.'),
        ('[4]', 'C. Walls, "Spring Boot in Action," Shelter Island, NY, USA: Manning Publications, 2016.'),
        ('[5]', 'A. Banks and E. Porcello, "Learning React: Modern Patterns for Developing React Apps," 2nd ed., Sebastopol, CA, USA: O\'Reilly Media, 2020.'),
        ('[6]', 'B. Schwartz, P. Zaitsev, and V. Tkachenko, "High Performance MySQL: Optimization, Backups, and Replication," 4th ed., Sebastopol, CA, USA: O\'Reilly Media, 2021.'),
        ('[7]', 'S. Sanfilippo, "Distributed Locks with Redis (Redlock Algorithm)," Redis Documentation, 2020. [Online]. Available: https://redis.io/topics/distlock'),
        ('[8]', 'M. Jones, J. Bradley, and N. Sakimura, "JSON Web Token (JWT)," RFC 7519, Internet Engineering Task Force (IETF), May 2015. DOI: 10.17487/RFC7519.'),
        ('[9]', 'T. H. Cormen, C. E. Leiserson, R. L. Rivest, and C. Stein, "Introduction to Algorithms," 4th ed., Cambridge, MA, USA: MIT Press, 2022.'),
        ('[10]', 'I. Sommerville, "Software Engineering," 10th ed., Boston, MA, USA: Pearson, 2015.')
    ]
    
    for r_code, r_text in ref_items:
        p_ref = doc.add_paragraph()
        p_ref.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_ref.paragraph_format.line_spacing = 1.30
        p_ref.paragraph_format.space_before = Pt(3)
        p_ref.paragraph_format.space_after = Pt(8)
        p_ref.paragraph_format.left_indent = Cm(1.2)
        p_ref.paragraph_format.first_line_indent = Cm(-1.2)
        
        r1 = p_ref.add_run(f"{r_code:6} ")
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(11)
        r1.font.bold = True
        
        r2 = p_ref.add_run(r_text)
        r2.font.name = 'Times New Roman'
        r2.font.size = Pt(11)

    return doc
