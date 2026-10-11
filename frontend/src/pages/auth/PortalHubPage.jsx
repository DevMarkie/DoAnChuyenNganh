import { Link } from 'react-router-dom';
import SmsLogo from '../../components/common/SmsLogo';

const Chevron = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const DOORS = [
  { id: 'student', name: 'Sinh viên', accent: '#2563eb', path: '/student/login',
    desc: 'Đăng ký học phần, tra cứu thời khóa biểu và bảng điểm GPA/CPA.' },
  { id: 'lecturer', name: 'Giảng viên & cán bộ', accent: '#0d9488', path: '/lecturer/login',
    desc: 'Quản lý lớp học phần, vào điểm và theo dõi lịch giảng dạy theo kỳ.' },
  { id: 'admin', name: 'Phòng đào tạo', accent: '#d97706', path: '/admin/login',
    desc: 'Quản trị khoa ngành, người dùng, chương trình đào tạo và báo cáo toàn trường.' },
];

export default function PortalHubPage() {
  return (
    <main className="hub">
      <aside className="hub-mast">
        <div className="hub-anim" style={{ animationDelay: '0.05s', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SmsLogo size={34} />
          <div>
            <div className="mast-brand-name">SMS University</div>
            <div className="mast-brand-sub">Cổng thông tin đào tạo trực tuyến</div>
          </div>
        </div>

        <div>
          <h1 className="hub-title hub-anim" style={{ animationDelay: '0.12s' }}>
            Cổng thông tin<br />đào tạo tín chỉ
          </h1>
          <p className="hub-sub hub-anim" style={{ animationDelay: '0.19s' }}>
            Một hệ thống cho cả hành trình học vụ, từ đăng ký học phần đến bảng điểm tích lũy.
          </p>
        </div>

        {/* shortcut: học kỳ + trạng thái đăng ký đang hardcode; thay bằng API kỳ hiện tại khi có */}
        <div className="hub-anim" style={{ animationDelay: '0.26s' }}>
          <div className="hub-term"><b>Học kỳ 1</b>&nbsp;&nbsp;năm học 2025–2026</div>
          <span className="hub-live"><i />Đợt đăng ký tín chỉ đang mở</span>
        </div>
      </aside>

      <section className="hub-entry">
        <h2 className="hub-head hub-anim" style={{ animationDelay: '0.12s' }}>Chọn cổng của bạn</h2>
        <p className="hub-lead hub-anim" style={{ animationDelay: '0.19s' }}>
          Mỗi vai trò là một phân hệ riêng, bảo mật độc lập. Chọn đúng cổng để tiếp tục.
        </p>

        <div className="hub-doors">
          {DOORS.map((door, i) => (
            <Link
              key={door.id}
              to={door.path}
              className="hub-door hub-anim"
              style={{ '--role': door.accent, animationDelay: `${0.26 + i * 0.07}s` }}
            >
              <div>
                <div className="name">{door.name}</div>
                <div className="desc">{door.desc}</div>
              </div>
              <span className="hub-go"><Chevron /></span>
            </Link>
          ))}
        </div>

        <p className="hub-foot hub-anim" style={{ animationDelay: '0.47s' }}>
          Quên mật khẩu? Mở cổng tương ứng rồi chọn “Gửi yêu cầu cấp lại” để Phòng đào tạo xử lý.
        </p>
      </section>
    </main>
  );
}
