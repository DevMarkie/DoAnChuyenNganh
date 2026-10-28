import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, MapPin, Layers, Users,
  Grid, List, Printer, School, RefreshCw, ArrowUpRight, Search, CheckCircle2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { scheduleService, semesterService, courseSectionService } from '../../services/dataService';
import SectionStudentsModal from '../../components/lecturer/SectionStudentsModal';
import LecturerAttendanceModal from '../../components/lecturer/LecturerAttendanceModal';
import TableRowSkeleton from '../../components/common/TableRowSkeleton';

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
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [sections, setSections] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('sections'); // 'sections' (default) | 'grid'
  const [search, setSearch] = useState('');
  const [selectedSectionModal, setSelectedSectionModal] = useState(null);
  const [selectedAttendanceModal, setSelectedAttendanceModal] = useState(null);

  const [todayVal] = useState(() => {
    const day = new Date().getDay();
    return day === 0 ? 8 : day + 1;
  });

  const loadData = async (semId) => {
    try {
      setLoading(true);
      const [secRes, schedRes] = await Promise.all([
        courseSectionService.getMySections(),
        scheduleService.getLecturerSchedule(semId ? { semesterId: semId } : {}),
      ]);
      setSections(secRes.data?.data || []);
      setSchedules(schedRes.data?.data || []);
    } catch {
      toast.error('Lỗi khi tải dữ liệu lịch giảng dạy');
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

        await loadData(defaultSemId);
      } catch {
        toast.error('Lỗi khi khởi tạo lịch giảng dạy');
        setLoading(false);
      }
    };

    initData();
  }, []);

  const handleSemesterChange = (newSemId) => {
    setSelectedSemesterId(newSemId);
    loadData(newSemId);
  };

  // Filter sections by selected semester
  const semesterSections = useMemo(() => {
    if (!selectedSemesterId) return sections;
    return sections.filter((s) => String(s.semester?.id) === String(selectedSemesterId));
  }, [sections, selectedSemesterId]);

  // Filter sections by search keyword
  const filteredSections = useMemo(() => {
    if (!search.trim()) return semesterSections;
    const q = search.toLowerCase();
    return semesterSections.filter((s) =>
      s.sectionCode?.toLowerCase().includes(q) ||
      s.subject?.subjectName?.toLowerCase().includes(q) ||
      s.room?.toLowerCase().includes(q)
    );
  }, [semesterSections, search]);

  const activeSemesterObj = semesters.find((s) => String(s.id) === String(selectedSemesterId));
  const totalStudentsInSem = semesterSections.reduce((acc, cur) => acc + (cur.currentStudents || 0), 0);
  const completedSectionsCount = semesterSections.filter((s) => s.status === 'COMPLETED').length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Lịch Giảng Dạy & Lớp Học Phần</h1>
          <p>
            {activeSemesterObj
              ? `Danh sách các lớp học phần được phân công giảng dạy trong ${activeSemesterObj.semesterName}${activeSemesterObj.isCurrent ? ' (Học kỳ hiện tại)' : ''}`
              : 'Danh sách các lớp học phần được phân công giảng dạy trong học kỳ'}
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
            title="In lịch giảng dạy"
          >
            <Printer size={16} /> <span>In lịch</span>
          </button>
          <button
            className="btn btn-outline"
            onClick={() => loadData(selectedSemesterId)}
            title="Tải lại dữ liệu"
          >
            <RefreshCw size={16} /> <span>Tải lại</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon--primary">
            <Layers size={24} />
          </div>
          <div>
            <div className="stat-value">{semesterSections.length}</div>
            <div className="stat-label">Lớp học phần phân công</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon--info">
            <Users size={24} />
          </div>
          <div>
            <div className="stat-value">{totalStudentsInSem}</div>
            <div className="stat-label">Tổng sinh viên theo học</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon--success">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-value">{completedSectionsCount} / {semesterSections.length}</div>
            <div className="stat-label">Lớp đã chốt điểm</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon--warning">
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-value">
              {schedules.filter((s) => s.dayOfWeek === todayVal).length}
            </div>
            <div className="stat-label">Ca dạy hôm nay</div>
          </div>
        </div>
      </div>

      {/* View Switcher & Toolbar */}
      <div
        className="card"
        style={{
          padding: '14px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '380px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input
            type="text"
            placeholder="Tìm theo mã lớp, tên môn học, phòng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '36px', height: '36px', fontSize: '0.85rem' }}
          />
        </div>

        {/* View Mode Buttons */}
        <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
          <button
            className={`btn btn-sm ${viewMode === 'sections' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setViewMode('sections')}
            style={{ border: 'none', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <List size={15} /> <span>Danh sách lớp HP</span>
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setViewMode('grid')}
            style={{ border: 'none', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Grid size={15} /> <span>Ma trận tuần</span>
          </button>
        </div>
      </div>

      {/* ================= PRIMARY VIEW: SECTIONS TABLE ================= */}
      {viewMode === 'sections' ? (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Mã lớp HP</th>
                  <th>Tên môn học</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Tín chỉ</th>
                  <th>Lịch dạy (Thứ & Tiết)</th>
                  <th style={{ width: '110px' }}>Phòng học</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Sĩ số SV</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Trạng thái sổ điểm</th>
                  <th style={{ width: '220px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableRowSkeleton columns={8} />
                ) : filteredSections.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                      {search ? 'Không tìm thấy lớp học phần phù hợp với từ khóa.' : 'Chưa có lớp học phần nào được phân công trong học kỳ này.'}
                    </td>
                  </tr>
                ) : (
                  filteredSections.map((s) => {
                    const isFinalized = s.status === 'COMPLETED';
                    return (
                      <tr key={s.id}>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              color: 'var(--primary)',
                              backgroundColor: 'var(--primary-light)',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--primary-border)'
                            }}
                          >
                            {s.sectionCode}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {s.subject?.subjectName}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-info">{s.subject?.credits} TC</span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {s.schedule || '—'}
                        </td>
                        <td>
                          <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} />
                            <span>{s.room || '—'}</span>
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {s.currentStudents || 0} / {s.maxStudents}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {isFinalized ? (
                            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} />
                              <span>Đã chốt & Khóa</span>
                            </span>
                          ) : (
                            <span className="badge badge-info">
                              {s.status === 'OPEN' ? 'Đang mở ĐK' : 'Đang giảng dạy'}
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => setSelectedAttendanceModal(s)}
                              title="Điểm danh buổi học hôm nay"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <CheckCircle2 size={14} />
                              <span>Điểm danh</span>
                            </button>

                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => setSelectedSectionModal(s)}
                              title="Xem danh sách sinh viên lớp này"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Users size={14} />
                              <span>Danh sách SV</span>
                            </button>

                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => navigate(`/lecturer/grades?sectionId=${s.id}`)}
                              title="Vào bảng điểm lớp này"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <span>Vào điểm</span>
                              <ArrowUpRight size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= SECONDARY VIEW: WEEKLY GRID ================= */
        <div className="card" style={{ padding: '20px', overflowX: 'auto' }}>
          <div style={{ minWidth: '950px' }}>
            {/* Days Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '150px repeat(7, 1fr)',
                gap: '10px',
                marginBottom: '10px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              <div style={{ padding: '8px', color: 'var(--text-muted)' }}>Ca / Tiết</div>
              {DAYS.map((d) => (
                <div
                  key={d.value}
                  style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    background: d.value === todayVal ? 'var(--primary)' : 'var(--bg-subtle)',
                    color: d.value === todayVal ? '#ffffff' : 'var(--text-main)',
                    boxShadow: d.value === todayVal ? 'var(--shadow-xs)' : 'none',
                  }}
                >
                  {d.label}
                </div>
              ))}
            </div>

            {/* Slots Rows */}
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
                              cursor: 'pointer'
                            }}
                            onClick={() => setSelectedSectionModal(s.courseSection)}
                            title="Bấm để xem danh sách sinh viên lớp"
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
      )}

      {/* Student List Modal */}
      {selectedSectionModal && (
        <SectionStudentsModal
          courseSection={selectedSectionModal}
          onClose={() => setSelectedSectionModal(null)}
        />
      )}

      {/* Attendance Modal */}
      {selectedAttendanceModal && (
        <LecturerAttendanceModal
          courseSection={selectedAttendanceModal}
          onClose={() => setSelectedAttendanceModal(null)}
        />
      )}
    </div>
  );
}
