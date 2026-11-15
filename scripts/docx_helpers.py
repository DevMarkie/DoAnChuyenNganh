# -*- coding: utf-8 -*-
"""
Generator for Bao Cao Do An Chuyen Nganh - SMS Phenikaa (Target: 70 pages)
"""
import os
import sys
import re
import html
import docx
from docx.shared import Inches, Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

_BOOKMARK_ID_COUNTER = 1000

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, color="D3D3D3"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="6" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="single" w:sz="6" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def add_page_number_to_section(section):
    footer = section.footer
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run()
    run.font.name = 'Times New Roman'
    run.font.size = Pt(11)
    run.font.color.rgb = RGBColor(120, 120, 120)
    
    fldChar1 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls('w'))
    instrText = parse_xml(r'<w:instrText %s xml:space="preserve"> PAGE </w:instrText>' % nsdecls('w'))
    fldChar2 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls('w'))
    fldChar3 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls('w'))
    run._r.append(fldChar1)
    run._r.append(instrText)
    run._r.append(fldChar2)
    run._r.append(fldChar3)

def add_bookmark(paragraph, bookmark_name, bookmark_id=None):
    global _BOOKMARK_ID_COUNTER
    if bookmark_id is None:
        _BOOKMARK_ID_COUNTER += 1
        bookmark_id = _BOOKMARK_ID_COUNTER
    bm_esc = html.escape(str(bookmark_name))
    tag = paragraph._p
    bm_start = parse_xml(f'<w:bookmarkStart {nsdecls("w")} w:id="{bookmark_id}" w:name="{bm_esc}"/>')
    bm_end = parse_xml(f'<w:bookmarkEnd {nsdecls("w")} w:id="{bookmark_id}"/>')
    tag.insert(0, bm_start)
    tag.append(bm_end)

def heading_to_bm(text):
    text = text.strip()
    if text.startswith('CHƯƠNG'):
        m = re.match(r'CHƯƠNG\s+(\d+)', text)
        return f'bm_ch{m.group(1)}' if m else 'bm_ch'
    if 'TÀI LIỆU THAM KHẢO' in text:
        return 'bm_ref'
    m = re.match(r'(\d+(?:\.\d+)+)', text)
    if m:
        nums = m.group(1).replace('.', '_')
        return f'bm_sec_{nums}'
    clean = re.sub(r'[^a-zA-Z0-9]', '', text)
    return f'bm_{clean[:20]}'

def toc_title_to_bm(title):
    t = title.strip()
    if 'TIMELINE' in t: return 'bm_timeline'
    if 'LỜI CAM ĐOAN' in t: return 'bm_camdoan'
    if 'DANH MỤC BẢNG BIỂU' in t: return 'bm_tbl_list'
    if 'DANH MỤC HÌNH ẢNH' in t: return 'bm_fig_list'
    if 'TÀI LIỆU THAM KHẢO' in t: return 'bm_ref'
    if t.startswith('CHƯƠNG'):
        m = re.match(r'CHƯƠNG\s+(\d+)', t)
        return f'bm_ch{m.group(1)}'
    m = re.match(r'(\d+(?:\.\d+)+)', t)
    if m:
        nums = m.group(1).replace('.', '_')
        return f'bm_sec_{nums}'
    clean = re.sub(r'[^a-zA-Z0-9]', '', t)
    return f'bm_{clean[:20]}'

def add_toc_hyperlink(doc, title, page_str, anchor_name, is_bold=False, is_chapter=False, usable_width=Cm(16.09)):
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.space_before = Pt(3 if is_bold else 0)
    p.paragraph_format.tab_stops.add_tab_stop(usable_width, WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)
    
    font_color_hex = "102C57" if (is_bold and is_chapter) else "000000"
    sz_val = "23" if is_bold else "22"
    bold_val = "1" if is_bold else "0"
    
    t_esc = html.escape(str(title))
    p_esc = html.escape(str(page_str))
    a_esc = html.escape(str(anchor_name))
    
    hyperlink = parse_xml(f'<w:hyperlink {nsdecls("w")} w:anchor="{a_esc}" w:history="1"/>')
    r_txt = parse_xml(f'<w:r {nsdecls("w")}><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="{sz_val}"/><w:b w:val="{bold_val}"/><w:color w:val="{font_color_hex}"/></w:rPr><w:t xml:space="preserve">{t_esc}</w:t></w:r>')
    r_tab = parse_xml(f'<w:r {nsdecls("w")}><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="20"/><w:color w:val="B4B4B4"/></w:rPr><w:tab/></w:r>')
    r_pg = parse_xml(f'<w:r {nsdecls("w")}><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="{sz_val}"/><w:b w:val="{bold_val}"/><w:color w:val="{font_color_hex}"/></w:rPr><w:t>{p_esc}</w:t></w:r>')
    
    hyperlink.append(r_txt)
    hyperlink.append(r_tab)
    hyperlink.append(r_pg)
    p._p.append(hyperlink)
    return p

def add_list_hyperlink(doc, title, page_str, anchor_name, usable_width=Cm(16.09)):
    p_item = doc.add_paragraph()
    p_item.paragraph_format.line_spacing = 1.10
    p_item.paragraph_format.space_after = Pt(1.0)
    p_item.paragraph_format.tab_stops.add_tab_stop(usable_width, WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)
    
    t_esc = html.escape(str(title))
    p_esc = html.escape(str(page_str))
    a_esc = html.escape(str(anchor_name))
    
    hyperlink = parse_xml(f'<w:hyperlink {nsdecls("w")} w:anchor="{a_esc}" w:history="1"/>')
    r_txt = parse_xml(f'<w:r {nsdecls("w")}><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve"> • {t_esc} </w:t></w:r>')
    r_tab = parse_xml(f'<w:r {nsdecls("w")}><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="18"/><w:color w:val="B4B4B4"/></w:rPr><w:tab/></w:r>')
    r_pg = parse_xml(f'<w:r {nsdecls("w")}><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="18"/><w:b w:val="1"/></w:rPr><w:t>{p_esc}</w:t></w:r>')
    
    hyperlink.append(r_txt)
    hyperlink.append(r_tab)
    hyperlink.append(r_pg)
    p_item._p.append(hyperlink)
    return p_item

print("Helper functions defined.")
