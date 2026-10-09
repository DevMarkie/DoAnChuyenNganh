import { useState, useMemo } from "react";
import {
  Sparkles,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

/**
 * Trợ lý ghép Thời khóa biểu thông minh:
 * Cho phép sinh viên chọn các môn học mong muốn trong học kỳ,
 * tự động phân tích và tìm ra các phương án TKB tối ưu không bị trùng giờ.
 */
export default function SmartScheduleModal({
  availableSections = [],
  enrolledSubjectIds = new Set(),
  onEnrollSection,
  onClose,
}) {
  const [selectedSubjectIds, setSelectedSubjectIds] = useState(new Set());
  const [recommendedPlans, setRecommendedPlans] = useState(null);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [enrollingBatch, setEnrollingBatch] = useState(false);

  // 1. Nhóm các lớp học phần theo Môn học
  const subjectsMap = useMemo(() => {
    const map = new Map();
    availableSections.forEach((s) => {
      if (!s.subject?.id) return;
      // Bỏ qua các môn sinh viên đã đăng ký rồi
      if (enrolledSubjectIds.has(s.subject.id)) return;

      if (!map.has(s.subject.id)) {
        map.set(s.subject.id, {
          id: s.subject.id,
          code: s.subject.subjectCode,
          name: s.subject.subjectName,
          credits: s.subject.credits,
          sections: [],
        });
      }
      map.get(s.subject.id).sections.push(s);
    });
    return Array.from(map.values());
  }, [availableSections, enrolledSubjectIds]);

  // 2. Parser lịch học chuỗi sang các slot thời gian chuẩn
  const parseScheduleSlots = (scheduleStr) => {
    if (!scheduleStr) return [];
    // Hỗ trợ dạng: "Thứ Hai (07:00-09:30)" hoặc "Thứ 2 (1-3)"
    const slots = [];
    const parts = scheduleStr.split(/[,;]/);

    for (const part of parts) {
      const trimmed = part.trim();
      // Case 1: Giờ phút "Thứ Hai (07:00-09:30)"
      const timeMatch = trimmed.match(
        /(Thứ\s*[^\s(]+|[^\s(]+)\s*\(\s*(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\s*\)/i
      );
      if (timeMatch) {
        const day = timeMatch[1].trim();
        const start = parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]);
        const end = parseInt(timeMatch[4]) * 60 + parseInt(timeMatch[5]);
        slots.push({ day, start, end });
        continue;
      }

      // Case 2: Tiết học "Thứ 2 (1-3)" hoặc "T2 (1-3)"
      const periodMatch = trimmed.match(
        /(Thứ\s*\d+|T\d+|CN)\s*\(\s*(\d{1,2})\s*-\s*(\d{1,2})\s*\)/i
      );
      if (periodMatch) {
        const day = periodMatch[1].trim();
        // Giả lập mỗi tiết 50 phút
        const start = parseInt(periodMatch[2]) * 50;
        const end = parseInt(periodMatch[3]) * 50;
        slots.push({ day, start, end });
        continue;
      }

      // Fallback
      slots.push({ day: trimmed, start: 0, end: 1440 });
    }
    return slots;
  };

  // Kiểm tra 2 lớp có xung đột giờ không
  const isConflict = (secA, secB) => {
    const slotsA = parseScheduleSlots(secA.schedule);
    const slotsB = parseScheduleSlots(secB.schedule);
    for (const a of slotsA) {
      for (const b of slotsB) {
        if (a.day.toLowerCase() === b.day.toLowerCase()) {
          // Trùng thứ, kiểm tra khoảng thời gian giao nhau
          if (!(a.end <= b.start || a.start >= b.end)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // 3. Thuật toán tìm kiếm tổ hợp TKB tối ưu không trùng lịch
  const handleFindSchedule = () => {
    if (selectedSubjectIds.size === 0) {
      toast.warning("Vui lòng chọn ít nhất 1 môn học muốn đăng ký");
      return;
    }

    const targetSubjects = subjectsMap.filter((sub) =>
      selectedSubjectIds.has(sub.id)
    );

    // Lấy các lớp còn chỗ
    const candidateSectionsBySubject = targetSubjects.map((sub) => {
      const openSections = sub.sections.filter(
        (s) => (s.currentStudents || 0) < s.maxStudents
      );
      return {
        subject: sub,
        sections: openSections,
      };
    });

    // Kiểm tra nếu có môn nào hết sạch chỗ
    const outOfSlots = candidateSectionsBySubject.find(
      (item) => item.sections.length === 0
    );
    if (outOfSlots) {
      toast.error(
        `Môn "${outOfSlots.subject.name}" hiện tại tất cả các lớp đều đã đầy sĩ số!`
      );
      return;
    }

    const solutions = [];

    // Backtracking tìm tối đa 3 phương án TKB đẹp
    const backtrack = (subIdx, currentCombo) => {
      if (solutions.length >= 3) return;
      if (subIdx === candidateSectionsBySubject.length) {
        solutions.push([...currentCombo]);
        return;
      }

      const { sections } = candidateSectionsBySubject[subIdx];
      for (const sec of sections) {
        const hasConflict = currentCombo.some((c) => isConflict(c, sec));
        if (!hasConflict) {
          currentCombo.push(sec);
          backtrack(subIdx + 1, currentCombo);
          currentCombo.pop();
        }
      }
    };

    backtrack(0, []);

    if (solutions.length === 0) {
      toast.error(
        "Không tìm thấy phương án sắp xếp nào tránh được trùng lịch giữa các môn đã chọn. Hãy thử thay đổi danh sách môn!"
      );
      setRecommendedPlans(null);
    } else {
      setRecommendedPlans(solutions);
      setSelectedPlanIndex(0);
      toast.success(`Đã tìm thấy ${solutions.length} phương án Thời khóa biểu không bị trùng lịch!`);
    }
  };

  const handleToggleSubject = (subId) => {
    const next = new Set(selectedSubjectIds);
    if (next.has(subId)) next.delete(subId);
    else next.add(subId);
    setSelectedSubjectIds(next);
    setRecommendedPlans(null);
  };

  const handleBatchEnroll = async () => {
    if (!recommendedPlans || !recommendedPlans[selectedPlanIndex]) return;
    const plan = recommendedPlans[selectedPlanIndex];

    try {
      setEnrollingBatch(true);
      let successCount = 0;
      for (const sec of plan) {
        try {
          await onEnrollSection(sec.id);
          successCount++;
        } catch {
          // Lỗi từng môn được handle bởi hàm cha
        }
      }
      if (successCount > 0) {
        toast.success(`Đã xử lý đăng ký thành công ${successCount}/${plan.length} lớp học phần!`);
        onClose();
      }
    } finally {
      setEnrollingBatch(false);
    }
  };

  const totalSelectedCredits = subjectsMap
    .filter((s) => selectedSubjectIds.has(s.id))
    .reduce((sum, s) => sum + (s.credits || 0), 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
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
          maxWidth: "850px",
          width: "100%",
          maxHeight: "90vh",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-xl)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 22px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "var(--text-main)" }}>
                Trợ Lý Ghép Thời Khóa Biểu Thông Minh
              </h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                Tự động tìm kiếm tổ hợp lớp học phần không trùng giờ và tối ưu số tín chỉ
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: "6px", lineHeight: 0 }}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px", overflowY: "auto", flex: 1, display: "grid", gap: "20px" }}>
          {/* Bước 1: Chọn môn */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-main)" }}>
                1. Tích chọn các môn muốn học trong kỳ ({selectedSubjectIds.size} môn · {totalSelectedCredits} tín chỉ):
              </span>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleFindSchedule}
                disabled={selectedSubjectIds.size === 0}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Sparkles size={14} />
                <span>Tìm phương án TKB</span>
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "10px",
                maxHeight: "200px",
                overflowY: "auto",
                padding: "10px",
                backgroundColor: "var(--bg-hover)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
              }}
            >
              {subjectsMap.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "10px" }}>
                  Không có môn học mở nào khả dụng.
                </div>
              ) : (
                subjectsMap.map((sub) => {
                  const isChecked = selectedSubjectIds.has(sub.id);
                  return (
                    <label
                      key={sub.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: isChecked ? "rgba(16, 185, 129, 0.08)" : "var(--bg-surface)",
                        border: isChecked ? "1px solid var(--primary)" : "1px solid var(--border-color)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSubject(sub.id)}
                        style={{ cursor: "pointer" }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.88rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {sub.name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {sub.code} · <strong>{sub.credits} TC</strong> · {sub.sections.length} lớp
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Bước 2: Hiển thị phương án TKB gợi ý */}
          {recommendedPlans && (
            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-main)" }}>
                  2. Kết quả gợi ý: {recommendedPlans.length} phương án không trùng lịch
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  {recommendedPlans.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`btn btn-sm ${selectedPlanIndex === idx ? "btn-primary" : "btn-outline"}`}
                      onClick={() => setSelectedPlanIndex(idx)}
                    >
                      Phương án {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chi tiết phương án được chọn */}
              <div
                style={{
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                }}
              >
                <table className="table" style={{ margin: 0 }}>
                  <thead style={{ backgroundColor: "var(--bg-hover)" }}>
                    <tr>
                      <th>Mã LHP</th>
                      <th>Tên môn học</th>
                      <th>Tín chỉ</th>
                      <th>Lịch học</th>
                      <th>Phòng</th>
                      <th>Sĩ số</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendedPlans[selectedPlanIndex]?.map((sec) => (
                      <tr key={sec.id}>
                        <td>
                          <span style={{ fontWeight: 700, color: "var(--primary)" }}>
                            {sec.sectionCode}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{sec.subject?.subjectName}</td>
                        <td>
                          <span className="badge badge-info">{sec.subject?.credits} TC</span>
                        </td>
                        <td>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-main)", fontWeight: 500 }}>
                            <Clock size={13} style={{ color: "var(--primary)" }} />
                            <span>{sec.schedule || "Chưa xếp"}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-neutral">{sec.room || "—"}</span>
                        </td>
                        <td>
                          {sec.currentStudents || 0} / {sec.maxStudents}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 22px",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={enrollingBatch}>
            Đóng
          </button>

          {recommendedPlans && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleBatchEnroll}
              disabled={enrollingBatch}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              <CheckCircle2 size={16} />
              <span>
                {enrollingBatch
                  ? "Đang xử lý đăng ký..."
                  : `Đăng ký tất cả theo Phương án ${selectedPlanIndex + 1}`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
