import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap, BookOpen, ShieldAlert, Lock, User,
  Sparkles, CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck,
  X, Mail, Phone, FileText, Send, CheckCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { authService } from '../../services/dataService';
import useAuthStore from '../../store/authStore';

const PORTAL_CONFIG = {
  student: {
    role: 'STUDENT',
    title: 'CỔNG THÔNG TIN SINH VIÊN',
    heading: 'Đăng nhập Cổng Sinh viên',
    subheading: 'Tra cứu thời khóa biểu, điểm tích lũy và đăng ký tín chỉ trực tuyến',
    gradient: 'linear-gradient(145deg, #091e42 0%, #1e3a8a 50%, #2563eb 100%)',
    accentColor: '#2563eb',
    accentBorder: '#bfdbfe',
    accentLight: '#eff6ff',
    icon: GraduationCap,
    userLabel: 'Mã số sinh viên (MSSV)',
    userPlaceholder: 'VD: 2500001',
    defaultUser: '2500001',
    defaultPass: '123456',
    rejectMsg: 'Từ chối truy cập: Tài khoản không thuộc phân hệ Sinh viên! Vui lòng đăng nhập đúng cổng.',
    features: [
      'Đăng ký học phần tín chỉ trực tuyến nhanh chóng & chính xác',
      'Tra cứu thời khóa biểu cá nhân, phòng học & lịch thi',
      'Xem bảng điểm quá trình, GPA/CPA và lịch sử học tập'
    ],
    redirectPath: '/student/dashboard',
    otherLinks: [
      { label: 'Cổng Cán bộ & Giảng viên', path: '/lecturer/login', icon: BookOpen },
      { label: 'Cổng Quản trị hệ thống', path: '/admin/login', icon: ShieldAlert },
    ]
  },
  lecturer: {
    role: 'LECTURER',
    title: 'CỔNG CÁN BỘ & GIẢNG VIÊN',
    heading: 'Đăng nhập Cổng Giảng viên',
    subheading: 'Quản lý lịch giảng dạy, theo dõi sinh viên & vào sổ điểm học phần',
    gradient: 'linear-gradient(145deg, #042f2e 0%, #0f766e 50%, #0d9488 100%)',
    accentColor: '#0d9488',
    accentBorder: '#99f6e4',
    accentLight: '#f0fdfa',
    icon: BookOpen,
    userLabel: 'Mã cán bộ / Giảng viên',
    userPlaceholder: 'VD: 1000001',
    defaultUser: '1000001',
    defaultPass: '123456',
    rejectMsg: 'Từ chối truy cập: Tài khoản không thuộc phân hệ Giảng viên! Vui lòng đăng nhập đúng cổng.',
    features: [
      'Theo dõi lịch giảng dạy và danh sách lớp học phần phân công',
      'Nhập điểm chuyên cần, giữa kỳ, thi cuối kỳ & khóa sổ điểm',
      'Báo cáo kết quả đánh giá học phần theo thang điểm chuẩn tín chỉ'
    ],
    redirectPath: '/lecturer/dashboard',
    otherLinks: [
      { label: 'Cổng Thông tin Sinh viên', path: '/student/login', icon: GraduationCap },
      { label: 'Cổng Quản trị hệ thống', path: '/admin/login', icon: ShieldAlert },
    ]
  },
  admin: {
    role: 'ADMIN',
    title: 'CỔNG QUẢN TRỊ VIÊN HỆ THỐNG',
    heading: 'Đăng nhập Quản Trị Trung Tâm',
    subheading: 'Phân hệ quản trị đào tạo, người dùng & cấu hình hệ thống cấp cao',
    gradient: 'linear-gradient(145deg, #020617 0%, #0f172a 50%, #1e293b 100%)',
    accentColor: '#2563eb',
    accentBorder: '#93c5fd',
    accentLight: '#eff6ff',
    icon: ShieldAlert,
    userLabel: 'Tài khoản Quản trị viên',
    userPlaceholder: 'VD: admin',
    defaultUser: 'admin',
    defaultPass: '123456',
    rejectMsg: 'Cảnh báo bảo mật: Tài khoản của bạn không có quyền Quản trị viên hệ thống!',
    features: [
      'Quản lý hồ sơ đào tạo: Khoa, Ngành, Môn học & Lớp học phần',
      'Quản lý người dùng, phân quyền RBAC và cấu hình đợt đăng ký tín chỉ',
      'Giám sát hệ thống toàn diện, tra cứu & xuất báo cáo thống kê KPI'
    ],
    redirectPath: '/admin/dashboard',
    otherLinks: [
      { label: 'Cổng Thông tin Sinh viên', path: '/student/login', icon: GraduationCap },
      { label: 'Cổng Cán bộ & Giảng viên', path: '/lecturer/login', icon: BookOpen },
    ]
  }
};

export default function PortalLoginPage({ portalType = 'student' }) {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const config = PORTAL_CONFIG[portalType] || PORTAL_CONFIG.student;
  const IconComponent = config.icon;

  const [username, setUsername] = useState(config.defaultUser);
  const [password, setPassword] = useState(config.defaultPass);
  const [loading, setLoading] = useState(false);

  // Forgot password modal states
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotForm, setForgotForm] = useState({
    username: '',
    email: '',
    phone: '',
    reason: ''
  });
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleOpenForgotModal = () => {
    const curUser = username.trim() || config.defaultUser;
    setForgotForm({
      username: curUser,
      email: `${curUser}@sms.edu.vn`,
      phone: '',
      reason: 'Tôi bị quên mật khẩu tài khoản, xin vui lòng cấp lại mật khẩu mới qua Gmail.'
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
      });

      toast.success(`Đăng nhập thành công! Xin chào ${data.username}`);
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
      {/* Left Column: Portal-Specific Brand & Vision Panel */}
      <div
        className="login-brand-panel"
        style={{
          flex: '1 1 50%',
          background: config.gradient,
          padding: '56px 64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
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

        {/* Top: University Brand & Portal Tag */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: config.accentColor,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 14px ${config.accentColor}66`
            }}>
              <IconComponent size={26} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                SMS UNIVERSITY
              </div>
              <div style={{
                fontSize: '0.78rem',
                color: 'rgba(255, 255, 255, 0.75)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600
              }}>
                {config.title}
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Feature Highlights */}
        <div style={{ position: 'relative', zIndex: 2, margin: '48px 0' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(8px)',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.18)'
          }}>
            <Sparkles size={14} color="#facc15" />
            <span>Hệ thống Quản lý Đào tạo & Sinh viên Tín chỉ</span>
          </div>

          <h1 style={{
            fontSize: '2.2rem',
            fontWeight: 800,
            lineHeight: 1.25,
            marginBottom: '16px',
            letterSpacing: '-0.03em'
          }}>
            {config.heading}
          </h1>

          <p style={{
            fontSize: '0.98rem',
            lineHeight: 1.6,
            color: 'rgba(255, 255, 255, 0.82)',
            maxWidth: '480px',
            marginBottom: '32px'
          }}>
            {config.subheading}
          </p>

          {/* Highlights List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {config.features.map((feature, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  marginTop: '3px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <CheckCircle2 size={13} color="#ffffff" />
                </div>
                <span style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: University Gateway navigation */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          <div>Phiên bản 2.0 • Chuẩn đào tạo tín chỉ</div>
          <Link
            to="/login"
            style={{
              color: 'rgba(255, 255, 255, 0.85)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 500
            }}
          >
            <ArrowLeft size={14} />
            <span>Tất cả các cổng</span>
          </Link>
        </div>
      </div>

      {/* Right Column: Dedicated Login Form */}
      <div style={{
        flex: '1 1 50%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 24px',
        position: 'relative'
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {/* Mobile University Brand */}
          <div className="login-mobile-brand" style={{ marginBottom: '28px', textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: config.accentColor,
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <IconComponent size={26} />
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>SMS UNIVERSITY</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{config.title}</div>
          </div>

          {/* Form Header */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: config.accentLight,
              color: config.accentColor,
              border: `1px solid ${config.accentBorder}`,
              marginBottom: '10px',
              letterSpacing: '0.04em'
            }}>
              {config.title}
            </div>
            <h2 style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '-0.02em',
              marginBottom: '6px'
            }}>
              {config.heading}
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Vui lòng nhập tài khoản được cấp để truy cập phân hệ
            </p>
          </div>

          {/* Quick Demo Fill Helper */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            marginBottom: '20px',
            fontSize: '0.8rem'
          }}>
            <span style={{ color: 'var(--text-muted)' }}>
              Tài khoản mẫu: <strong>{config.defaultUser}</strong>
            </span>
            <button
              type="button"
              onClick={handleQuickFill}
              style={{
                background: 'none',
                border: 'none',
                color: config.accentColor,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '4px'
              }}
            >
              Điền nhanh
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                {config.userLabel} *
              </label>
              <div style={{ position: 'relative' }}>
                <User size={17} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
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
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 0 }}>
                  Mật khẩu truy cập *
                </label>
                <span
                  onClick={handleOpenForgotModal}
                  style={{ fontSize: '0.78rem', color: config.accentColor, cursor: 'pointer', fontWeight: 600 }}
                >
                  Quên mật khẩu?
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={17} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu của bạn"
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
                padding: '12px',
                fontSize: '0.95rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: config.accentColor,
                borderColor: config.accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <span>Đang kiểm tra quyền truy cập...</span>
              ) : (
                <>
                  <span>Xác thực & Đăng nhập</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
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
            <ShieldCheck size={16} style={{ color: config.accentColor, flexShrink: 0, marginTop: '2px' }} />
            <span>
              Cổng bảo mật kiểm soát quyền nghiêm ngặt. Nghiêm cấm mọi hành vi truy cập trái phép phân hệ khác.
            </span>
          </div>

          {/* Switch to Other Portals */}
          <div style={{
            marginTop: '20px',
            padding: '12px 14px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-color)',
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '8px',
              letterSpacing: '0.04em'
            }}>
              Chuyển sang cổng đăng nhập khác:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {config.otherLinks.map((link, i) => {
                const LinkIcon = link.icon;
                return (
                  <Link
                    key={i}
                    to={link.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      color: 'var(--text-main)',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      transition: 'background-color 0.15s'
                    }}
                    className="portal-link-hover"
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LinkIcon size={14} style={{ color: 'var(--text-muted)' }} />
                      {link.label}
                    </span>
                    <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => !forgotLoading && setIsForgotModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: config.accentLight,
                  color: config.accentColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Lock size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    Yêu Cầu Cấp Lại Mật Khẩu
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {config.title}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px' }}>
              {forgotSubmitted ? (
                <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--success-bg)',
                    color: 'var(--success)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px'
                  }}>
                    <CheckCircle size={36} />
                  </div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                    Yêu Cầu Đã Được Gửi!
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
                    Thông tin yêu cầu đã được chuyển tới Ban Quản trị Đào tạo. Sau khi xác minh, Quản trị viên sẽ cấp mật khẩu mới và gửi trực tiếp tới hòm thư:
                    <br />
                    <strong style={{ color: config.accentColor }}>{forgotForm.email}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="btn btn-primary"
                    style={{
                      padding: '10px 24px',
                      backgroundColor: config.accentColor,
                      borderColor: config.accentColor,
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    Đã hiểu & Đóng
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '18px' }}>
                    Điền thông tin tài khoản của bạn. Yêu cầu sẽ được gửi tới Ban Quản trị để xét duyệt và cấp lại mật khẩu mới qua Gmail.
                  </p>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                      {config.userLabel} *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
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
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                      Gmail nhận mật khẩu mới *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
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
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                      Số điện thoại liên hệ (Để Admin xác minh)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
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
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                      Lý do / Ghi chú gửi Ban Quản trị
                    </label>
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
                    <button
                      type="button"
                      disabled={forgotLoading}
                      onClick={() => setIsForgotModalOpen(false)}
                      className="btn btn-outline"
                      style={{ borderRadius: 'var(--radius-md)' }}
                    >
                      Huỷ bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="btn btn-primary"
                      style={{
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: config.accentColor,
                        borderColor: config.accentColor,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {forgotLoading ? (
                        <span>Đang gửi yêu cầu...</span>
                      ) : (
                        <>
                          <Send size={15} />
                          <span>Gửi yêu cầu tới Admin</span>
                        </>
                      )}
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
