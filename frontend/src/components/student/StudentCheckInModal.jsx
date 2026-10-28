import { useState, useRef, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { attendanceService } from '../../services/dataService';

export default function StudentCheckInModal({ courseSection, onClose, onSuccess }) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Vui lòng nhập mã điểm danh');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await attendanceService.checkIn({
        code: cleanCode,
        sectionId: courseSection?.id,
      });

      const msg = res.data?.message || 'Điểm danh thành công! Bạn đã được ghi nhận có mặt.';
      setSuccessMsg(msg);
      toast.success(msg);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      const errText = err.response?.data?.message || 'Mã điểm danh không hợp lệ hoặc đã hết hạn';
      setErrorMsg(errText);
      inputRef.current?.select();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          borderRadius: '14px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border, #e5e7eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={20} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
              Điểm danh buổi học
            </h3>
          </div>

          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '6px', borderRadius: '50%', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)' }}
            title="Đóng (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 20px' }}>
          {courseSection && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'var(--bg-subtle, #f9fafb)',
                border: '1px solid var(--border, #e5e7eb)',
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                {courseSection.subject?.subjectName || 'Học phần'}
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Mã lớp: <strong>{courseSection.sectionCode}</strong> • Phòng: {courseSection.room || '—'}
              </div>
            </div>
          )}

          {successMsg ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 10px',
                color: '#059669',
              }}
            >
              <CheckCircle2 size={48} style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{successMsg}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Đang đóng cửa sổ...
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    marginBottom: '8px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Nhập mã điểm danh do giảng viên cung cấp:
                </label>

                <input
                  ref={inputRef}
                  type="text"
                  maxLength={10}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setErrorMsg('');
                  }}
                  placeholder="VD: 842911"
                  className="form-control"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    letterSpacing: '6px',
                    textAlign: 'center',
                    padding: '10px',
                    height: '56px',
                    textTransform: 'uppercase',
                    borderColor: errorMsg ? '#ef4444' : undefined,
                  }}
                  disabled={submitting}
                  autoFocus
                />
              </div>

              {errorMsg && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    marginBottom: '16px',
                    justifyContent: 'center',
                  }}
                >
                  <AlertCircle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !code.trim()}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  height: '44px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="spin" size={18} />
                    <span>Đang xác nhận...</span>
                  </>
                ) : (
                  <span>Xác nhận điểm danh</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
