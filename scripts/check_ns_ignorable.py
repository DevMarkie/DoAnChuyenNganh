import zipfile
import re

with zipfile.ZipFile('test_fixed_ns.docx') as z:
    doc = z.read('word/document.xml')[:3000].decode('utf-8')

m = re.search(r'<w:document[^>]+>', doc)
if m:
    tag = m.group(0)
    print("TAG LENGTH:", len(tag))
    ignorable = re.search(r'Ignorable="([^"]+)"', tag)
    if ignorable:
        prefixes = ignorable.group(1).split()
        print("Ignorable prefixes:", prefixes)
        for p in prefixes:
            if f'xmlns:{p}=' not in tag:
                print(f"MISSING DECLARATION FOR: {p} in xmlns!")
            else:
                print(f"FOUND: {p}")
