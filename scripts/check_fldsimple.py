# -*- coding: utf-8 -*-
import zipfile
import re
import xml.etree.ElementTree as ET

with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as z:
    doc_xml = z.read("word/document.xml").decode("utf-8")

root = ET.fromstring(doc_xml)
w = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

fld_simples = root.findall(f".//{w}fldSimple")
print(f"Total fldSimple elements: {len(fld_simples)}")
for fs in fld_simples:
    instr = fs.attrib.get(f"{w}instr")
    print(f"  fldSimple instr='{instr}', children={[c.tag.replace(w, '') for c in fs]}")
