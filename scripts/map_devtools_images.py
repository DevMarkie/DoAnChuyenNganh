# -*- coding: utf-8 -*-
import docx

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')

print("Mapping images in Section 5.2.4 (d)...")
for i in range(1370, min(1405, len(doc.paragraphs))):
    p = doc.paragraphs[i]
    for r in p.runs:
        # find blip element in run xml
        xml = r._r.xml
        if 'blip' in xml:
            import re
            m = re.search(r'r:embed="([^"]+)"', xml)
            if m:
                rid = m.group(1)
                target = doc.part.rels[rid].target_ref
                caption = doc.paragraphs[i+1].text.strip() if i+1 < len(doc.paragraphs) else ""
                print(f"P[{i}]: rId={rid} -> {target} | Caption='{caption[:50]}'")

