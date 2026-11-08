# -*- coding: utf-8 -*-
import docx, re

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')
indices = [294, 1107, 1127, 1151, 1152, 1212, 1217, 1232]
for idx in indices:
    text = doc.paragraphs[idx].text
    for sentence in re.split(r'[\.\n]\s*', text):
        if re.search(r'\bmình\b', sentence, re.IGNORECASE):
            print(f"P[{idx}]: \"{sentence.strip()}\"")

