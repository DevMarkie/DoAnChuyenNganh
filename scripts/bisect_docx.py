# -*- coding: utf-8 -*-
import sys
import io
import os
import zipfile
import copy
import xml.etree.ElementTree as ET
import win32com.client

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load document.xml from BaoCaoDoAn_ChinhSua_HoanThien.docx
with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as z:
    doc_xml = z.read("word/document.xml")

root = ET.fromstring(doc_xml)
w = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
body = root.find(f"{w}body")
children = list(body)
sectPr = children[-1] if children and children[-1].tag == f"{w}sectPr" else None
elements = children[:-1] if sectPr is not None else children
print(f"Total elements in body: {len(elements)}")

# Test helper
def test_open_docx(test_path):
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    word.DisplayAlerts = 0
    success = False
    try:
        doc = word.Documents.Open(os.path.abspath(test_path))
        success = True
        doc.Close(False)
    except Exception as e:
        success = False
    finally:
        word.Quit()
    return success

# Save a slice of elements to test.docx
def make_test_docx(elem_slice, out_path="test_slice.docx"):
    new_root = copy.deepcopy(root)
    new_body = new_root.find(f"{w}body")
    # clear body
    for child in list(new_body):
        new_body.remove(child)
    for elem in elem_slice:
        new_body.append(copy.deepcopy(elem))
    if sectPr is not None:
        new_body.append(copy.deepcopy(sectPr))
    
    new_xml = ET.tostring(new_root, encoding='utf-8')
    
    with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as zin:
        with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                if item.filename == "word/document.xml":
                    zout.writestr(item, new_xml)
                else:
                    zout.writestr(item, zin.read(item.filename))

print("Testing first 50 elements...")
make_test_docx(elements[:50], "test_50.docx")
res50 = test_open_docx("test_50.docx")
print("First 50 elements open:", res50)

if res50:
    print("Testing first 500 elements...")
    make_test_docx(elements[:500], "test_500.docx")
    res500 = test_open_docx("test_500.docx")
    print("First 500 elements open:", res500)

    if res500:
        print("Testing first 1000 elements...")
        make_test_docx(elements[:1000], "test_1000.docx")
        res1000 = test_open_docx("test_1000.docx")
        print("First 1000 elements open:", res1000)
        
        if res1000:
            print("Testing first 1500 elements...")
            make_test_docx(elements[:1500], "test_1500.docx")
            res1500 = test_open_docx("test_1500.docx")
            print("First 1500 elements open:", res1500)
            
            if res1500:
                print("Testing all elements except last 50...")
                make_test_docx(elements[:-50], "test_all_minus_50.docx")
                res_all_m50 = test_open_docx("test_all_minus_50.docx")
                print("All elements minus last 50 open:", res_all_m50)
