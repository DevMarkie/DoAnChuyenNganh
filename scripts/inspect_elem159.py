# -*- coding: utf-8 -*-
import sys
import io
import zipfile
import xml.etree.ElementTree as ET

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as z:
    doc_xml = z.read("word/document.xml")

root = ET.fromstring(doc_xml)
w = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
body = root.find(f"{w}body")
children = list(body)

for idx in [158, 159, 160, 161, 162, 163, 164]:
    c = children[idx]
    xml_str = ET.tostring(c, encoding='utf-8').decode('utf-8')
    print(f"\n--- Elem[{idx}] tag={c.tag.replace(w, '')} ---")
    print(xml_str[:300])
