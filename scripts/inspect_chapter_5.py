# -*- coding: utf-8 -*-
import sys
import io
import re
import docx

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc = docx.Document("BaoCaoDoAn_DaParaphrase_ChongDaoVan.docx")

print("=== CHAPTER 5 AND APPENDIX C & F TEST DETAILS ===")
for i, p in enumerate(doc.paragraphs):
    if any(k in p.text for k in ["5.1.", "5.2.", "5.3.", "5.4.", "5.5.", "5.6.", "5.7.", "5.8.", "Phụ lục C", "Phụ lục F"]):
        print(f"P[{i}]: {p.text.strip()[:100]}")

# Look at paragraphs around P[1241] (CHƯƠNG 5)
print("\n--- Detailed text around P[1241] - P[1270] ---")
for i in range(1241, 1260):
    if i < len(doc.paragraphs):
        print(f"P[{i}]: {doc.paragraphs[i].text.strip()[:120]}")

# Look at Phụ lục C around P[1519]
print("\n--- Detailed text around Phụ lục C P[1519] ---")
for i in range(1519, 1523):
    if i < len(doc.paragraphs):
        print(f"P[{i}]: {doc.paragraphs[i].text.strip()[:120]}")

# Look at Phụ lục F around P[1581]
print("\n--- Detailed text around Phụ lục F P[1581] ---")
for i in range(1581, min(1587, len(doc.paragraphs))):
    print(f"P[{i}]: {doc.paragraphs[i].text.strip()[:120]}")
