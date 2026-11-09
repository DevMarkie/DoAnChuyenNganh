# -*- coding: utf-8 -*-
import sys
import io
import os
import re
import docx

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DOCX_NAME = "BaoCaoDoAn_DaParaphrase_ChongDaoVan.docx"
doc = docx.Document(DOCX_NAME)
print(f"=== AUDIT OF {DOCX_NAME} ===")

para_texts = [p.text for p in doc.paragraphs]
tbl_texts = [" | ".join(c.text.strip().replace('\n', ' ') for c in r.cells) for t in doc.tables for r in t.rows]
all_lines = para_texts + tbl_texts
full_text = "\n".join(all_lines)

# 1. Placeholders
print("\n--- 1. Placeholders (TODO, FIXME, XXX, ???, etc.) ---")
placeholders = [r'\bTODO\b', r'\bFIXME\b', r'\bXXX\b', r'\bTBD\b', r'\[\?\]', r'\?\?\?', r'chưa có', r'cần bổ sung', r'cần cập nhật']
for p in placeholders:
    m = re.findall(rf'.{{0,30}}{p}.{{0,30}}', full_text, re.IGNORECASE)
    if m:
        print(f"  [FOUND] {p} ({len(m)} times):")
        for ex in m[:3]:
            print(f"    ... {ex.strip()} ...")
    else:
        print(f"  [OK] No '{p}' found.")

# 2. Key Metrics Consistency
print("\n--- 2. Key Metrics Consistency Across Report ---")
queries = [
    (r'\b(\d+)\s*bảng\b', 'bảng CSDL'),
    (r'\b(\d+)\s*thực thể\b', 'thực thể JPA'),
    (r'\b(\d+)\s*(?:ca kiểm thử|test|tests)\b', 'kiểm thử'),
    (r'\b(\d+)\s*sơ đồ\b', 'sơ đồ'),
    (r'\b(\d+)\s*tab\b', 'tab Draw.io'),
    (r'\b(\d+)\s*vai trò\b', 'vai trò RBAC'),
    (r'\b(\d+)\s*phân hệ\b', 'phân hệ'),
    (r'\b(\d+)\s*controllers?\b', 'controllers'),
    (r'\b(\d+)\s*services?\b', 'services'),
]

for pat, desc in queries:
    m = re.findall(pat, full_text, re.IGNORECASE)
    counts = docx.shared.Counter(m) if hasattr(docx.shared, 'Counter') else {}
    from collections import Counter
    c = Counter(m)
    print(f"- {desc}: {dict(c.most_common(5))}")

# 3. Check for specific sections
print("\n--- 3. Check specific recent features in Report ---")
features = [
    ("Xét tốt nghiệp TT08", r'tốt nghiệp|degree\s*audit|thông tư 08'),
    ("Sổ điểm & Khóa sổ 7 ngày", r'khóa sổ|7 ngày|chốt điểm'),
    ("Đính chính điểm 3 cấp", r'đính chính điểm|3 cấp|grade\s*amendment'),
    ("Phúc khảo điểm thi trực tuyến", r'phúc khảo|grade\s*appeal'),
    ("Đánh số báo danh & Xếp phòng thi", r'số báo danh|phòng thi|exam\s*room'),
    ("Điểm danh thông minh PIN 6 số", r'điểm danh|pin\s*6|check-in'),
    ("Học phí & VNPAY & Miễn giảm", r'học phí|vnpay|miễn giảm'),
    ("Khóa phân tán Redis & Atomic Lua", r'redis\s*lock|lua\s*script|atomic'),
    ("Đồ thị tiên quyết DAG", r'tiên quyết|dag|prerequisite'),
    ("Cảnh báo học vụ 3 mức", r'cảnh báo học vụ|buộc thôi học'),
    ("Phân quyền Giáo vụ Khoa (Faculty-Scoped RBAC)", r'giáo vụ khoa|academic_staff|faculty'),
    ("Giao diện Apple Vision Pro & Aurora", r'aurora|glassmorphism|apple vision|dark mode'),
    ("Bộ kiểm thử 528 / 600+ tests", r'528|kiểm thử đa tầng|qa audit'),
]

for name, pattern in features:
    cnt = len(re.findall(pattern, full_text, re.IGNORECASE))
    print(f"  * {name:45}: {cnt:4} mentions {'[OK]' if cnt > 0 else '[MISSING]'}")

