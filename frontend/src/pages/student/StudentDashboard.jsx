import TableRowSkeleton from '../../components/common/TableRowSkeleton';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, BookOpen, Layers, BookMarked } from 'lucide-react';
import { studentService, transcriptService, enrollmentService } from '../../services/dataService';
import useAuthStore from '../../store/authStore';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

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
    } catch {
      // console.error removed for security
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      {/* Stats Bento Grid */}
      <div className="stats-grid">
        <div className="stat-card" style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, var(--bg-surface) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.25)',
        }}>
          <div
            className="stat-icon-wrapper"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.4)',
            }}
          >
            <Award size={22} />
          </div>
          <div>
            <div className="stat-value" style={{
              background: 'linear-gradient(135deg, var(--text-main) 60%, var(--primary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '1.85rem',
            }}>
              {gpa} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', WebkitTextFillColor: 'var(--text-muted)' }}>/ 4.0</span>
            </div>
            <div className="stat-label">Điểm TB tích lũy (GPA)</div>
          </div>
        </div>

        <div className="stat-card" style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, var(--bg-surface) 100%)',
          borderColor: 'rgba(16, 185, 129, 0.25)',
        }}>
          <div
            className="stat-icon-wrapper"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.4)',
            }}
          >
            <BookOpen size={22} />
          </div>
          <div>
            <div className="stat-value">{transcript?.totalCredits || 0}</div>
            <div className="stat-label">Tín chỉ tích lũy đạt</div>
          </div>
        </div>

        <div className="stat-card" style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, var(--bg-surface) 100%)',
          borderColor: 'rgba(6, 182, 212, 0.25)',
        }}>
          <div
            className="stat-icon-wrapper"
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 14px 0 rgba(6, 182, 212, 0.4)',
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
            onClick={() => navigate('/student/enrollments')}
          >
            Chi tiết học vụ
          </button>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã lớp HP</th>
                <th>Tên môn học</th>
                <th>Số tín chỉ</th>
                <th>Giảng viên giảng dạy</th>
                <th>Lịch học</th>
                <th>Phòng học</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowSkeleton columns={7} />
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
                      <span className={`badge ${
                        e.status === 'ENROLLED' ? 'badge-success'
                        : e.status === 'COMPLETED' ? 'badge-info'
                        : 'badge-danger'
                      }`}>
                        {e.status === 'ENROLLED' ? 'Đã xác nhận ĐK'
                          : e.status === 'COMPLETED' ? 'Đã hoàn thành'
                          : 'Đã hủy'}
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
