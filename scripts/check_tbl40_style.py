# -*- coding: utf-8 -*-
import docx

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')
body = doc._body._element
p1030 = doc.paragraphs[1030]._element
p1030_idx = body.index(p1030)
tbl_elem = body[p1030_idx - 1]

target_table = None
for t in doc.tables:
    if t._element == tbl_elem:
        target_table = t
        break

if target_table:
    sample_row = target_table.rows[1]
    for c_idx, cell in enumerate(sample_row.cells):
        p = cell.paragraphs[0]
        font_name = p.runs[0].font.name if p.runs and p.runs[0].font else "None"
        font_size = p.runs[0].font.size if p.runs and p.runs[0].font else "None"
        print(f"Col {c_idx}: text='{cell.text[:30]}', font={font_name}, size={font_size}")

