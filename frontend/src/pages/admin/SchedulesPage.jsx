import { useState, useEffect } from 'react';
import {
  Calendar, Clock, MapPin, User, BookOpen, Plus, Trash2, Edit2, Search,
  Filter, AlertTriangle, Layers, School, CheckCircle2, Grid, List, RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  scheduleService,
  courseSectionService,
  classService,
  semesterService
} from '../../services/dataService';

const DAYS = [
  { value: 2, label: 'Thứ Hai', short: 'T2' },
  { value: 3, label: 'Thứ Ba', short: 'T3' },
  { value: 4, label: 'Thứ Tư', short: 'T4' },
  { value: 5, label: 'Thứ Năm', short: 'T5' },
  { value: 6, label: 'Thứ Sáu', short: 'T6' },
  { value: 7, label: 'Thứ Bảy', short: 'T7' },
  { value: 8, label: 'Chủ Nhật', short: 'CN' },
];

const PERIOD_SLOTS = [
  { slot: 'Sáng 1', start: 1, end: 3, label: 'Tiết 1 - 3 (07:00 - 09:35)' },
  { slot: 'Sáng 2', start: 4, end: 6, label: 'Tiết 4 - 6 (09:45 - 12:20)' },
  { slot: 'Chiều 1', start: 7, end: 9, label: 'Tiết 7 - 9 (13:00 - 15:35)' },
  { slot: 'Chiều 2', start: 10, end: 12, label: 'Tiết 10 - 12 (15:45 - 18:20)' },
];

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [sections, setSections] = useState([]);
  const [classes, setClasses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [search, setSearch] = useState('');
  const [selectedDayFilter, setSelectedDayFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [conflictError, setConflictError] = useState('');

  const [formData, setFormData] = useState({
    courseSectionId: '',
    administrativeClassId: '',
    dayOfWeek: 2,
    startPeriod: 1,
    endPeriod: 3,
    room: 'A101',
    startDate: '2026-09-07',
    endDate: '2026-12-25',
    note: 'Lý thuyết',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resSched, resSec, resClass, resSem] = await Promise.all([
        scheduleService.getAll(),
        courseSectionService.getAll(),
        classService.getAll(),
        semesterService.getAll(),
      ]);
      setSchedules(resSched.data?.data || []);
      setSections(resSec.data?.data || []);
      setClasses(resClass.data?.data || []);
      const semList = resSem.data?.data || [];
      setSemesters(semList);
      const cur = semList.find((s) => s.isCurrent);
      if (cur) setSelectedSemester(cur.id);
    } catch {
      toast.error('Lỗi khi tải dữ liệu lịch học');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (sched = null) => {
    setConflictError('');
    if (sched) {
      setEditingSchedule(sched);
      setFormData({
        courseSectionId: sched.courseSection?.id || '',
        administrativeClassId: sched.administrativeClass?.id || '',
        dayOfWeek: sched.dayOfWeek || 2,
        startPeriod: sched.startPeriod || 1,
        endPeriod: sched.endPeriod || 3,
        room: sched.room || '',
        startDate: sched.startDate || '2026-09-07',
        endDate: sched.endDate || '2026-12-25',
        note: sched.note || '',
      });
    } else {
      setEditingSchedule(null);
      setFormData({
        courseSectionId: sections[0]?.id || '',
        administrativeClassId: '',
        dayOfWeek: 2,
        startPeriod: 1,
        endPeriod: 3,
        room: 'A101',
        startDate: '2026-09-07',
        endDate: '2026-12-25',
        note: 'Lý thuyết',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConflictError('');

    if (parseInt(formData.startPeriod) > parseInt(formData.endPeriod)) {
      setConflictError('Tiết bắt đầu không được lớn hơn tiết kết thúc!');
      return;
    }
    if (!formData.courseSectionId && !formData.administrativeClassId) {
      setConflictError('Vui lòng chọn Lớp học phần hoặc Lớp sinh hoạt!');
      return;
    }

    try {
      const payload = {
        ...formData,
        courseSectionId: formData.courseSectionId ? parseInt(formData.courseSectionId) : null,
        administrativeClassId: formData.administrativeClassId ? parseInt(formData.administrativeClassId) : null,
        dayOfWeek: parseInt(formData.dayOfWeek),
        startPeriod: parseInt(formData.startPeriod),
        endPeriod: parseInt(formData.endPeriod),
      };

      if (editingSchedule) {
        await scheduleService.update(editingSchedule.id, payload);
        toast.success('Cập nhật lịch học thành công!');
      } else {
        await scheduleService.create(payload);
        toast.success('Xếp lịch học mới thành công!');
      }

      setIsModalOpen(false);
      const res = await scheduleService.getAll();
      setSchedules(res.data?.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu lịch học';
      setConflictError(msg);
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lịch học này khỏi hệ thống?')) return;
    try {
      await scheduleService.delete(id);
      toast.success('Đã xóa lịch học thành công!');
      setSchedules(schedules.filter((s) => s.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa lịch học');
    }
  };

  // Filtered schedules
  const filteredSchedules = schedules.filter((s) => {
    const semId = s.courseSection?.semester?.id;
    const matchSem = selectedSemester ? semId === parseInt(selectedSemester) : true;
    const matchDay = selectedDayFilter ? s.dayOfWeek === parseInt(selectedDayFilter) : true;
    const subjectName = s.courseSection?.subject?.subjectName || '';
    const sectionCode = s.courseSection?.sectionCode || '';
    const className = s.administrativeClass?.classCode || '';
    const lecturerName = s.courseSection?.lecturer?.fullName || '';
    const roomName = s.room || '';
    const q = search.toLowerCase();
    const matchSearch = q
      ? subjectName.toLowerCase().includes(q) ||
        sectionCode.toLowerCase().includes(q) ||
        className.toLowerCase().includes(q) ||
        lecturerName.toLowerCase().includes(q) ||
        roomName.toLowerCase().includes(q)
      : true;
    return matchSem && matchDay && matchSearch;
  });

  // Calculate stats
  const totalSlots = filteredSchedules.length;
  const uniqueRooms = new Set(filteredSchedules.map((s) => s.room)).size;
  const uniqueLecturers = new Set(
    filteredSchedules.map((s) => s.courseSection?.lecturer?.fullName).filter(Boolean)
  ).size;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Quản Lý Lịch Học & Xếp Lịch Đào Tạo</h1>
          <p>
            Quy trình BA: Phân bổ phòng học, giảng viên, tiết học và chống xung đột lịch tự động
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={loadData} title="Tải lại dữ liệu">
            <RefreshCw size={16} /> Tải lại
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Xếp lịch mới
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
            <div className="stat-value">{totalSlots}</div>
            <div className="stat-label">Buổi học đã xếp</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <MapPin size={24} />
          </div>
          <div>
            <div className="stat-value">{uniqueRooms}</div>
            <div className="stat-label">Phòng học đang dùng</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <User size={24} />
          </div>
          <div>
            <div className="stat-value">{uniqueLecturers}</div>
            <div className="stat-label">Giảng viên có lịch</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="stat-value">Tự động</div>
            <div className="stat-label">Chống trùng phòng / GV</div>
          </div>
        </div>
      </div>

      {/* Filter and View Switcher Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', flex: 1 }}>
          {/* Semester Selector */}
          <div style={{ minWidth: '180px' }}>
            <select
              className="form-select"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
            >
              <option value="">-- Tất cả học kỳ --</option>
              {semesters.map((sem) => (
                <option key={sem.id} value={sem.id}>
                  {sem.semesterName} {sem.academicYear} {sem.isCurrent ? '★ (Hiện tại)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Day of Week Filter */}
          <div style={{ minWidth: '140px' }}>
            <select
              className="form-select"
              value={selectedDayFilter}
              onChange={(e) => setSelectedDayFilter(e.target.value)}
            >
              <option value="">-- Tất cả thứ --</option>
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '240px', flex: 1 }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Tìm theo môn, mã lớp, phòng, giảng viên..."
              style={{ paddingLeft: '36px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
          <button
            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setViewMode('grid')}
            style={{ border: 'none', padding: '6px 12px' }}
          >
            <Grid size={15} /> TKB Tuần
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setViewMode('table')}
            style={{ border: 'none', padding: '6px 12px' }}
          >
            <List size={15} /> Bảng danh sách
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw className="spin" size={32} style={{ margin: '0 auto 12px' }} />
          <p>Đang tải dữ liệu thời khóa biểu...</p>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="card" style={{ padding: '50px', textAlign: 'center' }}>
          <Calendar size={48} style={{ color: 'var(--text-light)', margin: '0 auto 16px' }} />
          <h3 style={{ marginBottom: '8px' }}>Chưa có lịch học nào phù hợp</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
            Không tìm thấy lịch học cho điều kiện lọc hiện tại. Bạn có thể nhấn nút bên dưới để xếp lịch mới.
          </p>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} /> Xếp lịch mới ngay
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ================= WEEKLY GRID VIEW ================= */
        <div className="card" style={{ padding: '20px', overflowX: 'auto' }}>
          <div style={{ minWidth: '950px' }}>
            {/* Grid Table Header */}
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
                <Clock size={16} /> Ca / Tiết học
              </div>
              {DAYS.map((d) => (
                <div
                  key={d.value}
                  style={{
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    padding: '12px 6px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--primary-border)',
                  }}
                >
                  <div>{d.label}</div>
                  <div style={{ fontSize: '0.725rem', opacity: 0.85, fontWeight: 500 }}>
                    {filteredSchedules.filter((s) => s.dayOfWeek === d.value).length} lớp học
                  </div>
                </div>
              ))}
            </div>

            {/* Grid Rows for Period Slots */}
            {PERIOD_SLOTS.map((slot) => (
              <div
                key={slot.slot}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '150px repeat(7, 1fr)',
                  gap: '10px',
                  marginBottom: '12px',
                  minHeight: '120px',
                }}
              >
                {/* Period Slot Column */}
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

                {/* Day Columns */}
                {DAYS.map((d) => {
                  // Find all schedules overlapping this slot on day d.value
                  const cellSchedules = filteredSchedules.filter(
                    (s) =>
                      s.dayOfWeek === d.value &&
                      s.startPeriod <= slot.end &&
                      s.endPeriod >= slot.start
                  );

                  return (
                    <div
                      key={d.value}
                      style={{
                        background: cellSchedules.length > 0 ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                        border: cellSchedules.length > 0 ? '1px solid var(--border-subtle)' : '1px dashed var(--border-color)',
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
                        const clsCode = s.administrativeClass?.classCode;

                        return (
                          <div
                            key={s.id}
                            style={{
                              background: 'var(--bg-app)',
                              border: '1px solid var(--primary-border)',
                              borderLeft: '4px solid var(--primary)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '8px',
                              fontSize: '0.8rem',
                              boxShadow: 'var(--shadow-xs)',
                              position: 'relative',
                            }}
                          >
                            <div style={{ fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}>
                              {subj?.subjectName || clsCode || 'Lớp học'}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: 'var(--primary)', fontWeight: 600 }}>
                              <MapPin size={12} />
                              <span>{s.room}</span>
                              <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '1px 5px', marginLeft: 'auto' }}>
                                T{s.startPeriod}-{s.endPeriod}
                              </span>
                            </div>

                            {secCode && (
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.725rem', marginTop: '3px' }}>
                                LHP: <strong>{secCode}</strong>
                              </div>
                            )}

                            {clsCode && (
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.725rem', marginTop: '2px' }}>
                                Lớp: <strong>{clsCode}</strong>
                              </div>
                            )}

                            {lect?.fullName && (
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.725rem', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <User size={11} /> {lect.fullName}
                              </div>
                            )}

                            {/* Quick Actions */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginTop: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '4px' }}>
                              <button
                                className="btn-icon"
                                style={{ width: '22px', height: '22px' }}
                                onClick={() => handleOpenModal(s)}
                                title="Chỉnh sửa lịch"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                className="btn-icon"
                                style={{ width: '22px', height: '22px', color: 'var(--danger)' }}
                                onClick={() => handleDelete(s.id)}
                                title="Xóa lịch"
                              >
                                <Trash2 size={12} />
                              </button>
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
        /* ================= DETAILED TABLE VIEW ================= */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Thứ & Tiết học</th>
                  <th>Phòng học</th>
                  <th>Lớp Học Phần / Môn Học</th>
                  <th>Lớp Sinh Hoạt</th>
                  <th>Giảng Viên</th>
                  <th>Thời gian áp dụng</th>
                  <th>Ghi chú</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {s.dayOfWeekName || `Thứ ${s.dayOfWeek}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        Tiết {s.startPeriod} - {s.endPeriod} ({s.periodTimeString || ''})
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ fontSize: '0.825rem', padding: '4px 10px' }}>
                        <MapPin size={12} /> {s.room}
                      </span>
                    </td>
                    <td>
                      {s.courseSection ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{s.courseSection.subject?.subjectName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Mã HP: {s.courseSection.sectionCode} ({s.courseSection.subject?.credits} TC)
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Theo lớp sinh hoạt</span>
                      )}
                    </td>
                    <td>
                      {s.administrativeClass ? (
                        <span className="badge badge-neutral">
                          <School size={12} /> {s.administrativeClass.classCode}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-light)' }}>-</span>
                      )}
                    </td>
                    <td>
                      {s.courseSection?.lecturer ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={14} style={{ color: 'var(--text-muted)' }} />
                          <span>{s.courseSection.lecturer.fullName}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-light)' }}>Chưa phân công</span>
                      )}
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
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-icon"
                        onClick={() => handleOpenModal(s)}
                        title="Chỉnh sửa"
                        style={{ marginRight: '4px' }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleDelete(s.id)}
                        title="Xóa"
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL ADD / EDIT SCHEDULE ================= */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>{editingSchedule ? 'Chỉnh Sửa Lịch Học' : 'Xếp Lịch Học Mới Cho Học Kỳ'}</h3>
              <button
                className="btn-icon"
                onClick={() => setIsModalOpen(false)}
                title="Đóng"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {conflictError && (
                  <div
                    style={{
                      background: 'var(--danger-bg)',
                      border: '1px solid var(--danger-border)',
                      color: 'var(--danger-text)',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontSize: '0.875rem',
                      lineHeight: 1.4,
                    }}
                  >
                    <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Cảnh báo xung đột xếp lịch!</strong>
                      <div>{conflictError}</div>
                    </div>
                  </div>
                )}

                {/* Course Section */}
                <div className="form-group">
                  <label className="form-label">Lớp Học Phần (Môn học, GV, Học kỳ)</label>
                  <select
                    className="form-select"
                    value={formData.courseSectionId}
                    onChange={(e) => setFormData({ ...formData, courseSectionId: e.target.value })}
                  >
                    <option value="">-- Chọn lớp học phần --</option>
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.sectionCode} - {sec.subject?.subjectName} (GV: {sec.lecturer?.fullName || 'Chưa gán'}) - {sec.semester?.semesterName}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    Sinh viên đăng ký vào lớp học phần này sẽ tự động nhìn thấy lịch học trên trang của mình.
                  </small>
                </div>

                {/* Administrative Class (Optional/Co-schedule) */}
                <div className="form-group">
                  <label className="form-label">Lớp Sinh Hoạt (Dành cho xếp lịch đồng bộ cả lớp)</label>
                  <select
                    className="form-select"
                    value={formData.administrativeClassId}
                    onChange={(e) => setFormData({ ...formData, administrativeClassId: e.target.value })}
                  >
                    <option value="">-- Không chọn (hoặc theo từng sinh viên ĐK) --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.classCode} - {cls.className} ({cls.department?.departmentName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Day of week & Room */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Thứ trong tuần *</label>
                    <select
                      className="form-select"
                      value={formData.dayOfWeek}
                      onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                      required
                    >
                      {DAYS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phòng học *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="VD: A101, B203, C102, LAB-302"
                      value={formData.room}
                      onChange={(e) => setFormData({ ...formData, room: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                </div>

                {/* Periods */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Tiết bắt đầu (1 - 12) *</label>
                    <select
                      className="form-select"
                      value={formData.startPeriod}
                      onChange={(e) => setFormData({ ...formData, startPeriod: e.target.value })}
                      required
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((p) => (
                        <option key={p} value={p}>
                          Tiết {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tiết kết thúc (1 - 12) *</label>
                    <select
                      className="form-select"
                      value={formData.endPeriod}
                      onChange={(e) => setFormData({ ...formData, endPeriod: e.target.value })}
                      required
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((p) => (
                        <option key={p} value={p}>
                          Tiết {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date range */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Ngày bắt đầu áp dụng</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ngày kết thúc áp dụng</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* Note */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Ghi chú (Hình thức học / Lưu ý)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="VD: Lý thuyết, Thực hành máy tính, Thi giữa kỳ..."
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSchedule ? 'Cập nhật lịch' : 'Lưu & Xếp lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
