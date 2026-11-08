import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, MapPin, Layers, Users,
  Grid, List, Printer, School, RefreshCw, ArrowUpRight, Search, CheckCircle2, AlertTriangle,
  ShieldCheck, Download, X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { scheduleService, semesterService, courseSectionService, examService } from '../../services/dataService';
import SectionStudentsModal from '../../components/lecturer/SectionStudentsModal';
import LecturerAttendanceModal from '../../components/lecturer/LecturerAttendanceModal';
import TableRowSkeleton from '../../components/common/TableRowSkeleton';
import WeekCalendarPicker, {
  getMonday,
  getWeekDays,
  getCourseEndInfo,
  PERIOD_END_TIMES,
  formatViDate,
  formatIsoDate,
} from '../../components/common/WeekCalendarPicker';

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

function ProctorRosterModal({ room, onClose }) {
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchRoster = async () => {
      try {
        setLoading(true);
        const res = await examService.getRoster(room.id);
        setRoster(res.data?.data || res.data || []);
      } catch {
        toast.error('Không thể tải danh sách thí sinh phòng thi');
      } finally {
        setLoading(false);
      }
    };
    if (room?.id) fetchRoster();
  }, [room?.id]);

  const filteredRoster = useMemo(() => {
    if (!search.trim()) return roster;
    const q = search.toLowerCase();
    return roster.filter(
      (r) =>
        r.studentCode?.toLowerCase().includes(q) ||
        r.studentName?.toLowerCase().includes(q) ||
        r.sbd?.toLowerCase().includes(q) ||
        r.className?.toLowerCase().includes(q)
    );
  }, [roster, search]);

  const handleDownloadExcel = async () => {
    try {
      const res = await examService.downloadTemplate(room.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `danh_sach_thi_${room.roomCode || room.id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Đã tải danh sách phòng thi');
    } catch {
      toast.error('Lỗi khi xuất danh sách phòng thi');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-content"
        style={{ maxWidth: '950px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)'
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Users size={20} style={{ color: 'var(--primary)' }} />
              Danh Sách Thí Sinh — Phòng {room.roomCode} ({room.subjectName})
            </h3>
            <div
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                marginTop: '4px',
                display: 'flex',
                gap: '14px',
                flexWrap: 'wrap'
              }}
            >
              <span>Ca thi: <strong>{room.examDate}</strong> ({room.startTime} - {room.endTime})</span>
              <span>Địa điểm: <strong>{room.roomLocation || room.roomCode}</strong></span>
              <span>Sĩ số: <strong>{roster.length}</strong> thí sinh</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleDownloadExcel}
              title="Tải bảng danh sách thí sinh phòng thi (.xlsx)"
            >
              <Download size={14} /> Xuất Excel
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => window.print()}
              title="In danh sách thí sinh"
            >
              <Printer size={14} /> In
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '6px', lineHeight: 0 }}
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-subtle)'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '360px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-light)'
              }}
            />
            <input
              type="text"
              placeholder="Tìm theo SBD, Mã SV, Tên, Lớp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '32px', height: '34px', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {loading ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw
                size={24}
                className="animate-spin"
                style={{ color: 'var(--primary)', margin: '0 auto 8px' }}
              />
              <p style={{ fontSize: '0.85rem', margin: 0 }}>Đang tải danh sách thí sinh...</p>
            </div>
          ) : filteredRoster.length === 0 ? (
            <div
              style={{
                padding: '48px 0',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.88rem'
              }}
            >
              {search
                ? 'Không tìm thấy thí sinh phù hợp.'
                : 'Phòng thi chưa có thí sinh nào được xếp danh sách.'}
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>STT</th>
                  <th style={{ width: '130px' }}>Số Báo Danh</th>
                  <th style={{ width: '110px' }}>Mã SV</th>
                  <th>Họ và Tên</th>
                  <th style={{ width: '100px' }}>Ngày sinh</th>
                  <th style={{ width: '110px' }}>Lớp</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Trạng thái</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Ký nộp bài</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoster.map((r, idx) => (
                  <tr key={r.id || idx}>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: 'var(--primary)',
                          background: 'var(--primary-light)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.85rem'
                        }}
                      >
                        {r.sbd || `P01-${String(idx + 1).padStart(2, '0')}`}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.studentCode}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r.studentName}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {r.dateOfBirth || '—'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {r.className || '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {r.attendanceStatus === 'DISQUALIFIED' ? (
                        <span className="badge badge-danger">Cấm thi</span>
                      ) : (
                        <span className="badge badge-success">Đủ ĐK</span>
                      )}
                    </td>
                    <td
                      style={{
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem'
                      }}
                    >
                      ..................
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-subtle)',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)'
          }}
        >
          <div>
            Tổng số: <strong>{filteredRoster.length}</strong> / <strong>{roster.length}</strong> thí
            sinh
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [proctorSchedules, setProctorSchedules] = useState([]);
  const [selectedProctorRoom, setSelectedProctorRoom] = useState(null);

  const [todayVal] = useState(() => {
    const day = new Date().getDay();
    return day === 0 ? 8 : day + 1;
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const activeMonday = useMemo(() => getMonday(selectedDate), [selectedDate]);
  const activeWeekDays = useMemo(() => getWeekDays(activeMonday), [activeMonday]);
  const activeWeekMap = useMemo(() => {
    const map = {};
    activeWeekDays.forEach((w) => {
      map[w.dayOfWeek] = w;
    });
    return map;
  }, [activeWeekDays]);

  const loadData = async (semId) => {
    try {
      setLoading(true);
      const [secRes, schedRes, proctorRes] = await Promise.all([
        courseSectionService.getMySections(),
        scheduleService.getLecturerSchedule(semId ? { semesterId: semId } : {}),
        examService.getMyProctorSchedule(semId ? { semesterId: semId } : {}).catch(() => ({ data: { data: [] } })),
      ]);
      setSections(secRes.data?.data || []);
      setSchedules(schedRes.data?.data || []);
      setProctorSchedules(proctorRes.data?.data || []);
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

        const todayIso = new Date().toISOString().slice(0, 10);
        const currentSem = semList.find((s) => s.isCurrent && (!s.endDate || s.endDate >= todayIso))
          || semList.find((s) => s.startDate && s.endDate && todayIso >= s.startDate && todayIso <= s.endDate)
          || semList.find((s) => s.isCurrent)
          || semList[0];
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

  // Filter proctor schedules by search keyword
  const filteredProctorSchedules = useMemo(() => {
    if (!search.trim()) return proctorSchedules;
    const q = search.toLowerCase();
    return proctorSchedules.filter((p) =>
      p.subjectCode?.toLowerCase().includes(q) ||
      p.subjectName?.toLowerCase().includes(q) ||
      p.roomCode?.toLowerCase().includes(q) ||
      p.roomLocation?.toLowerCase().includes(q) ||
      p.sessionName?.toLowerCase().includes(q) ||
      p.proctor1Name?.toLowerCase().includes(q) ||
      p.proctor2Name?.toLowerCase().includes(q)
    );
  }, [proctorSchedules, search]);

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
      {viewMode === 'proctoring' ? (
        <div className="stats-grid" style={{ marginBottom: '20px' }}>
          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon--primary">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="stat-value">{proctorSchedules.length}</div>
              <div className="stat-label">Tổng ca coi thi phân công</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon--info">
              <Users size={24} />
            </div>
            <div>
              <div className="stat-value">
                {proctorSchedules.reduce((acc, cur) => acc + (cur.studentCount || 0), 0)}
              </div>
              <div className="stat-label">Tổng thí sinh phụ trách</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon--success">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="stat-value">
                {proctorSchedules.filter((p) => p.status === 'FINALIZED').length} / {proctorSchedules.length}
              </div>
              <div className="stat-label">Phòng thi hoàn tất điểm</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon--warning">
              <Clock size={24} />
            </div>
            <div>
              <div className="stat-value">
                {proctorSchedules.filter((p) => p.examDate === formatIsoDate(new Date())).length}
              </div>
              <div className="stat-label">Ca coi thi hôm nay</div>
            </div>
          </div>
        </div>
      ) : (
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
      )}

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
            placeholder={viewMode === 'proctoring' ? 'Tìm môn thi, số phòng, cán bộ...' : 'Tìm theo mã lớp, tên môn học, phòng...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '36px', height: '36px', fontSize: '0.85rem' }}
          />
        </div>

        {/* View Mode Buttons */}
        <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '3px', gap: '2px' }}>
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
          <button
            className={`btn btn-sm ${viewMode === 'proctoring' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setViewMode('proctoring')}
            style={{
              border: 'none',
              padding: '6px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck size={15} />
            <span>Lịch coi thi</span>
            {proctorSchedules.length > 0 && (
              <span
                style={{
                  backgroundColor: viewMode === 'proctoring' ? 'rgba(255,255,255,0.25)' : 'var(--primary)',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  lineHeight: 1.2
                }}
              >
                {proctorSchedules.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ================= PRIMARY VIEW: SECTIONS TABLE ================= */}
      {viewMode === 'sections' && (
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
      )}

      {/* ================= SECONDARY VIEW: WEEKLY GRID ================= */}
      {viewMode === 'grid' && (
        <div>
          {/* Week & Date Navigation Picker */}
          <WeekCalendarPicker
            selectedDate={selectedDate}
            onChangeDate={setSelectedDate}
            semesterStartDate={activeSemesterObj?.startDate}
          />

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
                {DAYS.map((d) => {
                  const dayObj = activeWeekMap[d.value];
                  const isToday = dayObj?.iso === formatIsoDate(new Date());
                  const isSelected = dayObj?.iso === formatIsoDate(selectedDate);
                  const dayClasses = schedules.filter((s) => {
                    if (s.dayOfWeek !== d.value) return false;
                    if (dayObj && s.startDate && s.endDate) {
                      if (s.startDate > dayObj.iso || s.endDate < dayObj.iso) return false;
                    }
                    return true;
                  });

                  return (
                    <div
                      key={d.value}
                      onClick={() => dayObj && setSelectedDate(dayObj.date)}
                      title={`Xem lịch ${d.label} (${dayObj?.fullDate || ''})`}
                      style={{
                        padding: '8px 4px',
                        borderRadius: 'var(--radius-md)',
                        background: isToday
                          ? 'var(--primary)'
                          : isSelected
                          ? 'var(--primary-light)'
                          : 'var(--bg-subtle)',
                        color: isToday
                          ? '#ffffff'
                          : isSelected
                          ? 'var(--primary)'
                          : 'var(--text-main)',
                        border: isToday
                          ? '2px solid var(--primary-hover)'
                          : isSelected
                          ? '2px solid var(--primary)'
                          : '1px solid var(--border-color)',
                        boxShadow: isToday ? 'var(--shadow-xs)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div>{d.label}</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, opacity: isToday ? 0.95 : 0.85, margin: '2px 0' }}>
                        {dayObj?.shortDate || ''}
                      </div>
                      <div style={{ fontSize: '0.7rem', opacity: isToday ? 0.9 : 0.75, fontWeight: 500 }}>
                        {isToday ? '★ Hôm nay' : `${dayClasses.length} ca dạy`}
                      </div>
                    </div>
                  );
                })}
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
                    const dayObj = activeWeekMap[d.value];
                    const isToday = dayObj?.iso === formatIsoDate(new Date());
                    const cellSchedules = schedules.filter(
                      (s) => {
                        if (s.dayOfWeek !== d.value) return false;
                        if (s.startPeriod > slot.end || s.endPeriod < slot.start) return false;
                        if (dayObj && s.startDate && s.endDate) {
                          if (s.startDate > dayObj.iso || s.endDate < dayObj.iso) return false;
                        }
                        return true;
                      }
                    );

                    return (
                      <div
                        key={d.value}
                        style={{
                          background: cellSchedules.length > 0
                            ? (isToday ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-surface)')
                            : 'var(--bg-subtle)',
                          border: cellSchedules.length > 1
                            ? '1.5px solid #ef4444'
                            : isToday
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
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}>
                            <AlertTriangle size={12} />
                            <span>Trùng ca ({cellSchedules.length} môn)</span>
                          </div>
                        )}
                        {cellSchedules.map((s) => {
                          const subj = s.courseSection?.subject;
                          const secCode = s.courseSection?.sectionCode;

                          return (
                            <div
                              key={s.id}
                              style={{
                                background: 'var(--bg-surface)',
                                border: cellSchedules.length > 1 ? '1px solid #fca5a5' : '1px solid var(--primary-border)',
                                borderLeft: cellSchedules.length > 1 ? '4px solid #ef4444' : '4px solid var(--primary)',
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
                                  Tiết {s.startPeriod}-{s.endPeriod} {PERIOD_END_TIMES[s.endPeriod] ? `(Tan: ${PERIOD_END_TIMES[s.endPeriod]})` : ''}
                                </span>
                              </div>

                              {/* Course End Info */}
                              {(() => {
                                const endInfo = getCourseEndInfo(s.endDate, selectedDate);
                                if (!endInfo) return null;
                                return (
                                  <div
                                    style={{
                                      marginTop: '4px',
                                      fontSize: '0.675rem',
                                      fontWeight: 600,
                                      color: endInfo.isCompleted ? '#059669' : '#b45309',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      gap: '4px',
                                    }}
                                  >
                                    <span>{endInfo.text}</span>
                                    <span className={`badge ${endInfo.isCompleted ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.625rem', padding: '1px 4px' }}>
                                      {endInfo.badge}
                                    </span>
                                  </div>
                                );
                              })()}

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', gap: '4px' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.725rem' }}>
                                  {secCode && <>LHP: <strong>{secCode}</strong></>}
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-xs"
                                  style={{
                                    fontSize: '0.7rem',
                                    padding: '2px 6px',
                                    lineHeight: 1.2,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    marginLeft: 'auto'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAttendanceModal(s.courseSection);
                                  }}
                                  title="Mở phiên điểm danh & tạo mã cho lớp học này"
                                >
                                  <CheckCircle2 size={11} />
                                  <span>Điểm danh</span>
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
        </div>
      )}

      {/* Student List Modal */}
      {selectedSectionModal && (
        <SectionStudentsModal
          courseSection={selectedSectionModal}
          onClose={() => setSelectedSectionModal(null)}
          onOpenAttendance={(sec) => {
            setSelectedSectionModal(null);
            setSelectedAttendanceModal(sec);
          }}
        />
      )}

      {/* Attendance Modal */}
      {selectedAttendanceModal && (
        <LecturerAttendanceModal
          courseSection={selectedAttendanceModal}
          onClose={() => setSelectedAttendanceModal(null)}
        />
      )}

      {/* ================= TERTIARY VIEW: PROCTORING SCHEDULE ================= */}
      {viewMode === 'proctoring' && (
        <div className="card">
          {/* Banner Quy chế coi thi */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(238, 77, 45, 0.05) 0%, rgba(249, 115, 22, 0.05) 100%)',
            borderBottom: '1px solid rgba(238, 77, 45, 0.15)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(238, 77, 45, 0.12)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '2px'
            }}>
              <ShieldCheck size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Quy chế & Nhiệm vụ Cán bộ coi thi (CBCT)
              </h4>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Cán bộ coi thi có mặt tại Phòng Khảo thí trước giờ phát đề thi ít nhất <strong>20 phút</strong> để nhận túi đề thi và bảng danh sách phòng thi. Đối chiếu thẻ sinh viên/CCCD trước khi cho thí sinh vào phòng. Thu bài, đếm đủ số bài và số tờ thi, niêm phong túi bài thi và bàn giao cho Ban Khảo thí ngay sau ca thi.
              </p>
            </div>
          </div>

          {/* Table Ca Coi Thi */}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '135px' }}>Ngày thi</th>
                  <th style={{ width: '130px' }}>Khung giờ</th>
                  <th>Học phần & Ca thi</th>
                  <th style={{ width: '120px' }}>Hình thức</th>
                  <th style={{ width: '180px' }}>Phòng & Địa điểm</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Sĩ số</th>
                  <th style={{ width: '230px' }}>Cán bộ coi thi</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Trạng thái</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableRowSkeleton columns={9} />
                ) : filteredProctorSchedules.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                      {search ? 'Không tìm thấy ca coi thi phù hợp với từ khóa tìm kiếm.' : 'Giảng viên chưa có lịch phân công coi thi trong học kỳ này.'}
                    </td>
                  </tr>
                ) : (
                  filteredProctorSchedules.map((room) => {
                    const isToday = room.examDate === formatIsoDate(new Date());
                    const isThesis = room.roomCode?.startsWith('HĐ') || (room.startTime === '08:00' && room.endTime === '17:00');
                    return (
                      <tr key={room.id} style={isToday ? { backgroundColor: 'var(--primary-light)' } : {}}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                            {room.examDate ? formatViDate(new Date(room.examDate + 'T00:00:00')) : '—'}
                          </div>
                          {isToday && (
                            <span className="badge badge-warning" style={{ fontSize: '0.675rem', marginTop: '2px' }}>
                              Hôm nay
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            color: 'var(--primary)',
                            background: 'var(--bg-subtle)',
                            padding: '3px 8px',
                            borderRadius: '4px'
                          }}>
                            <Clock size={12} />
                            {room.startTime} - {room.endTime}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {room.subjectName}
                          </div>
                          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Mã HP: <strong>{room.subjectCode}</strong> • {room.sessionName}
                          </div>
                        </td>
                        <td>
                          {isThesis ? (
                            <span className="badge badge-purple" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                              Bảo vệ Hội đồng
                            </span>
                          ) : (
                            <span className="badge badge-info" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                              Thi tập trung
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            Phòng {room.roomCode}
                          </div>
                          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                            {room.roomLocation || 'Giảng đường'}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-outline" style={{ fontWeight: 700 }}>
                            {room.studentCount || 0} SV
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                            <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                              CB1: {room.proctor1Name || 'Chưa phân công'}
                            </div>
                            <div style={{ color: 'var(--text-secondary)' }}>
                              CB2: {room.proctor2Name || 'Chưa phân công'}
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {room.status === 'FINALIZED' ? (
                            <span className="badge badge-success">Đã hoàn thành</span>
                          ) : room.status === 'IN_PROGRESS' ? (
                            <span className="badge badge-warning">Đang diễn ra</span>
                          ) : (
                            <span className="badge badge-primary">Sắp diễn ra</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => setSelectedProctorRoom(room)}
                            title="Xem danh sách thí sinh phòng thi"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Users size={12} />
                            <span>DS Thí sinh</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Proctor Roster Modal */}
      {selectedProctorRoom && (
        <ProctorRosterModal
          room={selectedProctorRoom}
          onClose={() => setSelectedProctorRoom(null)}
        />
      )}
    </div>
  );
}
