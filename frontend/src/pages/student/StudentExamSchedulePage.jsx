import { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays, Clock, MapPin, AlertTriangle, CheckCircle2,
  FileSpreadsheet, Download, Printer, RefreshCw, School,
  Grid, List, AlertCircle, Search, ShieldAlert, Award, User, BookOpen
} from 'lucide-react';
import { toast } from 'react-toastify';
import { examService, semesterService } from '../../services/dataService';
import useAuthStore from '../../store/authStore';

export default function StudentExamSchedulePage() {
  const { user } = useAuthStore();
  const [examSchedules, setExamSchedules] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'scheduled' | 'pending' | 'disqualified'
  const [searchQuery, setSearchQuery] = useState('');

  const loadExamSchedule = async (semId) => {
    try {
      setLoading(true);
      const params = semId ? { semesterId: semId } : {};
      const res = await examService.getMyExamSchedule(params);
      setExamSchedules(res.data?.data || []);
    } catch {
      toast.error('Lỗi khi tải lịch thi sinh viên');
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

        if (defaultSemId) {
          await loadExamSchedule(defaultSemId);
        }
      } catch {
        toast.error('Lỗi khi khởi tạo danh mục học kỳ');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  const handleSemesterChange = (newSemId) => {
    setSelectedSemesterId(newSemId);
    loadExamSchedule(newSemId);
  };

  const activeSemesterObj = useMemo(() => {
    return semesters.find((s) => String(s.id) === String(selectedSemesterId));
  }, [semesters, selectedSemesterId]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = examSchedules.length;
    const scheduled = examSchedules.filter((s) => s.hasExamSchedule && !s.disqualified).length;
    const pending = examSchedules.filter((s) => !s.hasExamSchedule && !s.disqualified).length;
    const disqualified = examSchedules.filter((s) => s.disqualified).length;
    return { total, scheduled, pending, disqualified };
  }, [examSchedules]);

  // Phát hiện ca thi trùng thời gian (Exam collision detection)
  const conflictingExamIds = useMemo(() => {
    const conflictSet = new Set();
    const scheduled = examSchedules.filter(
      (s) => s.hasExamSchedule && !s.disqualified && s.examDate && s.startTime && s.endTime
    );
    for (let i = 0; i < scheduled.length; i++) {
      for (let j = i + 1; j < scheduled.length; j++) {
        const a = scheduled[i];
        const b = scheduled[j];
        if (a.examDate === b.examDate) {
          const aStart = a.startTime.length >= 5 ? a.startTime.substring(0, 5) : a.startTime;
          const aEnd = a.endTime.length >= 5 ? a.endTime.substring(0, 5) : a.endTime;
          const bStart = b.startTime.length >= 5 ? b.startTime.substring(0, 5) : b.startTime;
          const bEnd = b.endTime.length >= 5 ? b.endTime.substring(0, 5) : b.endTime;
          if (aStart < bEnd && aEnd > bStart) {
            conflictSet.add(a.enrollmentId);
            conflictSet.add(b.enrollmentId);
          }
        }
      }
    }
    return conflictSet;
  }, [examSchedules]);

  const removeAccents = (str) =>
    str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase() : "";

  // Bộ lọc danh sách
  const filteredSchedules = useMemo(() => {
    return examSchedules.filter((item) => {
      // Lọc theo trạng thái
      if (statusFilter === 'scheduled' && (!item.hasExamSchedule || item.disqualified)) return false;
      if (statusFilter === 'pending' && (item.hasExamSchedule || item.disqualified)) return false;
      if (statusFilter === 'disqualified' && !item.disqualified) return false;

      // Tìm kiếm theo tên hoặc mã môn
      if (searchQuery.trim()) {
        const q = removeAccents(searchQuery.trim());
        const subCode = removeAccents(item.subjectCode);
        const subName = removeAccents(item.subjectName);
        const sbd = removeAccents(item.sbd);
        const room = removeAccents(item.roomCode);
        return subCode.includes(q) || subName.includes(q) || sbd.includes(q) || room.includes(q);
      }
      return true;
    });
  }, [examSchedules, statusFilter, searchQuery]);

  // Xuất file iCalendar (.ics)
  const handleExportIcs = async () => {
    try {
      toast.info('Đang chuẩn bị file đồng bộ iCalendar...');
      const res = await examService.exportMyExamIcs({ semesterId: selectedSemesterId || undefined });
      const blob = new Blob([res.data], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LichThi_${activeSemesterObj ? activeSemesterObj.semesterName.replace(/\s+/g, '_') : 'HocKy'}.ics`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Đã tải tệp .ics! Nhấp đúp để đồng bộ vào Google Calendar / Outlook.');
    } catch {
      toast.error('Không thể xuất file iCalendar');
    }
  };

  // Xuất file Excel bảng lịch thi
  const handleExportExcel = () => {
    try {
      if (!examSchedules || examSchedules.length === 0) {
        toast.warning('Không có dữ liệu lịch thi để xuất Excel');
        return;
      }

      toast.info('Đang xuất bảng lịch thi ra Excel...');
      const semName = activeSemesterObj ? activeSemesterObj.semesterName : 'Học kỳ';
      const studentName = user?.fullName || 'Sinh viên';
      const studentCode = user?.username || '';

      let tableHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>LichThi</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
          <style>
            th { background-color: #2563eb; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; text-align: center; }
            td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 13px; vertical-align: middle; }
            .title { font-size: 18px; font-weight: bold; color: #1e3a8a; text-align: center; }
            .info { font-size: 13px; color: #334155; }
            .disqualified { color: #dc2626; font-weight: bold; background-color: #fee2e2; }
            .scheduled { color: #16a34a; font-weight: bold; }
            .pending { color: #d97706; font-style: italic; }
          </style>
        </head>
        <body>
          <table>
            <tr><td colspan="8" class="title">TRƯỜNG ĐẠI HỌC PHENIKAA - CỔNG THÔNG TIN SINH VIÊN</td></tr>
            <tr><td colspan="8" class="title">LỊCH DỰ THI KẾT THÚC HỌC PHẦN - ${semName.toUpperCase()}</td></tr>
            <tr><td colspan="8" class="info">Họ và tên: <b>${studentName}</b> | Mã sinh viên: <b>${studentCode}</b> | Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}</td></tr>
            <tr><td colspan="8"></td></tr>
            <tr>
              <th>STT</th>
              <th>Mã môn</th>
              <th>Tên học phần</th>
              <th>Số TC</th>
              <th>Ngày thi</th>
              <th>Giờ thi</th>
              <th>Phòng thi / Địa điểm</th>
              <th>Số báo danh (SBD)</th>
              <th>Trạng thái điều kiện thi</th>
            </tr>
      `;

      examSchedules.forEach((item, idx) => {
        const statusClass = item.disqualified ? 'disqualified' : item.hasExamSchedule ? 'scheduled' : 'pending';
        const statusText = item.disqualified
          ? 'Bị cấm thi (vắng >20%)'
          : item.hasExamSchedule
          ? 'Đủ điều kiện dự thi'
          : 'Chờ xếp lịch thi';

        const examDateStr = item.examDate ? new Date(item.examDate).toLocaleDateString('vi-VN') : '---';
        const timeStr = item.startTime && item.endTime ? `${cleanTime(item.startTime)} - ${cleanTime(item.endTime)}` : (cleanTime(item.startTime) || '---');
        const roomStr = item.roomCode ? `${item.roomCode}${item.roomLocation ? ` (${item.roomLocation})` : ''}` : 'Chưa có phòng';

        tableHtml += `
          <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td style="text-align: center; font-weight: bold;">${item.subjectCode || ''}</td>
            <td>${item.subjectName || ''}</td>
            <td style="text-align: center;">${item.credits || ''}</td>
            <td style="text-align: center;">${examDateStr}</td>
            <td style="text-align: center;">${timeStr}</td>
            <td>${roomStr}</td>
            <td style="text-align: center; font-weight: bold;">${item.sbdShort || item.sbd || '---'}</td>
            <td class="${statusClass}">${statusText}</td>
          </tr>
        `;
      });

      tableHtml += `
          </table>
        </body>
        </html>
      `;

      const blob = new Blob(['\uFEFF' + tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LichThi_${studentCode}_${semName.replace(/\s+/g, '_')}.xls`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Xuất file Excel lịch thi thành công!');
    } catch {
      toast.error('Không thể xuất file Excel lịch thi');
    }
  };

  const cleanTime = (t) => {
    if (!t) return '--:--';
    return t.length >= 5 ? t.substring(0, 5) : t;
  };

  const formatExamDate = (dateStr) => {
    if (!dateStr) return 'Đang cập nhật';
    try {
      const d = new Date(dateStr);
      const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dow = dayNames[d.getDay()];
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${dow}, ${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="student-exam-schedule-page">
      {/* Printable Official Header (Only shows when printing) */}
      <div className="print-only" style={{ display: 'none', marginBottom: '24px' }}>
        <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '16px' }}>
          <h2 style={{ fontSize: '18pt', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>
            Trường Đại học Phenikaa
          </h2>
          <h3 style={{ fontSize: '15pt', fontWeight: 700, margin: '8px 0', color: '#1e40af' }}>
            LỊCH DỰ THI KẾT THÚC HỌC PHẦN
          </h3>
          <p style={{ margin: '4px 0', fontSize: '11pt', fontStyle: 'italic' }}>
            {activeSemesterObj?.semesterName || 'Học kỳ'}
          </p>
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-around', fontSize: '11pt' }}>
            <span>Họ và tên: <b>{user?.fullName || 'Sinh viên'}</b></span>
            <span>Mã sinh viên: <b>{user?.username || ''}</b></span>
            <span>Ngày in: {new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>

      {/* Main Page Header */}
      <div className="page-header no-print">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays className="text-primary" size={26} />
            Lịch Thi & Lịch Đánh Giá Học Kỳ
          </h1>
          <p>
            {activeSemesterObj
              ? `Lịch thi chính thức ${activeSemesterObj.semesterName}${activeSemesterObj.isCurrent ? ' (Học kỳ hiện tại)' : ''}`
              : 'Tra cứu phòng thi, số báo danh và điều kiện dự thi từng học phần'}
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
            onClick={handleExportExcel}
            title="Xuất bảng lịch thi ra file Excel"
          >
            <FileSpreadsheet size={16} /> Xuất Excel
          </button>
          <button
            className="btn btn-outline"
            onClick={handleExportIcs}
            title="Đồng bộ lịch thi vào Google Calendar (.ics)"
          >
            <Download size={16} /> Đồng bộ Cal (.ics)
          </button>
          <button
            className="btn btn-outline"
            onClick={() => window.print()}
            title="In thẻ / Lịch dự thi (A4)"
          >
            <Printer size={16} /> In Lịch Thi
          </button>
          <button
            className="btn btn-outline"
            onClick={() => loadExamSchedule(selectedSemesterId)}
            title="Tải lại dữ liệu"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Tải lại
          </button>
        </div>
      </div>

      {/* Quick Summary Cards (KPIs) */}
      <div className="stats-grid no-print" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon--info">
            <CalendarDays size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Học phần trong kỳ</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon--success">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-value" style={{ color: '#16a34a' }}>{stats.scheduled}</div>
            <div className="stat-label">Đã có lịch thi chính thức</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon--warning">
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-value" style={{ color: '#d97706' }}>{stats.pending}</div>
            <div className="stat-label">Chờ xếp phòng & SBD</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon--danger">
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="stat-value" style={{ color: stats.disqualified > 0 ? '#dc2626' : 'var(--text-muted)' }}>
              {stats.disqualified}
            </div>
            <div className="stat-label">Bị cấm thi (vắng &gt;20%)</div>
          </div>
        </div>
      </div>

      {/* Regulation Reminder Notice */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.06), rgba(59, 130, 246, 0.03))',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          marginBottom: '20px'
        }}
      >
        <AlertCircle size={22} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.88rem', lineHeight: '1.5', color: 'var(--text-main)' }}>
          <b style={{ color: 'var(--primary)', textTransform: 'uppercase' }}>Lưu ý quy chế thi: </b>
          Sinh viên phải mang theo <b>Thẻ sinh viên</b> hoặc <b>CCCD/CMND</b> còn hiệu lực khi vào phòng thi.
          Có mặt tại phòng thi trước giờ bắt đầu ít nhất <b>15 phút</b>.
          Sinh viên có tỷ lệ nghỉ học vượt quá <b>20% tổng số tiết</b> sẽ bị đình chỉ tư cách dự thi theo quy định đào tạo.
        </div>
      </div>

      {/* Exam Collision Warning Banner */}
      {conflictingExamIds.size > 0 && (
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '2px solid #ef4444',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            marginBottom: '20px',
            color: '#991b1b',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={24} style={{ color: '#dc2626', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#b91c1c' }}>
                ⚠️ CẢNH BÁO XUNG ĐỘT: PHÁT HIỆN TRÙNG CA THI!
              </div>
              <div style={{ fontSize: '0.85rem', color: '#7f1d1d', marginTop: '2px' }}>
                Bạn có các môn thi bị xếp trùng khớp 100% về khung thời gian. Vui lòng liên hệ Phòng Khảo thí (P.102 Nhà A) để được bố trí ca thi dự phòng.
              </div>
            </div>
          </div>
          <span className="badge badge-danger" style={{ fontWeight: 700, padding: '6px 12px', fontSize: '0.8rem' }}>
            {conflictingExamIds.size} MÔN TRÙNG GIỜ THI
          </span>
        </div>
      )}

      {/* Filter and View Mode Toolbar */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'var(--bg-surface)',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          marginBottom: '20px'
        }}
      >
        {/* Status Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Lọc:</span>
          <button
            className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStatusFilter('all')}
          >
            Tất cả ({examSchedules.length})
          </button>
          <button
            className={`btn btn-sm ${statusFilter === 'scheduled' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStatusFilter('scheduled')}
          >
            Đã có lịch ({stats.scheduled})
          </button>
          <button
            className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStatusFilter('pending')}
          >
            Chờ xếp ca ({stats.pending})
          </button>
          {stats.disqualified > 0 && (
            <button
              className={`btn btn-sm ${statusFilter === 'disqualified' ? 'btn-danger' : 'btn-outline'}`}
              onClick={() => setStatusFilter('disqualified')}
              style={{ color: statusFilter === 'disqualified' ? '#fff' : '#dc2626' }}
            >
              Cấm thi ({stats.disqualified})
            </button>
          )}
        </div>

        {/* Search & View Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-input, #fff)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 10px',
            minWidth: '220px'
          }}>
            <Search size={15} style={{ color: 'var(--text-muted)', marginRight: '6px' }} />
            <input
              id="student-exam-search"
              name="examSearch"
              aria-label="Tìm môn, SBD, phòng thi"
              type="text"
              placeholder="Tìm môn, SBD, phòng thi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.85rem',
                width: '100%',
                color: 'var(--text-main)'
              }}
            />
          </div>

          <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 10px',
                border: 'none',
                background: viewMode === 'grid' ? 'var(--primary)' : 'var(--bg-surface)',
                color: viewMode === 'grid' ? '#fff' : 'var(--text-main)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
              title="Xem dạng lưới thẻ"
            >
              <Grid size={15} /> Thẻ
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 10px',
                border: 'none',
                background: viewMode === 'table' ? 'var(--primary)' : 'var(--bg-surface)',
                color: viewMode === 'table' ? '#fff' : 'var(--text-main)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
              title="Xem dạng bảng"
            >
              <List size={15} /> Bảng
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={36} className="spin" style={{ margin: '0 auto 12px auto', color: 'var(--primary)' }} />
          <div>Đang tải thông tin lịch thi...</div>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-muted)'
        }}>
          <CalendarDays size={48} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
            Không tìm thấy học phần hoặc lịch thi phù hợp
          </h3>
          <p style={{ fontSize: '0.9rem' }}>
            {searchQuery
              ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc trạng thái.'
              : 'Chưa có dữ liệu đăng ký môn học hoặc Phòng Khảo thí chưa công bố lịch thi cho học kỳ này.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (CARDS) */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '20px'
        }}>
          {filteredSchedules.map((item) => {
            const isDisq = item.disqualified;
            const hasSchedule = item.hasExamSchedule && !isDisq;

            return (
              <div
                key={item.enrollmentId}
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: isDisq
                    ? '1.5px solid #f87171'
                    : hasSchedule
                    ? '1.5px solid var(--primary-border)'
                    : '1.5px dashed #fbbf24',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Card Header */}
                <div style={{
                  padding: '16px 18px',
                  background: isDisq
                    ? 'rgba(239, 68, 68, 0.08)'
                    : hasSchedule
                    ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(59, 130, 246, 0.03))'
                    : 'rgba(245, 158, 11, 0.08)',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        color: 'var(--primary)',
                        background: 'rgba(37, 99, 235, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {item.subjectCode}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {item.credits} tín chỉ • Lớp: {item.sectionCode}
                      </span>
                    </div>
                    <h3 style={{
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      margin: 0,
                      lineHeight: 1.3
                    }}>
                      {item.subjectName}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    {conflictingExamIds.has(item.enrollmentId) && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: '#dc2626',
                        color: '#fff'
                      }}>
                        <AlertTriangle size={12} /> TRÙNG LỊCH THI
                      </span>
                    )}
                    {isDisq ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: '#fee2e2',
                        color: '#b91c1c'
                      }}>
                        <ShieldAlert size={14} /> CẤM THI
                      </span>
                    ) : hasSchedule ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: '#dcfce7',
                        color: '#15803d'
                      }}>
                        <CheckCircle2 size={14} /> ĐỦ ĐIỀU KIỆN
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: '#fef3c7',
                        color: '#b45309'
                      }}>
                        <Clock size={14} /> CHỜ XẾP LỊCH
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {isDisq ? (
                    <div style={{
                      background: '#fff1f2',
                      border: '1px solid #fecdd3',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      color: '#9f1239',
                      fontSize: '0.85rem'
                    }}>
                      <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={16} /> Đình chỉ tư cách thi
                      </div>
                      <div>{item.disqualifiedReason || 'Sinh viên vắng quá 20% tổng số tiết của môn học.'}</div>
                      <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#be123c' }}>
                        Vắng: <b>{item.absentPeriods || 0} tiết</b> ({Math.round((item.absentRate || 0) * 100)}% tổng thời lượng)
                      </div>
                    </div>
                  ) : hasSchedule ? (
                    <>
                      {/* Examination Key Info */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px',
                        background: 'var(--bg-card-secondary, rgba(0,0,0,0.02))',
                        padding: '12px',
                        borderRadius: 'var(--radius-md)'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                            Số Báo Danh (SBD)
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.5px' }}>
                              {item.sbdShort || item.sbd || '---'}
                            </span>
                            {item.seatNumber && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                (Ghế {item.seatNumber})
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                            Phòng Thi
                          </div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            {item.roomCode || '---'}
                          </div>
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                          <CalendarDays size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          <span>
                            Ngày thi: <b>{formatExamDate(item.examDate)}</b>
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                          <Clock size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          <span>
                            Khung giờ: <b style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>{cleanTime(item.startTime)} - {cleanTime(item.endTime)}</b>
                            {item.durationMinutes && <span style={{ marginLeft: '8px', background: 'rgba(37, 99, 235, 0.08)', color: 'var(--primary)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{item.durationMinutes}</span>}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-main)' }}>
                          <MapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                          <span>
                            Địa điểm: <b>{item.roomLocation || 'Giảng đường Phenikaa'}</b>
                          </span>
                        </div>

                        {item.examType && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                            <BookOpen size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                            <span>Hình thức: <b style={{ color: 'var(--text-main)' }}>{item.examType}</b></span>
                          </div>
                        )}

                        {(item.proctor1Name || item.proctor2Name) && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.82rem', background: 'var(--bg-card-secondary, rgba(0,0,0,0.02))', padding: '6px 10px', borderRadius: '6px' }}>
                            <User size={15} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                            <span>
                              {item.examType?.includes('Hội đồng') ? 'Hội đồng chấm:' : 'Cán bộ coi thi:'}{' '}
                              <b>{item.proctor1Name}</b>
                              {item.proctor2Name && <span> • <b>{item.proctor2Name}</b></span>}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div style={{
                      background: '#fffbeb',
                      border: '1px solid #fef3c7',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                      color: '#92400e',
                      fontSize: '0.88rem',
                      lineHeight: '1.5'
                    }}>
                      <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={16} /> Đang cập nhật lịch thi
                      </div>
                      <p style={{ margin: 0, fontSize: '0.84rem' }}>
                        Học phần đã hoàn thành giảng dạy. Phòng Khảo thí đang phân ca thi, xếp phòng thi và cấp Số báo danh chính thức.
                      </p>
                      {item.examDate && (
                        <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#b45309' }}>
                          Ca thi dự kiến: <b>{formatExamDate(item.examDate)}</b> ({item.startTime} - {item.endTime})
                        </div>
                      )}
                    </div>
                  )}

                  {/* Attendance Footer */}
                  <div style={{
                    marginTop: 'auto',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)'
                  }}>
                    <span>
                      Chuyên cần: {item.absenceCount || 0} buổi vắng ({item.absentPeriods || 0} tiết - {Math.round((item.absentRate || 0) * 100)}%)
                    </span>
                    {item.score != null && (
                      <span style={{ fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Award size={14} /> Điểm thi: {item.score}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="table-responsive" style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card-secondary, rgba(0,0,0,0.02))', borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '12px 14px', textAlign: 'center', width: '50px' }}>STT</th>
                <th style={{ padding: '12px 14px', textAlign: 'left' }}>Học phần</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', width: '70px' }}>Số TC</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Ngày thi</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Khung giờ</th>
                <th style={{ padding: '12px 14px', textAlign: 'left' }}>Phòng & Địa điểm</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', width: '120px' }}>Số Báo Danh</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map((item, idx) => {
                const isDisq = item.disqualified;
                const hasSchedule = item.hasExamSchedule && !isDisq;

                return (
                  <tr
                    key={item.enrollmentId}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      background: isDisq ? 'rgba(239, 68, 68, 0.03)' : undefined
                    }}
                  >
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {idx + 1}
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {item.subjectName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                        <span>Mã: <b>{item.subjectCode}</b></span>
                        <span>• Lớp: {item.sectionCode}</span>
                      </div>
                    </td>

                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600 }}>
                      {item.credits}
                    </td>

                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: hasSchedule ? 'var(--text-main)' : 'var(--text-muted)' }}>
                      {hasSchedule ? formatExamDate(item.examDate) : (isDisq ? '---' : 'Chờ xếp ca')}
                    </td>

                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: hasSchedule ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {hasSchedule ? `${cleanTime(item.startTime)} - ${cleanTime(item.endTime)}` : '---'}
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      {hasSchedule ? (
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.roomCode}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.roomLocation || 'Cơ sở chính'}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                          {isDisq ? 'Đã hủy phòng thi' : 'Đang phân phòng'}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {hasSchedule ? (
                        <span style={{
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          color: 'var(--primary)',
                          background: 'rgba(37, 99, 235, 0.08)',
                          padding: '3px 8px',
                          borderRadius: '4px'
                        }}>
                          {item.sbdShort || item.sbd}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>---</span>
                      )}
                    </td>

                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        {conflictingExamIds.has(item.enrollmentId) && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background: '#dc2626',
                            color: '#fff'
                          }}>
                            <AlertTriangle size={11} /> TRÙNG LỊCH
                          </span>
                        )}
                        {isDisq ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: '#fee2e2',
                          color: '#b91c1c'
                        }}>
                          Cấm thi ({Math.round((item.absentRate || 0) * 100)}% vắng)
                        </span>
                      ) : hasSchedule ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: '#dcfce7',
                          color: '#15803d'
                        }}>
                          Đủ ĐK thi
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: '#fef3c7',
                          color: '#b45309'
                        }}>
                          Chờ xếp lịch
                        </span>
                      )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Print Signature Footer (Only for Print Mode) */}
      <div className="print-only" style={{ display: 'none', marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 40px', fontSize: '11pt' }}>
          <div style={{ textAlign: 'center' }}>
            <div><b>SINH VIÊN DỰ THI</b></div>
            <div style={{ fontStyle: 'italic', fontSize: '9pt' }}>(Ký và ghi rõ họ tên)</div>
            <div style={{ height: '60px' }}></div>
            <div>{user?.fullName || ''}</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div><b>PHÒNG KHẢO THÍ & ĐBCL</b></div>
            <div style={{ fontStyle: 'italic', fontSize: '9pt' }}>(Xác nhận danh sách)</div>
            <div style={{ height: '60px' }}></div>
            <div>Cán bộ khảo thí</div>
          </div>
        </div>
      </div>
    </div>
  );
}
