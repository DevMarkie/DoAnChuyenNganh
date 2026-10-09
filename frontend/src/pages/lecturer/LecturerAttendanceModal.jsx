import { useState, useEffect } from 'react';
import { X, Check, XCircle, Save, RefreshCw } from 'lucide-react';
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

export default function LecturerAttendanceModal({ courseSection, onClose }) {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { enrollmentId: isPresent (boolean) }
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sectionId = courseSection?.id;

  useEffect(() => {
    if (!sectionId) return;
    let isMounted = true;

    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/enrollments/section/${sectionId}`);
        if (!isMounted) return;
        const list = res.data?.data || [];
        setStudents(list);
        
        // Default everyone to present
        const initAtt = {};
        list.forEach(e => {
          initAtt[e.id] = true;
        });
        setAttendance(initAtt);
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching students for attendance:', error);
        toast.error('Không thể tải danh sách sinh viên');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStudents();
    return () => {
      isMounted = false;
    };
  }, [sectionId]);

  const toggleAttendance = (enrollmentId) => {
    setAttendance(prev => ({
      ...prev,
      [enrollmentId]: !prev[enrollmentId]
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const records = Object.keys(attendance).map(enrollmentId => ({
        enrollmentId: parseInt(enrollmentId),
        isPresent: attendance[enrollmentId]
      }));

      await api.post('/attendance/session', {
        sectionId: courseSection.id,
        sessionDate: sessionDate,
        attendanceKeyword: keyword,
        records: records
      });

      toast.success('Lưu điểm danh thành công!');
      onClose();
    } catch (err) {
      console.error('Error saving attendance:', err);
      toast.error('Lỗi khi lưu điểm danh');
    } finally {
      setSaving(false);
    }
  };

  if (!courseSection) return null;

  const subjectName = courseSection.subject?.subjectName || 'N/A';
  const sectionCode = courseSection.sectionCode || 'N/A';
  const absentCount = Object.values(attendance).filter(v => !v).length;
  const totalCount = students.length;

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '900px', width: '90%' }}>
        <div className="modal-header" style={{ background: '#1e3a8a', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>
              Học phần: {subjectName}
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#fbbf24', marginTop: '4px', fontWeight: 600 }}>
              Vắng mặt (Số sinh viên/Tổng số): ({absentCount}/{totalCount})
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
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600 }}>
                    Lớp: {sectionCode}
                  </div>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={sessionDate} 
                    onChange={e => setSessionDate(e.target.value)} 
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  />
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Từ khóa điểm danh" 
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSave} 
                  disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu điểm danh'}
                </button>
              </div>

              <div className="table-container">
                <table className="table table-hover table-striped" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', color: '#334155' }}>
                      <th style={{ width: '60px', textAlign: 'center' }}>STT</th>
                      <th style={{ width: '120px' }}>Mã số</th>
                      <th>Họ đệm</th>
                      <th style={{ width: '100px' }}>Tên</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Điểm danh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((enrollment, index) => {
                      const stu = enrollment.student;
                      const { lastName, firstName } = getVietnameseNameParts(stu);
                      const isPresent = attendance[enrollment.id];
                      return (
                        <tr key={enrollment.id} style={{ cursor: 'pointer', background: !isPresent ? '#fee2e2' : 'inherit' }} onClick={() => toggleAttendance(enrollment.id)}>
                          <td style={{ textAlign: 'center', fontWeight: 500 }}>{index + 1}</td>
                          <td style={{ fontWeight: 600 }}>{stu?.studentCode}</td>
                          <td>{lastName}</td>
                          <td style={{ fontWeight: 600 }}>{firstName}</td>
                          <td style={{ textAlign: 'center' }}>
                            {isPresent ? (
                              <button className="badge badge-success" style={{ border: 'none', width: '100%' }}>
                                <Check size={14} style={{ marginRight: '4px' }} /> Có mặt
                              </button>
                            ) : (
                              <button className="badge badge-danger" style={{ border: 'none', width: '100%' }}>
                                <XCircle size={14} style={{ marginRight: '4px' }} /> Vắng
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                          Lớp học phần này chưa có sinh viên đăng ký.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
