# -*- coding: utf-8 -*-
import os
import sys
sys.path.append(os.path.abspath('scripts'))

import win32com.client
from build_full_report import generate_report

sys.stdout.reconfigure(encoding='utf-8')
word = win32com.client.Dispatch('Word.Application')
word.Visible = False

best_sp = None
best_pages = None

try:
    for sp in [1.37, 1.38, 1.39, 1.40, 1.42]:
        fn = f'dacn_test_{sp}.docx'
        generate_report(fn, font_size_pt=13.0, line_spacing=sp, space_after_pt=6.0)
        doc = word.Documents.Open(os.path.abspath(fn), ReadOnly=True)
        pages = doc.ComputeStatistics(2)
        doc.Close(False)
        print(f"Line spacing {sp:.2f} -> EXACT PAGES: {pages}")
        if pages in [68, 69, 70]:
            print(f">>> HIT TARGET! {pages} pages with line_spacing={sp:.2f}")
            best_sp = sp
            best_pages = pages
            break
        # cleanup test file
        if os.path.exists(fn):
            os.remove(fn)
finally:
    word.Quit()

if best_sp:
    print(f"Optimal parameter found: line_spacing={best_sp}, exact pages={best_pages}")
