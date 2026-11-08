# -*- coding: utf-8 -*-
import docx

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')

for i in range(1025, 1037):
    print(f"P[{i}]: {doc.paragraphs[i].text}")

