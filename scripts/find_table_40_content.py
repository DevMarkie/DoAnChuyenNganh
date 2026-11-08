# -*- coding: utf-8 -*-
import docx

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')

# find the table in document that corresponds to Bảng 40
# We can search through tables for headers matching UI Component Inventory Matrix
for idx, t in enumerate(doc.tables):
    for r in range(min(2, len(t.rows))):
        row_text = " ".join(c.text for c in t.rows[r].cells).lower()
        if 'mã màn hình' in row_text or 'component' in row_text or 'inventory' in row_text or 'đường dẫn route' in row_text or 'vai trò truy cập' in row_text or 'thành phần giao diện' in row_text:
            print(f"Table {idx} matched! Rows: {len(t.rows)}, Cols: {len(t.columns)}")
            print("Headers:", [c.text.strip().replace('\n', ' ') for c in t.rows[0].cells])
            print("First 5 rows:")
            for r_idx in range(1, min(10, len(t.rows))):
                print(f"  Row {r_idx}: {[c.text.strip().replace('\n', ' ') for c in t.rows[r_idx].cells]}")
            break

