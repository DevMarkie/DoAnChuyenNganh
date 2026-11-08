# -*- coding: utf-8 -*-
import docx

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')

for i, p in enumerate(doc.paragraphs):
    if 'Bảng 40.' in p.text or 'Bảng 40 ' in p.text:
        print(f"P[{i}]: {p.text}")
        # Look ahead for tables
        # Find which table follows paragraph i

