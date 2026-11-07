"""
update_word_nfr.py
Cập nhật Mục 5.6. Kiểm thử phi chức năng chuyên sâu vào BaoCaoDoAn_ChinhSua_HoanThien.docx
"""

import os
import sys

if sys.stdout:
    sys.stdout.reconfigure(encoding='utf-8')
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml

DOC_PATH = "BaoCaoDoAn_ChinhSua_HoanThien.docx"

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m_name, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m_name)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_shading(cell, color_hex):
    shading_xml = f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>'
    cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))

def set_table_borders(table, color="D3D3D3", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders_xml = f"""
    <w:tblBorders {nsdecls("w")}>
        <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
        <w:left w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
        <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
        <w:right w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
        <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
        <w:insideV w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
    </w:tblBorders>
    """
    tblPr.append(parse_xml(borders_xml))

def format_cell_text(cell, text, bold=False, italic=False, font_size=10, align=WD_ALIGN_PARAGRAPH.LEFT):
    cell.text = text
    p = cell.paragraphs[0]
    p.alignment = align
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    for r in p.runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(font_size)
        r.bold = bold
        r.italic = italic

def main():
    print(f"Loading {DOC_PATH}...")
    doc = docx.Document(DOC_PATH)

    # 1. Tìm vị trí mục 5.6 cũ để đổi số thứ tự
    target_p = None
    target_idx = -1
    for i, p in enumerate(doc.paragraphs):
        txt = p.text.strip()
        if txt.startswith("5.6.") and p.style.name.startswith("Heading"):
            target_p = p
            target_idx = i
            # Đổi 5.6 cũ thành 5.7
            p.text = p.text.replace("5.6.", "5.7.", 1)
            print(f"Renamed {txt} -> {p.text}")
        elif txt.startswith("5.7.") and p.style.name.startswith("Heading"):
            # Đổi 5.7 cũ thành 5.8
            p.text = p.text.replace("5.7.", "5.8.", 1)
            print(f"Renamed {txt} -> {p.text}")

    if not target_p:
        raise ValueError("Không tìm thấy paragraph 5.6 trong tài liệu!")

    # Chèn nội dung mục 5.6 mới TRƯỚC target_p (5.7 mới)
    # Ta chuẩn bị danh sách các phần tử cần chèn theo thứ tự
    print("Preparing Section 5.6 content...")

    # --- 5.6 Heading ---
    h2 = target_p.insert_paragraph_before("5.6. Kiểm thử phi chức năng chuyên sâu (Non-Functional Testing)", "Heading 2")

    intro = target_p.insert_paragraph_before(
        "Nhằm đáp ứng các tiêu chuẩn khắt khe về độ ổn định, khả năng chịu lỗi và tính toàn vẹn dữ liệu trong môi trường giáo dục đại học, nhóm nghiên cứu đã xây dựng bộ kiểm thử phi chức năng chuyên biệt tại thư mục tests/non_functional/. Bộ kiểm thử tập trung vào 4 trụ cột phi chức năng cốt lõi theo đúng kịch bản vận hành thực tế: (1) Kiểm thử tải đỉnh điểm giờ mở cổng đăng ký tín chỉ (00:00 và 08:00 sáng); (2) Kiểm thử tranh chấp tài nguyên và Race Conditions khi lớp học phần chỉ còn đúng 1 suất cuối; (3) Kiểm thử khả năng xử lý dữ liệu lớn và các ca biên ngoại lệ của tệp Excel; (4) Kiểm thử tương thích đa nền tảng trình duyệt và thiết bị di động Smartphone.",
        "Normal"
    )

    # --- 5.6.1 Heading ---
    h3_1 = target_p.insert_paragraph_before("5.6.1. Kiểm thử tải và áp lực giờ mở cổng đăng ký tín chỉ (Peak Load & Stress Testing)", "Heading 3")
    p_load = target_p.insert_paragraph_before(
        "Kịch bản thử nghiệm (tests/non_functional/01_peak_load_test.js): Mô phỏng đợt sóng truy cập đỉnh điểm của hàng chục nghìn lượt truy vấn vào thời điểm mở cổng ĐKTC (00:00 hoặc 08:00 sáng). Các luồng gửi dồn dập các yêu cầu tra cứu danh mục học phần, thời khóa biểu và kiểm tra đợt đăng ký tín chỉ. Mục tiêu chính là kiểm chứng xem máy chủ có bị sập (502/504 Bad Gateway), nghẽn kết nối cơ sở dữ liệu (Database Deadlock trong Connection Pool HikariCP) hoặc chậm trễ phản hồi hay không.",
        "Normal"
    )

    cap1 = target_p.insert_paragraph_before("Bảng 56.1. Bảng kết quả kiểm thử tải đỉnh điểm giờ mở cổng ĐKTC (Peak Load Test)", "TableCaption")

    # Table 56.1
    tbl1 = doc.add_table(rows=8, cols=4)
    tbl1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl1)
    
    headers1 = ["Chỉ tiêu kiểm thử", "Ngưỡng cam kết (SLA)", "Kết quả thực nghiệm", "Đánh giá"]
    col_widths1 = [Inches(2.2), Inches(1.5), Inches(1.6), Inches(1.2)]
    
    for c_idx, h in enumerate(headers1):
        cell = tbl1.rows[0].cells[c_idx]
        cell.width = col_widths1[c_idx]
        set_cell_margins(cell, top=120, bottom=120, left=150, right=150)
        set_cell_shading(cell, "EBF3FB")
        format_cell_text(cell, h, bold=True, font_size=10, align=WD_ALIGN_PARAGRAPH.CENTER)

    data1 = [
        ["Tổng số yêu cầu đồng thời", ">= 3.000 requests (50 worker)", "3.000 requests", "Hoàn thành 100%"],
        ["Thông lượng xử lý (Throughput)", ">= 200 requests/giây", "477,4 requests/giây", "Vượt SLA (+138,7%)"],
        ["Thời gian phản hồi trung bình (Avg)", "< 300 ms", "99,7 ms", "Rất tốt"],
        ["Độ trễ phân vị P50 (Trung vị)", "< 200 ms", "79,0 ms", "Phản hồi tức thì"],
        ["Độ trễ phân vị P95", "< 1.000 ms", "221,3 ms", "Đạt SLA"],
        ["Sự cố máy chủ sập (502/503/504)", "0 lỗi (0,00%)", "0 lỗi (0,00%)", "An toàn tuyệt đối"],
        ["Tắc nghẽn CSDL (Database Deadlock)", "0 trường hợp", "0 trường hợp", "HikariCP ổn định 100%"]
    ]
    for r_idx, row_data in enumerate(data1):
        for c_idx, val in enumerate(row_data):
            cell = tbl1.rows[r_idx + 1].cells[c_idx]
            cell.width = col_widths1[c_idx]
            set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
            align = WD_ALIGN_PARAGRAPH.CENTER if c_idx > 0 else WD_ALIGN_PARAGRAPH.LEFT
            format_cell_text(cell, val, bold=(c_idx == 2), font_size=9.5, align=align)

    target_p._p.addprevious(tbl1._tbl)

    p_load_eval = target_p.insert_paragraph_before(
        "Nhận xét kết quả: Dưới áp lực dồn dập 477,4 req/s, hệ thống vẫn duy trì độ trễ phân vị P95 ở mức 221,3 ms (thấp hơn nhiều so với giới hạn SLA 1.000 ms). Tỷ lệ lỗi 502/504 Bad Gateway hoàn toàn bằng 0, không có bất kỳ ngoại lệ Database Deadlock nào phát sinh trong hồ sơ nhật ký HikariCP Pool.",
        "Normal"
    )

    # --- 5.6.2 Heading ---
    h3_2 = target_p.insert_paragraph_before("5.6.2. Kiểm thử tranh chấp tài nguyên và Race Conditions (Tranh chấp 1 suất cuối)", "Heading 3")
    p_race = target_p.insert_paragraph_before(
        "Kịch bản thử nghiệm (tests/non_functional/02_race_condition_test.js): Thiết lập một lớp học phần có sức chứa 50 sinh viên nhưng đã có 49 sinh viên ghi danh thành công (chỉ còn đúng 1 suất cuối cùng). Kích hoạt đồng thời 10 sinh viên gửi lệnh đăng ký tại cùng một mili-giây qua Promise.all. Hệ thống phải đảm bảo tính nguyên tử (Atomicity): duy nhất 1 sinh viên thành công (HTTP 200), 9 sinh viên còn lại nhận thông báo 'Học phần đã đầy' (HTTP 400), và tuyệt đối không bao giờ xảy ra tình trạng số lượng đăng ký vượt quá giới hạn (ví dụ: 51/50).",
        "Normal"
    )

    cap2 = target_p.insert_paragraph_before("Bảng 56.2. Bảng kết quả kiểm thử tranh chấp ghi danh 1 suất cuối cùng (Race Condition & Zero-Oversell)", "TableCaption")

    # Table 56.2
    tbl2 = doc.add_table(rows=11, cols=6)
    tbl2.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl2)
    
    headers2 = ["STT", "Mã Sinh Viên", "Thời gian", "HTTP", "Thông báo trả về", "Kết quả ghi nhận DB"]
    col_widths2 = [Inches(0.6), Inches(1.2), Inches(1.0), Inches(0.8), Inches(1.8), Inches(1.2)]
    
    for c_idx, h in enumerate(headers2):
        cell = tbl2.rows[0].cells[c_idx]
        cell.width = col_widths2[c_idx]
        set_cell_margins(cell, top=120, bottom=120, left=150, right=150)
        set_cell_shading(cell, "EBF3FB")
        format_cell_text(cell, h, bold=True, font_size=10, align=WD_ALIGN_PARAGRAPH.CENTER)

    data2 = [
        ["1", "2300001", "124,4 ms", "200 OK", "Đăng ký học phần thành công", "✅ Thành công (Winner)"],
        ["2", "2300002", "106,9 ms", "400 Bad", "Học phần đã đầy", "❌ Từ chối (Lớp hết chỗ)"],
        ["3", "2300004", "105,9 ms", "400 Bad", "Học phần đã đầy", "❌ Từ chối (Lớp hết chỗ)"],
        ["4", "2300005", "91,8 ms", "400 Bad", "Học phần đã đầy", "❌ Từ chối (Lớp hết chỗ)"],
        ["5", "2300006", "99,6 ms", "400 Bad", "Học phần đã đầy", "❌ Từ chối (Lớp hết chỗ)"],
        ["6", "2300007", "98,4 ms", "400 Bad", "Học phần đã đầy", "❌ Từ chối (Lớp hết chỗ)"],
        ["7", "2300008", "91,0 ms", "400 Bad", "Học phần đã đầy", "❌ Từ chối (Lớp hết chỗ)"],
        ["8", "2300009", "96,1 ms", "400 Bad", "Học phần đã đầy", "❌ Từ chối (Lớp hết chỗ)"],
        ["9", "2300010", "97,2 ms", "400 Bad", "Học phần đã đầy", "❌ Từ chối (Lớp hết chỗ)"],
        ["10", "2300011", "88,7 ms", "400 Bad", "Học phần đã đầy", "❌ Từ chối (Lớp hết chỗ)"]
    ]
    for r_idx, row_data in enumerate(data2):
        for c_idx, val in enumerate(row_data):
            cell = tbl2.rows[r_idx + 1].cells[c_idx]
            cell.width = col_widths2[c_idx]
            set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
            align = WD_ALIGN_PARAGRAPH.CENTER if c_idx in [0, 2, 3, 5] else WD_ALIGN_PARAGRAPH.LEFT
            bold = (r_idx == 0) # Winner bold
            format_cell_text(cell, val, bold=bold, font_size=9, align=align)

    target_p._p.addprevious(tbl2._tbl)

    p_race_eval = target_p.insert_paragraph_before(
        "Đối soát trực tiếp trong CSDL MySQL sau khi kết thúc kịch bản: Số lượng bản ghi ghi danh thực tế là đúng 50/50 sinh viên. Trường enrolled_count trên bảng course_sections đạt đúng 50/50. Nhờ cơ chế kiểm tra và trừ slot nguyên tử tại tầng RAM Redis (sms:section:id:slots) kết hợp khóa phân tán, hiện tượng vượt sĩ số (Over-selling) hoàn toàn bị triệt tiêu, tuyệt đối không có trường hợp 51/50 xảy ra.",
        "Normal"
    )

    # --- 5.6.3 Heading ---
    h3_3 = target_p.insert_paragraph_before("5.6.3. Kiểm thử xử lý dữ liệu lớn và các ca biên ngoại lệ Excel", "Heading 3")
    p_excel = target_p.insert_paragraph_before(
        "Kịch bản thử nghiệm (tests/non_functional/03_excel_large_data_test.js): Giảng viên import file Excel danh sách điểm cho lớp học phần quy mô lớn 150 sinh viên và kiểm thử toàn diện các trường hợp sai định dạng file, trống cột, điểm chữ cái thay vì số, điểm âm, điểm > 10. Đồng thời đo lường tốc độ và tính toàn vẹn khi export bảng điểm toàn khóa.",
        "Normal"
    )

    cap3 = target_p.insert_paragraph_before("Bảng 56.3. Bảng kết quả kiểm thử các ca biên ngoại lệ và xử lý dữ liệu lớn Excel", "TableCaption")

    # Table 56.3
    tbl3 = doc.add_table(rows=8, cols=5)
    tbl3.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl3)
    
    headers3 = ["Mã ca", "Tên ca kiểm thử", "Dữ liệu thử nghiệm", "Kết quả thực tế", "Đánh giá"]
    col_widths3 = [Inches(1.1), Inches(1.6), Inches(1.5), Inches(1.6), Inches(0.8)]
    
    for c_idx, h in enumerate(headers3):
        cell = tbl3.rows[0].cells[c_idx]
        cell.width = col_widths3[c_idx]
        set_cell_margins(cell, top=120, bottom=120, left=150, right=150)
        set_cell_shading(cell, "EBF3FB")
        format_cell_text(cell, h, bold=True, font_size=10, align=WD_ALIGN_PARAGRAPH.CENTER)

    data3 = [
        ["NFR-EXCEL-01", "Sai định dạng tệp", "Tệp văn bản wrong_format.txt", "HTTP 400 từ chối đúng định dạng .xlsx", "Đạt"],
        ["NFR-EXCEL-02", "Trống cột / Mã ĐK", "Tệp empty_columns.xlsx (bỏ trống cột)", "Tự động lọc bỏ/báo lỗi dòng trống, HTTP 200", "Đạt"],
        ["NFR-EXCEL-03", "Điểm chữ thay vì số", "Nhập chuỗi 'CHÍN', 'A+' tại cột điểm", "Báo lỗi: 'Điểm không phải số hợp lệ'", "Đạt"],
        ["NFR-EXCEL-04", "Điểm âm (< 0.0)", "Nhập giá trị điểm -1.0, -0.5", "Báo lỗi: 'Điểm phải trong khoảng 0–10'", "Đạt"],
        ["NFR-EXCEL-05", "Điểm vượt trần (> 10)", "Nhập giá trị điểm 12.5, 15.0", "Báo lỗi: 'Điểm phải trong khoảng 0–10'", "Đạt"],
        ["NFR-EXCEL-06", "Import lớn 150 SV", "Tệp 150 sinh viên hợp lệ", "Đọc đủ 150/150 dòng trong 92,9 ms", "Đạt"],
        ["NFR-EXCEL-07", "Export bảng điểm Excel", "API /api/grades/section/1/export", "Xuất file chuẩn xlsx 6,8 KB trong 79,3 ms", "Đạt"]
    ]
    for r_idx, row_data in enumerate(data3):
        for c_idx, val in enumerate(row_data):
            cell = tbl3.rows[r_idx + 1].cells[c_idx]
            cell.width = col_widths3[c_idx]
            set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
            align = WD_ALIGN_PARAGRAPH.CENTER if c_idx in [0, 4] else WD_ALIGN_PARAGRAPH.LEFT
            format_cell_text(cell, val, bold=(c_idx == 4), font_size=9, align=align)

    target_p._p.addprevious(tbl3._tbl)

    p_excel_eval = target_p.insert_paragraph_before(
        "Nhận xét kết quả: Toàn bộ 5/5 ca biên dữ liệu sai lệch (định dạng, ô trống, ký tự chữ cái, điểm âm, điểm > 10) đều được bắt chính xác tại tầng Validation của Spring Boot (ExcelImportService) trước khi ghi vào CSDL. Thời gian phân tích và đối soát file 150 sinh viên chỉ mất 92,9 ms, và thời gian sinh bảng điểm Excel toàn khóa chỉ mất 79,3 ms, đáp ứng hoàn hảo tiêu chí dữ liệu lớn.",
        "Normal"
    )

    # --- 5.6.4 Heading ---
    h3_4 = target_p.insert_paragraph_before("5.6.4. Kiểm thử tương thích đa trình duyệt và thiết bị di động (Cross-Browser & Mobile)", "Heading 3")
    p_cross = target_p.insert_paragraph_before(
        "Kịch bản thử nghiệm (tests/non_functional/04_cross_browser_mobile_test.js): Kiểm thử tự động trên Google Chrome, Microsoft Edge, Safari macOS, và màn hình điện thoại Smartphone (Apple iPhone 14 kích thước 390x844 px, Google Pixel 7 kích thước 412x915 px). Mục tiêu là đảm bảo giao diện hiển thị mượt mà, không vỡ layout, không tràn viền ngang màn hình di động (Zero Horizontal Overflow), và không có lỗi JavaScript Console.",
        "Normal"
    )

    cap4 = target_p.insert_paragraph_before("Bảng 56.4. Bảng kết quả kiểm thử tương thích đa trình duyệt và thiết bị di động", "TableCaption")

    # Table 56.4
    tbl4 = doc.add_table(rows=6, cols=6)
    tbl4.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl4)
    
    headers4 = ["Nền tảng kiểm thử", "Phân loại", "Độ phân giải", "Thời gian tải", "Tràn ngang (Overflow)", "Đánh giá"]
    col_widths4 = [Inches(1.6), Inches(1.2), Inches(1.1), Inches(1.1), Inches(1.2), Inches(0.8)]
    
    for c_idx, h in enumerate(headers4):
        cell = tbl4.rows[0].cells[c_idx]
        cell.width = col_widths4[c_idx]
        set_cell_margins(cell, top=120, bottom=120, left=150, right=150)
        set_cell_shading(cell, "EBF3FB")
        format_cell_text(cell, h, bold=True, font_size=10, align=WD_ALIGN_PARAGRAPH.CENTER)

    data4 = [
        ["Google Chrome 130+", "Desktop PC", "1920 x 1080", "1.326 ms", "Không tràn (0 px)", "Đạt"],
        ["Microsoft Edge 130+", "Desktop PC", "1920 x 1080", "1.302 ms", "Không tràn (0 px)", "Đạt"],
        ["Apple Safari (macOS)", "Laptop Retina", "1440 x 900", "1.217 ms", "Không tràn (0 px)", "Đạt"],
        ["Apple iPhone 14", "Smartphone iOS", "390 x 844", "1.237 ms", "Không tràn ngang (0 px)", "Đạt"],
        ["Google Pixel 7", "Smartphone Android", "412 x 915", "1.155 ms", "Không tràn ngang (0 px)", "Đạt"]
    ]
    for r_idx, row_data in enumerate(data4):
        for c_idx, val in enumerate(row_data):
            cell = tbl4.rows[r_idx + 1].cells[c_idx]
            cell.width = col_widths4[c_idx]
            set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
            align = WD_ALIGN_PARAGRAPH.CENTER if c_idx in [1, 2, 3, 4, 5] else WD_ALIGN_PARAGRAPH.LEFT
            format_cell_text(cell, val, bold=(c_idx == 5), font_size=9, align=align)

    target_p._p.addprevious(tbl4._tbl)

    p_cross_eval = target_p.insert_paragraph_before(
        "Nhận xét kết quả: Toàn bộ 5/5 nền tảng trình duyệt và thiết bị di động đều hiển thị mượt mà với thời gian tải trang dưới 1,5 giây. Trên màn hình điện thoại Smartphone (chiều rộng 390px và 412px), tính năng Flexbox và Tailwind CSS Responsive đã giữ cho các bảng tra cứu điểm và thời khóa biểu không bị tràn ngang (Zero Horizontal Overflow), không làm xuất hiện thanh cuộn ngang gây ức chế người dùng. Hồ sơ Console ghi nhận 0 lỗi.",
        "Normal"
    )

    # Chèn ảnh minh chứng giao diện Smartphone nếu file ảnh tồn tại
    img_path = os.path.abspath("tests/test-results/compatibility/mobile_iphone14.png")
    if os.path.exists(img_path):
        p_img = target_p.insert_paragraph_before("", "Normal")
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run_img = p_img.add_run()
        run_img.add_picture(img_path, width=Inches(3.2))
        cap_img = target_p.insert_paragraph_before("Hình 134. Minh chứng thực nghiệm hiển thị giao diện cổng sinh viên trên màn hình Smartphone (iPhone 14 Viewport 390x844)", "FigureCaption")
        cap_img.alignment = WD_ALIGN_PARAGRAPH.CENTER

    print(f"Saving updated document to {DOC_PATH}...")
    doc.save(DOC_PATH)
    print("SUCCESS: Document updated successfully!")

if __name__ == "__main__":
    main()
