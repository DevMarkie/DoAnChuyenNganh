# -*- coding: utf-8 -*-
import sys
import io
import docx

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc = docx.Document("BaoCaoDoAn_DaParaphrase_ChongDaoVan.docx")

t73 = doc.tables[123] # Table right before Table 74
print(f"Table 73 rows: {len(t73.rows)}")
header = [c.text.strip() for c in t73.rows[0].cells]
print(f"Header: {header}")

for r in t73.rows[:15]:
    print(" | ".join(c.text.strip().replace('\n', ' ') for c in r.cells))
if len(t73.rows) > 15:
    print("...")
    for r in t73.rows[-10:]:
        print(" | ".join(c.text.strip().replace('\n', ' ') for c in r.cells))
