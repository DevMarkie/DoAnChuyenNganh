# -*- coding: utf-8 -*-
import docx, re

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')
for i, p in enumerate(doc.paragraphs):
    if 'Hình 127.' in p.text:
        print(f"P[{i}]: {p.text}")
        prev_p = doc.paragraphs[i-1]
        for r in prev_p.runs:
            if 'blip' in r._r.xml:
                m = re.search(r'r:embed="([^"]+)"', r._r.xml)
                rid = m.group(1) if m else None
                print(f"Image run rId: {rid}, target: {doc.part.rels[rid].target_ref}")

