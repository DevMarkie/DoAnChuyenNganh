# -*- coding: utf-8 -*-
import sys
import io
import docx

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc = docx.Document("BaoCaoDoAn_DaParaphrase_ChongDaoVan.docx")

# Let's find Bảng 50
for idx, t in enumerate(doc.tables):
    header = " | ".join(c.text.strip() for c in t.rows[0].cells)
    if "Lớp kiểm thử" in header and len(t.rows) < 25:
        print(f"Table index {idx} (rows={len(t.rows)}): Header={header}")
        for r in t.rows[:6]:
            print("  " + " | ".join(c.text.strip().replace('\n', ' ') for c in r.cells))
