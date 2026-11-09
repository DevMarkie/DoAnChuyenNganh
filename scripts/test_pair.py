# -*- coding: utf-8 -*-
import sys
import io
import os
import zipfile
import win32com.client

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Put (Good document.xml + Good document.xml.rels) into BaoCaoDoAn_ChinhSua_HoanThien.docx
with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as zin:
    with zipfile.ZipFile("test_pair.docx", "w", zipfile.ZIP_DEFLATED) as zout:
        with zipfile.ZipFile("docs/backups/BaoCaoDoAn_BanDau_CuNhat.docx", "r") as zgood:
            good_doc = zgood.read("word/document.xml")
            good_rels = zgood.read("word/_rels/document.xml.rels")
        
        for item in zin.infolist():
            if item.filename == "word/document.xml":
                zout.writestr(item, good_doc)
            elif item.filename == "word/_rels/document.xml.rels":
                zout.writestr(item, good_rels)
            else:
                zout.writestr(item, zin.read(item.filename))

word = win32com.client.Dispatch("Word.Application")
word.Visible = False
word.DisplayAlerts = 0
try:
    doc = word.Documents.Open(os.path.abspath("test_pair.docx"))
    print("SUCCESS OPENING PAIR! Paras:", doc.Paragraphs.Count)
    doc.Close(False)
except Exception as e:
    print("FAILED PAIR:", e)
finally:
    word.Quit()
