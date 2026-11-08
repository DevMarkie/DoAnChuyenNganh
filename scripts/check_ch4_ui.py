# -*- coding: utf-8 -*-
import docx

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')

print("=== Check UI mentions in Chapter 4 (P[1112] - P[1240]) ===")
ui_count_ch4 = 0
for i in range(1112, 1241):
    text = doc.paragraphs[i].text.strip()
    if any(k in text.lower() for k in ['giao diện', 'màn hình', 'ui', 'ux', 'frontend', 'modal', 'component']):
        print(f"P[{i}]: {text[:80]}...")
        ui_count_ch4 += 1

print(f"Total paragraphs mentioning UI in Chapter 4: {ui_count_ch4}")

