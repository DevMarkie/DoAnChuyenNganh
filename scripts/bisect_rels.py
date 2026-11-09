# -*- coding: utf-8 -*-
import sys
import io
import os
import zipfile
import xml.etree.ElementTree as ET
import win32com.client

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load good rels
with zipfile.ZipFile("docs/backups/BaoCaoDoAn_BanDau_CuNhat.docx") as zg:
    good_rels_str = zg.read("word/_rels/document.xml.rels").decode("utf-8")

# Load test rels
with zipfile.ZipFile("test_perfect_ns.docx") as zt:
    test_rels_str = zt.read("word/_rels/document.xml.rels").decode("utf-8")

g_tree = ET.fromstring(good_rels_str.encode("utf-8"))
t_tree = ET.fromstring(test_rels_str.encode("utf-8"))

g_rels = list(g_tree)
t_rels = list(t_tree)

# Map from id to rel element
g_dict = {rel.attrib['Id']: rel for rel in g_rels}
t_dict = {rel.attrib['Id']: rel for rel in t_rels}

extra_ids = sorted(list(set(t_dict.keys()) - set(g_dict.keys())), key=lambda x: int(x.replace('rId', '')))
print(f"Extra IDs in test_rels ({len(extra_ids)}): {extra_ids}")

# Check differences in shared IDs
changed_ids = []
for rid, rel in g_dict.items():
    t_rel = t_dict[rid]
    if rel.attrib != t_rel.attrib:
        changed_ids.append((rid, rel.attrib, t_rel.attrib))
print(f"Changed IDs in shared: {len(changed_ids)}")
for c in changed_ids:
    print("  ", c)
