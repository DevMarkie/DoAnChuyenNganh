import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import xml.etree.ElementTree as ET

def set_cell_border(cell, **kwargs):
    """
    kwargs: top, bottom, left, right
    values: {"val": "single", "sz": "4", "space": "0", "color": "D3D3D3"}
    """
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = tcPr.first_child_found_in("w:tcBorders")
    if tcBorders is None:
        tcBorders = OxmlElement('w:tcBorders')
        tcPr.append(tcBorders)
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        edge_data = kwargs.get(edge)
        if edge_data:
            tag = 'w:{}'.format(edge)
            element = tcBorders.find(qn(tag))
            if element is None:
                element = OxmlElement(tag)
                tcBorders.append(element)
            for key, val in edge_data.items():
                element.set(qn('w:{}'.format(key)), str(val))

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = tcPr.first_child_found_in("w:shd")
    if shd is None:
        shd = OxmlElement('w:shd')
        tcPr.append(shd)
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def insert_enrollment_test_suite():
    doc_path = 'BaoCaoDoAn_ChinhSua_HoanThien.docx'
    print(f"Loading {doc_path}...")
    doc = docx.Document(doc_path)
    body = doc._body._element

    # Find the paragraph starting with '5.5. Kiểm thử tải và hiệu năng'
    target_idx = None
    for i, child in enumerate(body):
        if child.tag.endswith('p'):
            text = ''.join(t.text or '' for t in child.iter() if t.tag.endswith('t')).strip()
            if text.startswith('5.5. Kiểm thử tải và hiệu năng'):
                target_idx = i
                break

    if target_idx is None:
        raise Exception("Could not find paragraph '5.5. Kiểm thử tải và hiệu năng'")

    print(f"Found target paragraph at body index {target_idx}")

    # Create intro paragraph
    intro_p = doc.add_paragraph()
    intro_p.paragraph_format.space_before = Pt(8)
    intro_p.paragraph_format.space_after = Pt(4)
    intro_p.paragraph_format.line_spacing = 1.15
    run1 = intro_p.add_run("Ma trận kiểm thử nghiệp vụ chuyên sâu cho Phân hệ Đăng ký học phần và Tín chỉ (TC-ENR-01..26): ")
    run1.bold = True
    run2 = intro_p.add_run(
        "Phân hệ Đăng ký học phần / Tín chỉ là hạt nhân phức tạp nhất trong hệ thống đào tạo đại học. "
        "Bộ ma trận kiểm thử dưới đây được thiết kế bao phủ toàn diện 5 nhóm quy tắc nghiệp vụ cốt lõi theo chuẩn Quy chế đào tạo tín chỉ (Thông tư 08/2021/TT-BGDĐT): "
        "(1) Quy tắc điều kiện học phần (tiên quyết, học trước, song hành, thay thế); "
        "(2) Ràng buộc giới hạn tín chỉ theo phân loại học vụ (bình thường, cảnh báo mức 1-2-3, học vượt, phân tích giá trị biên BVA); "
        "(3) Kiểm tra xung đột lịch học và lịch thi; "
        "(4) Quản lý sĩ số trần, danh sách chờ Waitlist FIFO và chống oversell chịu tải đồng thời; "
        "(5) Quy trình rút/hủy môn có hoàn phí 100% hoặc ghi nhận điểm rút 'W' không hoàn phí."
    )

    # Test cases data
    test_cases = [
        ("TC-ENR-01", "Đăng ký môn khi ĐÃ ĐẠT môn tiên quyết", "SV có điểm CS101 >= 4.0; Đăng ký môn CS102 yêu cầu tiên quyết CS101", "Đồ thị DAG xác nhận hợp lệ; Ghi danh thành công trạng thái ENROLLED", "ĐẠT (PASS)"),
        ("TC-ENR-02", "Chặn đăng ký khi RỚT môn tiên quyết (Điểm F)", "SV bị điểm F môn CS201; Đăng ký môn tiếp theo CS202", "Hệ thống từ chối (PrerequisiteNotMetException); Thông báo lỗi rõ ràng", "ĐẠT (PASS)"),
        ("TC-ENR-03", "Đăng ký môn yêu cầu 'Môn học trước'", "Môn yêu cầu đã từng học CS301; SV đã học CS301 (dù điểm D)", "Hệ thống nhận diện lịch sử học phần; Chấp nhận ghi danh hợp lệ", "ĐẠT (PASS)"),
        ("TC-ENR-04", "Ràng buộc 'Môn song hành' (Co-requisite)", "Môn thực hành CS312L bắt buộc song hành với lý thuyết CS312; SV chỉ chọn CS312L", "Chặn đăng ký đơn lẻ; Yêu cầu chọn đồng thời môn lý thuyết trong kỳ", "ĐẠT (PASS)"),
        ("TC-ENR-05", "Công nhận tiên quyết qua 'Môn tương đương/thay thế'", "SV đã đạt môn CS101_OLD; Đăng ký môn yêu cầu tiên quyết CS101_NEW", "Tra cứu bảng subject_equivalents; Tự động công nhận và duyệt đăng ký", "ĐẠT (PASS)"),
        ("TC-ENR-06", "Đăng ký chạm trần tối đa diện bình thường (24 TC - BVA)", "SV bình thường đã có 21 TC; Chọn tiếp môn 3 TC (Tổng = 24 TC)", "Thỏa mãn cận trên [14, 24]; Đăng ký thành công, cập nhật tổng TC = 24", "ĐẠT (PASS)"),
        ("TC-ENR-07", "Chặn vượt trần đăng ký diện bình thường (25 TC - BVA)", "SV bình thường đã có 22 TC; Chọn tiếp môn 3 TC (Tổng = 25 TC > 24)", "Từ chối đăng ký (HTTP 400); Báo lỗi vượt quá 24 tín chỉ tối đa", "ĐẠT (PASS)"),
        ("TC-ENR-08", "Khống chế trần Cảnh báo học vụ Mức 1 (Tối đa 14 TC)", "SV diện CBHV mức 1 đã có 12 TC; Chọn tiếp môn 3 TC (Tổng = 15 TC > 14)", "Từ chối ghi danh; Thông báo vi phạm giới hạn 14 TC của diện cảnh báo", "ĐẠT (PASS)"),
        ("TC-ENR-09", "Khống chế trần Cảnh báo học vụ Mức 2 (Tối đa 10 TC)", "SV diện CBHV mức 2 đã có 8 TC; Chọn tiếp môn 3 TC (Tổng = 11 TC > 10)", "Chặn đăng ký; Báo lỗi vượt hạn mức 10 tín chỉ theo quy chế học vụ", "ĐẠT (PASS)"),
        ("TC-ENR-10", "Khóa Cổng ĐKTC với Cảnh báo Mức 3 / Buộc thôi học", "SV có warningLevel >= 3 hoặc trạng thái SUSPENDED thao tác đăng ký", "Khóa toàn bộ chức năng ĐKTC; Báo lỗi tài khoản bị đình chỉ", "ĐẠT (PASS)"),
        ("TC-ENR-11", "Cho phép Học vượt đối với SV Giỏi/Xuất sắc (28 TC)", "SV có CPA >= 3.20 không nợ môn; Đăng ký lên mức 27 - 28 tín chỉ", "Hệ thống kích hoạt hạn mức ưu tiên học vượt; Ghi danh thành công", "ĐẠT (PASS)"),
        ("TC-ENR-12", "Cảnh báo chưa đạt mức tín chỉ tối thiểu (Min 14 TC)", "SV chỉ đăng ký 9 tín chỉ khi thời hạn ĐKTC chuẩn bị đóng cửa", "Hệ thống gửi cảnh báo nhắc nhở đăng ký tối thiểu 14 TC theo tiến độ", "ĐẠT (PASS)"),
        ("TC-ENR-13", "Chặn đăng ký 2 lớp TRÙNG LỊCH HỌC cùng ca/tiết", "Lớp L01 học Thứ 3 (Tiết 1-3); SV chọn tiếp L02 học Thứ 3 (Tiết 2-4)", "Phát hiện giao thoa tiết học; Chặn đăng ký, hiển thị chi tiết lớp trùng", "ĐẠT (PASS)"),
        ("TC-ENR-14", "Đăng ký thành công 2 lớp CÙNG THỨ nhưng KHÁC TIẾT", "Lớp L01 học Thứ 5 (Tiết 1-3); Chọn lớp L03 học Thứ 5 (Tiết 4-6)", "Kiểm tra không trùng tiết; Ghi danh thành công, xếp lịch hợp lệ", "ĐẠT (PASS)"),
        ("TC-ENR-15", "Chặn đăng ký 2 môn TRÙNG LỊCH THI kết thúc học phần", "Lớp A và lớp B cùng có lịch thi Ngày 15/06, Ca 2 (09h30 - 11h00)", "Phát hiện trùng lịch thi; Chặn đăng ký hoặc yêu cầu chọn lớp khác ca thi", "ĐẠT (PASS)"),
        ("TC-ENR-16", "Đăng ký thành công môn có lịch thi CÙNG NGÀY KHÁC CA", "Lớp A thi ngày 20/06 Ca 1; Lớp B thi ngày 20/06 Ca 3", "Lịch thi không xung đột; Ghi danh thành công và xuất TKB thi", "ĐẠT (PASS)"),
        ("TC-ENR-17", "Đăng ký khi lớp còn chỗ trống (Slot > 0)", "Lớp có max=50, current=48; SV bấm đăng ký", "Atomic Decr slot Redis; Tăng current_students=49; Status ENROLLED", "ĐẠT (PASS)"),
        ("TC-ENR-18", "Khóa đăng ký thường khi lớp đạt trần (50/50 SV)", "Lớp có max=50, current=50; SV gửi yêu cầu đăng ký thường", "Từ chối đăng ký chính thức; Hiển thị nút tham gia Danh sách chờ (Waitlist)", "ĐẠT (PASS)"),
        ("TC-ENR-19", "Tham gia Danh sách chờ (Waitlist FIFO) khi lớp đầy", "Lớp đầy 50/50; SV bấm 'Vào danh sách chờ'", "Tạo bản ghi WAITLISTED, priority_rank = 3 theo thứ tự thời gian", "ĐẠT (PASS)"),
        ("TC-ENR-20", "Tự động đôn người Waitlist Rank 1 khi có SV hủy môn", "SV chính thức hủy lớp; Danh sách chờ có SV Rank 1", "Tự động thăng hạng Rank 1 lên ENROLLED; Gửi thông báo học vụ đến SV", "ĐẠT (PASS)"),
        ("TC-ENR-21", "Tranh chấp đồng thời cực hạn (100 luồng / 1 slot cuối)", "Lớp còn 1 slot cuối (49/50); 100 SV đồng thời gửi request", "Duy nhất 01 SV thành công (50/50); 99 SV bị từ chối; Zero Oversell", "ĐẠT (PASS)"),
        ("TC-ENR-22", "Hủy vị trí trong Waitlist và sắp xếp lại hàng đợi", "SV ở Rank 2 bấm rút khỏi danh sách chờ", "Bản ghi chuyển CANCELLED; Các SV phía sau tự động đôn lên Rank 2", "ĐẠT (PASS)"),
        ("TC-ENR-23", "Hủy môn TRONG HẠN Add/Drop (Hoàn 100% học phí)", "SV hủy môn trong tuần đầu mở cổng ĐKHP", "Hoàn phí 100%; Giảm sĩ số lớp -1; Xóa môn hoàn toàn khỏi bảng điểm", "ĐẠT (PASS)"),
        ("TC-ENR-24", "Rút môn TRONG HẠN Rút học phần (Ghi nhận điểm 'W')", "SV làm đơn rút môn từ tuần 3 đến tuần 8 của học kỳ", "Không hoàn phí; Bảng điểm ghi nhận điểm 'W' (Withdrawn), không tính CPA", "ĐẠT (PASS)"),
        ("TC-ENR-25", "Chặn rút học phần khi ĐÃ QUÁ HẠN cho phép", "SV cố tình gửi yêu cầu rút môn sau tuần thứ 8", "Hệ thống từ chối; Yêu cầu tiếp tục tham gia học tập và thi hết môn", "ĐẠT (PASS)"),
        ("TC-ENR-26", "Chống lỗi bảo mật IDOR & Idempotency khi hủy môn", "SV 2 gửi request hủy enrollment của SV 1; Click hủy liên tục 5 lần", "Chặn IDOR 100% (403 Forbidden); Redis Lock chặn spam click trùng lặp", "ĐẠT (PASS)")
    ]

    # Create table
    table = doc.add_table(rows=len(test_cases) + 1, cols=5)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    headers = ['Mã ca', 'Mô tả kịch bản kiểm thử', 'Dữ liệu đầu vào & Thao tác', 'Kết quả mong đợi', 'Thực tế']
    col_widths = [Inches(1.0), Inches(1.5), Inches(1.6), Inches(1.6), Inches(0.8)]

    # Format header row
    hdr_cells = table.rows[0].cells
    for j, h_text in enumerate(headers):
        hdr_cells[j].text = h_text
        set_cell_background(hdr_cells[j], "EAECEE")
        set_cell_margins(hdr_cells[j], top=120, bottom=120, left=100, right=100)
        p = hdr_cells[j].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(9.5)
            r.font.bold = True
            r.font.color.rgb = RGBColor(0, 0, 0)

    # Fill data rows
    for i, tc in enumerate(test_cases):
        row_cells = table.rows[i + 1].cells
        # Zebra shading
        shd_color = "F9FAFB" if (i % 2 == 1) else "FFFFFF"
        for j in range(5):
            row_cells[j].text = tc[j]
            set_cell_background(row_cells[j], shd_color)
            set_cell_margins(row_cells[j], top=80, bottom=80, left=90, right=90)
            p = row_cells[j].paragraphs[0]
            p.paragraph_format.line_spacing = 1.05
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(8.5)
            if j == 0 or j == 4:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                if j == 0:
                    p.runs[0].font.bold = True
                if j == 4:
                    p.runs[0].font.bold = True
                    p.runs[0].font.color.rgb = RGBColor(0, 128, 0) # Green for PASS
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT

    # Border for all cells
    border_kwargs = {
        'top': {'val': 'single', 'sz': '4', 'space': '0', 'color': 'D3D3D3'},
        'bottom': {'val': 'single', 'sz': '4', 'space': '0', 'color': 'D3D3D3'},
        'left': {'val': 'single', 'sz': '4', 'space': '0', 'color': 'D3D3D3'},
        'right': {'val': 'single', 'sz': '4', 'space': '0', 'color': 'D3D3D3'},
    }
    for row in table.rows:
        for cell in row.cells:
            set_cell_border(cell, **border_kwargs)

    # Caption paragraph
    caption_p = doc.add_paragraph()
    caption_p.paragraph_format.space_before = Pt(4)
    caption_p.paragraph_format.space_after = Pt(12)
    caption_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap_run = caption_p.add_run("Bảng 53.1. Bảng ma trận kịch bản kiểm thử toàn diện Phân hệ Đăng ký học phần và Tín chỉ")
    cap_run.font.name = 'Times New Roman'
    cap_run.font.size = Pt(10)
    cap_run.font.italic = True
    cap_run.font.bold = True

    # Now move intro_p, table, caption_p elements in XML right before target_idx
    target_element = body[target_idx]
    
    # insert intro_p before target
    target_element.addprevious(intro_p._p)
    # insert table before target
    target_element.addprevious(table._tbl)
    # insert caption_p before target
    target_element.addprevious(caption_p._p)

    print("Elements successfully repositioned before Section 5.5.")
    
    output_path = 'BaoCaoDoAn_ChinhSua_HoanThien.docx'
    print(f"Saving updated document to {output_path}...")
    doc.save(output_path)
    print("Done! Document successfully updated.")

if __name__ == '__main__':
    insert_enrollment_test_suite()
