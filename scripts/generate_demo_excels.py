import os
import re
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# Ensure output directory exists
OUTPUT_DIR = os.path.join(os.getcwd(), "demo_excel")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# -------------------------------------------------------------
# Read seed data to get real enrollment info for Section 37
# -------------------------------------------------------------
with open("database/seed.sql", "r", encoding="utf-8") as f:
    sql_text = f.read()

# Map student_id -> (code, full_name)
student_matches = re.findall(r"\((\d+),\s*(\d+),\s*'([^']+)',\s*'([^']+)'", sql_text)
students_map = {int(m[0]): (m[2], m[3]) for m in student_matches}

# Enrollments for section 37: (enr_id, st_id)
enr_matches = re.findall(r"\((\d+),\s*(\d+),\s*37,\s*'[^']+',\s*'ENROLLED'\)", sql_text)
sec37_roster = []
for enr_id, st_id in enr_matches:
    st_id = int(st_id)
    if st_id in students_map:
        code, name = students_map[st_id]
        sec37_roster.append({
            "enr_id": int(enr_id),
            "code": code,
            "name": name
        })

print(f"Loaded {len(sec37_roster)} real enrolled students for Section 37.")

# -------------------------------------------------------------
# Common Styling Definitions
# -------------------------------------------------------------
FONT_NAME = "Calibri"

title_font = Font(name=FONT_NAME, size=15, bold=True, color="1E3A8A")
subtitle_font = Font(name=FONT_NAME, size=11, bold=True, color="1F2937")
note_font = Font(name=FONT_NAME, size=10, italic=True, color="4B5563")

header_fill_blue = PatternFill(start_color="1E40AF", end_color="1E40AF", fill_type="solid") # Dark Blue
header_font = Font(name=FONT_NAME, size=11, bold=True, color="FFFFFF")

zebra_fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
white_fill = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
highlight_error_fill = PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid") # Light red for bad cells
highlight_error_font = Font(name=FONT_NAME, size=11, bold=True, color="B91C1C")

thin_border_side = Side(style="thin", color="CBD5E1")
cell_border = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)
thick_bottom = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=Side(style="medium", color="1E40AF"))

align_center = Alignment(horizontal="center", vertical="center")
align_left = Alignment(horizontal="left", vertical="center")
align_right = Alignment(horizontal="right", vertical="center")

def autofit_columns(ws, max_cols=9):
    for col in range(1, max_cols + 1):
        col_letter = get_column_letter(col)
        max_len = 0
        for row in range(5, ws.max_row + 1):
            val = ws.cell(row=row, column=col).value
            if val is not None:
                max_len = max(max_len, len(str(val)))
        header_val = ws.cell(row=5, column=col).value
        if header_val is not None:
            max_len = max(max_len, len(str(header_val)))
        ws.column_dimensions[col_letter].width = max(max_len + 5, 12)

# =============================================================
# FILE 1: 01_SinhVien_Moi_HopLe.xlsx (25 sinh viên hợp lệ 100%)
# Đuôi email chuẩn: @sv.sms.edu.vn
# =============================================================
wb1 = openpyxl.Workbook()
ws1 = wb1.active
ws1.title = "Danh Sách Sinh Viên"
ws1.views.sheetView[0].showGridLines = True

ws1.merge_cells("A1:I1")
ws1["A1"] = "DANH SÁCH TÂN SINH VIÊN NHẬP HỌC (FILE MẪU CHUẨN)"
ws1["A1"].font = title_font
ws1["A1"].alignment = align_center

ws1.merge_cells("A2:I2")
ws1["A2"] = "Hệ thống Quản lý Đào tạo SMS — Phân hệ Quản trị tiếp nhận sinh viên khóa mới"
ws1["A2"].font = subtitle_font
ws1["A2"].alignment = align_center

ws1.merge_cells("A3:I3")
ws1["A3"] = "Hướng dẫn: Các cột có dấu (*) là bắt buộc. Ngày sinh YYYY-MM-DD. Giới tính: Nam/Nữ. Email đuôi @sv.sms.edu.vn. Mã lớp SH phải tồn tại trong hệ thống."
ws1["A3"].font = note_font
ws1["A3"].alignment = align_center

student_headers = ["STT", "Mã Sinh Viên (*)", "Họ và Tên (*)", "Ngày Sinh (*)", "Giới Tính (*)", "Mã Lớp SH (*)", "Email (*)", "Số Điện Thoại", "Địa Chỉ"]

ws1.append([]) # row 4 empty
ws1.append(student_headers) # row 5 headers

for col_idx in range(1, 10):
    c = ws1.cell(row=5, column=col_idx)
    c.fill = header_fill_blue
    c.font = header_font
    c.alignment = align_center
    c.border = thick_bottom
ws1.row_dimensions[5].height = 26

sample_students_clean = [
    (1,  "24010101", "Nguyễn Hải Đăng",    "2006-03-12", "Nam", "K19-SE1",  "24010101@sv.sms.edu.vn", "0912001001", "Hà Nội"),
    (2,  "24010102", "Trần Mai Anh",       "2006-05-18", "Nữ",  "K19-SE1",  "24010102@sv.sms.edu.vn", "0912001002", "Bắc Ninh"),
    (3,  "24010103", "Lê Hoàng Phúc",      "2006-01-25", "Nam", "K19-SE1",  "24010103@sv.sms.edu.vn", "0912001003", "Hải Phòng"),
    (4,  "24010104", "Phạm Quỳnh Chi",     "2006-08-09", "Nữ",  "K19-ENG1", "24010104@sv.sms.edu.vn", "0912001004", "Nam Định"),
    (5,  "24010105", "Đặng Minh Quân",     "2006-04-14", "Nam", "K19-SE1",  "24010105@sv.sms.edu.vn", "0912001005", "Hà Nội"),
    (6,  "24010106", "Vũ Phương Linh",     "2006-11-02", "Nữ",  "K19-ENG1", "24010106@sv.sms.edu.vn", "0912001006", "Quảng Ninh"),
    (7,  "24010107", "Hoàng Gia Huy",      "2006-07-30", "Nam", "K19-SE1",  "24010107@sv.sms.edu.vn", "0912001007", "Hà Nam"),
    (8,  "24010108", "Ngô Bảo Ngọc",       "2006-09-15", "Nữ",  "K19-ENG1", "24010108@sv.sms.edu.vn", "0912001008", "Vĩnh Phúc"),
    (9,  "24010109", "Bùi Đức Thịnh",      "2006-02-28", "Nam", "K19-SE1",  "24010109@sv.sms.edu.vn", "0912001009", "Thái Bình"),
    (10, "24010110", "Dương Thuỳ Dung",    "2006-12-10", "Nữ",  "K19-ENG1", "24010110@sv.sms.edu.vn", "0912001010", "Hà Nội"),
    (11, "24010111", "Đỗ Tuấn Kiệt",       "2006-06-21", "Nam", "K19-SE1",  "24010111@sv.sms.edu.vn", "0912001011", "Hưng Yên"),
    (12, "24010112", "Nguyễn Thảo Nguyên", "2006-10-05", "Nữ",  "K19-ENG1", "24010112@sv.sms.edu.vn", "0912001012", "Hải Dương"),
    (13, "24010113", "Lý Thanh Tùng",      "2006-03-08", "Nam", "K19-SE1",  "24010113@sv.sms.edu.vn", "0912001013", "Hà Nội"),
    (14, "24010114", "Chu Thu Hằng",       "2006-05-31", "Nữ",  "K19-ENG1", "24010114@sv.sms.edu.vn", "0912001014", "Ninh Bình"),
    (15, "24010115", "Tô Tuấn Vũ",         "2006-07-19", "Nam", "K19-SE1",  "24010115@sv.sms.edu.vn", "0912001015", "Phú Thọ"),
    (16, "24010116", "Đinh Diệu Huyền",    "2006-09-24", "Nữ",  "K19-ENG1", "24010116@sv.sms.edu.vn", "0912001016", "Hà Nội"),
    (17, "24010117", "Mai Văn Dũng",       "2006-01-11", "Nam", "K19-SE1",  "24010117@sv.sms.edu.vn", "0912001017", "Thái Nguyên"),
    (18, "24010118", "Tạ Bích Phượng",     "2006-04-03", "Nữ",  "K19-ENG1", "24010118@sv.sms.edu.vn", "0912001018", "Bắc Giang"),
    (19, "24010119", "Trịnh Hữu Thắng",    "2006-08-17", "Nam", "K19-SE1",  "24010119@sv.sms.edu.vn", "0912001019", "Hà Nội"),
    (20, "24010120", "Cao Mỹ Linh",        "2006-11-29", "Nữ",  "K19-ENG1", "24010120@sv.sms.edu.vn", "0912001020", "Hà Nam"),
    (21, "24010121", "Lương Quang Khải",   "2006-02-14", "Nam", "K19-SE1",  "24010121@sv.sms.edu.vn", "0912001021", "Thanh Hóa"),
    (22, "24010122", "Phan Bích Trâm",     "2006-06-07", "Nữ",  "K19-ENG1", "24010122@sv.sms.edu.vn", "0912001022", "Nghệ An"),
    (23, "24010123", "Nghiêm Anh Tuấn",    "2006-10-16", "Nam", "K19-SE1",  "24010123@sv.sms.edu.vn", "0912001023", "Hà Nội"),
    (24, "24010124", "Phùng Cẩm Tú",       "2006-12-04", "Nữ",  "K19-ENG1", "24010124@sv.sms.edu.vn", "0912001024", "Hòa Bình"),
    (25, "24010125", "Vương Đình Sang",    "2006-03-22", "Nam", "K19-SE1",  "24010125@sv.sms.edu.vn", "0912001025", "Lạng Sơn")
]

for row_idx, st in enumerate(sample_students_clean, start=6):
    ws1.append(st)
    fill = zebra_fill if row_idx % 2 == 0 else white_fill
    for col_idx in range(1, 10):
        c = ws1.cell(row=row_idx, column=col_idx)
        c.fill = fill
        c.border = cell_border
        if col_idx in (1, 2, 4, 5, 6, 8):
            c.alignment = align_center
        else:
            c.alignment = align_left
    ws1.row_dimensions[row_idx].height = 20

autofit_columns(ws1, 9)
f1_path = os.path.join(OUTPUT_DIR, "01_SinhVien_Moi_HopLe.xlsx")
wb1.save(f1_path)
print(f"Saved: {f1_path}")

# =============================================================
# FILE 2: 02_SinhVien_CoLoi_KiemTraDoiSoat.xlsx (Xen kẽ 4 lỗi kiểm thử)
# Đuôi email chuẩn: @sv.sms.edu.vn
# =============================================================
wb2 = openpyxl.Workbook()
ws2 = wb2.active
ws2.title = "Danh Sách Sinh Viên"
ws2.views.sheetView[0].showGridLines = True

ws2.merge_cells("A1:I1")
ws2["A1"] = "DANH SÁCH TÂN SINH VIÊN (DỮ LIỆU ĐỐI SOÁT & KIỂM THỬ LỖI)"
ws2["A1"].font = Font(name=FONT_NAME, size=15, bold=True, color="991B1B")
ws2["A1"].alignment = align_center

ws2.merge_cells("A2:I2")
ws2["A2"] = "Dữ liệu phục vụ demo tính năng Preview Bắt Lỗi Đối Soát Trực Quan trên SMS Portal"
ws2["A2"].font = subtitle_font
ws2["A2"].alignment = align_center

ws2.merge_cells("A3:I3")
ws2["A3"] = "Lưu ý: File có cố tình cài 4 dòng lỗi nghiệp vụ (Mã lớp sai, Trùng MSSV trong DB, Email sai định dạng, Lặp MSSV trong file)."
ws2["A3"].font = note_font
ws2["A3"].alignment = align_center

ws2.append([])
ws2.append(student_headers)

for col_idx in range(1, 10):
    c = ws2.cell(row=5, column=col_idx)
    c.fill = header_fill_blue
    c.font = header_font
    c.alignment = align_center
    c.border = thick_bottom
ws2.row_dimensions[5].height = 26

# 25 students, with intentional errors:
# Row STT 5  (row 10): Class "CNTT99-K99" -> Mã lớp sinh hoạt không tồn tại
# Row STT 10 (row 15): MSSV "2300001"     -> Mã sinh viên đã tồn tại trên hệ thống
# Row STT 15 (row 20): Email "24010215_invalid_email_sms" (thiếu @) -> Email không hợp lệ
# Row STT 20 (row 25): MSSV "24010201" duplicate of Row STT 1 -> Mã sinh viên bị lặp lại trong file
sample_students_with_errors = [
    (1,  "24010201", "Nguyễn Hải Đăng",    "2006-03-12", "Nam", "K19-SE1",    "24010201@sv.sms.edu.vn", "0912002001", "Hà Nội"),
    (2,  "24010202", "Trần Mai Anh",       "2006-05-18", "Nữ",  "K19-SE1",    "24010202@sv.sms.edu.vn", "0912002002", "Bắc Ninh"),
    (3,  "24010203", "Lê Hoàng Phúc",      "2006-01-25", "Nam", "K19-SE1",    "24010203@sv.sms.edu.vn", "0912002003", "Hải Phòng"),
    (4,  "24010204", "Phạm Quỳnh Chi",     "2006-08-09", "Nữ",  "K19-ENG1",   "24010204@sv.sms.edu.vn", "0912002004", "Nam Định"),
    # ERROR 1: Sai mã lớp sinh hoạt (CNTT99-K99 không tồn tại trong DB)
    (5,  "24010205", "Đặng Minh Quân",     "2006-04-14", "Nam", "CNTT99-K99", "24010205@sv.sms.edu.vn", "0912002005", "Hà Nội"),
    (6,  "24010206", "Vũ Phương Linh",     "2006-11-02", "Nữ",  "K19-ENG1",   "24010206@sv.sms.edu.vn", "0912002006", "Quảng Ninh"),
    (7,  "24010207", "Hoàng Gia Huy",      "2006-07-30", "Nam", "K19-SE1",    "24010207@sv.sms.edu.vn", "0912002007", "Hà Nam"),
    (8,  "24010208", "Ngô Bảo Ngọc",       "2006-09-15", "Nữ",  "K19-ENG1",   "24010208@sv.sms.edu.vn", "0912002008", "Vĩnh Phúc"),
    (9,  "24010209", "Bùi Đức Thịnh",      "2006-02-28", "Nam", "K19-SE1",    "24010209@sv.sms.edu.vn", "0912002009", "Thái Bình"),
    # ERROR 2: Trùng MSSV đã tồn tại trong DB (2300001 là sinh viên K16 đã có)
    (10, "2300001",  "Dương Thuỳ Dung",    "2006-12-10", "Nữ",  "K19-ENG1",   "2300001@sv.sms.edu.vn",  "0912002010", "Hà Nội"),
    (11, "24010211", "Đỗ Tuấn Kiệt",       "2006-06-21", "Nam", "K19-SE1",    "24010211@sv.sms.edu.vn", "0912002011", "Hưng Yên"),
    (12, "24010212", "Nguyễn Thảo Nguyên", "2006-10-05", "Nữ",  "K19-ENG1",   "24010212@sv.sms.edu.vn", "0912002012", "Hải Dương"),
    (13, "24010213", "Lý Thanh Tùng",      "2006-03-08", "Nam", "K19-SE1",    "24010213@sv.sms.edu.vn", "0912002013", "Hà Nội"),
    (14, "24010214", "Chu Thu Hằng",       "2006-05-31", "Nữ",  "K19-ENG1",   "24010214@sv.sms.edu.vn", "0912002014", "Ninh Bình"),
    # ERROR 3: Sai định dạng Email (thiếu @ và đuôi sai)
    (15, "24010215", "Tô Tuấn Vũ",         "2006-07-19", "Nam", "K19-SE1",    "24010215_invalid_email_sms", "0912002015", "Phú Thọ"),
    (16, "24010216", "Đinh Diệu Huyền",    "2006-09-24", "Nữ",  "K19-ENG1",   "24010216@sv.sms.edu.vn", "0912002016", "Hà Nội"),
    (17, "24010217", "Mai Văn Dũng",       "2006-01-11", "Nam", "K19-SE1",    "24010217@sv.sms.edu.vn", "0912002017", "Thái Nguyên"),
    (18, "24010218", "Tạ Bích Phượng",     "2006-04-03", "Nữ",  "K19-ENG1",   "24010218@sv.sms.edu.vn", "0912002018", "Bắc Giang"),
    (19, "24010219", "Trịnh Hữu Thắng",    "2006-08-17", "Nam", "K19-SE1",    "24010219@sv.sms.edu.vn", "0912002019", "Hà Nội"),
    # ERROR 4: Trùng MSSV bị lặp lại trong file (24010201 đã dùng ở dòng 1)
    (20, "24010201", "Cao Mỹ Linh",        "2006-11-29", "Nữ",  "K19-ENG1",   "24010201@sv.sms.edu.vn", "0912002020", "Hà Nam"),
    (21, "24010221", "Lương Quang Khải",   "2006-02-14", "Nam", "K19-SE1",    "24010221@sv.sms.edu.vn", "0912002021", "Thanh Hóa"),
    (22, "24010222", "Phan Bích Trâm",     "2006-06-07", "Nữ",  "K19-ENG1",   "24010222@sv.sms.edu.vn", "0912002022", "Nghệ An"),
    (23, "24010223", "Nghiêm Anh Tuấn",    "2006-10-16", "Nam", "K19-SE1",    "24010223@sv.sms.edu.vn", "0912002023", "Hà Nội"),
    (24, "24010224", "Phùng Cẩm Tú",       "2006-12-04", "Nữ",  "K19-ENG1",   "24010224@sv.sms.edu.vn", "0912002024", "Hòa Bình"),
    (25, "24010225", "Vương Đình Sang",    "2006-03-22", "Nam", "K19-SE1",    "24010225@sv.sms.edu.vn", "0912002025", "Lạng Sơn")
]

error_row_indices = {10, 15, 20, 25} # rows 6+STT-1

for row_idx, st in enumerate(sample_students_with_errors, start=6):
    ws2.append(st)
    is_err = row_idx in error_row_indices
    fill = highlight_error_fill if is_err else (zebra_fill if row_idx % 2 == 0 else white_fill)
    for col_idx in range(1, 10):
        c = ws2.cell(row=row_idx, column=col_idx)
        c.fill = fill
        c.border = cell_border
        if is_err:
            c.font = highlight_error_font
        if col_idx in (1, 2, 4, 5, 6, 8):
            c.alignment = align_center
        else:
            c.alignment = align_left
    ws2.row_dimensions[row_idx].height = 20

autofit_columns(ws2, 9)
f2_path = os.path.join(OUTPUT_DIR, "02_SinhVien_CoLoi_KiemTraDoiSoat.xlsx")
wb2.save(f2_path)
print(f"Saved: {f2_path}")

# =============================================================
# FILE 3: 03_BangDiem_HopLe_IT301.xlsx (25 sinh viên hợp lệ 100%)
# =============================================================
wb3 = openpyxl.Workbook()
ws3 = wb3.active
ws3.title = "Nhập Điểm"
ws3.views.sheetView[0].showGridLines = True

ws3.merge_cells("A1:G1")
ws3["A1"] = "PHIẾU NHẬP ĐIỂM LỚP HỌC PHẦN"
ws3["A1"].font = title_font
ws3["A1"].alignment = align_center

ws3.merge_cells("A2:G2")
ws3["A2"] = "Lớp: IT301-01-HK1-26 — Môn: Lập trình Web — Giảng viên: TS. Nguyễn Hoàng Long"
ws3["A2"].font = subtitle_font
ws3["A2"].alignment = align_center

ws3.merge_cells("A3:G3")
ws3["A3"] = "Hướng dẫn: Chỉ nhập 4 cột điểm (thang 0—10, dùng dấu chấm thập phân). KHÔNG sửa hoặc di chuyển cột \"Mã ĐK\" — đây là khoá nhận diện sinh viên."
ws3["A3"].font = note_font
ws3["A3"].alignment = align_center

grade_headers = ["Mã ĐK (Enrollment ID)", "Mã Sinh Viên", "Họ và Tên", "CC1 (5%)", "CC2 (5%)", "Giữa Kỳ (30%)", "Cuối Kỳ (60%)"]

ws3.append([]) # row 4
ws3.append(grade_headers) # row 5

for col_idx in range(1, 8):
    c = ws3.cell(row=5, column=col_idx)
    c.fill = header_fill_blue
    c.font = header_font
    c.alignment = align_center
    c.border = thick_bottom
ws3.row_dimensions[5].height = 26

# Realistic grade distribution
clean_grades = [
    (8.5, 9.0, 8.0, 8.5),
    (9.0, 9.5, 8.5, 9.0),
    (7.5, 8.0, 7.0, 7.5),
    (10.0, 9.5, 9.0, 9.5),
    (8.0, 8.5, 7.5, 8.0),
    (8.5, 8.0, 8.5, 8.5),
    (9.0, 9.0, 8.0, 8.5),
    (7.0, 7.5, 6.5, 7.0),
    (8.5, 8.5, 8.0, 8.0),
    (9.5, 10.0, 9.0, 9.5),
    (8.0, 8.0, 7.5, 8.0),
    (7.5, 7.0, 6.0, 6.5),
    (9.0, 8.5, 8.5, 9.0),
    (8.5, 9.0, 8.0, 8.5),
    (8.0, 8.5, 7.0, 7.5),
    (10.0, 10.0, 9.5, 9.0),
    (7.5, 8.0, 6.5, 7.0),
    (8.5, 8.5, 8.0, 8.5),
    (9.0, 9.5, 8.5, 9.0),
    (8.0, 8.0, 7.5, 8.0),
    (7.0, 7.5, 6.0, 6.5),
    (8.5, 9.0, 8.5, 8.5),
    (9.5, 9.5, 9.0, 9.5),
    (8.0, 8.5, 7.5, 8.0),
    (9.0, 9.0, 8.5, 9.0)
]

for idx, student in enumerate(sec37_roster[:25]):
    row_idx = 6 + idx
    cc1, cc2, mid, fin = clean_grades[idx]
    row_data = [student["enr_id"], student["code"], student["name"], cc1, cc2, mid, fin]
    ws3.append(row_data)
    fill = zebra_fill if row_idx % 2 == 0 else white_fill
    for col_idx in range(1, 8):
        c = ws3.cell(row=row_idx, column=col_idx)
        c.fill = fill
        c.border = cell_border
        if col_idx in (1, 2, 4, 5, 6, 7):
            c.alignment = align_center
            if col_idx in (4, 5, 6, 7):
                c.number_format = "0.0"
        else:
            c.alignment = align_left
    ws3.row_dimensions[row_idx].height = 20

autofit_columns(ws3, 7)
f3_path = os.path.join(OUTPUT_DIR, "03_BangDiem_HopLe_IT301.xlsx")
wb3.save(f3_path)
print(f"Saved: {f3_path}")

# =============================================================
# FILE 4: 04_BangDiem_CoLoi_Validation.xlsx (Xen kẽ 4 lỗi điểm)
# =============================================================
wb4 = openpyxl.Workbook()
ws4 = wb4.active
ws4.title = "Nhập Điểm"
ws4.views.sheetView[0].showGridLines = True

ws4.merge_cells("A1:G1")
ws4["A1"] = "PHIẾU NHẬP ĐIỂM LỚP HỌC PHẦN (DỮ LIỆU KIỂM THỬ LỖI)"
ws4["A1"].font = Font(name=FONT_NAME, size=15, bold=True, color="991B1B")
ws4["A1"].alignment = align_center

ws4.merge_cells("A2:G2")
ws4["A2"] = "Lớp: IT301-01-HK1-26 — Môn: Lập trình Web — Giảng viên: TS. Nguyễn Hoàng Long"
ws4["A2"].font = subtitle_font
ws4["A2"].alignment = align_center

ws4.merge_cells("A3:G3")
ws4["A3"] = "Lưu ý: File có cố tình cài 4 lỗi nghiệp vụ (Điểm vượt trần 12.5, Điểm dạng chữ \"Vắng\", Điểm âm -2.0, Sai Mã ĐK 999999)."
ws4["A3"].font = note_font
ws4["A3"].alignment = align_center

ws4.append([])
ws4.append(grade_headers)

for col_idx in range(1, 8):
    c = ws4.cell(row=5, column=col_idx)
    c.fill = header_fill_blue
    c.font = header_font
    c.alignment = align_center
    c.border = thick_bottom
ws4.row_dimensions[5].height = 26

grade_error_rows = {10, 15, 20, 25}

for idx, student in enumerate(sec37_roster[:25]):
    row_idx = 6 + idx
    cc1, cc2, mid, fin = clean_grades[idx]
    enr_id = student["enr_id"]

    if row_idx == 10:
        fin = 12.5 # Error: Điểm quá 10
    elif row_idx == 15:
        mid = "Vắng" # Error: Không phải số
    elif row_idx == 20:
        cc1 = -1.5 # Error: Điểm âm
    elif row_idx == 25:
        enr_id = 999999 # Error: Mã ĐK không tồn tại

    row_data = [enr_id, student["code"], student["name"], cc1, cc2, mid, fin]
    ws4.append(row_data)

    is_err = row_idx in grade_error_rows
    fill = highlight_error_fill if is_err else (zebra_fill if row_idx % 2 == 0 else white_fill)
    for col_idx in range(1, 8):
        c = ws4.cell(row=row_idx, column=col_idx)
        c.fill = fill
        c.border = cell_border
        if is_err:
            c.font = highlight_error_font
        if col_idx in (1, 2, 4, 5, 6, 7):
            c.alignment = align_center
            if isinstance(c.value, (int, float)):
                c.number_format = "0.0"
        else:
            c.alignment = align_left
    ws4.row_dimensions[row_idx].height = 20

autofit_columns(ws4, 7)
f4_path = os.path.join(OUTPUT_DIR, "04_BangDiem_CoLoi_Validation.xlsx")
wb4.save(f4_path)
print(f"Saved: {f4_path}")

print("ALL 4 DEMO EXCEL FILES RE-GENERATED SUCCESSFULLY WITH @sv.sms.edu.vn!")
