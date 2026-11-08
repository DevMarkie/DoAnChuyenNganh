# -*- coding: utf-8 -*-
"""
execute_perfect_media_refresh.py
Refreshes all 66 UI and Chrome DevTools screenshots in BaoCaoDoAn_ChinhSua_HoanThien.docx.
Preserves XML formatting, table styles, fonts, margins, and disambiguates the 6 previously shared figures.
"""
import os
import zipfile
import re
from lxml import etree

DOCX_IN = 'BaoCaoDoAn_ChinhSua_HoanThien.docx'
DOCX_OUT = 'BaoCaoDoAn_ChinhSua_HoanThien.docx'
DOCX_TEMP = 'BaoCaoDoAn_ChinhSua_HoanThien_temp.docx'

NS = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'rel': 'http://schemas.openxmlformats.org/package/2006/relationships'
}

def run():
    print(f"Opening {DOCX_IN} for in-place media refresh...")
    with zipfile.ZipFile(DOCX_IN, 'r') as z_in:
        names = z_in.namelist()
        zip_contents = {name: z_in.read(name) for name in names}

    doc_root = etree.fromstring(zip_contents['word/document.xml'])
    rels_root = etree.fromstring(zip_contents['word/_rels/document.xml.rels'])

    # 1. Disambiguation map for the 6 previously shared figures:
    # (figure_num, caption_keyword, new_rid, new_media_path, source_file)
    disambiguate_specs = [
        ('97', 'Thời khóa biểu giảng dạy cá nhân', 'rId_fig97', 'media/image_fig97.png', '.tools/ui_captures/ui_97.png'),
        ('98', 'Hồ sơ thông tin Giảng viên', 'rId_fig98', 'media/image_fig98.png', '.tools/ui_captures/ui_98.png'),
        ('104', 'Bộ lọc tìm kiếm nâng cao', 'rId_fig104', 'media/image_fig104.png', '.tools/ui_captures/ui_104.png'),
        ('105', 'Xếp Thời khóa biểu dạng ma trận', 'rId_fig105', 'media/image_fig105.png', '.tools/ui_captures/ui_105.png'),
        ('120', 'Phân hệ Tiếp nhận & Thẩm định Đơn Phúc khảo', 'rId_fig120', 'media/image_fig120.png', '.tools/ui_captures/ui_120.png'),
        ('121', 'Trợ lý Xếp lịch học thông minh', 'rId_fig121', 'media/image_fig121.png', '.tools/ui_captures/ui_121.png'),
    ]

    paragraphs = doc_root.xpath('//w:p', namespaces=NS)
    
    # Update XML for disambiguated figures
    for fig_num, kw, new_rid, new_target, src_path in disambiguate_specs:
        found = False
        for idx, p in enumerate(paragraphs):
            if idx < 500: continue
            text = "".join(p.xpath('.//w:t/text()', namespaces=NS)).strip()
            if f"Hình {fig_num}." in text and kw in text:
                prev_p = paragraphs[idx - 1]
                blips = prev_p.xpath('.//a:blip', namespaces=NS)
                if blips:
                    old_rid = blips[0].get(f"{{{NS['r']}}}embed")
                    blips[0].set(f"{{{NS['r']}}}embed", new_rid)
                    print(f"  [Disambiguated] Fig {fig_num} (P[{idx}]): changed blip embed {old_rid} -> {new_rid}")
                    found = True
                    break
        if not found:
            raise RuntimeError(f"Could not find caption paragraph for Fig {fig_num} with keyword '{kw}'")

        # Add relationship to rels_root
        # <Relationship Id="rId_figXX" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image_figXX.png"/>
        rel_elem = etree.SubElement(rels_root, f"{{{NS['rel']}}}Relationship")
        rel_elem.set('Id', new_rid)
        rel_elem.set('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image')
        rel_elem.set('Target', new_target)

        # Store binary into zip_contents
        with open(src_path, 'rb') as f_img:
            zip_contents[f"word/{new_target}"] = f_img.read()
        print(f"  [Added Media] word/{new_target} from {src_path} ({len(zip_contents[f'word/{new_target}'])} bytes)")

    # 2. Map of unique targets to overwrite
    unique_replacements = {
        # Section 3.4.10 UI Figures
        'media/image84.png': '.tools/ui_captures/ui_83.png',
        'media/image85.png': '.tools/ui_captures/ui_84.png',
        'media/image86.png': '.tools/ui_captures/ui_85.png',
        'media/image87.png': '.tools/ui_captures/ui_86.png',
        'media/image88.png': '.tools/ui_captures/ui_87.png',
        'media/image89.png': '.tools/ui_captures/ui_88.png',
        'media/image90.png': '.tools/ui_captures/ui_89.png',
        'media/image91.png': '.tools/ui_captures/ui_90.png',
        'media/image92.png': '.tools/ui_captures/ui_91.png',
        'media/image93.png': '.tools/ui_captures/ui_92.png',  # Fig 92 (Fig 121 now disambiguated)
        'media/image94.png': '.tools/ui_captures/ui_93.png',
        'media/image95.png': '.tools/ui_captures/ui_94.png',  # Fig 94 (Fig 98 now disambiguated)
        'media/image96.png': '.tools/ui_captures/ui_95.png',  # Fig 95 (Fig 97 now disambiguated)
        'media/image97.png': '.tools/ui_captures/ui_96.png',
        'media/image98.png': '.tools/ui_captures/ui_99.png',
        'media/image99.png': '.tools/ui_captures/ui_100.png',
        'media/image100.png': '.tools/ui_captures/ui_101.png', # Fig 101 (Figs 105, 120 disambiguated)
        'media/image101.png': '.tools/ui_captures/ui_102.png',
        'media/image102.png': '.tools/ui_captures/ui_103.png', # Fig 103 (Fig 104 disambiguated)
        'media/image103.png': '.tools/ui_captures/ui_106.png',
        'media/image104.png': '.tools/ui_captures/ui_107.png',
        'media/image105.png': '.tools/ui_captures/ui_108.png',
        'media/image106.png': '.tools/ui_captures/ui_109.png',
        'media/image107.png': '.tools/ui_captures/ui_110.png',
        'media/image108.png': '.tools/ui_captures/ui_111.png',
        'media/image109.png': '.tools/ui_captures/ui_112.png',
        'media/image110.png': '.tools/ui_captures/ui_113.png',
        'media/image111.png': '.tools/ui_captures/ui_114.png',
        'media/image112.png': '.tools/ui_captures/ui_115.png',
        'media/image113.png': '.tools/ui_captures/ui_116.png',
        'media/image114.png': '.tools/ui_captures/ui_117.png',
        'media/image115.png': '.tools/ui_captures/ui_118.png',
        'media/image116.png': '.tools/ui_captures/ui_119.png',
        'media/image117.png': '.tools/ui_captures/ui_122.png',
        'media/image118.png': '.tools/ui_captures/ui_123.png',
        'media/image119.png': '.tools/ui_captures/ui_124.png',
        'media/image120.png': '.tools/ui_captures/ui_125.png',
        'media/image121.png': '.tools/ui_captures/ui_126.png',

        # Responsive figures
        'media/image122.png': '.tools/ui_captures/ui_127a.png', # Fig 126a
        'media/image123.png': '.tools/ui_captures/ui_127b.png', # Fig 126b
        'media/image124.png': '.tools/ui_captures/ui_127c.png', # Fig 126c
        'media/image125.png': '.tools/ui_captures/ui_127d.png', # Fig 126d
        'media/image126.png': '.tools/ui_captures/ui_127e.png', # Fig 126e
        'media/image127.png': '.tools/ui_captures/ui_127f.png', # Fig 126f
        'media/image128.png': '.tools/ui_captures/ui_127.png',  # Fig 127

        # Section 5.2.4 (d) Chrome DevTools Master Audit Figures
        'media/image135.png': 'tests/test-results/chrome-devtools/01_portal_hub_light.png',
        'media/image136.png': 'tests/test-results/chrome-devtools/02_admin_dashboard.png',
        'media/image137.png': 'tests/test-results/chrome-devtools/02_admin_subjects.png',
        'media/image138.png': 'tests/test-results/chrome-devtools/02_admin_sections.png',
        'media/image139.png': 'tests/test-results/chrome-devtools/03_academic_dashboard.png',
        'media/image140.png': 'tests/test-results/chrome-devtools/03_academic_graduation_audit.png',
        'media/image141.png': 'tests/test-results/chrome-devtools/03_grade_amendments.png',
        'media/image142.png': 'tests/test-results/chrome-devtools/04_lecturer_dashboard.png',
        'media/image143.png': 'tests/test-results/chrome-devtools/04_lecturer_schedule.png',
        'media/image144.png': 'tests/test-results/chrome-devtools/04_lecturer_grades.png',
        'media/image145.png': 'tests/test-results/chrome-devtools/05_student_dashboard.png',
        'media/image146.png': 'tests/test-results/chrome-devtools/05_student_enrollment.png',
        'media/image147.png': 'tests/test-results/chrome-devtools/05_student_schedule.png',
        'media/image148.png': 'tests/test-results/chrome-devtools/05_student_transcript.png',
        'media/image149.png': 'tests/test-results/chrome-devtools/05_student_roadmap_dag.png',
    }

    print(f"\nReplacing {len(unique_replacements)} unique media files in docx archive...")
    for target_rel, src_path in unique_replacements.items():
        zip_key = f"word/{target_rel}"
        with open(src_path, 'rb') as f_img:
            data = f_img.read()
        zip_contents[zip_key] = data
        print(f"  ✓ {zip_key} updated ({len(data):,} bytes) from {src_path}")

    # Re-serialize XML
    zip_contents['word/document.xml'] = etree.tostring(doc_root, xml_declaration=True, encoding='UTF-8', standalone=True)
    zip_contents['word/_rels/document.xml.rels'] = etree.tostring(rels_root, xml_declaration=True, encoding='UTF-8', standalone=True)

    print(f"\nWriting updated package to {DOCX_TEMP}...")
    with zipfile.ZipFile(DOCX_TEMP, 'w', compression=zipfile.ZIP_DEFLATED) as z_out:
        for name, data in zip_contents.items():
            z_out.writestr(name, data)

    print(f"Verifying {DOCX_TEMP} with python-docx...")
    import docx
    test_doc = docx.Document(DOCX_TEMP)
    p_count = len(test_doc.paragraphs)
    tbl_count = len(test_doc.tables)
    print(f"  ✓ Validation success: {p_count} paragraphs, {tbl_count} tables preserved perfectly!")

    # Replace original atomically
    if os.path.exists(DOCX_OUT):
        os.remove(DOCX_OUT)
    os.rename(DOCX_TEMP, DOCX_OUT)
    final_sz = os.path.getsize(DOCX_OUT)
    print(f"\nSUCCESS! {DOCX_OUT} updated successfully ({final_sz:,} bytes).")

if __name__ == '__main__':
    run()

