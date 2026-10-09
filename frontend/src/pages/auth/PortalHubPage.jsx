import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, ShieldCheck } from 'lucide-react';
import SmsLogo from '../../components/common/SmsLogo';

const PORTAL_THEME = {
  student: {
    accent: '#2563eb',
    accentLight: '#eff6ff',
    accentBorder: '#bfdbfe',
    gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    Icon: GraduationCap,
  },
  lecturer: {
    accent: '#0d9488',
    accentLight: '#f0fdfa',
    accentBorder: '#99f6e4',
    gradient: 'linear-gradient(135deg, #0d9488, #14b8a6)',
    Icon: BookOpen,
  },
  admin: {
    accent: '#d97706',
    accentLight: '#fffbeb',
    accentBorder: '#fde68a',
    gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
    Icon: ShieldCheck,
  },
};

export default function PortalHubPage() {
  const portals = [
    {
      id: 'student',
      title: 'Cổng Sinh viên',
      roleTag: 'Sinh viên',
      description: 'Đăng ký học phần tín chỉ, tra cứu thời khóa biểu và bảng điểm tích lũy GPA/CPA.',
      path: '/student/login',
      features: [
        'Đăng ký môn học / học phần trực tuyến',
        'Tra cứu thời khóa biểu và phòng học',
        'Xem bảng điểm quá trình, GPA/CPA tín chỉ',
      ],
    },
    {
      id: 'lecturer',
      title: 'Cổng Giảng viên',
      roleTag: 'Cán bộ & Giảng viên',
      description: 'Theo dõi lịch giảng dạy, quản lý lớp học phần và vào sổ điểm đánh giá sinh viên.',
      path: '/lecturer/login',
      features: [
        'Theo dõi lịch giảng dạy phân công theo kỳ',
        'Quản lý danh sách sinh viên theo lớp học phần',
        'Nhập điểm chuyên cần, giữa kỳ & kết thúc môn',
      ],
    },
    {
      id: 'admin',
      title: 'Cổng Quản trị viên',
      roleTag: 'Phòng Đào tạo',
      description: 'Quản trị cơ cấu tổ chức, người dùng, chương trình đào tạo và cấu hình hệ thống.',
      path: '/admin/login',
      features: [
        'Quản lý Khoa, Ngành, Môn học & Lớp học',
        'Phân quyền tài khoản và đợt đăng ký tín chỉ',
        'Báo cáo thống kê toàn trường',
      ],
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        borderBottom: '1px solid var(--border-color)',
        padding: '18px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SmsLogo size={36} />
          <div>
            <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
              SMS University
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Cổng thông tin đào tạo trực tuyến
            </div>
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Hệ thống phân quyền 3 vai trò
        </div>
      </header>

      <main style={{
        maxWidth: '1080px', margin: '0 auto', padding: '80px 24px 64px',
        width: '100%', flex: 1,
      }}>
        <div style={{ maxWidth: '640px', marginBottom: '56px' }}>
          <h1 style={{
            fontSize: '2.4rem', fontWeight: 700, color: 'var(--text-main)',
            letterSpacing: '-0.035em', lineHeight: 1.15, marginBottom: '16px',
          }}>
            Chọn cổng đăng nhập
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Ba phân hệ tách biệt cho sinh viên, giảng viên và quản trị — mỗi vai trò một trải nghiệm riêng, bảo mật độc lập.
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px',
        }}>
          {portals.map((portal) => {
            const theme = PORTAL_THEME[portal.id];
            const IconComp = theme.Icon;
            return (
              <div
                key={portal.id}
                className="portal-card"
                data-portal={portal.id}
                style={{
                  backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)', padding: '28px 26px',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                {/* Icon + Role Tag row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                  <div
                    className="portal-icon-container"
                    style={{
                      backgroundColor: theme.accentLight,
                      border: `1px solid ${theme.accentBorder}`,
                    }}
                  >
                    <IconComp size={22} style={{ color: theme.accent }} />
                  </div>
                  <span
                    className="portal-role-tag"
                    style={{
                      color: theme.accent,
                      backgroundColor: theme.accentLight,
                      border: `1px solid ${theme.accentBorder}`,
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: theme.accent }} />
                    {portal.roleTag}
                  </span>
                </div>

                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px', letterSpacing: '-0.02em' }}>
                  {portal.title}
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '22px' }}>
                  {portal.description}
                </p>

                <ul style={{
                  listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '9px',
                  marginBottom: '26px', paddingTop: '20px', borderTop: '1px solid var(--border-color)',
                  flex: 1,
                }}>
                  {portal.features.map((feat, idx) => (
                    <li key={idx} style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <span className="portal-feature-bullet" style={{ backgroundColor: theme.accent }} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link to={portal.path} className="portal-btn" style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: '11px 18px', borderRadius: 'var(--radius-md)',
                  background: theme.gradient, color: '#fff',
                  fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
                }}>
                  Đăng nhập {portal.roleTag}
                </Link>
              </div>
            );
          })}
        </div>
      </main>

      <footer style={{
        borderTop: '1px solid var(--border-color)', padding: '20px 32px',
        fontSize: '0.8rem', color: 'var(--text-light)',
      }}>
        © 2026 SMS University — Hệ thống quản lý đào tạo & sinh viên tín chỉ
      </footer>
    </div>
  );
}
