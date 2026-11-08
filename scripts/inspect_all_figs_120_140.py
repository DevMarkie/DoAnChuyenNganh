# -*- coding: utf-8 -*-
import docx, re

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')
for i, p in enumerate(doc.paragraphs):
    m = re.search(r'H\u00ecnh (\d+[a-z]?)', p.text)
    if m:
        # Check if previous paragraph has blip
        prev_has_blip = False
        if i > 0:
            prev_has_blip = any('blip' in r._r.xml for r in doc.paragraphs[i-1].runs)
        print(f"P[{i:4d}] | {m.group(0)} | HasPrevImg={prev_has_blip} | Text='{p.text.strip()[:70]}'")

