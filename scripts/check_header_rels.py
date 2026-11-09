# -*- coding: utf-8 -*-
import zipfile
import re

with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as z:
    rels = z.read("word/_rels/document.xml.rels").decode("utf-8")

matches = re.findall(r'<Relationship[^>]*Target="([^"]*header[^"]*)"[^>]*/>', rels)
print("Header rels in ChinhSua_HoanThien:", matches)

matches2 = re.findall(r'<Relationship[^>]*Target="([^"]*footer[^"]*)"[^>]*/>', rels)
print("Footer rels in ChinhSua_HoanThien:", matches2)
