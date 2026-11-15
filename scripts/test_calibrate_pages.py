# -*- coding: utf-8 -*-
import os
import sys
sys.path.append(os.path.abspath('scripts'))

import docx
import win32com.client as win32
import build_full_report

sys.stdout.reconfigure(encoding='utf-8')

def measure_doc(docx_path):
    app = win32.gencache.EnsureDispatch('Word.Application')
    app.Visible = False
    doc = app.Documents.Open(os.path.abspath(docx_path), ReadOnly=True)
    total_pages = doc.ComputeStatistics(2)
    
    targets = [
        "CHƯƠNG 1. GIỚI THIỆU VÀ ĐẶT VẤN ĐỀ",
        "CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ NỀN TẢNG CÔNG NGHỆ",
        "CHƯƠNG 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG",
        "CHƯƠNG 4. HIỆN THỰC, TRIỂN KHAI VÀ KIỂM THỬ HỆ THỐNG",
        "CHƯƠNG 5. KẾT LUẬN, ĐẠO ĐỨC NGHỀ NGHIỆP VÀ HƯỚNG PHÁT TRIỂN",
        "TÀI LIỆU THAM KHẢO"
    ]
    
    page_map = {}
    for t in targets:
        rng = doc.Content
        find = rng.Find
        find.Text = t
        while find.Execute():
            pg = rng.Information(3)
            if pg > 8:
                page_map[t[:15]] = pg
                break
                
    doc.Close(False)
    app.Quit()
    return total_pages, page_map

if __name__ == '__main__':
    build_full_report.generate_report('dacn.docx')
    tot, pmap = measure_doc('dacn.docx')
    print(f"RESULT: Total={tot}, Map={pmap}")
