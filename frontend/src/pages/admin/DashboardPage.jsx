import { useState, useEffect } from 'react';
import {
  Users, GraduationCap, School, BookOpen, UserCog, Layers, Award,
  TrendingUp, Calendar
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid, Legend } from 'recharts';
import { dashboardService } from '../../services/dataService';

const CHART_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#38bdf8', '#34d399'];

const CARD_THEMES = [
  { bg: 'rgba(99, 102, 241, 0.08)', border: 'rgba(99, 102, 241, 0.25)', iconGrad: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)', shadow: 'rgba(99, 102, 241, 0.4)' },
  { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.25)', iconGrad: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', shadow: 'rgba(16, 185, 129, 0.4)' },
  { bg: 'rgba(6, 182, 212, 0.08)', border: 'rgba(6, 182, 212, 0.25)', iconGrad: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', shadow: 'rgba(6, 182, 212, 0.4)' },
  { bg: 'rgba(139, 92, 246, 0.08)', border: 'rgba(139, 92, 246, 0.25)', iconGrad: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', shadow: 'rgba(139, 92, 246, 0.4)' },
  { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.25)', iconGrad: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', shadow: 'rgba(245, 158, 11, 0.4)' },
  { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.25)', iconGrad: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', shadow: 'rgba(59, 130, 246, 0.4)' },
  { bg: 'rgba(236, 72, 153, 0.08)', border: 'rgba(236, 72, 153, 0.25)', iconGrad: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', shadow: 'rgba(236, 72, 153, 0.4)' },
  { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.25)', iconGrad: 'linear-gradient(135deg, #10b981 0%, #84cc16 100%)', shadow: 'rgba(16, 185, 129, 0.4)' },
];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await dashboardService.getDashboard();
        setData(res.data.data);
      } catch {
        // console.error removed for security
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{
          width: '36px', height: '36px', border: '3px solid var(--border-color)',
          borderTopColor: 'var(--primary)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
        }} />
        <p style={{ fontWeight: 500 }}>Đang tổng hợp dữ liệu đào tạo...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Tổng sinh viên', val: data?.totalStudents || 0, icon: Users },
    { label: 'Sinh viên đang học', val: data?.activeStudents || 0, icon: GraduationCap },
    { label: 'Giảng viên', val: data?.totalLecturers || 0, icon: UserCog },
    { label: 'Khoa đào tạo', val: data?.totalDepartments || 0, icon: School },
    { label: 'Lớp sinh hoạt', val: data?.totalClasses || 0, icon: School },
    { label: 'Môn học', val: data?.totalSubjects || 0, icon: BookOpen },
    { label: 'Lớp học phần', val: data?.totalCourseSections || 0, icon: Layers },
    { label: 'Đã tốt nghiệp', val: data?.graduatedStudents || 0, icon: Award },
  ];

  const deptData = data?.studentsByDepartment?.map(d => ({
    name: d.name || d.code,
    count: d.total || d.count || 0
  })) || [];

  const statusData = data?.studentsByStatus?.map(s => ({
    name: s.name === 'Đang học' || s.status === 'STUDYING' || s.status === 'ACTIVE' ? 'Đang học'
      : s.name === 'Tốt nghiệp' || s.status === 'GRADUATED' ? 'Đã tốt nghiệp'
      : s.name === 'Đình chỉ' || s.status === 'SUSPENDED' ? 'Tạm đình chỉ'
      : 'Khác',
    value: s.total || s.count || 0
  })) || [];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Tổng Quan Quản Lý Đào Tạo</h1>
          <p>Báo cáo chỉ số hoạt động và cơ cấu đào tạo sinh viên toàn trường</p>
        </div>
        <div className="page-header-actions">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            fontWeight: 500
          }}>
            <Calendar size={15} color="var(--primary)" />
            <span>Học kỳ 1 (2025 - 2026)</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="stats-grid">
        {statCards.map((c, i) => {
          const theme = CARD_THEMES[i % CARD_THEMES.length];
          return (
            <div
              key={i}
              className="stat-card"
              style={{
                position: 'relative',
                overflow: 'hidden',
                background: `linear-gradient(135deg, ${theme.bg} 0%, var(--bg-surface) 100%)`,
                borderColor: theme.border,
              }}
            >
              <div
                className="stat-icon-wrapper"
                style={{
                  background: theme.iconGrad,
                  color: '#ffffff',
                  boxShadow: `0 4px 14px 0 ${theme.shadow}`,
                }}
              >
                <c.icon size={22} />
              </div>
              <div>
                <div className="stat-value">{c.val}</div>
                <div className="stat-label">{c.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
        gap: '20px',
        marginTop: '24px'
      }}>
        {/* Department Distribution Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--primary)" />
              <h3>Phân bố sinh viên theo Khoa đào tạo</h3>
            </div>
          </div>
          <div className="card-body" style={{ height: '340px' }}>
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 20, right: 20, left: -10, bottom: 25 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border-color)' }}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border-color)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      backdropFilter: 'var(--glass-blur)',
                      WebkitBackdropFilter: 'var(--glass-blur)',
                      borderColor: 'var(--border-color)',
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow-md), var(--glass-inset-shine)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                    cursor={{ fill: 'var(--bg-subtle)' }}
                  />
                  <Bar dataKey="count" fill="url(#barGradient)" radius={[8, 8, 0, 0]} barSize={38} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: '90px', color: 'var(--text-muted)' }}>
                Chưa có dữ liệu thống kê khoa
              </div>
            )}
          </div>
        </div>

        {/* Student Status Distribution Pie Chart */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={18} color="#059669" />
              <h3>Cơ cấu tình trạng học tập của sinh viên</h3>
            </div>
          </div>
          <div className="card-body" style={{ height: '340px' }}>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ percent }) => (percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : '')}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      backdropFilter: 'var(--glass-blur)',
                      WebkitBackdropFilter: 'var(--glass-blur)',
                      borderColor: 'var(--border-color)',
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow-md), var(--glass-inset-shine)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '10px' }}
                    formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: '90px', color: 'var(--text-muted)' }}>
                Chưa có dữ liệu tình trạng
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
