# -*- coding: utf-8 -*-
import zipfile
import sys
import io
import xml.etree.ElementTree as ET

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as z:
    doc_xml = z.read("word/document.xml")

root = ET.fromstring(doc_xml)
w = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
body = root.find(f"{w}body")
children = list(body)

print(f"Total children in body: {len(children)}")
for i, c in enumerate(children[:40]):
    tag = c.tag.replace(w, '')
    txt = "".join(c.itertext()).strip()
    print(f"Elem[{i}]: <w:{tag}> -> {txt[:70]}")
