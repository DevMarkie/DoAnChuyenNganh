"""
scripts/check_plagiarism.py
=============================================================================
Kịch bản kiểm tra đạo văn (Plagiarism & Academic Integrity Audit) chuyên sâu:
1. Phát hiện trùng lặp nội bộ (Internal Duplication / Cross-chapter repetition)
2. Phân tích chỉ số tính độc bản (Originality Index & Contextual Specificity)
3. Rà soát các đoạn lý thuyết có nguy cơ cao (High-risk Boilerplate Paragraphs)
4. Kiểm toán trích dẫn và liên kết học thuật (Academic Citation Audit)
5. Đo lường tỷ lệ trùng lặp dự kiến trên Turnitin / DoIT
=============================================================================
"""

import os
import re
from collections import Counter, defaultdict
import docx

DOC_PATH = "BaoCaoDoAn_ChinhSua_HoanThien.docx"

def run_plagiarism_audit():
    if not os.path.exists(DOC_PATH):
        print(f"File not found: {DOC_PATH}")
        return

    doc = docx.Document(DOC_PATH)
    print(f"Loaded: {DOC_PATH} ({len(doc.paragraphs)} paragraphs, {len(doc.tables)} tables)\n")

    # -------------------------------------------------------------------------
    # 1. Phân chia tài liệu theo Chương (Chapters)
    # -------------------------------------------------------------------------
    chapters = []
    current_chapter = "MỞ ĐẦU & TRANG BÌA"
    chapter_paras = defaultdict(list)

    for i, p in enumerate(doc.paragraphs):
        text = p.text.strip()
        if p.style.name.startswith('Heading 1'):
            current_chapter = text
            chapters.append(current_chapter)
        if text:
            chapter_paras[current_chapter].append((i, text))

    print(f"Tổng số phân đoạn / chương chính: {len(chapter_paras)}")
    for ch, p_list in chapter_paras.items():
        print(f"   * {ch[:45]}: {len(p_list)} đoạn văn")

    # -------------------------------------------------------------------------
    # 2. Phát hiện câu / cụm từ trùng lặp liên chương (Cross-Chapter Duplication)
    # -------------------------------------------------------------------------
    print("\n" + "="*70)
    print("1. KIỂM TRA TRÙNG LẶP NỘI BỘ (CROSS-CHAPTER REPETITION)")
    print("="*70)
    
    sentence_map = defaultdict(list)
    for ch, p_list in chapter_paras.items():
        for p_idx, p_text in p_list:
            # Tách các câu có độ dài > 50 ký tự
            sentences = re.split(r'[\.\?\!\n]\s+', p_text)
            for s in sentences:
                s_clean = s.strip()
                if len(s_clean) > 60 and not s_clean.startswith('Hình') and not s_clean.startswith('Bảng'):
                    # Chuẩn hóa khoảng trắng
                    s_norm = ' '.join(s_clean.split()).lower()
                    sentence_map[s_norm].append((ch, p_idx, s_clean))

    repeated_sentences = {k: v for k, v in sentence_map.items() if len(v) > 1}
    # Lọc những câu xuất hiện ở khác chương
    cross_chapter_repeats = []
    for k, occurrences in repeated_sentences.items():
        unique_chs = set(occ[0] for occ in occurrences)
        if len(unique_chs) > 1:
            cross_chapter_repeats.append(occurrences)

    print(f"Số câu lặp lại liên chương (>60 ký tự): {len(cross_chapter_repeats)}")
    for occs in cross_chapter_repeats[:10]:
        print(f"\n[LẶP LẠI {len(occs)} LẦN]: \"{occs[0][2][:80]}...\"")
        for ch, p_idx, orig in occs:
            print(f"   -> [{ch[:30]}] P[{p_idx}]")

    # -------------------------------------------------------------------------
    # 3. Phân tích chỉ số Tính độc bản (Originality Index) theo từng Chương
    # -------------------------------------------------------------------------
    print("\n" + "="*70)
    print("2. PHÂN TÍCH CHỈ SỐ TÍNH ĐỘC BẢN & NGỮ CẢNH HỆ THỐNG (ORIGINALITY INDEX)")
    print("="*70)
    print("Tiêu chí: Tỷ lệ các đoạn văn có chứa từ khóa nghiệp vụ/kiến trúc riêng của đề tài:")
    print("Từ khóa riêng: SMS, Phenikaa, 23010359, Vũ Văn Quang, Thông tư 08, DAG, RedisLock,")
    print("Best-Grade, 3 cấp, 7 ngày, 528 test, CourseSection, Student, Grade, BPA, BR-, TC-, ...\n")

    specific_keywords = [
        r'\bsms\b', r'\bphenikaa\b', r'\b23010359\b', r'\bvũ văn quang\b', r'\b08/2021\b',
        r'\bdag\b', r'\bredislock\b', r'\bbest-grade\b', r'\b3 cấp\b', r'\b7 ngày\b',
        r'\b528\b', r'\b297\b', r'\b105\b', r'\b65\b', r'\bcoursesection\b', r'\bgrade\b',
        r'\bdegreeaudit\b', r'\bprerequisitegraphengine\b', r'\bbpa\b', r'\bbr-\b', r'\btc-\b',
        r'\bhọc phần\b', r'\btín chỉ\b', r'\bphúc khảo\b', r'\bđiểm danh pin\b', r'\bcpa\b', r'\bgpa\b'
    ]

    for ch, p_list in chapter_paras.items():
        total_p = len(p_list)
        if total_p == 0:
            continue
        specific_p = 0
        generic_p_list = []
        for p_idx, p_text in p_list:
            text_lower = p_text.lower()
            has_spec = any(re.search(kw, text_lower) for kw in specific_keywords)
            if has_spec:
                specific_p += 1
            else:
                if len(p_text.split()) > 30 and not p_text.startswith('Hình') and not p_text.startswith('Bảng'):
                    generic_p_list.append((p_idx, p_text))

        ratio = (specific_p / total_p) * 100
        print(f"[{ch[:40]}]")
        print(f"   Độ độc bản đề tài: {ratio:.1f}% ({specific_p}/{total_p} đoạn văn)")
        if generic_p_list:
            print(f"   Số đoạn lý thuyết chung (nguy cơ trùng lặp cao): {len(generic_p_list)}")
            for p_idx, text in generic_p_list[:2]:
                print(f"      - P[{p_idx}]: \"{text[:75]}...\"")

    # -------------------------------------------------------------------------
    # 4. Rà soát các đoạn lý thuyết Chương 2 có nguy cơ trùng Turnitin
    # -------------------------------------------------------------------------
    print("\n" + "="*70)
    print("3. RÀ SOÁT CÁC ĐOẠN LÝ THUYẾT NỀN TẢNG (CHƯƠNG 2) CÓ NGUY CƠ TRÙNG LẶP")
    print("="*70)
    ch2_paras = chapter_paras.get("CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ NỀN TẢNG CÔNG NGHỆ", [])
    high_risk_ch2 = []
    for p_idx, text in ch2_paras:
        # Nếu đoạn văn thuần túy định nghĩa công nghệ không kèm trích dẫn hoặc ngữ cảnh SMS
        words = text.split()
        if len(words) > 40:
            has_citation = bool(re.search(r'\[\d+\]', text))
            has_sms_context = any(k in text.lower() for k in ['sms', 'hệ thống', 'trong đề tài', 'đồ án', 'áp dụng'])
            if not has_citation and not has_sms_context:
                high_risk_ch2.append((p_idx, text))

    print(f"Số đoạn trong Chương 2 thuần túy lý thuyết chung, chưa có trích dẫn hoặc gắn với SMS: {len(high_risk_ch2)}")
    for p_idx, text in high_risk_ch2:
        print(f"\n[NGUY CƠ CAO] P[{p_idx}]:")
        print(f"\"{text}\"")

if __name__ == "__main__":
    run_plagiarism_audit()

