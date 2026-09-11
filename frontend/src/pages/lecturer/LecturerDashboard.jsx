import { useState, useEffect } from 'react';
import { Layers, Users, ClipboardCheck, BookOpen, Clock, ArrowUpRight, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { courseSectionService, lecturerService } from '../../services/dataService';
import useAuthStore from '../../store/authStore';

export default function LecturerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [mySections, setMySections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resProfile, resSec] = await Promise.all([
        lecturerService.getMe(),
        courseSectionService.getMySections(),
      ]);
      setProfile(resProfile.data.data);
      setMySections(resSec.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = mySections.reduce((acc, s) => acc + (s.currentStudents || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Cổng Giảng Viên — {profile?.fullName || user?.username}</h1>
          <p>
            Khoa: {profile?.department?.name || 'Chưa cập nhật'} • Học vị: {profile?.degree || 'Giảng viên'} • Mã GV: {profile?.lecturerCode}
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/lecturer/profile')}>
            Hồ sơ cá nhân
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
            }}
          >
            <Layers size={22} />
          </div>
          <div>
            <div className="stat-value">{mySections.length}</div>
            <div className="stat-label">Lớp học phần phụ trách</div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success)',
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <div className="stat-value">{totalStudents}</div>
            <div className="stat-label">Tổng số sinh viên theo học</div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{
              backgroundColor: 'var(--info-bg)',
              color: 'var(--info)',
            }}
          >
            <GraduationCap size={22} />
          </div>
          <div>
            <div className="stat-value">{profile?.department?.code || 'CNTT'}</div>
            <div className="stat-label">Bộ môn chuyên trách</div>
          </div>
        </div>
      </div>

      {/* Quick list of current classes */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h3>Lớp học phần đang phụ trách giảng dạy kỳ này</h3>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => navigate('/lecturer/sections')}
          >
            Xem tất cả
          </button>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã Lớp HP</th>
                <th>Tên Môn Học</th>
                <th>Số Tín Chỉ</th>
                <th>Lịch Học Chi Tiết</th>
                <th>Phòng Học</th>
                <th>Sĩ Số Lớp</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Đang tải danh sách lớp học phần...
                  </td>
                </tr>
              ) : mySections.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Thầy/Cô chưa được phân công lớp học phần nào trong học kỳ này.
                  </td>
                </tr>
              ) : (
                mySections.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: 'var(--primary)',
                          backgroundColor: 'var(--primary-light)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--primary-border)'
                        }}
                      >
                        {s.sectionCode}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.subject?.subjectName}</td>
                    <td><span className="badge badge-info">{s.subject?.credits} TC</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.schedule || '—'}</td>
                    <td><span className="badge badge-neutral">{s.room || '—'}</span></td>
                    <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {s.currentStudents || 0} / {s.maxStudents}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/lecturer/grades?sectionId=${s.id}`)}
                      >
                        <span>Nhập điểm</span>
                        <ArrowUpRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
