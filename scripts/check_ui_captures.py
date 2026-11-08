# -*- coding: utf-8 -*-
import os, datetime

ui_dir = '.tools/ui_captures'
if os.path.exists(ui_dir):
    files = sorted(os.listdir(ui_dir))
    print(f"Total files in {ui_dir}: {len(files)}")
    for f in files[:10]:
        p = os.path.join(ui_dir, f)
        mtime = datetime.datetime.fromtimestamp(os.path.getmtime(p)).strftime('%Y-%m-%d %H:%M:%S')
        print(f"  {f:20} | {os.path.getsize(p)/1024:8.1f} KB | {mtime}")
else:
    print(f"{ui_dir} does not exist.")

