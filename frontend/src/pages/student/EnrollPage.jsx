import { useState, useEffect, useRef, useMemo } from "react";
import {
  Check,
  Plus,
  AlertCircle,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  semesterService,
  courseSectionService,
  enrollmentService,
} from "../../services/dataService";
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
  const [smartModalOpen, setSmartModalOpen] = useState(false);
  const enrollmentInFlight = useRef(false);

  const loadData = async ({ initial = false } = {}) => {
    try {
      if (initial) setInitialLoading(true);
      else setRefreshing(true);
      setLoadError(false);
      const [resSem, resEnr] = await Promise.all([
        semesterService.getCurrent(),
        enrollmentService.getMyEnrollments(),
      ]);
      const sem = resSem.data.data;
      setCurrentSemester(sem);
      const enrList = resEnr.data.data || [];
      setMyEnrollments(enrList);

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

  useEffect(() => {
    loadData({ initial: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnroll = async (sectionId) => {
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

  const { enrolledSectionIds, enrolledSubjectIds } = useMemo(() => {
    const secIds = new Set();
    const subIds = new Set();
    myEnrollments.forEach((e) => {
      if (e.status === "ENROLLED") {
        if (e.courseSection?.id) secIds.add(e.courseSection.id);
        if (e.courseSection?.subject?.id) subIds.add(e.courseSection.subject.id);
      }
    });
    return { enrolledSectionIds: secIds, enrolledSubjectIds: subIds };
  }, [myEnrollments]);

  const filtered = availableSections.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.sectionCode?.toLowerCase().includes(q) ||
      s.subject?.subjectName?.toLowerCase().includes(q) ||
      s.lecturer?.fullName?.toLowerCase().includes(q)
    );
  });

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

      {/* Search Toolbar */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div
          className="card-body"
          style={{
            padding: "16px 20px",
            display: "flex",
            gap: "12px",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative", flex: 1, maxWidth: "420px" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
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
              Có <strong>{filtered.length}</strong> lớp học phần đang mở
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã Lớp HP</th>
                <th>Tên Môn Học</th>
                <th>Tín Chỉ</th>
                <th>Giảng Viên Giảng Dạy</th>
                <th>Lịch Học</th>
                <th>Phòng Học</th>
                <th>Sĩ Số ĐK</th>
                <th style={{ textAlign: "right" }}>Thao Tác</th>
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
                          <span
                            className="badge badge-success"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 10px",
                            }}
                          >
                            <Check size={14} /> Đã đăng ký
                          </span>
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
                            disabled={enrollingId === s.id}
                            onClick={() => handleEnroll(s.id)}
                          >
                            <Plus size={14} />
                            <span>
                              {enrollingId === s.id
                                ? "Đang ghi nhận..."
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
