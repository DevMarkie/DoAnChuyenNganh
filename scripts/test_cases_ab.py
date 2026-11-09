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

# Read good parts
with zipfile.ZipFile("docs/backups/BaoCaoDoAn_BanDau_CuNhat.docx") as zg:
    good_doc = zg.read("word/document.xml")
    good_rels = zg.read("word/_rels/document.xml.rels")

# Read test_perfect_ns parts
with zipfile.ZipFile("test_perfect_ns.docx") as zt:
    test_doc = zt.read("word/document.xml")
    test_rels = zt.read("word/_rels/document.xml.rels")

# Case A: Base test_perfect_ns with GOOD rels + TEST doc
with zipfile.ZipFile("test_perfect_ns.docx") as zin:
    with zipfile.ZipFile("test_case_A.docx", "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == "word/_rels/document.xml.rels":
                zout.writestr(item, good_rels)
            else:
                zout.writestr(item, zin.read(item.filename))
print("Case A (TEST doc + GOOD rels):", test_file("test_case_A.docx"))

# Case B: Base test_perfect_ns with GOOD doc + TEST rels
with zipfile.ZipFile("test_perfect_ns.docx") as zin:
    with zipfile.ZipFile("test_case_B.docx", "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == "word/document.xml":
                zout.writestr(item, good_doc)
            else:
                zout.writestr(item, zin.read(item.filename))
print("Case B (GOOD doc + TEST rels):", test_file("test_case_B.docx"))

word.Quit()
