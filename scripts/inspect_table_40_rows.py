# -*- coding: utf-8 -*-
import docx

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')

body = doc._body._element
p1030 = doc.paragraphs[1030]._element
p1030_idx = body.index(p1030)

tbl_elem = body[p1030_idx - 1]
# find table in doc.tables that has this _element
target_table = None
for t in doc.tables:
    if t._element == tbl_elem:
        target_table = t
        break

if target_table:
    print(f"Found Bảng 40! Rows: {len(target_table.rows)}, Cols: {len(target_table.columns)}")
    for r_idx, r in enumerate(target_table.rows):
        row_vals = [c.text.strip().replace('\n', ' | ') for c in r.cells]
        print(f"Row {r_idx:2d}: {row_vals}")
else:
    print("Could not find table in doc.tables")

