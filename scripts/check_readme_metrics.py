# -*- coding: utf-8 -*-
import sys
import io
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open("README.md", "r", encoding="utf-8") as f:
    readme = f.read()

print("=== CHECK NUMBERS IN README.MD ===")
queries = [
    r'(\d+)\s*(?:Controllers|controllers)',
    r'(\d+)\s*(?:Tables|bảng)',
    r'(\d+)\s*(?:Tests|ca kiểm thử|test)',
    r'(\d+)\s*JUnit',
    r'(\d+)\s*Vitest',
    r'(\d+)\s*E2E',
    r'(\d+)\s*Draw\.io',
    r'(\d+)\s*vai trò',
]

for q in queries:
    m = re.findall(q, readme, re.IGNORECASE)
    print(f"{q}: {m}")
