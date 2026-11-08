# -*- coding: utf-8 -*-
import docx, re

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')
total_p = len(doc.paragraphs)

print(f"Loaded document with {total_p} paragraphs.")

figures = []
ui_sections = []

for i, p in enumerate(doc.paragraphs):
    text = p.text.strip()
    # Check figure captions
    if text.startswith('Hình ') or text.startswith('HÌNH '):
        figures.append((i, text))
    
    # Check UI/UX related headings or paragraphs
    if any(k in text.lower() for k in ['giao diện', 'ui/ux', 'thiết kế giao diện', 'màn hình', 'thiết kế chi tiết giao diện']):
        if len(text) < 150 and any(text.startswith(h) for h in ['3.', '4.', '5.', 'CHƯƠNG', 'b)', 'c)', 'd)']):
            ui_sections.append((i, text))

print(f"\nTotal figures in report: {len(figures)}")
ui_figures = [f for f in figures if any(k in f[1].lower() for k in ['giao diện', 'màn hình', 'dashboard', 'modal', 'trang', 'portal', 'bảng điểm', 'đăng ký', 'khảo thí', 'điểm danh'])]
print(f"UI/UX related figures: {len(ui_figures)}")
for idx, fig in ui_figures:
    print(f"  P[{idx}]: {fig}")

print(f"\nUI/UX related sections/headings ({len(ui_sections)}):")
for idx, sec in ui_sections:
    print(f"  P[{idx}]: {sec}")

