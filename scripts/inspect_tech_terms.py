# -*- coding: utf-8 -*-
import docx, re

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')

def search_term(pattern, label):
    print(f"\n=== {label} ===")
    count = 0
    for i, p in enumerate(doc.paragraphs):
        if 171 <= i <= 1466:
            text = p.text
            matches = list(re.finditer(pattern, text, re.IGNORECASE))
            if matches:
                count += len(matches)
                for m in matches:
                    start = max(0, m.start() - 25)
                    end = min(len(text), m.end() + 25)
                    print(f"P[{i}]: ...{text[start:end]}...")
    print(f"Total: {count}")

search_term(r'\btest cases?\b', "test case / test cases")
search_term(r'\bcực kỳ\b', "cực kỳ")
search_term(r'\bbug\b(?!\s*-\s*\d+)', "bug (không phải BUG-xx)")
search_term(r'(?<!qr\s)(?<!acm\s)(?<!http\s)(?<!status\s)\bcode\b', "code (không phải QR code, ACM Code, status code)")

