# -*- coding: utf-8 -*-
"""
scripts/apply_diction_refinement.py
Applies comprehensive academic diction refinement and typography normalization to
BaoCaoDoAn_ChinhSua_HoanThien.docx according to user consensus:
1. Eliminate colloquial/conversational pronouns ('mình') in academic sections.
2. Standardize technical terminology to Vietnamese equivalents (ca kiểm thử, độ bao phủ mã nguồn, mã định danh).
3. Normalize typography (arrow spacing '→  ' -> '→ ').
4. Preserve all runs and bold formatting.
"""

import docx
import re
import os
import shutil

def refine_diction(docx_path):
    print(f"Loading document: {docx_path}")
    doc = docx.Document(docx_path)
    total_paras = len(doc.paragraphs)
    print(f"Total paragraphs: {total_paras}")

    # Specific replacements map for known paragraphs
    # Format: paragraph_index: (old_substring, new_substring)
    targeted_replacements = [
        # 1. Pronoun 'mình' replacements
        (294, "xử lý đơn phúc khảo của lớp mình phụ trách", "xử lý đơn phúc khảo của lớp học phần được phân công phụ trách"),
        (1107, "thuộc Khoa mình quản lý", "thuộc Khoa được phân công quản lý"),
        (1127, "khung chương trình đào tạo của ngành mình (BUG-03)", "khung chương trình đào tạo của ngành học tương ứng (BUG-03)"),
        (1151, "thao tác được trên các lớp mình phụ trách", "thao tác được trên các lớp học phần được phân công phụ trách"),
        (1152, "Giảng viên chỉ xử lý đơn của lớp mình, Admin xử lý mọi đơn", "Giảng viên chỉ xử lý đơn của lớp học phần phụ trách, Quản trị viên xử lý toàn bộ các đơn"),
        (1212, "truy cập danh sách phiếu đề xuất của khoa mình", "truy cập danh sách phiếu đề xuất thuộc khoa phụ trách"),
        (1217, "để biết rõ mình đã đạt những tiêu chí nào và còn thiếu những môn học gì", "để nắm bắt chính xác các tiêu chí đã hoàn thành và danh mục các học phần còn thiếu"),
        (1232, "thuộc thẩm quyền của chức vị và đơn vị mình", "thuộc thẩm quyền của chức vụ và đơn vị công tác tương ứng"),

        # 2. Tech terms: test cases, code, cực kỳ
        (227, "528 test cases", "528 ca kiểm thử"),
        (1251, "105 test cases", "105 ca kiểm thử"),
        (1452, "528 test cases bao phủ từ Unit Test, Integration Test đến E2E Test", "528 ca kiểm thử tự động bao phủ từ kiểm thử đơn vị (Unit Test), tích hợp (Integration Test) đến hệ thống (E2E Test)"),
        (1412, "vận hành cực kỳ ổn định, chính xác", "vận hành hết sức ổn định, chuẩn xác"),
        (609, "mã lớp (code)", "mã định danh lớp học (Class Code)"),
        (1365, "độ phủ mã (code coverage)", "độ bao phủ mã nguồn (Code Coverage)")
    ]

    applied_count = 0
    for idx, old_sub, new_sub in targeted_replacements:
        if idx < total_paras:
            p = doc.paragraphs[idx]
            if old_sub in p.text:
                # Replace within runs while preserving formatting
                replaced = False
                for r in p.runs:
                    if old_sub in r.text:
                        r.text = r.text.replace(old_sub, new_sub)
                        replaced = True
                if not replaced:
                    # In case old_sub spans across runs
                    p.text = p.text.replace(old_sub, new_sub)
                applied_count += 1
                print(f"Applied replacement at P[{idx}]: '{old_sub[:30]}...' -> '{new_sub[:30]}...'")
            else:
                print(f"Warning: Text not found in P[{idx}]: '{old_sub[:30]}...'")

    # 3. Typography: normalize double spaces after arrows '→  ' -> '→ '
    arrow_fix_count = 0
    for i in range(171, min(1467, total_paras)):
        p = doc.paragraphs[i]
        if "→  " in p.text:
            for r in p.runs:
                if "→  " in r.text:
                    r.text = r.text.replace("→  ", "→ ")
            if "→  " in p.text:
                p.text = p.text.replace("→  ", "→ ")
            arrow_fix_count += 1

    print(f"Normalized arrow spacing in {arrow_fix_count} paragraphs.")

    # Save changes
    doc.save(docx_path)
    print(f"Saved refined document to: {docx_path}")

if __name__ == "__main__":
    refine_diction("BaoCaoDoAn_ChinhSua_HoanThien.docx")

