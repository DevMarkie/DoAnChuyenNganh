# -*- coding: utf-8 -*-
import docx

doc = docx.Document('BaoCaoDoAn_ChinhSua_HoanThien.docx')
test_img_path = '.tools/ui_captures/ui_83.png'
r = doc.part.get_or_add_image(test_img_path)
print("r:", type(r), r)
rId, image = r
print("rId:", rId)
print("doc.part.rels[rId]:", doc.part.rels[rId].target_ref)
