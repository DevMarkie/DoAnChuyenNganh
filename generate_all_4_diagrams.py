# -*- coding: utf-8 -*-
"""
Master script to generate Draw.io diagram files:
1. drawio/UseCase_Diagrams.drawio (4 tabs - Phân hệ Use Case)
2. drawio/Sequence_Diagrams.drawio (16 tabs - Mỗi chức năng 1 tab độc lập chuẩn UML Sequence)
3. drawio/Activity_Diagrams.drawio (16 tabs - Mỗi chức năng 1 tab độc lập chuẩn UML Activity)
4. drawio/AnalysisClass_BCE_Diagrams.drawio (16 tabs - Mỗi chức năng 1 tab độc lập chuẩn BCE Business Component)
100% tiếng Việt chuẩn mực học thuật.
"""

import os
import sys
import xml.etree.ElementTree as ET
import xml.dom.minidom as minidom

sys.stdout.reconfigure(encoding='utf-8')

from build_drawio_diagrams import (
    build_diagram_1_overall,
    build_diagram_2_admin,
    build_diagram_3_lecturer,
    build_diagram_4_student
)
from build_full_sequence_diagrams import (
    build_seq_1_login,
    build_seq_2_change_password,
    build_seq_3_student_create,
    build_seq_4_student_manage,
    build_seq_5_academic_structure,
    build_seq_6_lecturers,
    build_seq_7_subjects,
    build_seq_8_semesters,
    build_seq_9_course_sections,
    build_seq_10_scheduling,
    build_seq_11_enrollment,
    build_seq_12_course_drop,
    build_seq_13_grading_entry,
    build_seq_14_grading_finalize,
    build_seq_15_transcript_cpa,
    build_seq_16_analytics_dashboard
)
from build_full_bce_diagrams import (
    build_bce_1_login,
    build_bce_2_change_password,
    build_bce_3_student_create,
    build_bce_4_student_manage,
    build_bce_5_academic_structure,
    build_bce_6_lecturers,
    build_bce_7_subjects,
    build_bce_8_semesters,
    build_bce_9_course_sections,
    build_bce_10_scheduling,
    build_bce_11_enrollment,
    build_bce_12_course_drop,
    build_bce_13_grading_entry,
    build_bce_14_grading_finalize,
    build_bce_15_transcript_cpa,
    build_bce_16_analytics_dashboard
)
from build_full_activity_diagrams import (
    build_act_1_login,
    build_act_2_change_password,
    build_act_3_student_create,
    build_act_4_student_manage,
    build_act_5_academic_structure,
    build_act_6_lecturers,
    build_act_7_subjects,
    build_act_8_semesters,
    build_act_9_course_sections,
    build_act_10_scheduling,
    build_act_11_enrollment,
    build_act_12_course_drop,
    build_act_13_grading_entry,
    build_act_14_grading_finalize,
    build_act_15_transcript_cpa,
    build_act_16_analytics_dashboard
)

def create_mxfile(diagrams, out_path):
    mxfile = ET.Element('mxfile', {
        'host': 'app.diagrams.net',
        'modified': '2026-09-11T11:00:00.000Z',
        'agent': 'Antigravity AI Agent',
        'version': '21.0.0',
        'type': 'device'
    })
    for diag_id, diag_name, model in diagrams:
        d = ET.SubElement(mxfile, 'diagram', {'id': diag_id, 'name': diag_name})
        d.append(model)
    
    xml_str = ET.tostring(mxfile, encoding='utf-8')
    parsed = minidom.parseString(xml_str)
    pretty_xml = parsed.toprettyxml(indent='  ', encoding='utf-8')
    
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'wb') as f:
        f.write(pretty_xml)
    print(f"Successfully generated: {out_path} ({len(pretty_xml)} bytes, {len(diagrams)} tabs)")

def main():
    out_dir = 'drawio'
    os.makedirs(out_dir, exist_ok=True)

    # 1. UseCase_Diagrams.drawio (4 tabs - Giữ nguyên không can thiệp nếu đã tồn tại)
    usecase_path = os.path.join(out_dir, 'UseCase_Diagrams.drawio')
    if not os.path.exists(usecase_path):
        create_mxfile([
            ('uc_overall', '1. Tổng quan toàn hệ thống', build_diagram_1_overall()),
            ('uc_admin', '2. Phân hệ Quản trị viên', build_diagram_2_admin()),
            ('uc_lecturer', '3. Phân hệ Giảng viên', build_diagram_3_lecturer()),
            ('uc_student', '4. Phân hệ Sinh viên', build_diagram_4_student())
        ], usecase_path)
    else:
        print(f"Giữ nguyên {usecase_path} theo yêu cầu người dùng.")

    # 2. Sequence_Diagrams.drawio (16 tabs - Mỗi chức năng 1 tab độc lập)
    create_mxfile([
        ('seq_login', '1. Đăng nhập hệ thống', build_seq_1_login()),
        ('seq_changepwd', '2. Đổi mật khẩu', build_seq_2_change_password()),
        ('seq_stu_create', '3. Thêm mới Sinh viên', build_seq_3_student_create()),
        ('seq_stu_manage', '4. Quản lý hồ sơ Sinh viên', build_seq_4_student_manage()),
        ('seq_academic', '5. Khoa & Lớp sinh hoạt', build_seq_5_academic_structure()),
        ('seq_lecturers', '6. Quản lý Giảng viên', build_seq_6_lecturers()),
        ('seq_subjects', '7. Quản lý Môn học', build_seq_7_subjects()),
        ('seq_semesters', '8. Cấu hình Học kỳ', build_seq_8_semesters()),
        ('seq_sections', '9. Mở lớp Học phần', build_seq_9_course_sections()),
        ('seq_scheduling', '10. Xếp Thời khóa biểu', build_seq_10_scheduling()),
        ('seq_enroll', '11. Đăng ký lớp Học phần', build_seq_11_enrollment()),
        ('seq_drop', '12. Hủy đăng ký Học phần', build_seq_12_course_drop()),
        ('seq_grd_entry', '13. Nhập điểm thành phần', build_seq_13_grading_entry()),
        ('seq_grd_finalize', '14. Chốt bảng điểm', build_seq_14_grading_finalize()),
        ('seq_transcript', '15. Bảng điểm & Điểm CPA', build_seq_15_transcript_cpa()),
        ('seq_dashboard', '16. Báo cáo Thống kê & Dashboard', build_seq_16_analytics_dashboard()),
    ], os.path.join(out_dir, 'Sequence_Diagrams.drawio'))

    # 3. Activity_Diagrams.drawio (16 tabs - Mỗi chức năng 1 tab độc lập)
    create_mxfile([
        ('act_login', '1. Đăng nhập hệ thống', build_act_1_login()),
        ('act_changepwd', '2. Đổi mật khẩu', build_act_2_change_password()),
        ('act_stu_create', '3. Thêm mới Sinh viên', build_act_3_student_create()),
        ('act_stu_manage', '4. Quản lý hồ sơ Sinh viên', build_act_4_student_manage()),
        ('act_academic', '5. Khoa & Lớp sinh hoạt', build_act_5_academic_structure()),
        ('act_lecturers', '6. Quản lý Giảng viên', build_act_6_lecturers()),
        ('act_subjects', '7. Quản lý Môn học', build_act_7_subjects()),
        ('act_semesters', '8. Cấu hình Học kỳ', build_act_8_semesters()),
        ('act_sections', '9. Mở lớp Học phần', build_act_9_course_sections()),
        ('act_scheduling', '10. Xếp Thời khóa biểu', build_act_10_scheduling()),
        ('act_enroll', '11. Đăng ký lớp Học phần', build_act_11_enrollment()),
        ('act_drop', '12. Hủy đăng ký Học phần', build_act_12_course_drop()),
        ('act_grd_entry', '13. Nhập điểm thành phần', build_act_13_grading_entry()),
        ('act_grd_finalize', '14. Chốt bảng điểm', build_act_14_grading_finalize()),
        ('act_transcript', '15. Bảng điểm & Điểm CPA', build_act_15_transcript_cpa()),
        ('act_dashboard', '16. Báo cáo Thống kê & Dashboard', build_act_16_analytics_dashboard()),
    ], os.path.join(out_dir, 'Activity_Diagrams.drawio'))

    # 4. AnalysisClass_BCE_Diagrams.drawio (16 tabs - Mỗi chức năng 1 tab độc lập)
    create_mxfile([
        ('bce_login', '1. Đăng nhập hệ thống', build_bce_1_login()),
        ('bce_changepwd', '2. Đổi mật khẩu', build_bce_2_change_password()),
        ('bce_stu_create', '3. Thêm mới Sinh viên', build_bce_3_student_create()),
        ('bce_stu_manage', '4. Quản lý hồ sơ Sinh viên', build_bce_4_student_manage()),
        ('bce_academic', '5. Khoa & Lớp sinh hoạt', build_bce_5_academic_structure()),
        ('bce_lecturers', '6. Quản lý Giảng viên', build_bce_6_lecturers()),
        ('bce_subjects', '7. Quản lý Môn học', build_bce_7_subjects()),
        ('bce_semesters', '8. Cấu hình Học kỳ', build_bce_8_semesters()),
        ('bce_sections', '9. Mở lớp Học phần', build_bce_9_course_sections()),
        ('bce_scheduling', '10. Xếp Thời khóa biểu', build_bce_10_scheduling()),
        ('bce_enroll', '11. Đăng ký lớp Học phần', build_bce_11_enrollment()),
        ('bce_drop', '12. Hủy đăng ký Học phần', build_bce_12_course_drop()),
        ('bce_grd_entry', '13. Nhập điểm thành phần', build_bce_13_grading_entry()),
        ('bce_grd_finalize', '14. Chốt bảng điểm', build_bce_14_grading_finalize()),
        ('bce_transcript', '15. Bảng điểm & Điểm CPA', build_bce_15_transcript_cpa()),
        ('bce_dashboard', '16. Báo cáo Thống kê & Dashboard', build_bce_16_analytics_dashboard()),
    ], os.path.join(out_dir, 'AnalysisClass_BCE_Diagrams.drawio'))

if __name__ == '__main__':
    main()
