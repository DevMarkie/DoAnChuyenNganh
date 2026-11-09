# -*- coding: utf-8 -*-
import zipfile
import re

with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as z:
    rels = z.read("word/_rels/document.xml.rels").decode("utf-8")

matches = re.findall(r'<Relationship[^>]*Id="rId13[4-9]"[^>]*/>', rels)
for m in matches:
    print(m)
