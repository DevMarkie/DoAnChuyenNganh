import { useState, useRef } from "react";
import { FileDown, Upload, X, CheckCircle2, AlertCircle, Users, Check, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";
import { studentService } from "../../services/dataService";

/**
 * Modal tiếp nhận sinh viên hàng loạt qua Excel 2 pha:
 * Pha 1: Chọn / Kéo thả file + Tải file mẫu (.xlsx)
 * Pha 2: Bảng xem trước dữ liệu (Preview), phân loại dòng hợp lệ / lỗi, đối soát trước khi lưu
 */
export default function StudentImportModal({ onImportDone }) {
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [previewRows, setPreviewRows] = useState(null);
  const [filterTab, setFilterTab] = useState("ALL"); // 'ALL' | 'VALID' | 'ERROR'
  const [importing, setImporting] = useState(false);
  const [savingImport, setSavingImport] = useState(false);
  const fileInputRef = useRef(null);

  // ── Handlers ──────────────────────────────────────────────

  const handleDownloadTemplate = async () => {
    try {
      const res = await studentService.downloadImportTemplate();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Mau_Nhap_Sinh_Vien.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Đã tải file Excel mẫu nhập sinh viên!");
    } catch {
      toast.error("Lỗi khi tải file mẫu");
    }
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const processImportFile = async (file) => {
    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      toast.error("Vui lòng chọn file Excel có định dạng .xlsx hoặc .xls");
      return;
    }
    try {
      setImporting(true);
      const res = await studentService.importPreview(file);
      const rows = res.data?.data || [];
      setPreviewRows(rows);
      setFilterTab("ALL");
      setImportModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Không đọc được file Excel");
    } finally {
      setImporting(false);
    }
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    await processImportFile(file);
  };

  const handleDropFile = async (e) => {
    e.preventDefault();
    await processImportFile(e.dataTransfer.files?.[0]);
  };

  const handleConfirmImport = async () => {
    const valid = (previewRows || []).filter((r) => r.valid);
    if (valid.length === 0) {
      toast.warning("Không có dòng hợp lệ nào để nhập");
      return;
    }
    try {
      setSavingImport(true);
      await studentService.importCommit(valid);
      toast.success(`Đã nhập thành công ${valid.length} sinh viên từ file Excel!`);
      setPreviewRows(null);
      onImportDone?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi khi lưu danh sách sinh viên");
    } finally {
      setSavingImport(false);
    }
  };

  // Tính toán số lượng dòng hợp lệ và lỗi
  const totalCount = previewRows?.length || 0;
  const validCount = previewRows?.filter((r) => r.valid).length || 0;
  const errorCount = previewRows?.filter((r) => !r.valid).length || 0;

  const displayedRows = (previewRows || []).filter((r) => {
    if (filterTab === "VALID") return r.valid;
    if (filterTab === "ERROR") return !r.valid;
    return true;
  });

  return (
    <>
      {/* Nút bấm trên thanh công cụ của trang */}
      <button
        className="btn btn-outline"
        onClick={() => setImportModalOpen(true)}
        title="Nhập danh sách sinh viên từ file Excel"
        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
      >
        <Upload size={16} />
        <span>Nhập Excel</span>
      </button>

      {/* Hidden file input */}
      <input
        type="file"
        accept=".xlsx,.xls"
        ref={fileInputRef}
        onChange={handleFileSelected}
        style={{ display: "none" }}
      />

      {/* ── Pha 1: Modal chọn file & tải file mẫu ─────────────────── */}
      {importModalOpen && !previewRows && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            backgroundColor: "rgba(15, 23, 42, 0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              maxWidth: "600px",
              width: "100%",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-xl)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "18px 22px",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
                  Nhập Hồ Sơ Sinh Viên Từ Excel
                </h3>
                <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "4px" }}>
                  Quy trình tiếp nhận tân sinh viên đầu năm học qua file mẫu .xlsx
                </div>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: "6px", lineHeight: 0 }}
                onClick={() => setImportModalOpen(false)}
                title="Đóng"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "22px", display: "grid", gap: "18px" }}>
              {/* Bước 1: Tải template */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-hover)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "0.95rem" }}>
                    Bước 1 · Tải file mẫu chuẩn
                  </div>
                  <small style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                    Chứa các cột thông tin bắt buộc và quy tắc định dạng
                  </small>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleDownloadTemplate}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}
                >
                  <FileDown size={15} />
                  <span>Tải file mẫu .xlsx</span>
                </button>
              </div>

              {/* Bước 2: Upload file */}
              <div style={{ display: "grid", gap: "8px" }}>
                <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "0.95rem" }}>
                  Bước 2 · Tải lên file danh sách sinh viên
                </div>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDropFile}
                  onClick={handlePickFile}
                  style={{
                    border: "2px dashed var(--primary)",
                    borderRadius: "var(--radius-md)",
                    padding: "28px 16px",
                    textAlign: "center",
                    cursor: importing ? "wait" : "pointer",
                    backgroundColor: "rgba(16, 185, 129, 0.04)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Upload size={32} style={{ color: "var(--primary)", marginBottom: "10px" }} />
                  <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.95rem" }}>
                    {importing ? "Đang phân tích dữ liệu..." : "Kéo thả file vào đây hoặc bấm để chọn"}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "4px" }}>
                    Hỗ trợ file Microsoft Excel (.xlsx, .xls)
                  </div>
                </div>
              </div>

              {/* Ghi chú quy tắc */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "rgba(59, 130, 246, 0.08)",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                  fontSize: "0.82rem",
                  color: "var(--text-main)",
                  lineHeight: 1.5,
                }}
              >
                <strong>Ghi chú từ hệ thống:</strong>
                <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                  <li>Hệ thống sẽ đối soát trùng Mã sinh viên và Email trước khi lưu.</li>
                  <li>Mã lớp sinh hoạt phải trùng khớp với mã lớp trong cơ sở dữ liệu.</li>
                  <li>Tài khoản User (Role STUDENT) và mật khẩu mặc định (123456) sẽ được tự động kích hoạt.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Pha 2: Modal Preview & Xác nhận lưu ─────────────────────── */}
      {previewRows && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            backgroundColor: "rgba(15, 23, 42, 0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              maxWidth: "1050px",
              width: "100%",
              maxHeight: "90vh",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-xl)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 22px",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "var(--text-main)" }}>
                  Kiểm Tra & Xem Trước Danh Sách Sinh Viên
                </h3>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Đối soát dữ liệu từ file Excel trước khi khởi tạo tài khoản và ghi nhận vào cơ sở dữ liệu
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewRows(null)}
                className="btn btn-outline"
                style={{ padding: "6px", lineHeight: 0 }}
                title="Đóng"
              >
                <X size={16} />
              </button>
            </div>

            {/* Sub-header: Statistics & Tabs */}
            <div
              style={{
                padding: "12px 22px",
                backgroundColor: "var(--bg-hover)",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              {/* Thống kê */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="badge badge-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <Users size={13} />
                  Tổng: <strong>{totalCount}</strong> dòng
                </span>
                <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <CheckCircle2 size={13} />
                  Hợp lệ: <strong>{validCount}</strong>
                </span>
                {errorCount > 0 && (
                  <span className="badge badge-danger" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <AlertCircle size={13} />
                    Lỗi: <strong>{errorCount}</strong>
                  </span>
                )}
              </div>

              {/* Bộ lọc tab */}
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  className={`btn btn-sm ${filterTab === "ALL" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setFilterTab("ALL")}
                >
                  Tất cả ({totalCount})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${filterTab === "VALID" ? "btn-success" : "btn-outline"}`}
                  onClick={() => setFilterTab("VALID")}
                >
                  Chỉ hợp lệ ({validCount})
                </button>
                {errorCount > 0 && (
                  <button
                    type="button"
                    className={`btn btn-sm ${filterTab === "ERROR" ? "btn-danger" : "btn-outline"}`}
                    onClick={() => setFilterTab("ERROR")}
                  >
                    Chỉ dòng lỗi ({errorCount})
                  </button>
                )}
              </div>
            </div>

            {/* Bảng xem trước */}
            <div className="table-container" style={{ overflow: "auto", flex: 1, padding: "0" }}>
              <table className="table" style={{ margin: 0 }}>
                <thead style={{ position: "sticky", top: 0, backgroundColor: "var(--bg-surface)", zIndex: 10 }}>
                  <tr>
                    <th style={{ width: "55px", textAlign: "center" }}>Dòng</th>
                    <th style={{ width: "110px" }}>Mã SV</th>
                    <th>Họ và Tên</th>
                    <th style={{ width: "105px" }}>Ngày sinh</th>
                    <th style={{ width: "80px" }}>Giới tính</th>
                    <th style={{ width: "130px" }}>Lớp SH</th>
                    <th>Email</th>
                    <th style={{ width: "110px" }}>SĐT</th>
                    <th style={{ width: "180px" }}>Trạng thái đối soát</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                        Không có dữ liệu phù hợp với bộ lọc đã chọn
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((r, idx) => (
                      <tr
                        key={idx}
                        style={{
                          backgroundColor: r.valid ? "inherit" : "rgba(239, 68, 68, 0.05)",
                        }}
                      >
                        <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                          {r.rowNumber}
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: r.valid ? "var(--text-main)" : "#dc2626" }}>
                            {r.studentCode || "—"}
                          </span>
                        </td>
                        <td>
                          <strong>{r.fullName || "—"}</strong>
                        </td>
                        <td style={{ fontSize: "0.85rem" }}>{r.dateOfBirth || "—"}</td>
                        <td>
                          <span className={`badge ${r.gender === "Nữ" ? "badge-pink" : "badge-outline"}`}>
                            {r.gender || "—"}
                          </span>
                        </td>
                        <td>
                          <div>
                            <span style={{ fontWeight: 600 }}>{r.classCode || "—"}</span>
                            {r.className && (
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                {r.className}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ fontSize: "0.85rem" }}>{r.email || "—"}</td>
                        <td style={{ fontSize: "0.85rem" }}>{r.phone || "—"}</td>
                        <td>
                          {r.valid ? (
                            <span
                              className="badge badge-success"
                              style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                            >
                              <Check size={12} />
                              Hợp lệ
                            </span>
                          ) : (
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "flex-start",
                                gap: "4px",
                                color: "#dc2626",
                                fontSize: "0.78rem",
                                lineHeight: 1.3,
                              }}
                            >
                              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: "1px" }} />
                              <span>{r.error}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "16px 22px",
                borderTop: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "var(--bg-surface)",
              }}
            >
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setPreviewRows(null);
                    setImportModalOpen(true);
                  }}
                >
                  Chọn lại file khác
                </button>
                {errorCount > 0 && validCount > 0 && (
                  <small style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                    * Hệ thống sẽ chỉ nhập <strong>{validCount}</strong> dòng hợp lệ và bỏ qua {errorCount} dòng lỗi.
                  </small>
                )}
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setPreviewRows(null)}
                  disabled={savingImport}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmImport}
                  disabled={savingImport || validCount === 0}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <CheckCircle2 size={16} />
                  <span>
                    {savingImport
                      ? "Đang lưu..."
                      : `Xác nhận nhập (${validCount} sinh viên)`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
