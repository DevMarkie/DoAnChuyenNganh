# -*- coding: utf-8 -*-
import zipfile, os

docx_path = "BaoCaoDoAn_ChinhSua_HoanThien.docx"
with zipfile.ZipFile(docx_path, 'r') as z:
    media_files = [f for f in z.namelist() if f.startswith('word/media/')]
    print(f"Total media files embedded in {docx_path}: {len(media_files)}")
    for f in media_files[:10]:
        info = z.getinfo(f)
        print(f"  {f:30} | {info.file_size/1024:8.1f} KB")

