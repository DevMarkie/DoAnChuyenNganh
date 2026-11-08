# -*- coding: utf-8 -*-
import docx

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')

print("=== 1. Paragraphs 985 to 995 (Mục 3.4.10.5) ===")
for i in range(985, 995):
    print(f"P[{i}]: {doc.paragraphs[i].text}")

print("\n=== 2. Paragraphs 1218 to 1226 (Mục 4.14) ===")
for i in range(1218, 1226):
    print(f"P[{i}]: {doc.paragraphs[i].text}")

print("\n=== 3. Paragraphs 483 to 489 (Mục 3.4.4.4) ===")
for i in range(483, 490):
    print(f"P[{i}]: {doc.paragraphs[i].text}")

