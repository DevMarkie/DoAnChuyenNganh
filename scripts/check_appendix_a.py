# -*- coding: utf-8 -*-
import sys
import io
import re
import docx

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc = docx.Document("BaoCaoDoAn_DaParaphrase_ChongDaoVan.docx")

print("=== CHECK PHỤ LỤC A (API ENDPOINTS) ===")
in_appendix_a = False
appendix_a_text = []

for i, p in enumerate(doc.paragraphs):
    if "Phụ lục A" in p.text:
        in_appendix_a = True
    elif "Phụ lục B" in p.text:
        in_appendix_a = False
    
    if in_appendix_a:
        appendix_a_text.append(f"P[{i}]: {p.text.strip()}")

print(f"Appendix A paragraphs: {len(appendix_a_text)}")
for t in appendix_a_text[:15]:
    print(t[:100])
if len(appendix_a_text) > 15:
    print("...")
    for t in appendix_a_text[-10:]:
        print(t[:100])

# Also check tables in Appendix A
# Let's find which tables are in Appendix A
for t_idx, t in enumerate(doc.tables):
    for r in t.rows[:2]:
        txt = " | ".join(c.text.strip() for c in r.cells)
        if "Endpoint" in txt or "Phương thức" in txt or "HTTP" in txt or "Phụ lục A" in txt:
            print(f"\nTable {t_idx} (rows={len(t.rows)}): {txt[:100]}")
