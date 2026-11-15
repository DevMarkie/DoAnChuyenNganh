# -*- coding: utf-8 -*-
import fitz
import sys
import re
import os

sys.path.append(os.path.abspath('scripts'))
sys.stdout.reconfigure(encoding='utf-8')

doc = fitz.open('BaoCaoDoAn.pdf')
print('Total pages in BaoCaoDoAn.pdf:', len(doc))

with open('scripts/report_content_frontmatter.py', 'r', encoding='utf-8') as f:
    content = f.read()

def replace_toc_page(match):
    prefix = match.group(1)
    title = match.group(2)
    old_page = int(match.group(3))
    suffix = match.group(4)
    if 'CHƯƠNG 1' in title or title.strip().startswith('1.'):
        if '1.1' in title:
            new_page = 8
        elif '1.2' in title:
            new_page = 8
        elif '1.3' in title:
            new_page = 9
        else:
            new_page = 10
    elif 'CHƯƠNG 2' in title or title.strip().startswith('2.'):
        if 'CHƯƠNG 2' in title or '2.1' in title or '2.2' in title:
            new_page = 11
        elif '2.3' in title or '2.4' in title or '2.5' in title:
            new_page = 12
        else:
            new_page = 13
    elif old_page >= 16:
        new_page = old_page - 2
    else:
        new_page = old_page
    return f'{prefix}("{title}", "{new_page}", {suffix}'

new_content = re.sub(r'(\s*)\("([^"]+)",\s*"(\d+)",\s*(True|False\))', replace_toc_page, content)

def replace_tbl_page(match):
    prefix = match.group(1)
    title = match.group(2)
    old_page = int(match.group(3))
    if 'Bảng 1.' in title:
        new_page = 2
    elif 'Bảng 2.' in title or 'Bảng 3.' in title:
        new_page = 8
    elif 'Bảng 4.' in title or 'Bảng 5.' in title:
        new_page = 9
    elif 'Bảng 6.' in title or 'Bảng 7.' in title:
        new_page = 11
    elif 'Bảng 8.' in title:
        new_page = 12
    elif old_page >= 16:
        new_page = old_page - 2
    else:
        new_page = old_page
    return f'{prefix}("{title}", "{new_page}")'

new_content = re.sub(r'(\s*)\("([^"]+)",\s*"(\d+)"\)', replace_tbl_page, new_content)

def replace_fig_page(match):
    prefix = match.group(1)
    title = match.group(2)
    old_page = int(match.group(3))
    if old_page >= 16:
        new_page = old_page - 2
    else:
        new_page = old_page
    return f'{prefix}("{title}", "{new_page}")'

new_content = re.sub(r'(\s*)\("(Hình\s+\d+\.[^"]+)",\s*"(\d+)"\)', replace_fig_page, new_content)

with open('scripts/report_content_frontmatter.py', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Updated report_content_frontmatter.py successfully!')
