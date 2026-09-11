import { useState, useEffect } from 'react';
import {
  Calendar, Clock, MapPin, User, BookOpen, Layers, CheckCircle2,
  Grid, List, Printer, School, CalendarDays, RefreshCw, Users
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

export default function LecturerSchedulePage() {
  const { user } = useAuthStore();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const currentJsDay = new Date().getDay();
  const todayVal = currentJsDay === 0 ? 8 : currentJsDay + 1;

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const res = await scheduleService.getLecturerSchedule();
      setSchedules(res.data?.data || []);
    } catch {
      toast.error('Lỗi khi tải lịch giảng dạy');
    } finally {
      setLoading(false);
    }
  };

  const todayClasses = schedules.filter((s) => s.dayOfWeek === todayVal);
  const uniqueSections = new Set(schedules.map((s) => s.courseSection?.id).filter(Boolean)).size;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Lịch Giảng Dạy & Thời Khóa Biểu Tuần</h1>
          <p>
            Thời khóa biểu các lớp học phần được phân công giảng dạy trong học kỳ
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-outline"
            onClick={() => window.print()}
            title="In lịch giảng dạy"
          >
            <Printer size={16} /> In lịch
          </button>
          <button className="btn btn-outline" onClick={loadSchedule} title="Tải lại">
            <RefreshCw size={16} /> Tải lại
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div className="stat-value">{schedules.length}</div>
            <div className="stat-label">Buổi dạy trong tuần</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <Layers size={24} />
          </div>
          <div>
            <div className="stat-value">{uniqueSections}</div>
            <div className="stat-label">Lớp học phần phụ trách</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <MapPin size={24} />
          </div>
          <div>
            <div className="stat-value">{new Set(schedules.map((s) => s.room)).size}</div>
            <div className="stat-label">Phòng học phân bổ</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-value">{todayClasses.length}</div>
            <div className="stat-label">Ca dạy hôm nay</div>
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
              Hôm Nay ({DAYS.find((d) => d.value === todayVal)?.label}) — Lịch Trình Giảng Dạy
            </h3>
          </div>
          <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
            Tài khoản: {user?.fullName || user?.username}
          </span>
        </div>

        {todayClasses.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
            Hôm nay Thầy/Cô không có lịch lên lớp! Có thể chuẩn bị bài giảng, chấm điểm hoặc nghiên cứu khoa học.
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
                    {s.courseSection?.subject?.subjectName || 'Lớp giảng dạy'}
                  </div>
                  <span className="badge badge-success" style={{ fontWeight: 700 }}>
                    Phòng {s.room}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={13} />
                  <strong>Tiết {s.startPeriod} - {s.endPeriod}</strong> ({s.periodTimeString || ''})
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Mã lớp HP: <strong>{s.courseSection?.sectionCode}</strong>
                </div>

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
          <span>Thời Khóa Biểu Giảng Dạy Tuần</span>
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
            <List size={15} /> Danh Sách Lớp
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw className="spin" size={32} style={{ margin: '0 auto 12px' }} />
          <p>Đang tải lịch giảng dạy của Thầy/Cô...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="card" style={{ padding: '50px', textAlign: 'center' }}>
          <Calendar size={48} style={{ color: 'var(--text-light)', margin: '0 auto 16px' }} />
          <h3 style={{ marginBottom: '8px' }}>Chưa có lịch giảng dạy</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto' }}>
            Phòng Đào tạo chưa phân bổ thời khóa biểu cho các lớp học phần của Thầy/Cô trong học kỳ này.
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
                      {isToday ? '★ Hôm nay' : `${schedules.filter((s) => s.dayOfWeek === d.value).length} ca dạy`}
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
                              {subj?.subjectName || 'Lớp HP'}
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
                  <th>Lớp Học Phần & Môn Học</th>
                  <th>Học kỳ</th>
                  <th>Thứ & Tiết học</th>
                  <th>Phòng học</th>
                  <th>Thời gian áp dụng</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {s.courseSection?.subject?.subjectName || 'Lớp HP'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Mã LHP: {s.courseSection?.sectionCode || '—'} ({s.courseSection?.subject?.credits} TC)
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        {s.courseSection?.semester?.semesterName || 'HK hiện tại'}
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
