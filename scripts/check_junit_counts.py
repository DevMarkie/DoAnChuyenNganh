# -*- coding: utf-8 -*-
import sys
import io
import os
import re
import glob

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

junit_files = glob.glob("backend/src/test/java/**/*.java", recursive=True)
print(f"Total JUnit files: {len(junit_files)}")

file_tests = []
for jf in junit_files:
    with open(jf, "r", encoding="utf-8", errors="ignore") as f:
        txt = f.read()
    tests = re.findall(r'@Test\b', txt)
    file_tests.append((os.path.basename(jf), len(tests)))

file_tests.sort(key=lambda x: x[1], reverse=True)
for fn, c in file_tests:
    print(f"  {fn}: {c} tests")

print(f"Total: {sum(c for fn, c in file_tests)} tests")
