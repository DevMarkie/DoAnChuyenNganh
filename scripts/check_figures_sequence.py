# -*- coding: utf-8 -*-
import sys
import io
import re
import docx

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc = docx.Document("BaoCaoDoAn_DaParaphrase_ChongDaoVan.docx")

fig_captions = []
for i, p in enumerate(doc.paragraphs):
    m = re.match(r'^Hình\s+(\d+)[\.\:]?\s*(.*)', p.text.strip(), re.IGNORECASE)
    if m:
        fig_captions.append((i, int(m.group(1)), m.group(2).strip(), p.text.strip()))

print(f"Total Figure Captions found: {len(fig_captions)}")
if fig_captions:
    nums = [num for i, num, title, raw in fig_captions]
    print(f"Min figure number: {min(nums)}")
    print(f"Max figure number: {max(nums)}")
    
    # Check duplicates
    seen = {}
    duplicates = []
    for i, num, title, raw in fig_captions:
        if num in seen:
            duplicates.append((num, seen[num], (i, raw)))
        else:
            seen[num] = (i, raw)
            
    if duplicates:
        print(f"\n[LỖI] Có {len(duplicates)} số hình bị TRÙNG LẶP:")
        for num, prev, curr in duplicates:
            print(f"  - Hình {num}:")
            print(f"      Lần 1 tại P[{prev[0]}]: {prev[1][:60]}")
            print(f"      Lần 2 tại P[{curr[0]}]: {curr[1][:60]}")
    else:
        print("\n[OK] Không có số hình nào bị trùng lặp!")

    # Check missing
    missing = [n for n in range(min(nums), max(nums) + 1) if n not in seen]
    if missing:
        print(f"\n[LỖI] Có {len(missing)} số hình bị THIẾU / KHÔNG LIÊN TỤC: {missing}")
    else:
        print(f"\n[OK] Dãy số hình hoàn toàn liên tục từ {min(nums)} đến {max(nums)}!")
