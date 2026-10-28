import TableRowSkeleton from '../../components/common/TableRowSkeleton';
import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Layers,
  Save,
  Clock,
  Download,
  Lock,
  Filter,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Send,
  ShieldCheck,
  Edit3,
  History,
} from "lucide-react";
import { toast } from "react-toastify";
import { courseSectionService, gradeService } from "../../services/dataService";
import ImportExcelModal from "./ImportExcelModal";
import GradeAnalyticsCard from "../../components/grades/GradeAnalyticsCard";
import { GRADE_GROUPS } from "../../components/grades/gradeConstants";
import GradeAmendmentModal from "../../components/grades/GradeAmendmentModal";
import GradeHistoryModal from "../../components/grades/GradeHistoryModal";

export default function GradeEntryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mySections, setMySections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(
    searchParams.get("sectionId") || "",
  );
  const [grades, setGrades] = useState([]);
  const [groupFilter, setGroupFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [amendmentModalOpen, setAmendmentModalOpen] = useState(false);
  const [selectedStudentForAmendment, setSelectedStudentForAmendment] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedGradeForHistory, setSelectedGradeForHistory] = useState(null);
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
      const [gradesRes, sectionRes] = await Promise.allSettled([
        gradeService.getBySection(sectionId),
        courseSectionService.getById(sectionId)
      ]);
      if (gradesRes.status === "fulfilled") {
        setGrades(gradesRes.value.data?.data || []);
      }
      if (sectionRes.status === "fulfilled" && sectionRes.value.data?.data) {
        const secData = sectionRes.value.data.data;
        setMySections((prev) =>
          prev.map((s) => (s.id === parseInt(sectionId) ? { ...s, ...secData } : s))
        );
      }
      setGroupFilter(null);
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
    setGroupFilter(null);
    loadGrades(secId);
  };

  const handleScoreChange = (enrollmentId, field, value) => {
    const val = value === "" ? "" : parseFloat(value);
    setGrades((prev) =>
      prev.map((g) =>
        g.enrollment?.id === enrollmentId ? { ...g, [field]: val } : g
      )
    );
  };

  // Điểm đặc biệt (V = vắng thi, I = hoãn thi/chưa hoàn thành, M = miễn học phần).
  // Khi chọn V/I/M, điểm thành phần không còn ý nghĩa nên khoá các ô nhập số.
  const handleSpecialChange = (enrollmentId, value) => {
    setGrades((prev) =>
      prev.map((g) =>
        g.enrollment?.id === enrollmentId ? { ...g, specialGrade: value } : g
      )
    );
  };

  const displayedGrades = useMemo(() => {
    if (!groupFilter || !GRADE_GROUPS[groupFilter]) return grades;
    return grades.filter((g) => GRADE_GROUPS[groupFilter].match(g));
  }, [grades, groupFilter]);

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
      window.URL.revokeObjectURL(url);
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

  const handleFinalizeAndSubmit = async () => {
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
        finalize: false,
      }));
      await gradeService.saveBatch(payload);
      await gradeService.submitOfficial(selectedSection);
      toast.success("Đã gửi duyệt và khóa bảng điểm học phần thành công!");
      setShowFinalizeModal(false);
      await loadSections();
      await loadGrades(selectedSection);
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi khi gửi duyệt bảng điểm");
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
  // Luồng 2: Quản lý trạng thái nộp điểm (DRAFT -> SUBMITTED -> RETURNED / PUBLISHED)
  const submissionStatus =
    currentSectionInfo?.gradeSubmissionStatus ||
    (grades.length > 0 && grades[0].enrollment?.courseSection?.gradeSubmissionStatus) ||
    "DRAFT";

  const isSubmitted = submissionStatus === "SUBMITTED";
  const isPublished = submissionStatus === "PUBLISHED";
  const isReturned = submissionStatus === "RETURNED";
  const isDraft = submissionStatus === "DRAFT";
  // Bảng điểm bị khoá cứng (Read-only) khi đã nộp duyệt hoặc đã công bố
  const isLocked = isSubmitted || isPublished;

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
            {isPublished ? (
              <>
                <span
                  className="badge badge-success"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 14px",
                    fontSize: "0.85rem",
                    backgroundColor: "rgba(16, 185, 129, 0.12)",
                    color: "#059669",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    fontWeight: 600,
                  }}
                  title="Bảng điểm đã được Phòng Đào tạo phê duyệt và công bố chính thức toàn trường."
                >
                  <CheckCircle size={15} />
                  <span>ĐÃ CÔNG BỐ CHÍNH THỨC</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudentForAmendment(null);
                    setAmendmentModalOpen(true);
                  }}
                  className="btn btn-warning"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 14px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    borderRadius: "8px",
                  }}
                  title="Tạo đơn yêu cầu điều chỉnh điểm sau khóa sổ trình Trưởng bộ môn & Phòng Đào tạo"
                >
                  <ShieldCheck size={16} />
                  <span>Yêu cầu sửa điểm</span>
                </button>
              </>
            ) : isSubmitted ? (
              <span
                className="badge badge-warning"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  fontSize: "0.85rem",
                  backgroundColor: "rgba(245, 158, 11, 0.12)",
                  color: "#d97706",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  fontWeight: 600,
                }}
                title="Bảng điểm đã nộp lên Phòng Đào tạo và đang được khóa chờ duyệt."
              >
                <Lock size={15} />
                <span>ĐÃ GỬI DUYỆT (CHỜ P. ĐÀO TẠO)</span>
              </span>
            ) : isReturned ? (
              <span
                className="badge badge-danger"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  fontSize: "0.85rem",
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  color: "#dc2626",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  fontWeight: 600,
                }}
                title="Bảng điểm bị Phòng Đào tạo trả về yêu cầu sửa chữa."
              >
                <AlertTriangle size={15} />
                <span>BỊ TRẢ VỀ · CẦN CHỈNH SỬA</span>
              </span>
            ) : (
              <span
                className="badge"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  fontSize: "0.85rem",
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  fontWeight: 600,
                }}
              >
                <span>BẢN NHÁP (ĐANG NHẬP ĐIỂM)</span>
              </span>
            )}

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

            {!isLocked && (
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
                      ? "Chốt điểm & gửi lên Phòng Đào tạo duyệt"
                      : `Còn ${grades.length - gradedCount} sinh viên chưa nhập đủ điểm`
                  }
                  onClick={() => setShowFinalizeModal(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: isReturned ? "#dc2626" : undefined,
                    borderColor: isReturned ? "#dc2626" : undefined,
                  }}
                >
                  <Send size={16} />
                  <span>{isReturned ? "Gửi duyệt lại & Khóa sổ" : "Gửi duyệt & Khóa sổ"}</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Banner cảnh báo trả về nếu có */}
      {isReturned && (
        <div
          style={{
            marginBottom: "20px",
            padding: "16px 20px",
            borderRadius: "10px",
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <AlertTriangle
            size={22}
            style={{ color: "#dc2626", flexShrink: 0, marginTop: "2px" }}
          />
          <div>
            <div style={{ fontWeight: 700, color: "#b91c1c", fontSize: "0.95rem" }}>
              BẢNG ĐIỂM ĐÃ BỊ PHÒNG ĐÀO TẠO TRẢ VỀ YÊU CẦU CHỈNH SỬA
            </div>
            <div
              style={{
                color: "#7f1d1d",
                fontSize: "0.9rem",
                marginTop: "4px",
                lineHeight: 1.5,
              }}
            >
              <strong>Lý do từ Phòng Đào tạo:</strong>{" "}
              {currentSectionInfo?.gradeReturnReason || "Cần rà soát và điều chỉnh lại điểm số."}
            </div>
            <div style={{ color: "#991b1b", fontSize: "0.82rem", marginTop: "4px" }}>
              Giảng viên vui lòng kiểm tra, cập nhật điểm và bấm <strong>"Gửi duyệt lại & Khóa sổ"</strong> để hoàn tất.
            </div>
          </div>
        </div>
      )}

      {/* Banner thông báo bảng điểm đã gửi duyệt */}
      {isSubmitted && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 18px",
            borderRadius: "10px",
            backgroundColor: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#b45309",
            fontSize: "0.88rem",
          }}
        >
          <Lock size={18} style={{ flexShrink: 0 }} />
          <span>
            Bảng điểm đã được gửi lên Phòng Đào tạo và đang ở chế độ <strong>Khóa cứng (Chỉ đọc)</strong> để chờ xét duyệt và công bố chính thức.
          </span>
        </div>
      )}

      {/* Banner thông báo đã công bố */}
      {isPublished && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 18px",
            borderRadius: "10px",
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#047857",
            fontSize: "0.88rem",
          }}
        >
          <CheckCircle size={18} style={{ flexShrink: 0 }} />
          <span>
            Bảng điểm đã được <strong>công bố chính thức</strong> toàn trường
            {currentSectionInfo?.publishedAt
              ? ` vào lúc ${new Date(currentSectionInfo.publishedAt).toLocaleString("vi-VN")}`
              : ""}. Bảng điểm đã khóa sổ học vụ.
          </span>
        </div>
      )}

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
              minWidth: "min(100%, 260px)",
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

      {/* Grade Analytics & Quality Audit Card */}
      {grades.length > 0 && (
        <GradeAnalyticsCard
          grades={grades}
          selectedGroupFilter={groupFilter}
          onSelectGroupFilter={setGroupFilter}
          sectionTitle={currentSectionInfo ? `${currentSectionInfo.sectionCode} — ${currentSectionInfo.subject?.subjectName}` : ''}
          initialExpanded={true}
        />
      )}

      {/* Table */}
      <div className="card">
        {groupFilter && GRADE_GROUPS[groupFilter] && (
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: GRADE_GROUPS[groupFilter].bg,
              borderBottom: `1px solid ${GRADE_GROUPS[groupFilter].border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              fontSize: '0.88rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={14} style={{ color: GRADE_GROUPS[groupFilter].color }} />
              <span>
                Đang lọc nhóm: <strong style={{ color: GRADE_GROUPS[groupFilter].color }}>{GRADE_GROUPS[groupFilter].label}</strong> (Hiển thị <strong>{displayedGrades.length}</strong> / {grades.length} SV)
              </span>
            </div>
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '3px 8px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              onClick={() => setGroupFilter(null)}
            >
              <RotateCcw size={12} />
              <span>Bỏ lọc</span>
            </button>
          </div>
        )}

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: "50px", position: "sticky", left: 0, zIndex: 11, backgroundColor: "var(--bg-surface)" }}>STT</th>
                <th style={{ width: "120px", position: "sticky", left: "50px", zIndex: 11, backgroundColor: "var(--bg-surface)" }}>Mã SV</th>
                <th style={{ minWidth: "200px", position: "sticky", left: "170px", zIndex: 11, backgroundColor: "var(--bg-surface)", boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)" }}>Họ và tên sinh viên</th>
                <th>Lớp SH</th>
                <th style={{ textAlign: "center", minWidth: "100px" }}>
                  CC1 (5%)
                  <br />
                  <small style={{ fontSize: "0.78em", fontWeight: "normal", color: "var(--text-muted)" }}>
                    TP1 · Chuyên cần
                  </small>
                </th>
                <th style={{ textAlign: "center", minWidth: "100px" }}>
                  CC2 (5%)
                  <br />
                  <small style={{ fontSize: "0.78em", fontWeight: "normal", color: "var(--text-muted)" }}>
                    TP1 · Bài tập
                  </small>
                </th>
                <th style={{ textAlign: "center", minWidth: "100px" }}>
                  GK (30%)
                  <br />
                  <small style={{ fontSize: "0.78em", fontWeight: "normal", color: "var(--text-muted)" }}>
                    TP2 · Giữa kỳ
                  </small>
                </th>
                <th style={{ textAlign: "center", minWidth: "110px" }}>
                  CK (60%)
                  <br />
                  <small style={{ fontSize: "0.78em", fontWeight: "bold", color: "#6366f1" }} title="Quy tắc BR-Exam02: Khảo thí độc quyền nạp điểm thi kết thúc học phần theo phòng thi">
                    Khảo thí (BR-Exam02)
                  </small>
                </th>
                <th style={{ textAlign: "center" }}>
                  Đặc biệt
                  <br />
                  <small style={{ fontSize: "0.8em", fontWeight: "normal" }}>
                    V / I / M
                  </small>
                </th>
                <th style={{ textAlign: "center" }}>Tổng kết</th>
                <th style={{ textAlign: "center" }}>Hệ 4</th>
                <th style={{ textAlign: "center" }}>Điểm chữ</th>
                <th style={{ textAlign: "center" }}>Kết quả</th>
                <th style={{ textAlign: "center", width: "85px" }}>Lịch sử</th>
                {isPublished && <th style={{ textAlign: "center", width: "95px" }}>Sửa điểm</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowSkeleton columns={14} />
              ) : grades.length === 0 ? (
                <tr>
                  <td
                    colSpan="14"
                    style={{
                      textAlign: "center",
                      padding: "48px 20px",
                      color: "var(--text-muted)",
                    }}
                  >
                    Lớp học phần này hiện chưa có sinh viên nào đăng ký.
                  </td>
                </tr>
              ) : displayedGrades.length === 0 ? (
                <tr>
                  <td
                    colSpan="13"
                    style={{
                      textAlign: "center",
                      padding: "36px 20px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <p style={{ margin: "0 0 10px" }}>
                      Không có sinh viên nào thuộc nhóm điểm này.
                    </p>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setGroupFilter(null)}
                    >
                      Xem toàn bộ danh sách
                    </button>
                  </td>
                </tr>
              ) : (
                displayedGrades.map((g, idx) => {
                  const enrollmentId = g.enrollment?.id;
                  return (
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
                      {["cc1Score", "cc2Score", "midtermScore", "finalScore"].map((field) => {
                        const isFinalExamField = field === "finalScore";
                        const isFieldDisabled = isLocked || hasSpecial(g) || isFinalExamField;
                        return (
                        <td key={field} style={{ textAlign: "center" }}>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            placeholder={isFinalExamField ? "Khảo thí" : "0.0"}
                            value={g[field] ?? ""}
                            onChange={(e) =>
                              handleScoreChange(enrollmentId, field, e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === "ArrowDown") {
                                e.preventDefault();
                                const nextInput = document.querySelector(`input[data-col="${field}"][data-row="${idx + 1}"]`);
                                if (nextInput) nextInput.focus();
                              } else if (e.key === "ArrowUp") {
                                e.preventDefault();
                                const prevInput = document.querySelector(`input[data-col="${field}"][data-row="${idx - 1}"]`);
                                if (prevInput) prevInput.focus();
                              }
                            }}
                            data-col={field}
                            data-row={idx}
                            disabled={isFieldDisabled}
                            title={isFinalExamField ? "Điểm thi kết thúc học phần do Phòng Khảo thí nạp theo phòng thi (BR-Exam02)" : undefined}
                            className="form-control"
                            style={{
                              width: "68px",
                              padding: "6px",
                              textAlign: "center",
                              margin: "0 auto",
                              fontWeight: 600,
                              backgroundColor: isFieldDisabled ? "var(--bg-subtle, #f3f4f6)" : undefined,
                              cursor: isFieldDisabled ? "not-allowed" : undefined,
                            }}
                          />
                        </td>
                        );
                      })}
                      <td style={{ textAlign: "center" }}>
                        <select
                          value={g.specialGrade || "NONE"}
                          onChange={(e) =>
                            handleSpecialChange(enrollmentId, e.target.value)
                          }
                          disabled={isLocked}
                          className="form-select"
                          style={{
                            width: "92px",
                            padding: "6px",
                            margin: "0 auto",
                            fontWeight: 600,
                            backgroundColor: isLocked ? "var(--bg-subtle, #f3f4f6)" : undefined,
                            cursor: isLocked ? "not-allowed" : undefined,
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
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGradeForHistory(g);
                          setHistoryModalOpen(true);
                        }}
                        className="btn btn-sm btn-outline-info"
                        style={{
                          padding: "3px 8px",
                          fontSize: "0.75rem",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                        title="Xem nhật ký kiểm toán sửa điểm (BR-Grade09)"
                      >
                        <History size={13} />
                        <span>Lịch sử</span>
                      </button>
                    </td>
                    {isPublished && (
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentForAmendment(g.enrollment?.student);
                            setAmendmentModalOpen(true);
                          }}
                          className="btn btn-sm btn-outline-warning"
                          style={{
                            padding: "3px 8px",
                            fontSize: "0.75rem",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          title="Tạo đơn yêu cầu sửa điểm sau khóa sổ cho sinh viên này"
                        >
                          <Edit3 size={13} />
                          <span>Sửa</span>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cam Kết Chốt & Khóa Bảng Điểm Gửi Admin */}
      {showFinalizeModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowFinalizeModal(false);
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "520px",
              backgroundColor: "var(--bg-surface, #ffffff)",
              borderRadius: "12px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
              padding: "24px",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Lock size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)" }}>
                  Xác Nhận Chốt & Khóa Sổ Điểm
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Lớp học phần: <strong>{currentSectionInfo?.sectionCode}</strong> — {currentSectionInfo?.subject?.subjectName}
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "var(--bg-subtle, #f9fafb)",
                border: "1px solid var(--border, #e5e7eb)",
                borderRadius: "8px",
                padding: "14px",
                marginBottom: "16px",
                fontSize: "0.88rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Tổng số sinh viên trong lớp:</span>
                <strong>{grades.length} SV (100% đã có điểm)</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Số sinh viên ĐẠT học phần:</span>
                <strong style={{ color: "#059669" }}>{passedCount} SV ({passRate}%)</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Số sinh viên HỌC LẠI (F):</span>
                <strong style={{ color: "#dc2626" }}>{grades.length - passedCount} SV</strong>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.08)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                borderRadius: "8px",
                padding: "12px 14px",
                marginBottom: "20px",
                fontSize: "0.85rem",
                color: "#b45309",
                lineHeight: 1.5,
              }}
            >
              ⚠️ <strong>Quy chế đào tạo tín chỉ (Luồng 2):</strong> Sau khi bấm gửi duyệt, bảng điểm lớp học phần sẽ được <strong>KHÓA CỨNG TOÀN BỘ (Chỉ đọc)</strong>. Giảng viên sẽ không thể tự ý sửa điểm nữa. Phòng Đào tạo sẽ kiểm tra tính hợp lệ trước khi bấm <strong>Phát hành điểm</strong> chính thức tới toàn bộ sinh viên.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowFinalizeModal(false)}
                disabled={saving}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleFinalizeAndSubmit}
                disabled={saving}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "#2563eb",
                  borderColor: "#2563eb",
                  fontWeight: 600,
                }}
              >
                <Send size={15} />
                <span>{saving ? "Đang gửi duyệt..." : "Cam kết Chốt & Gửi duyệt"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Yêu Cầu Sửa Điểm Sau Khóa Sổ */}
      <GradeAmendmentModal
        isOpen={amendmentModalOpen}
        onClose={() => setAmendmentModalOpen(false)}
        section={currentSectionInfo}
        student={selectedStudentForAmendment}
        grades={grades}
        onSuccess={() => {
          fetchGrades(selectedSection);
        }}
      />

      {/* Modal Lịch Sử Kiểm Toán Sửa Điểm (BR-Grade09) */}
      <GradeHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        grade={selectedGradeForHistory}
        student={selectedGradeForHistory?.enrollment?.student}
        section={currentSectionInfo}
      />
    </div>
  );
}
