# -*- coding: utf-8 -*-
import docx

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')

for i, p in enumerate(doc.paragraphs):
    text = p.text.strip()
    if text.startswith('Hình 11') or text.startswith('Hình 12') or text.startswith('Hình 13') or text.startswith('Hình 14'):
        print(f"P[{i}]: {text}")

