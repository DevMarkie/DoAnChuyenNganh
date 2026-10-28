import { useState, useEffect } from 'react';
import { X, Search, Download, Printer, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { enrollmentService } from '../../services/dataService';
import { exportToCsv } from '../../utils/export';

export default function SectionStudentsModal({ courseSection, onClose }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [downloading, setDownloading] = useState(false);

  const sectionId = courseSection?.id;

  useEffect(() => {
    if (!sectionId) return;
    let isMounted = true;
    const loadStudents = async () => {
      try {
        setLoading(true);
        const res = await enrollmentService.getBySection(sectionId);
        if (isMounted) {
          setStudents(res.data?.data || []);
        }
      } catch {
        if (isMounted) toast.error('Không thể tải danh sách sinh viên lớp học phần');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadStudents();
    return () => { isMounted = false; };
  }, [sectionId]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filtered = students.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const st = e.student;
    return (
      st?.studentCode?.toLowerCase().includes(q) ||
      st?.fullName?.toLowerCase().includes(q) ||
      st?.classEntity?.name?.toLowerCase().includes(q) ||
      st?.email?.toLowerCase().includes(q)
    );
  });

  const handleExportExcel = async () => {
    try {
      setDownloading(true);
      const res = await courseSectionService.exportStudents(sectionId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DanhSachSV_${courseSection?.sectionCode || sectionId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Đã tải danh sách sinh viên Excel thành công!');
    } catch {
      // Ponytail fallback: if backend fails or network drops, export client-side CSV immediately
      try {
        const headers = ['STT', 'Mã Sinh Viên', 'Họ và Tên', 'Ngày Sinh', 'Giới Tính', 'Lớp Sinh Hoạt', 'Email'];
        exportToCsv(
          `DanhSachSV_${courseSection?.sectionCode || sectionId}.csv`,
          headers,
          students,
          (e, idx) => [
            idx + 1,
            e.student?.studentCode || '',
            e.student?.fullName || '',
            e.student?.dateOfBirth || '',
            e.student?.gender === 'MALE' ? 'Nam' : e.student?.gender === 'FEMALE' ? 'Nữ' : 'Khác',
            e.student?.classEntity?.name || '',
            e.student?.email || ''
          ]
        );
        toast.info('Đã tải danh sách sinh viên (file CSV) thành công!');
      } catch {
        toast.error('Lỗi khi xuất danh sách sinh viên');
      }
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDob = (dobStr) => {
    if (!dobStr) return '—';
    try {
      const parts = dobStr.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return dobStr;
    } catch {
      return dobStr;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border, #e5e7eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backgroundColor: 'var(--bg-subtle, #f9fafb)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  display: 'inline-block',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: 'var(--primary, #2563eb)',
                  backgroundColor: 'var(--primary-light, #eff6ff)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--primary-border, #bfdbfe)'
                }}
              >
                {courseSection?.sectionCode}
              </span>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main, #111827)' }}>
                {courseSection?.subject?.subjectName}
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary, #4b5563)' }}>
              {courseSection?.semester?.semesterName} • {courseSection?.subject?.credits || 0} Tín chỉ • Lịch: {courseSection?.schedule || '—'} ({courseSection?.room || '—'})
            </p>
          </div>

          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '6px', borderRadius: '50%', color: 'var(--text-muted)' }}
            title="Đóng (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div
          style={{
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            borderBottom: '1px solid var(--border, #e5e7eb)'
          }}
        >
          {/* Search box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '400px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-light, #9ca3af)'
              }}
            />
            <input
              type="text"
              placeholder="Tìm theo mã SV, họ tên, lớp SH..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.88rem' }}
              autoFocus
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #6b7280)', marginRight: '6px' }}>
              Sĩ số: <strong>{filtered.length}</strong> / {students.length} SV
            </span>

            <button
              onClick={handleExportExcel}
              disabled={downloading || students.length === 0}
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '38px' }}
              title="Xuất danh sách ra file Excel (.xlsx)"
            >
              <Download size={15} />
              <span>{downloading ? 'Đang xuất...' : 'Xuất Excel'}</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={students.length === 0}
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '38px' }}
              title="In / Lưu thành file PDF"
            >
              <Printer size={15} />
              <span>In / Lưu PDF</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: 0 }} className="table-container">
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-surface, #ffffff)' }}>
              <tr>
                <th style={{ width: '50px', textAlign: 'center' }}>STT</th>
                <th style={{ width: '120px' }}>Mã SV</th>
                <th>Họ và tên</th>
                <th style={{ width: '110px', textAlign: 'center' }}>Ngày sinh</th>
                <th style={{ width: '90px', textAlign: 'center' }}>Giới tính</th>
                <th>Lớp SH</th>
                <th>Email trường</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    Đang tải danh sách sinh viên...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    {search ? 'Không tìm thấy sinh viên nào khớp với từ khóa tìm kiếm.' : 'Lớp học phần này chưa có sinh viên nào đăng ký.'}
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const s = item.student;
                  return (
                    <tr key={item.id || idx}>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-main)' }}>
                          {s?.studentCode}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {s?.fullName}
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {formatDob(s?.dateOfBirth)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${s?.gender === 'FEMALE' ? 'badge-info' : 'badge-neutral'}`}>
                          {s?.gender === 'MALE' ? 'Nam' : s?.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {s?.classEntity?.name || '—'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {s?.email || '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} />
                          <span>Học chính thức</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--border, #e5e7eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-subtle, #f9fafb)',
            fontSize: '0.82rem',
            color: 'var(--text-muted)'
          }}
        >
          <span>Lớp: {courseSection?.sectionCode} • Giảng viên: {courseSection?.lecturer?.fullName || '—'}</span>
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
