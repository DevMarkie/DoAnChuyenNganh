import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, X, Mail, Phone, CheckCircle, GraduationCap, BookOpen, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { authService } from '../../services/dataService';
import useAuthStore from '../../store/authStore';

const PORTAL_CONFIG = {
  student: {
    role: 'STUDENT',
    accent: '#2563eb',
    accentHover: '#1d4ed8',
    accentSoft: '#eff6ff',
    accentBorder: '#bfdbfe',
    gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    panelGradient: 'linear-gradient(180deg, #2563eb, #3b82f6, #60a5fa)',
    panelBg: 'linear-gradient(160deg, #eff6ff 0%, #dbeafe 50%, #e0f2fe 100%)',
    Icon: GraduationCap,
    roleLabel: 'Sinh viên',
    title: 'Cổng thông tin sinh viên',
    heading: 'Đăng nhập Cổng Sinh viên',
    subheading: 'Tra cứu thời khóa biểu, điểm tích lũy và đăng ký tín chỉ trực tuyến',
    userLabel: 'Mã số sinh viên (MSSV)',
    userPlaceholder: 'VD: 2500001',
    defaultUser: '2500001',
    defaultPass: '123456',
    rejectMsg: 'Từ chối truy cập: Tài khoản không thuộc phân hệ Sinh viên! Vui lòng đăng nhập đúng cổng.',
    features: [
      'Đăng ký học phần tín chỉ trực tuyến nhanh chóng & chính xác',
      'Tra cứu thời khóa biểu cá nhân, phòng học & lịch thi',
      'Xem bảng điểm quá trình, GPA/CPA và lịch sử học tập',
    ],
    redirectPath: '/student/dashboard',
    profilePath: '/student/profile',
    otherLinks: [
      { label: 'Cổng Cán bộ & Giảng viên', path: '/lecturer/login', color: '#0d9488' },
      { label: 'Cổng Quản trị hệ thống', path: '/admin/login', color: '#d97706' },
    ],
  },
  lecturer: {
    role: 'LECTURER',
    accent: '#0d9488',
    accentHover: '#0f766e',
    accentSoft: '#f0fdfa',
    accentBorder: '#99f6e4',
    gradient: 'linear-gradient(135deg, #0d9488, #14b8a6)',
    panelGradient: 'linear-gradient(180deg, #0d9488, #14b8a6, #2dd4bf)',
    panelBg: 'linear-gradient(160deg, #f0fdfa 0%, #ccfbf1 50%, #d1fae5 100%)',
    Icon: BookOpen,
    roleLabel: 'Giảng viên',
    title: 'Cổng cán bộ & giảng viên',
    heading: 'Đăng nhập Cổng Giảng viên',
    subheading: 'Quản lý lịch giảng dạy, theo dõi sinh viên & vào sổ điểm học phần',
    userLabel: 'Mã cán bộ / Giảng viên',
    userPlaceholder: 'VD: 1000001',
    defaultUser: '1000001',
    defaultPass: '123456',
    rejectMsg: 'Từ chối truy cập: Tài khoản không thuộc phân hệ Giảng viên! Vui lòng đăng nhập đúng cổng.',
    features: [
      'Theo dõi lịch giảng dạy và danh sách lớp học phần phân công',
      'Nhập điểm chuyên cần, giữa kỳ, thi cuối kỳ & khóa sổ điểm',
      'Báo cáo kết quả đánh giá học phần theo thang điểm chuẩn tín chỉ',
    ],
    redirectPath: '/lecturer/dashboard',
    profilePath: '/lecturer/profile',
    otherLinks: [
      { label: 'Cổng Thông tin Sinh viên', path: '/student/login', color: '#2563eb' },
      { label: 'Cổng Quản trị hệ thống', path: '/admin/login', color: '#d97706' },
    ],
  },
  admin: {
    role: 'ADMIN',
    accent: '#d97706',
    accentHover: '#b45309',
    accentSoft: '#fffbeb',
    accentBorder: '#fde68a',
    gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
    panelGradient: 'linear-gradient(180deg, #d97706, #f59e0b, #fbbf24)',
    panelBg: 'linear-gradient(160deg, #fffbeb 0%, #fef3c7 50%, #fef9c3 100%)',
    Icon: ShieldCheck,
    roleLabel: 'Quản trị viên',
    title: 'Cổng quản trị viên hệ thống',
    heading: 'Đăng nhập Quản trị Trung tâm',
    subheading: 'Phân hệ quản trị đào tạo, người dùng & cấu hình hệ thống cấp cao',
    userLabel: 'Tài khoản Quản trị viên',
    userPlaceholder: 'VD: admin',
    defaultUser: 'admin',
    defaultPass: '123456',
    rejectMsg: 'Cảnh báo bảo mật: Tài khoản của bạn không có quyền Quản trị viên hệ thống!',
    features: [
      'Quản lý hồ sơ đào tạo: Khoa, Ngành, Môn học & Lớp học phần',
      'Quản lý người dùng, phân quyền RBAC và cấu hình đợt đăng ký tín chỉ',
      'Giám sát hệ thống toàn diện, tra cứu & xuất báo cáo thống kê KPI',
    ],
    redirectPath: '/admin/dashboard',
    otherLinks: [
      { label: 'Cổng Thông tin Sinh viên', path: '/student/login', color: '#2563eb' },
      { label: 'Cổng Cán bộ & Giảng viên', path: '/lecturer/login', color: '#0d9488' },
    ],
  },
};

export default function PortalLoginPage({ portalType = 'student' }) {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const config = PORTAL_CONFIG[portalType] || PORTAL_CONFIG.student;

  const accent = config.accent;
  const accentSoft = config.accentSoft;
  const IconComp = config.Icon;

  const [username, setUsername] = useState(config.defaultUser);
  const [password, setPassword] = useState(config.defaultPass);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [prevPortalType, setPrevPortalType] = useState(portalType);
  if (portalType !== prevPortalType) {
    setPrevPortalType(portalType);
    setUsername(config.defaultUser);
    setPassword(config.defaultPass);
    setShowPassword(false);
  }

  // Forgot password modal states
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotForm, setForgotForm] = useState({
    username: '',
    email: '',
    phone: '',
    reason: '',
  });
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleOpenForgotModal = () => {
    const curUser = username.trim() || config.defaultUser;
    setForgotForm({
      username: curUser,
      email: `${curUser}@sms.edu.vn`,
      phone: '',
      reason: 'Tôi bị quên mật khẩu tài khoản, xin vui lòng cấp lại mật khẩu mới qua Gmail.',
    });
    setForgotSubmitted(false);
    setIsForgotModalOpen(true);
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotForm.username.trim() || !forgotForm.email.trim()) {
      toast.warning('Vui lòng nhập đầy đủ mã tài khoản và email nhận mật khẩu');
      return;
    }
    try {
      setForgotLoading(true);
      const res = await authService.forgotPassword(forgotForm);
      toast.success(res.data.message || 'Đã gửi yêu cầu cấp lại mật khẩu tới Ban Quản trị!');
      setForgotSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể gửi yêu cầu. Vui lòng kiểm tra lại thông tin!';
      toast.error(msg);
    } finally {
      setForgotLoading(false);
    }
  };

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

      // STRICT ROLE ENFORCEMENT: Reject if user does not match the portal's designated role!
      if (data.role !== config.role) {
        toast.error(config.rejectMsg);
        setLoading(false);
        return;
      }

      login(data.token, {
        userId: data.userId,
        username: data.username,
        email: data.email,
        role: data.role,
        mustChangePassword: data.mustChangePassword,
      });

      toast.success(`Đăng nhập thành công! Xin chào ${data.username}`);
      // BR-SEC-01: tài khoản dùng mật khẩu tạm/được Admin cấp lại buộc phải đổi
      // mật khẩu. Không điều hướng riêng nữa — modal buộc đổi mật khẩu (mount ở
      // Layout) sẽ tự bật và khoá điều hướng cho đến khi đổi xong, áp dụng cho
      // mọi phân hệ (kể cả Admin, vốn không có trang hồ sơ).
      if (data.mustChangePassword) {
        toast.warning('Bạn đang dùng mật khẩu tạm/được cấp lại. Vui lòng đổi mật khẩu ngay để tiếp tục.');
      }
      navigate(config.redirectPath);
    } catch (err) {
      const msg = err.response?.data?.message || 'Đăng nhập thất bại. Kiểm tra lại thông tin tài khoản, mật khẩu!';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setUsername(config.defaultUser);
    setPassword(config.defaultPass);
    toast.info(`Đã điền tài khoản mẫu: ${config.defaultUser}`);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--bg-app)' }}>
      {/* Left Column: Brand & Feature Panel — themed with portal color */}
      <div
        className="login-brand-panel force-light-text"
        style={{
          '--login-accent-gradient': config.panelGradient,
          flex: '1 1 46%',
          padding: '56px 60px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: config.panelBg,
          borderRight: '1px solid var(--border-color)',
        }}
      >
        {/* Top: University Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: 'var(--radius-md)',
            background: config.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 14px -3px ${accent}44`,
          }}>
            <IconComp size={22} style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
              SMS University
            </div>
            <div style={{
              fontSize: '0.72rem', color: accent, textTransform: 'uppercase',
              letterSpacing: '0.06em', fontWeight: 700,
            }}>
              {config.title}
            </div>
          </div>
        </div>

        {/* Middle: Heading & Features */}
        <div style={{ margin: '48px 0' }}>
          <h1 style={{
            fontSize: '2.1rem', fontWeight: 700, color: 'var(--text-main)',
            lineHeight: 1.2, letterSpacing: '-0.035em', marginBottom: '14px',
          }}>
            {config.heading}
          </h1>
          <p style={{
            fontSize: '0.98rem', lineHeight: 1.6, color: 'var(--text-muted)', maxWidth: '460px',
          }}>
            {config.subheading}
          </p>

          <ul style={{
            listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '11px',
            marginTop: '32px', paddingTop: '28px', borderTop: `1px solid ${accent}22`,
          }}>
            {config.features.map((feature, idx) => (
              <li key={idx} style={{ display: 'flex', gap: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  backgroundColor: accent, flexShrink: 0, marginTop: '7px',
                }} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: Meta & Gateway link */}
        <div style={{
          paddingTop: '20px', borderTop: `1px solid ${accent}22`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: '0.8rem', color: 'var(--text-light)',
        }}>
          <span>Phiên bản 2.0 • Chuẩn đào tạo tín chỉ</span>
          <Link to="/login" style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}>
            ← Tất cả các cổng
          </Link>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div style={{
        flex: '1 1 54%', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', padding: '40px 24px',
        backgroundColor: 'var(--bg-app)',
        borderTop: `4px solid ${accent}`,
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Mobile Brand (hidden on desktop via .login-mobile-brand) */}
          <div className="login-mobile-brand" style={{ marginBottom: '28px', textAlign: 'center' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
              background: config.gradient,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '10px', boxShadow: `0 4px 14px -3px ${accent}44`,
            }}>
              <IconComp size={22} style={{ color: '#fff' }} />
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>SMS University</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: accent }}>{config.title}</div>
          </div>

          {/* Form Header */}
          <div style={{ marginBottom: '24px' }}>
            <span
              className="portal-role-tag"
              style={{
                color: accent,
                backgroundColor: accentSoft,
                border: `1px solid ${config.accentBorder}`,
                marginBottom: '12px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: accent }} />
              Cổng {config.roleLabel}
            </span>
            <h2 style={{
              fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)',
              letterSpacing: '-0.025em', marginBottom: '6px', marginTop: '12px',
            }}>
              {config.heading}
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Vui lòng nhập tài khoản được cấp để truy cập phân hệ.
            </p>
          </div>

          {/* Sample Account Helper */}
          <div 
            className="force-light-text"
            style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', backgroundColor: accentSoft,
            borderRadius: 'var(--radius-md)', border: `1px solid ${config.accentBorder}`,
            marginBottom: '20px', fontSize: '0.8rem',
          }}>
            <span style={{ color: 'var(--text-muted)' }}>
              Tài khoản mẫu: <strong style={{ color: 'var(--text-secondary)' }}>{config.defaultUser}</strong>
            </span>
            <button
              type="button"
              onClick={handleQuickFill}
              style={{
                background: 'none', border: 'none', color: accent,
                fontWeight: 600, cursor: 'pointer', padding: '2px 6px', borderRadius: '4px',
              }}
            >
              Điền nhanh
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label">{config.userLabel} *</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{
                  position: 'absolute', left: '12px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-light)',
                }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={config.userPlaceholder}
                  required
                  className="form-control"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Mật khẩu truy cập *</label>
                <span
                  onClick={handleOpenForgotModal}
                  style={{ fontSize: '0.78rem', color: accent, cursor: 'pointer', fontWeight: 600 }}
                >
                  Quên mật khẩu?
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: '12px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-light)',
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu của bạn"
                  required
                  className="form-control"
                  style={{ paddingLeft: '38px', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', padding: '4px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    color: showPassword ? accent : 'var(--text-light)',
                    borderRadius: '4px',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%', padding: '12px', fontSize: '0.9rem',
                background: config.gradient, borderColor: accent,
                color: '#fff',
              }}
            >
              {loading ? 'Đang kiểm tra quyền truy cập...' : `Đăng nhập — ${config.roleLabel}`}
            </button>
          </form>

          {/* Security Notice */}
          <p style={{
            marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)',
            fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5,
          }}>
            Cổng bảo mật kiểm soát quyền nghiêm ngặt. Nghiêm cấm mọi hành vi truy cập trái phép phân hệ khác.
          </p>

          {/* Switch to Other Portals */}
          <div style={{ marginTop: '20px' }}>
            <div style={{
              fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase',
              color: 'var(--text-light)', marginBottom: '8px', letterSpacing: '0.05em',
            }}>
              Chuyển sang cổng đăng nhập khác
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {config.otherLinks.map((link, i) => (
                <Link
                  key={i}
                  to={link.path}
                  className="portal-link-hover"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 10px', borderRadius: 'var(--radius-sm)', textDecoration: 'none',
                    color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      backgroundColor: link.color, flexShrink: 0,
                    }} />
                    {link.label}
                  </span>
                  <span style={{ color: 'var(--text-light)' }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => !forgotLoading && setIsForgotModalOpen(false)}
        >
          <div
            className="modal"
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Yêu cầu cấp lại mật khẩu</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {config.title}
                </div>
              </div>
              <button type="button" onClick={() => setIsForgotModalOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="modal-body">
              {forgotSubmitted ? (
                <div style={{ textAlign: 'center', padding: '12px 8px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--success-bg)', color: 'var(--success)',
                    border: '1px solid var(--success-border)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '16px',
                  }}>
                    <CheckCircle size={26} />
                  </div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                    Yêu cầu đã được gửi
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
                    Thông tin yêu cầu đã được chuyển tới Ban Quản trị Đào tạo. Sau khi xác minh, Quản trị viên sẽ cấp mật khẩu mới và gửi tới hòm thư:
                    <br />
                    <strong style={{ color: 'var(--text-main)' }}>{forgotForm.email}</strong>
                  </p>
                  <button type="button" onClick={() => setIsForgotModalOpen(false)} className="btn btn-primary">
                    Đã hiểu & Đóng
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '18px' }}>
                    Điền thông tin tài khoản của bạn. Yêu cầu sẽ được gửi tới Ban Quản trị để xét duyệt và cấp lại mật khẩu mới qua Gmail.
                  </p>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label">{config.userLabel} *</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                      <input
                        type="text"
                        required
                        value={forgotForm.username}
                        onChange={(e) => setForgotForm({ ...forgotForm, username: e.target.value })}
                        placeholder={config.userPlaceholder}
                        className="form-control"
                        style={{ paddingLeft: '36px' }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label">Gmail nhận mật khẩu mới *</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                      <input
                        type="email"
                        required
                        value={forgotForm.email}
                        onChange={(e) => setForgotForm({ ...forgotForm, email: e.target.value })}
                        placeholder="VD: sinhvien@sms.edu.vn hoặc gmail của bạn"
                        className="form-control"
                        style={{ paddingLeft: '36px' }}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label">Số điện thoại liên hệ (để Admin xác minh)</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                      <input
                        type="tel"
                        value={forgotForm.phone}
                        onChange={(e) => setForgotForm({ ...forgotForm, phone: e.target.value })}
                        placeholder="VD: 0912345678"
                        className="form-control"
                        style={{ paddingLeft: '36px' }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label className="form-label">Lý do / Ghi chú gửi Ban Quản trị</label>
                    <textarea
                      rows="2"
                      value={forgotForm.reason}
                      onChange={(e) => setForgotForm({ ...forgotForm, reason: e.target.value })}
                      placeholder="VD: Em quên mật khẩu, xin thầy/cô cấp lại giúp em."
                      className="form-control"
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button type="button" disabled={forgotLoading} onClick={() => setIsForgotModalOpen(false)} className="btn btn-outline">
                      Huỷ bỏ
                    </button>
                    <button type="submit" disabled={forgotLoading} className="btn btn-primary">
                      {forgotLoading ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu tới Admin'}
                    </button>
                  </div>

                </form>

              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
