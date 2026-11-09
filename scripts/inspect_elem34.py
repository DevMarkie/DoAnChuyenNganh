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
elem34 = list(body)[34]
print("Elem[34] tag:", elem34.tag)
print("Elem[34] xml length:", len(ET.tostring(elem34)))
# print first 300 chars of elem34 xml
print(ET.tostring(elem34, encoding='utf-8').decode('utf-8')[:300])
