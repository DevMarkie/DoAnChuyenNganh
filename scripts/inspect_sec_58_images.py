# -*- coding: utf-8 -*-
import docx

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')

print("=== Section 5.2.4 (d) Chrome DevTools paragraphs ===")
found = False
for i, p in enumerate(doc.paragraphs):
    if "Minh chứng thực nghiệm kiểm thử tự động giao diện trực quan 5 phân hệ qua Google Chrome DevTools Protocol" in p.text:
        found = True
        print(f"Start at P[{i}]: {p.text}")
        for j in range(i, min(i + 45, len(doc.paragraphs))):
            text = doc.paragraphs[j].text.strip()
            runs_with_img = sum(1 for r in doc.paragraphs[j].runs if 'drawing' in r._r.xml)
            if text.startswith('Hình ') or runs_with_img > 0:
                print(f"  P[{j}]: text='{text[:70]}', img_runs={runs_with_img}")
        break

if not found:
    print("Could not find section header in document!")

