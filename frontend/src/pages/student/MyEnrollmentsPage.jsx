import { useState, useEffect } from 'react';
import { Trash2, AlertCircle, Calendar, BookOpen, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { enrollmentService } from '../../services/dataService';

export default function MyEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      const res = await enrollmentService.getMyEnrollments();
      setEnrollments(res.data.data || []);
    } catch {
      toast.error('Lỗi khi tải danh sách học phần đã đăng ký');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id, sectionName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn huỷ đăng ký học phần: ${sectionName}?`)) {
      return;
    }
    try {
      await enrollmentService.cancel(id);
      toast.success('Đã huỷ đăng ký học phần thành công!');
      loadEnrollments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Huỷ đăng ký thất bại');
    }
  };

  const activeEnrollments = enrollments.filter((e) => e.status === 'ENROLLED');
  const totalCredits = activeEnrollments.reduce((sum, e) => sum + (e.courseSection?.subject?.credits || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Học Phần Đã Đăng Ký</h1>
          <p>
            Theo dõi kế hoạch biểu học tập, phòng học và trạng thái xác nhận đăng ký môn học
          </p>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px', display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Số môn hợp lệ:</span>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>{activeEnrollments.length} môn</span>
          </div>
          <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tổng khối lượng:</span>
            <span className="badge badge-info" style={{ fontSize: '0.85rem', padding: '4px 10px' }}>
              {totalCredits} Tín chỉ
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã Lớp HP</th>
                <th>Tên Môn Học</th>
                <th>Số Tín Chỉ</th>
                <th>Học Kỳ</th>
                <th>Giảng Viên Giảng Dạy</th>
                <th>Lịch Học Chi Tiết</th>
                <th>Phòng Học</th>
                <th>Ngày Đăng Ký</th>
                <th>Trạng Thái</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Đang tải danh sách học phần đã đăng ký...
                  </td>
                </tr>
              ) : enrollments.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Bạn chưa đăng ký học phần nào trong cơ sở dữ liệu.
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
                    <td style={{ color: 'var(--text-secondary)' }}>{e.courseSection?.semester?.semesterName}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{e.courseSection?.lecturer?.fullName || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{e.courseSection?.schedule || '—'}</td>
                    <td><span className="badge badge-neutral">{e.courseSection?.room || '—'}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {e.enrolledAt ? e.enrolledAt.substring(0, 10) : '—'}
                    </td>
                    <td>
                      <span className={`badge ${e.status === 'ENROLLED' ? 'badge-success' : 'badge-danger'}`}>
                        {e.status === 'ENROLLED' ? 'Đã xác nhận' : 'Đã huỷ'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {e.status === 'ENROLLED' && (
                        <button
                          className="btn-icon"
                          title="Huỷ đăng ký môn này"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => handleCancel(e.id, e.courseSection?.subject?.subjectName)}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
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
