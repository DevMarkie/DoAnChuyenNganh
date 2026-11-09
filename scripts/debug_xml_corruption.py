# -*- coding: utf-8 -*-
import zipfile
import re

with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as z:
    doc_xml = z.read("word/document.xml").decode("utf-8")

print(f"Document.xml size: {len(doc_xml)} chars")

# Check for unclosed tags or common corruptions in OpenXML
# 1. Check for mismatched tags in table rows
tbls = re.findall(r'<w:tbl[\s>].*?</w:tbl>', doc_xml)
print(f"Found {len(tbls)} tables")

# Check if any table is nested inside another table incorrectly
# 2. Check for empty run tags or malformed w:r
malformed_r = re.findall(r'<w:r[^>]*>(?:(?!</w:r>).)*$', doc_xml)
print(f"Malformed runs: {len(malformed_r)}")

# 3. Check for any w:fldSimple or field codes
fields = re.findall(r'<w:fldSimple[^>]*>.*?</w:fldSimple>', doc_xml)
print(f"Found {len(fields)} fldSimple tags")
for f in fields[:5]:
    print("  ", f[:80])

# 4. Check for invalid characters in XML (like control characters 0x00 - 0x1F except \t, \n, \r)
invalid_chars = []
for idx, ch in enumerate(doc_xml):
    cp = ord(ch)
    if (cp < 0x20 and ch not in ('\t', '\n', '\r')) or (0xD800 <= cp <= 0xDFFF) or cp in (0xFFFE, 0xFFFF):
        invalid_chars.append((idx, hex(cp)))
print(f"Invalid XML control chars: {len(invalid_chars)}")
if invalid_chars:
    print(invalid_chars[:10])
