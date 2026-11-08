# -*- coding: utf-8 -*-
import sys
import io
import docx

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc1 = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')
doc2 = docx.Document('BaoCaoDoAn_DaParaphrase_ChongDaoVan.docx')

diffs = []
for i, (p1, p2) in enumerate(zip(doc1.paragraphs, doc2.paragraphs)):
    if p1.text.strip() != p2.text.strip():
        diffs.append((i, p1.text.strip(), p2.text.strip()))

print(f"Total different paragraphs: {len(diffs)}")
for idx, (p_idx, t1, t2) in enumerate(diffs[:15]):
    print(f"\n--- [{idx+1}] Paragraph P[{p_idx}] ---")
    print(f"HOANTHIEN:   {t1[:120]}...")
    print(f"PARAPHRASE:  {t2[:120]}...")
