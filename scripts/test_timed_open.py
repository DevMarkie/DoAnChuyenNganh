# -*- coding: utf-8 -*-
import sys
import io
import os
import time
import win32com.client

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Ensure no lock files
for f in os.listdir('.'):
    if f.startswith('~$'):
        try: os.remove(f)
        except: pass

print("Starting Word COM test...")
t0 = time.time()
word = win32com.client.Dispatch("Word.Application")
word.Visible = False
word.DisplayAlerts = 0

docx_path = os.path.abspath("BaoCaoDoAn_ChinhSua_HoanThien.docx")
print(f"Opening {docx_path} ({os.path.getsize(docx_path):,} bytes)...")

doc = word.Documents.Open(docx_path)
t1 = time.time()
print(f"SUCCESS! Opened in {t1 - t0:.2f} seconds!")
print(f"Paragraphs: {doc.Paragraphs.Count:,}")
print(f"Tables: {doc.Tables.Count:,}")
print(f"Sections: {doc.Sections.Count:,}")
doc.Close(False)
word.Quit()
print("All done!")
