# -*- coding: utf-8 -*-
import sys
import io
import os
import re
import glob
import docx

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc = docx.Document("BaoCaoDoAn_DaParaphrase_ChongDaoVan.docx")

# Tables 113 to 122 are Appendix A tables
appendix_tables = doc.tables[113:123]
all_appendix_rows = []
for t in appendix_tables:
    for r in t.rows[1:]:
        method = r.cells[0].text.strip()
        path = r.cells[1].text.strip()
        all_appendix_rows.append((method, path))

print(f"Total API endpoints in Appendix A tables: {len(all_appendix_rows)}")
appendix_paths = set(p for m, p in all_appendix_rows)

# Check controllers
controllers = sorted(glob.glob("backend/src/main/java/com/sms/controller/*.java"))
for c in controllers:
    with open(c, "r", encoding="utf-8", errors="ignore") as f:
        txt = f.read()
    m_req = re.search(r'@RequestMapping\s*\(\s*["\']([^"\']+)["\']', txt)
    base = m_req.group(1) if m_req else ""
    
    # Check if base path appears in appendix
    found = any(base in p for p in appendix_paths) if base else True
    print(f"{os.path.basename(c):30} base='{base}': found_in_report={found}")
