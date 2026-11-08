# -*- coding: utf-8 -*-
import docx, re

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')
total_p = len(doc.paragraphs)

print(f"Searching across {total_p} paragraphs and {len(doc.tables)} tables...")

conduct_paras = []
for i, p in enumerate(doc.paragraphs):
    text = p.text
    if any(k in text.lower() for k in ['rèn luyện', 'student-conduct', 'studentconduct', 'conductscore', 'khen thưởng và kỷ luật', 'khen thưởng kỷ luật']):
        conduct_paras.append((i, text))

print(f"\nFound {len(conduct_paras)} paragraphs mentioning 'rèn luyện' / 'conduct':")
for idx, text in conduct_paras:
    print(f"  P[{idx}]: {text[:100]}...")

# Also check tables
conduct_tables = []
for t_idx, t in enumerate(doc.tables):
    for r_idx, r in enumerate(t.rows):
        row_str = " | ".join(c.text.strip().replace('\n', ' ') for c in r.cells)
        if any(k in row_str.lower() for k in ['rèn luyện', 'student-conduct', 'conductscore', 'khen thưởng kỷ luật', 'conduct_scores']):
            conduct_tables.append((t_idx, r_idx, row_str[:120]))

print(f"\nFound {len(conduct_tables)} table rows mentioning 'rèn luyện' / 'conduct':")
for t_idx, r_idx, row_sample in conduct_tables:
    print(f"  Table {t_idx}, Row {r_idx}: {row_sample}...")

