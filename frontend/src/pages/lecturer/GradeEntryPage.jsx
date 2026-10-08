import TableRowSkeleton from '../../components/common/TableRowSkeleton';
import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Layers,
  Save,
  CheckCircle,
  AlertCircle,
  CheckCircle2,
  Download,
  Lock,
  FileDown,
  Upload,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { courseSectionService, gradeService } from "../../services/dataService";

export default function GradeEntryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mySections, setMySections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(
    searchParams.get("sectionId") || "",
  );
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveInFlight = useRef(false);
  // Task 4 — nhập điểm từ Excel: previewRows != null => mở modal xem trước.
  const [previewRows, setPreviewRows] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [savingImport, setSavingImport] = useState(false);
  const fileInputRef = useRef(null);

  const loadSections = async () => {
    try {
      const res = await courseSectionService.getMySections();
      const list = res.data.data || [];
      setMySections(list);
      const paramId = searchParams.get("sectionId");
      if (paramId) {
        setSelectedSection(paramId);
        loadGrades(paramId);
      } else if (list.length > 0) {
        setSelectedSection(list[0].id);
        loadGrades(list[0].id);
      }
    } catch {
      toast.error("Lỗi khi tải danh sách lớp học phần");
    }
  };

  useEffect(() => {
    loadSections();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGrades = async (sectionId) => {
    try {
      setLoading(true);
      const res = await gradeService.getBySection(sectionId);
      setGrades(res.data.data || []);
    } catch {
      toast.error("Lỗi khi tải bảng điểm");
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (e) => {
    const secId = e.target.value;
    setSelectedSection(secId);
    setSearchParams({ sectionId: secId });
    loadGrades(secId);
  };

  const handleScoreChange = (index, field, value) => {
    const val = value === "" ? "" : parseFloat(value);
    const updated = [...grades];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    setGrades(updated);
  };

  // Điểm đặc biệt (V = vắng thi, I = hoãn thi/chưa hoàn thành, M = miễn học phần).
  // Khi chọn V/I/M, điểm thành phần không còn ý nghĩa nên khoá các ô nhập số.
  const handleSpecialChange = (index, value) => {
    const updated = [...grades];
    updated[index] = {
      ...updated[index],
      specialGrade: value,
    };
    setGrades(updated);
  };

  const handleExportExcel = async () => {
    try {
      if (!selectedSection) return;
      const res = await gradeService.exportExcel(selectedSection);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `BangDiem_LHP_${selectedSection}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Đã xuất bảng điểm ra file Excel thành công!");
    } catch {
      toast.error("Lỗi khi tải file Excel");
    }
  };

  // Task 4: tải file Excel mẫu đã điền sẵn roster để GV nhập điểm offline.
  const handleDownloadTemplate = async () => {
    try {
      if (!selectedSection) return;
      const res = await gradeService.downloadImportTemplate(selectedSection);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `MauNhapDiem_LHP_${selectedSection}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Đã tải file mẫu nhập điểm!");
    } catch {
      toast.error("Lỗi khi tải file mẫu");
    }
  };

  // Mở modal nhập Excel và hộp thoại chọn file.
  const handlePickFile = () => {
    setImportModalOpen(true);
    fileInputRef.current?.click();
  };

  const processImportFile = async (file) => {
    if (!file || !selectedSection) return;
    const isExcel = /\.(xlsx|xls)$/i.test(file.name);
    if (!isExcel) {
      toast.error("Vui lòng chọn file Excel có định dạng .xlsx hoặc .xls");
      return;
    }
    try {
      setImporting(true);
      const res = await gradeService.importPreview(selectedSection, file);
      setPreviewRows(res.data.data || []);
      setImportModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Không đọc được file Excel");
    } finally {
      setImporting(false);
    }
  };

  // Đọc file GV chọn -> gọi API xem trước (KHÔNG lưu). Reset input để chọn lại cùng file được.
  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    await processImportFile(file);
  };

  const handleDropFile = async (e) => {
    e.preventDefault();
    await processImportFile(e.dataTransfer.files?.[0]);
  };

  // Xác nhận: chỉ gửi các dòng hợp lệ qua endpoint commit dành riêng cho import.
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
      await gradeService.importCommit(selectedSection, payload);
      toast.success(`Đã nhập ${valid.length} dòng điểm từ Excel!`);
      setPreviewRows(null);
      loadGrades(selectedSection);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Có lỗi khi lưu điểm nhập từ Excel",
      );
    } finally {
      setSavingImport(false);
    }
  };

  const handleSave = async (finalize = false) => {
    if (saveInFlight.current) return;
    saveInFlight.current = true;
    try {
      setSaving(true);
      const payload = grades.map((g) => ({
        enrollmentId: g.enrollment?.id,
        cc1Score:
          g.cc1Score != null && g.cc1Score !== ""
            ? parseFloat(g.cc1Score)
            : null,
        cc2Score:
          g.cc2Score != null && g.cc2Score !== ""
            ? parseFloat(g.cc2Score)
            : null,
        midtermScore:
          g.midtermScore != null && g.midtermScore !== ""
            ? parseFloat(g.midtermScore)
            : null,
        finalScore:
          g.finalScore != null && g.finalScore !== ""
            ? parseFloat(g.finalScore)
            : null,
        specialGrade: g.specialGrade || "NONE",
        finalize: finalize,
      }));
      await gradeService.saveBatch(payload);
      toast.success(
        finalize
          ? "Đã hoàn tất chốt bảng điểm học phần!"
          : "Đã lưu điểm thành công!",
      );
      loadGrades(selectedSection);
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi khi lưu điểm");
    } finally {
      setSaving(false);
      saveInFlight.current = false;
    }
  };

  // Thông tư 08/2021/TT-BGDĐT (đồng bộ với backend Grade.getIsPassed):
  // "Đạt" ⟺ Điểm tổng kết >= 4.0 (từ D trở lên) VÀ Điểm cuối kỳ (CK) >= 3.0.
  // Chỉ điểm F (TK < 4.0 hoặc CK < 3.0) mới trượt → phải học lại.
  const isStudentPassed = (g) => {
    if (g.isPassed !== undefined && g.isPassed !== null) return g.isPassed;
    if (g.specialGrade === "M") return true; // Miễn học phần = đạt
    if (g.specialGrade === "V" || g.specialGrade === "I") return false;
    const finalOk =
      g.finalScore == null ||
      g.finalScore === "" ||
      parseFloat(g.finalScore) >= 3.0;
    if (g.letterGrade) return g.letterGrade.toUpperCase() !== "F" && finalOk;
    if (g.totalScore != null) return parseFloat(g.totalScore) >= 4.0 && finalOk;
    return null;
  };

  // Phân loại kết quả hiển thị ở cột "Kết Quả":
  //  - I (hoãn thi): trung tính, chờ thi bổ sung
  //  - F / V (TK < 4.0 hoặc CK < 3.0 hoặc vắng thi): HỌC LẠI (đỏ)
  //  - D (TK 4.0–4.9): ĐẠT nhưng nên học CẢI THIỆN (xanh dương)
  //  - D+ trở lên (TK >= 5.0) / M (miễn): ĐẠT (xanh lá)
  const getResult = (g) => {
    if (g.specialGrade === "I")
      return {
        cls: "badge-warning",
        label: "Hoãn thi",
        title: "Hoãn thi / chưa hoàn thành (I) — chờ thi bổ sung.",
      };
    const passed = isStudentPassed(g);
    if (passed == null) return null;
    if (!passed)
      return {
        cls: "badge-danger",
        label: "HỌC LẠI",
        title: "Trượt học phần (điểm F) — phải đăng ký học lại.",
      };
    const letter = (g.letterGrade || "").toUpperCase();
    const total =
      g.totalScore != null && g.totalScore !== ""
        ? parseFloat(g.totalScore)
        : null;
    const improvable =
      letter === "D" || (letter === "" && total != null && total < 5.0);
    if (improvable)
      return {
        cls: "badge-info",
        label: "ĐẠT · cải thiện",
        title:
          "Đạt mức tối thiểu (điểm D). Có thể đăng ký học cải thiện để nâng điểm.",
      };
    return { cls: "badge-success", label: "ĐẠT", title: "Đạt học phần." };
  };

  // V/I/M được coi là "đã có kết quả" khi xét điều kiện chốt (khớp với backend
  // verifyAllStudentsGraded), kể cả khi chưa có điểm tổng kết dạng số.
  const hasSpecial = (g) => g.specialGrade && g.specialGrade !== "NONE";
  const isGraded = (g) => g.totalScore != null || hasSpecial(g);

  const currentSectionInfo = mySections.find(
    (s) => s.id === parseInt(selectedSection),
  );
  const passedCount = grades.filter((g) => isStudentPassed(g) === true).length;
  const gradedCount = grades.filter(isGraded).length;
  const passRate =
    gradedCount > 0 ? Math.round((passedCount / gradedCount) * 100) : 0;
  const allGraded = grades.length > 0 && gradedCount === grades.length;
  // Activity #14 — cửa sổ ân hạn: sau khi chốt, GV còn 7 ngày để sửa; hết hạn mới khoá cứng.
  const isFinalized = grades.length > 0 && grades.every((g) => g.isFinalized);
  const isLocked =
    grades.length > 0 && grades.every((g) => g.editWindowExpired);
  // Cả lớp chốt cùng lúc nên finalizedAt gần như bằng nhau — lấy dòng đầu để tính số ngày còn lại.
  const editDaysLeft = useMemo(() => {
    const g = grades.find((x) => x.isFinalized && x.finalizedAt);
    if (!g) return null;
    const expireAt =
      new Date(g.finalizedAt).getTime() + 7 * 24 * 60 * 60 * 1000;
    return Math.max(
      0,
      Math.ceil((expireAt - Date.now()) / (24 * 60 * 60 * 1000)),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grades]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Sổ Điểm & Đánh Giá Học Phần</h1>
          <p>
            Quy chế tính điểm: Điểm tổng kết = (CC1 5% + CC2 5%) + GK 30% + CK
            60%
          </p>
        </div>
        {grades.length > 0 && (
          <div className="page-header-actions" style={{ alignItems: "center" }}>
            {isLocked ? (
              <span
                className="badge badge-neutral"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  fontSize: "0.85rem",
                }}
                title="Đã quá 7 ngày kể từ khi chốt. Liên hệ Quản trị viên để mở lại."
              >
                <Lock size={15} />
                ĐÃ KHOÁ · HẾT HẠN SỬA
              </span>
            ) : isFinalized ? (
              <span
                className="badge badge-success"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  fontSize: "0.85rem",
                }}
                title="Điểm đã công bố cho sinh viên. Bạn còn thời gian để chỉnh sửa trước khi khoá cứng."
              >
                <CheckCircle2 size={15} />
                ĐÃ CHỐT
                {editDaysLeft != null
                  ? ` · còn ${editDaysLeft} ngày để sửa`
                  : ""}
              </span>
            ) : null}
            <button
              className="btn btn-outline"
              onClick={handleExportExcel}
              title="Xuất bảng điểm ra file Excel"
            >
              <Download size={16} />
              <span>Xuất Excel</span>
            </button>
            {!isLocked && (
              <>
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
              </>
            )}
            {!isLocked && !isFinalized && (
              <>
                <button
                  className="btn btn-secondary"
                  disabled={saving}
                  onClick={() => handleSave(false)}
                >
                  <Save size={16} />
                  <span>{saving ? "Đang lưu..." : "Lưu bản nháp"}</span>
                </button>
                <button
                  className="btn btn-primary"
                  disabled={saving || !allGraded}
                  title={
                    allGraded
                      ? "Chốt & công bố điểm học phần"
                      : "Phải nhập đủ điểm cho tất cả sinh viên trước khi chốt"
                  }
                  onClick={() => handleSave(true)}
                >
                  <CheckCircle size={16} />
                  <span>Chốt & Công bố điểm</span>
                </button>
              </>
            )}
            {!isLocked && isFinalized && (
              <button
                className="btn btn-primary"
                disabled={saving}
                onClick={() => handleSave(false)}
              >
                <Save size={16} />
                <span>{saving ? "Đang lưu..." : "Lưu chỉnh sửa"}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Selector Card */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div
          className="card-body"
          style={{
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flex: 1,
              minWidth: "320px",
            }}
          >
            <Layers
              size={18}
              style={{ color: "var(--primary)", flexShrink: 0 }}
            />
            <span
              style={{
                fontWeight: 600,
                fontSize: "0.9rem",
                color: "var(--text-main)",
                whiteSpace: "nowrap",
              }}
            >
              Lớp học phần:
            </span>
            <select
              value={selectedSection}
              onChange={handleSectionChange}
              className="form-select"
              style={{ flex: 1, maxWidth: "540px" }}
            >
              {mySections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sectionCode} — {s.subject?.subjectName} (
                  {s.semester?.semesterName})
                </option>
              ))}
            </select>
          </div>

          {currentSectionInfo && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                fontSize: "0.85rem",
              }}
            >
              <span className="badge badge-info">
                {currentSectionInfo.subject?.credits} Tín chỉ
              </span>
              <span className="badge badge-neutral">
                Sĩ số: {grades.length} SV
              </span>
              {gradedCount > 0 && (
                <span className="badge badge-success">Đạt: {passRate}%</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: "50px", position: "sticky", left: 0, zIndex: 11, backgroundColor: "var(--bg-surface)" }}>STT</th>
                <th style={{ width: "120px", position: "sticky", left: "50px", zIndex: 11, backgroundColor: "var(--bg-surface)" }}>Mã SV</th>
                <th style={{ minWidth: "200px", position: "sticky", left: "170px", zIndex: 11, backgroundColor: "var(--bg-surface)", boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)" }}>Họ và Tên Sinh Viên</th>
                <th>Lớp SH</th>
                <th style={{ textAlign: "center" }}>
                  CC1 (5%)
                  <br />
                  <small style={{ fontSize: "0.8em", fontWeight: "normal" }}>
                    Chuyên cần
                  </small>
                </th>
                <th style={{ textAlign: "center" }}>
                  CC2 (5%)
                  <br />
                  <small style={{ fontSize: "0.8em", fontWeight: "normal" }}>
                    Bài tập
                  </small>
                </th>
                <th style={{ textAlign: "center" }}>GK (30%)</th>
                <th style={{ textAlign: "center" }}>CK (60%)</th>
                <th style={{ textAlign: "center" }}>
                  Đặc biệt
                  <br />
                  <small style={{ fontSize: "0.8em", fontWeight: "normal" }}>
                    V / I / M
                  </small>
                </th>
                <th style={{ textAlign: "center" }}>Tổng Kết</th>
                <th style={{ textAlign: "center" }}>Hệ 4</th>
                <th style={{ textAlign: "center" }}>Điểm Chữ</th>
                <th style={{ textAlign: "center" }}>Kết Quả</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowSkeleton columns={13} />
              ) : grades.length === 0 ? (
                <tr>
                  <td
                    colSpan="13"
                    style={{
                      textAlign: "center",
                      padding: "48px 20px",
                      color: "var(--text-muted)",
                    }}
                  >
                    Lớp học phần này hiện chưa có sinh viên nào đăng ký.
                  </td>
                </tr>
              ) : (
                grades.map((g, idx) => (
                  <tr key={g.id || idx}>
                    <td
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.85rem",
                        position: "sticky",
                        left: 0,
                        zIndex: 5,
                        backgroundColor: "var(--bg-surface)"
                      }}
                    >
                      {idx + 1}
                    </td>
                    <td style={{ position: "sticky", left: "50px", zIndex: 5, backgroundColor: "var(--bg-surface)" }}>
                      <span
                        style={{
                          display: "inline-block",
                          fontFamily: "monospace",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          color: "var(--primary)",
                          backgroundColor: "var(--primary-light)",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          border: "1px solid var(--primary-border)",
                        }}
                      >
                        {g.enrollment?.student?.studentCode}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--text-main)", position: "sticky", left: "170px", zIndex: 5, backgroundColor: "var(--bg-surface)", boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)" }}>
                      {g.enrollment?.student?.fullName}
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {g.enrollment?.student?.classEntity?.code || "—"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        placeholder="0.0"
                        value={g.cc1Score ?? ""}
                        onChange={(e) =>
                          handleScoreChange(idx, "cc1Score", e.target.value)
                        }
                        disabled={isLocked || hasSpecial(g)}
                        className="form-control"
                        style={{
                          width: "68px",
                          padding: "6px",
                          textAlign: "center",
                          margin: "0 auto",
                          fontWeight: 600,
                        }}
                      />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        placeholder="0.0"
                        value={g.cc2Score ?? ""}
                        onChange={(e) =>
                          handleScoreChange(idx, "cc2Score", e.target.value)
                        }
                        disabled={isLocked || hasSpecial(g)}
                        className="form-control"
                        style={{
                          width: "68px",
                          padding: "6px",
                          textAlign: "center",
                          margin: "0 auto",
                          fontWeight: 600,
                        }}
                      />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        placeholder="0.0"
                        value={g.midtermScore ?? ""}
                        onChange={(e) =>
                          handleScoreChange(idx, "midtermScore", e.target.value)
                        }
                        disabled={isLocked || hasSpecial(g)}
                        className="form-control"
                        style={{
                          width: "68px",
                          padding: "6px",
                          textAlign: "center",
                          margin: "0 auto",
                          fontWeight: 600,
                        }}
                      />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        placeholder="0.0"
                        value={g.finalScore ?? ""}
                        onChange={(e) =>
                          handleScoreChange(idx, "finalScore", e.target.value)
                        }
                        disabled={isLocked || hasSpecial(g)}
                        className="form-control"
                        style={{
                          width: "68px",
                          padding: "6px",
                          textAlign: "center",
                          margin: "0 auto",
                          fontWeight: 600,
                        }}
                      />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <select
                        value={g.specialGrade || "NONE"}
                        onChange={(e) =>
                          handleSpecialChange(idx, e.target.value)
                        }
                        disabled={isLocked}
                        className="form-select"
                        style={{
                          width: "92px",
                          padding: "6px",
                          margin: "0 auto",
                          fontWeight: 600,
                        }}
                        title="V: vắng thi (tính 0 điểm) · I: hoãn thi / chưa hoàn thành · M: miễn học phần (đạt)"
                      >
                        <option value="NONE">—</option>
                        <option value="V">V · Vắng thi</option>
                        <option value="I">I · Hoãn thi</option>
                        <option value="M">M · Miễn</option>
                      </select>
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                        color: "var(--text-main)",
                      }}
                    >
                      {g.totalScore != null
                        ? Number(g.totalScore).toFixed(1)
                        : "—"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        className="badge badge-info"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {(g.gpaPoint ?? g.score4) != null
                          ? Number(g.gpaPoint ?? g.score4).toFixed(2)
                          : "—"}
                      </span>
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        fontWeight: 800,
                        color: "var(--primary)",
                      }}
                    >
                      {g.letterGrade || "—"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {(() => {
                        const r = getResult(g);
                        return r ? (
                          <span className={`badge ${r.cls}`} title={r.title}>
                            {r.label}
                          </span>
                        ) : (
                          <span
                            style={{
                              color: "var(--text-light)",
                              fontSize: "0.8rem",
                            }}
                          >
                            Chưa chốt
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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

      {/* Task 4: input ẩn để chọn file Excel nhập điểm */}
      <input
        type="file"
        accept=".xlsx,.xls"
        ref={fileInputRef}
        onChange={handleFileSelected}
        style={{ display: "none" }}
      />

      {/* Task 4: Modal XEM TRƯỚC điểm nhập từ Excel (chưa lưu vào hệ thống) */}
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
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    color: "var(--text-main)",
                  }}
                >
                  Xem trước điểm nhập từ Excel
                </h3>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    marginTop: "4px",
                  }}
                >
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
                        backgroundColor: r.valid
                          ? "transparent"
                          : "rgba(185, 28, 28, 0.06)",
                      }}
                    >
                      <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        {r.rowNumber}
                      </td>
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
                disabled={
                  savingImport ||
                  previewRows.filter((r) => r.valid).length === 0
                }
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
    </div>
  );
}
