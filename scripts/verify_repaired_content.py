# -*- coding: utf-8 -*-
import sys
import io
import docx

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc = docx.Document("test_repaired_full.docx")
print(f"Total tables: {len(doc.tables)}")

# Table 74 (Appendix C)
t74 = doc.tables[124] # Should be table 74
print(f"Table 74 rows: {len(t74.rows)}")
last_rows = [r.cells[1].text.strip() for r in t74.rows[-6:]]
print("Table 74 last 6 classes:", last_rows)

# Check total JUnit count in Table 74 summary or rows
total_tests = 0
for row in t74.rows[1:]:
    try:
        count = int(row.cells[3].text.strip())
        total_tests += count
    except:
        pass
print(f"Total test methods in Table 74: {total_tests}")

# Table 51 (Vitest)
t51 = doc.tables[96]
print(f"Table 51 rows: {len(t51.rows)}")
vitest_total = 0
for row in t51.rows[1:]:
    try:
        count = int(row.cells[2].text.strip())
        vitest_total += count
    except:
        pass
print(f"Total Vitest tests in Table 51: {vitest_total}")

# Search text in paragraphs for metrics
found_metrics = []
for p in doc.paragraphs:
    t = p.text
    if '409' in t or '106' in t or '224' in t or '32 controller' in t.lower() or '42 bảng' in t.lower():
        found_metrics.append(t[:120])

print(f"\nFound {len(found_metrics)} metric mentions:")
for m in found_metrics[:10]:
    print(" -", m)
