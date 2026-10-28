import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  studentService, 
  courseSectionService, 
  gradeAppealService, 
  gradeService 
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
  ClipboardCheck,
  Building
} from 'lucide-react';

export default function AcademicDashboardPage() {
  const [stats, setStats] = useState({
    studentsCount: 0,
    sectionsCount: 0,
    appealsPending: 0,
    gradeOverviewCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [studentsRes, sectionsRes, appealsRes] = await Promise.allSettled([
        studentService.getAll(),
        courseSectionService.getAll(),
        gradeAppealService.getAll({ status: 'PENDING' }),
      ]);

      setStats({
        studentsCount: studentsRes.status === 'fulfilled' ? (studentsRes.value.data?.data?.length || 0) : 0,
        sectionsCount: sectionsRes.status === 'fulfilled' ? (sectionsRes.value.data?.data?.length || 0) : 0,
        appealsPending: appealsRes.status === 'fulfilled' ? (appealsRes.value.data?.data?.length || 0) : 0,
      });
    } catch (err) {
      console.error('Lỗi nạp dashboard đào tạo:', err);
    } finally {
      setLoading(false);
    }
  };

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
      title: 'Chạy thuật toán Xét tốt nghiệp',
      desc: 'Thực thi thuật toán quét chuẩn đầu ra theo khóa/ngành, phê duyệt tốt nghiệp và xuất quyết định.',
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
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
        borderRadius: '16px',
        padding: '28px 32px',
        color: '#fff',
        marginBottom: '28px',
        boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', marginBottom: '12px' }}>
            <Sparkles size={14} /> Phân hệ Quản lý Đào tạo & Học vụ
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            Chào mừng Cán bộ Phòng Đào tạo
          </h1>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9, lineHeight: '1.6' }}>
            Hệ thống cung cấp đầy đủ các công cụ điều hành học vụ: thiết lập chương trình đào tạo, mở lớp học phần, thẩm định điều kiện tốt nghiệp và phê duyệt phúc khảo điểm theo đúng Ma trận phân quyền.
          </p>
        </div>

        <Link
          to="/academic/graduation"
          style={{
            background: '#fff',
            color: '#7c3aed',
            padding: '12px 20px',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '14px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}
        >
          <GraduationCap size={18} />
          <span>Xét tốt nghiệp ngay</span>
        </Link>
      </div>

      {/* Section Title */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>
          Nghiệp vụ Chuyên trách Phòng Đào tạo
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
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
                background: '#fff',
                borderRadius: '12px',
                border: card.highlight ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                padding: '20px',
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                position: 'relative',
                boxShadow: card.highlight ? '0 4px 12px rgba(124, 58, 237, 0.1)' : '0 1px 3px rgba(0,0,0,0.05)'
              }}
              className="dashboard-card"
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: `color-mix(in srgb, ${card.color} 12%, transparent)`,
                    color: card.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon size={22} />
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: `color-mix(in srgb, ${card.color} 10%, transparent)`,
                    color: card.color,
                  }}>
                    {card.badge}
                  </span>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px' }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                  {card.desc}
                </p>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: card.color }}>
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
