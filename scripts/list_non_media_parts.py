# -*- coding: utf-8 -*-
import zipfile
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as z:
    for info in z.infolist():
        if not info.filename.startswith("word/media/"):
            print(f"{info.filename:40}: {info.file_size:8d} bytes (compressed: {info.compress_size:8d})")
