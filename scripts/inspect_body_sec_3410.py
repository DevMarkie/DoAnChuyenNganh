# -*- coding: utf-8 -*-
import zipfile, re
from lxml import etree

docx_path = 'BaoCaoDoAn_ChinhSua_HoanThien.docx'
with zipfile.ZipFile(docx_path, 'r') as z:
    doc_bytes = z.read('word/document.xml')
    rels_bytes = z.read('word/_rels/document.xml.rels')

root = etree.fromstring(doc_bytes)
rels_root = etree.fromstring(rels_bytes)

rids = {}
for rel in rels_root:
    rids[rel.get('Id')] = rel.get('Target')

NS = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
}

paragraphs = root.xpath('//w:p', namespaces=NS)

print("Body figures in Section 3.4.10:")
for idx, p in enumerate(paragraphs):
    if idx < 500: continue
    text = "".join(p.xpath('.//w:t/text()', namespaces=NS)).strip()
    m = re.match(r'^H\u00ecnh (\d+[a-z]?)\.\s*(.*)', text)
    if m:
        fig_num = m.group(1)
        fig_title = m.group(2)
        if (fig_num.isdigit() and 83 <= int(fig_num) <= 126) or fig_num.startswith('126'):
            prev_p = paragraphs[idx - 1]
            blips = prev_p.xpath('.//a:blip', namespaces=NS)
            rid = blips[0].get(f"{{{NS['r']}}}embed") if blips else None
            target = rids.get(rid) if rid else None
            print(f"Fig {fig_num:>4} | cap_p={idx} | img_p={idx-1} | rid={rid} | target={target} | {fig_title[:50]}")

