# -*- coding: utf-8 -*-
import sys
import io
import docx

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc = docx.Document("BaoCaoDoAn_DaParaphrase_ChongDaoVan.docx")

for idx, t in enumerate(doc.tables):
    header = " | ".join(c.text.strip() for c in t.rows[0].cells)
    if "Thực thể" in header or "Entity" in header or "Lớp thực thể" in header:
        print(f"Table index {idx}: rows={len(t.rows)}, header: {header}")
        for r in t.rows[:5]:
            print("  " + " | ".join(c.text.strip().replace('\n', ' ') for c in r.cells))
        print("  ...")
        for r in t.rows[-5:]:
            print("  " + " | ".join(c.text.strip().replace('\n', ' ') for c in r.cells))
