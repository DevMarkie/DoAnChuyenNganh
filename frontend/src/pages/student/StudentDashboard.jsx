import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, BookOpen, Layers, BookMarked, TrendingUp, ArrowUpRight, GraduationCap } from 'lucide-react';
import { studentService, transcriptService, enrollmentService } from '../../services/dataService';
import useAuthStore from '../../store/authStore';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resProfile, resTrans, resEnr] = await Promise.all([
        studentService.getMe(),
        transcriptService.getMyTranscript(),
        enrollmentService.getMyEnrollments(),
      ]);
      setProfile(resProfile.data.data);
      setTranscript(resTrans.data.data);
      setEnrollments(resEnr.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const gpa = transcript?.cumulativeGpa ? Number(transcript.cumulativeGpa).toFixed(2) : '0.00';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Cổng Sinh Viên — {profile?.fullName || user?.username}</h1>
          <p>
            Mã SV: {profile?.studentCode} • Lớp: {profile?.classEntity?.name || profile?.classEntity?.code || '—'} • Khoa: {profile?.classEntity?.department?.name || '—'}
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline" onClick={() => navigate('/student/transcript')}>
            Xem bảng điểm
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/student/enroll')}>
            <BookMarked size={16} />
            <span>Đăng ký môn học</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
            }}
          >
            <Award size={22} />
          </div>
          <div>
            <div className="stat-value">{gpa} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ 4.0</span></div>
            <div className="stat-label">Điểm TB tích lũy (GPA)</div>
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
            <BookOpen size={22} />
          </div>
          <div>
            <div className="stat-value">{transcript?.totalCredits || 0}</div>
            <div className="stat-label">Tín chỉ tích lũy đạt</div>
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
            <Layers size={22} />
          </div>
          <div>
            <div className="stat-value">{enrollments.length}</div>
            <div className="stat-label">Học phần đang theo học</div>
          </div>
        </div>
      </div>

      {/* Currently Enrolled Courses */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h3>Học phần đăng ký trong học kỳ hiện tại</h3>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => navigate('/student/my-enrollments')}
          >
            Chi tiết học vụ
          </button>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã Lớp HP</th>
                <th>Tên Môn Học</th>
                <th>Số Tín Chỉ</th>
                <th>Giảng Viên Giảng Dạy</th>
                <th>Lịch Học</th>
                <th>Phòng Học</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Đang tải danh sách học phần...
                  </td>
                </tr>
              ) : enrollments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Bạn chưa đăng ký học phần nào trong học kỳ này. Bấm &quot;Đăng ký môn học&quot; để chọn môn.
                  </td>
                </tr>
              ) : (
                enrollments.map((e) => (
                  <tr key={e.id}>
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
                        {e.courseSection?.sectionCode}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{e.courseSection?.subject?.subjectName}</td>
                    <td><span className="badge badge-info">{e.courseSection?.subject?.credits} TC</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{e.courseSection?.lecturer?.fullName || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{e.courseSection?.schedule || '—'}</td>
                    <td><span className="badge badge-neutral">{e.courseSection?.room || '—'}</span></td>
                    <td>
                      <span className={`badge ${e.status === 'ENROLLED' ? 'badge-success' : 'badge-danger'}`}>
                        {e.status === 'ENROLLED' ? 'Đã xác nhận ĐK' : 'Đã hủy'}
                      </span>
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
