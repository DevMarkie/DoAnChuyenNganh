# -*- coding: utf-8 -*-
"""
scripts/check_diction.py
Audit vocabulary, pronouns, academic tone, colloquialisms, typos, and punctuation spacing
in BaoCaoDoAn_ChinhSua_HoanThien.docx
"""

import docx
import re
from collections import Counter

def audit_diction(docx_path):
    doc = docx.Document(docx_path)
    total_p = len(doc.paragraphs)
    print(f"Loaded {docx_path} ({total_p} paragraphs, {len(doc.tables)} tables)")

    # 1. Pronoun usage
    pronouns = {'tác giả': 0, 'tôi': 0, 'chúng tôi': 0, 'em': 0, 'mình': 0, 'chúng ta': 0, 'nghiên cứu sinh': 0}
    pronoun_locations = {k: [] for k in pronouns}

    # 2. Informal / colloquial / slang words in academic writing
    informal_patterns = [
        (r'\brất là\b', 'rất là (khẩu ngữ -> nên dùng: "rất", "hết sức", "đặc biệt")'),
        (r'\bkhá là\b', 'khá là (khẩu ngữ -> nên dùng: "tương đối", "khá")'),
        (r'\bcực kỳ\b', 'cực kỳ (khẩu ngữ -> nên dùng: "rất", "vô cùng", "đặc biệt")'),
        (r'\bmấy cái\b', 'mấy cái (khẩu ngữ -> nên dùng: "các", "một số")'),
        (r'\bxịn\b', 'xịn (từ lóng -> nên dùng: "hiện đại", "cao cấp")'),
        (r'\bổn áp\b', 'ổn áp (từ lóng)'),
        (r'\bxài\b', 'xài (khẩu ngữ nam bộ -> nên dùng: "sử dụng", "dùng")'),
        (r'\bfix\b', 'fix (tiếng lóng dev -> nên dùng: "khắc phục", "sửa lỗi", "xử lý")'),
        (r'\bbug\b', 'bug (thuật ngữ dev -> nên dùng: "lỗi phần mềm", "khiếm khuyết")'),
        (r'\bcode\b', 'code (từ mượn -> nên dùng: "mã nguồn", "lập trình")'),
        (r'\btool\b', 'tool (từ mượn -> nên dùng: "công cụ", "tiện ích")'),
        (r'\bđược cái\b', 'được cái (khẩu ngữ)'),
        (r'\bkiểu như\b', 'kiểu như (khẩu ngữ)'),
        (r'\bnói chung\b', 'nói chung (khẩu ngữ)'),
    ]

    informal_findings = Counter()
    informal_examples = []

    # 3. Punctuation spacing anomalies
    # Space before comma/dot/colon: e.g. "từ , " or "từ . " or "từ : "
    punct_errors = []
    # Double spaces: "  "
    double_spaces = []
    # Lowercase at sentence beginning after dot
    sentence_cap_errors = []

    for i, p in enumerate(doc.paragraphs):
        text = p.text
        text_lower = text.lower()

        # Check pronouns (exclude Lời cảm ơn and Phụ lục check)
        is_academic_body = (171 <= i <= 1466)
        if is_academic_body:
            for pr in pronouns:
                matches = list(re.finditer(r'\b' + re.escape(pr) + r'\b', text_lower))
                if matches:
                    pronouns[pr] += len(matches)
                    pronoun_locations[pr].append((i, text[:60]))

        # Check informal patterns
        if is_academic_body:
            for pat, desc in informal_patterns:
                m = list(re.finditer(pat, text_lower))
                if m:
                    informal_findings[desc] += len(m)
                    informal_examples.append((i, desc, text[:80]))

        # Check punctuation spacing errors
        sp_punct = list(re.finditer(r'\w\s+[,.:;?!]', text))
        if sp_punct and is_academic_body and not text.startswith('Hình') and not text.startswith('Bảng'):
            punct_errors.append((i, text[:80]))

        if '  ' in text and is_academic_body and not text.startswith('Hình') and not text.startswith('Bảng'):
            double_spaces.append((i, text[:80]))

    print("\n" + "="*70)
    print("1. ĐẠI TỪ NHÂN XƯNG TRONG PHẦN NỘI DUNG CHÍNH (P[171] - P[1466])")
    print("="*70)
    for pr, count in pronouns.items():
        print(f"  - '{pr}': {count} lần")
        if pr in ['tôi', 'chúng tôi', 'em', 'mình'] and count > 0:
            print(f"    -> Xuất hiện tại: {pronoun_locations[pr][:5]}")

    print("\n" + "="*70)
    print("2. TỪ NGỮ KHẨU NGỮ, TỪ LÓNG DEV HOẶC CHƯA CHUẨN HÓA HỌC THUẬT")
    print("="*70)
    if informal_findings:
        for desc, count in informal_findings.most_common():
            print(f"  - {desc}: {count} lần")
        print("\nMột số ví dụ cụ thể:")
        for idx, desc, sample in informal_examples[:10]:
            print(f"    + P[{idx}]: [{desc}] -> \"{sample}...\"")
    else:
        print("  Không phát hiện từ ngữ khẩu ngữ hoặc từ lóng.")

    print("\n" + "="*70)
    print("3. QUY CHUẨN DẤU CÂU VÀ KHOẢNG TRẮNG (TYPOGRAPHY & PUNCTUATION)")
    print("="*70)
    print(f"  - Đoạn văn có khoảng trắng thừa trước dấu câu (ví dụ 'từ , '): {len(punct_errors)}")
    for idx, sample in punct_errors[:5]:
        print(f"    + P[{idx}]: \"{sample}...\"")

    print(f"  - Đoạn văn có lỗi dấu cách đôi ('  '): {len(double_spaces)}")
    for idx, sample in double_spaces[:5]:
        print(f"    + P[{idx}]: \"{sample}...\"")

if __name__ == "__main__":
    audit_diction("BaoCaoDoAn_ChinhSua_HoanThien.docx")

