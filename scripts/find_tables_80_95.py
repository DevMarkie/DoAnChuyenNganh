# -*- coding: utf-8 -*-
import docx

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')

for i in range(80, 95):
    t = doc.tables[i]
    first_row = [c.text.strip().replace('\n', ' ') for c in t.rows[0].cells]
    print(f"Table {i} (rows={len(t.rows)}, cols={len(t.columns)}): Header={first_row[:4]}")

