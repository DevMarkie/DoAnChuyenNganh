# -*- coding: utf-8 -*-
import docx

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')

# Check xml body children around paragraph 1030
body = doc._body._element
p1030 = doc.paragraphs[1030]._element

# Find index of p1030 in body
p1030_idx = body.index(p1030)
print(f"Index of p1030 in body._element: {p1030_idx}")

# Print next 5 elements in body
for offset in range(-2, 8):
    elem = body[p1030_idx + offset]
    tag = elem.tag.split('}')[-1]
    if tag == 'p':
        text = elem.text or "".join(elem.itertext())
        print(f"  [{offset}] <w:p>: {text[:80]}")
    elif tag == 'tbl':
        # print table row count
        rows = elem.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tr')
        print(f"  [{offset}] <w:tbl> with {len(rows)} rows")
    else:
        print(f"  [{offset}] <{tag}>")

