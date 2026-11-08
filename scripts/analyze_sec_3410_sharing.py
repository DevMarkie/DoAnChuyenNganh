# -*- coding: utf-8 -*-
import docx, re
from collections import defaultdict

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')
rid_to_figs = defaultdict(list)
for i, p in enumerate(doc.paragraphs):
    if any('blip' in r._r.xml for r in p.runs):
        cap = doc.paragraphs[i+1].text.strip() if i+1 < len(doc.paragraphs) else ''
        m_fig = re.search(r'H\u00ecnh (\d+[a-z]?)', cap)
        if m_fig:
            fig_str = m_fig.group(1)
            m = re.search(r'r:embed="([^"]+)"', p._p.xml)
            rid = m.group(1) if m else None
            rid_to_figs[rid].append((fig_str, i, cap[:50]))

print("Relationship usage across all figures:")
for rid, figs in sorted(rid_to_figs.items(), key=lambda x: str(x[0])):
    if len(figs) > 1:
        print(f"SHARED rId={rid} ({len(figs)} figures): {[f[0] for f in figs]}")
    else:
        print(f"Unique rId={rid}: Fig {figs[0][0]}")

