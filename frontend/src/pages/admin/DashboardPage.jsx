import { useState, useEffect } from 'react';
import {
  Users, GraduationCap, School, BookOpen, UserCog, Layers, Award,
  TrendingUp, ArrowUpRight, CheckCircle2, Clock, Calendar
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { dashboardService } from '../../services/dataService';

const CHART_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getDashboard();
      setData(res.data.data);
    } catch (err) {
      console.error('Error fetching dashboard', err);
    } finally {
      setLoading(false);
    }
  };

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
    { label: 'Tổng sinh viên', val: data?.totalStudents || 0, icon: Users, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Sinh viên đang học', val: data?.activeStudents || 0, icon: GraduationCap, color: '#059669', bg: '#ecfdf5' },
    { label: 'Giảng viên', val: data?.totalLecturers || 0, icon: UserCog, color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'Khoa đào tạo', val: data?.totalDepartments || 0, icon: School, color: '#d97706', bg: '#fffbeb' },
    { label: 'Lớp sinh hoạt', val: data?.totalClasses || 0, icon: School, color: '#0284c7', bg: '#f0f9ff' },
    { label: 'Môn học', val: data?.totalSubjects || 0, icon: BookOpen, color: '#db2777', bg: '#fdf2f8' },
    { label: 'Lớp học phần', val: data?.totalCourseSections || 0, icon: Layers, color: '#4f46e5', bg: '#eef2ff' },
    { label: 'Đã tốt nghiệp', val: data?.graduatedStudents || 0, icon: Award, color: '#0d9488', bg: '#f0fdfa' },
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
        {statCards.map((c, i) => (
          <div key={i} className="stat-card">
            <div
              className="stat-icon-wrapper"
              style={{ background: c.bg, color: c.color }}
            >
              <c.icon size={22} />
            </div>
            <div>
              <div className="stat-value">{c.val}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
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
                      borderColor: 'var(--border-color)',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-md)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                    cursor={{ fill: 'var(--bg-subtle)' }}
                  />
                  <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={38} />
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
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-color)',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-md)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
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
