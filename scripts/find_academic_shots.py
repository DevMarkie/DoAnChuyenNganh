# -*- coding: utf-8 -*-
with open('tests/chrome_devtools_master_audit.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'academic' in l.lower() and 'screenshot' in l.lower():
        print(f"Line {i+1}: {l.strip()}")

