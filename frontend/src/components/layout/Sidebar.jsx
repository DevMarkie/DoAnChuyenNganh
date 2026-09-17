import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { passwordResetService } from '../../services/dataService';
import {
  LayoutDashboard, Users, Building2, GraduationCap, BookOpen, UserCog,
  CalendarDays, Calendar, Layers, ClipboardList, BookMarked, School, Award, Menu,
  ChevronLeft, KeyRound
} from 'lucide-react';

const adminNavGroups = [
  {
    group: 'Tổng quan',
    items: [
      { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Bảng tổng quan' },
    ]
  },
  {
    group: 'Quản lý Đào tạo',
    items: [
      { path: '/admin/students', icon: Users, label: 'Sinh viên' },
      { path: '/admin/lecturers', icon: UserCog, label: 'Giảng viên' },
      { path: '/admin/departments', icon: Building2, label: 'Khoa / Viện' },
      { path: '/admin/classes', icon: School, label: 'Lớp sinh hoạt' },
      { path: '/admin/subjects', icon: BookOpen, label: 'Môn học' },
    ]
  },
  {
    group: 'Kế hoạch & Điểm số',
    items: [
      { path: '/admin/semesters', icon: CalendarDays, label: 'Học kỳ & Đợt ĐK' },
      { path: '/admin/course-sections', icon: Layers, label: 'Lớp học phần' },
      { path: '/admin/schedules', icon: Calendar, label: 'Lịch học & Xếp lịch' },
      { path: '/admin/grades', icon: ClipboardList, label: 'Sổ điểm toàn trường' },
    ]
  },
  {
    group: 'Hệ thống & Bảo mật',
    items: [
      { path: '/admin/password-resets', icon: KeyRound, label: 'Yêu cầu cấp lại MK', badgeKey: 'resets' },
    ]
  }
];

const lecturerNavGroups = [
  {
    group: 'Giảng dạy',
    items: [
      { path: '/lecturer/dashboard', icon: LayoutDashboard, label: 'Tổng quan giảng viên' },
      { path: '/lecturer/my-sections', icon: Layers, label: 'Học phần phụ trách' },
      { path: '/lecturer/schedule', icon: Calendar, label: 'Lịch giảng dạy' },
      { path: '/lecturer/grades', icon: ClipboardList, label: 'Vào sổ điểm' },
    ]
  },
  {
    group: 'Tài khoản',
    items: [
      { path: '/lecturer/profile', icon: UserCog, label: 'Hồ sơ cá nhân' },
    ]
  }
];

const studentNavGroups = [
  {
    group: 'Học tập',
    items: [
      { path: '/student/dashboard', icon: LayoutDashboard, label: 'Cổng sinh viên' },
      { path: '/student/schedule', icon: Calendar, label: 'Thời khóa biểu' },
      { path: '/student/enroll', icon: BookMarked, label: 'Đăng ký học phần' },
      { path: '/student/enrollments', icon: Layers, label: 'HP đã đăng ký' },
      { path: '/student/transcript', icon: Award, label: 'Kết quả học tập (CPA)' },
    ]
  },
  {
    group: 'Tài khoản',
    items: [
      { path: '/student/profile', icon: UserCog, label: 'Hồ sơ sinh viên' },
    ]
  }
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuthStore();
  const role = user?.role;
  const [pendingResets, setPendingResets] = useState(0);

  useEffect(() => {
    if (role === 'ADMIN') {
      let isMounted = true;
      const fetchPending = async () => {
        try {
          const res = await passwordResetService.getPendingCount();
          if (isMounted && res?.data?.count !== undefined) {
            setPendingResets(res.data.count);
          }
        } catch {
          // ignore error silently
        }
      };
      fetchPending();
      const interval = setInterval(fetchPending, 15000);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }
  }, [role]);

  const groups = role === 'ADMIN' ? adminNavGroups : role === 'LECTURER' ? lecturerNavGroups : studentNavGroups;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <GraduationCap size={22} />
            </div>
            <div className="sidebar-brand-text">
              <span className="brand-name">SMS PORTAL</span>
              <span className="brand-sub">Quản Lý Đào Tạo</span>
            </div>
          </div>
        )}
        <button
          className="btn-icon btn-toggle-sidebar"
          onClick={onToggle}
          title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        {groups.map((grp, gIdx) => (
          <div key={gIdx} className="nav-group">
            {!collapsed && <div className="nav-group-title">{grp.group}</div>}
            <div className="nav-group-items">
              {grp.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? (item.badgeKey === 'resets' && pendingResets > 0 ? `${item.label} (${pendingResets} chờ)` : item.label) : ''}
                >
                  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                    <item.icon size={18} className="nav-item-icon" />
                    {collapsed && item.badgeKey === 'resets' && pendingResets > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: -3,
                        right: -3,
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        backgroundColor: '#ef4444'
                      }} />
                    )}
                  </div>
                  {!collapsed && <span className="nav-item-text">{item.label}</span>}
                  {!collapsed && item.badgeKey === 'resets' && pendingResets > 0 && (
                    <span style={{
                      marginLeft: 'auto',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      lineHeight: 1
                    }}>
                      {pendingResets}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer Info */}
      {!collapsed && (
        <div className="sidebar-footer">
          <div className="system-version">
            <span>Hệ Thống Quản Lý Đào Tạo</span>
            <span className="version-tag">v2.5 Enterprise</span>
          </div>
        </div>
      )}
    </aside>
  );
}
