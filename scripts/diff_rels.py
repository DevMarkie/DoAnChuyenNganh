# -*- coding: utf-8 -*-
import sys
import io
import zipfile
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with zipfile.ZipFile("docs/backups/BaoCaoDoAn_BanDau_CuNhat.docx", "r") as z1:
    rels1 = z1.read("word/_rels/document.xml.rels").decode("utf-8")

with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as z2:
    rels2 = z2.read("word/_rels/document.xml.rels").decode("utf-8")

r1 = {k: (t, tg) for k, t, tg in re.findall(r'Id="([^"]+)"\s+Type="([^"]+)"\s+Target="([^"]+)"', rels1)}
r2 = {k: (t, tg) for k, t, tg in re.findall(r'Id="([^"]+)"\s+Type="([^"]+)"\s+Target="([^"]+)"', rels2)}

print(f"Rels in Good: {len(r1)}")
print(f"Rels in Bad: {len(r2)}")

added_in_bad = set(r2.keys()) - set(r1.keys())
print(f"Added in Bad ({len(added_in_bad)}):", added_in_bad)

removed_in_bad = set(r1.keys()) - set(r2.keys())
print(f"Removed in Bad ({len(removed_in_bad)}):", removed_in_bad)

changed_in_bad = {k: (r1[k], r2[k]) for k in set(r1.keys()) & set(r2.keys()) if r1[k] != r2[k]}
print(f"Changed in Bad ({len(changed_in_bad)}):", changed_in_bad)
