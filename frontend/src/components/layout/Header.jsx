import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useNotificationStore } from '../../store/notificationStore';
import NotificationDropdown from './NotificationDropdown';
import { LogOut, Sun, Moon, ChevronRight, Menu } from 'lucide-react';

const BREADCRUMBS = [
  ['dashboard',       'Tổng quan thống kê'],
  ['students',        'Quản lý sinh viên'],
  ['departments',     'Quản lý khoa đào tạo'],
  ['classes',         'Quản lý lớp sinh hoạt'],
  ['subjects',        'Quản lý môn học'],
  ['lecturers',       'Quản lý giảng viên'],
  ['semesters',       'Quản lý học kỳ'],
  ['course-sections', 'Quản lý lớp học phần'],
  ['grades',          'Quản lý bảng điểm'],
  ['enrollments',     'Học phần đã đăng ký'],
  ['enroll',          'Đăng ký học phần'],
  ['transcript',      'Kết quả học tập & Bảng điểm'],
  ['profile',         'Hồ sơ cá nhân'],
];

export default function Header({ onToggleMobileMenu }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const theme = useThemeStore(state => state.theme);
  const toggleTheme = useThemeStore(state => state.toggleTheme);

  const token = useAuthStore(state => state.token);
  const initSse = useNotificationStore(state => state.initSse);
  const disconnectSse = useNotificationStore(state => state.disconnectSse);
  const fetchUnreadCount = useNotificationStore(state => state.fetchUnreadCount);

  // Kết nối SSE đẩy thông báo tức thời khi sinh viên đăng nhập
  useEffect(() => {
    if (user?.role === 'STUDENT' && token) {
      fetchUnreadCount();
      initSse(token, (notif) => {
        toast.info(
          <div style={{ cursor: 'pointer' }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '2px' }}>
              {notif.title}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
              {notif.message}
            </div>
            <div style={{ marginTop: '5px', fontSize: '0.75rem', textDecoration: 'underline', fontWeight: 600 }}>
              Bấm để vào kiểm tra bảng điểm & nộp đơn phúc khảo
            </div>
          </div>,
          {
            autoClose: 10000,
            onClick: () => navigate('/student/transcript'),
          }
        );
      });
    } else {
      disconnectSse();
    }
  }, [user?.role, token, initSse, disconnectSse, fetchUnreadCount, navigate]);

  const roleLabel = user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'ACADEMIC_STAFF' ? 'Cán bộ Đào tạo'
    : user?.role === 'LECTURER' ? 'Giảng viên' : 'Sinh viên';

  const roleBadgeClass = user?.role === 'ADMIN' ? 'badge-danger' : user?.role === 'ACADEMIC_STAFF' ? 'badge-warning'
    : user?.role === 'LECTURER' ? 'badge-info' : 'badge-success';

  const handleLogout = () => {
    const role = user?.role;
    disconnectSse();
    logout();
    if (role === 'ADMIN') navigate('/admin/login');
    else if (role === 'LECTURER') navigate('/lecturer/login');
    else navigate('/student/login');
  };

  const getBreadcrumb = () =>
    BREADCRUMBS.find(([k]) => location.pathname.includes(`/${k}`))?.[1] ?? 'Cổng thông tin';

  return (
    <header className="app-header">
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        {/* Nút toggle mobile drawer (ẩn trên desktop qua CSS) */}
        <button
          className="btn-icon mobile-menu-toggle"
          onClick={onToggleMobileMenu}
          title="Mở danh mục menu"
          aria-label="Mở danh mục menu"
        >
          <Menu size={18} />
        </button>

        <div className="header-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }} className="breadcrumb-root">Cổng đào tạo</span>
          <ChevronRight size={14} color="var(--text-muted)" className="breadcrumb-separator" />
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }} className="breadcrumb-current">{getBreadcrumb()}</span>
        </div>
      </div>

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {/* Chuông thông báo học vụ dành cho sinh viên */}
        {user?.role === 'STUDENT' && <NotificationDropdown />}

        {/* Light / Dark Mode Toggle */}
        <button
          className="btn-icon"
          data-testid="theme-toggle-btn"
          aria-label={theme === 'light' ? 'Chuyển sang chế độ Dark' : 'Chuyển sang chế độ Light'}
          onClick={toggleTheme}
          title={theme === 'light' ? 'Chuyển sang chế độ Dark' : 'Chuyển sang chế độ Light'}
          style={{ border: '1px solid var(--border-color)', width: '36px', height: '36px' }}
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>


        {/* User Pill */}
        <div className="user-pill" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 12px 4px 6px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-surface)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-xs), var(--glass-inset-shine)'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-gradient)',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.8rem',
            flexShrink: 0
          }}>
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="user-pill-text" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
              {user?.username}
            </span>
          </div>
          <span className={`badge ${roleBadgeClass} user-pill-badge`} style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
            {roleLabel}
          </span>
        </div>

        {/* Logout */}
        <button
          className="btn btn-outline btn-sm btn-logout"
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--danger-text)',
            backgroundColor: 'var(--danger-bg)',
            borderColor: 'var(--danger-border)',
            padding: '6px 10px'
          }}
          title="Đăng xuất"
        >
          <LogOut size={15} />
          <span className="logout-text">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
