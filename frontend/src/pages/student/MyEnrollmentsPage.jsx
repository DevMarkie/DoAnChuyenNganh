import { useState, useEffect, useRef, useMemo } from "react";
import {
  Trash2,
  Lock,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Building2,
  X,
  Copy,
  Check,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import { enrollmentService, semesterService, tuitionService } from "../../services/dataService";
import useAuthStore from "../../store/authStore";
import Skeleton from "../../components/common/Skeleton";

export default function MyEnrollmentsPage() {
  const { user } = useAuthStore();
  const [enrollments, setEnrollments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [tuitionSummary, setTuitionSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [paying, setPaying] = useState(false);
  const cancellationInFlight = useRef(false);

  const unitRate = 450000; // 450.000 đ / TC quy chuẩn

  const loadData = async () => {
    try {
      setLoading(true);
      const [resEnr, resSem] = await Promise.allSettled([
        enrollmentService.getMyEnrollments(),
        semesterService.getAll(),
      ]);

      const enrList =
        resEnr.status === "fulfilled" ? resEnr.value.data?.data || [] : [];
      setEnrollments(enrList);

      let semList =
        resSem.status === "fulfilled" ? resSem.value.data?.data || [] : [];

      const knownSemIds = new Set(semList.map((s) => String(s.id)));
      enrList.forEach((e) => {
        const s = e.courseSection?.semester;
        if (s && s.id && !knownSemIds.has(String(s.id))) {
          semList.push(s);
          knownSemIds.add(String(s.id));
        }
      });

      setSemesters(semList);

      setSelectedSemesterId((prev) => {
        if (prev) return prev;
        const currentSem = semList.find((s) => s.isCurrent);
        if (currentSem) return String(currentSem.id);
        if (enrList.length > 0 && enrList[0].courseSection?.semester?.id) {
          return String(enrList[0].courseSection.semester.id);
        }
        if (semList.length > 0) return String(semList[0].id);
        return "ALL";
      });
    } catch {
      toast.error("Lỗi khi tải dữ liệu công nợ & học phí sinh viên");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tuitionService?.getMyTuition) {
      const semParam = selectedSemesterId && selectedSemesterId !== "ALL" ? Number(selectedSemesterId) : undefined;
      tuitionService.getMyTuition(semParam)
        .then((res) => {
          if (res.data?.data) {
            setTuitionSummary(res.data.data);
          }
        })
        .catch(() => {});
    }
  }, [selectedSemesterId]);

  const handleSimulatePay = async () => {
    try {
      setPaying(true);
      const semParam = selectedSemesterId && selectedSemesterId !== "ALL" ? Number(selectedSemesterId) : null;
      const res = await tuitionService.simulatePay({ semesterId: semParam });
      toast.success(res.data?.message || 'Giả lập thanh toán học phí thành công!');
      setShowQrModal(false);
      if (tuitionService?.getMyTuition) {
        tuitionService.getMyTuition(semParam).then((tRes) => {
          if (tRes.data?.data) {
            setTuitionSummary(tRes.data.data);
          }
        }).catch(() => {});
      }
      loadData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể thực hiện thanh toán giả lập';
      toast.error(msg);
    } finally {
      setPaying(false);
    }
  };

  const handleCancel = async (id, sectionName) => {
    if (cancellationInFlight.current) return;
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn huỷ đăng ký học phần: ${sectionName}?`,
      )
    ) {
      return;
    }
    cancellationInFlight.current = true;
    try {
      await enrollmentService.cancel(id);
      toast.success("Đã huỷ đăng ký học phần thành công!");
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Huỷ đăng ký thất bại");
    } finally {
      cancellationInFlight.current = false;
    }
  };

  const selectedSemesterObj = useMemo(() => {
    if (!selectedSemesterId || selectedSemesterId === "ALL") return null;
    return (
      semesters.find((s) => String(s.id) === String(selectedSemesterId)) || null
    );
  }, [semesters, selectedSemesterId]);

  const filteredEnrollments = useMemo(() => {
    if (!selectedSemesterId || selectedSemesterId === "ALL") {
      return enrollments;
    }
    return enrollments.filter(
      (e) =>
        String(e.courseSection?.semester?.id) === String(selectedSemesterId),
    );
  }, [enrollments, selectedSemesterId]);

  const activeEnrollments = useMemo(() => {
    return filteredEnrollments.filter(
      (e) => e.status === "ENROLLED" || e.status === "COMPLETED",
    );
  }, [filteredEnrollments]);

  const totalCredits = useMemo(() => {
    return activeEnrollments.reduce(
      (sum, e) => sum + (e.courseSection?.subject?.credits || 0),
      0,
    );
  }, [activeEnrollments]);

  // Tuition & Debt Calculations
  const { totalFee, paidFee, debtFee, deadlineDateStr, daysLeft, isOverdue } =
    useMemo(() => {
      let total = 0;
      let paid = 0;

      filteredEnrollments.forEach((e) => {
        const credits = e.courseSection?.subject?.credits || 0;
        const invoice = (tuitionSummary?.items || []).find(
          (inv) => inv.sectionId === e.courseSection?.id
        );
        const invAmount = invoice?.amount != null ? Number(invoice.amount) : credits * unitRate;
        const isPaid = invoice ? invoice.status === "PAID" : e.status === "COMPLETED";

        if (isPaid) {
          total += invAmount;
          paid += invAmount;
        } else if (e.status === "ENROLLED") {
          total += invAmount;
        }
      });

      const debt = Math.max(0, total - paid);

      let deadline = "30/11/2026";
      let days = 21;
      let overdue = false;

      const sem = selectedSemesterObj;
      const targetDeadlineStr = tuitionSummary?.extendedDeadline || tuitionSummary?.tuitionDeadline;
      if (targetDeadlineStr) {
        const d = new Date(targetDeadlineStr);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        deadline = `${day}/${m}/${y}`;
        const diff = d.getTime() - Date.now();
        days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        overdue = days < 0;
      } else if (sem?.registrationEnd) {
        const d = new Date(sem.registrationEnd);
        d.setDate(d.getDate() + 14); // 14 ngày sau hạn đăng ký
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        deadline = `${day}/${m}/${y}`;
        const diff = d.getTime() - Date.now();
        days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        overdue = days < 0;
      } else if (sem?.endDate) {
        const d = new Date(sem.endDate);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        deadline = `${day}/${m}/${y}`;
        const diff = d.getTime() - Date.now();
        days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        overdue = days < 0;
      }

      return {
        totalFee: tuitionSummary?.totalAmount != null ? Number(tuitionSummary.totalAmount) : total,
        paidFee: tuitionSummary?.paidAmount != null ? Number(tuitionSummary.paidAmount) : paid,
        debtFee: tuitionSummary?.unpaidAmount != null ? Number(tuitionSummary.unpaidAmount) : debt,
        deadlineDateStr: deadline,
        daysLeft: days,
        isOverdue: overdue,
      };
    }, [filteredEnrollments, selectedSemesterObj, tuitionSummary]);

  const transferContent = `${user?.username || "SV"} Nop hoc phi ${selectedSemesterObj?.semesterCode || "HK"}`;
  const qrUrl = `https://img.vietqr.io/image/bidv-12410001234567-compact.png?amount=${debtFee}&addInfo=${encodeURIComponent(transferContent)}&accountName=TRUONG%20DAI%20HOC%20SMS`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    toast.info("Đã sao chép nội dung vào bộ nhớ tạm");
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div>
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1>Tra Cứu Công Nợ & Học Phí</h1>
          <p>
            Xem danh sách môn đã đăng ký, tổng tiền cần nộp, hạn chót đóng tiền
            mặt và trạng thái thanh toán
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={16} style={{ color: "var(--text-muted)" }} />
            <select
              id="semester-filter-select"
              className="form-control"
              value={selectedSemesterId}
              onChange={(e) => setSelectedSemesterId(e.target.value)}
              style={{
                minWidth: "220px",
                fontWeight: 600,
                fontSize: "0.875rem",
                padding: "8px 12px",
                borderRadius: "8px",
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-card)",
                color: "var(--text-main)",
              }}
            >
              <option value="ALL">Toàn bộ lịch sử (Tất cả học kỳ)</option>
              {semesters.map((sem) => (
                <option key={sem.id} value={String(sem.id)}>
                  {sem.academicYear && !sem.semesterName?.includes(sem.academicYear)
                    ? `${sem.semesterName} (${sem.academicYear})`
                    : sem.semesterName}{" "}
                  {sem.isCurrent ? "— [Hiện tại]" : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setShowCashModal(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Banknote size={16} />
            <span>Đóng tiền mặt</span>
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setShowQrModal(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <QrCode size={16} style={{ color: "var(--primary)" }} />
            <span>Mã VietQR</span>
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => window.print()}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Printer size={16} />
            <span>In phiếu thu</span>
          </button>
        </div>
      </div>

      {tuitionSummary?.isTuitionOverdue && (
        <div
          className="card"
          style={{
            marginBottom: "20px",
            border: "2px solid var(--danger, #ef4444)",
            background: "rgba(239, 68, 68, 0.08)",
            padding: "16px 20px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <AlertTriangle size={28} style={{ color: "var(--danger, #ef4444)", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong style={{ color: "var(--danger, #ef4444)", fontSize: "1rem" }}>
              CẢNH BÁO CÔNG NỢ HỌC PHÍ QUÁ HẠN
            </strong>
            <p style={{ margin: "4px 0 0", color: "var(--text-main)", fontSize: "0.9rem" }}>
              Tài khoản của bạn hiện có công nợ học phí quá hạn quy định. Hệ thống đang tự động khóa quyền đăng ký học phần đợt tiếp theo và không hiển thị bảng điểm kết thúc học kỳ. Vui lòng thanh toán học phí hoặc liên hệ Phòng Kế hoạch - Tài chính.
            </p>
          </div>
          <button
            type="button"
            disabled={paying}
            onClick={handleSimulatePay}
            className="btn btn-primary"
            style={{
              flexShrink: 0,
              backgroundColor: "var(--danger, #ef4444)",
              borderColor: "var(--danger, #ef4444)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 600,
            }}
          >
            <Sparkles size={16} />
            <span>{paying ? "Đang xử lý..." : "Giả lập thanh toán mở khóa ngay"}</span>
          </button>
        </div>
      )}

      {/* BENTO KPI CARDS FOR TUITION, WALLET & CASH DEADLINE */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "18px",
          marginBottom: "24px",
        }}
      >
        {/* Card 1: Tổng tiền cần nộp */}
        <div
          className="stat-card"
          style={{
            background:
              "linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, var(--bg-surface) 100%)",
            borderColor: "rgba(37, 99, 235, 0.25)",
          }}
        >
          <div className="stat-icon-wrapper" style={{ background: "rgba(37, 99, 235, 0.15)", color: "var(--primary)" }}>
            <CreditCard size={22} />
          </div>
          <div>
            <div
              className="stat-value"
              style={{
                color: "var(--primary)",
                fontSize: "1.45rem",
                fontWeight: 800,
              }}
            >
              {totalFee.toLocaleString("vi-VN")} đ
            </div>
            <div className="stat-label">
              Tổng phát sinh ({activeEnrollments.length} môn • {totalCredits} TC)
            </div>
          </div>
        </div>

        {/* Card 2: Đã thanh toán */}
        <div
          className="stat-card"
          style={{
            background:
              "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, var(--bg-surface) 100%)",
            borderColor: "rgba(16, 185, 129, 0.25)",
          }}
        >
          <div className="stat-icon-wrapper" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--success)" }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div
              className="stat-value"
              style={{
                color: "var(--success)",
                fontSize: "1.45rem",
                fontWeight: 800,
              }}
            >
              {paidFee.toLocaleString("vi-VN")} đ
            </div>
            <div className="stat-label">Học phí đã thanh toán</div>
          </div>
        </div>

        {/* Card 3: Công nợ còn lại */}
        <div
          className="stat-card"
          style={{
            background: debtFee > 0
              ? "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, var(--bg-surface) 100%)"
              : "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, var(--bg-surface) 100%)",
            borderColor: debtFee > 0 ? "rgba(239, 68, 68, 0.25)" : "rgba(16, 185, 129, 0.25)",
          }}
        >
          <div
            className="stat-icon-wrapper"
            style={{
              background: debtFee > 0 ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
              color: debtFee > 0 ? "var(--danger)" : "var(--success)",
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <div
              className="stat-value"
              style={{
                color: debtFee > 0 ? "var(--danger)" : "var(--success)",
                fontSize: "1.45rem",
                fontWeight: 800,
              }}
            >
              {debtFee.toLocaleString("vi-VN")} đ
            </div>
            <div className="stat-label">
              {debtFee > 0 ? "Công nợ còn phải nộp" : "Đã hoàn tất học phí"}
            </div>
            {debtFee > 0 && (
              <button
                type="button"
                disabled={paying}
                onClick={handleSimulatePay}
                className="btn btn-sm btn-primary"
                style={{
                  marginTop: "8px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.78rem",
                  padding: "4px 10px",
                }}
              >
                <Sparkles size={13} />
                <span>{paying ? "Đang xử lý..." : "Giả lập thanh toán"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Card 4: Hạn chót đóng tiền mặt */}
        <div
          className="stat-card"
          style={{
            background:
              "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, var(--bg-surface) 100%)",
            borderColor: "rgba(245, 158, 11, 0.25)",
          }}
        >
          <div className="stat-icon-wrapper" style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--warning)" }}>
            <Clock size={22} />
          </div>
          <div>
            <div
              className="stat-value"
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: isOverdue ? "var(--danger)" : "var(--text-main)",
              }}
            >
              {deadlineDateStr}
            </div>
            <div style={{ marginTop: "4px" }}>
              {isOverdue ? (
                <span className="badge badge-danger" style={{ fontSize: "0.75rem" }}>
                  Đã quá hạn nộp tiền mặt
                </span>
              ) : daysLeft != null ? (
                <span className="badge badge-warning" style={{ fontSize: "0.75rem" }}>
                  Hạn chót: Còn {daysLeft} ngày
                </span>
              ) : (
                <span className="badge badge-neutral" style={{ fontSize: "0.75rem" }}>
                  Theo kế hoạch học kỳ
                </span>
              )}
            </div>
            <div className="stat-label" style={{ marginTop: "4px", fontSize: "0.75rem" }}>
              Hạn chót đóng tiền mặt (P. Kế toán)
            </div>
          </div>
        </div>

        {/* Card 5: Số dư tài khoản tích lũy (Ví) */}
        <div
          className="stat-card"
          style={{
            background:
              "linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, var(--bg-surface) 100%)",
            borderColor: "rgba(168, 85, 247, 0.25)",
          }}
        >
          <div className="stat-icon-wrapper" style={{ background: "rgba(168, 85, 247, 0.15)", color: "#a855f7" }}>
            <Banknote size={22} />
          </div>
          <div>
            <div
              className="stat-value"
              style={{
                color: "#a855f7",
                fontSize: "1.45rem",
                fontWeight: 800,
              }}
            >
              {Number(tuitionSummary?.balance || 0).toLocaleString("vi-VN")} đ
            </div>
            <div className="stat-label">Số dư tài khoản tích lũy (Ví)</div>
          </div>
        </div>
      </div>

      {/* Main Tuition & Course Registration Table */}
      <div className="card">
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Banknote size={18} style={{ color: "var(--primary)" }} />
            <h3 style={{ margin: 0, fontSize: "1.05rem" }}>
              Danh Sách Môn Học Đã Đăng Ký & Trạng Thái Học Phí
            </h3>
          </div>
          <span className="badge badge-neutral">
            Tổng cộng: {filteredEnrollments.length} môn
          </span>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: "50px", textAlign: "center" }}>STT</th>
                <th>Mã lớp HP</th>
                <th>Tên môn học</th>
                <th style={{ textAlign: "center" }}>Tín chỉ</th>
                <th>Học kỳ</th>
                <th style={{ textAlign: "right" }}>Đơn giá/TC</th>
                <th style={{ textAlign: "right" }}>Thành tiền</th>
                <th>Ngày đăng ký</th>
                <th style={{ textAlign: "center" }}>Trạng thái học phí</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`sk-${idx}`}>
                    <td><Skeleton width="30px" height="16px" /></td>
                    <td><Skeleton width="100px" height="16px" /></td>
                    <td><Skeleton width="200px" height="16px" /></td>
                    <td><Skeleton width="50px" height="16px" /></td>
                    <td><Skeleton width="100px" height="16px" /></td>
                    <td><Skeleton width="80px" height="16px" /></td>
                    <td><Skeleton width="90px" height="16px" /></td>
                    <td><Skeleton width="90px" height="16px" /></td>
                    <td><Skeleton width="100px" height="24px" borderRadius="12px" /></td>
                    <td><Skeleton width="60px" height="32px" /></td>
                  </tr>
                ))
              ) : filteredEnrollments.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    style={{
                      textAlign: "center",
                      padding: "48px 20px",
                      color: "var(--text-muted)",
                    }}
                  >
                    {selectedSemesterObj
                      ? `Chưa có học phần nào được đăng ký trong ${selectedSemesterObj.semesterName}.`
                      : "Bạn chưa đăng ký học phần nào trong cơ sở dữ liệu."}
                  </td>
                </tr>
              ) : (
                filteredEnrollments.map((e, index) => {
                  const credits = e.courseSection?.subject?.credits || 0;
                  const invoice = (tuitionSummary?.items || []).find(
                    (inv) => inv.sectionId === e.courseSection?.id
                  );
                  const itemAmount = invoice?.amount != null ? Number(invoice.amount) : credits * unitRate;
                  const itemRate = invoice?.baseRate != null ? Number(invoice.baseRate) : unitRate;
                  const isCancelled = e.status === "CANCELLED" || invoice?.status === "CANCELLED";
                  const isPaid = invoice ? invoice.status === "PAID" : e.status === "COMPLETED";

                  return (
                    <tr
                      key={e.id}
                      style={{
                        backgroundColor: isCancelled
                          ? "rgba(239, 68, 68, 0.03)"
                          : "transparent",
                      }}
                    >
                      <td style={{ textAlign: "center", color: "var(--text-muted)", fontWeight: 600 }}>
                        {index + 1}
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            color: isCancelled ? "var(--text-muted)" : "var(--primary)",
                            backgroundColor: isCancelled ? "var(--bg-subtle)" : "var(--primary-light)",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            border: `1px solid ${isCancelled ? "var(--border-color)" : "var(--primary-border)"}`,
                          }}
                        >
                          {e.courseSection?.sectionCode}
                        </span>
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: isCancelled ? "var(--text-muted)" : "var(--text-main)",
                          textDecoration: isCancelled ? "line-through" : "none",
                        }}
                      >
                        {e.courseSection?.subject?.subjectName}
                        {(e.attendanceStatus === "DISQUALIFIED" || e.isDisqualified) && (
                          <span
                            className="badge badge-danger"
                            style={{
                              marginLeft: "8px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "0.72rem",
                              padding: "2px 6px",
                              backgroundColor: "#fee2e2",
                              color: "#dc2626",
                              border: "1px solid #fecaca",
                            }}
                            title="Nghỉ quá 20% số tiết học phần - Bị cấm thi theo quy chế"
                          >
                            <AlertTriangle size={11} /> CẤM THI
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`badge ${isCancelled ? "badge-neutral" : "badge-info"}`}>
                          {credits} TC
                        </span>
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                        {e.courseSection?.semester?.semesterName}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {itemRate.toLocaleString("vi-VN")} đ
                      </td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {isCancelled ? (
                          <div>
                            <span
                              style={{
                                textDecoration: "line-through",
                                color: "var(--text-muted)",
                                fontSize: "0.82rem",
                              }}
                            >
                              {itemAmount.toLocaleString("vi-VN")} đ
                            </span>
                            <span
                              className="badge badge-neutral"
                              style={{ marginLeft: "6px", fontSize: "0.75rem" }}
                            >
                              0 đ
                            </span>
                          </div>
                        ) : (
                          <strong style={{ color: "var(--primary)" }}>
                            {itemAmount.toLocaleString("vi-VN")} đ
                          </strong>
                        )}
                      </td>
                      <td
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "0.85rem",
                        }}
                      >
                        {e.enrolledAt ? e.enrolledAt.substring(0, 10) : "—"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {isCancelled ? (
                          <span
                            className="badge badge-danger"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 10px",
                              fontWeight: 700,
                            }}
                          >
                            Đã bị hủy
                          </span>
                        ) : isPaid ? (
                          <span
                            className="badge badge-success"
                            title={invoice?.receiptNumber ? `Mã biên lai: ${invoice.receiptNumber}` : undefined}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 10px",
                              fontWeight: 700,
                            }}
                          >
                            <CheckCircle2 size={13} /> Đã nộp
                          </span>
                        ) : (
                          <span
                            className="badge badge-warning"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 10px",
                              fontWeight: 700,
                            }}
                          >
                            Chưa nộp
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {e.status === "ENROLLED" &&
                          (e.courseSection?.semester?.registrationOpen ? (
                            <button
                              className="btn-icon"
                              title="Huỷ đăng ký môn này"
                              style={{ color: "var(--danger)" }}
                              onClick={() =>
                                handleCancel(
                                  e.id,
                                  e.courseSection?.subject?.subjectName,
                                )
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          ) : (
                            <span
                              className="btn-icon"
                              title="Đợt đăng ký đã kết thúc. Mọi thay đổi vui lòng liên hệ Phòng Đào tạo"
                              style={{
                                color: "var(--text-light)",
                                cursor: "not-allowed",
                              }}
                            >
                              <Lock size={15} />
                            </span>
                          ))}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: HƯỚNG DẪN ĐÓNG TIỀN MẶT */}
      {showCashModal && (
        <div className="modal-backdrop" onClick={() => setShowCashModal(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: "540px", padding: "24px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Building2 size={22} style={{ color: "var(--primary)" }} />
                <h3 style={{ margin: 0, fontSize: "1.15rem" }}>
                  Hướng Dẫn Nộp Tiền Mặt Tại Trường
                </h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowCashModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.6" }}>
              <div
                style={{
                  background: "var(--bg-subtle)",
                  padding: "16px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
                  📍 Địa điểm tiếp nhận:
                </div>
                <div>Phòng Tài chính - Kế toán (Phòng 102, Tầng 1, Tòa nhà A1 - Khu Hiệu bộ)</div>
                <div style={{ marginTop: "8px", fontWeight: 700, color: "var(--text-main)" }}>
                  ⏰ Thời gian làm việc:
                </div>
                <div>Thứ 2 đến Thứ 6 hàng tuần:</div>
                <div>• Sáng: 08:00 — 11:30</div>
                <div>• Chiều: 13:30 — 17:00 (Nghỉ Thứ 7, CN và các ngày Lễ)</div>
              </div>

              <div
                style={{
                  borderLeft: "4px solid var(--warning)",
                  padding: "12px 16px",
                  background: "rgba(245, 158, 11, 0.08)",
                  borderRadius: "4px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ fontWeight: 700, color: "var(--text-main)" }}>
                  ⚠️ Hạn chót đóng tiền mặt: <strong>{deadlineDateStr}</strong>
                </div>
                <div style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                  Sinh viên cần mang theo <strong>Thẻ sinh viên</strong> hoặc <strong>CCCD</strong>. Sau khi nộp, giữ lại Phiếu thu tiền có mộc đỏ để đối soát khi cần thiết.
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowCashModal(false)}
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: VIETQR CHUYỂN KHOẢN ONLINE */}
      {showQrModal && (
        <div className="modal-backdrop" onClick={() => setShowQrModal(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: "520px", padding: "24px", textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <QrCode size={22} style={{ color: "var(--primary)" }} />
                <h3 style={{ margin: 0, fontSize: "1.15rem" }}>
                  Mã VietQR Thanh Toán Học Phí
                </h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowQrModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <img
                src={qrUrl}
                alt="VietQR Học phí"
                style={{
                  maxWidth: "280px",
                  margin: "0 auto",
                  borderRadius: "12px",
                  border: "1px solid var(--border-color)",
                  boxShadow: "var(--shadow-sm)",
                }}
              />
            </div>

            <div
              style={{
                textAlign: "left",
                background: "var(--bg-subtle)",
                padding: "14px 18px",
                borderRadius: "8px",
                fontSize: "0.875rem",
                lineHeight: "1.6",
                marginBottom: "16px",
              }}
            >
              <div>Ngân hàng: <strong>BIDV — Chi nhánh Hà Nội</strong></div>
              <div>Số tài khoản: <strong>12410001234567</strong></div>
              <div>Chủ tài khoản: <strong>TRUONG DAI HOC SMS</strong></div>
              <div>
                Số tiền:{" "}
                <strong style={{ color: "var(--danger)", fontSize: "1rem" }}>
                  {debtFee.toLocaleString("vi-VN")} đ
                </strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px" }}>
                <span>Nội dung CK: <strong>{transferContent}</strong></span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => copyToClipboard(transferContent)}
                  style={{ padding: "2px 8px", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  {copiedText ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedText ? "Đã chép" : "Sao chép"}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={paying}
              onClick={handleSimulatePay}
              className="btn btn-primary"
              style={{
                width: "100%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontWeight: 600,
                marginBottom: "10px",
              }}
            >
              <Sparkles size={16} />
              <span>{paying ? "Đang xác nhận..." : "Giả lập quét QR & Thanh toán thành công"}</span>
            </button>

            <button
              type="button"
              className="btn btn-outline"
              style={{ width: "100%" }}
              onClick={() => setShowQrModal(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
