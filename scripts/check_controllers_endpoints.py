# -*- coding: utf-8 -*-
import sys
import io
import os
import re
import glob

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

controllers = sorted(glob.glob("backend/src/main/java/com/sms/controller/*.java"))
print(f"Total Controllers ({len(controllers)}):")

for c in controllers:
    with open(c, "r", encoding="utf-8", errors="ignore") as f:
        txt = f.read()
    m_req = re.search(r'@RequestMapping\s*\(\s*["\']([^"\']+)["\']', txt)
    req_path = m_req.group(1) if m_req else "No @RequestMapping"
    
    # Count methods
    methods = re.findall(r'@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping)\b', txt)
    print(f"  {os.path.basename(c):32} -> {req_path:25} ({len(methods)} endpoints)")
