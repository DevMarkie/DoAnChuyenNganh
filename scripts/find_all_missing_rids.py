# -*- coding: utf-8 -*-
import zipfile
import re

with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as z:
    doc_xml = z.read("word/document.xml").decode("utf-8")
    rels = z.read("word/_rels/document.xml.rels").decode("utf-8")

# Find all :id="rId..." or :embed="rId..." or id="rId..."
doc_rids = set(re.findall(r'id="(rId\d+)"', doc_xml, re.IGNORECASE) + re.findall(r'embed="(rId\d+)"', doc_xml, re.IGNORECASE))
rels_rids = {k: (t, tg) for k, t, tg in re.findall(r'Id="(rId\d+)"\s+Type="([^"]+)"\s+Target="([^"]+)"', rels)}

missing_in_rels = doc_rids - set(rels_rids.keys())
print(f"Total rIds referenced in document.xml: {len(doc_rids)}")
print(f"Total rIds defined in rels: {len(rels_rids)}")
print(f"MISSING IN RELS ({len(missing_in_rels)}): {missing_in_rels}")

for m in sorted(missing_in_rels):
    # Print the XML context where this missing rId is used
    contexts = re.findall(rf'.{{0,60}}{m}.{{0,60}}', doc_xml)
    print(f"\nContexts for {m}:")
    for c in contexts[:3]:
        print("  ", c.strip())
