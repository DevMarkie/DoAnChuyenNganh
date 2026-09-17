import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Lock, User, LogIn, Sparkles, CheckCircle2,
  ShieldCheck, BookOpen, Award, ArrowRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import { authService } from '../../services/dataService';
import useAuthStore from '../../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [selectedRoleTab, setSelectedRoleTab] = useState('admin');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.warning('Vui lòng nhập đầy đủ tài khoản và mật khẩu');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.login({ username, password });
      const data = res.data.data;
      login(data.token, {
        userId: data.userId,
        username: data.username,
        email: data.email,
        role: data.role,
      });

      toast.success(`Đăng nhập thành công! Xin chào ${data.username}`);

      if (data.role === 'ADMIN') navigate('/admin/dashboard');
      else if (data.role === 'LECTURER') navigate('/lecturer/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Đăng nhập thất bại. Kiểm tra lại tài khoản, mật khẩu!';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (role, u, p) => {
    setSelectedRoleTab(role);
    setUsername(u);
    setPassword(p);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: 'var(--bg-app)',
    }}>
      {/* Left Column: Academic Brand & Institution Banner (Visible on Desktop) */}
      <div style={{
        flex: '1 1 50%',
        background: 'linear-gradient(145deg, #091e42 0%, #0f172a 40%, #1e3a8a 100%)',
        padding: '56px 64px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="login-brand-panel"
      >
        {/* Subtle grid pattern background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.6,
          pointerEvents: 'none'
        }} />

        {/* Top: University Brand */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#2563eb',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
            }}>
              <GraduationCap size={26} />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'block' }}>
                STUDENT MANAGEMENT SYSTEM
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Hệ Thống Quản Lý Đào Tạo & Sinh Viên (SMS)
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Mission & Feature Highlights */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '520px', margin: '48px 0' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '9999px',
            background: 'rgba(59, 130, 246, 0.18)',
            border: '1px solid rgba(147, 197, 253, 0.25)',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#bfdbfe',
            marginBottom: '20px'
          }}>
            <ShieldCheck size={16} /> Cổng thông tin xác thực điện tử tập trung
          </div>

          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.25, letterSpacing: '-0.03em', marginBottom: '16px' }}>
            Quản trị đào tạo thông minh, minh bạch & chuẩn hoá
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.6, marginBottom: '32px' }}>
            Nền tảng phục vụ sinh viên, giảng viên và ban quản lý đào tạo kết nối xuyên suốt quá trình học tập, đăng ký học phần và tra cứu kết quả.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={16} />
              </div>
              <span style={{ color: '#e2e8f0', fontSize: '0.925rem', fontWeight: 500 }}>
                Đăng ký học phần theo thời gian thực và kiểm soát sĩ số
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={16} />
              </div>
              <span style={{ color: '#e2e8f0', fontSize: '0.925rem', fontWeight: 500 }}>
                Quản lý điểm số, quy đổi tự động hệ 10 sang hệ 4 và điểm chữ
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={16} />
              </div>
              <span style={{ color: '#e2e8f0', fontSize: '0.925rem', fontWeight: 500 }}>
                Báo cáo số liệu và bảng tổng quan thống kê sinh viên toàn trường
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Footer note */}
        <div style={{ position: 'relative', zIndex: 2, fontSize: '0.8rem', color: '#94a3b8' }}>
          © 2026 Hệ Thống Quản Lý Đào Tạo & Sinh Viên (SMS). Phiên bản 2.5 Enterprise.
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div style={{
        flex: '1 1 50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        backgroundColor: 'var(--bg-app)',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          padding: '40px 36px',
          boxShadow: 'var(--shadow-md)',
        }}>
          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
              Đăng nhập cổng đào tạo
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
              Sử dụng tài khoản được nhà trường cấp để truy cập
            </p>
          </div>

          {/* Role Segmented Switcher for Easy Verification */}
          <div style={{
            marginBottom: '24px',
            padding: '4px',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-lg)',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '4px',
            border: '1px solid var(--border-color)',
          }}>
            <button
              type="button"
              onClick={() => handleSelectRole('admin', 'admin', '123456')}
              style={{
                padding: '8px 4px',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: selectedRoleTab === 'admin' ? 'var(--bg-surface)' : 'transparent',
                color: selectedRoleTab === 'admin' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: selectedRoleTab === 'admin' ? 'var(--shadow-xs)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Quản trị viên
            </button>
            <button
              type="button"
              onClick={() => handleSelectRole('lecturer', '1000001', '123456')}
              style={{
                padding: '8px 4px',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: selectedRoleTab === 'lecturer' ? 'var(--bg-surface)' : 'transparent',
                color: selectedRoleTab === 'lecturer' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: selectedRoleTab === 'lecturer' ? 'var(--shadow-xs)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Giảng viên
            </button>
            <button
              type="button"
              onClick={() => handleSelectRole('student', '2500001', '123456')}
              style={{
                padding: '8px 4px',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: selectedRoleTab === 'student' ? 'var(--bg-surface)' : 'transparent',
                color: selectedRoleTab === 'student' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: selectedRoleTab === 'student' ? 'var(--shadow-xs)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Sinh viên
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                Tên tài khoản (Mã SV / GV / Quản trị)
              </label>
              <div style={{ position: 'relative' }}>
                <User size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập mã sinh viên hoặc tài khoản"
                  required
                  className="form-control"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  Mật khẩu
                </label>
                <span style={{ fontSize: '0.78rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}>
                  Quên mật khẩu?
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu truy cập"
                  required
                  className="form-control"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '11px',
                fontSize: '0.95rem',
                borderRadius: 'var(--radius-md)'
              }}
            >
              {loading ? (
                <span>Đang xác thực thông tin...</span>
              ) : (
                <>
                  <span>Đăng nhập hệ thống</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Security Note */}
          <div style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '0.78rem',
            color: 'var(--text-muted)'
          }}>
            <ShieldCheck size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>Kết nối bảo mật SSL 256-bit. Vui lòng bảo quản mật khẩu tài khoản đào tạo cẩn thận.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
