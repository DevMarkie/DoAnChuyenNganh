# -*- coding: utf-8 -*-
import sys
import io
import re
import docx

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc = docx.Document("BaoCaoDoAn_DaParaphrase_ChongDaoVan.docx")

patterns = [
    (r'\b39\s*bảng\b', '39 bảng'),
    (r'\b41\s*(?:thực thể|bảng)\b', '41 bảng/thực thể'),
    (r'\b43\s*lớp\b', '43 lớp test'),
    (r'\b297\b', '297 tests'),
    (r'\b105\b', '105 vitest'),
    (r'\b528\b', '528 tests'),
    (r'\b33\s*(?:REST\s*)?controller', '33 controllers')
]

for pat, label in patterns:
    print(f"\n=== MENTIONS OF '{label}' ===")
    for i, p in enumerate(doc.paragraphs):
        if re.search(pat, p.text, re.IGNORECASE):
            print(f"P[{i}]: {p.text.strip()[:140]}")
    for t_idx, t in enumerate(doc.tables):
        for r_idx, r in enumerate(t.rows):
            txt = " | ".join(c.text.strip().replace('\n', ' ') for c in r.cells)
            if re.search(pat, txt, re.IGNORECASE):
                print(f"T[{t_idx} R{r_idx}]: {txt[:140]}")
