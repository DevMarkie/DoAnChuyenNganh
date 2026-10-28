import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Search, RefreshCw, Copy, Check, Clock, Users,
  CheckCircle2, XCircle, Play, Save, RotateCcw
} from 'lucide-react';
import { toast } from 'react-toastify';
import { attendanceService } from '../../services/dataService';

const TODAY_VI_VN = new Date().toLocaleDateString('vi-VN');

export default function LecturerAttendanceModal({ courseSection, onClose }) {
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [duration, setDuration] = useState(10); // default 10 minutes
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  const sectionId = courseSection?.id;
  const timerRef = useRef(null);
  const todayDisplay = TODAY_VI_VN;

  const loadLiveSession = useCallback(async (isSilent = false) => {
    if (!sectionId) return;
    try {
      if (!isSilent) setLoading(true);
      const res = await attendanceService.getLiveSession(sectionId);
      setSessionData(res.data?.data || null);
    } catch {
      if (!isSilent) toast.error('Không thể tải thông tin điểm danh');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    let ignore = false;
    if (!sectionId) return;
    attendanceService
      .getLiveSession(sectionId)
      .then((res) => {
        if (!ignore) setSessionData(res.data?.data || null);
      })
      .catch(() => {
        toast.error('Không thể tải thông tin điểm danh');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [sectionId]);

  // Polling every 3s when session is OPEN
  useEffect(() => {
    if (sessionData?.status !== 'OPEN') return;

    const interval = setInterval(() => {
      loadLiveSession(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionData?.status, loadLiveSession]);

  // Countdown timer calculation
  useEffect(() => {
    if (!sessionData?.expiresAt || sessionData.status !== 'OPEN') {
      return;
    }

    const updateTimer = () => {
      const diff = new Date(sessionData.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('00:00 (Hết hạn)');
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);
    return () => {
      clearInterval(timerRef.current);
      setTimeLeft(null);
    };
  }, [sessionData?.expiresAt, sessionData?.status]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleStartSession = async () => {
    try {
      setStarting(true);
      const res = await attendanceService.startSession({
        sectionId,
        durationMinutes: duration > 0 ? duration : null,
      });
      setSessionData(res.data?.data || null);
      toast.success('Đã mở phiên điểm danh thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi khởi tạo điểm danh');
    } finally {
      setStarting(false);
    }
  };

  const handleToggleStudent = (enrollmentId) => {
    if (!sessionData?.students) return;
    setSessionData((prev) => {
      const updatedStudents = prev.students.map((st) => {
        if (st.enrollmentId === enrollmentId) {
          return { ...st, present: !st.present };
        }
        return st;
      });
      const presentCount = updatedStudents.filter((s) => s.present).length;
      const absentCount = updatedStudents.length - presentCount;
      return {
        ...prev,
        students: updatedStudents,
        presentCount,
        absentCount,
      };
    });
  };

  const handleSaveSession = async () => {
    if (!sessionData) return;
    try {
      setSaving(true);
      const today = new Date().toISOString().split('T')[0];
      const records = (sessionData.students || []).map((s) => ({
        enrollmentId: s.enrollmentId,
        isPresent: Boolean(s.present),
      }));

      await attendanceService.saveSession({
        sectionId,
        sessionDate: sessionData.sessionDate || today,
        attendanceKeyword: sessionData.attendanceKeyword,
        status: 'SAVED',
        records,
      });

      toast.success('Đã lưu chốt sổ điểm danh thành công!');
      await loadLiveSession(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu điểm danh');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCode = () => {
    if (!sessionData?.attendanceKeyword) return;
    navigator.clipboard.writeText(sessionData.attendanceKeyword);
    setCopied(true);
    toast.info('Đã sao chép mã điểm danh!');
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredStudents = (sessionData?.students || []).filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.studentCode?.toLowerCase().includes(q) ||
      s.fullName?.toLowerCase().includes(q) ||
      s.className?.toLowerCase().includes(q)
    );
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          borderRadius: '14px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border, #e5e7eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            color: '#ffffff',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                {courseSection?.sectionCode}
              </span>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
                Điểm danh: {courseSection?.subject?.subjectName}
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.825rem', opacity: 0.9 }}>
              Phòng: {courseSection?.room || '—'} • Hôm nay: {todayDisplay}
            </p>
          </div>

          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '6px', borderRadius: '50%', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)' }}
            title="Đóng (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <RefreshCw className="spin" size={32} style={{ margin: '0 auto 12px' }} />
              <div>Đang tải thông tin phiên điểm danh...</div>
            </div>
          ) : sessionData?.status === 'NOT_STARTED' || !sessionData?.attendanceKeyword ? (
            /* ================= STATE 1: CHƯA BẮT ĐẦU ================= */
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: 'var(--bg-subtle, #f9fafb)',
                borderRadius: '12px',
                border: '1px dashed var(--border, #d1d5db)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--primary-light, #eff6ff)',
                  color: 'var(--primary, #2563eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Users size={32} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 700 }}>
                Bắt đầu phiên điểm danh hôm nay
              </h3>
              <p style={{ color: 'var(--text-secondary, #6b7280)', maxWidth: '500px', margin: '0 auto 24px', fontSize: '0.9rem' }}>
                Hệ thống sẽ tạo mã 6 ký tự để giảng viên chiếu lên bảng hoặc đọc cho sinh viên nhập trên điện thoại/laptop.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Thời gian hiệu lực của mã:</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="form-control"
                  style={{ width: '180px', height: '40px' }}
                >
                  <option value={5}>5 phút</option>
                  <option value={10}>10 phút (Khuyên dùng)</option>
                  <option value={15}>15 phút</option>
                  <option value={0}>Không giới hạn (Đến khi bấm Lưu)</option>
                </select>
              </div>

              <button
                onClick={handleStartSession}
                disabled={starting}
                className="btn btn-primary"
                style={{
                  padding: '12px 28px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Play size={18} />
                <span>{starting ? 'Đang khởi tạo...' : 'Tạo mã điểm danh'}</span>
              </button>
            </div>
          ) : (
            /* ================= STATE 2: ĐANG MỞ HOẶC ĐÃ LƯU ================= */
            <div>
              {/* CODE DISPLAY & STATUS BANNER */}
              <div
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: sessionData.status === 'OPEN'
                    ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
                    : 'var(--bg-subtle, #f3f4f6)',
                  border: `1px solid ${sessionData.status === 'OPEN' ? '#bfdbfe' : '#e5e7eb'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      MÃ ĐIỂM DANH:
                    </span>
                    <span
                      className={`badge ${sessionData.status === 'OPEN' ? 'badge-success' : 'badge-neutral'}`}
                      style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                    >
                      {sessionData.status === 'OPEN' ? '🟢 ĐANG MỞ ĐIỂM DANH' : '🔒 ĐÃ LƯU & CHỐT SỔ'}
                    </span>
                    {timeLeft && sessionData.status === 'OPEN' && (
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#dc2626',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Clock size={13} /> {timeLeft}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '2.5rem',
                        fontWeight: 900,
                        letterSpacing: '6px',
                        color: 'var(--primary, #1d4ed8)',
                      }}
                    >
                      {sessionData.attendanceKeyword}
                    </span>

                    <button
                      onClick={handleCopyCode}
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', height: '36px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      title="Sao chép mã"
                    >
                      {copied ? <Check size={16} color="green" /> : <Copy size={16} />}
                      <span style={{ fontSize: '0.8rem' }}>{copied ? 'Đã chép' : 'Sao chép'}</span>
                    </button>

                    {sessionData.status === 'OPEN' && (
                      <button
                        onClick={handleStartSession}
                        disabled={starting}
                        className="btn btn-outline"
                        style={{ padding: '6px 12px', height: '36px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        title="Đổi mã mới ngẫu nhiên"
                      >
                        <RotateCcw size={15} />
                        <span style={{ fontSize: '0.8rem' }}>Đổi mã khác</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* KPI Cards */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      background: '#ffffff',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border, #e5e7eb)',
                      minWidth: '100px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sĩ số lớp</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{sessionData.totalStudents}</div>
                  </div>

                  <div
                    style={{
                      background: '#ecfdf5',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid #a7f3d0',
                      minWidth: '100px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>Có mặt</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>
                      {sessionData.presentCount}
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#fff1f2',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid #fecdd3',
                      minWidth: '100px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: '#be123c', fontWeight: 600 }}>Vắng mặt</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e11d48' }}>
                      {sessionData.absentCount}
                    </div>
                  </div>
                </div>
              </div>

              {/* Toolbar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-light)',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Tìm sinh viên theo tên, mã số..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="form-control"
                    style={{ paddingLeft: '36px', height: '36px', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => loadLiveSession(false)}
                    className="btn btn-outline btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    title="Tải lại danh sách mới nhất"
                  >
                    <RefreshCw size={14} />
                    <span>Làm mới</span>
                  </button>

                  <button
                    onClick={handleSaveSession}
                    disabled={saving}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                    title="Chốt danh sách và cập nhật số buổi vắng"
                  >
                    <Save size={14} />
                    <span>{saving ? 'Đang lưu...' : 'Lưu điểm danh & Chốt sổ'}</span>
                  </button>
                </div>
              </div>

              {/* Roster Table */}
              <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: '8px' }}>
                <table className="table table-hover" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-muted, #f8fafc)' }}>
                      <th style={{ width: '50px', textAlign: 'center' }}>STT</th>
                      <th style={{ width: '120px' }}>Mã SV</th>
                      <th>Họ và tên</th>
                      <th>Lớp sinh hoạt</th>
                      <th style={{ width: '150px', textAlign: 'center' }}>Trạng thái</th>
                      <th style={{ width: '130px', textAlign: 'center' }}>Chỉnh sửa tay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                          Không tìm thấy sinh viên nào.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((st, idx) => (
                        <tr
                          key={st.enrollmentId}
                          style={{
                            backgroundColor: st.present ? 'rgba(16, 185, 129, 0.05)' : 'inherit',
                          }}
                        >
                          <td style={{ textAlign: 'center', fontWeight: 500 }}>{idx + 1}</td>
                          <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{st.studentCode}</td>
                          <td style={{ fontWeight: 600 }}>
                            {st.fullName}
                            {(st.disqualified || st.attendanceStatus === 'DISQUALIFIED') && (
                              <span
                                className="badge badge-danger"
                                style={{
                                  marginLeft: '8px',
                                  fontSize: '0.7rem',
                                  padding: '2px 6px',
                                  backgroundColor: '#fee2e2',
                                  color: '#dc2626',
                                  border: '1px solid #fecaca',
                                  verticalAlign: 'middle',
                                }}
                                title="Sinh viên đã vắng >= 20% số tiết và bị cấm thi theo quy chế"
                              >
                                CẤM THI
                              </span>
                            )}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{st.className || '—'}</td>
                          <td style={{ textAlign: 'center' }}>
                            {st.present ? (
                              <span
                                className="badge badge-success"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <CheckCircle2 size={13} /> Có mặt
                              </span>
                            ) : (
                              <span
                                className="badge badge-danger"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <XCircle size={13} /> Vắng mặt
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => handleToggleStudent(st.enrollmentId)}
                              className={`btn btn-sm ${st.present ? 'btn-outline' : 'btn-primary'}`}
                              style={{
                                padding: '3px 10px',
                                fontSize: '0.75rem',
                              }}
                              title="Bấm để đổi Có mặt / Vắng"
                            >
                              {st.present ? 'Đánh dấu Vắng' : 'Điểm danh Có mặt'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border, #e5e7eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle, #f9fafb)',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            * Giảng viên bấm &ldquo;Lưu điểm danh & Chốt sổ&rdquo; để hệ thống cập nhật chính thức số buổi vắng cho sinh viên.
          </span>
          <button onClick={onClose} className="btn btn-outline btn-sm">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
