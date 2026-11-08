# -*- coding: utf-8 -*-
import sys
import io
import os
import re
import glob

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("=== E2E TESTS (frontend/e2e) ===")
e2e_files = glob.glob("frontend/e2e/*.spec.js")
total_e2e = 0
for ef in e2e_files:
    with open(ef, "r", encoding="utf-8", errors="ignore") as f:
        txt = f.read()
    tests = re.findall(r'test\s*\(\s*[\'"`](.*?)[\'"`]', txt)
    print(f"  {os.path.basename(ef)}: {len(tests)} tests")
    total_e2e += len(tests)
print(f"Total Playwright E2E: {total_e2e}")

print("\n=== TESTS DIRECTORY (tests/) ===")
test_dirs = ['e2e', 'integration', 'security', 'smoke', 'performance', 'non_functional']
for td in test_dirs:
    files = glob.glob(f"tests/{td}/*.js") + glob.glob(f"tests/{td}/*.cjs")
    print(f"- tests/{td}: {len(files)} files")
    for f in sorted(files):
        print(f"    * {os.path.basename(f)}")

# Check Chrome DevTools tests
cdt_files = glob.glob("tests/*chrome_devtools*.js")
print(f"\n- Chrome DevTools audits: {len(cdt_files)} files -> {[os.path.basename(f) for f in cdt_files]}")
