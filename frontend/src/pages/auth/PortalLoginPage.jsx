import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, X, Mail, Phone, CheckCircle, Eye, EyeOff, KeyRound, Sparkles, ArrowRight } from 'lucide-react';
import { PortalStudentIcon, PortalLecturerIcon, PortalAdminIcon } from '../../components/icons';
import { toast } from 'react-toastify';
import { authService } from '../../services/dataService';
import useAuthStore from '../../store/authStore';
import SmsLogo from '../../components/common/SmsLogo';

const PORTAL_CONFIG = {
  student: {
    role: 'STUDENT',
    accent: '#2563eb',
    accentHover: '#1d4ed8',
    accentSoft: '#eff6ff',
    accentBorder: '#bfdbfe',
    Icon: PortalStudentIcon,
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
      { label: 'Cổng Cán bộ Đào tạo', path: '/academic/login', color: '#7c3aed' },
      { label: 'Cổng Quản trị hệ thống', path: '/admin/login', color: '#d97706' },
    ],
  },
  lecturer: {
    role: 'LECTURER',
    accent: '#0d9488',
    accentHover: '#0f766e',
    accentSoft: '#f0fdfa',
    accentBorder: '#99f6e4',
    Icon: PortalLecturerIcon,
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
      'Nhập điểm chuyên cần, giữa kỳ, thi cuối kỳ & đề xuất điểm phúc khảo',
      'Báo cáo kết quả đánh giá học phần theo thang điểm chuẩn tín chỉ',
    ],
    redirectPath: '/lecturer/dashboard',
    profilePath: '/lecturer/profile',
    otherLinks: [
      { label: 'Cổng Thông tin Sinh viên', path: '/student/login', color: '#2563eb' },
      { label: 'Cổng Cán bộ Đào tạo', path: '/academic/login', color: '#7c3aed' },
      { label: 'Cổng Quản trị hệ thống', path: '/admin/login', color: '#d97706' },
    ],
  },
  academic: {
    role: ['ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF'],
    accent: '#7c3aed',
    accentHover: '#6d28d9',
    accentSoft: '#f5f3ff',
    accentBorder: '#ddd6fe',
    Icon: PortalAdminIcon,
    roleLabel: 'Cán bộ Đào tạo',
    title: 'Cổng cán bộ đào tạo',
    heading: 'Đăng nhập Cổng Đào tạo',
    subheading: 'Quản lý hồ sơ sinh viên, khung chương trình, mở lớp và xét tốt nghiệp',
    userLabel: 'Tài khoản Cán bộ Đào tạo',
    userPlaceholder: 'VD: daotao',
    defaultUser: 'daotao',
    defaultPass: 'Daotao@2026!',
    rejectMsg: 'Từ chối truy cập: Tài khoản không thuộc phân hệ Cán bộ Đào tạo! Vui lòng đăng nhập đúng cổng.',
    features: [
      'Quản lý hồ sơ sinh viên, khung chương trình đào tạo & khối kiến thức',
      'Mở lớp học phần, phân công giảng viên & xử lý ngoại lệ đăng ký tín chỉ',
      'Chạy thuật toán xét tốt nghiệp chuẩn hóa & phê duyệt đơn phúc khảo điểm',
    ],
    redirectPath: '/academic/dashboard',
    otherLinks: [
      { label: 'Cổng Thông tin Sinh viên', path: '/student/login', color: '#2563eb' },
      { label: 'Cổng Giảng viên', path: '/lecturer/login', color: '#0d9488' },
      { label: 'Cổng Quản trị hệ thống', path: '/admin/login', color: '#d97706' },
    ],
  },
  admin: {
    role: 'ADMIN',
    accent: '#d97706',
    accentHover: '#b45309',
    accentSoft: '#fffbeb',
    accentBorder: '#fde68a',
    Icon: PortalAdminIcon,
    roleLabel: 'Quản trị viên',
    title: 'Cổng quản trị viên hệ thống',
    heading: 'Đăng nhập Quản trị Trung tâm',
    subheading: 'Phân hệ cấu hình hệ thống, phân quyền, kiểm toán và bảo mật cấp cao',
    userLabel: 'Tài khoản Quản trị viên',
    userPlaceholder: 'VD: admin',
    defaultUser: 'admin',
    defaultPass: '123456',
    rejectMsg: 'Cảnh báo: Tài khoản của bạn không có quyền Quản trị viên hệ thống!',
    features: [
      'Cấu hình hệ thống, quản trị tài khoản & cấp lại mật khẩu bảo mật',
      'Quản lý cổng thu ngân học phí, kiểm soát luồng giao dịch tài chính',
      'Giám sát kiểm toán điều chỉnh điểm, log can thiệp và an toàn CSDL',
    ],
    redirectPath: '/admin/dashboard',
    otherLinks: [
      { label: 'Cổng Thông tin Sinh viên', path: '/student/login', color: '#2563eb' },
      { label: 'Cổng Cán bộ Đào tạo', path: '/academic/login', color: '#7c3aed' },
      { label: 'Cổng Giảng viên', path: '/lecturer/login', color: '#0d9488' },
    ],
  },
};

export default function PortalLoginPage({ portalType = 'student' }) {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const config = PORTAL_CONFIG[portalType] || PORTAL_CONFIG.student;

  const accent = config.accent;
  const accentSoft = config.accentSoft;

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

  // Forgot password OTP states
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: nhập username, 2: nhập OTP & mật khẩu mới
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotMaskedEmail, setForgotMaskedEmail] = useState('');
  const [forgotDevOtp, setForgotDevOtp] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleOpenForgotModal = () => {
    const curUser = username.trim() || config.defaultUser;
    setForgotUsername(curUser);
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotMaskedEmail('');
    setForgotDevOtp('');
    setForgotStep(1);
    setIsForgotModalOpen(true);
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!forgotUsername.trim()) {
      toast.warning('Vui lòng nhập mã sinh viên hoặc tên đăng nhập');
      return;
    }
    try {
      setForgotLoading(true);
      const res = await authService.sendResetOtp({ username: forgotUsername.trim() });
      const data = res.data?.data || {};
      setForgotMaskedEmail(data.maskedEmail || '');
      setForgotDevOtp(data.devOtp || '');
      setForgotStep(2);
      toast.success(res.data?.message || 'Mã OTP đã được gửi đến email đăng ký của bạn!');
      if (data.devOtp) {
        toast.info(`[Demo/Dev] Mã OTP của bạn là: ${data.devOtp}`, { autoClose: 12000 });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại mã tài khoản!';
      toast.error(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (!forgotOtp.trim()) {
      toast.warning('Vui lòng nhập mã OTP 6 số');
      return;
    }
    if (!forgotNewPassword.trim() || forgotNewPassword.length < 6) {
      toast.warning('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      toast.warning('Mật khẩu xác nhận không khớp');
      return;
    }
    try {
      setForgotLoading(true);
      const res = await authService.verifyResetOtp({
        username: forgotUsername.trim(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword.trim(),
      });
      toast.success(res.data?.message || 'Đặt lại mật khẩu thành công! Hãy đăng nhập với mật khẩu mới.');
      setIsForgotModalOpen(false);
      setUsername(forgotUsername.trim());
      setPassword(forgotNewPassword.trim());
    } catch (err) {
      const msg = err.response?.data?.message || 'Xác thực OTP thất bại. Vui lòng kiểm tra lại!';
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
      const allowedRoles = Array.isArray(config.role) ? config.role : [config.role];
      if (!allowedRoles.includes(data.role)) {
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

  const handleQuickFill = (userOverride) => {
    const val = typeof userOverride === 'string' ? userOverride : config.defaultUser;
    setUsername(config.defaultUser);
    setPassword(config.defaultPass);
    setUsername(val);
    toast.info(`Đã điền tài khoản mẫu: ${val}`);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--bg-app)' }}>
      {/* Left Column: Brand & Feature Panel — themed with portal color */}
      <div
        className="login-brand-panel"
        style={{
          '--login-accent-gradient': config.accent,
          '--text-main': '#ffffff',
          '--text-muted': '#aebbd6',
          '--text-secondary': '#c7d2e4',
          '--text-light': '#9fb0d4',
          flex: '1 1 46%',
          padding: '56px 60px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#172554',
          borderRight: '1px solid var(--border-color)',
        }}
      >
        {/* Top: University Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SmsLogo size={42} />
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
              SMS University
            </div>
            <div style={{ fontSize: '0.74rem', color: '#9fb0d4', fontWeight: 500 }}>
              Cổng thông tin đào tạo trực tuyến
            </div>
          </div>
        </div>

        {/* Middle: Heading & Features */}
        <div style={{ margin: '48px 0' }}>
          <h1 style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: '2.3rem', fontWeight: 600, color: 'var(--text-main)',
            lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: '14px',
          }}>
            {config.title}
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
          <span>Chuẩn đào tạo tín chỉ, phiên bản 2.0</span>
          <Link to="/login" style={{ color: '#c7d2e4', textDecoration: 'none', fontWeight: 600 }}>
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
            <div style={{ display: 'inline-flex', marginBottom: '10px' }}>
              <SmsLogo size={46} />
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
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: '1.55rem', fontWeight: 600, color: 'var(--text-main)',
              letterSpacing: '-0.01em', marginBottom: '6px', marginTop: '12px',
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
              Tài khoản mẫu: <strong style={{ color: 'var(--text-secondary)' }}>{config.defaultUser}</strong>{portalType === 'admin' && <> / <strong style={{ color: 'var(--text-secondary)' }}>staff</strong></>}
            </span>
            <button
              type="button"
              onClick={() => handleQuickFill(config.defaultUser)}
              style={{
                background: 'none', border: 'none', color: accent,
                fontWeight: 600, cursor: 'pointer', padding: '2px 6px', borderRadius: '4px',
              }}
            >
              {portalType === 'admin' ? 'Admin' : 'Điền nhanh'}
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
                background: accent, borderColor: accent,
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
              fontSize: '0.8rem', fontWeight: 600,
              color: 'var(--text-secondary)', marginBottom: '8px',
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
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <KeyRound size={20} style={{ color: accent }} />
                  Đặt lại mật khẩu qua OTP
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {forgotStep === 1 ? 'Bước 1: Xác nhận tài khoản & Nhận mã OTP' : 'Bước 2: Xác thực mã OTP & Đặt mật khẩu mới'}
                </div>
              </div>
              <button type="button" onClick={() => setIsForgotModalOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="modal-body">
              {forgotStep === 1 ? (
                <form onSubmit={handleSendOtp}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                    Nhập mã số sinh viên hoặc tên tài khoản. Hệ thống sẽ tự động gửi mã OTP xác thực (6 số) tới email đã đăng ký của bạn.
                  </p>

                  <div className="form-group" style={{ marginBottom: '18px' }}>
                    <label className="form-label">{config.userLabel} *</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                      <input
                        type="text"
                        required
                        value={forgotUsername}
                        onChange={(e) => setForgotUsername(e.target.value)}
                        placeholder={config.userPlaceholder}
                        className="form-control"
                        style={{ paddingLeft: '36px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button type="button" disabled={forgotLoading} onClick={() => setIsForgotModalOpen(false)} className="btn btn-outline">
                      Huỷ bỏ
                    </button>
                    <button type="submit" disabled={forgotLoading} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {forgotLoading ? 'Đang gửi...' : 'Gửi mã OTP qua Email'}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp}>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    marginBottom: '16px',
                    fontSize: '0.85rem',
                  }}>
                    Mã OTP 6 số đã được gửi tới email: <strong>{forgotMaskedEmail || 'email trên hồ sơ'}</strong>
                    {forgotDevOtp && (
                      <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                          [Demo OTP]: {forgotDevOtp}
                        </span>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => setForgotOtp(forgotDevOtp)}
                          style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                        >
                          Dán mã OTP demo
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label">Mã xác thực OTP (6 số) *</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      placeholder="VD: 123456"
                      className="form-control"
                      style={{ fontSize: '1.15rem', letterSpacing: '4px', textAlign: 'center', fontWeight: 700 }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label">Mật khẩu mới (tối thiểu 6 ký tự) *</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới"
                        className="form-control"
                        style={{ paddingLeft: '36px' }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label className="form-label">Nhập lại mật khẩu mới *</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="Xác nhận lại mật khẩu mới"
                        className="form-control"
                        style={{ paddingLeft: '36px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                    <button type="button" disabled={forgotLoading} onClick={() => setForgotStep(1)} className="btn btn-outline">
                      Quay lại
                    </button>
                    <button type="submit" disabled={forgotLoading} className="btn btn-primary">
                      {forgotLoading ? 'Đang xử lý...' : 'Xác nhận & Đặt lại mật khẩu'}
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
