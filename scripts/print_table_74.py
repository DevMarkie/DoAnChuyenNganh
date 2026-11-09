# -*- coding: utf-8 -*-
import sys
import io
import docx

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc = docx.Document("BaoCaoDoAn_DaParaphrase_ChongDaoVan.docx")

# Let's inspect Table 74 (index 124)
t74 = doc.tables[124]
print(f"Table 74 rows: {len(t74.rows)}")
for i, r in enumerate(t74.rows):
    print(f"[{i:2d}] {r.cells[0].text.strip():35} | {r.cells[1].text.strip():10} | {r.cells[2].text.strip()[:40]}")
