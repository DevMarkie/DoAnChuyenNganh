import { useState, useEffect } from 'react';
import { X, Users, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const getVietnameseNameParts = (stu) => {
  if (!stu) return { lastName: '—', firstName: '—' };
  if (stu.lastName && stu.firstName) {
    return { lastName: stu.lastName, firstName: stu.firstName };
  }
  const parts = (stu.fullName || '').trim().split(/\s+/);
  if (parts.length <= 1) {
    return { lastName: '', firstName: parts[0] || '—' };
  }
  const firstName = parts.pop();
  const lastName = parts.join(' ');
  return { lastName, firstName };
};

export default function StudentClassListModal({ courseSection, onClose }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseSection?.id) return;
    
    const fetchStudents = async () => {
      try {
        setLoading(true);
        // The endpoint is GET /api/enrollments/section/{sectionId}
        const res = await api.get(`/enrollments/section/${courseSection.id}`);
        setStudents(res.data?.data || []);
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Không thể tải danh sách sinh viên';
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [courseSection?.id]);

  if (!courseSection) return null;

  const subjectName = courseSection.subject?.subjectName || 'N/A';
  const sectionCode = courseSection.sectionCode || 'N/A';
  const room = courseSection.room || courseSection.schedules?.[0]?.room || 'N/A';

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '900px', width: '90%' }}>
        <div className="modal-header" style={{ background: 'var(--primary)', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} />
              Học phần: {subjectName}
            </h2>
            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '4px' }}>
              Lớp: {sectionCode} {room !== 'N/A' && `(Phòng: ${room})`}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <RefreshCw className="spin" size={32} style={{ margin: '0 auto 12px' }} />
              <div>Đang tải danh sách...</div>
            </div>
          ) : (
            <div className="table-container">
              <table className="table table-hover table-striped" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: 'var(--text-secondary)' }}>
                    <th style={{ width: '60px', textAlign: 'center' }}>STT</th>
                    <th style={{ width: '120px' }}>Mã số</th>
                    <th>Họ đệm</th>
                    <th style={{ width: '120px' }}>Tên</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Số buổi vắng</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((enrollment, index) => {
                    const stu = enrollment.student;
                    const { lastName, firstName } = getVietnameseNameParts(stu);
                    const absences = enrollment.absenceCount || 0;
                    return (
                      <tr key={enrollment.id}>
                        <td style={{ textAlign: 'center', fontWeight: 500 }}>{index + 1}</td>
                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{stu?.studentCode}</td>
                        <td>{lastName}</td>
                        <td style={{ fontWeight: 600 }}>{firstName}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${absences > 0 ? 'badge-danger' : 'badge-success'}`}>
                            {absences}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        Không có sinh viên nào trong danh sách.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
