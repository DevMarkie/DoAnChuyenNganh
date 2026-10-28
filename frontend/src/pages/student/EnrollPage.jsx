import { useState, useEffect, useRef, useMemo } from "react";
import {
  Check,
  Plus,
  AlertCircle,
  Search,
  Sparkles,
  Trash2,
  Lock,
  BookmarkCheck,
  Calendar,
} from "lucide-react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import * as dataServices from "../../services/dataService";
const {
  semesterService,
  courseSectionService,
  enrollmentService,
  registrationWaveService,
  tuitionService,
  transcriptService,
} = dataServices;
import SmartScheduleModal from "./SmartScheduleModal";

export default function EnrollPage() {
  const [currentSemester, setCurrentSemester] = useState(null);
  const [availableSections, setAvailableSections] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [search, setSearch] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [enrollingId, setEnrollingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [filterTab, setFilterTab] = useState("all"); // 'all' | 'enrolled'
  const [smartModalOpen, setSmartModalOpen] = useState(false);
  const [regStatus, setRegStatus] = useState(null);
  const [tuitionSummary, setTuitionSummary] = useState(null);
  const [transcriptData, setTranscriptData] = useState(null);
  const [simulatingPay, setSimulatingPay] = useState(false);
  const enrollmentInFlight = useRef(false);

  const warningLevel = transcriptData?.warningLevel || 0;
  const isSuspended = warningLevel >= 3;
  const maxAllowedCredits = transcriptData?.maxAllowedCredits || (warningLevel === 2 ? 10 : warningLevel === 1 ? 14 : 24);
  const isTuitionOverdue = Boolean(tuitionSummary?.isTuitionOverdue || tuitionSummary?.financialHold);
  const isEligibleToEnroll = Boolean(
    currentSemester?.registrationOpen &&
      (regStatus ? regStatus.canRegister : true) &&
      !isTuitionOverdue &&
      !isSuspended
  );

  const loadData = async ({ initial = false } = {}) => {
    try {
      if (initial) setInitialLoading(true);
      else setRefreshing(true);
      setLoadError(false);
      const [resSem, resEnr, resWave, resTuition, resTranscript] = await Promise.all([
        semesterService.getCurrent(),
        enrollmentService.getMyEnrollments(),
        registrationWaveService?.getMyStatus ? registrationWaveService.getMyStatus().catch(() => ({ data: { data: null } })) : Promise.resolve({ data: { data: null } }),
        tuitionService?.getMyTuition ? tuitionService.getMyTuition().catch(() => ({ data: { data: null } })) : Promise.resolve({ data: { data: null } }),
        transcriptService?.getMyTranscript ? transcriptService.getMyTranscript().catch(() => ({ data: { data: null } })) : Promise.resolve({ data: { data: null } }),
      ]);
      const sem = resSem.data.data;
      setCurrentSemester(sem);
      const enrList = resEnr.data.data || [];
      setMyEnrollments(enrList);
      setRegStatus(resWave?.data?.data || null);
      setTuitionSummary(resTuition?.data?.data || null);
      setTranscriptData(resTranscript?.data?.data || null);

      if (sem?.registrationOpen) {
        const resSec = await courseSectionService.getOpenBySemester(sem.id);
        setAvailableSections(resSec.data.data || []);
      } else {
        setAvailableSections([]);
      }
    } catch {
      setLoadError(true);
      toast.error("Không thể tải dữ liệu đăng ký. Vui lòng thử lại.");
    } finally {
      if (initial) setInitialLoading(false);
      else setRefreshing(false);
    }
  };

  const handleQuickPay = async () => {
    try {
      setSimulatingPay(true);
      const res = await tuitionService.simulatePay();
      toast.success(res.data?.message || 'Giả lập thanh toán thành công! Quyền đăng ký môn đã được mở khóa.');
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể thực hiện thanh toán giả lập';
      toast.error(msg);
    } finally {
      setSimulatingPay(false);
    }
  };

  useEffect(() => {
    loadData({ initial: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnroll = async (sectionId) => {
    if (isSuspended) {
      toast.error("Tài khoản đang bị Buộc thôi học do vi phạm quy chế học vụ. Cổng ĐKTC đã bị đóng.");
      return;
    }
    if (isTuitionOverdue) {
      toast.error("Tài khoản đang có học phí quá hạn. Bạn đã bị tạm khóa quyền đăng ký học phần đợt này.");
      return;
    }
    if (enrollmentInFlight.current) return;
    enrollmentInFlight.current = true;
    try {
      setEnrollingId(sectionId);
      await enrollmentService.enroll({ sectionId });
      toast.success("Đăng ký học phần thành công!");
      await loadData();
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      toast.error(
        status === 409
          ? "Lớp học phần vừa thay đổi. Vui lòng tải lại danh sách."
          : message || "Đăng ký thất bại. Vui lòng thử lại.",
      );
    } finally {
      setEnrollingId(null);
      enrollmentInFlight.current = false;
    }
  };

  const handleCancelEnrollment = async (enrollmentId, subjectName) => {
    if (!currentSemester?.registrationOpen) {
      toast.warning("Cổng đăng ký hiện đang đóng. Không thể thao tác hủy môn.");
      return;
    }
    if (enrollmentInFlight.current) return;
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đăng ký môn: ${subjectName}?`)) {
      return;
    }
    enrollmentInFlight.current = true;
    try {
      setCancellingId(enrollmentId);
      await enrollmentService.cancel(enrollmentId);
      toast.success(`Đã hủy đăng ký môn ${subjectName} thành công!`);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Hủy đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setCancellingId(null);
      enrollmentInFlight.current = false;
    }
  };

  const { enrolledSectionIds, enrolledSubjectIds, enrolledSectionMap, totalEnrolledCredits } = useMemo(() => {
    const secIds = new Set();
    const subIds = new Set();
    const secMap = new Map();
    let credits = 0;
    myEnrollments.forEach((e) => {
      const isForCurrentSemester =
        !currentSemester ||
        String(e.courseSection?.semester?.id) === String(currentSemester.id);

      if (e.status === "ENROLLED" && isForCurrentSemester) {
        if (e.courseSection?.id) {
          secIds.add(e.courseSection.id);
          secMap.set(e.courseSection.id, e);
        }
        if (e.courseSection?.subject?.id) {
          subIds.add(e.courseSection.subject.id);
          credits += e.courseSection.subject.credits || 0;
        }
      }
    });
    return { enrolledSectionIds: secIds, enrolledSubjectIds: subIds, enrolledSectionMap: secMap, totalEnrolledCredits: credits };
  }, [myEnrollments, currentSemester]);

  const filtered = useMemo(() => {
    return availableSections.filter((s) => {
      if (filterTab === "enrolled" && !enrolledSectionIds.has(s.id)) {
        return false;
      }
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.sectionCode?.toLowerCase().includes(q) ||
        s.subject?.subjectName?.toLowerCase().includes(q) ||
        s.lecturer?.fullName?.toLowerCase().includes(q)
      );
    });
  }, [availableSections, filterTab, enrolledSectionIds, search]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Đăng Ký Học Phần Trực Tuyến</h1>
          <p>
            Học kỳ hiện tại:{" "}
            <strong>
              {currentSemester ? currentSemester.semesterName : "Đang cập nhật"}
            </strong>
          </p>
        </div>
      </div>

      {currentSemester && !currentSemester.registrationOpen && (
        <div
          className="card"
          style={{
            marginBottom: "20px",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderLeft: "4px solid var(--warning)",
          }}
        >
          <AlertCircle size={20} style={{ color: "var(--warning)" }} />
          <div>
            <strong>Đợt đăng ký học phần hiện chưa mở.</strong>
            <div
              style={{
                color: "var(--text-muted)",
                fontSize: "0.875rem",
                marginTop: "3px",
              }}
            >
              {currentSemester.registrationStart &&
              currentSemester.registrationEnd
                ? `Thời gian đăng ký: ${currentSemester.registrationStart} đến ${currentSemester.registrationEnd}.`
                : "Phòng Đào tạo chưa cấu hình thời gian đăng ký cho học kỳ này."}
            </div>
          </div>
        </div>
      )}

      {/* Academic Warning / Suspension Banners */}
      {isSuspended ? (
        <div
          className="card"
          style={{
            marginBottom: "20px",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            borderLeft: "4px solid var(--danger, #ef4444)",
            backgroundColor: "#fef2f2",
            color: "#991b1b",
          }}
        >
          <AlertCircle size={24} style={{ color: "var(--danger, #ef4444)", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <strong style={{ fontSize: "0.95rem" }}>
                Tài khoản bị BUỘC THÔI HỌC (ACADEMIC HOLD)
              </strong>
              <span className="badge badge-danger" style={{ fontWeight: 700, fontSize: "0.75rem" }}>
                BUỘC THÔI HỌC
              </span>
            </div>
            <div style={{ color: "#7f1d1d", fontSize: "0.875rem", marginTop: "4px", lineHeight: "1.4" }}>
              {transcriptData?.warningNotice || "Tài khoản bị buộc thôi học do vi phạm quy chế học vụ hoặc vượt quá thời gian đào tạo tối đa. Cổng đăng ký tín chỉ đã bị khóa hoàn toàn."}
            </div>
          </div>
        </div>
      ) : warningLevel > 0 ? (
        <div
          className="card"
          style={{
            marginBottom: "20px",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            borderLeft: "4px solid var(--warning, #f59e0b)",
            backgroundColor: "#fffbeb",
            color: "#92400e",
          }}
        >
          <AlertCircle size={24} style={{ color: "var(--warning, #f59e0b)", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <strong style={{ fontSize: "0.95rem" }}>
                CẢNH BÁO HỌC VỤ MỨC {warningLevel} - SIẾT HẠN MỨC TÍN CHỈ
              </strong>
              <span className="badge badge-warning" style={{ fontWeight: 700, fontSize: "0.75rem" }}>
                MỨC {warningLevel}
              </span>
            </div>
            <div style={{ color: "#78350f", fontSize: "0.875rem", marginTop: "4px", lineHeight: "1.4" }}>
              Theo quy chế học vụ, hạn mức đăng ký tín chỉ tối đa của bạn kỳ này bị siết còn <strong>{maxAllowedCredits} tín chỉ</strong> ({totalEnrolledCredits}/{maxAllowedCredits} TC đã đăng ký).
              {transcriptData?.warningNotice ? ` Lý do: ${transcriptData.warningNotice}` : ""}
            </div>
          </div>
        </div>
      ) : null}

      {/* Tuition Overdue Lock Banner */}
      {isTuitionOverdue && (
        <div
          className="card"
          style={{
            marginBottom: "20px",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            borderLeft: "4px solid var(--danger, #ef4444)",
            backgroundColor: "#fef2f2",
            color: "#991b1b",
          }}
        >
          <AlertCircle size={24} style={{ color: "var(--danger, #ef4444)", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <strong style={{ fontSize: "0.95rem" }}>
                Tài khoản bị đóng băng dịch vụ học vụ (FINANCIAL HOLD)
              </strong>
              <span className="badge badge-danger" style={{ fontWeight: 700, fontSize: "0.75rem" }}>
                🔒 FINANCIAL HOLD
              </span>
            </div>
            <div
              style={{
                color: "#7f1d1d",
                fontSize: "0.875rem",
                marginTop: "4px",
                lineHeight: "1.4",
              }}
            >
              Hệ thống ghi nhận tài khoản có học phí quá hạn chưa hoàn tất thanh toán. Theo Quy chế Đào tạo, quyền đăng ký học phần đợt này đã bị tạm khóa.
              Vui lòng chuyển đến trang <strong>Học phí</strong> để thanh toán hoặc liên hệ <strong>Phòng Kế hoạch - Tài chính (KHTC)</strong> để được hỗ trợ mở khóa.
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button
              type="button"
              disabled={simulatingPay}
              onClick={handleQuickPay}
              className="btn btn-danger btn-sm"
              style={{
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: 600,
              }}
            >
              <Sparkles size={14} />
              <span>{simulatingPay ? "Đang xử lý..." : "Giả lập thanh toán mở khóa"}</span>
            </button>
            <Link
              to="/student/tuition"
              className="btn btn-outline btn-sm"
              style={{ textDecoration: "none", whiteSpace: "nowrap" }}
            >
              Đến trang Học phí
            </Link>
          </div>
        </div>
      )}

      {/* Registration Wave & Window Banner */}
      {regStatus && (
        <div
          className="card"
          style={{
            marginBottom: "20px",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            borderLeft: regStatus.canRegister
              ? "4px solid var(--success, #10b981)"
              : "4px solid var(--warning, #f59e0b)",
            backgroundColor: regStatus.canRegister ? "#f0fdf4" : "#fffbeb",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Calendar
              size={24}
              style={{
                color: regStatus.canRegister ? "#059669" : "#d97706",
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <strong style={{ fontSize: "0.95rem", color: "#1e293b" }}>
                  {regStatus.activeWave
                    ? regStatus.activeWave.name
                    : regStatus.upcomingWave
                    ? `Đợt sắp tới: ${regStatus.upcomingWave.name}`
                    : "Đợt đăng ký học phần tín chỉ"}
                </strong>
                {regStatus.canRegister ? (
                  <span className="badge badge-success" style={{ fontWeight: 700, fontSize: "0.75rem" }}>
                    ● ĐANG MỞ
                  </span>
                ) : (
                  <span className="badge badge-warning" style={{ fontSize: "0.75rem" }}>
                    CHƯA ĐẾN ĐỢT ĐĂNG KÝ
                  </span>
                )}
              </div>
              <div
                style={{
                  color: "#475569",
                  fontSize: "0.85rem",
                  marginTop: "4px",
                }}
              >
                {regStatus.message}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", flexWrap: "wrap" }}>
            {(regStatus.currentShiftName || regStatus.activeWave?.shiftName) && (
              <span className="badge badge-primary" style={{ padding: "4px 8px", fontWeight: 700 }}>
                {regStatus.currentShiftName || regStatus.activeWave?.shiftName}
              </span>
            )}
            <span className="badge badge-outline" style={{ border: "1px solid #cbd5e1", padding: "4px 8px" }}>
              Khóa: <strong>{regStatus.studentCohort || "Toàn trường"}</strong>
            </span>
            <span className="badge badge-outline" style={{ border: "1px solid #cbd5e1", padding: "4px 8px" }}>
              Khoa: <strong>{regStatus.studentDepartment || "Toàn trường"}</strong>
            </span>
            {regStatus.studentMajor && regStatus.studentMajor !== "Chưa xác định" && (
              <span className="badge badge-outline" style={{ border: "1px solid #f59e0b", color: "#b45309", padding: "4px 8px", backgroundColor: "#fffbeb" }}>
                Ngành: <strong>{regStatus.studentMajor}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* KPI Credit & Tuition Summary Banner */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div
          className="card-body"
          style={{
            padding: "16px 20px",
            display: "flex",
            gap: "24px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Khối lượng đã chọn:
            </span>
            <span
              className="badge badge-info"
              style={{ fontSize: "0.9rem", padding: "4px 10px", fontWeight: 700 }}
            >
              {totalEnrolledCredits} / {maxAllowedCredits} Tín chỉ
            </span>
            {totalEnrolledCredits < 12 ? (
              <span className="badge badge-warning" style={{ fontSize: "0.8rem", marginLeft: "6px" }}>
                Chưa đạt tối thiểu 12 TC (Quy chế: 12 - 24 TC)
              </span>
            ) : totalEnrolledCredits <= 24 ? (
              <span className="badge badge-success" style={{ fontSize: "0.8rem", marginLeft: "6px" }}>
                Đạt chuẩn tín chỉ kỳ chính (12 - 24 TC)
              </span>
            ) : (
              <span className="badge badge-danger" style={{ fontSize: "0.8rem", marginLeft: "6px" }}>
                Vượt quá giới hạn tối đa 24 TC
              </span>
            )}
          </div>
          <div
            style={{
              width: "1px",
              height: "20px",
              backgroundColor: "var(--border-color)",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Học phí tạm tính:
            </span>
            <span
              style={{
                fontWeight: 800,
                fontSize: "1.05rem",
                color: "var(--primary)",
              }}
            >
              {(totalEnrolledCredits * 450000).toLocaleString("vi-VN")} đ
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>
              (450.000 đ / TC)
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div
          className="card-body"
          style={{
            padding: "16px 20px",
            display: "flex",
            gap: "16px",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", flex: 1 }}>
            <div style={{ position: "relative", minWidth: "280px", flex: 1, maxWidth: "420px" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50)",
                  color: "var(--text-light)",
                }}
              />
              <input
                type="text"
                placeholder="Tìm theo mã HP, tên môn, giảng viên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={!currentSemester?.registrationOpen}
                className="form-control"
                style={{ paddingLeft: "36px" }}
              />
            </div>

            <div style={{ display: "inline-flex", background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", padding: "3px" }}>
              <button
                type="button"
                className={`btn btn-sm ${filterTab === "all" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setFilterTab("all")}
                style={{ border: "none", padding: "6px 12px" }}
              >
                Tất cả môn ({availableSections.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filterTab === "enrolled" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setFilterTab("enrolled")}
                style={{ border: "none", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: "5px" }}
              >
                <BookmarkCheck size={14} />
                <span>Môn đã chọn ({enrolledSectionIds.size})</span>
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {currentSemester?.registrationOpen && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setSmartModalOpen(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Sparkles size={16} style={{ color: "var(--primary)" }} />
                <span>Gợi ý TKB thông minh</span>
              </button>
            )}
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Hiển thị <strong>{filtered.length}</strong> lớp học phần
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã lớp HP</th>
                <th>Tên môn học</th>
                <th>Tín chỉ</th>
                <th>Giảng viên giảng dạy</th>
                <th>Lịch học</th>
                <th>Phòng học</th>
                <th>Sĩ số ĐK</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {initialLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr
                    key={`skeleton-${index}`}
                    style={{
                      opacity: 0.6,
                      animation: "pulse 1.5s infinite ease-in-out",
                    }}
                  >
                    <td>
                      <div
                        style={{
                          height: "22px",
                          width: "60px",
                          backgroundColor: "var(--border-color, #e2e8f0)",
                          borderRadius: "4px",
                        }}
                      ></div>
                    </td>
                    <td>
                      <div
                        style={{
                          height: "22px",
                          width: "200px",
                          backgroundColor: "var(--border-color, #e2e8f0)",
                          borderRadius: "4px",
                        }}
                      ></div>
                    </td>
                    <td>
                      <div
                        style={{
                          height: "22px",
                          width: "40px",
                          backgroundColor: "var(--border-color, #e2e8f0)",
                          borderRadius: "4px",
                        }}
                      ></div>
                    </td>
                    <td>
                      <div
                        style={{
                          height: "22px",
                          width: "120px",
                          backgroundColor: "var(--border-color, #e2e8f0)",
                          borderRadius: "4px",
                        }}
                      ></div>
                    </td>
                    <td>
                      <div
                        style={{
                          height: "22px",
                          width: "80px",
                          backgroundColor: "var(--border-color, #e2e8f0)",
                          borderRadius: "4px",
                        }}
                      ></div>
                    </td>
                    <td>
                      <div
                        style={{
                          height: "22px",
                          width: "50px",
                          backgroundColor: "var(--border-color, #e2e8f0)",
                          borderRadius: "4px",
                        }}
                      ></div>
                    </td>
                    <td>
                      <div
                        style={{
                          height: "22px",
                          width: "40px",
                          backgroundColor: "var(--border-color, #e2e8f0)",
                          borderRadius: "4px",
                        }}
                      ></div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div
                        style={{
                          height: "28px",
                          width: "100px",
                          backgroundColor: "var(--border-color, #e2e8f0)",
                          borderRadius: "4px",
                          display: "inline-block",
                        }}
                      ></div>
                    </td>
                  </tr>
                ))
              ) : loadError ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{ textAlign: "center", padding: "48px 20px" }}
                  >
                    <div
                      style={{ color: "var(--danger)", marginBottom: "12px" }}
                    >
                      Không thể tải danh sách học phần.
                    </div>
                    <button
                      className="btn btn-outline"
                      type="button"
                      onClick={loadData}
                    >
                      Thử lại
                    </button>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      textAlign: "center",
                      padding: "48px 20px",
                      color: "var(--text-muted)",
                    }}
                  >
                    {currentSemester && !currentSemester.registrationOpen
                      ? "Danh sách môn học sẽ hiển thị khi đợt đăng ký của học kỳ được mở."
                      : "Không có lớp học phần nào đang mở hoặc phù hợp với từ khóa tìm kiếm."}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const enrolled = enrolledSectionIds.has(s.id);
                  const subjectAlreadyEnrolled =
                    !enrolled && enrolledSubjectIds.has(s.subject?.id);
                  const isFull = (s.currentStudents || 0) >= s.maxStudents;

                  return (
                    <tr key={s.id}>
                      <td>
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
                          {s.sectionCode}
                        </span>
                      </td>
                      <td
                        style={{ fontWeight: 600, color: "var(--text-main)" }}
                      >
                        {s.subject?.subjectName}
                      </td>
                      <td>
                        <span className="badge badge-info">
                          {s.subject?.credits} TC
                        </span>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {s.lecturer?.fullName || "—"}
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {s.schedule || "—"}
                      </td>
                      <td>
                        <span className="badge badge-neutral">
                          {s.room || "—"}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            fontVariantNumeric: "tabular-nums",
                            color: isFull
                              ? "var(--danger)"
                              : "var(--text-main)",
                          }}
                        >
                          {s.currentStudents || 0} / {s.maxStudents}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {enrolled ? (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
                            <span
                              className="badge badge-success"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 8px",
                              }}
                            >
                              <Check size={14} /> Đã ĐK
                            </span>
                            {currentSemester?.registrationOpen ? (
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                style={{
                                  color: "var(--danger)",
                                  borderColor: "var(--danger)",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "3px 8px",
                                  fontSize: "0.8rem",
                                }}
                                disabled={cancellingId === enrolledSectionMap.get(s.id)?.id}
                                onClick={() =>
                                  handleCancelEnrollment(
                                    enrolledSectionMap.get(s.id)?.id,
                                    s.subject?.subjectName,
                                  )
                                }
                                title="Hủy đăng ký lớp học phần này"
                              >
                                <Trash2 size={13} />
                                <span>
                                  {cancellingId === enrolledSectionMap.get(s.id)?.id
                                    ? "Đang hủy..."
                                    : "Hủy môn"}
                                </span>
                              </button>
                            ) : (
                              <span
                                className="badge badge-neutral"
                                title="Cổng đăng ký đã đóng. Không thể hủy môn"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  fontSize: "0.75rem",
                                  opacity: 0.7,
                                }}
                              >
                                <Lock size={12} /> Cổng đóng
                              </span>
                            )}
                          </div>
                        ) : subjectAlreadyEnrolled ? (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            disabled
                            title="Đã chọn lớp khác của môn này"
                          >
                            Đã chọn lớp khác
                          </button>
                        ) : isFull ? (
                          <span
                            className="badge badge-danger"
                            style={{ padding: "4px 10px" }}
                          >
                            Hết chỗ
                          </span>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={!isEligibleToEnroll || enrollingId === s.id}
                            onClick={() => handleEnroll(s.id)}
                            title={
                              isTuitionOverdue
                                ? "Tạm khóa do nợ học phí quá hạn"
                                : !currentSemester?.registrationOpen
                                  ? "Cổng đăng ký đang đóng"
                                  : !isEligibleToEnroll
                                    ? (regStatus?.message || "Ngoài khung giờ đăng ký")
                                    : "Đăng ký môn này"
                            }
                          >
                            <Plus size={14} />
                            <span>
                              {enrollingId === s.id
                                ? "Đang ghi nhận..."
                                : isTuitionOverdue
                                  ? "Khóa nợ HP"
                                  : !currentSemester?.registrationOpen
                                    ? "Cổng đóng"
                                    : !isEligibleToEnroll
                                      ? "Chưa đến đợt"
                                      : "Đăng ký môn"}
                            </span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {refreshing && (
            <div
              className="table-refresh-indicator"
              role="status"
              aria-live="polite"
            >
              Đang cập nhật danh sách...
            </div>
          )}
        </div>
      </div>

      {/* Smart Schedule Modal */}
      {smartModalOpen && (
        <SmartScheduleModal
          availableSections={availableSections}
          enrolledSubjectIds={enrolledSubjectIds}
          onEnrollSection={handleEnroll}
          onClose={() => setSmartModalOpen(false)}
        />
      )}
    </div>
  );
}
