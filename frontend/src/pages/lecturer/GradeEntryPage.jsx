import TableRowSkeleton from '../../components/common/TableRowSkeleton';
import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Layers,
  Save,
  CheckCircle,
  CheckCircle2,
  Download,
  Lock,
} from "lucide-react";
import { toast } from "react-toastify";
import { courseSectionService, gradeService } from "../../services/dataService";
import ImportExcelModal from "./ImportExcelModal";

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

  // ponytail: rely on backend's isPassed (Grade.getIsPassed @JsonProperty).
  // Only fall back to local calculation for unsaved rows that haven't round-tripped yet.
  const isStudentPassed = (g) => {
    if (g.isPassed !== undefined && g.isPassed !== null) return g.isPassed;
    return null;
  };

  // Kết quả hiển thị ở cột "Kết Quả" — dựa trên isPassed từ backend.
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
              <ImportExcelModal
                sectionId={selectedSection}
                onImportDone={() => loadGrades(selectedSection)}
              />
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
                    {["cc1Score", "cc2Score", "midtermScore", "finalScore"].map((field) => (
                      <td key={field} style={{ textAlign: "center" }}>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          placeholder="0.0"
                          value={g[field] ?? ""}
                          onChange={(e) =>
                            handleScoreChange(idx, field, e.target.value)
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
                    ))}
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
    </div>
  );
}
