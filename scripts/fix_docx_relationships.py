# -*- coding: utf-8 -*-
"""
scripts/fix_docx_relationships.py
Sửa xung đột quan hệ (Relationship ID Clash) trong BaoCaoDoAn_ChinhSua_HoanThien.docx
và BaoCaoDoAn_DaParaphrase_ChongDaoVan.docx:
1. rId135: header1.xml (trước đó bị ghi đè bởi image129.png)
2. rId136: footer1.xml (trước đó bị ghi đè bởi image130.png)
3. rId137: fontTable.xml (trước đó bị ghi đè bởi image131.png)
4. rId138: theme/theme1.xml (trước đó bị ghi đè bởi image132.png)
Cấp phát rId mới cho 4 ảnh: rId161, rId162, rId163, rId164
Cập nhật trong document.xml cho các thẻ <a:blip r:embed="..."> tương ứng.
"""

import sys
import io
import os
import zipfile
import re
import xml.etree.ElementTree as ET
import win32com.client

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def fix_document(docx_path):
    print(f"\n--- Sửa chữa xung đột quan hệ trong: {docx_path} ---")
    with zipfile.ZipFile(docx_path, "r") as z:
        doc_xml = z.read("word/document.xml").decode("utf-8")
        rels_xml = z.read("word/_rels/document.xml.rels").decode("utf-8")
        all_items = {info.filename: z.read(info.filename) for info in z.infolist()}

    # 1. Trong rels_xml, tìm xem rId135 - rId138 đang trỏ tới ảnh nào
    img_map = {
        'rId135': 'rId161',
        'rId136': 'rId162',
        'rId137': 'rId163',
        'rId138': 'rId164'
    }

    # Đọc rels root
    w_rel_ns = "http://schemas.openxmlformats.org/package/2006/relationships"
    rels_root = ET.fromstring(rels_xml.encode('utf-8'))

    # Cập nhật ID của 4 ảnh thành rId161 - rId164
    for rel in rels_root.findall(f"{{{w_rel_ns}}}Relationship"):
        rid = rel.attrib.get('Id')
        if rid in img_map and 'image' in rel.attrib.get('Type', ''):
            new_id = img_map[rid]
            rel.attrib['Id'] = new_id
            print(f"  Chuyển ảnh {rid} -> {new_id} ({rel.attrib.get('Target')})")

    # Bổ sung 4 quan hệ hệ thống chuẩn cho header, footer, fontTable, theme
    def add_rel(rid, rel_type, target):
        elem = ET.SubElement(rels_root, f"{{{w_rel_ns}}}Relationship")
        elem.attrib['Id'] = rid
        elem.attrib['Type'] = rel_type
        elem.attrib['Target'] = target
        print(f"  Khôi phục quan hệ chuẩn: {rid} -> {target}")

    add_rel('rId135', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/header', 'header1.xml')
    add_rel('rId136', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer', 'footer1.xml')
    add_rel('rId137', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable', 'fontTable.xml')
    add_rel('rId138', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme', 'theme/theme1.xml')

    new_rels_xml = ET.tostring(rels_root, encoding='utf-8')

    # 2. Cập nhật trong document.xml:
    # CHỈ thay thế rId135 - rId138 khi nó nằm trong r:embed="rId135" (ảnh blip),
    # KHÔNG thay thế headerReference hay footerReference!
    for old_id, new_id in img_map.items():
        doc_xml = doc_xml.replace(f'embed="{old_id}"', f'embed="{new_id}"')
        doc_xml = doc_xml.replace(f'r:embed="{old_id}"', f'r:embed="{new_id}"')

    # Ghi lại tệp zip
    temp_path = docx_path + ".temp"
    with zipfile.ZipFile(temp_path, "w", zipfile.ZIP_DEFLATED) as zout:
        for filename, data in all_items.items():
            if filename == "word/document.xml":
                zout.writestr(filename, doc_xml.encode('utf-8'))
            elif filename == "word/_rels/document.xml.rels":
                zout.writestr(filename, new_rels_xml)
            else:
                zout.writestr(filename, data)

    if os.path.exists(docx_path):
        os.remove(docx_path)
    os.rename(temp_path, docx_path)
    print(f"  -> Đã lưu tệp đã sửa: {docx_path}")

if __name__ == "__main__":
    for p in ["BaoCaoDoAn_ChinhSua_HoanThien.docx", "BaoCaoDoAn_DaParaphrase_ChongDaoVan.docx"]:
        if os.path.exists(p):
            fix_document(p)

    print("\nKiểm tra mở lại bằng Microsoft Word COM...")
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    word.DisplayAlerts = 0
    for p in ["BaoCaoDoAn_ChinhSua_HoanThien.docx", "BaoCaoDoAn_DaParaphrase_ChongDaoVan.docx"]:
        try:
            doc = word.Documents.Open(os.path.abspath(p))
            print(f"SUCCESS OPENING {p}! Paras: {doc.Paragraphs.Count}, Tables: {doc.Tables.Count}")
            doc.Close(False)
        except Exception as e:
            print(f"FAILED {p} -> {e}")
    word.Quit()
