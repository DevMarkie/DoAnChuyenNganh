import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/extracted_images/fig_map.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for item in data:
    caption = item['caption']
    for k in ['kiến trúc', 'Kiến trúc', 'Sequence', 'tuần tự', 'Tuần tự', 'BCE', 'Hoạt động', 'hoạt động']:
        if k in caption:
            print(f"{item['index']:3d}: {caption[:85]} -> {item['file']}")
            break
