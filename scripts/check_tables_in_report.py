# -*- coding: utf-8 -*-
import sys
import io
import re
import docx

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc = docx.Document("BaoCaoDoAn_DaParaphrase_ChongDaoVan.docx")

print("=== CHECK TABLE COUNTS IN REPORT ===")
for i, p in enumerate(doc.paragraphs):
    if re.search(r'\b(39|40|41)\s*(?:bảng|thực thể|table)', p.text, re.IGNORECASE):
        print(f"P[{i}]: {p.text.strip()}")

for t_idx, t in enumerate(doc.tables):
    for r_idx, r in enumerate(t.rows):
        txt = " | ".join(c.text.strip().replace('\n', ' ') for c in r.cells)
        if re.search(r'\b(39|40|41)\s*(?:bảng|thực thể|table)', txt, re.IGNORECASE):
            print(f"T[{t_idx} R{r_idx}]: {txt[:120]}")
