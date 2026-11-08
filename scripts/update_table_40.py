# -*- coding: utf-8 -*-
"""
scripts/update_table_40.py
Adds the 6 specialized modules to Bảng 40 (UI Component Inventory Matrix) in
BaoCaoDoAn_ChinhSua_HoanThien.docx, expanding it from 16 to 22 rows.
"""

import docx
from docx.shared import Pt

def update_table_40(docx_path):
    print(f"Loading document: {docx_path}")
    doc = docx.Document(docx_path)
    body = doc._body._element

    # Find paragraph 1030
    p1030 = doc.paragraphs[1030]._element
    p1030_idx = body.index(p1030)
    tbl_elem = body[p1030_idx - 1]

    target_table = None
    for t in doc.tables:
        if t._element == tbl_elem:
            target_table = t
            break

    if not target_table:
        print("Error: Could not locate Table 40!")
        return

    print(f"Current rows in Table 40: {len(target_table.rows)}")

    new_rows_data = [
        [
            "Quản trị Nhân sự Đào tạo",
            "StaffsPage.jsx, StaffModal.jsx",
            "Phân bổ thẩm quyền 4 vai trò cán bộ, phân công khoa quản lý, khóa/mở tài khoản chuyên viên, đặt lại mật khẩu",
            "Scoped RBAC, TableSkeleton"
        ],
        [
            "Thu ngân & Công nợ Học phí",
            "TuitionCashierPage.jsx, PaymentReceiptModal.jsx",
            "Tra cứu mã sinh viên, thu học phí tại quầy, xuất biên lai điện tử PDF/in nhiệt, xét duyệt gia hạn hạn nộp học phí",
            "Financial Audit, Print/Export"
        ],
        [
            "Khảo thí & Quản lý Phòng thi",
            "ExamRoomsPage.jsx, StudentExamSchedulePage.jsx, ExamGradeImportModal.jsx",
            "Thuật toán tự động chia phòng thi và đánh SBD (autoAssignRooms), in danh sách phòng thi rọc phách bảo mật, sinh viên xem lịch thi",
            "Exam Security, Blind Grading"
        ],
        [
            "Thẩm định Đính chính Điểm 3 Cấp",
            "GradeAmendmentsPage.jsx, AmendmentDetailModal.jsx",
            "Quy trình kiểm soát đính chính điểm sau chốt sổ: Giảng viên đề xuất → Trưởng khoa thẩm tra → Phòng Đào tạo phê duyệt chính thức",
            "3-Tier Approval, Audit Trail"
        ],
        [
            "Thẩm định Tốt nghiệp Đa Tiêu chí TT08",
            "GraduationPage.jsx, DegreeAuditResponse.jsx",
            "Động cơ tự động đối soát 6 tiêu chuẩn TT08 (tổng tín chỉ, GPA/CPA, chuẩn ngoại ngữ/tin học, GDQP), thẩm định theo khóa và xuất quyết định",
            "DegreeAudit TT08, Batch Audit"
        ],
        [
            "Điểm rèn luyện & Khen thưởng Kỷ luật",
            "StudentConductPage.jsx, ConductRecordModal.jsx",
            "Ghi nhận điểm rèn luyện theo kỳ, quản lý quyết định khen thưởng / kỷ luật, đồng bộ hồ sơ xét học bổng và danh hiệu thi đua",
            "Conduct Matrix, Academic Policy"
        ]
    ]

    for row_values in new_rows_data:
        row = target_table.add_row()
        for col_idx, val in enumerate(row_values):
            cell = row.cells[col_idx]
            cell.text = val
            for p in cell.paragraphs:
                for r in p.runs:
                    r.font.name = "Times New Roman"
                    r.font.size = Pt(10)

    print(f"Updated rows in Table 40: {len(target_table.rows)}")

    doc.save(docx_path)
    print(f"Saved document successfully to {docx_path}")

if __name__ == "__main__":
    update_table_40("BaoCaoDoAn_ChinhSua_HoanThien.docx")

