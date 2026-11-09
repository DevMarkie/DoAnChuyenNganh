# -*- coding: utf-8 -*-
import sys
import io
import re
import docx

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc = docx.Document("BaoCaoDoAn_DaParaphrase_ChongDaoVan.docx")

tbl_captions = []
for i, p in enumerate(doc.paragraphs):
    m = re.match(r'^Bảng\s+([\d\.]+)[a-z]?[\.\:]?\s*(.*)', p.text.strip(), re.IGNORECASE)
    if m:
        tbl_captions.append((i, m.group(1), m.group(2).strip(), p.text.strip()))

print(f"Total Table Captions found: {len(tbl_captions)}")
for i, num, title, raw in tbl_captions[:15]:
    print(f"  P[{i}]: {raw[:60]}")
if len(tbl_captions) > 15:
    print("  ...")
    for i, num, title, raw in tbl_captions[-15:]:
        print(f"  P[{i}]: {raw[:60]}")

# Check sequence of main tables (e.g. 1, 2, 3...)
main_tables = []
for i, num, title, raw in tbl_captions:
    if '.' not in num:
        main_tables.append((int(num), i, raw))

main_nums = [n for n, i, r in main_tables]
print(f"\nMain integer tables: {len(main_tables)} tables (from Bảng {min(main_nums)} to Bảng {max(main_nums)})")
seen = {}
dups = []
for num, i, r in main_tables:
    if num in seen:
        dups.append((num, seen[num], (i, r)))
    else:
        seen[num] = (i, r)

if dups:
    print(f"[CẢNH BÁO] Trùng lặp số bảng chính: {dups}")
else:
    print("[OK] Không có bảng chính nào bị trùng số!")

missing = [n for n in range(min(main_nums), max(main_nums) + 1) if n not in seen]
if missing:
    print(f"[CẢNH BÁO] Thiếu các bảng: {missing}")
else:
    print(f"[OK] Dãy số bảng chính liên tục tuyệt đối từ {min(main_nums)} đến {max(main_nums)}!")
