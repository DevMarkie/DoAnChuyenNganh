# -*- coding: utf-8 -*-
import sys
import io
import os
import zipfile
import xml.etree.ElementTree as ET
import win32com.client

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Build cleaned rels with NO duplicates
with zipfile.ZipFile("test_perfect_ns.docx") as z:
    rels_xml = z.read("word/_rels/document.xml.rels")

tree = ET.fromstring(rels_xml)
root = ET.Element("Relationships", xmlns="http://schemas.openxmlformats.org/package/2006/relationships")

# We want 138 original rels (rId1 to rId138)
# plus image rels:
# rId139 to rId156 (media/image133 to image150)
# rId161 to rId164 (media/image129 to image132)
# We EXCLUDE duplicate rId157, rId158, rId159, rId160!
excluded = {'rId157', 'rId158', 'rId159', 'rId160'}

for rel in tree:
    rid = rel.attrib.get('Id')
    if rid in excluded:
        continue
    ET.SubElement(root, "Relationship", Id=rid, Type=rel.attrib.get('Type'), Target=rel.attrib.get('Target'))

cleaned_rels_xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + ET.tostring(root, encoding='utf-8').decode('utf-8')

# Now test with Good doc first
with zipfile.ZipFile("docs/backups/BaoCaoDoAn_BanDau_CuNhat.docx") as zg:
    good_doc = zg.read("word/document.xml")

with zipfile.ZipFile("test_perfect_ns.docx") as zin:
    with zipfile.ZipFile("test_clean_rels_good_doc.docx", "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == "word/document.xml":
                zout.writestr(item, good_doc)
            elif item.filename == "word/_rels/document.xml.rels":
                zout.writestr(item, cleaned_rels_xml.encode('utf-8'))
            else:
                zout.writestr(item, zin.read(item.filename))

print("Testing test_clean_rels_good_doc.docx...")
word = win32com.client.Dispatch("Word.Application")
word.Visible = False
word.DisplayAlerts = 0
try:
    doc = word.Documents.Open(os.path.abspath("test_clean_rels_good_doc.docx"))
    print(">>> SUCCESS! Opened test_clean_rels_good_doc.docx! Paras:", doc.Paragraphs.Count)
    doc.Close(False)
except Exception as e:
    print("FAILED ->", e)
finally:
    word.Quit()
