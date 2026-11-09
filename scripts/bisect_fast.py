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
sectPr = children[-1] if children and children[-1].tag == f"{w}sectPr" else None
elements = children[:-1] if sectPr is not None else children

word = win32com.client.Dispatch("Word.Application")
word.Visible = False
word.DisplayAlerts = 0

def test_slice(start, end, label):
    new_root = copy.deepcopy(root)
    new_body = new_root.find(f"{w}body")
    for c in list(new_body):
        new_body.remove(c)
    for elem in elements[start:end]:
        new_body.append(copy.deepcopy(elem))
    if sectPr is not None:
        new_body.append(copy.deepcopy(sectPr))
    new_xml = ET.tostring(new_root, encoding='utf-8')
    out_path = f"test_slice_{label}.docx"
    with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as zin:
        with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                if item.filename == "word/document.xml":
                    zout.writestr(item, new_xml)
                else:
                    zout.writestr(item, zin.read(item.filename))
    try:
        doc = word.Documents.Open(os.path.abspath(out_path))
        doc.Close(False)
        res = True
    except:
        res = False
    print(f"Slice [{start}:{end}] ({label}): {res}")
    return res

test_slice(0, 10, "0_10")
test_slice(0, 20, "0_20")
test_slice(0, 33, "0_33")
test_slice(33, 35, "33_35")
test_slice(200, 300, "200_300")

word.Quit()
