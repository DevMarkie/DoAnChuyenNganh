import { useState } from 'react';
import { ShieldAlert, Lock, Eye, EyeOff, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';
import { authService } from '../../services/dataService';
import useAuthStore from '../../store/authStore';

/**
 * BR-SEC-01: Modal buộc đổi mật khẩu.
 * Hiện khi user.mustChangePassword === true (mật khẩu tạm do Admin cấp lại, hoặc
 * mật khẩu mặc định lần đầu). Overlay phủ toàn màn hình, KHÔNG thể đóng và khoá
 * mọi điều hướng cho đến khi đổi mật khẩu mới thành công. Lối thoát: Đăng xuất.
 */
export default function ForcePasswordChangeModal() {
  const { user, clearMustChangePassword, logout } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user || !user.mustChangePassword) return null;

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
      toast.warning('Mật khẩu mới phải khác mật khẩu tạm thời');
      return;
    }
    try {
      setLoading(true);
      await authService.changePassword({ currentPassword, newPassword });
      clearMustChangePassword();
      toast.success('Đổi mật khẩu thành công! Chào mừng bạn đến với hệ thống.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu tạm.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)',
          maxWidth: '460px', width: '100%', border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-xl)', overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: 'var(--radius-md)', flexShrink: 0,
            backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--warning-border)',
          }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Bắt buộc đổi mật khẩu
            </h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Tài khoản: {user.username}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 0, marginBottom: '20px' }}>
            Đây là mật khẩu tạm thời. Vui lòng thiết lập mật khẩu mới để tiếp tục sử dụng hệ thống.
          </p>
          {[
            { key: 'current', label: 'Mật khẩu tạm thời (hiện tại) *', value: currentPassword, set: setCurrentPassword, ph: 'Nhập mật khẩu tạm được cấp' },
            { key: 'new', label: 'Mật khẩu mới *', value: newPassword, set: setNewPassword, ph: 'Tối thiểu 6 ký tự' },
            { key: 'confirm', label: 'Xác nhận mật khẩu mới *', value: confirmPassword, set: setConfirmPassword, ph: 'Nhập lại mật khẩu mới' },
          ].map((f) => (
            <div className="form-group" key={f.key} style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{f.label}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  placeholder={f.ph}
                  className="form-control"
                  style={{ paddingLeft: '38px', paddingRight: '42px' }}
                  autoComplete="new-password"
                />
                {f.key === 'current' && (
                  <button type="button" onClick={() => setShowPwd((v) => !v)}
                    title={showPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginTop: '22px' }}>
            <button type="button" onClick={logout} className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
              <LogOut size={15} />
              <span>Đăng xuất</span>
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Đang cập nhật...' : 'Đổi mật khẩu & Tiếp tục'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
