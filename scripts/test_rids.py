# -*- coding: utf-8 -*-
import zipfile
import re

with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as z:
    doc_xml = z.read("word/document.xml").decode("utf-8")
    rels_xml = z.read("word/_rels/document.xml.rels").decode("utf-8")

doc_rids = set(re.findall(r'rId\d+', doc_xml))
rels_rids = set(re.findall(r'rId\d+', rels_xml))

print("Total rIds referenced in document.xml:", len(doc_rids))
print("Total rIds defined in document.xml.rels:", len(rels_rids))

missing_in_rels = doc_rids - rels_rids
print("rIds in document.xml but MISSING in rels:", missing_in_rels)
missing_in_doc = rels_rids - doc_rids
print("rIds in rels but unused in document.xml:", len(missing_in_doc))
