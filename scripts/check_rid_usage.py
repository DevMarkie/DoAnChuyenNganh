# -*- coding: utf-8 -*-
import zipfile
import re

with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as z:
    doc_xml = z.read("word/document.xml").decode("utf-8")
    rels = z.read("word/_rels/document.xml.rels").decode("utf-8")

for rid in ['rId135', 'rId136', 'rId137', 'rId138', 'rId157', 'rId158', 'rId159', 'rId160']:
    in_doc = re.findall(rf'[^>]*{rid}[^<]*', doc_xml)
    in_rels = re.findall(rf'Id="{rid}"[^>]*', rels)
    print(f"=== {rid} ===")
    print(f"  in rels: {in_rels}")
    print(f"  in doc ({len(in_doc)} times): {in_doc[:2]}")
