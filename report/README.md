# 📄 BỘ CÔNG CỤ TỰ ĐỘNG SINH BÁO CÁO ĐỒ ÁN CHUYÊN NGÀNH
**Automated Academic Report Generator (Phenikaa University Formatting Standard)**

Thư mục `report/` chứa toàn bộ công cụ và dữ liệu tự động hóa để biên dịch báo cáo đồ án tốt nghiệp chuyên ngành định dạng Microsoft Word (`.docx`), tuân thủ chuẩn quy cách định dạng báo cáo khoa học của Trường Đại học Phenikaa.

---

## 📁 Cấu trúc thư mục

```text
report/
├── build_report.js                         # Kịch bản chính tổng hợp nội dung và xuất file Word .docx
├── supplement_content.js                   # Khối nội dung bổ sung (kiến trúc, ca kiểm thử, quy chuẩn đào tạo)
├── diagram_captions.json                   # Từ điển chú thích tự động cho toàn bộ sơ đồ và ảnh chụp
├── list_figures.py                         # Tiện ích thống kê và đánh chỉ mục danh mục hình vẽ
├── split_pages.mjs / render_pages.mjs      # Tiện ích bóc tách trang và kết xuất từ sơ đồ DrawIO
├── capture_report_shots.mjs                # Tiện ích tự động chụp ảnh màn hình giao diện phục vụ chèn báo cáo
├── capture_warning_shot.mjs                # Tiện ích chụp minh chứng màn hình cảnh báo học vụ
├── assets/                                 # Thư mục lưu trữ hình ảnh biểu đồ, logo và sơ đồ chèn vào báo cáo
├── BaoCao_DoAn_SMS_capnhat_latest_2.docx   # File Word báo cáo hoàn chỉnh được xuất ra tự động
└── package.json                            # Khai báo phụ viện (docx ^9.9.0)
```

---

## ⚙️ Các tính năng tự động hóa cốt lõi

1. **Chuẩn hóa quy cách định dạng:**
   - Font chữ: Times New Roman, cỡ 13pt (nội dung), 14pt Bold (tiêu đề).
   - Canh lề: Top 2.0 cm, Bottom 2.0 cm, Left 3.0 cm, Right 2.0 cm (chuẩn đóng gáy đồ án Phenikaa).
   - Đánh số mục phân cấp tự động (Chương 1, 1.1, 1.1.1).
   - Header/Footer tự động hiển thị tên đề tài và số trang.

2. **Tự động nhúng hình ảnh và bảng biểu:**
   - Tự động quét và nhúng 30+ ảnh sơ đồ UML (Use Case, BCE, Sequence, Activity) từ DrawIO.
   - Tự động nhúng bảng từ điển dữ liệu 18 bảng CSDL và ma trận kiểm thử E2E.
   - Tự động sinh danh mục hình vẽ (List of Figures) và danh mục bảng (List of Tables).

---

## 🚀 Hướng dẫn sinh báo cáo

Cài đặt phụ thuộc (nếu chưa cài):
```bash
cd report
npm install
```

Chạy kịch bản sinh file Word:
```bash
node build_report.js
```
File báo cáo kết quả sẽ được tạo tại: `report/BaoCao_DoAn_SMS_capnhat_latest_2.docx`.

