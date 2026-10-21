import { useState } from 'react';
import { ShieldAlert, Lock, Eye, EyeOff, LogOut, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { authService } from '../../services/dataService';
import useAuthStore from '../../store/authStore';

/**
 * BR-SEC-01: Modal buộc đổi mật khẩu.
 * Hiện khi user.mustChangePassword === true (mật khẩu tạm do Admin cấp lại, hoặc
 * mật khẩu mặc định lần đầu). Overlay phủ toàn màn hình, KHÔNG thể đóng và khoá
 * mọi điều hướng cho đến khi đổi mật khẩu mới thành công. Lối thoát: Đăng xuất.
 */
function getPasswordStrength(pwd) {
  if (!pwd) return { level: 0, label: '', color: 'transparent', percent: '0%' };
  if (pwd.length < 6) return { level: 1, label: 'Yếu (Tối thiểu 6 ký tự)', color: '#ef4444', percent: '25%' };
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

  if (score >= 3) return { level: 3, label: 'Mạnh', color: '#10b981', percent: '100%' };
  if (score >= 1) return { level: 2, label: 'Trung bình', color: '#f59e0b', percent: '65%' };
  return { level: 1, label: 'Yếu', color: '#ef4444', percent: '35%' };
}

export default function ForcePasswordChangeModal() {
  const { user, logout } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);

  if (!user || !user.mustChangePassword) return null;

  const strength = getPasswordStrength(newPassword);
  const isDuplicate = Boolean(newPassword && currentPassword && newPassword === currentPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.warning('Vui lòng nhập đầy đủ các trường mật khẩu');
      return;
    }
    if (newPassword.length < 6) {
      toast.warning('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning('Mật khẩu mới và xác nhận không khớp');
      return;
    }
    if (newPassword === currentPassword) {
      toast.warning('Mật khẩu mới không được trùng với mật khẩu tạm thời');
      return;
    }
    try {
      setLoading(true);
      await authService.changePassword({ currentPassword, newPassword });
      toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại bằng mật khẩu mới.');
      setTimeout(() => {
        logout();
      }, 1200);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu tạm.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)',
          maxWidth: '480px', width: '100%', border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-xl)', overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: 'var(--radius-md)', flexShrink: 0,
            backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--warning-border)',
          }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Bắt buộc đổi mật khẩu
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Tài khoản: <strong style={{ color: 'var(--primary-color)' }}>{user.username}</strong>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 0, marginBottom: '18px' }}>
            Tài khoản đang sử dụng mật khẩu mặc định / mật khẩu tạm. Để đảm bảo an toàn thông tin, vui lòng thiết lập mật khẩu mới trước khi tiếp tục.
          </p>

          {/* Mật khẩu hiện tại */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Mật khẩu tạm thời (hiện tại) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu tạm được cấp (VD: 123456)"
                className="form-control"
                style={{ paddingLeft: '38px', paddingRight: '42px' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                title={showCurrent ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex' }}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Mật khẩu mới <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="form-control"
                style={{ paddingLeft: '38px', paddingRight: '42px' }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                title={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex' }}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Thanh đo độ mạnh mật khẩu */}
            {newPassword && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-muted)' }}>
                  <span>Độ mạnh: <strong style={{ color: strength.color }}>{strength.label}</strong></span>
                </div>
                <div style={{ height: '4px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: strength.percent, height: '100%', backgroundColor: strength.color, transition: 'all 0.3s ease' }} />
                </div>
              </div>
            )}

            {/* Cảnh báo trùng mật khẩu tạm */}
            {isDuplicate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.78rem', color: '#ef4444' }}>
                <AlertTriangle size={14} />
                <span>Mật khẩu mới không được trùng với mật khẩu tạm thời.</span>
              </div>
            )}
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Xác nhận mật khẩu mới <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="form-control"
                style={{ paddingLeft: '38px', paddingRight: '42px' }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                title={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex' }}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword && newPassword === confirmPassword && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.78rem', color: '#10b981' }}>
                <CheckCircle2 size={14} />
                <span>Mật khẩu xác nhận đã trùng khớp.</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
            <button
              type="button"
              onClick={logout}
              disabled={loading}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}
            >
              <LogOut size={15} />
              <span>Đăng xuất</span>
            </button>
            <button
              type="submit"
              disabled={loading || isDuplicate}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {loading ? 'Đang cập nhật...' : 'Đổi mật khẩu & Tiếp tục'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
