# -*- coding: utf-8 -*-
import docx

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')
found = []
for idx, p in enumerate(doc.paragraphs):
    if 'rèn luyện' in p.text.lower():
        found.append((f"P[{idx}]", p.text.strip()))

for t_idx, table in enumerate(doc.tables):
    for r_idx, row in enumerate(table.rows):
        for c_idx, cell in enumerate(row.cells):
            if 'rèn luyện' in cell.text.lower():
                found.append((f"Table[{t_idx}] R{r_idx}C{c_idx}", cell.text.strip()))

if found:
    print(f"FOUND {len(found)} occurrences of 'rèn luyện':")
    for loc, txt in found:
        print(f"  {loc}: {txt[:80]}")
else:
    print("SUCCESS: Zero occurrences of 'rèn luyện' in entire Word report!")

