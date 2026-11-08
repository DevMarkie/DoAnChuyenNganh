# -*- coding: utf-8 -*-
import docx

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')

print("=== Nội dung Mục 3.4.10 Thiết kế giao diện người dùng ===")
for i in range(875, min(1055, len(doc.paragraphs))):
    text = doc.paragraphs[i].text.strip()
    if text.startswith(('a)', 'b)', 'c)', 'd)', 'e)', 'f)', 'g)', 'h)', 'i)', 'k)', 'l)', 'm)', 'Hình ', 'Bảng ')):
        print(f"P[{i}]: {text}")
    elif any(text.startswith(h) for h in ['3.4.10', '1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.']):
        if len(text) < 120:
            print(f"P[{i}]: {text}")

