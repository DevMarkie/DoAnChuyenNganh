# -*- coding: utf-8 -*-
import docx
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

def toc_title_to_bm(title):
    t = title.strip()
    if 'TIMELINE' in t:
        return 'bm_timeline'
    if 'LỜI CAM ĐOAN' in t:
        return 'bm_camdoan'
    if 'DANH MỤC BẢNG BIỂU' in t:
        return 'bm_tbl_list'
    if 'DANH MỤC HÌNH ẢNH' in t:
        return 'bm_fig_list'
    if 'TÀI LIỆU THAM KHẢO' in t:
        return 'bm_ref'
    if t.startswith('CHƯƠNG'):
        m = re.match(r'CHƯƠNG\s+(\d+)', t)
        return f'bm_ch{m.group(1)}'
    m = re.match(r'(\d+(?:\.\d+)+)', t)
    if m:
        nums = m.group(1).replace('.', '_')
        return f'bm_sec_{nums}'
    clean = re.sub(r'[^a-zA-Z0-9]', '', t)
    return f'bm_{clean[:20]}'

def heading_to_bm(text):
    text = text.strip()
    if text.startswith('CHƯƠNG'):
        m = re.match(r'CHƯƠNG\s+(\d+)', text)
        if m:
            return f'bm_ch{m.group(1)}'
        return 'bm_ch'
    if 'TÀI LIỆU THAM KHẢO' in text:
        return 'bm_ref'
    m = re.match(r'(\d+(?:\.\d+)+)', text)
    if m:
        nums = m.group(1).replace('.', '_')
        return f'bm_sec_{nums}'
    clean = re.sub(r'[^a-zA-Z0-9]', '', text)
    return f'bm_{clean[:20]}'

with open('scripts/report_content_frontmatter.py', 'r', encoding='utf-8') as f:
    text = f.read()

start = text.find('toc_entries = [')
end = text.find(']', start)
lines = [l.strip() for l in text[start:end+1].split('\n') if '(' in l and ')' in l]
toc_titles = [re.search(r'\("([^"]+)"', l).group(1) for l in lines]
print(f'Total TOC titles: {len(toc_titles)}')

doc = docx.Document('dacn.docx')
doc_headings = [p.text for p in doc.paragraphs if p.style.name.startswith('Heading')]
doc_bms = set(heading_to_bm(h) for h in doc_headings)
doc_bms.add('bm_timeline')
doc_bms.add('bm_camdoan')
doc_bms.add('bm_tbl_list')
doc_bms.add('bm_fig_list')

missing = []
for tt in toc_titles:
    bm = toc_title_to_bm(tt)
    if bm not in doc_bms:
        missing.append((tt, bm))

print(f'Missing bookmarks: {len(missing)}')
for m in missing:
    print('  Missing:', m)
