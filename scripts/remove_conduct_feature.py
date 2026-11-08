# -*- coding: utf-8 -*-
"""
scripts/remove_conduct_feature.py
Removes all references to the 'Điểm rèn luyện' (student conduct) feature from
BaoCaoDoAn_ChinhSua_HoanThien.docx:
1. Backup original document.
2. Remove UI section 3.4.10.5 e) and Figure 118.
3. Renumber subsections f) -> e), g) -> f), h) -> g).
4. Renumber all figures from 119..149 down by 1 (118..148), and update in-text references (127a-f -> 126a-f).
5. Remove Section 4.14 in Chapter 4, renumber 4.15 -> 4.14, 4.16 -> 4.15.
6. Remove Row 21 in Table 40 (UI Component Inventory Matrix).
7. Update Section 3.4.4.4 and P[1103] text.
8. Save document.
"""

import docx
import shutil
import re
import os

def main():
    docx_path = "BaoCaoDoAn_ChinhSua_HoanThien.docx"
    backup_path = "BaoCaoDoAn_ChinhSua_HoanThien_backup_before_remove_conduct.docx"
    
    print(f"Creating backup: {backup_path}")
    shutil.copyfile(docx_path, backup_path)

    doc = docx.Document(docx_path)
    body = doc._body._element
    print(f"Loaded document with {len(doc.paragraphs)} paragraphs, {len(doc.tables)} tables.")

    # -------------------------------------------------------------------------
    # 1. Update Section 3.4.4.4 (Chương 3 CSDL)
    # -------------------------------------------------------------------------
    for i, p in enumerate(doc.paragraphs):
        if "3.4.4.4. Phân hệ 3: Hồ sơ Người học, Giảng viên & Điểm rèn luyện" in p.text:
            p.text = "3.4.4.4. Phân hệ 3: Hồ sơ Người học & Giảng viên chuyên môn (6 Bảng)"
            print(f"Updated P[{i}]: Section 3.4.4.4 title")
        elif "Phân hệ Hồ sơ Người học & Rèn luyện: Quản lý toàn diện hồ sơ cá nhân sinh viên" in p.text:
            p.text = "Phân hệ Hồ sơ Người học & Giảng viên chuyên môn: Quản lý toàn diện hồ sơ cá nhân sinh viên, giảng viên chuyên môn, thông tin liên lạc và cổng dịch vụ sinh viên một cửa."
            print(f"Updated P[{i}]: Phân hệ 3 description")
        elif "Hình 9. Lược đồ CSDL Phân hệ 3: Hồ sơ Người học, Giảng viên & Rèn luyện" in p.text:
            p.text = "Hình 9. Lược đồ CSDL Phân hệ 3: Hồ sơ Người học & Giảng viên chuyên môn (6 Bảng quan hệ)"
            print(f"Updated P[{i}]: Hình 9 caption")
        elif "Dưới đây là đặc tả chi tiết cấu trúc dữ liệu của 6 bảng thuộc Phân hệ Hồ sơ Người học, Giảng viên & Điểm rèn luyện:" in p.text:
            p.text = "Dưới đây là đặc tả chi tiết cấu trúc dữ liệu của 6 bảng thuộc Phân hệ Hồ sơ Người học & Giảng viên chuyên môn:"
            print(f"Updated P[{i}]: Phân hệ 3 table intro")

    # -------------------------------------------------------------------------
    # 2. Update P[1103] (Cross-cutting check in Degree Audit)
    # -------------------------------------------------------------------------
    for i, p in enumerate(doc.paragraphs):
        if "Giai đoạn 4 - Thẩm định Điều kiện Chéo" in p.text and "StudentConductService" in p.text:
            p.text = "Giai đoạn 4 - Thẩm định Điều kiện Chéo (Cross-cutting Conditions): Kiểm tra trạng thái học vụ sinh viên, gọi TuitionService kiểm tra cờ công nợ học phí hasFinancialHold, và đối chiếu các chứng chỉ chuẩn đầu ra bắt buộc (ngoại ngữ, tin học, giáo dục quốc phòng)."
            print(f"Updated P[{i}]: Removed StudentConductService reference")

    # -------------------------------------------------------------------------
    # 3. Remove UI section 3.4.10.5 e) and Figure 118
    # -------------------------------------------------------------------------
    paragraphs_to_remove = []
    for i, p in enumerate(doc.paragraphs):
        text = p.text.strip()
        # Find e) Phân hệ Điểm rèn luyện & Khen thưởng Kỷ luật
        if text.startswith("e) Phân hệ Điểm rèn luyện & Khen thưởng Kỷ luật"):
            paragraphs_to_remove.append(p)
            # also check if next paragraph is empty or is Figure 118
            if i + 1 < len(doc.paragraphs) and doc.paragraphs[i+1].text.strip() == "":
                paragraphs_to_remove.append(doc.paragraphs[i+1])
            if i + 2 < len(doc.paragraphs) and "Hình 118. Giao diện Phân hệ Điểm rèn luyện" in doc.paragraphs[i+2].text:
                paragraphs_to_remove.append(doc.paragraphs[i+2])
            print(f"Marked P[{i}] and Hình 118 for removal")

        # Find Chapter 4 Section 4.14
        elif text == "4.14. Phân hệ Điểm rèn luyện, Khen thưởng và Kỷ luật sinh viên":
            paragraphs_to_remove.append(p)
            for j in range(1, 4):
                if i + j < len(doc.paragraphs):
                    paragraphs_to_remove.append(doc.paragraphs[i+j])
            print(f"Marked Chapter 4 Section 4.14 (P[{i}] to P[{i+3}]) for removal")

    for p in paragraphs_to_remove:
        p_elem = p._element
        if p_elem.getparent() is not None:
            p_elem.getparent().remove(p_elem)

    print(f"Removed {len(paragraphs_to_remove)} paragraphs from document.")

    # -------------------------------------------------------------------------
    # 4. Renumber Chapter 4 Sections: 4.15 -> 4.14, 4.16 -> 4.15
    # -------------------------------------------------------------------------
    for i, p in enumerate(doc.paragraphs):
        text = p.text.strip()
        if text.startswith("4.15. Phân hệ Điểm danh thông minh"):
            p.text = text.replace("4.15. Phân hệ Điểm danh", "4.14. Phân hệ Điểm danh")
            print(f"Renumbered P[{i}]: 4.15 -> 4.14")
        elif text.startswith("4.16. Phân hệ Quản trị Nhân sự Đào tạo"):
            p.text = text.replace("4.16. Phân hệ Quản trị Nhân sự", "4.15. Phân hệ Quản trị Nhân sự")
            print(f"Renumbered P[{i}]: 4.16 -> 4.15")

    # -------------------------------------------------------------------------
    # 5. Renumber Section 3.4.10.5 Subsections: f) -> e), g) -> f), h) -> g)
    # -------------------------------------------------------------------------
    for i, p in enumerate(doc.paragraphs):
        text = p.text.strip()
        if text.startswith("f) Quản trị Cấp lại Mật khẩu & Xử lý Yêu cầu An toàn"):
            p.text = "e) Quản trị Cấp lại Mật khẩu & Xử lý Yêu cầu An toàn" + text[len("f) Quản trị Cấp lại Mật khẩu & Xử lý Yêu cầu An toàn"):]
            print(f"Renumbered P[{i}]: f) -> e)")
        elif text.startswith("g) Nhật ký Kiểm toán Điểm số Bất biến"):
            p.text = "f) Nhật ký Kiểm toán Điểm số Bất biến" + text[len("g) Nhật ký Kiểm toán Điểm số Bất biến"):]
            print(f"Renumbered P[{i}]: g) -> f)")
        elif text.startswith("h) Phân hệ Tiếp nhận & Thẩm định Đơn Phúc khảo"):
            p.text = "g) Phân hệ Tiếp nhận & Thẩm định Đơn Phúc khảo" + text[len("h) Phân hệ Tiếp nhận & Thẩm định Đơn Phúc khảo"):]
            print(f"Renumbered P[{i}]: h) -> g)")

    # -------------------------------------------------------------------------
    # 6. Renumber Figures from 119 to 149 down by 1 (118 to 148)
    #    and 127a-f -> 126a-f
    # -------------------------------------------------------------------------
    for i, p in enumerate(doc.paragraphs):
        text = p.text.strip()
        # Check figure captions
        if text.startswith("Hình 1") or text.startswith("HÌNH 1"):
            # Check numbers 119 to 149
            m = re.match(r'^(Hình\s+)(1[1-4]\d)([a-z]?)([\.:\s].*)$', text, re.IGNORECASE)
            if m:
                prefix = m.group(1)
                num = int(m.group(2))
                suffix = m.group(3)
                rest = m.group(4)
                if num >= 119:
                    new_num = num - 1
                    # If 127a-f -> 126a-f
                    p.text = f"{prefix}{new_num}{suffix}{rest}"
                    # print(f"Renumbered Fig P[{i}]: Hình {num}{suffix} -> Hình {new_num}{suffix}")

        # In-text references in responsive section
        for s in ['a', 'b', 'c', 'd', 'e', 'f']:
            if f"Hình 127{s}" in p.text:
                p.text = p.text.replace(f"Hình 127{s}", f"Hình 126{s}")
                print(f"Updated in-text ref in P[{i}]: Hình 127{s} -> Hình 126{s}")

    # -------------------------------------------------------------------------
    # 7. Remove Row 21 (Điểm rèn luyện) from Table 40
    # -------------------------------------------------------------------------
    table_40 = None
    for t in doc.tables:
        if len(t.rows) > 0 and "Thành phần UI & Tệp JSX chính" in t.rows[0].cells[1].text:
            table_40 = t
            break

    if table_40:
        print(f"Found Table 40 with {len(table_40.rows)} rows.")
        rows_to_remove = []
        for r_idx, r in enumerate(table_40.rows):
            first_cell_text = r.cells[0].text.strip().lower()
            if "rèn luyện" in first_cell_text or "studentconduct" in r.cells[1].text.lower():
                rows_to_remove.append(r)
                print(f"Found conduct row in Table 40 at index {r_idx}: '{r.cells[0].text.strip()}'")

        for r in rows_to_remove:
            table_40._element.remove(r._element)
        print(f"Table 40 updated: now has {len(table_40.rows)} rows.")

    doc.save(docx_path)
    print(f"Saved cleaned document to {docx_path}")

if __name__ == "__main__":
    main()

