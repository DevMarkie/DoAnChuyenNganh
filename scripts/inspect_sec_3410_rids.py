# -*- coding: utf-8 -*-
import docx, re

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')
for i, p in enumerate(doc.paragraphs):
    if any('blip' in r._r.xml for r in p.runs):
        cap = doc.paragraphs[i+1].text.strip() if i+1 < len(doc.paragraphs) else ''
        m_fig = re.search(r'H\u00ecnh (\d+)', cap)
        if m_fig and 83 <= int(m_fig.group(1)) <= 126:
            fig_num = int(m_fig.group(1))
            m = re.search(r'r:embed="([^"]+)"', p._p.xml)
            rid = m.group(1) if m else None
            target = doc.part.rels[rid].target_ref if rid and rid in doc.part.rels else None
            print(f"Fig {fig_num:3d} | P[{i:4d}] | rId={rid} -> {target} | {cap[:60]}")

