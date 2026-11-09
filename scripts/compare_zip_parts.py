# -*- coding: utf-8 -*-
import zipfile

with zipfile.ZipFile("docs/backups/BaoCaoDoAn_BanDau_CuNhat.docx", "r") as z1:
    names1 = set(z1.namelist())

with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as z2:
    names2 = set(z2.namelist())

print("Files in z1 but not in z2:", names1 - names2)
print("Files in z2 but not in z1:", names2 - names1)

# Check settings.xml, webSettings.xml, styles.xml
for xml_name in ['word/settings.xml', 'word/webSettings.xml', 'word/styles.xml', 'word/fontTable.xml', '[Content_Types].xml']:
    with zipfile.ZipFile("docs/backups/BaoCaoDoAn_BanDau_CuNhat.docx", "r") as z1:
        s1 = z1.read(xml_name) if xml_name in z1.namelist() else None
    with zipfile.ZipFile("BaoCaoDoAn_ChinhSua_HoanThien.docx", "r") as z2:
        s2 = z2.read(xml_name) if xml_name in z2.namelist() else None
    print(f"{xml_name}: in_z1={s1 is not None}, in_z2={s2 is not None}, identical={s1 == s2}")
