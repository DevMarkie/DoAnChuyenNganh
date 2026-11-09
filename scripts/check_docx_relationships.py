# -*- coding: utf-8 -*-
import zipfile
import re

with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as z:
    rels_xml = z.read("word/_rels/document.xml.rels").decode("utf-8")
    doc_xml = z.read("word/document.xml").decode("utf-8")
    content_types = z.read("[Content_Types].xml").decode("utf-8")

print(f"Rels size: {len(rels_xml)}")
print(f"Content_types size: {len(content_types)}")

# Check if all r:id referenced in doc_xml exist in rels_xml!
rids_in_doc = set(re.findall(r'r:id="([^"]+)"', doc_xml) + re.findall(r'r:embed="([^"]+)"', doc_xml))
rids_in_rels = set(re.findall(r'Id="([^"]+)"', rels_xml))

missing_rids = rids_in_doc - rids_in_rels
print(f"Total r:id in doc: {len(rids_in_doc)}")
print(f"Total Id in rels: {len(rids_in_rels)}")
print(f"Missing r:id in rels: {len(missing_rids)}")
if missing_rids:
    print("MISSING RIDS:", list(missing_rids)[:10])

# Check if all targets in rels exist in zip!
zip_files = set(z.namelist())
targets = re.findall(r'Target="([^"]+)"', rels_xml)
missing_targets = []
for t in targets:
    if not t.startswith('http') and not t.startswith('mailto'):
        full_path = 'word/' + t if not t.startswith('word/') else t
        if full_path not in zip_files:
            missing_targets.append(t)
print(f"Missing image/part targets in zip: {len(missing_targets)}")
if missing_targets:
    print("MISSING TARGETS:", missing_targets[:10])
