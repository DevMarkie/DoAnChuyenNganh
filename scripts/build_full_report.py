# -*- coding: utf-8 -*-
import os
import sys
import subprocess
sys.path.append(os.path.abspath('scripts'))

import docx
from docx.shared import Pt, RGBColor, Cm, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.style import WD_STYLE_TYPE

import report_content_frontmatter
import report_content_ch1
import report_content_ch2
import report_content_ch3
import report_content_ch4
import report_content_ch5_ref

from docx_helpers import add_bookmark, heading_to_bm
import re

def close_word_instances():
    try:
        subprocess.run(['powershell', '-Command', 'Get-Process WINWORD -ErrorAction SilentlyContinue | Stop-Process -Force'], check=False)
    except Exception as e:
        print(f"Notice closing Word: {e}")

def insert_all_bookmarks(doc):
    bm_counter = 1000
    bms_added = set()
    for p in doc.paragraphs:
        t = p.text.strip()
        if not t:
            continue
        # Frontmatter
        if "KẾ HOẠCH VÀ TIẾN ĐỘ" in t and "bm_timeline" not in bms_added:
            bm_counter += 1
            add_bookmark(p, "bm_timeline", bm_counter)
            bms_added.add("bm_timeline")
        elif t == "LỜI CAM ĐOAN" and "bm_camdoan" not in bms_added:
            bm_counter += 1
            add_bookmark(p, "bm_camdoan", bm_counter)
            bms_added.add("bm_camdoan")
        elif t == "DANH MỤC BẢNG BIỂU VÀ TỪ VIẾT TẮT" and "bm_tbl_list" not in bms_added:
            bm_counter += 1
            add_bookmark(p, "bm_tbl_list", bm_counter)
            bms_added.add("bm_tbl_list")
        elif t == "DANH MỤC HÌNH ẢNH TIÊU BIỂU" and "bm_fig_list" not in bms_added:
            bm_counter += 1
            add_bookmark(p, "bm_fig_list", bm_counter)
            bms_added.add("bm_fig_list")
        elif t == "TÀI LIỆU THAM KHẢO" and "bm_ref" not in bms_added:
            bm_counter += 1
            add_bookmark(p, "bm_ref", bm_counter)
            bms_added.add("bm_ref")
        # Headings
        elif p.style.name.startswith("Heading"):
            bm_name = heading_to_bm(p.text)
            if bm_name not in bms_added:
                bm_counter += 1
                add_bookmark(p, bm_name, bm_counter)
                bms_added.add(bm_name)
        # Tables (e.g. 'Bảng 1. ...')
        elif re.match(r'^Bảng\s+(\d+)\.', t):
            m = re.match(r'^Bảng\s+(\d+)\.', t)
            tbl_bm = f"bm_tbl_{m.group(1)}"
            if tbl_bm not in bms_added:
                bm_counter += 1
                add_bookmark(p, tbl_bm, bm_counter)
                bms_added.add(tbl_bm)
        # Figures (e.g. 'Hình 1. ...')
        elif re.match(r'^Hình\s+(\d+)\.', t):
            m = re.match(r'^Hình\s+(\d+)\.', t)
            fig_bm = f"bm_fig_{m.group(1)}"
            if fig_bm not in bms_added:
                bm_counter += 1
                add_bookmark(p, fig_bm, bm_counter)
                bms_added.add(fig_bm)
    print(f"Inserted {len(bms_added)} bookmarks across the document.")

def generate_report(output_filename="dacn.docx", font_size_pt=13.0, line_spacing=1.52, space_after_pt=6.0):
    print(f"Generating report: {output_filename} (fontSize={font_size_pt}, spacing={line_spacing}, spaceAfter={space_after_pt})...")
    close_word_instances()
    doc = docx.Document()
    
    # Configure default Normal style
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Times New Roman'
    style_normal.font.size = Pt(font_size_pt)
    style_normal.font.color.rgb = RGBColor(0, 0, 0)
    style_normal.paragraph_format.line_spacing = line_spacing
    style_normal.paragraph_format.space_after = Pt(space_after_pt)
    style_normal.paragraph_format.space_before = Pt(0)
    
    # Configure Heading styles for Word Navigation Pane
    for s_name, pt, bold, color in [
        ('Heading 1', 14.0, True, RGBColor(16, 44, 87)),
        ('Heading 2', 13.0, True, RGBColor(16, 44, 87)),
        ('Heading 3', 12.0, True, RGBColor(16, 44, 87)),
    ]:
        if s_name in doc.styles:
            s = doc.styles[s_name]
            s.font.name = 'Times New Roman'
            s.font.size = Pt(pt)
            s.font.bold = bold
            s.font.color.rgb = color
            s.paragraph_format.keep_with_next = True
    
    extracted_images_dir = os.path.abspath('scripts/extracted_images')
    
    # Build each section
    print("Building Frontmatter...")
    report_content_frontmatter.build_frontmatter(doc, extracted_images_dir)
    
    print("Building Chapter 1...")
    report_content_ch1.build_chapter_1(doc)
    
    print("Building Chapter 2...")
    report_content_ch2.build_chapter_2(doc)
    
    print("Building Chapter 3...")
    report_content_ch3.build_chapter_3(doc, extracted_images_dir)
    
    print("Building Chapter 4...")
    report_content_ch4.build_chapter_4(doc, extracted_images_dir)
    
    print("Building Chapter 5 and References...")
    report_content_ch5_ref.build_chapter_5_and_references(doc)
    
    print("Inserting internal bookmarks for Navigation & Hyperlinks...")
    insert_all_bookmarks(doc)
    
    doc.save(output_filename)
    print(f"Saved {output_filename} successfully (size: {os.path.getsize(output_filename)/1024:.1f} KB).")
    return output_filename

def export_to_pdf_and_verify(docx_filename="dacn.docx", pdf_filename="BaoCaoDoAn.pdf"):
    print(f"Exporting {docx_filename} to {pdf_filename} via Word COM...")
    import win32com.client
    import pypdf
    
    docx_path = os.path.abspath(docx_filename)
    pdf_path = os.path.abspath(pdf_filename)
    
    word = win32com.client.Dispatch('Word.Application')
    word.Visible = False
    try:
        doc = word.Documents.Open(docx_path)
        
        # Compute exact Word pages
        word_pages = doc.ComputeStatistics(2) # 2 = wdStatisticPages
        print(f"Word Document Page Count: {word_pages} pages")
        
        # Save as PDF (wdFormatPDF = 17)
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        doc.SaveAs2(pdf_path, FileFormat=17)
        doc.Close(False)
        print(f"Exported PDF successfully to {pdf_path}")
    finally:
        word.Quit()
        
    # Verify PDF page count with pypdf
    reader = pypdf.PdfReader(pdf_path)
    pdf_pages = len(reader.pages)
    pdf_size_mb = os.path.getsize(pdf_path) / (1024 * 1024)
    print(f"PDF Page Count: {pdf_pages} pages (Size: {pdf_size_mb:.2f} MB)")
    print(f">>> EXPORT SUCCESS: {pdf_pages} PAGES GENERATED IN BOTH DOCX AND PDF! <<<")
    return word_pages, pdf_pages

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    generate_report("dacn.docx", font_size_pt=13.0, line_spacing=1.52, space_after_pt=6.0)
    export_to_pdf_and_verify("dacn.docx", "BaoCaoDoAn.pdf")
