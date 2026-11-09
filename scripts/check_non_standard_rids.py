# -*- coding: utf-8 -*-
import zipfile
import sys
import io
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as z:
    doc_xml = z.read("word/document.xml").decode("utf-8")
    rels_xml = z.read("word/_rels/document.xml.rels").decode("utf-8")

non_standard_doc = re.findall(r'rId[^\d"][^"]*', doc_xml)
non_standard_rels = re.findall(r'rId[^\d"][^"]*', rels_xml)

print("Non-standard rIds in document.xml:", set(non_standard_doc))
print("Non-standard rIds in rels.xml:", set(non_standard_rels))
