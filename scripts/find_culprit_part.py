# -*- coding: utf-8 -*-
import sys
import io
import os
import zipfile
import win32com.client

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

word = win32com.client.Dispatch("Word.Application")
word.Visible = False
word.DisplayAlerts = 0

def test_file(path):
    try:
        doc = word.Documents.Open(os.path.abspath(path))
        doc.Close(False)
        return True
    except Exception as e:
        return False

# Base: BanDau_CuNhat.docx (which is known to OPEN SUCCESS!)
# Let's see what happens if we replace parts in BanDau_CuNhat with parts from BaoCaoDoAn_ChinhSua_HoanThien.docx
with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as z_bad:
    bad_files = z_bad.namelist()

with zipfile.ZipFile("docs/backups/BaoCaoDoAn_BanDau_CuNhat.docx", "r") as z_good:
    good_files = z_good.namelist()

# Test 1: BanDau with ONLY word/document.xml from bad
with zipfile.ZipFile("docs/backups/BaoCaoDoAn_BanDau_CuNhat.docx", "r") as zin:
    with zipfile.ZipFile("test_replace_doc_xml.docx", "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == "word/document.xml":
                with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as zbad:
                    zout.writestr(item, zbad.read("word/document.xml"))
            else:
                zout.writestr(item, zin.read(item.filename))
print("Test 1 (Good base + Bad document.xml):", test_file("test_replace_doc_xml.docx"))

# Test 2: Bad base with Good document.xml
with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as zin:
    with zipfile.ZipFile("test_replace_good_doc_xml.docx", "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == "word/document.xml":
                with zipfile.ZipFile("docs/backups/BaoCaoDoAn_BanDau_CuNhat.docx", "r") as zgood:
                    zout.writestr(item, zgood.read("word/document.xml"))
            else:
                zout.writestr(item, zin.read(item.filename))
print("Test 2 (Bad base + Good document.xml):", test_file("test_replace_good_doc_xml.docx"))

# Test 3: Bad base with Good rels
with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as zin:
    with zipfile.ZipFile("test_replace_good_rels.docx", "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == "word/_rels/document.xml.rels":
                with zipfile.ZipFile("docs/backups/BaoCaoDoAn_BanDau_CuNhat.docx", "r") as zgood:
                    zout.writestr(item, zgood.read("word/_rels/document.xml.rels"))
            else:
                zout.writestr(item, zin.read(item.filename))
print("Test 3 (Bad base + Good document.xml.rels):", test_file("test_replace_good_rels.docx"))

# Test 4: Bad base with Good [Content_Types].xml
with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as zin:
    with zipfile.ZipFile("test_replace_good_ct.docx", "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == "[Content_Types].xml":
                with zipfile.ZipFile("docs/backups/BaoCaoDoAn_BanDau_CuNhat.docx", "r") as zgood:
                    zout.writestr(item, zgood.read("[Content_Types].xml"))
            else:
                zout.writestr(item, zin.read(item.filename))
print("Test 4 (Bad base + Good [Content_Types].xml):", test_file("test_replace_good_ct.docx"))

word.Quit()
