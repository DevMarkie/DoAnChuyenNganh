import TableRowSkeleton from '../../components/common/TableRowSkeleton';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TranscriptIcon, SubjectsIcon, CourseSectionsIcon, EnrollIcon } from '../../components/icons';
import { studentService, transcriptService, enrollmentService } from '../../services/dataService';
import useAuthStore from '../../store/authStore';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('student_profile') || 'null');
    } catch {
      return null;
    }
  });
  const [transcript, setTranscript] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(!profile);

  const loadData = async () => {
    try {
      if (!profile) setLoading(true);
      const [resProfile, resTrans, resEnr] = await Promise.allSettled([
        studentService.getMe(),
        transcriptService.getMyTranscript(),
        enrollmentService.getMyEnrollments(),
      ]);
      if (resProfile.status === 'fulfilled' && resProfile.value.data?.data) {
        const prof = resProfile.value.data.data;
        setProfile(prof);
        try {
          localStorage.setItem('student_profile', JSON.stringify(prof));
        } catch {}
      }
      if (resTrans.status === 'fulfilled' && resTrans.value.data?.data) {
        setTranscript(resTrans.value.data.data);
      }
      if (resEnr.status === 'fulfilled' && resEnr.value.data?.data) {
        setEnrollments(resEnr.value.data.data || []);
      }
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
  const currentEnrollments = enrollments.filter(e => e.courseSection?.semester?.isCurrent ?? (e.status !== 'COMPLETED' && e.status !== 'DROPPED'));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Cổng Sinh Viên — {profile?.fullName || user?.fullName || user?.username}</h1>
          <p>
            Mã SV: {profile?.studentCode || user?.username} • Lớp: {profile?.classEntity?.name || profile?.classEntity?.code || (loading ? 'Đang tải...' : 'Chưa phân lớp')} • Khoa: {profile?.classEntity?.department?.name || profile?.department?.name || (loading ? 'Đang tải...' : 'Chưa phân khoa')}
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline" onClick={() => navigate('/student/transcript')}>
            Xem bảng điểm
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/student/enroll')}>
            <EnrollIcon size={16} />
            <span>Đăng ký môn học</span>
          </button>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon--cpa">
            <TranscriptIcon size={22} />
          </div>
          <div>
            <div className="stat-value" style={{ fontSize: '1.85rem' }}>
              {gpa} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>/ 4.0</span>
            </div>
            <div className="stat-label">Điểm TB tích lũy (GPA)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon--credits">
            <SubjectsIcon size={22} />
          </div>
          <div>
            <div className="stat-value">{transcript?.totalCredits || 0}</div>
            <div className="stat-label">Tín chỉ tích lũy đạt</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon--courses">
            <CourseSectionsIcon size={22} />
          </div>
          <div>
            <div className="stat-value">{currentEnrollments.length}</div>
            <div className="stat-label">Học phần đang theo học</div>
          </div>
        </div>
      </div>

      {/* Currently Enrolled Courses */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Học phần đăng ký trong học kỳ hiện tại</h2>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => navigate('/student/enrollments')}
          >
            Chi tiết học vụ
          </button>
        </div>
        <div className="table-container table-mobile-cards">
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
              ) : currentEnrollments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Bạn chưa đăng ký học phần nào trong học kỳ này. Bấm &quot;Đăng ký môn học&quot; để chọn môn.
                  </td>
                </tr>
              ) : (
                currentEnrollments.map((e) => (
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
                    <td data-label="Tên môn học" style={{ fontWeight: 600, color: 'var(--text-main)' }}>{e.courseSection?.subject?.subjectName}</td>
                    <td data-label="Số tín chỉ"><span className="badge badge-info">{e.courseSection?.subject?.credits} TC</span></td>
                    <td data-label="Giảng viên" style={{ color: 'var(--text-secondary)' }}>{e.courseSection?.lecturer?.fullName || '—'}</td>
                    <td data-label="Lịch học" style={{ color: 'var(--text-secondary)' }}>{e.courseSection?.schedule || '—'}</td>
                    <td data-label="Phòng học"><span className="badge badge-neutral">{e.courseSection?.room || '—'}</span></td>
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
