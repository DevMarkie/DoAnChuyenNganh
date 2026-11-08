# -*- coding: utf-8 -*-
import docx, re

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')

print("Mapping images in Section 3.4.10 (P[875] - P[1050])...")
for i in range(875, min(1030, len(doc.paragraphs))):
    p = doc.paragraphs[i]
    for r in p.runs:
        xml = r._r.xml
        if 'blip' in xml:
            m = re.search(r'r:embed="([^"]+)"', xml)
            if m:
                rid = m.group(1)
                target = doc.part.rels[rid].target_ref
                caption = doc.paragraphs[i+1].text.strip() if i+1 < len(doc.paragraphs) else ""
                print(f"P[{i}]: rId={rid} -> {target} | Caption='{caption[:60]}'")

