# -*- coding: utf-8 -*-
import docx
from docx.shared import Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx_helpers import set_cell_background, set_cell_margins, set_table_borders
from report_content_ch1 import add_heading_1, add_heading_2, add_heading_3, add_para

def build_chapter_2(doc):
    doc.add_page_break()
    add_heading_1(doc, "CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ NỀN TẢNG CÔNG NGHỆ")
    
    add_heading_2(doc, "2.1. Nghiệp vụ đào tạo tín chỉ theo chuẩn Thông tư 08/2021/TT-BGDĐT")
    add_para(doc,
        "Đề tài chuẩn hóa quy trình đào tạo theo Thông tư số 08/2021/TT-BGDĐT: (1) Ràng buộc môn học (tiên quyết, học trước, song hành); (2) Cơ cấu điểm học phần 4 thành phần (CC1 5%, CC2 5%, GK 30%, CK 60%) tự động quy đổi sang thang chữ và thang 4 để tính điểm học kỳ GPA và điểm tích lũy CPA; (3) Tự động quét cảnh báo học vụ và thẩm định tốt nghiệp theo giải thuật Best-Grade (chọn điểm cao nhất trong các lần học lại)."
    )

    add_heading_2(doc, "2.2. Kiến trúc tổng thể Client-Server tách rời và phong cách RESTful API")
    add_para(doc,
        "Hệ thống áp dụng kiến trúc Client-Server tách rời (Decoupled RESTful Architecture) gồm 3 tầng: Tầng Presentation (React 19 SPA), Tầng Application (Spring Boot 3.5 Stateless API), và Tầng Data & Cache (MySQL 8 kết hợp Redis 7). Bảng 6 so sánh các mô hình kiến trúc phổ biến và lý do lựa chọn cho hệ thống."
    )
    
    # Table 6: So sánh 3 mô hình kiến trúc
    p_t = doc.add_paragraph()
    p_t.paragraph_format.space_before = Pt(4)
    p_t.paragraph_format.space_after = Pt(2)
    r = p_t.add_run("Bảng 6. So sánh các mô hình kiến trúc phần mềm và lý do lựa chọn cho hệ thống SMS")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)
    r.font.bold = True
    
    t_arch = doc.add_table(rows=6, cols=4)
    t_arch.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_arch)
    
    headers_arch = ["Tiêu chí so sánh", "Kiến trúc Monolith cũ", "Kiến trúc Microservices", "Kiến trúc Decoupled REST SPA (SMS)"]
    for c_i, h in enumerate(headers_arch):
        cell = t_arch.cell(0, c_i)
        set_cell_background(cell, "E2E8F0" if c_i < 3 else "FEF3C7")
        set_cell_margins(cell, 35, 35, 50, 50)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(9)
        r.font.bold = True
        
    arch_data = [
        ("Độ phức tạp triển khai", "Đơn giản; đóng gói 1 tệp WAR/JAR duy nhất.", "Rất phức tạp; cần Service Mesh, Gateway, Tracing.", "Cân bằng; container hóa Docker Compose nhẹ nhàng."),
        ("Tính nhất quán dữ liệu", "Đảm bảo trên 1 CSDL duy nhất.", "Rất khó; cần Saga Pattern hoặc 2-Phase Commit.", "Đảm bảo ACID tuyệt đối trên MySQL 8 + Redis Lock."),
        ("Độc lập Front/Back", "Không tách rời; mã giao diện gắn chặt Java/C#.", "Tách rời qua REST/gRPC giữa các service.", "Tách rời hoàn toàn; React 19 SPA độc lập Spring Boot API."),
        ("Khả năng mở rộng ngang", "Kém; phải nhân bản toàn bộ ứng dụng lớn.", "Rất cao; mở rộng từng service nhỏ.", "Rất cao; Nginx Load Balancer cân bằng nhiều Instances."),
        ("Đánh giá lựa chọn", "Lỗi thời, dễ nghẽn giờ mở cổng đăng ký.", "Quá phức tạp, tiêu tốn nhiều RAM không cần thiết.", "Lựa chọn tối ưu: Chuẩn công nghiệp, nhẹ và mượt mà.")
    ]
    for r_i, d in enumerate(arch_data, start=1):
        for c_i, val in enumerate(d):
            cell = t_arch.cell(r_i, c_i)
            if c_i == 3:
                set_cell_background(cell, "FFFBEB")
            set_cell_margins(cell, 30, 30, 45, 45)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_i == 0 else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = 1.05
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(1)
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(8.5)
            if c_i == 3:
                r.font.bold = True

    add_heading_2(doc, "2.3. Nền tảng Backend: Spring Boot 3.5, Spring Security và JPA/Hibernate")
    add_para(doc,
        "Backend được phát triển trên Java 23 LTS và Spring Boot 3.5.6. Tầng bảo mật dùng Spring Security lọc xác thực phi trạng thái. Tầng dữ liệu Spring Data JPA kết hợp EntityGraph nhằm khử triệt để vấn đề truy vấn N+1 (Bảng 7)."
    )

    # Table 7: Bộ công nghệ triển khai
    p_t = doc.add_paragraph()
    p_t.paragraph_format.space_before = Pt(4)
    p_t.paragraph_format.space_after = Pt(2)
    r = p_t.add_run("Bảng 7. Danh mục bộ công nghệ triển khai hệ thống theo từng tầng kiến trúc")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)
    r.font.bold = True
    
    t_tech = doc.add_table(rows=7, cols=4)
    t_tech.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_tech)
    
    headers_tech = ["Tầng kiến trúc", "Công nghệ / Framework", "Phiên bản", "Vai trò và chức năng cốt lõi"]
    for c_i, h in enumerate(headers_tech):
        cell = t_tech.cell(0, c_i)
        set_cell_background(cell, "E2E8F0")
        set_cell_margins(cell, 35, 35, 50, 50)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(9)
        r.font.bold = True
        
    tech_data = [
        ("Nền tảng & Ngôn ngữ", "Java SE (OpenJDK)", "23 LTS", "Môi trường backend, hỗ trợ Virtual Threads, Pattern Matching."),
        ("Framework Backend", "Spring Boot / Spring Web", "3.5.6", "Khung ứng dụng nòng cốt, cung cấp Dependency Injection, REST API."),
        ("Bảo mật & Ủy quyền", "Spring Security & JJWT", "6.4.x / 0.12.x", "Xác thực phi trạng thái (Stateless), lọc HTTP, phân quyền RBAC."),
        ("Truy xuất dữ liệu (ORM)", "Spring Data JPA / Hibernate", "6.6.x", "Ánh xạ ORM, quản lý giao dịch ACID, EntityGraph tối ưu hóa."),
        ("Bộ nhớ đệm & Khóa", "Redis & Redisson Client", "7.4 / 3.37.x", "Cache dữ liệu tĩnh, Khóa phân tán Redlock chống Race Condition."),
        ("Cơ sở dữ liệu chính", "MySQL Community Server", "8.0.x (InnoDB)", "Hệ quản trị CSDL quan hệ 3NF, Foreign Keys, chỉ mục B-Tree tối ưu.")
    ]
    for r_i, d in enumerate(tech_data, start=1):
        for c_i, val in enumerate(d):
            cell = t_tech.cell(r_i, c_i)
            set_cell_margins(cell, 30, 30, 45, 45)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_i in [0, 2] else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = 1.05
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(1)
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(8.5)
            if c_i == 1:
                r.font.bold = True

    add_heading_2(doc, "2.4. Xác thực và phân quyền phi trạng thái với Dual-Token JWT")
    add_para(doc,
        "Hệ thống xác thực phi trạng thái bằng chuẩn Dual-Token JWT (RFC 7519):\n"
        "• Access Token (15 phút): Ký số HMAC-SHA256, mang thông tin vai trò (Roles) gửi qua HTTP Header Authorization ở mỗi yêu cầu.\n"
        "• Refresh Token (7 ngày): Lưu trữ mã hóa trong CSDL và quản lý qua HttpOnly Cookie an toàn. Frontend tự động làm mới Access Token ngầm (Silent Refresh) khi gặp lỗi 401, không làm gián đoạn phiên làm việc."
    )

    add_heading_2(doc, "2.5. Nền tảng Frontend: React 19 SPA, Vite và Quản lý trạng thái Zustand")
    add_para(doc,
        "Giao diện người dùng được xây dựng trên React 19 kết hợp Vite 8 (khởi tạo < 300ms, cơ chế HMR tức thì). Hệ thống sử dụng Zustand (~1.1 KB) để quản lý State tập trung thay thế cho Redux cồng kềnh, kết hợp Tailwind CSS thiết kế giao diện công thái học hỗ trợ đầy đủ Dark/Light Mode và Responsive trên đa thiết bị."
    )

    add_heading_2(doc, "2.6. Cơ sở dữ liệu quan hệ MySQL, giao dịch ACID và điều khiển đồng thời")
    add_para(doc,
        "Hệ thống sử dụng MySQL 8.0 (InnoDB) bảo đảm 4 đặc tính ACID. Trong thao tác đăng ký tín chỉ giờ cao điểm, hệ thống kết hợp Khóa phân tán Redis Lock ở tầng ứng dụng với Khóa lạc quan (@Version) ở tầng CSDL để phát hiện và ngăn chặn tranh chấp dữ liệu (Bảng 8)."
    )

    # Table 8: So sánh khóa lạc quan vs bi quan
    p_t = doc.add_paragraph()
    p_t.paragraph_format.space_before = Pt(4)
    p_t.paragraph_format.space_after = Pt(2)
    r = p_t.add_run("Bảng 8. So sánh cơ chế khóa lạc quan và khóa bi quan trong bài toán đăng ký học phần")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)
    r.font.bold = True
    
    t_lock = doc.add_table(rows=5, cols=3)
    t_lock.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_lock)
    
    headers_lock = ["Tiêu chí so sánh", "Khóa bi quan (Pessimistic Locking)", "Khóa lạc quan (Optimistic Locking)"]
    for c_i, h in enumerate(headers_lock):
        cell = t_lock.cell(0, c_i)
        set_cell_background(cell, "E2E8F0")
        set_cell_margins(cell, 35, 35, 50, 50)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(9)
        r.font.bold = True
        
    lock_data = [
        ("Nguyên lý hoạt động", "Khóa cứng bản ghi ngay khi đọc (SELECT ... FOR UPDATE). Giao dịch khác phải chờ commit.", "Cho phép đọc tự do. Dùng trường số hiệu @Version kiểm tra xung đột khi ghi dữ liệu."),
        ("Tài nguyên chiếm dụng", "Rất cao; giữ kết nối CSDL và tài nguyên khóa của InnoDB.", "Rất thấp; không giữ kết nối lâu, không gây cạn kiệt Connection Pool."),
        ("Nguy cơ Deadlock", "Nguy cơ cao khi nhiều giao dịch khóa chéo các lớp học phần.", "Hoàn toàn không xảy ra Deadlock ở tầng CSDL."),
        ("Lựa chọn trong hệ thống", "Không áp dụng trực tiếp cho đăng ký tín chỉ giờ cao điểm.", "Áp dụng kết hợp Khóa phân tán Redis Lock + Cập nhật nguyên tử (Atomic Update).")
    ]
    for r_i, d in enumerate(lock_data, start=1):
        for c_i, val in enumerate(d):
            cell = t_lock.cell(r_i, c_i)
            set_cell_margins(cell, 30, 30, 45, 45)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_i == 0 else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = 1.05
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(1)
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(8.5)
            if c_i == 0:
                r.font.bold = True

    add_heading_2(doc, "2.7. Nền tảng phân tán: Redis Lock, Nginx Reverse Proxy và Docker")
    add_para(doc,
        "Để bảo đảm tính sẵn sàng cao (High Availability), hệ thống triển khai cụm phân tán gồm:\n"
        "1. Redis Distributed Cache & Lock: Cache dữ liệu tĩnh giảm 85% tải truy vấn MySQL; áp dụng khóa Redlock triệt tiêu nguy cơ Race Condition và vượt sĩ số lớp học phần.\n"
        "2. Nginx Reverse Proxy: Tiếp nhận lưu lượng, cân bằng tải Round-Robin giữa các phiên bản Spring Boot và hỗ trợ nén gzip.\n"
        "3. Container hóa Docker Compose: Đóng gói toàn bộ các dịch vụ (Nginx, Backend Multi-Instance, MySQL, Redis) thành các container đồng nhất, đảm bảo vận hành ổn định."
    )

    add_heading_2(doc, "2.8. Các mẫu thiết kế phần mềm (Design Patterns) được áp dụng")
    add_para(doc,
        "Hệ thống vận dụng 4 mẫu thiết kế hướng đối tượng GoF chuẩn mực:\n"
        "• Singleton Pattern: Quản lý vòng đời duy nhất của các Spring Beans trong IoC Container.\n"
        "• Strategy Pattern: Đóng gói các quy tắc tính điểm, cảnh báo học vụ và xét tốt nghiệp thành các chiến lược độc lập.\n"
        "• Observer Pattern: Cơ chế phát sự kiện bất đồng bộ GradeLockedEvent khi khóa sổ điểm để kích hoạt tính GPA/CPA ngầm.\n"
        "• Repository / Data Mapper Pattern: Tách bạch hoàn toàn tầng lưu trữ dữ liệu và tầng xử lý nghiệp vụ thông qua Spring Data JPA và MapStruct."
    )

    return doc
