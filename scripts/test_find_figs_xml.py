# -*- coding: utf-8 -*-
import zipfile, re
from lxml import etree

docx_path = 'BaoCaoDoAn_ChinhSua_HoanThien.docx'
with zipfile.ZipFile(docx_path, 'r') as z:
    doc_bytes = z.read('word/document.xml')
    rels_bytes = z.read('word/_rels/document.xml.rels')

root = etree.fromstring(doc_bytes)
rels_root = etree.fromstring(rels_bytes)

# Map rId to target
rids = {}
for rel in rels_root:
    rids[rel.get('Id')] = rel.get('Target')

NS = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
}

paragraphs = root.xpath('//w:p', namespaces=NS)
print(f"Total paragraphs in document.xml: {len(paragraphs)}")

found_figs = []
for idx, p in enumerate(paragraphs):
    text = "".join(p.xpath('.//w:t/text()', namespaces=NS)).strip()
    m = re.search(r'H\u00ecnh (\d+[a-z]?)\.?\s*(.*)', text)
    if m:
        fig_num = m.group(1)
        fig_title = m.group(2)
        # Check previous paragraph for image
        prev_p = paragraphs[idx - 1] if idx > 0 else None
        blips = prev_p.xpath('.//a:blip', namespaces=NS) if prev_p is not None else []
        rid = blips[0].get(f"{{{NS['r']}}}embed") if blips else None
        target = rids.get(rid) if rid else None
        found_figs.append({
            'fig': fig_num,
            'title': fig_title[:40],
            'p_idx': idx,
            'prev_p_idx': idx - 1 if prev_p is not None else None,
            'rid': rid,
            'target': target
        })

print(f"Found {len(found_figs)} figures with captions.")
for f in found_figs:
    if f['fig'].isdigit() and (83 <= int(f['fig']) <= 148):
        print(f"Hình {f['fig']:>4} | p_idx={f['p_idx']:4d} | rid={f['rid']} | target={f['target']} | title={f['title']}")
    elif not f['fig'].isdigit() and f['fig'].startswith('126'):
        print(f"Hình {f['fig']:>4} | p_idx={f['p_idx']:4d} | rid={f['rid']} | target={f['target']} | title={f['title']}")

