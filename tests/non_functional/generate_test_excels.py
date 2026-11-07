"""
generate_test_excels.py
Sinh ra các file Excel phục vụ kiểm thử dữ liệu lớn và các ca biên sai lệch:
1. invalid_format.txt (Sai định dạng file)
2. empty_columns.xlsx (Trống cột bắt buộc / trống mã ĐK)
3. letter_scores.xlsx (Điểm chữ thay vì số)
4. negative_scores.xlsx (Điểm âm: -1.0, -0.5)
5. overflow_scores.xlsx (Điểm vượt trần > 10: 12.0, 15.0)
6. large_roster_150.xlsx (Dữ liệu lớn 150 sinh viên)
"""

import os
import sys
import openpyxl

OUT_DIR = os.path.join(os.path.dirname(__file__), 'temp_excels')
os.makedirs(OUT_DIR, exist_ok=True)

# 1. File sai định dạng
with open(os.path.join(OUT_DIR, 'wrong_format.txt'), 'w', encoding='utf-8') as f:
    f.write("Day la file van ban thuan, khong phai file Excel .xlsx")

def create_base_wb():
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Nhập Điểm"
    ws.append(["PHIẾU NHẬP ĐIỂM LỚP HỌC PHẦN"])
    ws.append(["Lớp: TEST_EXCEL - Môn: Nhập môn CNTT"])
    ws.append(["Hướng dẫn: Nhập 4 cột điểm thang 0-10"])
    ws.append([]) # Dòng 4 trống
    # Dòng 5 (index 5): Header
    ws.append(["Mã ĐK (Enrollment ID)", "Mã Sinh Viên", "Họ và Tên", "CC1 (5%)", "CC2 (5%)", "Giữa Kỳ (30%)", "Cuối Kỳ (60%)"])
    return wb, ws

# 2. File trống cột / trống mã ĐK
wb, ws = create_base_wb()
ws.append(["", "23010001", "Nguyễn Văn A", 8.0, 9.0, 7.5, 8.5])
ws.append(["101", "", "Trần Thị B", 9.0, 9.0, 8.0, 9.0])
wb.save(os.path.join(OUT_DIR, 'empty_columns.xlsx'))

# 3. File điểm chữ thay vì số
wb, ws = create_base_wb()
ws.append([101, "23010001", "Nguyễn Văn A", "CHÍN", "A+", 8.0, 7.5])
ws.append([102, "23010002", "Trần Văn B", 8.0, "MƯỜI", "B", 9.0])
wb.save(os.path.join(OUT_DIR, 'letter_scores.xlsx'))

# 4. File điểm âm
wb, ws = create_base_wb()
ws.append([101, "23010001", "Nguyễn Văn A", -1.0, 8.0, -0.5, 7.0])
wb.save(os.path.join(OUT_DIR, 'negative_scores.xlsx'))

# 5. File điểm > 10
wb, ws = create_base_wb()
ws.append([101, "23010001", "Nguyễn Văn A", 12.5, 8.0, 15.0, 9.0])
wb.save(os.path.join(OUT_DIR, 'overflow_scores.xlsx'))

# 6. File dữ liệu lớn 150 sinh viên hợp lệ
wb, ws = create_base_wb()
for i in range(1, 151):
    ws.append([
        1000 + i,
        f"2301{i:04d}",
        f"Sinh Viên Thử Nghiệm #{i}",
        round(7.0 + (i % 3) * 0.5, 1),
        round(8.0 + (i % 2) * 0.5, 1),
        round(6.5 + (i % 4) * 0.5, 1),
        round(7.5 + (i % 3) * 0.5, 1)
    ])
wb.save(os.path.join(OUT_DIR, 'large_roster_150.xlsx'))

print(f"Generated test files in {OUT_DIR}")
