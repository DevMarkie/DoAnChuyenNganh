import docx
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_TAB_ALIGNMENT, WD_TAB_LEADER
import os
import win32com.client
import pypdf

# Test script for TOC with tab stops, bookmarks, and hyperlinks
doc = docx.Document()
section = doc.sections[0]
section.page_width = Cm(21.59)
section.left_margin = Cm(3.5)
section.right_margin = Cm(2.0)
usable_width = section.page_width - section.left_margin - section.right_margin

def add_bookmark(paragraph, bookmark_name, bookmark_id):
    tag = paragraph._p
    bm_start = parse_xml(f'<w:bookmarkStart {nsdecls("w")} w:id="{bookmark_id}" w:name="{bookmark_name}"/>')
    bm_end = parse_xml(f'<w:bookmarkEnd {nsdecls("w")} w:id="{bookmark_id}"/>')
    tag.insert(0, bm_start)
    tag.append(bm_end)

def add_hyperlink_with_tab(paragraph, anchor_name, text, page_str, is_bold=False):
    # Setup tab stop on paragraph
    p_format = paragraph.paragraph_format
    p_format.tab_stops.add_tab_stop(usable_width, WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)
    
    # Create hyperlink element
    hyperlink = parse_xml(f'<w:hyperlink {nsdecls("w")} w:anchor="{anchor_name}" w:history="1"/>')
    
    # Run for title
    r1 = parse_xml(f'<w:r {nsdecls("w")}><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="{23 if is_bold else 22}"/><w:b w:val="{"1" if is_bold else "0"}"/></w:rPr><w:t>{text}</w:t></w:r>')
    
    # Run for tab
    r_tab = parse_xml(f'<w:r {nsdecls("w")}><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="20"/><w:color w:val="B4B4B4"/></w:rPr><w:tab/></w:r>')
    
    # Run for page
    r2 = parse_xml(f'<w:r {nsdecls("w")}><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="22"/><w:b w:val="{"1" if is_bold else "0"}"/></w:rPr><w:t>{page_str}</w:t></w:r>')
    
    hyperlink.append(r1)
    hyperlink.append(r_tab)
    hyperlink.append(r2)
    paragraph._p.append(hyperlink)

# Page 1: TOC
p_title = doc.add_paragraph("MỤC LỤC")
p1 = doc.add_paragraph()
add_hyperlink_with_tab(p1, "bm_ch1", "CHƯƠNG 1. GIỚI THIỆU VÀ ĐẶT VẤN ĐỀ", "2", True)
p2 = doc.add_paragraph()
add_hyperlink_with_tab(p2, "bm_sec11", "  1.1. Bối cảnh chuyển đổi số giáo dục", "2", False)

# Page 2: Target
doc.add_page_break()
p_h1 = doc.add_paragraph("CHƯƠNG 1. GIỚI THIỆU VÀ ĐẶT VẤN ĐỀ", style='Heading 1')
add_bookmark(p_h1, "bm_ch1", 1)

p_h2 = doc.add_paragraph("1.1. Bối cảnh chuyển đổi số giáo dục", style='Heading 2')
add_bookmark(p_h2, "bm_sec11", 2)

doc.save("test_toc.docx")
print("Saved test_toc.docx")

# Export to PDF via Word COM and test links
word = win32com.client.Dispatch('Word.Application')
word.Visible = False
try:
    wdoc = word.Documents.Open(os.path.abspath("test_toc.docx"))
    wdoc.SaveAs2(os.path.abspath("test_toc.pdf"), FileFormat=17)
    wdoc.Close(False)
finally:
    word.Quit()

# Check PDF annotations/links with pypdf
reader = pypdf.PdfReader("test_toc.pdf")
print("Total PDF pages:", len(reader.pages))
p0 = reader.pages[0]
if "/Annots" in p0:
    annots = p0["/Annots"]
    print("Page 1 Annotations count:", len(annots))
    for a in annots:
        obj = a.get_object()
        print("  Annot Subtype:", obj.get("/Subtype"), "Dest:", obj.get("/Dest"), "A:", obj.get("/A"))
else:
    print("No annotations found on Page 1")
