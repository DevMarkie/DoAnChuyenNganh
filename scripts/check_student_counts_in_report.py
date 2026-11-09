# -*- coding: utf-8 -*-
import sys
import io
import re
import docx

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc = docx.Document("BaoCaoDoAn_DaParaphrase_ChongDaoVan.docx")

print("=== CHECK 50 / 100 / 3000 SINH VIÊN IN REPORT ===")
for i, p in enumerate(doc.paragraphs):
    txt = p.text.strip()
    if re.search(r'\b(50|100|500|1000|3000|3\.000)\s*(?:sinh viên|sv)\b', txt, re.IGNORECASE):
        print(f"P[{i}]: {txt[:120]}")

for t_idx, t in enumerate(doc.tables):
    for r_idx, r in enumerate(t.rows):
        row_txt = " | ".join(c.text.strip().replace('\n', ' ') for c in r.cells)
        if re.search(r'\b(50|100|500|1000|3000|3\.000)\s*(?:sinh viên|sv)\b', row_txt, re.IGNORECASE):
            print(f"T[{t_idx} R{r_idx}]: {row_txt[:120]}")
