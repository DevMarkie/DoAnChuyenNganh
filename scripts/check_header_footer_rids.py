# -*- coding: utf-8 -*-
import zipfile
import re

with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as z:
    rels = z.read("word/_rels/document.xml.rels").decode("utf-8")
    doc_xml = z.read("word/document.xml").decode("utf-8")

for rid in ['rId155', 'rId156', 'rId157', 'rId158', 'rId159', 'rId160']:
    m = re.findall(rf'<Relationship[^>]*Id="{rid}"[^>]*/>', rels)
    print(f"Rels for {rid}: {m}")

# Also check header/footer references in doc_xml
m_head = re.findall(r'<[^>]*headerReference[^>]*/>', doc_xml)
print(f"Header references in doc_xml: {m_head}")
m_foot = re.findall(r'<[^>]*footerReference[^>]*/>', doc_xml)
print(f"Footer references in doc_xml: {m_foot}")
