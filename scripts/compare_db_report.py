# -*- coding: utf-8 -*-
import sys
import io
import os
import re
import glob
import docx

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open("database/schema.sql", "r", encoding="utf-8") as f:
    sql = f.read()

db_tables = re.findall(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([a-zA-Z0-9_]+)`?', sql, re.IGNORECASE)
print(f"Tables in database/schema.sql ({len(db_tables)}):")
print(db_tables)

# Entities in backend
entity_files = glob.glob("backend/src/main/java/com/sms/entity/*.java")
entity_tables = {}
for ef in entity_files:
    with open(ef, "r", encoding="utf-8") as f:
        c = f.read()
    m = re.search(r'@Table\s*\(\s*name\s*=\s*"([^"]+)"', c)
    if m:
        entity_tables[os.path.basename(ef)] = m.group(1)
    else:
        entity_tables[os.path.basename(ef)] = None

print(f"\nJPA Entities ({len(entity_files)}):")
for k, v in sorted(entity_tables.items()):
    print(f"  {k} -> table: {v}")

# Tables in Word doc Table 35
doc = docx.Document("BaoCaoDoAn_DaParaphrase_ChongDaoVan.docx")
t35 = doc.tables[74]
t35_tables = []
for r in t35.rows[1:]:
    name = r.cells[1].text.strip()
    t35_tables.append(name)
print(f"\nTables in Table 35 of Word doc ({len(t35_tables)}):")
print(t35_tables)

# Tables in Table 75 (Table index 125) of Word doc
t75 = doc.tables[125]
t75_tables = []
for r in t75.rows[1:]:
    name = r.cells[0].text.strip()
    t75_tables.append(name)
print(f"\nTables in Table 75 of Word doc ({len(t75_tables)}):")
print(t75_tables)

print("\n--- COMPARISON ---")
diff_db_vs_t35 = set(db_tables) - set(t35_tables)
print(f"Tables in DB but not in Table 35 ({len(diff_db_vs_t35)}): {diff_db_vs_t35}")

diff_t35_vs_db = set(t35_tables) - set(db_tables)
print(f"Tables in Table 35 but not in DB ({len(diff_t35_vs_db)}): {diff_t35_vs_db}")
