# -*- coding: utf-8 -*-
import sys
import io
import os
import zipfile
import copy
import xml.etree.ElementTree as ET
import win32com.client

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as z:
    doc_xml = z.read("word/document.xml")

root = ET.fromstring(doc_xml)
w = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
body = root.find(f"{w}body")
children = list(body)

print(f"Initial body children: {len(children)}")

# Find elements to remove:
# Elem[36] to Elem[157] are duplicate TOC paragraphs:
# Let's inspect which elements are between Elem[35] and "DANH MỤC HÌNH ẢNH"
danh_muc_hinh_idx = None
for i, c in enumerate(children):
    txt = "".join(c.itertext()).strip()
    if txt == "DANH MỤC HÌNH ẢNH":
        danh_muc_hinh_idx = i
        break

print(f"DANH MỤC HÌNH ẢNH is at index: {danh_muc_hinh_idx}")

# Elements between 35 and danh_muc_hinh_idx are loose TOC paragraphs!
elements_to_remove = set()
for i in range(36, danh_muc_hinh_idx):
    elements_to_remove.add(children[i])

# Also check for Elem[159] and Elem[162] (which have "No table of figures entries found")
for c in children:
    txt = "".join(c.itertext()).strip()
    if "No table of figures entries found" in txt:
        elements_to_remove.add(c)
        print(f"Removing broken field paragraph: {txt[:50]}")

print(f"Total elements to remove: {len(elements_to_remove)}")
for elem in elements_to_remove:
    body.remove(elem)

print(f"Remaining body children: {len(list(body))}")

# Write to test_cleaned.docx
cleaned_xml = ET.tostring(root, encoding='utf-8')
with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as zin:
    with zipfile.ZipFile("test_cleaned.docx", "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == "word/document.xml":
                zout.writestr(item, cleaned_xml)
            else:
                zout.writestr(item, zin.read(item.filename))

print("Saved test_cleaned.docx! Testing Word COM open...")
word = win32com.client.Dispatch("Word.Application")
word.Visible = False
word.DisplayAlerts = 0
try:
    doc = word.Documents.Open(os.path.abspath("test_cleaned.docx"))
    print("SUCCESS! Word opened test_cleaned.docx perfectly!")
    print(f"Paragraphs: {doc.Paragraphs.Count}, Tables: {doc.Tables.Count}")
    doc.Close(False)
except Exception as e:
    print("FAILED ->", e)
finally:
    word.Quit()
