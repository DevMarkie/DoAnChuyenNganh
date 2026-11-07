"""
scripts/audit_docx.py
Thực hiện rà soát toàn diện (Comprehensive Audit) tệp BaoCaoDoAn_ChinhSua_HoanThien.docx:
1. Thông tin sinh viên & Giảng viên hướng dẫn
2. Các ký hiệu giữ chỗ (Placeholders: TODO, TBD, XXX, [?], ...)
3. Tính nhất quán của các số liệu kỹ thuật (Số bài test, số bảng CSDL, số sơ đồ DrawIO, ...)
4. Đánh số và chú thích Hình (Figure Captions)
5. Đánh số và chú thích Bảng (Table Captions)
6. Các liên kết chéo (Cross-references)
7. Các lỗi chính tả / thuật ngữ thường gặp
"""

import os
import re
from collections import Counter
import docx

DOC_PATH = "BaoCaoDoAn_ChinhSua_HoanThien.docx"

def audit():
    if not os.path.exists(DOC_PATH):
        print(f"File not found: {DOC_PATH}")
        return

    doc = docx.Document(DOC_PATH)
    print(f"Loaded {DOC_PATH}: {len(doc.paragraphs)} paragraphs, {len(doc.tables)} tables.")

    # -------------------------------------------------------------
    # 1. Header, Title, Student & Supervisor Info
    # -------------------------------------------------------------
    print("\n" + "="*70)
    print("1. THÔNG TIN BAN ĐẦU & TRANG BÌA, PHÂN CÔNG NHIỆM VỤ")
    print("="*70)
    for i, p in enumerate(doc.paragraphs[:50]):
        text = p.text.strip()
        if text:
            for kw in ['sinh viên', 'nguyễn', 'minh', '23010359', 'hướng dẫn', 'giảng viên', 'đề tài', 'chuyên ngành', 'khoa', 'trường']:
                if kw in text.lower():
                    print(f"P[{i}]: {text}")
                    break

    # Also check first 3 tables (often contain assignment / student info)
    for t_idx, table in enumerate(doc.tables[:3]):
        print(f"\n--- Bảng {t_idx + 1} (Phần đầu tài liệu) ---")
        for row in table.rows:
            row_text = " | ".join(c.text.strip().replace('\n', ' ') for c in row.cells)
            if any(k in row_text.lower() for k in ['sinh viên', 'cán bộ', 'hướng dẫn', 'nhiệm vụ', 'điểm', 'nhận xét']):
                print(f"  {row_text}")

    # Combine full text
    para_texts = [p.text for p in doc.paragraphs]
    table_texts = []
    for t in doc.tables:
        for r in t.rows:
            for c in r.cells:
                table_texts.append(c.text)

    all_text = "\n".join(para_texts + table_texts)

    # -------------------------------------------------------------
    # 2. Placeholders & Missing Items
    # -------------------------------------------------------------
    print("\n" + "="*70)
    print("2. TÌM KIẾM CÁC DẤU HIỆU DỮ LIỆU CÒN THIẾU / GIỮ CHỖ (PLACEHOLDERS)")
    print("="*70)
    patterns = [
        r'TODO', r'TBD', r'FIXME', r'XXX', r'\bXX\b', r'\bYY\b',
        r'\[\?\]', r'\?\?\?', r'chưa có', r'cần bổ sung', r'cần cập nhật',
        r'thay bằng', r'\[chèn ảnh\]', r'\[ảnh\]', r'lỗi'
    ]
    for pat in patterns:
        matches = re.finditer(rf'.{{0,40}}{pat}.{{0,40}}', all_text, re.IGNORECASE)
        m_list = list(matches)
        if m_list:
            print(f"\n[CẢNH BÁO] Tìm thấy '{pat}' ({len(m_list)} lần):")
            for m in m_list[:6]:
                print(f"   ... {m.group(0).strip().replace(chr(10), ' ')} ...")

    # -------------------------------------------------------------
    # 3. Technical Metrics Consistency
    # -------------------------------------------------------------
    print("\n" + "="*70)
    print("3. TÍNH NHẤT QUÁN CỦA CÁC CHỈ SỐ KỸ THUẬT")
    print("="*70)
    
    # Check test counts
    test_queries = [
        (r'(\d+)\s*ca kiểm thử', 'ca kiểm thử'),
        (r'(\d+)\s*(?:tests|test)\b', 'test(s)'),
        (r'(\d+)\s*bảng', 'bảng CSDL/quan hệ'),
        (r'(\d+)\s*sơ đồ', 'sơ đồ Draw.io'),
        (r'(\d+)\s*tab', 'tab Draw.io'),
        (r'(\d+)\s*controller', 'controllers'),
        (r'(\d+)\s*thực thể', 'thực thể / entities'),
    ]
    for regex, label in test_queries:
        found = re.findall(regex, all_text, re.IGNORECASE)
        c = Counter(found)
        print(f"- Số lượng {label}: {dict(c.most_common(6))}")

    # -------------------------------------------------------------
    # 4. Check Figure Numbering Sequence
    # -------------------------------------------------------------
    print("\n" + "="*70)
    print("4. KIỂM TRA ĐÁNH SỐ HÌNH (FIGURE NUMBERING SEQUENCE)")
    print("="*70)
    fig_captions = []
    fig_pattern = re.compile(r'^(Hình\s+(\d+)[\.\:]?\s*.*)$', re.IGNORECASE)
    
    for i, p in enumerate(doc.paragraphs):
        text = p.text.strip()
        m = fig_pattern.match(text)
        if m:
            full_cap = m.group(1)
            fig_num = int(m.group(2))
            fig_captions.append((i, fig_num, full_cap))

    print(f"Tổng số hình nhận diện được qua Caption: {len(fig_captions)}")
    if fig_captions:
        print(f"Hình đầu tiên: Hình {fig_captions[0][1]} - {fig_captions[0][2][:60]}")
        print(f"Hình cuối cùng: Hình {fig_captions[-1][1]} - {fig_captions[-1][2][:60]}")

        # Check sequence gaps & duplicates
        seen_nums = set()
        duplicates = []
        for i, num, cap in fig_captions:
            if num in seen_nums:
                duplicates.append((num, cap))
            seen_nums.add(num)

        if duplicates:
            print(f"\n[LỖI] Phát hiện {len(duplicates)} số hình bị TRÙNG LẶP:")
            for num, cap in duplicates[:10]:
                print(f"   Trùng Hình {num}: {cap[:70]}")
        else:
            print("\n[OK] Không có số hình nào bị trùng lặp!")

        # Check missing numbers
        min_num = fig_captions[0][1]
        max_num = fig_captions[-1][1]
        missing = [n for n in range(min_num, max_num + 1) if n not in seen_nums]
        if missing:
            print(f"\n[CẢNH BÁO] Các số hình bị THIẾU / KHÔNG LIÊN TỤC ({len(missing)} số): {missing[:20]}")
        else:
            print(f"\n[OK] Dãy số hình liên tục tuyệt đối từ {min_num} đến {max_num}!")

    # -------------------------------------------------------------
    # 5. Check Table Numbering Sequence
    # -------------------------------------------------------------
    print("\n" + "="*70)
    print("5. KIỂM TRA ĐÁNH SỐ BẢNG (TABLE NUMBERING SEQUENCE)")
    print("="*70)
    table_captions = []
    tbl_pattern = re.compile(r'^(Bảng\s+([\d\.]+)[\.\:]?\s*.*)$', re.IGNORECASE)
    
    for i, p in enumerate(doc.paragraphs):
        text = p.text.strip()
        m = tbl_pattern.match(text)
        if m:
            full_cap = m.group(1)
            tbl_num_str = m.group(2)
            table_captions.append((i, tbl_num_str, full_cap))

    print(f"Tổng số Bảng nhận diện được qua Caption: {len(table_captions)}")
    print(f"Tổng số bảng Word Table thực tế trong tài liệu: {len(doc.tables)}")
    for i, num_str, cap in table_captions[:10]:
        print(f"   Bảng {num_str}: {cap[:60]}")
    if len(table_captions) > 10:
        print("   ...")
        for i, num_str, cap in table_captions[-5:]:
            print(f"   Bảng {num_str}: {cap[:60]}")

if __name__ == "__main__":
    audit()

def deep_audit():
    doc = docx.Document(DOC_PATH)
    print("\n" + "="*70)
    print("6. KIỂM TRA TRƯỜNG MỤC LỤC & DANH MỤC (TOC / TOF)")
    print("="*70)
    for i in range(30, 38):
        p = doc.paragraphs[i]
        xml = p._p.xml
        has_fld = 'w:fldSimple' in xml or 'w:instrText' in xml or 'w:fldChar' in xml
        print(f"P[{i}]: \"{p.text}\" | Has Field Code: {has_fld}")

    print("\n" + "="*70)
    print("7. KIỂM TRA CHI TIẾT CÁC ĐOẠN / BẢNG BỊ TRÙNG LẶP")
    print("="*70)
    # Check Table 106 vs 107
    print(f"Table 106 rows: {len(doc.tables[106].rows)}")
    print(f"Table 107 rows: {len(doc.tables[107].rows)}")
    t106_text = "\n".join(" | ".join(c.text.strip() for c in r.cells) for r in doc.tables[106].rows)
    t107_text = "\n".join(" | ".join(c.text.strip() for c in r.cells) for r in doc.tables[107].rows)
    print(f"Table 106 and 107 are identical: {t106_text == t107_text}")

    # Check P[1183] to P[1186]
    for p_idx in [1183, 1184, 1185, 1186]:
        print(f"P[{p_idx}]: {doc.paragraphs[p_idx].text[:70]}...")

    # Check P[1258] to P[1321]
    p1258_1289 = "\n".join(doc.paragraphs[p_idx].text for p_idx in range(1258, 1290))
    p1290_1321 = "\n".join(doc.paragraphs[p_idx].text for p_idx in range(1290, 1322))
    print(f"P[1258..1289] and P[1290..1321] text identical: {p1258_1289 == p1290_1321}")

    print("\n" + "="*70)
    print("8. KIỂM TRA THÔNG TIN HỌC VỤ & SINH VIÊN TRÊN TOÀN TÀI LIỆU")
    print("="*70)
    # Search for any wrong student names, wrong student IDs, etc.
    wrong_ids = re.findall(r'\b(2[0-9]{7})\b', "\n".join(p.text for p in doc.paragraphs))
    c_ids = Counter(wrong_ids)
    print(f"Mã sinh viên xuất hiện: {dict(c_ids)}")

    # Check supervisors
    supervisors = re.findall(r'(?:hướng dẫn|thầy|cô)\s*[:\-]?\s*([^\n,\.]{4,35})', "\n".join(p.text for p in doc.paragraphs), re.IGNORECASE)
    print(f"Thông tin hướng dẫn xuất hiện: {Counter(supervisors).most_common(5)}")

if __name__ == "__main__":
    deep_audit()
