import re, sys

sys.stdout.reconfigure(encoding='utf-8')

with open('report/build_report.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's inspect all IMG calls and diagBlock
# diagBlock definition:
# const diagBlock = (entries) => { for (const [k, lead, d] of entries) { body.push(P([b(lead), run(d)])); body.push(...IMG(`diagrams/${k}.png`, DIAG[k], 600, 'auto')); } };

figN = 0

lines = text.split('\n')
for idx, line in enumerate(lines, 1):
    # Check for direct IMG
    m = re.search(r'IMG\(([^)]+)\)', line)
    if m and not line.strip().startswith('function IMG') and not '...IMG(`diagrams/' in line:
        figN += 1
        print(f"Line {idx:4d} | Hinh {figN:2d} | Direct: {m.group(1).strip()[:80]}")
    # Check for diagBlock entries
    m2 = re.search(r'\["(act_\d+|bce_\d+|seq_\d+|uc_\d+)"', line)
    if m2:
        figN += 1
        print(f"Line {idx:4d} | Hinh {figN:2d} | Diag: {m2.group(1)}")

print(f"\nTotal figures: {figN}")
