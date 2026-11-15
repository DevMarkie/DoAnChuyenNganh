# -*- coding: utf-8 -*-
import sys
import os
import win32com.client as win32

sys.stdout.reconfigure(encoding='utf-8')
docx_path = os.path.abspath('dacn.docx')

app = win32.gencache.EnsureDispatch('Word.Application')
app.Visible = False
doc = app.Documents.Open(docx_path, ReadOnly=True)

total_pages = doc.ComputeStatistics(2)
print(f"TOTAL PAGES: {total_pages}")

targets = [
    "CHƯƠNG 1. GIỚI THIỆU VÀ ĐẶT VẤN ĐỀ",
    "CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ NỀN TẢNG CÔNG NGHỆ",
    "CHƯƠNG 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG",
    "CHƯƠNG 4. HIỆN THỰC, TRIỂN KHAI VÀ KIỂM THỬ HỆ THỐNG",
    "CHƯƠNG 5. KẾT LUẬN, ĐẠO ĐỨC NGHỀ NGHIỆP VÀ HƯỚNG PHÁT TRIỂN",
    "TÀI LIỆU THAM KHẢO"
]

for t in targets:
    rng = doc.Content
    find = rng.Find
    find.Text = t
    while find.Execute():
        pg = rng.Information(3)
        if pg > 8: # skip TOC
            print(f"{t[:30]}... -> Page {pg}")
            break

doc.Close(False)
app.Quit()
