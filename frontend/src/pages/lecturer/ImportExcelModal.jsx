import { useState, useRef } from "react";
import { FileDown, Upload, X, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import { gradeService } from "../../services/dataService";

/**
 * Two-phase Excel import: (1) file-picker modal → (2) preview modal.
 * Manages its own state; parent only needs to pass sectionId and a reload callback.
 */
export default function ImportExcelModal({
  sectionId,
  onImportDone,
}) {
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [previewRows, setPreviewRows] = useState(null);
  const [importing, setImporting] = useState(false);
  const [savingImport, setSavingImport] = useState(false);
  const fileInputRef = useRef(null);

  // ── Handlers ──────────────────────────────────────────────

  const handleDownloadTemplate = async () => {
    try {
      if (!sectionId) return;
      const res = await gradeService.downloadImportTemplate(sectionId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `MauNhapDiem_LHP_${sectionId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Đã tải file mẫu nhập điểm!");
    } catch {
      toast.error("Lỗi khi tải file mẫu");
    }
  };

  const handlePickFile = () => {
    setImportModalOpen(true);
    fileInputRef.current?.click();
  };

  const processImportFile = async (file) => {
    if (!file || !sectionId) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      toast.error("Vui lòng chọn file Excel có định dạng .xlsx hoặc .xls");
      return;
    }
    try {
      setImporting(true);
      const res = await gradeService.importPreview(sectionId, file);
      setPreviewRows(res.data.data || []);
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
    if (valid.length === 0) return;
    try {
      setSavingImport(true);
      const payload = valid.map((r) => ({
        enrollmentId: r.enrollmentId,
        cc1Score: r.cc1Score ?? null,
        cc2Score: r.cc2Score ?? null,
        midtermScore: r.midtermScore ?? null,
        finalScore: r.finalScore ?? null,
        specialGrade: "NONE",
        finalize: false,
      }));
      await gradeService.importCommit(sectionId, payload);
      toast.success(`Đã nhập ${valid.length} dòng điểm từ Excel!`);
      setPreviewRows(null);
      onImportDone?.();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Có lỗi khi lưu điểm nhập từ Excel",
      );
    } finally {
      setSavingImport(false);
    }
  };

  // ── Render ────────────────────────────────────────────────

  return (
    <>
      {/* Toolbar buttons (rendered inline in parent's header) */}
      <button
        className="btn btn-outline"
        onClick={handleDownloadTemplate}
        title="Tải file Excel mẫu đã điền sẵn danh sách lớp để nhập điểm"
      >
        <FileDown size={16} />
        <span>Tải mẫu</span>
      </button>
      <button
        className="btn btn-outline"
        disabled={importing}
        onClick={handlePickFile}
        title="Nhập điểm hàng loạt từ file Excel"
      >
        <Upload size={16} />
        <span>{importing ? "Đang đọc..." : "Nhập Excel"}</span>
      </button>

      {/* Hidden file input */}
      <input
        type="file"
        accept=".xlsx,.xls"
        ref={fileInputRef}
        onChange={handleFileSelected}
        style={{ display: "none" }}
      />

      {/* Step-by-step picker modal */}
      {importModalOpen && !previewRows && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="excel-import-title"
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
              maxWidth: "620px",
              width: "100%",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-xl)",
              overflow: "hidden",
            }}
          >
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
                <h3 id="excel-import-title" style={{ margin: 0, fontSize: "1.05rem" }}>
                  Nhập điểm từ Excel
                </h3>
                <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "4px" }}>
                  Thực hiện theo 3 bước để kiểm tra trước khi lưu.
                </div>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setImportModalOpen(false)}
                style={{ padding: "6px", lineHeight: 0 }}
                title="Đóng"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: "20px 22px", display: "grid", gap: "14px" }}>
              <div style={{ display: "grid", gap: "8px" }}>
                <strong style={{ color: "var(--text-main)" }}>Bước 1 · Tải file mẫu</strong>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  File mẫu đã có sẵn mã đăng ký, mã sinh viên và họ tên của lớp.
                </span>
                <button type="button" className="btn btn-outline" onClick={handleDownloadTemplate} style={{ width: "fit-content" }}>
                  <FileDown size={16} />
                  Tải file mẫu
                </button>
              </div>

              <div style={{ display: "grid", gap: "8px" }}>
                <strong style={{ color: "var(--text-main)" }}>Bước 2 · Chọn hoặc kéo-thả file</strong>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDropFile}
                  onClick={handlePickFile}
                  style={{
                    border: "1px dashed var(--primary)",
                    borderRadius: "var(--radius-md)",
                    padding: "24px 16px",
                    textAlign: "center",
                    cursor: importing ? "wait" : "pointer",
                    backgroundColor: "var(--primary-light)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <Upload size={24} style={{ color: "var(--primary)", marginBottom: "8px" }} />
                  <div style={{ fontWeight: 700 }}>
                    {importing ? "Đang đọc file..." : "Kéo file Excel vào đây hoặc bấm để chọn"}
                  </div>
                  <small>.xlsx hoặc .xls</small>
                </div>
              </div>

              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                <strong>Bước 3 · Preview & xác nhận:</strong> hệ thống sẽ đánh dấu dòng lỗi và chỉ lưu các dòng hợp lệ.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewRows && (
        <div
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
              maxWidth: "920px",
              width: "100%",
              maxHeight: "88vh",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-xl)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "18px 22px",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "var(--text-main)" }}>
                  Xem trước điểm nhập từ Excel
                </h3>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Tổng {previewRows.length} dòng ·{" "}
                  <span style={{ color: "#15803d", fontWeight: 700 }}>
                    {previewRows.filter((r) => r.valid).length} hợp lệ
                  </span>{" "}
                  ·{" "}
                  <span style={{ color: "#b91c1c", fontWeight: 700 }}>
                    {previewRows.filter((r) => !r.valid).length} lỗi
                  </span>{" "}
                  — chỉ các dòng hợp lệ mới được lưu.
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
            <div className="table-container" style={{ overflow: "auto", flex: 1 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: "60px" }}>Dòng</th>
                    <th>Mã SV</th>
                    <th>Họ và Tên</th>
                    <th style={{ textAlign: "center" }}>CC1</th>
                    <th style={{ textAlign: "center" }}>CC2</th>
                    <th style={{ textAlign: "center" }}>GK</th>
                    <th style={{ textAlign: "center" }}>CK</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r, i) => (
                    <tr
                      key={i}
                      style={{
                        backgroundColor: r.valid ? "transparent" : "rgba(185, 28, 28, 0.06)",
                      }}
                    >
                      <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{r.rowNumber}</td>
                      <td style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.85rem" }}>
                        {r.studentCode || "—"}
                      </td>
                      <td style={{ fontWeight: 600 }}>{r.studentName || "—"}</td>
                      <td style={{ textAlign: "center" }}>{r.cc1Score ?? "—"}</td>
                      <td style={{ textAlign: "center" }}>{r.cc2Score ?? "—"}</td>
                      <td style={{ textAlign: "center" }}>{r.midtermScore ?? "—"}</td>
                      <td style={{ textAlign: "center" }}>{r.finalScore ?? "—"}</td>
                      <td>
                        {r.valid ? (
                          <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <CheckCircle2 size={13} /> Hợp lệ
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }} title={r.error}>
                            <AlertCircle size={13} /> {r.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              style={{
                padding: "16px 22px",
                borderTop: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => setPreviewRows(null)}
                className="btn btn-outline"
                disabled={savingImport}
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="btn btn-primary"
                disabled={savingImport || previewRows.filter((r) => r.valid).length === 0}
              >
                <Save size={16} />
                <span>
                  {savingImport
                    ? "Đang lưu..."
                    : `Lưu ${previewRows.filter((r) => r.valid).length} dòng hợp lệ`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
