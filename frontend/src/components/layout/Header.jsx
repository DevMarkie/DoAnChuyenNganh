import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { LogOut, Sun, Moon, Shield, User, GraduationCap, ChevronRight } from 'lucide-react';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const roleLabel = user?.role === 'ADMIN' ? 'Quản trị viên'
    : user?.role === 'LECTURER' ? 'Giảng viên' : 'Sinh viên';

  const roleBadgeClass = user?.role === 'ADMIN' ? 'badge-danger'
    : user?.role === 'LECTURER' ? 'badge-info' : 'badge-success';

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Build breadcrumb label from pathname
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Tổng quan thống kê';
    if (path.includes('/students')) return 'Quản lý sinh viên';
    if (path.includes('/departments')) return 'Quản lý khoa đào tạo';
    if (path.includes('/classes')) return 'Quản lý lớp sinh hoạt';
    if (path.includes('/subjects')) return 'Quản lý môn học';
    if (path.includes('/lecturers')) return 'Quản lý giảng viên';
    if (path.includes('/semesters')) return 'Quản lý học kỳ';
    if (path.includes('/course-sections')) return 'Quản lý lớp học phần';
    if (path.includes('/grades')) return 'Quản lý bảng điểm';
    if (path.includes('/enrollments')) return 'Học phần đã đăng ký';
    if (path.includes('/enroll')) return 'Đăng ký học phần';
    if (path.includes('/transcript')) return 'Kết quả học tập & Bảng điểm';
    if (path.includes('/profile')) return 'Hồ sơ cá nhân';
    return 'Cổng thông tin';
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Cổng đào tạo</span>
          <ChevronRight size={14} color="var(--text-muted)" />
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{getBreadcrumb()}</span>
        </div>
      </div>

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Light / Dark Mode Toggle */}
        <button
          className="btn-icon"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Chuyển sang chế độ Dark' : 'Chuyển sang chế độ Light'}
          style={{ border: '1px solid var(--border-color)', width: '36px', height: '36px' }}
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>

        {/* User Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '4px 12px 4px 6px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.8rem'
          }}>
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
              {user?.username}
            </span>
          </div>
          <span className={`badge ${roleBadgeClass}`} style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
            {roleLabel}
          </span>
        </div>

        {/* Logout */}
        <button
          className="btn btn-outline btn-sm"
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--danger-text)',
            backgroundColor: 'var(--danger-bg)',
            borderColor: 'var(--danger-border)',
          }}
          title="Đăng xuất"
        >
          <LogOut size={15} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
