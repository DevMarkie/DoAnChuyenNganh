# -*- coding: utf-8 -*-
import docx, re

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')

print("=== Tìm lỗi dấu câu thực tế: dấu phẩy, hai chấm, chấm phẩy có dấu cách đằng trước ===")
actual_errors = []
for i, p in enumerate(doc.paragraphs):
    if 171 <= i <= 1466:
        text = p.text
        # Matches a word followed by space, then comma, semicolon, question mark or colon (not followed by word/number)
        matches = list(re.finditer(r'([a-zA-ZÀ-ỹ0-9]+)\s+([,;?])', text))
        if matches:
            for m in matches:
                actual_errors.append((i, m.group(1), m.group(2), text[max(0, m.start()-15):min(len(text), m.end()+15)]))

print(f"Tổng số lỗi dấu phẩy/chấm phẩy/hỏi chấm có khoảng trắng trước: {len(actual_errors)}")
for idx, w, p_mark, context in actual_errors:
    print(f"P[{idx}]: '{context}' (sửa: '{w}{p_mark}')")

