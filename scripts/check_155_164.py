# -*- coding: utf-8 -*-
import zipfile
import re

with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as z:
    rels = z.read("word/_rels/document.xml.rels").decode("utf-8")

for rid in ['rId155', 'rId156', 'rId157', 'rId158', 'rId159', 'rId160', 'rId161', 'rId162', 'rId163', 'rId164']:
    m = re.findall(rf'Id="{rid}"[^>]*', rels)
    print(f"{rid}: {m}")
