# -*- coding: utf-8 -*-
import sys
import io
import os
import zipfile
import re
import xml.etree.ElementTree as ET
import win32com.client

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Register namespaces so ET serializes <w:...>, <r:...>, etc.
NAMESPACES = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'm': 'http://schemas.openxmlformats.org/officeDocument/2006/math',
    'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
    'wp14': 'http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture',
    'w14': 'http://schemas.microsoft.com/office/word/2010/wordml',
    'w15': 'http://schemas.microsoft.com/office/word/2012/wordml',
    'mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
}

for prefix, uri in NAMESPACES.items():
    ET.register_namespace(prefix, uri)

def fix_docx_namespaces(in_docx, out_docx):
    print(f"Fixing namespaces in {in_docx} -> {out_docx}...")
    with zipfile.ZipFile(in_docx, "r") as zin:
        all_items = {info.filename: zin.read(info.filename) for info in zin.infolist()}

    # 1. Fix document.xml
    doc_tree = ET.fromstring(all_items['word/document.xml'])
    doc_xml_fixed = ET.tostring(doc_tree, encoding='utf-8', xml_declaration=True)

    # 2. Fix document.xml.rels
    # For .rels, standard format is:
    # <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    # <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    #   <Relationship Id="..." Type="..." Target="..."/>
    # </Relationships>
    rels_str = all_items['word/_rels/document.xml.rels'].decode('utf-8')
    # Parse rels
    rels_tree = ET.fromstring(rels_str.encode('utf-8'))
    # Rebuild clean relationships xml
    rels_lines = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
                  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">']
    for rel in rels_tree.iter():
        if rel.tag.endswith('Relationship') and 'Id' in rel.attrib:
            r_id = rel.attrib.get('Id')
            r_type = rel.attrib.get('Type')
            r_target = rel.attrib.get('Target')
            rels_lines.append(f'  <Relationship Id="{r_id}" Type="{r_type}" Target="{r_target}"/>')
    rels_lines.append('</Relationships>')
    rels_xml_fixed = "\n".join(rels_lines).encode('utf-8')

    with zipfile.ZipFile(out_docx, "w", zipfile.ZIP_DEFLATED) as zout:
        for fname, data in all_items.items():
            if fname == 'word/document.xml':
                zout.writestr(fname, doc_xml_fixed)
            elif fname == 'word/_rels/document.xml.rels':
                zout.writestr(fname, rels_xml_fixed)
            else:
                zout.writestr(fname, data)

fix_docx_namespaces("BaoCaoDoAn_ChinhSua_HoanThien.docx", "test_fixed_ns.docx")

# Test with Word COM
print("Testing Word COM on test_fixed_ns.docx...")
word = win32com.client.Dispatch("Word.Application")
word.Visible = False
word.DisplayAlerts = 0
try:
    doc = word.Documents.Open(os.path.abspath("test_fixed_ns.docx"))
    print("SUCCESS! Word opened test_fixed_ns.docx!")
    print(f"Paragraphs: {doc.Paragraphs.Count}, Tables: {doc.Tables.Count}")
    doc.Close(False)
except Exception as e:
    print("FAILED ->", e)
finally:
    word.Quit()
