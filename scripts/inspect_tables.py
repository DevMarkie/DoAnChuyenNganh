# -*- coding: utf-8 -*-
import docx

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')

print(f"Total tables: {len(doc.tables)}")
for i, t in enumerate(doc.tables):
    # find table near paragraph 1030
    first_cell = t.cell(0, 0).text.strip() if len(t.rows) > 0 and len(t.columns) > 0 else ""
    if any(k in first_cell.lower() for k in ['stt', 'thành phần', 'tên màn hình', 'phân hệ', 'chức năng', 'mã màn hình', 'route']):
        # check previous paragraph caption
        caption = "Unknown"
        # find matching paragraph
        # let's print row count and first few cells
        header = [t.cell(0, c).text.strip().replace('\n', ' ') for c in range(min(5, len(t.columns)))]
        if len(t.rows) > 10:
            print(f"Table {i} (rows={len(t.rows)}, cols={len(t.columns)}): Header={header}")
            # print sample rows
            for r in range(1, min(6, len(t.rows))):
                row_data = [t.cell(r, c).text.strip().replace('\n', ' ') for c in range(min(5, len(t.columns)))]
                print(f"   Row {r}: {row_data}")

