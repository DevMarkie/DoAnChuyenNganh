# -*- coding: utf-8 -*-
import sys
import io
import os
import re
import glob

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

test_files = glob.glob("frontend/src/**/*.test.*", recursive=True) + glob.glob("frontend/src/**/*.spec.*", recursive=True)
print(f"Total Vitest files: {len(test_files)}")

total = 0
for tf in test_files:
    with open(tf, "r", encoding="utf-8", errors="ignore") as f:
        txt = f.read()
    tests = re.findall(r'(?:it|test)\s*\(\s*[\'"`](.*?)[\'"`]', txt)
    print(f"  {os.path.basename(tf)}: {len(tests)} tests")
    total += len(tests)

print(f"Total Vitest tests: {total}")
