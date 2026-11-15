# -*- coding: utf-8 -*-
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/extracted_images/fig_map.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for item in data:
    caption = item['caption']
    for k in ('Hình 1.', 'Hình 6.', 'Hình 14.', 'BPA-04', 'BPA-07', '128.', '129.', '130.', '131.', '135.', '136.', '140.', '144.', '145.', '146.', '147.', '148.', '149.'):
        if k in caption:
            print(f"{item['index']:3d}: {caption[:85]} -> {item['file']}")
            break
