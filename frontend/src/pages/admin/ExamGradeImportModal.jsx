import React, { useState, useRef } from "react";
import { FileDown, Upload, X, CheckCircle2, AlertCircle, AlertTriangle, RefreshCw, FileSpreadsheet, Users } from "lucide-react";
import { toast } from "react-toastify";
import { examService } from "../../services/dataService";

export default function ExamGradeImportModal({
  room,
  isOpen,
  onClose,
  onImportSuccess
}) {
  const [file, setFile] = useState(null);
  const [previewRows, setPreviewRows] = useState(null);
  const [filterTab, setFilterTab] = useState("ALL"); // 'ALL' | 'VALID' | 'ERROR'
  const [importing, setImporting] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [reason, setReason] = useState("");
  const fileInputRef = useRef(null);

  if (!isOpen || !room) return null;

  const handleDownloadTemplate = async () => {
    try {
      const res = await examService.downloadTemplate(room.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `PhongThi_${room.roomCode}_${room.subjectCode || 'Exam'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Đã tải danh sách và mẫu nhập điểm phòng ${room.roomCode}!`);
    } catch {
      toast.error("Lỗi khi tải biểu mẫu phòng thi");
    }
  };

  const processImportFile = async (selectedFile) => {
    if (!selectedFile) return;
    if (!/\.(xlsx|xls)$/i.test(selectedFile.name)) {
      toast.error("Vui lòng chọn file Excel có định dạng .xlsx");
      return;
    }
    setFile(selectedFile);
    try {
      setImporting(true);
      const res = await examService.importPreview(room.id, selectedFile);
      const data = res.data?.data || [];
      setPreviewRows(data);
      setFilterTab("ALL");
      setReason(`Khảo thí nạp điểm thi phòng ${room.roomCode}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể đọc hoặc đối soát file Excel");
      setFile(null);
      setPreviewRows(null);
    } finally {
      setImporting(false);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    processImportFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    processImportFile(f);
  };

  const handleReset = () => {
    setFile(null);
    setPreviewRows(null);
  };

  const handleCommit = async () => {
    if (!previewRows || previewRows.length === 0) return;

    const invalidRows = previewRows.filter(r => !r.valid);
    if (invalidRows.length > 0) {
      toast.error(`Còn ${invalidRows.length} dòng lỗi, vui lòng kiểm tra lại theo nguyên tắc All-or-Nothing!`);
      return;
    }

    try {
      setCommitting(true);
      const items = previewRows.map(r => ({
        rosterId: r.rosterId,
        studentCode: r.studentCode,
        sbd: r.sbd,
        score: r.score,
        specialGrade: r.specialGrade,
        violationNote: r.violationNote,
      }));

      await examService.importCommit(room.id, {
        reason: reason.trim() || `Khảo thí nạp điểm thi phòng ${room.roomCode}`,
        items: items
      });

      toast.success(`Đã lưu và khóa sổ điểm thi phòng ${room.roomCode} thành công!`);
      onImportSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi lưu điểm thi vào hệ thống");
    } finally {
      setCommitting(false);
    }
  };

  // Stats
  const totalCount = previewRows?.length || 0;
  const validCount = previewRows?.filter(r => r.valid).length || 0;
  const errorCount = previewRows?.filter(r => !r.valid).length || 0;
  const warningCount = previewRows?.filter(r => r.warning).length || 0;

  const displayedRows = (previewRows || []).filter(r => {
    if (filterTab === "VALID") return r.valid;
    if (filterTab === "ERROR") return !r.valid;
    return true;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget && !committing) onClose(); }}
    >
      <div className="modal-content" style={{ maxWidth: "1050px", maxHeight: "92vh", display: "flex", flexDirection: "column" }}>
        
        {/* Header */}
        <div
          style={{
            padding: "16px 22px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--bg-hover)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                padding: "8px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--primary)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
                Nhập Điểm Thi Phòng {room.roomCode}
              </h3>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Môn thi: <strong style={{ color: "var(--text-secondary)" }}>{room.subjectCode} - {room.subjectName}</strong>
                {"  •  "}
                {room.sessionName || "Kỳ thi tập trung"}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: "6px", lineHeight: 0 }}
            onClick={onClose}
            disabled={committing}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Top Info Banner & Template Download */}
          <div
            style={{
              padding: "14px 18px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--primary-light)",
              border: "1px solid var(--primary-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px"
            }}
          >
            <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
              <div style={{ fontWeight: 700, color: "var(--primary)" }}>
                Quy trình nạp điểm 2-Phase (Đối soát ➜ Chốt sổ điểm):
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "3px" }}>
                Hệ thống tự động đối chiếu kép MSSV + SBD, kiểm tra thang điểm 0—10 và mã điểm đặc biệt (V: Vắng thi, I: Hoãn thi). Bảng điểm chỉ được lưu khi 100% dòng hợp lệ (All-or-Nothing).
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={handleDownloadTemplate}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}
            >
              <FileDown size={14} style={{ color: "var(--primary)" }} />
              <span>Tải mẫu Excel phòng này</span>
            </button>
          </div>

          {/* Phase 1: Upload Area (If not previewing) */}
          {!previewRows && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed var(--primary)",
                borderRadius: "var(--radius-md)",
                padding: "40px 20px",
                textAlign: "center",
                cursor: importing ? "wait" : "pointer",
                backgroundColor: "rgba(37, 99, 235, 0.03)",
                transition: "all 0.2s ease"
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "16px",
                    backgroundColor: "var(--primary-light)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {importing ? (
                    <RefreshCw size={26} className="animate-spin" />
                  ) : (
                    <Upload size={26} />
                  )}
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>
                    {importing ? "Đang phân tích & đối soát dữ liệu..." : "Kéo thả file Excel điểm thi vào đây, hoặc bấm để chọn file"}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    Định dạng hỗ trợ: Microsoft Excel (.xlsx). Điểm thi từ 0.0 — 10.0, hoặc mã V (Vắng), I (Hoãn thi).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Phase 2: Preview Results Table */}
          {previewRows && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              
              {/* Summary Stats Row */}
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-hover)",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>
                    {file?.name ? `${file.name} — ` : ""}Kết quả đối soát:
                  </span>
                  <span className="badge badge-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <Users size={12} />
                    Tổng: <strong>{totalCount}</strong> thí sinh
                  </span>
                  <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle2 size={12} />
                    Hợp lệ: <strong>{validCount}/{totalCount}</strong>
                  </span>
                  {errorCount > 0 && (
                    <span className="badge badge-danger" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <AlertCircle size={12} />
                      Lỗi: <strong>{errorCount}</strong> dòng
                    </span>
                  )}
                  {warningCount > 0 && (
                    <span className="badge badge-warning" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <AlertTriangle size={12} />
                      Cảnh báo: <strong>{warningCount}</strong>
                    </span>
                  )}
                </div>

                {/* Filter Tabs */}
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

              {/* Reason / Note input */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-main)", shrink: 0 }}>
                  Lý do / Căn cứ nạp điểm:
                </span>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ví dụ: Khảo thí nạp điểm thi kết thúc học phần đợt 1"
                  className="form-control"
                  style={{ flex: 1, fontSize: "0.85rem" }}
                />
              </div>

              {/* Preview Table */}
              <div className="table-container" style={{ maxHeight: "360px", overflowY: "auto" }}>
                <table className="table" style={{ margin: 0 }}>
                  <thead style={{ position: "sticky", top: 0, backgroundColor: "var(--bg-surface)", zIndex: 10 }}>
                    <tr>
                      <th style={{ width: "50px", textAlign: "center" }}>Dòng</th>
                      <th style={{ width: "120px" }}>SBD (File)</th>
                      <th style={{ width: "110px" }}>Mã Sinh Viên</th>
                      <th>Họ và Tên</th>
                      <th style={{ width: "110px" }}>Ngày Sinh</th>
                      <th style={{ width: "100px" }}>Lớp SH</th>
                      <th style={{ width: "80px", textAlign: "center" }}>Điểm Thi</th>
                      <th style={{ width: "90px", textAlign: "center" }}>Mã Đặc Biệt</th>
                      <th>Đối Soát & Cảnh Báo</th>
                      <th style={{ width: "100px", textAlign: "center" }}>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRows.map((r) => (
                      <tr
                        key={r.rowNumber}
                        style={{
                          backgroundColor: !r.valid ? "rgba(239, 68, 68, 0.05)" : undefined
                        }}
                      >
                        <td style={{ textAlign: "center", color: "var(--text-light)", fontFamily: "monospace" }}>
                          {r.rowNumber}
                        </td>
                        <td style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--primary)" }}>
                          {r.sbd}
                        </td>
                        <td style={{ fontFamily: "monospace", fontWeight: 600 }}>
                          {r.studentCode}
                        </td>
                        <td style={{ fontWeight: 600, color: "var(--text-main)" }}>
                          {r.studentName}
                        </td>
                        <td style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                          {r.dateOfBirth}
                        </td>
                        <td style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>
                          {r.className}
                        </td>
                        <td style={{ textAlign: "center", fontWeight: 700, fontFamily: "monospace" }}>
                          {r.score !== null && r.score !== undefined ? (
                            <span style={{ color: r.score < 3.0 ? "var(--danger)" : "var(--primary)" }}>
                              {Number(r.score).toFixed(1)}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-light)" }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {r.specialGrade === "V" ? (
                            <span className="badge badge-danger">V (Vắng)</span>
                          ) : r.specialGrade === "I" ? (
                            <span className="badge badge-warning">I (Hoãn)</span>
                          ) : (
                            <span style={{ color: "var(--text-light)", fontSize: "0.8rem" }}>—</span>
                          )}
                        </td>
                        <td style={{ fontSize: "0.82rem" }}>
                          {r.error ? (
                            <div style={{ color: "var(--danger)", display: "flex", alignItems: "center", gap: "4px" }}>
                              <AlertCircle size={13} style={{ shrink: 0 }} />
                              <span>{r.error}</span>
                            </div>
                          ) : r.warning ? (
                            <div style={{ color: "var(--warning)", display: "flex", alignItems: "center", gap: "4px" }}>
                              <AlertTriangle size={13} style={{ shrink: 0 }} />
                              <span>{r.warning}</span>
                            </div>
                          ) : r.violationNote ? (
                            <span style={{ color: "var(--danger)" }}>{r.violationNote}</span>
                          ) : (
                            <span style={{ color: "var(--success)" }}>Khớp dữ liệu phòng thi</span>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {r.valid ? (
                            <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <CheckCircle2 size={12} /> Hợp lệ
                            </span>
                          ) : (
                            <span className="badge badge-danger" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <AlertCircle size={12} /> Lỗi
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "14px 22px",
            borderTop: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-hover)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          <div>
            {previewRows && errorCount > 0 && (
              <span style={{ fontSize: "0.82rem", color: "var(--danger)", display: "inline-flex", alignItems: "center", gap: "5px", fontWeight: 600 }}>
                <AlertCircle size={14} />
                Còn {errorCount} dòng lỗi. Bạn cần sửa lại file Excel để thỏa mãn nguyên tắc All-or-Nothing trước khi lưu.
              </span>
            )}
            {previewRows && errorCount === 0 && (
              <span style={{ fontSize: "0.82rem", color: "var(--success)", display: "inline-flex", alignItems: "center", gap: "5px", fontWeight: 600 }}>
                <CheckCircle2 size={14} />
                Toàn bộ {validCount} thí sinh hợp lệ. Sẵn sàng lưu và khóa sổ điểm phòng thi.
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {previewRows ? (
              <>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleReset}
                  disabled={committing}
                >
                  Chọn file khác
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCommit}
                  disabled={errorCount > 0 || committing}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  {committing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Đang lưu & tính điểm...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Xác nhận Lưu & Khóa Điểm</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
              >
                Đóng
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
