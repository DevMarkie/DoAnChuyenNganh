import zipfile
import re
import xml.etree.ElementTree as ET

# Load cleaned rels
with zipfile.ZipFile("test_clean_rels_good_doc.docx") as z:
    rels_xml = z.read("word/_rels/document.xml.rels")
tree = ET.fromstring(rels_xml)
available_rids = {rel.attrib['Id']: rel.attrib.get('Target') for rel in tree}
print(f"Total available rIds in rels: {len(available_rids)}")

# Load test_doc
with zipfile.ZipFile("test_perfect_ns.docx") as z:
    doc_xml = z.read("word/document.xml").decode("utf-8")

# Find all rId references in doc_xml
# e.g. r:id="rId...", r:embed="rId..."
referenced_rids = set(re.findall(r'r:(?:id|embed)="([^"]+)"', doc_xml))
print(f"Total referenced rIds in doc_xml: {len(referenced_rids)}")

missing_in_rels = referenced_rids - set(available_rids.keys())
print(f"Referenced rIds MISSING in rels: {missing_in_rels}")

for rid in missing_in_rels:
    # Find context where it appears
    matches = re.findall(rf'(\<[^\>]+{rid}[^\>]*\>)', doc_xml)
    print(f"  {rid} appears in:")
    for m in matches:
        print("   ", m)
