# -*- coding: utf-8 -*-
with open('frontend/src/components/layout/Sidebar.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

import re
items = re.findall(r'path:\s*[\'"]([^\'"]+)[\'"],\s*label:\s*[\'"]([^\'"]+)[\'"]', text)
print(f"Total menu items in Sidebar: {len(items)}")
for path, label in items:
    print(f"  {path:30} -> {label}")

