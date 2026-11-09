# -*- coding: utf-8 -*-
import sys
import io
import os
import zipfile
import win32com.client

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 1. Read document.xml from test_perfect_ns.docx
with zipfile.ZipFile("test_perfect_ns.docx") as zt:
    doc_xml = zt.read("word/document.xml").decode("utf-8")

# Fix rId157 -> rId135, rId158 -> rId136
doc_xml = doc_xml.replace('r:id="rId157"', 'r:id="rId135"')
doc_xml = doc_xml.replace('r:id="rId158"', 'r:id="rId136"')

# 2. Read cleaned rels from test_clean_rels_good_doc.docx
with zipfile.ZipFile("test_clean_rels_good_doc.docx") as zc:
    cleaned_rels = zc.read("word/_rels/document.xml.rels")

# 3. Create test_repaired_full.docx
with zipfile.ZipFile("test_perfect_ns.docx") as zin:
    with zipfile.ZipFile("test_repaired_full.docx", "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == "word/document.xml":
                zout.writestr(item, doc_xml.encode('utf-8'))
            elif item.filename == "word/_rels/document.xml.rels":
                zout.writestr(item, cleaned_rels)
            else:
                zout.writestr(item, zin.read(item.filename))

print("Created test_repaired_full.docx.")
print("Testing with Microsoft Word COM...")

word = win32com.client.Dispatch("Word.Application")
word.Visible = False
word.DisplayAlerts = 0
try:
    doc = word.Documents.Open(os.path.abspath("test_repaired_full.docx"))
    print("\n=======================================================")
    print(">>> SUCCESS! WORD OPENED test_repaired_full.docx! <<<")
    print(f"Total Paragraphs: {doc.Paragraphs.Count}")
    print(f"Total Tables: {doc.Tables.Count}")
    print(f"Total Sections: {doc.Sections.Count}")
    print("=======================================================\n")
    doc.Close(False)
except Exception as e:
    print("FAILED ->", e)
finally:
    word.Quit()
