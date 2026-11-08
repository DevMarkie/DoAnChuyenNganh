# -*- coding: utf-8 -*-
import os
import sys
import io
import re
import glob

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("="*70)
print("KIỂM TRA HIỆN TRẠNG DỰ ÁN THỰC TẾ (GROUND TRUTH AUDIT)")
print("="*70)

# 1. Backend Controllers
controllers = glob.glob("backend/src/main/java/com/sms/controller/*.java")
print(f"1. Backend Controllers: {len(controllers)}")
for c in sorted(controllers):
    print(f"   - {os.path.basename(c)}")

# 2. Backend Services
services = glob.glob("backend/src/main/java/com/sms/service/*.java")
print(f"\n2. Backend Services: {len(services)}")
for s in sorted(services):
    print(f"   - {os.path.basename(s)}")

# 3. Backend Entities
entities = glob.glob("backend/src/main/java/com/sms/entity/*.java")
print(f"\n3. Backend Entities: {len(entities)}")
for e in sorted(entities):
    print(f"   - {os.path.basename(e)}")

# 4. Backend Repositories
repos = glob.glob("backend/src/main/java/com/sms/repository/*.java")
print(f"\n4. Backend Repositories: {len(repos)}")

# 5. Database Schema
schema_path = "database/schema.sql"
if os.path.exists(schema_path):
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    tables = re.findall(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([a-zA-Z0-9_]+)`?', schema_sql, re.IGNORECASE)
    views = re.findall(r'CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+`?([a-zA-Z0-9_]+)`?', schema_sql, re.IGNORECASE)
    print(f"\n5. Database Tables in schema.sql: {len(tables)}")
    print(f"   Tables: {sorted(tables)}")
    print(f"   Database Views: {len(views)} -> {views}")

# 6. Database Migrations
migrations = glob.glob("database/migrations/*.sql")
print(f"\n6. Database Migrations: {len(migrations)}")
for m in sorted(migrations):
    print(f"   - {os.path.basename(m)}")

# 7. Draw.io files and tabs
import xml.etree.ElementTree as ET
drawio_files = glob.glob("drawio/*.drawio")
print(f"\n7. Draw.io Files: {len(drawio_files)}")
total_tabs = 0
for df in sorted(drawio_files):
    try:
        tree = ET.parse(df)
        root = tree.getroot()
        diagrams = root.findall('diagram')
        total_tabs += len(diagrams)
        print(f"   - {os.path.basename(df)}: {len(diagrams)} tabs")
    except Exception as ex:
        print(f"   - {os.path.basename(df)}: error parsing ({ex})")
print(f"   -> TỔNG SỐ TABS DRAW.IO: {total_tabs}")

# 8. Test Counts
print(f"\n8. Test Suite Counts:")
# JUnit Tests
junit_tests = glob.glob("backend/src/test/java/**/*.java", recursive=True)
junit_test_methods = 0
for jf in junit_tests:
    with open(jf, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
        methods = re.findall(r'@Test\b', content)
        junit_test_methods += len(methods)
print(f"   - JUnit 5 Test files: {len(junit_tests)}, Test methods (@Test): {junit_test_methods}")

# Vitest Tests
vitest_files = glob.glob("frontend/src/**/*.test.{js,jsx,ts,tsx}", recursive=True) + glob.glob("frontend/src/**/*.spec.{js,jsx,ts,tsx}", recursive=True)
vitest_methods = 0
for vf in vitest_files:
    with open(vf, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
        methods = re.findall(r'\b(?:it|test)\s*\(', content)
        vitest_methods += len(methods)
print(f"   - Vitest Test files: {len(vitest_files)}, Test cases: {vitest_methods}")

# Playwright E2E Tests
e2e_files = glob.glob("frontend/e2e/*.spec.js")
e2e_methods = 0
for ef in e2e_files:
    with open(ef, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
        methods = re.findall(r'\btest\s*\(', content)
        e2e_methods += len(methods)
print(f"   - Playwright E2E files: {len(e2e_files)}, Test cases: {e2e_methods}")

# Non-functional / other tests
test_dir_files = glob.glob("tests/**/*.js", recursive=True)
print(f"   - Tests folder files: {len(test_dir_files)}")

# 9. Frontend Pages and Components
pages = glob.glob("frontend/src/pages/**/*.jsx", recursive=True)
components = glob.glob("frontend/src/components/**/*.jsx", recursive=True)
print(f"\n9. Frontend Architecture:")
print(f"   - Pages: {len(pages)}")
print(f"   - Components: {len(components)}")

# 10. Technology versions from package.json and pom.xml
print(f"\n10. Technology Stack Versions:")
if os.path.exists("backend/pom.xml"):
    with open("backend/pom.xml", "r", encoding="utf-8") as f:
        pom = f.read()
    sb_ver = re.search(r'<spring-boot\.version>([^<]+)</spring-boot\.version>', pom) or re.search(r'<artifactId>spring-boot-starter-parent</artifactId>\s*<version>([^<]+)</version>', pom)
    java_ver = re.search(r'<java\.version>([^<]+)</java\.version>', pom)
    print(f"   - Spring Boot: {sb_ver.group(1) if sb_ver else 'unknown'}")
    print(f"   - Java: {java_ver.group(1) if java_ver else 'unknown'}")

if os.path.exists("frontend/package.json"):
    with open("frontend/package.json", "r", encoding="utf-8") as f:
        pkg = f.read()
    react_ver = re.search(r'"react":\s*"([^"]+)"', pkg)
    vite_ver = re.search(r'"vite":\s*"([^"]+)"', pkg)
    tw_ver = re.search(r'"tailwindcss":\s*"([^"]+)"', pkg)
    print(f"   - React: {react_ver.group(1) if react_ver else 'unknown'}")
    print(f"   - Vite: {vite_ver.group(1) if vite_ver else 'unknown'}")
    print(f"   - Tailwind CSS: {tw_ver.group(1) if tw_ver else 'unknown'}")
