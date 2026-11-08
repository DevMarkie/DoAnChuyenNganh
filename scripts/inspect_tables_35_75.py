# -*- coding: utf-8 -*-
import sys
import io
import docx

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc = docx.Document("BaoCaoDoAn_DaParaphrase_ChongDaoVan.docx")

# Find Table 35 and Table 75
for i, p in enumerate(doc.paragraphs):
    if "Bảng 35." in p.text or "Bảng 75." in p.text or "Từ điển dữ liệu" in p.text:
        print(f"P[{i}]: {p.text.strip()}")

# Let's inspect tables around P[571] and P[1526]
# Let's find which table index corresponds to Table 35
def find_table_by_header(keyword):
    for idx, t in enumerate(doc.tables):
        header = " | ".join(c.text.strip() for c in t.rows[0].cells)
        if keyword in header:
            print(f"Table index {idx}: rows={len(t.rows)}, header: {header[:80]}")
            return idx, t
    return None, None

print("\n--- Searching Table 35 ---")
find_table_by_header("Tên bảng")
find_table_by_header("Tên thực thể")

