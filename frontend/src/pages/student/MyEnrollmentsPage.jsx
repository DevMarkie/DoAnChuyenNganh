import { useState, useEffect, useRef } from "react";
import {
  Trash2,
  Lock,
} from "lucide-react";
import { toast } from "react-toastify";
import { enrollmentService } from "../../services/dataService";
import Skeleton from "../../components/common/Skeleton";

export default function MyEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const cancellationInFlight = useRef(false);

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      const res = await enrollmentService.getMyEnrollments();
      setEnrollments(res.data.data || []);
    } catch {
      toast.error("Lỗi khi tải danh sách học phần đã đăng ký");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnrollments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      loadEnrollments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Huỷ đăng ký thất bại");
    } finally {
      cancellationInFlight.current = false;
    }
  };

  const activeEnrollments = enrollments.filter(
    (e) => e.status === "ENROLLED" || e.status === "COMPLETED",
  );
  const totalCredits = activeEnrollments.reduce(
    (sum, e) => sum + (e.courseSection?.subject?.credits || 0),
    0,
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Học Phần Đã Đăng Ký</h1>
          <p>
            Theo dõi kế hoạch biểu học tập, phòng học và trạng thái xác nhận
            đăng ký môn học
          </p>
        </div>
      </div>

      {/* Summary KPI Bar */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Số môn hợp lệ:
            </span>
            <span
              style={{
                fontWeight: 800,
                fontSize: "1.1rem",
                color: "var(--text-main)",
              }}
            >
              {activeEnrollments.length} môn
            </span>
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
              Tổng khối lượng:
            </span>
            <span
              className="badge badge-info"
              style={{ fontSize: "0.85rem", padding: "4px 10px" }}
            >
              {totalCredits} Tín chỉ
            </span>
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
                <th>Số tín chỉ</th>
                <th>Học kỳ</th>
                <th>Giảng viên giảng dạy</th>
                <th>Lịch học chi tiết</th>
                <th>Phòng học</th>
                <th>Ngày đăng ký</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={`sk-${idx}`}>
                    <td><Skeleton width="100px" height="16px" /></td>
                    <td><Skeleton width="200px" height="16px" /></td>
                    <td><Skeleton width="60px" height="16px" /></td>
                    <td><Skeleton width="80px" height="16px" /></td>
                    <td><Skeleton width="150px" height="16px" /></td>
                    <td><Skeleton width="120px" height="32px" /></td>
                    <td><Skeleton width="80px" height="16px" /></td>
                    <td><Skeleton width="90px" height="16px" /></td>
                    <td><Skeleton width="100px" height="24px" borderRadius="12px" /></td>
                    <td><Skeleton width="60px" height="32px" /></td>
                  </tr>
                ))
              ) : enrollments.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    style={{
                      textAlign: "center",
                      padding: "48px 20px",
                      color: "var(--text-muted)",
                    }}
                  >
                    Bạn chưa đăng ký học phần nào trong cơ sở dữ liệu.
                  </td>
                </tr>
              ) : (
                enrollments.map((e) => (
                  <tr key={e.id}>
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
                        {e.courseSection?.sectionCode}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--text-main)" }}>
                      {e.courseSection?.subject?.subjectName}
                    </td>
                    <td>
                      <span className="badge badge-info">
                        {e.courseSection?.subject?.credits} TC
                      </span>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {e.courseSection?.semester?.semesterName}
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {e.courseSection?.lecturer?.fullName || "—"}
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {e.courseSection?.schedule || "—"}
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        {e.courseSection?.room || "—"}
                      </span>
                    </td>
                    <td
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.85rem",
                      }}
                    >
                      {e.enrolledAt ? e.enrolledAt.substring(0, 10) : "—"}
                    </td>
                    <td>
                      <span
                        className={`badge ${e.status === "ENROLLED" ? "badge-success" : e.status === "COMPLETED" ? "badge-info" : "badge-danger"}`}
                      >
                        {e.status === "ENROLLED"
                          ? "Đã xác nhận"
                          : e.status === "COMPLETED"
                            ? "Đã hoàn thành"
                            : "Đã huỷ"}
                      </span>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
