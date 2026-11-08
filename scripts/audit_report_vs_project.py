# -*- coding: utf-8 -*-
import os
import sys
import io
import re
from collections import Counter
import docx

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DOCX_NAME = "BaoCaoDoAn_DaParaphrase_ChongDaoVan.docx"
if not os.path.exists(DOCX_NAME):
    DOCX_NAME = "BaoCaoDoAn_ChinhSua_HoanThien.docx"

print(f"Reading document: {DOCX_NAME}")
doc = docx.Document(DOCX_NAME)

print(f"Total Paragraphs: {len(doc.paragraphs)}")
print(f"Total Tables: {len(doc.tables)}")

print("\n" + "="*60)
print("1. CÁC TIÊU ĐỀ CHÍNH TRONG BÁO CÁO")
print("="*60)
for i, p in enumerate(doc.paragraphs):
    txt = p.text.strip()
    if p.style.name.startswith('Heading') or txt.upper().startswith(('CHƯƠNG', 'MỤC LỤC', 'DANH MỤC', 'LỜI CẢM ƠN', 'TỔNG KẾT')):
        print(f"P[{i}]: [{p.style.name}] {txt[:100]}")

print("\n" + "="*60)
print("2. TÌM TẤT CẢ CÁC ĐỀ CẬP VỀ SỐ LIỆU KỸ THUẬT")
print("="*60)
full_text = "\n".join([p.text for p in doc.paragraphs] + [c.text for t in doc.tables for r in t.rows for c in r.cells])

patterns = [
    (r'(\d+)\s*bảng', 'bảng CSDL'),
    (r'(\d+)\s*(?:ca kiểm thử|test case|test)', 'test cases / kiểm thử'),
    (r'(\d+)\s*sơ đồ', 'sơ đồ'),
    (r'(\d+)\s*tab', 'tab Draw.io'),
    (r'(\d+)\s*vai trò', 'vai trò RBAC'),
    (r'(\d+)\s*sinh viên', 'sinh viên'),
    (r'(\d+)\s*controller', 'controllers'),
    (r'(\d+)\s*service', 'services'),
    (r'(\d+)\s*entity', 'entities / thực thể'),
    (r'Spring Boot\s*([0-9\.]+)', 'phiên bản Spring Boot'),
    (r'Java\s*([0-9\.]+)', 'phiên bản Java'),
    (r'React\s*([0-9\.]+)', 'phiên bản React'),
    (r'MySQL\s*([0-9\.]+)', 'phiên bản MySQL'),
    (r'Redis\s*([0-9\.]+)', 'phiên bản Redis'),
    (r'Vite\s*([0-9\.]+)', 'phiên bản Vite')
]

for pat, desc in patterns:
    matches = re.findall(pat, full_text, re.IGNORECASE)
    cnt = Counter(matches)
    print(f"- {desc}: {dict(cnt.most_common(5))}")
