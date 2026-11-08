# -*- coding: utf-8 -*-
import docx, re

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')

print("=== Khoảng trắng trước dấu câu (w\\s+[,.:;?!]) ===")
for i, p in enumerate(doc.paragraphs):
    if 171 <= i <= 1466:
        text = p.text
        matches = list(re.finditer(r'(\w+)(\s+)([,.:;?!])', text))
        if matches:
            for m in matches:
                # exclude cases like numbers e.g. "version 3 . 5" or something
                word = m.group(1)
                spaces = m.group(2)
                punct = m.group(3)
                start = max(0, m.start() - 15)
                end = min(len(text), m.end() + 15)
                print(f"P[{i}]: ...{text[start:end]}... -> replace with '{word}{punct}'")

