import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Users,
  Building,
  FileDown,
  Upload,
  CheckCircle2,
  History,
  Search,
  Sparkles,
  ArrowRight,
  X,
  RefreshCw,
  BookOpen
} from "lucide-react";
import { toast } from "react-toastify";
import { examService, semesterService, subjectService } from "../../services/dataService";
import ExamGradeImportModal from "./ExamGradeImportModal";

export default function ExamRoomsPage() {
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [autoAssignSession, setAutoAssignSession] = useState(null);
  const [importModalRoom, setImportModalRoom] = useState(null);
  const [rosterModalRoom, setRosterModalRoom] = useState(null);
  const [auditModalRoom, setAuditModalRoom] = useState(null);

  // Form states
  const [sessionForm, setSessionForm] = useState({
    semesterId: "",
    subjectId: "",
    sessionName: "",
    examDate: "",
    startTime: "07:30",
    endTime: "09:30"
  });

  const [autoAssignForm, setAutoAssignForm] = useState({
    studentsPerRoom: 35,
    roomPrefix: "P",
    startRoomNumber: 1,
    locationPrefix: "Giảng đường A2 - Phòng "
  });

  // Load initial data: Semesters and Subjects
  useEffect(() => {
    const init = async () => {
      try {
        const [semRes, subRes] = await Promise.all([
          semesterService.getAll(),
          subjectService.getAll()
        ]);
        const semList = semRes.data?.data || semRes.data || [];
        const subList = subRes.data?.data || subRes.data || [];
        setSemesters(semList);
        setSubjects(subList);

        if (semList.length > 0) {
          const current = semList.find(s => s.isCurrent) || semList[0];
          setSelectedSemesterId(String(current.id));
          setSessionForm(prev => ({ ...prev, semesterId: String(current.id) }));
        }
      } catch {
        toast.error("Lỗi tải danh mục học kỳ và môn học");
      }
    };
    init();
  }, []);

  // Load Sessions when Semester changes
  const fetchSessions = useCallback(async () => {
    if (!selectedSemesterId) return;
    try {
      setLoading(true);
      const res = await examService.getSessionsBySemester(Number(selectedSemesterId));
      const list = res.data?.data || res.data || [];

      // For each session, fetch its rooms
      const sessionsWithRooms = await Promise.all(
        list.map(async (sess) => {
          try {
            const roomRes = await examService.getRoomsBySession(sess.id);
            const rooms = roomRes.data?.data || roomRes.data || [];
            return { ...sess, rooms };
          } catch {
            return { ...sess, rooms: [] };
          }
        })
      );

      setSessions(sessionsWithRooms);
    } catch {
      toast.error("Không thể tải danh sách ca thi");
    } finally {
      setLoading(false);
    }
  }, [selectedSemesterId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(sess => {
      if (selectedSubjectId && String(sess.subjectId) !== String(selectedSubjectId)) {
        return false;
      }
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase().trim();
        const matchName = sess.sessionName?.toLowerCase().includes(kw);
        const matchCode = sess.subjectCode?.toLowerCase().includes(kw);
        const matchSub = sess.subjectName?.toLowerCase().includes(kw);
        return matchName || matchCode || matchSub;
      }
      return true;
    });
  }, [sessions, selectedSubjectId, searchKeyword]);

  // Handlers
  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!sessionForm.semesterId || !sessionForm.subjectId || !sessionForm.sessionName || !sessionForm.examDate) {
      toast.error("Vui lòng điền đầy đủ thông tin ca thi");
      return;
    }

    try {
      await examService.createSession({
        semesterId: Number(sessionForm.semesterId),
        subjectId: Number(sessionForm.subjectId),
        sessionName: sessionForm.sessionName.trim(),
        examDate: sessionForm.examDate,
        startTime: sessionForm.startTime,
        endTime: sessionForm.endTime
      });
      toast.success("Tạo ca thi mới thành công!");
      setCreateSessionOpen(false);
      setSessionForm(prev => ({
        ...prev,
        sessionName: "",
        subjectId: ""
      }));
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi tạo ca thi");
    }
  };

  const handleDeleteSession = async (sessionId, sessionName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ca thi "${sessionName}" cùng toàn bộ phòng thi liên quan?`)) {
      return;
    }
    try {
      await examService.deleteSession(sessionId);
      toast.success("Đã xóa ca thi thành công");
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi xóa ca thi");
    }
  };

  const handleAutoAssign = async (e) => {
    e.preventDefault();
    if (!autoAssignSession) return;
    try {
      await examService.autoAssignRooms(autoAssignSession.id, {
        studentsPerRoom: Number(autoAssignForm.studentsPerRoom),
        roomPrefix: autoAssignForm.roomPrefix.trim(),
        startRoomNumber: Number(autoAssignForm.startRoomNumber),
        locationPrefix: autoAssignForm.locationPrefix.trim()
      });
      toast.success(`Tự động phân phòng và cấp SBD thành công cho ca thi!`);
      setAutoAssignSession(null);
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi phân phòng thi tự động");
    }
  };

  const handleDownloadTemplate = async (room) => {
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
      toast.success(`Đã tải biểu mẫu danh sách phòng thi ${room.roomCode}!`);
    } catch {
      toast.error("Lỗi khi tải file mẫu");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            <Building size={24} style={{ color: "var(--primary)" }} />
            Khảo Thí & Quản Lý Phòng Thi
          </h1>
          <p style={{ margin: "6px 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Tổ chức đợt thi tập trung, tự động phân phòng thi theo sĩ số, cấp Số báo danh (SBD) và nạp điểm thi cuối kỳ từ Excel đối soát thông minh.
          </p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setSessionForm(prev => ({ ...prev, semesterId: selectedSemesterId }));
              setCreateSessionOpen(true);
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <Plus size={16} />
            <span>Tạo Ca Thi Mới</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card">
        <div
          className="card-body"
          style={{
            padding: "16px 20px",
            display: "flex",
            gap: "14px",
            flexWrap: "wrap",
            alignItems: "center"
          }}
        >
          {/* Semester select */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "220px" }}>
            <Calendar size={15} style={{ color: "var(--text-muted)", shrink: 0 }} />
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>Học kỳ:</span>
            <select
              value={selectedSemesterId}
              onChange={(e) => setSelectedSemesterId(e.target.value)}
              className="form-select"
              style={{ width: "auto", minWidth: "200px" }}
            >
              {semesters.map(s => (
                <option key={s.id} value={s.id}>
                  {s.semesterName} {s.isCurrent ? "★ (Hiện tại)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Subject filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "240px" }}>
            <BookOpen size={15} style={{ color: "var(--text-muted)", shrink: 0 }} />
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>Môn học:</span>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="form-select"
              style={{ width: "auto", minWidth: "220px" }}
            >
              <option value="">-- Tất cả môn thi --</option>
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.subjectCode} - {sub.subjectName}
                </option>
              ))}
            </select>
          </div>

          {/* Keyword Search */}
          <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-light)"
              }}
            />
            <input
              type="text"
              placeholder="Tìm theo tên ca thi, mã môn..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="form-control"
              style={{ paddingLeft: "36px" }}
            />
          </div>

          <button
            type="button"
            className="btn btn-outline"
            onClick={fetchSessions}
            title="Tải lại dữ liệu"
            style={{ padding: "8px 12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>
          <RefreshCw size={28} className="animate-spin" style={{ color: "var(--primary)", margin: "0 auto 12px" }} />
          <p style={{ fontSize: "0.9rem", margin: 0 }}>Đang tải danh sách ca thi & phòng thi...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              backgroundColor: "var(--primary-light)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px"
            }}
          >
            <Building size={28} />
          </div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", margin: "0 0 8px" }}>
            Chưa có ca thi nào được tạo
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", maxWidth: "460px", margin: "0 auto 20px" }}>
            Bấm vào nút "Tạo Ca Thi Mới" ở trên để bắt đầu lập lịch thi và phân phòng thi tự động cho học kỳ này.
          </p>
          <button
            className="btn btn-primary"
            style={{ margin: "0 auto", display: "inline-flex", alignItems: "center", gap: "8px" }}
            onClick={() => {
              setSessionForm(prev => ({ ...prev, semesterId: selectedSemesterId }));
              setCreateSessionOpen(true);
            }}
          >
            <Plus size={16} />
            <span>Tạo Ca Thi Đầu Tiên</span>
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {filteredSessions.map((session) => (
            <div key={session.id} className="card">
              {/* Session Header */}
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-hover)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "14px"
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div
                    style={{
                      padding: "10px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--primary)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)" }}>
                        {session.sessionName}
                      </h3>
                      <span className="badge badge-primary" style={{ fontFamily: "monospace", fontWeight: 700 }}>
                        {session.subjectCode}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      Môn thi: <strong style={{ color: "var(--text-main)" }}>{session.subjectName}</strong>
                      {"  •  "}
                      Học kỳ: <span style={{ color: "var(--text-secondary)" }}>{session.semesterName}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px", flexWrap: "wrap", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <Calendar size={14} style={{ color: "var(--primary)" }} />
                        <strong>{session.examDate}</strong>
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <Clock size={14} style={{ color: "var(--primary)" }} />
                        {session.startTime} — {session.endTime}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <Building size={14} style={{ color: "var(--secondary)" }} />
                        <strong>{session.rooms?.length || 0}</strong> phòng thi
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <Users size={14} style={{ color: "var(--success)" }} />
                        <strong>{session.totalStudents || 0}</strong> thí sinh
                      </span>
                    </div>
                  </div>
                </div>

                {/* Session Action Buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => {
                      setAutoAssignSession(session);
                      setAutoAssignForm({
                        studentsPerRoom: 35,
                        roomPrefix: "P",
                        startRoomNumber: 1,
                        locationPrefix: "Giảng đường A2 - Phòng "
                      });
                    }}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <Sparkles size={14} style={{ color: "var(--primary)" }} />
                    <span>Tự Động Phân Phòng & SBD</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => handleDeleteSession(session.id, session.sessionName)}
                    title="Xóa ca thi này"
                    style={{ color: "var(--danger)", padding: "6px 10px" }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Rooms Grid */}
              <div style={{ padding: "20px" }}>
                {(!session.rooms || session.rooms.length === 0) ? (
                  <div
                    style={{
                      border: "2px dashed var(--border-color)",
                      borderRadius: "var(--radius-md)",
                      padding: "32px 20px",
                      textAlign: "center",
                      backgroundColor: "var(--bg-hover)"
                    }}
                  >
                    <p style={{ margin: "0 0 12px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      Ca thi này chưa có phòng thi nào. Bấm nút bên dưới để hệ thống gom sinh viên các lớp học phần và xếp phòng thi tự động.
                    </p>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => setAutoAssignSession(session)}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <Sparkles size={14} />
                      <span>Xếp Phòng Tự Động Ngay</span>
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                      gap: "16px"
                    }}
                  >
                    {session.rooms.map((room) => {
                      const isScored = room.status === "SCORED";
                      const studentCount = room.studentCount || 0;
                      const scoredCount = room.scoredCount || 0;

                      return (
                        <div
                          key={room.id}
                          style={{
                            backgroundColor: "var(--bg-surface)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "var(--radius-md)",
                            padding: "16px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            gap: "14px",
                            boxShadow: "var(--shadow-xs)"
                          }}
                        >
                          <div>
                            {/* Room Header */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                              <span
                                style={{
                                  fontFamily: "monospace",
                                  fontWeight: 800,
                                  fontSize: "1.05rem",
                                  color: "var(--primary)",
                                  backgroundColor: "var(--primary-light)",
                                  padding: "3px 10px",
                                  borderRadius: "6px",
                                  border: "1px solid var(--primary-border)"
                                }}
                              >
                                {room.roomCode}
                              </span>
                              <span
                                className={`badge ${isScored ? "badge-success" : "badge-warning"}`}
                                style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                              >
                                {isScored ? (
                                  <>
                                    <CheckCircle2 size={12} />
                                    Đã nạp điểm ({scoredCount}/{studentCount})
                                  </>
                                ) : (
                                  <>
                                    <Clock size={12} />
                                    Chờ thi / Chưa nạp điểm
                                  </>
                                )}
                              </span>
                            </div>

                            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                              <Building size={14} style={{ shrink: 0 }} />
                              <span style={{ color: "var(--text-secondary)" }}>{room.roomLocation || "Giảng đường A2"}</span>
                            </div>

                            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                              <Users size={14} style={{ shrink: 0 }} />
                              <span>
                                Sĩ số: <strong style={{ color: "var(--text-main)" }}>{studentCount}</strong> / {room.capacity} thí sinh
                              </span>
                            </div>
                          </div>

                          {/* Room Actions */}
                          <div style={{ paddingTop: "12px", borderTop: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline"
                                onClick={() => setRosterModalRoom(room)}
                                style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px", fontSize: "0.78rem" }}
                              >
                                <Users size={13} />
                                <span>Thí sinh</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline"
                                onClick={() => handleDownloadTemplate(room)}
                                title="Tải file Excel danh sách phòng thi đã điền sẵn thông tin"
                                style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px", fontSize: "0.78rem" }}
                              >
                                <FileDown size={13} />
                                <span>Mẫu Excel</span>
                              </button>
                            </div>

                            <button
                              type="button"
                              className={`btn btn-sm ${isScored ? "btn-secondary" : "btn-primary"}`}
                              onClick={() => setImportModalRoom(room)}
                              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", width: "100%" }}
                            >
                              <Upload size={14} />
                              <span>{isScored ? "Nạp Lại / Đính Chính Điểm" : "Nhập Điểm Excel"}</span>
                            </button>

                            {isScored && (
                              <button
                                type="button"
                                onClick={() => setAuditModalRoom(room)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  padding: "2px",
                                  color: "var(--text-muted)",
                                  fontSize: "0.75rem",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "4px",
                                  cursor: "pointer"
                                }}
                              >
                                <History size={12} />
                                <span>Xem lịch sử sửa điểm</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Tạo Ca Thi Mới */}
      {createSessionOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) setCreateSessionOpen(false); }}
        >
          <div className="modal-content" style={{ maxWidth: "560px" }}>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
                  Tạo Ca Thi / Đợt Thi Mới
                </h3>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Lập lịch thi tập trung theo môn học và học kỳ
                </div>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: "6px", lineHeight: 0 }}
                onClick={() => setCreateSessionOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSession} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">Học kỳ (*):</label>
                <select
                  value={sessionForm.semesterId}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, semesterId: e.target.value }))}
                  required
                  className="form-select"
                >
                  {semesters.map(s => (
                    <option key={s.id} value={s.id}>{s.semesterName}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Môn học (*):</label>
                <select
                  value={sessionForm.subjectId}
                  onChange={(e) => {
                    const subId = e.target.value;
                    const sub = subjects.find(s => String(s.id) === String(subId));
                    setSessionForm(prev => ({
                      ...prev,
                      subjectId: subId,
                      sessionName: sub ? `Thi Cuối Kỳ ${sub.subjectCode} - ${sub.subjectName}` : prev.sessionName
                    }));
                  }}
                  required
                  className="form-select"
                >
                  <option value="">-- Chọn môn học --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.subjectCode} - {s.subjectName}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tên ca / đợt thi (*):</label>
                <input
                  type="text"
                  value={sessionForm.sessionName}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, sessionName: e.target.value }))}
                  required
                  placeholder="Ví dụ: Thi Cuối Kỳ IT301 - Đợt 1"
                  className="form-control"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Ngày thi (*):</label>
                  <input
                    type="date"
                    value={sessionForm.examDate}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, examDate: e.target.value }))}
                    required
                    className="form-control"
                    style={{ fontFamily: "monospace" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Bắt đầu (*):</label>
                  <input
                    type="time"
                    value={sessionForm.startTime}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, startTime: e.target.value }))}
                    required
                    className="form-control"
                    style={{ fontFamily: "monospace" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Kết thúc (*):</label>
                  <input
                    type="time"
                    value={sessionForm.endTime}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, endTime: e.target.value }))}
                    required
                    className="form-control"
                    style={{ fontFamily: "monospace" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCreateSessionOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Lưu Ca Thi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Tự Động Phân Phòng & Cấp SBD */}
      {autoAssignSession && (
        <div
          role="dialog"
          aria-modal="true"
          className="modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) setAutoAssignSession(null); }}
        >
          <div className="modal-content" style={{ maxWidth: "520px" }}>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={18} style={{ color: "var(--primary)" }} />
                  Tự Động Xếp Phòng & Cấp SBD
                </h3>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Phân chia danh sách thí sinh và đánh số báo danh tuần tự
                </div>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: "6px", lineHeight: 0 }}
                onClick={() => setAutoAssignSession(null)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAutoAssign} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--primary-light)",
                  border: "1px solid var(--primary-border)",
                  fontSize: "0.85rem"
                }}
              >
                <div style={{ fontWeight: 700, color: "var(--primary)" }}>{autoAssignSession.sessionName}</div>
                <div style={{ color: "var(--text-secondary)", marginTop: "2px" }}>
                  Môn thi: {autoAssignSession.subjectCode} - {autoAssignSession.subjectName}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "4px" }}>
                  Hệ thống sẽ gom toàn bộ sinh viên đang đăng ký môn này trong học kỳ, chia đều vào các phòng và đánh Số báo danh liên tục (ví dụ: {autoAssignSession.subjectCode}-P01-001).
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Sĩ số tối đa mỗi phòng thi:</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={autoAssignForm.studentsPerRoom}
                  onChange={(e) => setAutoAssignForm(prev => ({ ...prev, studentsPerRoom: e.target.value }))}
                  required
                  className="form-control"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Tiền tố mã phòng:</label>
                  <input
                    type="text"
                    value={autoAssignForm.roomPrefix}
                    onChange={(e) => setAutoAssignForm(prev => ({ ...prev, roomPrefix: e.target.value }))}
                    placeholder="VD: P"
                    className="form-control"
                    style={{ fontFamily: "monospace" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Số phòng bắt đầu:</label>
                  <input
                    type="number"
                    min="1"
                    value={autoAssignForm.startRoomNumber}
                    onChange={(e) => setAutoAssignForm(prev => ({ ...prev, startRoomNumber: e.target.value }))}
                    className="form-control"
                    style={{ fontFamily: "monospace" }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Địa điểm giảng đường / Tòa nhà:</label>
                <input
                  type="text"
                  value={autoAssignForm.locationPrefix}
                  onChange={(e) => setAutoAssignForm(prev => ({ ...prev, locationPrefix: e.target.value }))}
                  placeholder="VD: Giảng đường A2 - Phòng "
                  className="form-control"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setAutoAssignSession(null)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Sparkles size={14} />
                  <span>Tiến Hành Xếp Phòng</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Xem Danh Sách Thí Sinh Trong Phòng */}
      {rosterModalRoom && (
        <RoomRosterModal
          room={rosterModalRoom}
          onClose={() => setRosterModalRoom(null)}
        />
      )}

      {/* Modal 4: Lịch Sử Kiểm Toán Sửa Điểm */}
      {auditModalRoom && (
        <RoomAuditModal
          room={auditModalRoom}
          onClose={() => setAuditModalRoom(null)}
        />
      )}

      {/* Modal 5: Nhập Điểm Excel Thông Minh (2-Phase) */}
      {importModalRoom && (
        <ExamGradeImportModal
          room={importModalRoom}
          isOpen={Boolean(importModalRoom)}
          onClose={() => setImportModalRoom(null)}
          onImportSuccess={fetchSessions}
        />
      )}

    </div>
  );
}

// Sub-component: Room Roster Drawer/Modal
function RoomRosterModal({ room, onClose }) {
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoster = async () => {
      try {
        const res = await examService.getRoster(room.id);
        setRoster(res.data?.data || res.data || []);
      } catch {
        toast.error("Không thể tải danh sách thí sinh");
      } finally {
        setLoading(false);
      }
    };
    fetchRoster();
  }, [room.id]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-content" style={{ maxWidth: "900px", maxHeight: "88vh", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Users size={18} style={{ color: "var(--primary)" }} />
              Danh Sách Thí Sinh — Phòng {room.roomCode}
            </h3>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>
              Sĩ số: <strong>{roster.length}</strong> thí sinh  •  Địa điểm: {room.roomLocation || "Giảng đường A2"}
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

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {loading ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-muted)" }}>
              <RefreshCw size={24} className="animate-spin" style={{ color: "var(--primary)", margin: "0 auto 8px" }} />
              <p style={{ fontSize: "0.85rem", margin: 0 }}>Đang tải danh sách thí sinh...</p>
            </div>
          ) : roster.length === 0 ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.88rem" }}>
              Chưa có thí sinh nào trong phòng này.
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: "50px", textAlign: "center" }}>STT</th>
                    <th style={{ width: "120px" }}>Số Báo Danh</th>
                    <th style={{ width: "110px" }}>Mã SV</th>
                    <th>Họ và Tên</th>
                    <th style={{ width: "110px" }}>Ngày Sinh</th>
                    <th style={{ width: "100px" }}>Lớp SH</th>
                    <th style={{ width: "90px", textAlign: "center" }}>Điểm Thi</th>
                    <th>Trạng Thái / Kỷ Luật</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((r, idx) => (
                    <tr key={r.id}>
                      <td style={{ textAlign: "center", color: "var(--text-light)", fontFamily: "monospace" }}>{idx + 1}</td>
                      <td>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--primary)" }}>
                          {r.sbd}
                        </span>
                      </td>
                      <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{r.studentCode}</td>
                      <td style={{ fontWeight: 600, color: "var(--text-main)" }}>{r.studentName}</td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "var(--text-secondary)" }}>{r.dateOfBirth}</td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>{r.className}</td>
                      <td style={{ textAlign: "center", fontWeight: 700, fontFamily: "monospace" }}>
                        {r.score !== null && r.score !== undefined ? (
                          <span style={{ color: r.score < 3.0 ? "var(--danger)" : "var(--primary)" }}>
                            {Number(r.score).toFixed(1)}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-light)" }}>—</span>
                        )}
                      </td>
                      <td>
                        {r.attendanceStatus === "DISQUALIFIED" ? (
                          <span className="badge badge-danger" title="Nghỉ quá 20% số tiết học phần">CẤM THI</span>
                        ) : r.specialGrade === "V" ? (
                          <span className="badge badge-danger">VẮNG THI</span>
                        ) : r.specialGrade === "I" ? (
                          <span className="badge badge-warning">HOÃN THI</span>
                        ) : r.violationNote ? (
                          <span style={{ color: "var(--danger)", fontSize: "0.82rem" }}>{r.violationNote}</span>
                        ) : (
                          <span style={{ color: "var(--text-light)", fontSize: "0.82rem" }}>Bình thường</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-hover)",
            display: "flex",
            justifyContent: "flex-end"
          }}
        >
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-component: Room Audit Log Modal
function RoomAuditModal({ room, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await examService.getAuditLogs(room.id);
        setLogs(res.data?.data || res.data || []);
      } catch {
        toast.error("Không thể tải lịch sử kiểm toán");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [room.id]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-content" style={{ maxWidth: "650px", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
              <History size={18} style={{ color: "var(--primary)" }} />
              Nhật Ký Kiểm Toán Điểm — Phòng {room.roomCode}
            </h3>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>
              Ghi vết mọi thay đổi điểm thi và đính chính điểm
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

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {loading ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-muted)" }}>
              <RefreshCw size={24} className="animate-spin" style={{ color: "var(--primary)", margin: "0 auto 8px" }} />
              <p style={{ fontSize: "0.85rem", margin: 0 }}>Đang tải lịch sử kiểm toán...</p>
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.88rem" }}>
              Chưa có lần chỉnh sửa hoặc nạp đè nào cho phòng thi này.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--bg-hover)",
                    border: "1px solid var(--border-color)",
                    fontSize: "0.82rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700, color: "var(--text-main)" }}>
                      Sinh viên: {log.grade?.enrollment?.student?.fullName} ({log.grade?.enrollment?.student?.studentCode})
                    </span>
                    <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--text-light)" }}>
                      {log.createdAt}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                    <span>Điểm:</span>
                    <span style={{ textDecoration: "line-through", color: "var(--danger)", fontFamily: "monospace" }}>
                      {log.oldScore ?? "Chưa có"}
                    </span>
                    <ArrowRight size={12} style={{ color: "var(--text-light)" }} />
                    <span style={{ fontWeight: 700, color: "var(--success)", fontFamily: "monospace" }}>
                      {log.newScore ?? "Chưa có"}
                    </span>
                    <span style={{ color: "var(--border-color)" }}>|</span>
                    <span>Thực hiện bởi: <strong>{log.changedBy?.username || "Admin"}</strong></span>
                  </div>
                  {log.reason && (
                    <div style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.78rem" }}>
                      Lý do: {log.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-hover)",
            display: "flex",
            justifyContent: "flex-end"
          }}
        >
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
