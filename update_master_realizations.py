# -*- coding: utf-8 -*-
"""
Update master file HienThucHoa_UseCase_Realizations.drawio to have dedicated tabs for each sequence diagram!
"""
import xml.etree.ElementTree as ET
import xml.dom.minidom as minidom
import os

from build_clean_sequence_diagrams import (
    build_seq_diagram_enrollment,
    build_seq_diagram_grading,
    build_seq_diagram_auth
)
from build_realization_diagrams import (
    build_diagram_2_activity,
    build_diagram_3_bce
)

def main():
    os.makedirs('docs', exist_ok=True)

    master_file = ET.Element('mxfile', {
        'host': 'app.diagrams.net',
        'modified': '2026-09-10T02:00:00.000Z',
        'agent': 'Antigravity AI Agent',
        'version': '21.0.0',
        'type': 'device'
    })

    # Tab 1: Sequence - ĐK Học phần
    d1 = ET.SubElement(master_file, 'diagram', {'id': 'seq_enr', 'name': '1. Sequence - ĐK Học phần'})
    d1.append(build_seq_diagram_enrollment())

    # Tab 2: Sequence - Nhập & Chốt điểm
    d2 = ET.SubElement(master_file, 'diagram', {'id': 'seq_grd', 'name': '2. Sequence - Nhập & Chốt điểm'})
    d2.append(build_seq_diagram_grading())

    # Tab 3: Sequence - Đăng nhập
    d3 = ET.SubElement(master_file, 'diagram', {'id': 'seq_auth', 'name': '3. Sequence - Đăng nhập'})
    d3.append(build_seq_diagram_auth())

    # Tab 4: Activity Diagram
    d4 = ET.SubElement(master_file, 'diagram', {'id': 'diag_act', 'name': '4. Activity - ĐK Học phần'})
    d4.append(build_diagram_2_activity())

    # Tab 5: BCE Class Diagram
    d5 = ET.SubElement(master_file, 'diagram', {'id': 'diag_bce', 'name': '5. BCE - Biểu đồ lớp phân tích'})
    d5.append(build_diagram_3_bce())

    xml_str = ET.tostring(master_file, encoding='utf-8')
    parsed = minidom.parseString(xml_str)
    pretty_xml = parsed.toprettyxml(indent='  ', encoding='utf-8')

    for path in ['HienThucHoa_UseCase_Realizations.drawio', 'docs/HienThucHoa_UseCase_Realizations.drawio']:
        with open(path, 'wb') as f:
            f.write(pretty_xml)
        print(f"Saved master file: {path}")

if __name__ == '__main__':
    main()
