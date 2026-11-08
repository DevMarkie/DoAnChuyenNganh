# -*- coding: utf-8 -*-
import docx, re

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')

print("=== Tìm tất cả các câu nhắc đến Hình 118 đến Hình 149 trong văn xuôi ===")
for i, p in enumerate(doc.paragraphs):
    text = p.text.strip()
    if not text.startswith('Hình ') and not text.startswith('HÌNH '):
        matches = re.findall(r'Hình\s+(1[1-4]\d[a-z]?)', text)
        if matches:
            for m in matches:
                num = m
                print(f"P[{i}]: (mentions Hình {num}) -> \"{text[:90]}...\"")

