import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { passwordResetService } from '../../services/dataService';
import SmsLogo from '../common/SmsLogo';
import './Layout.css';
import {
  LayoutDashboard, Users, Building2, BookOpen, UserCog,
  CalendarDays, Calendar, Layers, ClipboardList, BookMarked, School, Award, AlertTriangle, Menu,
  ChevronLeft, KeyRound, UserPlus, X, GraduationCap, DollarSign, ShieldCheck
} from 'lucide-react';

const adminNavGroups = [
  {
    group: 'Tổng quan',
    items: [
      { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Bảng tổng quan' },
    ]
  },
  {
    group: 'Hệ thống & Tài khoản',
    items: [
      { path: '/admin/students', icon: Users, label: 'Quản lý tài khoản SV' },
      { path: '/admin/lecturers', icon: UserCog, label: 'Giảng viên' },
    ]
  },
  {
    group: 'Danh mục & Cổng dịch vụ',
    items: [
      { path: '/admin/departments', icon: Building2, label: 'Khoa / Viện' },
      { path: '/admin/classes', icon: School, label: 'Lớp sinh hoạt' },
      { path: '/admin/subjects', icon: BookOpen, label: 'Môn học' },
      { path: '/admin/semesters', icon: CalendarDays, label: 'Học kỳ & Niên giám' },
      { path: '/admin/tuition', icon: DollarSign, label: 'Quản lý cổng Thu ngân' },
    ]
  },
  {
    group: 'Giám sát & Kiểm toán',
    items: [
      { path: '/admin/course-sections', icon: Layers, label: 'Lớp học phần (R)' },
      { path: '/admin/grades', icon: ClipboardList, label: 'Kiểm toán sổ điểm' },
      { path: '/admin/grade-audit-logs', icon: ShieldCheck, label: 'Nhật ký kiểm toán điểm' },
      { path: '/admin/grade-amendments', icon: ShieldCheck, label: 'Sửa điểm sau khóa' },
    ]
  }
];

const academicNavGroups = [
  {
    group: 'Tổng quan',
    items: [
      { path: '/academic/dashboard', icon: LayoutDashboard, label: 'Tổng quan Đào tạo' },
    ]
  },
  {
    group: 'Quản lý Đào tạo',
    items: [
      { path: '/academic/students', icon: Users, label: 'Hồ sơ Sinh viên (CRUD)' },
      { path: '/academic/classes', icon: School, label: 'Lớp sinh hoạt' },
      { path: '/academic/departments', icon: Building2, label: 'Khoa / Viện' },
      { path: '/academic/subjects', icon: BookOpen, label: 'Khung CTĐT & Môn học' },
    ]
  },
  {
    group: 'Kế hoạch & Lớp học phần',
    items: [
      { path: '/academic/semesters', icon: CalendarDays, label: 'Học kỳ & Đợt ĐK' },
      { path: '/academic/course-sections', icon: Layers, label: 'Mở lớp học phần (CRUD)' },
      { path: '/academic/schedules', icon: Calendar, label: 'Xếp thời khóa biểu' },
      { path: '/academic/exam-rooms', icon: Calendar, label: 'Khảo thí & Phòng thi' },
    ]
  },
  {
    group: 'Khảo thí, Điểm & Tốt nghiệp',
    items: [
      { path: '/academic/grades', icon: ClipboardList, label: 'Sổ điểm (Mở/Khóa)' },
      { path: '/academic/grade-audit-logs', icon: ShieldCheck, label: 'Nhật ký kiểm toán điểm' },
      { path: '/academic/grade-appeals', icon: ClipboardList, label: 'Duyệt phúc khảo điểm' },
      { path: '/academic/grade-amendments', icon: ShieldCheck, label: 'Sửa điểm sau khóa' },
      { path: '/academic/academic-warnings', icon: AlertTriangle, label: 'Cảnh báo học vụ' },
      { path: '/academic/graduation', icon: GraduationCap, label: 'Xét tốt nghiệp' },
      { path: '/academic/tuition', icon: DollarSign, label: 'Báo cáo học phí (R)' },
    ]
  }
];

const examOfficerNavGroups = [
  {
    group: 'Tổng quan',
    items: [
      { path: '/exam/rooms', icon: LayoutDashboard, label: 'Cổng Khảo thí' },
    ]
  },
  {
    group: 'Quản lý Thi & Điểm',
    items: [
      { path: '/exam/rooms', icon: Calendar, label: 'Ca thi & Phòng thi' },
      { path: '/exam/audit-logs', icon: ShieldCheck, label: 'Nhật ký kiểm toán điểm' },
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
      { path: '/lecturer/grade-appeals', icon: ClipboardList, label: 'Đề xuất phúc khảo' },
      { path: '/lecturer/grade-amendments', icon: ShieldCheck, label: 'Đơn sửa điểm sau khóa' },
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
      { path: '/student/transcript', icon: Award, label: 'Kết quả học tập & Tốt nghiệp' },
      { path: '/student/curriculum', icon: Layers, label: 'Chương trình đào tạo' },
    ]
  },
  {
    group: 'Tài khoản',
    items: [
      { path: '/student/profile', icon: UserCog, label: 'Hồ sơ sinh viên' },
    ]
  }
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }) {
  const { user } = useAuthStore();
  const role = user?.role;
  const [pendingResets, setPendingResets] = useState(0);

  useEffect(() => {
    if (role === 'ADMIN') {
      let isMounted = true;
      const fetchPending = async () => {
        try {
          const res = await passwordResetService.getPendingCount();
          const count = res?.data?.data?.count ?? res?.data?.count;
          if (isMounted && count !== undefined) {
            setPendingResets(count);
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

  const groups = (role === 'EXAMINATION_OFFICER')
    ? examOfficerNavGroups
    : (role === 'ACADEMIC_AFFAIRS' || role === 'ACADEMIC_STAFF')
    ? academicNavGroups
    : role === 'ADMIN'
    ? adminNavGroups
    : role === 'LECTURER'
    ? lecturerNavGroups
    : studentNavGroups;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <SmsLogo size={32} />
          {(!collapsed || mobileOpen) && (
            <div className="sidebar-brand-text">
              <span className="brand-name">SMS Portal</span>
              <span className="brand-sub">
                {(role === 'ACADEMIC_AFFAIRS' || role === 'ACADEMIC_STAFF') ? 'Phòng Đào tạo' : role === 'ADMIN' ? 'Quản trị hệ thống' : role === 'LECTURER' ? 'Giảng viên' : 'Sinh viên'}
              </span>
            </div>
          )}
        </div>

        {/* Nút đóng / thu gọn: trên desktop thì toggle collapse, trên mobile drawer thì close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {mobileOpen && (
            <button
              className="btn-icon mobile-close-btn"
              onClick={onCloseMobile}
              title="Đóng menu"
              aria-label="Đóng menu"
            >
              <X size={18} />
            </button>
          )}
          <button
            className="btn-icon btn-toggle-sidebar"
            onClick={onToggle}
            title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>

      {/* Nav Groups */}
      <nav className="sidebar-nav">
        {groups.map((grp) => (
          <div key={grp.group} className="nav-group">
            {(!collapsed || mobileOpen) && <div className="nav-group-title">{grp.group}</div>}
            <div className="nav-group-items">
              {grp.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      if (mobileOpen && onCloseMobile) onCloseMobile();
                    }}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    title={collapsed && !mobileOpen ? item.label : undefined}
                  >
                    <span className="nav-item-icon"><Icon size={18} /></span>
                    {(!collapsed || mobileOpen) && (
                      <span className="nav-item-label">{item.label}</span>
                    )}
                    {item.showBadge && pendingResets > 0 && (!collapsed || mobileOpen) && (
                      <span className="nav-item-badge">{pendingResets}</span>
                    )}
                    {item.showBadge && pendingResets > 0 && collapsed && !mobileOpen && (
                      <span className="nav-item-badge-dot" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
