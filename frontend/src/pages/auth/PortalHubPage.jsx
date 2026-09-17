import { Link } from 'react-router-dom';
import {
  GraduationCap, BookOpen, ShieldAlert, ArrowRight,
  Sparkles, CheckCircle2, ShieldCheck, School
} from 'lucide-react';

export default function PortalHubPage() {
  const portals = [
    {
      id: 'student',
      title: 'Cổng Sinh Viên',
      roleTag: 'Dành cho Sinh viên',
      tagColor: '#2563eb',
      tagBg: '#eff6ff',
      tagBorder: '#bfdbfe',
      icon: GraduationCap,
      description: 'Hệ thống tra cứu thời khóa biểu, điểm tích lũy và đăng ký học phần tín chỉ trực tuyến.',
      path: '/student/login',
      buttonText: 'Truy cập Cổng Sinh viên',
      buttonBg: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
      features: [
        'Đăng ký môn học / học phần trực tuyến',
        'Tra cứu thời khóa biểu và phòng học',
        'Xem bảng điểm quá trình, GPA/CPA chuẩn tín chỉ'
      ]
    },
    {
      id: 'lecturer',
      title: 'Cổng Giảng Viên',
      roleTag: 'Dành cho Cán bộ & Giảng viên',
      tagColor: '#0d9488',
      tagBg: '#f0fdfa',
      tagBorder: '#99f6e4',
      icon: BookOpen,
      description: 'Hệ thống theo dõi lịch giảng dạy, danh sách lớp học phần và vào sổ điểm đánh giá sinh viên.',
      path: '/lecturer/login',
      buttonText: 'Truy cập Cổng Giảng viên',
      buttonBg: 'linear-gradient(135deg, #0f766e, #0d9488)',
      features: [
        'Theo dõi lịch giảng dạy phân công theo kỳ',
        'Quản lý danh sách sinh viên theo lớp học phần',
        'Nhập điểm chuyên cần, giữa kỳ & thi kết thúc môn'
      ]
    },
    {
      id: 'admin',
      title: 'Cổng Quản Trị Viên',
      roleTag: 'Phòng Đào tạo & Quản trị',
      tagColor: '#475569',
      tagBg: '#f1f5f9',
      tagBorder: '#cbd5e1',
      icon: ShieldAlert,
      description: 'Phân hệ quản trị toàn diện hệ thống: cơ cấu tổ chức, người dùng, chương trình đào tạo & cấu hình.',
      path: '/admin/login',
      buttonText: 'Truy cập Cổng Quản trị',
      buttonBg: 'linear-gradient(135deg, #0f172a, #334155)',
      features: [
        'Quản lý Khoa, Ngành, Môn học & Lớp học',
        'Phân quyền tài khoản RBAC & Đợt đăng ký tín chỉ',
        'Báo cáo thống kê toàn trường & Giám sát hệ thống'
      ]
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-app)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      {/* Top Navigation Bar */}
      <header style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)'
          }}>
            <School size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              PHENIKAA UNIVERSITY
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Cổng Thông Tin Đào Tạo Trực Tuyến (SMS Portal)
            </div>
          </div>
        </div>

        <div style={{
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
          <span>Hệ thống phân quyền bảo mật 3 lớp</span>
        </div>
      </header>

      {/* Main Body */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '56px 24px',
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        {/* Banner Title */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            padding: '6px 16px',
            borderRadius: '999px',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '16px',
            border: '1px solid var(--primary-border)'
          }}>
            <Sparkles size={15} />
            <span>HỆ THỐNG QUẢN LÝ ĐÀO TẠO TÍN CHỈ</span>
          </div>

          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            letterSpacing: '-0.03em',
            marginBottom: '12px'
          }}>
            Lựa Chọn Cổng Đăng Nhập
          </h1>

          <p style={{
            fontSize: '1.05rem',
            color: 'var(--text-muted)',
            maxWidth: '620px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Hệ thống tách biệt hoàn toàn 3 phân hệ độc lập nhằm đảm bảo tính bảo mật và trải nghiệm chuyên biệt cho từng vai trò người dùng.
          </p>
        </div>

        {/* 3 Portal Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  padding: '32px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                className="portal-card"
              >
                <div>
                  {/* Top: Tag + Icon */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: portal.tagBg,
                      color: portal.tagColor,
                      border: `1px solid ${portal.tagBorder}`,
                      letterSpacing: '0.02em'
                    }}>
                      {portal.roleTag}
                    </span>

                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      backgroundColor: portal.tagBg,
                      color: portal.tagColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${portal.tagBorder}`
                    }}>
                      <Icon size={24} />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h2 style={{
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    color: 'var(--text-main)',
                    marginBottom: '10px'
                  }}>
                    {portal.title}
                  </h2>

                  <p style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.6,
                    marginBottom: '24px'
                  }}>
                    {portal.description}
                  </p>

                  {/* Features bullet points */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    marginBottom: '32px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-color)'
                  }}>
                    {portal.features.map((feat, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                        <CheckCircle2 size={15} style={{ color: portal.tagColor, marginTop: '2px', flexShrink: 0 }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Button */}
                <Link
                  to={portal.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '13px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: portal.buttonBg,
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    transition: 'transform 0.15s ease'
                  }}
                  className="portal-btn"
                >
                  <span>{portal.buttonText}</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-color)',
        padding: '20px 32px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div>© 2026 Phenikaa University — Đồ Án Chuyên Ngành: Hệ Thống Quản Lý Đào Tạo & Sinh Viên Tín Chỉ</div>
      </footer>
    </div>
  );
}
