# -*- coding: utf-8 -*-
import os, re

app_file = 'frontend/src/App.jsx'
with open(app_file, 'r', encoding='utf-8') as f:
    text = f.read()

# Match Route definitions
# e.g. <Route path="..." element={<Component />} />
pattern = r'<Route\s+path=[\'"]([^\'"]+)[\'"]\s+element=\{<([^/>]+)'
matches = re.findall(pattern, text)

print(f"Total routes matched in App.jsx: {len(matches)}")
routes_by_role = {}
for path, element in matches:
    print(f"  {path:35} -> {element.strip()}")

