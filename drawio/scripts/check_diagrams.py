import sys
import os
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding='utf-8')

DRAWIO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

files = sorted([f for f in os.listdir(DRAWIO_DIR) if f.endswith('.drawio')])

for fname in files:
    fpath = os.path.join(DRAWIO_DIR, fname)
    if not os.path.exists(fpath):
        print(f"File not found: {fname}")
        continue
    tree = ET.parse(fpath)
    diags = tree.findall('diagram')
    print(f"\n==========================================")
    print(f"File: {fname} ({len(diags)} tabs)")
    print(f"==========================================")
    for i, diag in enumerate(diags, 1):
        name = diag.get('name')
        diag_id = diag.get('id')
        cells = diag.findall('.//mxCell')
        ids = [c.get('id') for c in cells if c.get('id')]
        dupes = set([x for x in ids if ids.count(x) > 1])
        status = f"DUPES: {dupes}" if dupes else "OK"
        print(f"  Tab {i:02d} [{diag_id}]: {name} (cells={len(cells)}) -> {status}")
