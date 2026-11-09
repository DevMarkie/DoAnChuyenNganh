import zipfile
import re

with zipfile.ZipFile('docs/backups/BaoCaoDoAn_BanDau_CuNhat.docx') as z:
    doc = z.read('word/document.xml')[:4000].decode('utf-8')

m = re.search(r'<w:document[^>]+>', doc)
tag = m.group(0)
ns_dict = {}
for prefix, uri in re.findall(r'xmlns:([^=]+)="([^"]+)"', tag):
    ns_dict[prefix] = uri

print(f"Total namespaces: {len(ns_dict)}")
for k, v in ns_dict.items():
    print(f"    '{k}': '{v}',")
