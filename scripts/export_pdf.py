"""
scripts/export_pdf.py
Xuất tệp Word hoàn thiện sang PDF thông qua win32com.client, đảm bảo ổn định và giải phóng tài nguyên.
"""
import os
import sys
import win32com.client

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    docx_path = os.path.join(root_dir, "BaoCaoDoAn_ChinhSua_HoanThien.docx")
    pdf_path = os.path.join(root_dir, "BaoCaoDoAn.pdf")

    if not os.path.exists(docx_path):
        print(f"Error: Không tìm thấy tệp docx tại {docx_path}")
        sys.exit(1)

    print(f"Bắt đầu xuất PDF từ {docx_path} sang {pdf_path}...")
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    word.DisplayAlerts = 0

    try:
        doc = word.Documents.Open(docx_path, ReadOnly=True)
        doc.SaveAs(pdf_path, FileFormat=17) # 17 = wdFormatPDF
        doc.Close(False)
        print("🎉 Xuất PDF thành công xuất sắc!")
    except Exception as e:
        print(f"Lỗi trong quá trình xuất PDF: {e}")
        sys.exit(1)
    finally:
        word.Quit()

if __name__ == "__main__":
    main()

