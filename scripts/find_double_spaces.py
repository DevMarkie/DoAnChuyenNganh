# -*- coding: utf-8 -*-
import docx, re

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')

double_space_paras = []
for i, p in enumerate(doc.paragraphs):
    if 171 <= i <= 1466:
        text = p.text
        if '  ' in text:
            # check where double space is
            matches = list(re.finditer(r'(\S+)(\s{2,})(\S+)', text))
            for m in matches:
                double_space_paras.append((i, m.group(0)))

print(f"Tổng số đoạn có dấu cách đôi: {len(set(x[0] for x in double_space_paras))}")
for idx, sample in double_space_paras[:10]:
    print(f"P[{idx}]: \"{sample}\"")

