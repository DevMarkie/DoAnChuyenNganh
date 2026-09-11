import { useState, useEffect } from 'react';
import {
  Calendar, Clock, MapPin, User, BookOpen, Layers, CheckCircle2,
  AlertCircle, Grid, List, Printer, School, CalendarDays, RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';
import { scheduleService } from '../../services/dataService';
import useAuthStore from '../../store/authStore';

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

export default function StudentSchedulePage() {
  const { user } = useAuthStore();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Current day calculation
  const currentJsDay = new Date().getDay(); // 0 = Sunday, 1 = Monday...
  const todayVal = currentJsDay === 0 ? 8 : currentJsDay + 1; // 2..8

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const res = await scheduleService.getMySchedule();
      setSchedules(res.data?.data || []);
    } catch {
      toast.error('Lỗi khi tải thời khóa biểu sinh viên');
    } finally {
      setLoading(false);
    }
  };

  const todayClasses = schedules.filter((s) => s.dayOfWeek === todayVal);
  const totalCredits = schedules.reduce(
    (acc, s) => acc + (s.courseSection?.subject?.credits || 0),
    0
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Thời Khóa Biểu & Lịch Học Tuần</h1>
          <p>
            Lịch học tự động liên kết từ lớp học phần đã đăng ký và lớp sinh hoạt của sinh viên
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-outline"
            onClick={() => window.print()}
            title="In thời khóa biểu"
          >
            <Printer size={16} /> In TKB
          </button>
          <button className="btn btn-outline" onClick={loadSchedule} title="Tải lại">
            <RefreshCw size={16} /> Tải lại
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div className="stat-value">{schedules.length}</div>
            <div className="stat-label">Buổi học trong tuần</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div className="stat-value">{new Set(schedules.map((s) => s.courseSection?.subject?.id)).size}</div>
            <div className="stat-label">Môn học đang học</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <Layers size={24} />
          </div>
          <div>
            <div className="stat-value">{totalCredits}</div>
            <div className="stat-label">Tổng tín chỉ đăng ký</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
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
                style={{
                  background: 'var(--primary-light)',
                  border: '1px solid var(--primary-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                    {s.courseSection?.subject?.subjectName || 'Lớp học'}
                  </div>
                  <span className="badge badge-success" style={{ fontWeight: 700 }}>
                    Phòng {s.room}
                  </span>
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
                      {cellSchedules.map((s) => {
                        const subj = s.courseSection?.subject;
                        const lect = s.courseSection?.lecturer;
                        const secCode = s.courseSection?.sectionCode;

                        return (
                          <div
                            key={s.id}
                            style={{
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--primary-border)',
                              borderLeft: '4px solid var(--primary)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '8px',
                              fontSize: '0.8rem',
                              boxShadow: 'var(--shadow-xs)',
                            }}
                          >
                            <div style={{ fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}>
                              {subj?.subjectName || 'Lớp học'}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: 'var(--primary)', fontWeight: 600 }}>
                              <MapPin size={12} />
                              <span>{s.room}</span>
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
                  <th>Môn Học & Lớp HP</th>
                  <th>Số TC</th>
                  <th>Thứ & Tiết học</th>
                  <th>Phòng học</th>
                  <th>Giảng Viên Giảng Dạy</th>
                  <th>Thời gian áp dụng</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id}>
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
                        {s.dayOfWeekName || `Thứ ${s.dayOfWeek}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Tiết {s.startPeriod} - {s.endPeriod} ({s.periodTimeString || ''})
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ fontSize: '0.825rem' }}>
                        <MapPin size={12} /> {s.room}
                      </span>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
