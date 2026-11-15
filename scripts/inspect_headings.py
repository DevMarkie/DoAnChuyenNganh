# -*- coding: utf-8 -*-
import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')

doc = docx.Document('dacn.docx')
for i, p in enumerate(doc.paragraphs):
    if p.text.startswith('CHƯƠNG') or any(p.text.startswith(f"{x}.") for x in range(1, 6)):
        print(f"{i}: [{p.style.name}] (align={p.alignment}) text='{p.text[:65]}'")
        for r in p.runs[:2]:
            print(f"   Run: font={r.font.name}, size={r.font.size}, bold={r.font.bold}, color={r.font.color.rgb if r.font.color else None}")
