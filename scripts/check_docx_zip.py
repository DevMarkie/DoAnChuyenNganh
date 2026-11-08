# -*- coding: utf-8 -*-
import zipfile
import xml.etree.ElementTree as ET

docx_path = 'BaoCaoDoAn_ChinhSua_HoanThien.docx'
with zipfile.ZipFile(docx_path, 'r') as z:
    rels_xml = z.read('word/_rels/document.xml.rels').decode('utf-8')
    doc_xml = z.read('word/document.xml').decode('utf-8')

print("Rels xml length:", len(rels_xml))
print("Doc xml length:", len(doc_xml))

