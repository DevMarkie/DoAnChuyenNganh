import { Link } from 'react-router-dom';
import SmsLogo from '../../components/common/SmsLogo';
import { PortalStudentIcon, PortalLecturerIcon, PortalAdminIcon } from '../../components/icons';
import useAuthStore from '../../store/authStore';

const Chevron = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const DOORS = [
  {
    id: 'student',
    name: 'Sinh viên',
    accent: '#2563eb',
    path: '/student/login',
    dashboardPath: '/student/dashboard',
    desc: 'Đăng ký học phần, tra cứu thời khóa biểu và bảng điểm GPA/CPA.',
    Icon: PortalStudentIcon
  },
  {
    id: 'lecturer',
    name: 'Giảng viên',
    accent: '#0d9488',
    path: '/lecturer/login',
    dashboardPath: '/lecturer/dashboard',
    desc: 'Quản lý lớp học phần, vào điểm và theo dõi lịch giảng dạy theo kỳ.',
    Icon: PortalLecturerIcon
  },
  {
    id: 'academic',
    name: 'Cán bộ Đào tạo & Khảo thí',
    accent: '#7c3aed',
    path: '/academic/login',
    dashboardPath: '/academic/dashboard',
    desc: 'Quản lý đào tạo, khung chương trình, mở lớp, phòng thi và xét tốt nghiệp.',
    Icon: PortalAdminIcon
  },
  {
    id: 'admin',
    name: 'Quản trị viên',
    accent: '#d97706',
    path: '/admin/login',
    dashboardPath: '/admin/dashboard',
    desc: 'Quản trị hệ thống, phân quyền, cấu hình bảo mật và giám sát kiểm toán.',
    Icon: PortalAdminIcon
  },
];

export default function PortalHubPage() {
  const { hasPortalSession } = useAuthStore();

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

        <div className="hub-anim" style={{ animationDelay: '0.26s' }}>
          <div className="hub-term"><b>Học kỳ 1</b>&nbsp;&nbsp;năm học 2026–2027</div>
          <span className="hub-live"><i />Đợt đăng ký tín chỉ đang mở</span>
        </div>
      </aside>

      <section className="hub-entry">
        <h2 className="hub-head hub-anim" style={{ animationDelay: '0.12s' }}>Chọn cổng của bạn</h2>
        <p className="hub-lead hub-anim" style={{ animationDelay: '0.19s' }}>
          Mỗi vai trò là một phân hệ riêng, bảo mật độc lập. Chọn đúng cổng để tiếp tục.
        </p>

        <div className="hub-doors">
          {DOORS.map((door, i) => {
            const DoorIcon = door.Icon;
            const isSessionActive = hasPortalSession(door.id) || (door.id === 'academic' && hasPortalSession('exam'));
            let targetPath = isSessionActive ? door.dashboardPath : door.path;
            if (door.id === 'academic' && hasPortalSession('exam') && !hasPortalSession('academic')) {
              targetPath = '/exam/rooms';
            }
            return (
              <Link
                key={door.id}
                to={targetPath}
                data-portal={door.id}
                className="hub-door hub-anim"
                style={{ '--role': door.accent, animationDelay: `${0.26 + i * 0.07}s` }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  <div
                    className="hub-door-icon"
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'color-mix(in srgb, var(--role) 12%, transparent)',
                      color: 'var(--role)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <DoorIcon size={26} />
                  </div>
                  <div>
                    <div className="name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {door.name}
                      {isSessionActive && (
                        <span style={{
                          fontSize: '0.68rem',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: '#047857',
                          color: '#ffffff',
                          fontWeight: 700,
                        }}>
                          ● Đang mở phiên
                        </span>
                      )}
                    </div>
                    <div className="desc">{door.desc}</div>
                  </div>
                </div>
                <span className="hub-go"><Chevron /></span>
              </Link>
            );
          })}
        </div>

        <p className="hub-foot hub-anim" style={{ animationDelay: '0.52s' }}>
          Quên mật khẩu? Mở cổng tương ứng rồi chọn “Gửi yêu cầu cấp lại” để được hỗ trợ.
        </p>
      </section>
    </main>
  );
}
