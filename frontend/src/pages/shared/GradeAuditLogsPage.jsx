import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Search, Filter, RotateCcw, ChevronLeft, ChevronRight,
  ArrowRight, Clock, User, Laptop, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { gradeService } from '../../services/dataService';

export default function GradeAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentCode, setStudentCode] = useState('');
  const [component, setComponent] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 15;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: pageSize,
      };
      if (studentCode.trim()) params.studentCode = studentCode.trim();
      if (component) params.component = component;
      if (startDate) params.startDate = `${startDate}T00:00:00`;
      if (endDate) params.endDate = `${endDate}T23:59:59`;

      const res = await gradeService.searchAdminAuditLogs(params);
      const data = res.data?.data;
      if (data) {
        setLogs(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err) {
      console.error('Failed to fetch grade audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, studentCode, component, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchLogs();
  };

  const handleReset = () => {
    setStudentCode('');
    setComponent('');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  const formatDateTime = (dt) => {
    if (!dt) return '—';
    try {
      const d = new Date(dt);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch {
      return dt;
    }
  };

  const getComponentBadge = (comp) => {
    switch (comp) {
      case 'CC1':
        return <span className="badge badge-primary">CC1 (Chuyên cần)</span>;
      case 'CC2':
        return <span className="badge badge-purple">CC2 (Bài tập)</span>;
      case 'MIDTERM':
        return <span className="badge badge-warning">Giữa kỳ</span>;
      case 'FINAL':
        return <span className="badge badge-danger">Cuối kỳ (Khảo thí)</span>;
      default:
        return <span className="badge badge-secondary">{comp}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Nhật ký Kiểm toán Sửa điểm (Grade Audit Trail)
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              Quy chuẩn kiểm toán BR-Grade09: Giám sát toàn vẹn mọi lịch sử sửa đổi điểm số của sinh viên
            </p>
          </div>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '10px',
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border-color)',
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--text-secondary)',
        }}>
          <CheckCircle2 size={16} color="#10b981" />
          <span>Tổng số bản ghi kiểm toán: <strong style={{ color: 'var(--primary)' }}>{totalElements}</strong></span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '20px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {/* MSSV */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Mã sinh viên (MSSV)
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input
                  type="text"
                  placeholder="Nhập MSSV..."
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '36px', height: '40px' }}
                />
              </div>
            </div>

            {/* Thành phần điểm */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Đầu điểm
              </label>
              <select
                value={component}
                onChange={(e) => setComponent(e.target.value)}
                className="form-select"
                style={{ height: '40px' }}
              >
                <option value="">Tất cả đầu điểm</option>
                <option value="CC1">CC1 (Chuyên cần)</option>
                <option value="CC2">CC2 (Bài tập/Phát biểu)</option>
                <option value="MIDTERM">Giữa kỳ</option>
                <option value="FINAL">Cuối kỳ (Khảo thí)</option>
              </select>
            </div>

            {/* Từ ngày */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Từ ngày
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-control"
                style={{ height: '40px' }}
              >
              </input>
            </div>

            {/* Đến ngày */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Đến ngày
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-control"
                style={{ height: '40px' }}
              >
              </input>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            paddingTop: '14px',
            borderTop: '1px solid var(--border-color)'
          }}>
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={16} />
              <span>Đặt lại</span>
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Filter size={16} />
              <span>Lọc kiểm toán</span>
            </button>
          </div>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ margin: 0 }}>
          <table className="table" style={{ margin: 0, width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '170px' }}>Thời điểm</th>
                <th>Sinh viên</th>
                <th>Học phần</th>
                <th style={{ textAlign: 'center' }}>Đầu điểm</th>
                <th style={{ textAlign: 'center' }}>Biến động điểm</th>
                <th>Lý do sửa</th>
                <th>Người thực hiện</th>
                <th style={{ width: '120px' }}>Địa chỉ IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <Loader2 size={32} className="animate-spin" color="var(--primary)" />
                      <span>Đang tải nhật ký kiểm toán...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    <AlertCircle size={40} style={{ margin: '0 auto 10px', color: 'var(--text-light)' }} />
                    <p style={{ fontWeight: 600, color: 'var(--text-main)', margin: '0 0 4px' }}>Không tìm thấy bản ghi kiểm toán nào</p>
                    <p style={{ fontSize: '13px', margin: 0 }}>Hãy thử thay đổi điều kiện lọc tìm kiếm.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isIncrease = Number(log.newScore) >= Number(log.oldScore);
                  return (
                    <tr key={log.id}>
                      {/* Thời điểm */}
                      <td style={{ whiteSpace: 'nowrap', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                          <Clock size={14} color="var(--text-light)" />
                          <span>{formatDateTime(log.createdAt)}</span>
                        </div>
                      </td>

                      {/* Sinh viên */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{log.studentName || '—'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{log.studentCode || '—'}</div>
                      </td>

                      {/* Học phần */}
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{log.subjectName || log.sectionCode || '—'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{log.sectionCode}</div>
                      </td>

                      {/* Đầu điểm */}
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {getComponentBadge(log.component)}
                      </td>

                      {/* Biến động điểm */}
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-subtle)',
                          border: '1px solid var(--border-color)'
                        }}>
                          <span style={{ fontFamily: 'var(--font-mono)', textDecoration: 'line-through', color: 'var(--text-light)', fontSize: '12px' }}>
                            {log.oldScore != null ? Number(log.oldScore).toFixed(1) : (log.oldSpecialGrade || '—')}
                          </span>
                          <ArrowRight size={13} color="var(--text-light)" />
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            fontSize: '13px',
                            color: isIncrease ? '#15803d' : '#b91c1c'
                          }}>
                            {log.newScore != null ? Number(log.newScore).toFixed(1) : (log.newSpecialGrade || '—')}
                          </span>
                        </div>
                      </td>

                      {/* Lý do */}
                      <td style={{ maxWidth: '220px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }} title={log.reason}>
                          {log.reason || '—'}
                        </span>
                      </td>

                      {/* Người thực hiện */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                          <User size={14} color="var(--primary)" />
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{log.changedByUsername || 'Hệ thống'}</span>
                        </div>
                        {log.changedByRole && (
                          <span style={{ fontSize: '10px', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginTop: '2px' }}>
                            {log.changedByRole}
                          </span>
                        )}
                      </td>

                      {/* IP */}
                      <td style={{ whiteSpace: 'nowrap', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Laptop size={14} color="var(--text-light)" />
                          <span>{log.ipAddress || '—'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-subtle)',
            fontSize: '13px',
            color: 'var(--text-muted)'
          }}>
            <div>
              Hiển thị trang <strong>{page + 1}</strong> / <strong>{totalPages}</strong> (Tổng <strong>{totalElements}</strong> bản ghi)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="btn btn-secondary"
                style={{ padding: '6px 10px', height: '32px' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="btn btn-secondary"
                style={{ padding: '6px 10px', height: '32px' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
