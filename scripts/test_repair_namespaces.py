# -*- coding: utf-8 -*-
import sys
import io
import os
import zipfile
import re
import win32com.client

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Root tag from original good document
GOOD_ROOT_TAG = (
    '<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" '
    'xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" '
    'xmlns:cx1="http://schemas.microsoft.com/office/drawing/2015/9/8/chartex" '
    'xmlns:cx2="http://schemas.microsoft.com/office/drawing/2015/10/21/chartex" '
    'xmlns:cx3="http://schemas.microsoft.com/office/drawing/2016/5/9/chartex" '
    'xmlns:cx4="http://schemas.microsoft.com/office/drawing/2016/5/10/chartex" '
    'xmlns:cx5="http://schemas.microsoft.com/office/drawing/2016/5/11/chartex" '
    'xmlns:cx6="http://schemas.microsoft.com/office/drawing/2016/5/12/chartex" '
    'xmlns:cx7="http://schemas.microsoft.com/office/drawing/2016/5/13/chartex" '
    'xmlns:cx8="http://schemas.microsoft.com/office/drawing/2016/5/14/chartex" '
    'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" '
    'xmlns:aink="http://schemas.microsoft.com/office/drawing/2016/ink" '
    'xmlns:am3d="http://schemas.microsoft.com/office/drawing/2017/model3d" '
    'xmlns:o="urn:schemas-microsoft-com:office:office" '
    'xmlns:oel="http://schemas.microsoft.com/office/2019/extlst" '
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
    'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" '
    'xmlns:v="urn:schemas-microsoft-com:vml" '
    'xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" '
    'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
    'xmlns:w10="urn:schemas-microsoft-com:office:word" '
    'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
    'xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" '
    'xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" '
    'xmlns:w16cex="http://schemas.microsoft.com/office/word/2018/wordml/cex" '
    'xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid" '
    'xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml" '
    'xmlns:w16du="http://schemas.microsoft.com/office/word/2023/wordml/word16du" '
    'xmlns:w16sdtdh="http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash" '
    'xmlns:w16sdtfl="http://schemas.microsoft.com/office/word/2024/wordml/sdtformatlock" '
    'xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex" '
    'xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" '
    'xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" '
    'xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" '
    'xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" '
    'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
    'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" '
    'mc:Ignorable="w14 w15 w16se w16cid w16 w16cex w16sdtdh w16sdtfl w16du wp14">'
)

def repair_docx_xml(in_path, out_path):
    print(f"Repairing: {in_path} -> {out_path}")
    with zipfile.ZipFile(in_path, "r") as zin:
        all_items = {info.filename: zin.read(info.filename) for info in zin.infolist()}

    # 1. Repair document.xml
    doc_str = all_items['word/document.xml'].decode('utf-8')
    
    # Replace root tag
    doc_str = re.sub(r'<ns0:document[^>]+>', GOOD_ROOT_TAG, doc_str, count=1)
    doc_str = re.sub(r'</ns0:document>', '</w:document>', doc_str, count=1)
    
    # Replace prefixes in tags and attributes
    # ns0 -> w
    # ns1 -> mc
    # ns2 -> w14
    # ns3 -> wp
    # ns4 -> wp14
    # ns5 -> a
    # ns6 -> pic
    # ns7 -> r
    prefix_map = [
        ('ns0:', 'w:'),
        ('ns1:', 'mc:'),
        ('ns2:', 'w14:'),
        ('ns3:', 'wp:'),
        ('ns4:', 'wp14:'),
        ('ns5:', 'a:'),
        ('ns6:', 'pic:'),
        ('ns7:', 'r:'),
    ]
    for old_p, new_p in prefix_map:
        doc_str = doc_str.replace(f'<{old_p}', f'<{new_p}')
        doc_str = doc_str.replace(f'</{old_p}', f'</{new_p}')
        doc_str = doc_str.replace(f' {old_p}', f' {new_p}')

    # 2. Repair word/_rels/document.xml.rels
    rels_str = all_items['word/_rels/document.xml.rels'].decode('utf-8')
    # If it starts with <ns0:Relationships ...>, clean it
    rels_clean = re.sub(r'<ns0:Relationships[^>]+>', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">', rels_str)
    rels_clean = rels_clean.replace('</ns0:Relationships>', '</Relationships>')
    rels_clean = rels_clean.replace('<ns0:Relationship ', '<Relationship ')
    rels_clean = rels_clean.replace('</ns0:Relationship>', '</Relationship>')
    if not rels_clean.startswith('<?xml'):
        rels_clean = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + rels_clean

    # Write out
    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as zout:
        for fname, data in all_items.items():
            if fname == 'word/document.xml':
                zout.writestr(fname, doc_str.encode('utf-8'))
            elif fname == 'word/_rels/document.xml.rels':
                zout.writestr(fname, rels_clean.encode('utf-8'))
            else:
                zout.writestr(fname, data)
    print(f"Successfully wrote {out_path}!")

repair_docx_xml("BaoCaoDoAn_ChinhSua_HoanThien.docx", "test_perfect_ns.docx")

# Test opening with Word COM
print("Testing Word COM on test_perfect_ns.docx...")
word = win32com.client.Dispatch("Word.Application")
word.Visible = False
word.DisplayAlerts = 0
try:
    doc = word.Documents.Open(os.path.abspath("test_perfect_ns.docx"))
    print(">>> SUCCESS! WORD OPENED test_perfect_ns.docx! <<<")
    print(f"Paragraphs: {doc.Paragraphs.Count}, Tables: {doc.Tables.Count}")
    doc.Close(False)
except Exception as e:
    print("FAILED ->", e)
finally:
    word.Quit()
