import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  studentService, 
  courseSectionService, 
  gradeAppealService 
} from '../../services/dataService';
import { 
  Users, 
  BookOpen, 
  Layers, 
  Calendar, 
  FileCheck2, 
  GraduationCap, 
  DollarSign, 
  ArrowRight,
  Sparkles,
  ClipboardCheck
} from 'lucide-react';

export default function AcademicDashboardPage() {
  const [stats, setStats] = useState({
    studentsCount: 0,
    sectionsCount: 0,
    appealsPending: 0,
    gradeOverviewCount: 0,
  });

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [studentsRes, sectionsRes, appealsRes] = await Promise.allSettled([
          studentService.getAll(),
          courseSectionService.getAll(),
          gradeAppealService.getAll({ status: 'PENDING' }),
        ]);

        setStats({
          studentsCount: studentsRes.status === 'fulfilled' ? (studentsRes.value.data?.data?.length || 0) : 0,
          sectionsCount: sectionsRes.status === 'fulfilled' ? (sectionsRes.value.data?.data?.length || 0) : 0,
          appealsPending: appealsRes.status === 'fulfilled' ? (appealsRes.value.data?.data?.length || 0) : 0,
          gradeOverviewCount: 0,
        });
      } catch (err) {
        console.error('Lỗi nạp dashboard đào tạo:', err);
      }
    }
    loadDashboardData();
  }, []);

  const businessCards = [
    {
      title: 'Quản lý Hồ sơ Sinh viên',
      desc: 'Toàn quyền CRUD hồ sơ sinh viên, nhập danh sách Excel, quản lý chuyên ngành và lớp sinh hoạt.',
      path: '/academic/students',
      icon: Users,
      color: '#2563eb',
      badge: `${stats.studentsCount} sinh viên`,
    },
    {
      title: 'Khung Chương trình & Môn học',
      desc: 'Quản lý khối kiến thức, môn học bắt buộc/tự chọn và điều kiện tiên quyết cho các chuyên ngành.',
      path: '/academic/subjects',
      icon: BookOpen,
      color: '#0d9488',
      badge: 'Chuẩn tín chỉ',
    },
    {
      title: 'Mở Lớp học phần & Phân công',
      desc: 'Toàn quyền mở lớp HP, phân công giảng viên giảng dạy, cấu hình sĩ số và xếp thời khóa biểu.',
      path: '/academic/course-sections',
      icon: Layers,
      color: '#7c3aed',
      badge: `${stats.sectionsCount} lớp HP`,
    },
    {
      title: 'Khảo thí & Lịch thi học kỳ',
      desc: 'Xếp phòng thi, phân công giám thị, danh sách ca thi và quản lý phòng máy khảo thí.',
      path: '/academic/exam-rooms',
      icon: Calendar,
      color: '#ea580c',
      badge: 'Khảo thí',
    },
    {
      title: 'Sổ điểm & Mở/Khóa sổ điểm',
      desc: 'Giám sát tiến độ vào điểm toàn trường, mở khóa cho GV sửa điểm và chốt công bố điểm cho SV.',
      path: '/academic/grades',
      icon: ClipboardCheck,
      color: '#0284c7',
      badge: 'Quản lý sổ điểm',
    },
    {
      title: 'Phê duyệt Kết quả Phúc khảo',
      desc: 'Tiếp nhận đơn phúc khảo đã được Giảng viên đề xuất điểm mới và niêm phong phê duyệt cập nhật sổ điểm.',
      path: '/academic/grade-appeals',
      icon: FileCheck2,
      color: '#e11d48',
      badge: `${stats.appealsPending} chờ duyệt`,
    },
    {
      title: 'Hội đồng Xét tốt nghiệp',
      desc: 'Thẩm định chuẩn đầu ra theo khóa/ngành, phê duyệt tốt nghiệp và xuất quyết định.',
      path: '/academic/graduation',
      icon: GraduationCap,
      color: '#16a34a',
      badge: 'Nghiệp vụ Đào tạo',
      highlight: true,
    },
    {
      title: 'Báo cáo Học phí & Công nợ',
      desc: 'Theo dõi báo cáo tiến độ nộp học phí, danh sách sinh viên nợ phí để xử lý đăng ký và tốt nghiệp.',
      path: '/academic/tuition',
      icon: DollarSign,
      color: '#ca8a04',
      badge: 'Báo cáo',
    },
  ];

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Welcome Banner — Minimalist Academic Header */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        color: 'var(--text-main)',
        marginBottom: '28px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '12px',
            border: '1px solid var(--primary-border)'
          }}>
            <Sparkles size={14} /> Phân hệ Quản lý Đào tạo & Học vụ
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 8px', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
            Chào mừng Cán bộ Phòng Đào tạo
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Hệ thống cung cấp đầy đủ các công cụ điều hành học vụ: thiết lập chương trình đào tạo, mở lớp học phần, thẩm định điều kiện tốt nghiệp và phê duyệt phúc khảo điểm theo đúng Ma trận phân quyền.
          </p>
        </div>

        <Link
          to="/academic/graduation"
          className="btn btn-primary"
          style={{
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            fontWeight: '600',
            fontSize: '14px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <GraduationCap size={18} />
          <span>Xét tốt nghiệp ngay</span>
        </Link>
      </div>

      {/* Section Title */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px' }}>
          Nghiệp vụ Chuyên trách Phòng Đào tạo
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
          Truy cập nhanh các chức năng theo đúng thẩm quyền được phân định
        </p>
      </div>

      {/* Business Function Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '18px' }}>
        {businessCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.path}
              to={card.path}
              style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: card.highlight ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                padding: '20px',
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
                position: 'relative',
                boxShadow: 'var(--shadow-xs)'
              }}
              className="dashboard-card"
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-subtle)',
                    color: card.highlight ? 'var(--primary)' : 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon size={20} />
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: card.highlight ? 'var(--primary-light)' : 'var(--bg-subtle)',
                    color: card.highlight ? 'var(--primary)' : 'var(--text-muted)',
                    border: '1px solid var(--border-color)'
                  }}>
                    {card.badge}
                  </span>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 6px' }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                  {card.desc}
                </p>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--primary)' }}>
                <span>Truy cập nghiệp vụ</span>
                <ArrowRight size={14} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
