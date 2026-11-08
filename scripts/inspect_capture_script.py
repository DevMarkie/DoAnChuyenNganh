# -*- coding: utf-8 -*-
with open('.tools/capture_all_45_perfect_final.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = list(re.finditer(r'\{\s*num:\s*(\d+),\s*role:\s*[\'"]([^\'"]+)[\'"],\s*route:\s*[\'"]([^\'"]+)[\'"],\s*title:\s*[\'"]([^\'"]+)[\'"]', text))
print(f"Total screens configured: {len(matches)}")
for s in matches:
    print(f"  Hình {s.group(1):3}: role={s.group(2):10} route={s.group(3):30} title={s.group(4)}")

