"""
scripts/export_pdf.py
Xuất tệp Word hoàn thiện sang PDF thông qua win32com.client,
tự động cập nhật Mục lục (TOC), Danh mục hình (TOF), Danh mục bảng (TOT)
và các trường liên kết trước khi xuất sang PDF.
"""
import os
import sys
import io
import win32com.client

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    docx_path = os.path.join(root_dir, "BaoCaoDoAn_ChinhSua_HoanThien.docx")
    pdf_path = os.path.join(root_dir, "BaoCaoDoAn.pdf")

    if not os.path.exists(docx_path):
        print(f"Error: Không tìm thấy tệp docx tại {docx_path}")
        sys.exit(1)

    print(f"Bắt đầu xử lý Word COM...")
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    word.DisplayAlerts = 0

    try:
        print(f"Đang mở tệp: {docx_path}...")
        doc = word.Documents.Open(docx_path, ReadOnly=False)

        print("Đang cập nhật Mục lục (TOC), Danh mục hình và bảng...")
        try:
            for toc in doc.TablesOfContents:
                toc.Update()
        except Exception as e:
            print(f"TOC update notice: {e}")

        try:
            for tof in doc.TablesOfFigures:
                tof.Update()
        except Exception as e:
            print(f"TOF update notice: {e}")

        try:
            doc.Fields.Update()
        except Exception as e:
            print(f"Fields update notice: {e}")

        # Lưu lại docx đã cập nhật mục lục
        doc.Save()

        print(f"Đang xuất PDF sang: {pdf_path}...")
        doc.SaveAs(pdf_path, FileFormat=17) # 17 = wdFormatPDF
        doc.Close(False)
        print("🎉 Xuất PDF và cập nhật tài liệu thành công xuất sắc!")
    except Exception as e:
        print(f"Lỗi trong quá trình xuất PDF: {e}")
        sys.exit(1)
    finally:
        word.Quit()

if __name__ == "__main__":
    main()
