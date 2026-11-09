# -*- coding: utf-8 -*-
import sys
import io
import os
import re
import glob

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

test_files = sorted(glob.glob("backend/src/test/java/**/*.java", recursive=True))

actual_counts = {}
for tf in test_files:
    with open(tf, "r", encoding="utf-8", errors="ignore") as f:
        txt = f.read()
    c = len(re.findall(r'@Test\b', txt))
    actual_counts[os.path.basename(tf).replace(".java", "")] = c

for k, v in sorted(actual_counts.items()):
    print(f"'{k}': {v},")
