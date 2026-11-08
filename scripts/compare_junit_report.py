# -*- coding: utf-8 -*-
import sys
import io
import os
import glob
import docx

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc = docx.Document("BaoCaoDoAn_DaParaphrase_ChongDaoVan.docx")

# Table 74 is around table index 124
t74 = doc.tables[124]
print(f"Table 74 rows: {len(t74.rows)}")
header = [c.text.strip() for c in t74.rows[0].cells]
print(f"Header: {header}")

report_test_classes = []
for r in t74.rows[1:]:
    name = r.cells[1].text.strip()
    tests = r.cells[2].text.strip()
    report_test_classes.append((name, tests))

print(f"Test classes in Report Table 74: {len(report_test_classes)}")
for name, tests in report_test_classes[:10]:
    print(f"  {name}: {tests}")

actual_classes = [os.path.basename(f) for f in glob.glob("backend/src/test/java/**/*.java", recursive=True)]
print(f"\nActual test files in codebase: {len(actual_classes)}")

diff_actual_not_in_report = set(actual_classes) - set([n for n, t in report_test_classes])
print(f"\nClasses in Codebase but NOT in Report ({len(diff_actual_not_in_report)}):")
for c in sorted(diff_actual_not_in_report):
    print(f"  + {c}")
