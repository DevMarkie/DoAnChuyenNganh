# -*- coding: utf-8 -*-
"""
scripts/deep_audit_report_vs_codebase.py
Kiểm tra chi tiết từng nội dung kỹ thuật trong Báo cáo Đồ án so với Mã nguồn thực tế:
1. Số lượng bảng, thực thể, enum, trigger, view
2. Danh sách Controller, Service, Repository, DTO
3. Số lượng ca kiểm thử chi tiết từng tầng (JUnit, Vitest, E2E, NFR, DevTools)
4. Danh sách các sơ đồ UML Draw.io và các hình ảnh trong Báo cáo
5. Danh sách các bảng biểu và đánh số thứ tự
6. Các thuật ngữ kỹ thuật, phiên bản thư viện/ngôn ngữ
7. Các phân hệ nghiệp vụ và tính năng mới cập nhật (Khảo thí, SBD, Tốt nghiệp TT08, Đính chính điểm 3 cấp, v.v.)
"""

import os
import sys
import io
import re
import glob
from collections import Counter
import docx

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DOCX_PATH = "BaoCaoDoAn_DaParaphrase_ChongDaoVan.docx"
print(f"=== DEEP AUDIT: {DOCX_PATH} vs DỰ ÁN ===")
doc = docx.Document(DOCX_PATH)

report_paragraphs = [p.text for p in doc.paragraphs]
report_full_text = "\n".join(report_paragraphs)

# -------------------------------------------------------------
# 1. DATABASE AUDIT
# -------------------------------------------------------------
print("\n" + "="*70)
print("1. CƠ SỞ DỮ LIỆU & THỰC THỂ (DATABASE & ENTITIES)")
print("="*70)

# Check schema.sql
with open("database/schema.sql", "r", encoding="utf-8") as f:
    schema_sql = f.read()

db_tables = re.findall(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([a-zA-Z0-9_]+)`?', schema_sql, re.IGNORECASE)
print(f"- Số bảng trong database/schema.sql: {len(db_tables)}")

# Check JPA Entities
entities = glob.glob("backend/src/main/java/com/sms/entity/*.java")
entity_names = [os.path.basename(e).replace(".java", "") for e in entities]
print(f"- Số thực thể JPA (backend/src/main/java/com/sms/entity/): {len(entities)}")

# Check Enums
enums = glob.glob("backend/src/main/java/com/sms/enums/*.java")
if not enums:
    # Check if enums are inside entity or common
    enums = glob.glob("backend/src/main/java/com/sms/**/enums/*.java", recursive=True) + glob.glob("backend/src/main/java/com/sms/**/*Enum*.java", recursive=True)
print(f"- Số Enums tìm thấy: {len(enums)}")

# Check mentions of table counts in report
table_counts_mentioned = re.findall(r'(\d+)\s*bảng\s*(?:quan hệ|cơ sở dữ liệu|csdl|trong csdl)?', report_full_text, re.IGNORECASE)
print(f"- Các con số 'bảng CSDL' xuất hiện trong báo cáo: {Counter(table_counts_mentioned).most_common(5)}")

# -------------------------------------------------------------
# 2. BACKEND ARCHITECTURE AUDIT
# -------------------------------------------------------------
print("\n" + "="*70)
print("2. KIẾN TRÚC BACKEND (CONTROLLERS, SERVICES, REPOSITORIES)")
print("="*70)
controllers = [os.path.basename(c).replace(".java", "") for c in glob.glob("backend/src/main/java/com/sms/controller/*.java")]
services = [os.path.basename(s).replace(".java", "") for s in glob.glob("backend/src/main/java/com/sms/service/*.java")]
repos = [os.path.basename(r).replace(".java", "") for r in glob.glob("backend/src/main/java/com/sms/repository/*.java")]

print(f"- Số Controller thực tế: {len(controllers)}")
print(f"- Số Service thực tế: {len(services)}")
print(f"- Số Repository thực tế: {len(repos)}")

ctrl_mentioned = re.findall(r'(\d+)\s*(?:REST\s*)?controllers?', report_full_text, re.IGNORECASE)
print(f"- Số Controllers đề cập trong báo cáo: {Counter(ctrl_mentioned).most_common(5)}")

# Check if each controller is mentioned in Phụ lục A (API Endpoints)
print("\nKiểm tra Controller có trong Báo cáo:")
for c in sorted(controllers):
    # Controller base name without 'Controller'
    base_name = c.replace("Controller", "")
    mentioned = base_name.lower() in report_full_text.lower()
    if not mentioned:
        print(f"  [CHƯA THẤY] {c} chưa được đề cập rõ trong báo cáo!")

# -------------------------------------------------------------
# 3. DRAW.IO DIAGRAM AUDIT
# -------------------------------------------------------------
print("\n" + "="*70)
print("3. SƠ ĐỒ THIẾT KẾ DRAW.IO")
print("="*70)
import xml.etree.ElementTree as ET

drawio_files = sorted(glob.glob("drawio/*.drawio"))
for df in drawio_files:
    try:
        tree = ET.parse(df)
        diagrams = tree.getroot().findall('diagram')
        print(f"- {os.path.basename(df)}: {len(diagrams)} tabs")
        for d in diagrams[:3]:
            print(f"    * {d.get('name')}")
        if len(diagrams) > 3:
            print(f"    ... (+{len(diagrams)-3} tabs)")
    except Exception as e:
        print(f"- {os.path.basename(df)}: Lỗi đọc {e}")

# -------------------------------------------------------------
# 4. TEST SUITE AUDIT
# -------------------------------------------------------------
print("\n" + "="*70)
print("4. BỘ KIỂM THỬ (QA SUITE AUDIT)")
print("="*70)

# JUnit tests
junit_files = glob.glob("backend/src/test/java/**/*.java", recursive=True)
junit_counts = {}
total_junit = 0
for jf in junit_files:
    with open(jf, "r", encoding="utf-8", errors="ignore") as f:
        txt = f.read()
    c = len(re.findall(r'@Test\b', txt))
    junit_counts[os.path.basename(jf)] = c
    total_junit += c

print(f"- Tổng số JUnit test files: {len(junit_files)}")
print(f"- Tổng số ca kiểm thử @Test JUnit 5: {total_junit}")

# Vitest tests
vitest_files = glob.glob("frontend/src/**/*.test.jsx") + glob.glob("frontend/src/**/*.test.js")
total_vitest = 0
vitest_counts = {}
for vf in vitest_files:
    with open(vf, "r", encoding="utf-8", errors="ignore") as f:
        txt = f.read()
    c = len(re.findall(r'\b(?:it|test)\s*\(', txt))
    vitest_counts[os.path.basename(vf)] = c
    total_vitest += c

print(f"- Tổng số Vitest files: {len(vitest_files)}")
print(f"- Tổng số ca kiểm thử Vitest: {total_vitest}")

# E2E & Integration tests in tests/
e2e_files = glob.glob("tests/e2e/*.js") + glob.glob("tests/e2e/*.cjs")
print(f"- Tổng số file E2E trong tests/e2e: {len(e2e_files)}")

# Check test numbers mentioned in report
test_mentions = re.findall(r'(\d+)\s*(?:ca kiểm thử|bài kiểm thử|test case|tests)', report_full_text, re.IGNORECASE)
print(f"- Các con số kiểm thử trong báo cáo: {Counter(test_mentions).most_common(10)}")

# -------------------------------------------------------------
# 5. FIGURES & TABLES IN REPORT
# -------------------------------------------------------------
print("\n" + "="*70)
print("5. DANH MỤC HÌNH VÀ BẢNG TRONG BÁO CÁO")
print("="*70)

fig_caps = []
tbl_caps = []
for i, p in enumerate(doc.paragraphs):
    t = p.text.strip()
    if re.match(r'^Hình\s+\d+', t, re.IGNORECASE):
        fig_caps.append((i, t))
    elif re.match(r'^Bảng\s+[\d\.]+', t, re.IGNORECASE):
        tbl_caps.append((i, t))

print(f"- Tổng số Hình được gắn Caption: {len(fig_caps)}")
if fig_caps:
    print(f"  * Hình đầu tiên: {fig_caps[0][1][:60]}")
    print(f"  * Hình cuối cùng: {fig_caps[-1][1][:60]}")

print(f"- Tổng số Bảng được gắn Caption: {len(tbl_caps)}")
if tbl_caps:
    print(f"  * Bảng đầu tiên: {tbl_caps[0][1][:60]}")
    print(f"  * Bảng cuối cùng: {tbl_caps[-1][1][:60]}")
print(f"- Tổng số Word Tables thực tế: {len(doc.tables)}")

# -------------------------------------------------------------
# 6. CHECK FOR PLACEHOLDERS AND OUTDATED INFO
# -------------------------------------------------------------
print("\n" + "="*70)
print("6. TÌM DẤU HIỆU CHƯA CẬP NHẬT / DỮ LIỆU CŨ")
print("="*70)
need_check_patterns = [
    (r'\b50\s*sinh viên\b', 'Đề cập 50 sinh viên (dữ liệu mẫu cũ?)'),
    (r'\b100\s*sinh viên\b', 'Đề cập 100 sinh viên'),
    (r'\b3\.?000\s*sinh viên\b', 'Đề cập 3000 sinh viên (chuẩn mới)'),
    (r'\b38\s*bảng\b', 'Đề cập 38 bảng'),
    (r'\b39\s*bảng\b', 'Đề cập 39 bảng'),
    (r'\b40\s*bảng\b', 'Đề cập 40 bảng'),
    (r'\b41\s*bảng\b', 'Đề cập 41 bảng'),
    (r'\b288\s*tests?\b', 'Đề cập 288 tests cũ'),
    (r'\b297\s*tests?\b', 'Đề cập 297 tests'),
    (r'\b412\s*tests?\b', 'Đề cập 412 tests mới'),
    (r'\b528\s*ca\b', 'Đề cập 528 ca kiểm thử'),
]

for pat, desc in need_check_patterns:
    matches = re.findall(pat, report_full_text, re.IGNORECASE)
    print(f"- {desc}: {len(matches)} lần")
