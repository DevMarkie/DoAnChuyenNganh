import zipfile
import xml.etree.ElementTree as ET

with zipfile.ZipFile("docs/backups/BaoCaoDoAn_BanDau_CuNhat.docx") as zg:
    good_rels_str = zg.read("word/_rels/document.xml.rels").decode("utf-8")

with zipfile.ZipFile("test_perfect_ns.docx") as zt:
    test_rels_str = zt.read("word/_rels/document.xml.rels").decode("utf-8")

print("--- GOOD RELS SYNTAX CHECK ---")
try:
    g_tree = ET.fromstring(good_rels_str.encode("utf-8"))
    print(f"Good rels valid XML, total rels: {len(list(g_tree))}")
except Exception as e:
    print("Good rels XML error:", e)

print("--- TEST RELS SYNTAX CHECK ---")
try:
    t_tree = ET.fromstring(test_rels_str.encode("utf-8"))
    print(f"Test rels valid XML, total rels: {len(list(t_tree))}")
except Exception as e:
    print("Test rels XML error:", e)

# Check differences in relationships:
g_map = {rel.attrib['Id']: (rel.attrib.get('Type'), rel.attrib.get('Target')) for rel in g_tree}
t_map = {rel.attrib['Id']: (rel.attrib.get('Type'), rel.attrib.get('Target')) for rel in t_tree}

print("In Good but not Test:", set(g_map.keys()) - set(t_map.keys()))
print("In Test but not Good:", set(t_map.keys()) - set(g_map.keys()))

for k in g_map:
    if k in t_map and g_map[k] != t_map[k]:
        print(f"Diff for {k}:")
        print(f"  Good: {g_map[k]}")
        print(f"  Test: {t_map[k]}")
