import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, MapPin, User, BookOpen, Layers, CheckCircle2,
  Grid, List, Printer, School, CalendarDays, RefreshCw, Globe,
  KeyRound, XCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { scheduleService, semesterService, attendanceService } from '../../services/dataService';
import useAuthStore from '../../store/authStore';
import StudentClassListModal from './StudentClassListModal';
import StudentCheckInModal from '../../components/student/StudentCheckInModal';

const DAYS = [
  { value: 2, label: 'Thứ Hai', short: 'T2', jsDay: 1 },
  { value: 3, label: 'Thứ Ba', short: 'T3', jsDay: 2 },
  { value: 4, label: 'Thứ Tư', short: 'T4', jsDay: 3 },
  { value: 5, label: 'Thứ Năm', short: 'T5', jsDay: 4 },
  { value: 6, label: 'Thứ Sáu', short: 'T6', jsDay: 5 },
  { value: 7, label: 'Thứ Bảy', short: 'T7', jsDay: 6 },
  { value: 8, label: 'Chủ Nhật', short: 'CN', jsDay: 0 },
];

const PERIOD_SLOTS = [
  { slot: 'Sáng 1', start: 1, end: 3, label: 'Tiết 1 - 3 (07:00 - 09:35)' },
  { slot: 'Sáng 2', start: 4, end: 6, label: 'Tiết 4 - 6 (09:45 - 12:20)' },
  { slot: 'Chiều 1', start: 7, end: 9, label: 'Tiết 7 - 9 (13:00 - 15:35)' },
  { slot: 'Chiều 2', start: 10, end: 12, label: 'Tiết 10 - 12 (15:45 - 18:20)' },
];

const isOnlineRoom = (room) => {
  if (!room) return false;
  const r = String(room).toLowerCase();
  return r.includes('online') || r.includes('zoom') || r.includes('meet') || r.includes('teams') || r.startsWith('http');
};

export default function StudentSchedulePage() {
  const { user } = useAuthStore();
  const [schedules, setSchedules] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedSection, setSelectedSection] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState({});
  const [checkInSection, setCheckInSection] = useState(null);

  // Current day calculation
  const [todayVal] = useState(() => {
    const day = new Date().getDay(); // 0 = Sunday, 1 = Monday...
    return day === 0 ? 8 : day + 1; // 2..8
  });

  const loadTodayAttendance = useCallback(async () => {
    try {
      const res = await attendanceService.getStudentToday();
      const map = {};
      (res.data?.data || []).forEach((item) => {
        map[item.sectionId] = item;
      });
      setTodayAttendance(map);
    } catch {
      // Ignore background error
    }
  }, []);

  const loadScheduleForSemester = async (semId) => {
    try {
      setLoading(true);
      const params = semId ? { semesterId: semId } : {};
      const res = await scheduleService.getMySchedule(params);
      setSchedules(res.data?.data || []);
    } catch {
      toast.error('Lỗi khi tải thời khóa biểu sinh viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const semRes = await semesterService.getAll();
        const semList = semRes.data?.data || [];
        setSemesters(semList);

        const currentSem = semList.find((s) => s.isCurrent) || semList[0];
        const defaultSemId = currentSem ? currentSem.id : '';
        setSelectedSemesterId(defaultSemId);

        await loadScheduleForSemester(defaultSemId);
        loadTodayAttendance();
      } catch {
        toast.error('Lỗi khi khởi tạo thời khóa biểu');
        setLoading(false);
      }
    };

    initData();
  }, [loadTodayAttendance]);

  const handleSemesterChange = (newSemId) => {
    setSelectedSemesterId(newSemId);
    loadScheduleForSemester(newSemId);
  };

  // Base scheduled classes for today
  const todayScheduledClasses = schedules.filter((s) => s.dayOfWeek === todayVal);
  const scheduledSectionIds = new Set(todayScheduledClasses.map((s) => s.courseSection?.id));

  // Also include any enrolled classes that have an active OPEN/SAVED attendance session today (makeup/testing)
  const extraActiveClasses = schedules.filter((s) => {
    if (!s.courseSection?.id) return false;
    if (scheduledSectionIds.has(s.courseSection.id)) return false;
    const att = todayAttendance[s.courseSection.id];
    return att && (att.sessionStatus === 'OPEN' || att.sessionStatus === 'SAVED');
  });

  const seenExtra = new Set();
  const dedupedExtra = extraActiveClasses.filter((s) => {
    if (seenExtra.has(s.courseSection?.id)) return false;
    seenExtra.add(s.courseSection?.id);
    return true;
  });

  const todayClasses = [...todayScheduledClasses, ...dedupedExtra];
  const uniqueSubjects = Array.from(
    new Map(
      schedules
        .filter((s) => s.courseSection?.subject?.id)
        .map((s) => [s.courseSection.subject.id, s.courseSection.subject])
    ).values()
  );
  const totalCredits = uniqueSubjects.reduce(
    (acc, subj) => acc + (subj.credits || 0),
    0
  );

  const activeSemesterObj = semesters.find((s) => String(s.id) === String(selectedSemesterId));

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Thời Khóa Biểu & Lịch Học Tuần</h1>
          <p>
            {activeSemesterObj
              ? `Lịch học ${activeSemesterObj.semesterName}${activeSemesterObj.isCurrent ? ' (Học kỳ hiện tại)' : ''}`
              : 'Lịch học tự động liên kết từ lớp học phần đã đăng ký và lớp sinh hoạt của sinh viên'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Semester Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-surface)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--primary-border)',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <School size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
              Học kỳ:
            </span>
            <select
              value={selectedSemesterId}
              onChange={(e) => handleSemesterChange(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontWeight: 700,
                fontSize: '0.9rem',
                color: 'var(--primary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.semesterName} {s.isCurrent ? '★ (Hiện tại)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-outline"
            onClick={() => window.print()}
            title="In thời khóa biểu"
          >
            <Printer size={16} /> In TKB
          </button>
          <button
            className="btn btn-outline"
            onClick={() => loadScheduleForSemester(selectedSemesterId)}
            title="Tải lại"
          >
            <RefreshCw size={16} /> Tải lại
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon--info">
            <Calendar size={24} />
          </div>
          <div>
            <div className="stat-value">{schedules.length}</div>
            <div className="stat-label">Buổi học trong tuần</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon--success">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="stat-value">{uniqueSubjects.length}</div>
            <div className="stat-label">Môn học đang học</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon--purple">
            <Layers size={24} />
          </div>
          <div>
            <div className="stat-value">{totalCredits}</div>
            <div className="stat-label">Tổng tín chỉ đăng ký</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon--warning">
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-value">{todayClasses.length}</div>
            <div className="stat-label">Ca học hôm nay</div>
          </div>
        </div>
      </div>

      {/* TODAY FOCUS BANNER */}
      <div
        className="card"
        style={{
          padding: '20px',
          marginBottom: '20px',
          background: 'var(--bg-surface)',
          borderLeft: '5px solid var(--primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
              Hôm Nay ({DAYS.find((d) => d.value === todayVal)?.label}) — Lịch Trình Học Tập
            </h3>
          </div>
          <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
            Mã SV: {user?.username}
          </span>
        </div>

        {todayClasses.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
            Hôm nay bạn không có lịch học! Hãy tận dụng thời gian tự ôn tập hoặc chuẩn bị cho các buổi học tiếp theo.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {todayClasses.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedSection({ ...s.courseSection, room: s.room })}
                title="Nhấn để xem danh sách lớp học và số buổi vắng"
                style={{
                  background: 'var(--primary-light)',
                  border: '1px solid var(--primary-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                      {s.courseSection?.subject?.subjectName || 'Lớp học'}
                    </div>
                    {s.dayOfWeek !== todayVal && (
                      <span className="badge badge-warning" style={{ fontSize: '0.675rem', padding: '1px 5px', marginTop: '3px', display: 'inline-block' }}>
                        ⚡ Phiên điểm danh hôm nay
                      </span>
                    )}
                  </div>
                  {isOnlineRoom(s.room) ? (
                    <span className="badge badge-purple" style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Globe size={13} /> Học Online
                    </span>
                  ) : (
                    <span className="badge badge-success" style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} /> Phòng {s.room}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={13} />
                  <strong>Tiết {s.startPeriod} - {s.endPeriod}</strong> ({s.periodTimeString || ''})
                </div>

                {s.courseSection?.lecturer?.fullName && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={13} />
                    GV: {s.courseSection.lecturer.fullName}
                  </div>
                )}

                {s.note && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
                    Lưu ý: {s.note}
                  </div>
                )}

                {/* Attendance Status & Check-in Action */}
                {(() => {
                  const att = todayAttendance[s.courseSection?.id];
                  if (!att) return null;

                  if (att.sessionStatus === 'OPEN') {
                    if (att.isPresent) {
                      return (
                        <div style={{ marginTop: '10px' }}>
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '4px 8px' }}>
                            <CheckCircle2 size={13} /> Đã điểm danh (Có mặt)
                          </span>
                        </div>
                      );
                    }
                    return (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{
                          marginTop: '10px',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          fontWeight: 700,
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          borderColor: '#059669'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCheckInSection(s.courseSection);
                        }}
                      >
                        <KeyRound size={14} />
                        <span>Điểm danh ngay (Đang mở)</span>
                      </button>
                    );
                  }

                  if (att.sessionStatus === 'SAVED') {
                    return (
                      <div style={{ marginTop: '10px' }}>
                        {att.isPresent ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '4px 8px' }}>
                            <CheckCircle2 size={13} /> Buổi hôm nay: Có mặt
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '4px 8px' }}>
                            <XCircle size={13} /> Buổi hôm nay: Vắng mặt
                          </span>
                        )}
                      </div>
                    );
                  }

                  return (
                    <button
                      className="btn btn-outline btn-sm"
                      style={{
                        marginTop: '10px',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '0.78rem'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCheckInSection(s.courseSection);
                      }}
                    >
                      <KeyRound size={13} />
                      <span>Nhập mã điểm danh</span>
                    </button>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Switcher & Filter Bar */}
      <div
        className="card"
        style={{
          padding: '14px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <School size={18} style={{ color: 'var(--primary)' }} />
          <span>Thời Khóa Biểu Toàn Học Kỳ</span>
        </div>

        <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
          <button
            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setViewMode('grid')}
            style={{ border: 'none', padding: '6px 12px' }}
          >
            <Grid size={15} /> Ma Trận Tuần
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setViewMode('list')}
            style={{ border: 'none', padding: '6px 12px' }}
          >
            <List size={15} /> Danh Sách Môn
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw className="spin" size={32} style={{ margin: '0 auto 12px' }} />
          <p>Đang tải thời khóa biểu của bạn...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="card" style={{ padding: '50px', textAlign: 'center' }}>
          <Calendar size={48} style={{ color: 'var(--text-light)', margin: '0 auto 16px' }} />
          <h3 style={{ marginBottom: '8px' }}>Bạn chưa có lịch học nào</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto' }}>
            Hệ thống chưa tìm thấy lịch học được phân cho bạn. Hãy chắc chắn bạn đã đăng ký học phần trong kỳ hoặc liên hệ Phòng Đào tạo.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ================= WEEKLY MATRIX GRID ================= */
        <div className="card" style={{ padding: '20px', overflowX: 'auto' }}>
          <div style={{ minWidth: '950px' }}>
            {/* Days Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '150px repeat(7, 1fr)',
                gap: '10px',
                marginBottom: '12px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Clock size={16} /> Ca / Tiết
              </div>
              {DAYS.map((d) => {
                const isToday = d.value === todayVal;
                return (
                  <div
                    key={d.value}
                    style={{
                      background: isToday ? 'var(--primary)' : 'var(--primary-light)',
                      color: isToday ? '#ffffff' : 'var(--primary)',
                      padding: '12px 6px',
                      borderRadius: 'var(--radius-md)',
                      border: isToday ? '2px solid var(--primary-hover)' : '1px solid var(--primary-border)',
                      boxShadow: isToday ? 'var(--shadow-sm)' : 'none',
                    }}
                  >
                    <div>{d.label}</div>
                    <div style={{ fontSize: '0.725rem', opacity: isToday ? 0.95 : 0.8, fontWeight: 500 }}>
                      {isToday ? '★ Hôm nay' : `${schedules.filter((s) => s.dayOfWeek === d.value).length} ca học`}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Period Slots */}
            {PERIOD_SLOTS.map((slot) => (
              <div
                key={slot.slot}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '150px repeat(7, 1fr)',
                  gap: '10px',
                  marginBottom: '12px',
                  minHeight: '125px',
                }}
              >
                {/* Slot info */}
                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                    {slot.slot}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Tiết {slot.start} - {slot.end}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '2px' }}>
                    {slot.label.split('(')[1]?.replace(')', '') || ''}
                  </span>
                </div>

                {/* Days */}
                {DAYS.map((d) => {
                  const isToday = d.value === todayVal;
                  const cellSchedules = schedules.filter(
                    (s) =>
                      s.dayOfWeek === d.value &&
                      s.startPeriod <= slot.end &&
                      s.endPeriod >= slot.start
                  );

                  return (
                    <div
                      key={d.value}
                      style={{
                        background: cellSchedules.length > 0
                          ? (isToday ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-surface)')
                          : 'var(--bg-subtle)',
                        border: isToday
                          ? '1.5px solid var(--primary-border)'
                          : cellSchedules.length > 0 ? '1px solid var(--border-subtle)' : '1px dashed var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      {cellSchedules.length > 1 && (
                        <div style={{
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fca5a5',
                          borderRadius: '4px',
                          padding: '3px 6px',
                          fontSize: '0.675rem',
                          fontWeight: 700,
                          textAlign: 'center',
                        }}>
                          ⚠️ Trùng ca ({cellSchedules.length} môn)
                        </div>
                      )}
                      {cellSchedules.map((s) => {
                        const subj = s.courseSection?.subject;
                        const lect = s.courseSection?.lecturer;
                        const secCode = s.courseSection?.sectionCode;

                        return (
                          <div
                            key={s.id}
                            onClick={() => setSelectedSection({ ...s.courseSection, room: s.room })}
                            title="Nhấn để xem danh sách lớp học và số buổi vắng"
                            style={{
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--primary-border)',
                              borderLeft: '4px solid var(--primary)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '8px',
                              fontSize: '0.8rem',
                              boxShadow: 'var(--shadow-xs)',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}>
                              {subj?.subjectName || 'Lớp học'}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: isOnlineRoom(s.room) ? 'var(--purple, #8b5cf6)' : 'var(--primary)', fontWeight: 600 }}>
                              {isOnlineRoom(s.room) ? <Globe size={12} /> : <MapPin size={12} />}
                              <span>{isOnlineRoom(s.room) ? (String(s.room).length > 15 ? 'Online' : s.room) : `P.${s.room}`}</span>
                              <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '1px 5px', marginLeft: 'auto' }}>
                                Tiết {s.startPeriod}-{s.endPeriod}
                              </span>
                            </div>

                            {secCode && (
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.725rem', marginTop: '3px' }}>
                                LHP: <strong>{secCode}</strong>
                              </div>
                            )}

                            {lect?.fullName && (
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.725rem', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <User size={11} /> {lect.fullName}
                              </div>
                            )}

                            {s.note && (
                              <div style={{ color: 'var(--text-light)', fontSize: '0.7rem', marginTop: '3px', fontStyle: 'italic' }}>
                                {s.note}
                              </div>
                            )}

                            {/* Quick Attendance Action */}
                            <div
                              style={{
                                marginTop: '6px',
                                paddingTop: '4px',
                                borderTop: '1px dashed var(--border-light, #e5e7eb)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              {todayAttendance[s.courseSection?.id]?.isPresent ? (
                                <span
                                  className="badge badge-success"
                                  style={{
                                    fontSize: '0.675rem',
                                    padding: '2px 5px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                  }}
                                >
                                  <CheckCircle2 size={11} /> Đã có mặt
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className={`btn btn-sm ${
                                    todayAttendance[s.courseSection?.id]?.sessionStatus === 'OPEN'
                                      ? 'btn-primary'
                                      : 'btn-outline'
                                  }`}
                                  style={{
                                    fontSize: '0.675rem',
                                    padding: '2px 8px',
                                    height: 'auto',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    background:
                                      todayAttendance[s.courseSection?.id]?.sessionStatus === 'OPEN'
                                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                        : undefined,
                                    borderColor:
                                      todayAttendance[s.courseSection?.id]?.sessionStatus === 'OPEN'
                                        ? '#059669'
                                        : undefined,
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCheckInSection(s.courseSection);
                                  }}
                                  title="Nhập mã điểm danh cho lớp học phần này"
                                >
                                  <KeyRound size={11} />
                                  <span>
                                    {todayAttendance[s.courseSection?.id]?.sessionStatus === 'OPEN'
                                      ? '⚡ Điểm danh'
                                      : 'Điểm danh'}
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ================= LIST VIEW ================= */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Môn học & lớp HP</th>
                  <th>Số TC</th>
                  <th>Thứ & tiết học</th>
                  <th>Phòng học</th>
                  <th>Giảng viên giảng dạy</th>
                  <th>Thời gian áp dụng</th>
                  <th>Ghi chú</th>
                  <th style={{ textAlign: 'center', width: '130px' }}>Điểm danh</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr 
                    key={s.id} 
                    onClick={() => setSelectedSection({ ...s.courseSection, room: s.room })} 
                    style={{ cursor: 'pointer' }}
                    title="Nhấn để xem danh sách lớp học và số buổi vắng"
                  >
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {s.courseSection?.subject?.subjectName || 'Lớp học'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Mã HP: {s.courseSection?.sectionCode || '—'}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info">
                        {s.courseSection?.subject?.credits || 0} TC
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        {DAYS.find(d => d.value === s.dayOfWeek)?.label || (s.dayOfWeek === 8 ? 'Chủ Nhật' : `Thứ ${s.dayOfWeek}`)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Tiết {s.startPeriod} - {s.endPeriod} ({s.periodTimeString || ''})
                      </div>
                    </td>
                    <td>
                      {isOnlineRoom(s.room) ? (
                        <span className="badge badge-purple" style={{ fontSize: '0.825rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Globe size={12} /> {s.room} (Online)
                        </span>
                      ) : (
                        <span className="badge badge-success" style={{ fontSize: '0.825rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} /> Phòng {s.room}
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{s.courseSection?.lecturer?.fullName || 'Chưa phân công'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>
                        <div>{s.startDate || '—'}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>đến {s.endDate || '—'}</div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {s.note || '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      {todayAttendance[s.courseSection?.id]?.isPresent ? (
                        <span
                          className="badge badge-success"
                          style={{
                            fontSize: '0.725rem',
                            padding: '3px 6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle2 size={12} /> Đã có mặt
                        </span>
                      ) : (
                        <button
                          type="button"
                          className={`btn btn-sm ${
                            todayAttendance[s.courseSection?.id]?.sessionStatus === 'OPEN'
                              ? 'btn-primary'
                              : 'btn-outline'
                          }`}
                          style={{
                            fontSize: '0.725rem',
                            padding: '3px 8px',
                            height: 'auto',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background:
                              todayAttendance[s.courseSection?.id]?.sessionStatus === 'OPEN'
                                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                : undefined,
                            borderColor:
                              todayAttendance[s.courseSection?.id]?.sessionStatus === 'OPEN'
                                ? '#059669'
                                : undefined,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCheckInSection(s.courseSection);
                          }}
                          title="Nhập mã điểm danh cho lớp này"
                        >
                          <KeyRound size={12} />
                          <span>
                            {todayAttendance[s.courseSection?.id]?.sessionStatus === 'OPEN'
                              ? '⚡ Điểm danh'
                              : 'Điểm danh'}
                          </span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {selectedSection && (
        <StudentClassListModal 
          courseSection={selectedSection} 
          todayAttendance={todayAttendance}
          onCheckInSuccess={loadTodayAttendance}
          onClose={() => setSelectedSection(null)} 
        />
      )}

      {checkInSection && (
        <StudentCheckInModal
          courseSection={checkInSection}
          onClose={() => setCheckInSection(null)}
          onSuccess={loadTodayAttendance}
        />
      )}
    </div>
  );
}
