# -*- coding: utf-8 -*-
import sys
import io
import docx

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc = docx.Document("BaoCaoDoAn_DaParaphrase_ChongDaoVan.docx")

# Appendix A tables are around index 113 to 122
for idx in range(113, 123):
    t = doc.tables[idx]
    header = [c.text.strip() for c in t.rows[0].cells]
    first_row = [c.text.strip().replace('\n', ' ') for c in t.rows[1].cells] if len(t.rows) > 1 else []
    print(f"Table index {idx} (rows={len(t.rows)}): Header={header}")
    print(f"   Example: {first_row}")
