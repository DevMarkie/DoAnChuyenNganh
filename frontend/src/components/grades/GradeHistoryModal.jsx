import { useState, useEffect } from 'react';
import { X, History, ShieldAlert, User, Clock, ArrowRight, Laptop } from 'lucide-react';
import { gradeService } from '../../services/dataService';

export default function GradeHistoryModal({ grade, student, _section, isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !grade?.id) return;
    let isMounted = true;
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await gradeService.getGradeAuditLogs(grade.id);
        if (isMounted) {
          setLogs(res.data?.data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Không thể tải nhật ký sửa điểm');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLogs();
    return () => { isMounted = false; };
  }, [isOpen, grade?.id]);

  if (!isOpen) return null;

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
        return <span className="badge badge-info">Chuyên cần</span>;
      case 'CC2':
        return <span className="badge badge-primary">Bài tập/Thảo luận</span>;
      case 'MIDTERM':
        return <span className="badge badge-warning">Giữa kỳ</span>;
      case 'FINAL':
        return <span className="badge badge-danger">Cuối kỳ (Khảo thí)</span>;
      default:
        return <span className="badge badge-secondary">{comp}</span>;
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: '680px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              borderRadius: 'var(--radius-md)'
            }}>
              <History size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                Nhật ký Kiểm toán Sửa điểm (BR-Grade09)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Sinh viên: <strong>{student?.fullName || grade?.enrollment?.student?.fullName || '—'}</strong> ({student?.studentCode || grade?.enrollment?.student?.studentCode || '—'})
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '20px' }}>
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Đang tải lịch sử kiểm toán...
            </div>
          ) : error ? (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--danger-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem'
            }}>
              <ShieldAlert size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <History size={40} style={{ opacity: 0.35, marginBottom: '8px' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-main)', margin: '0 0 4px' }}>Chưa có lịch sử sửa điểm</p>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>Điểm số hiện tại là điểm nhập gốc lần đầu hoặc chưa từng bị điều chỉnh.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {logs.map((log, index) => (
                <div
                  key={log.id || index}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getComponentBadge(log.component)}
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          {log.oldScore != null ? Number(log.oldScore).toFixed(1) : (log.oldSpecialGrade || '—')}
                        </span>
                        <ArrowRight size={14} style={{ color: 'var(--text-light)' }} />
                        <span style={{ color: Number(log.newScore) >= Number(log.oldScore) ? 'var(--success)' : 'var(--danger)' }}>
                          {log.newScore != null ? Number(log.newScore).toFixed(1) : (log.newSpecialGrade || '—')}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <Clock size={13} />
                      <span>{formatDateTime(log.createdAt)}</span>
                    </div>
                  </div>

                  {/* Lý do */}
                  <div style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-main)',
                    backgroundColor: 'var(--bg-subtle)',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '8px',
                    lineHeight: '1.4'
                  }}>
                    <strong style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      Lý do điều chỉnh:
                    </strong>
                    <span>{log.reason || 'Không ghi lý do'}</span>
                  </div>

                  {/* Người sửa & IP */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={13} style={{ color: 'var(--primary)' }} />
                      <span>Người sửa: <strong style={{ color: 'var(--text-main)' }}>{log.changedByUsername || 'Hệ thống'}</strong> {log.changedByRole && `(${log.changedByRole})`}</span>
                    </div>
                    {log.ipAddress && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Laptop size={13} />
                        <span>IP: {log.ipAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
