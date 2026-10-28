import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, RefreshCw, KeyRound, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { attendanceService } from '../../services/dataService';
import useAuthStore from '../../store/authStore';
import StudentCheckInModal from '../../components/student/StudentCheckInModal';

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

export default function StudentClassListModal({
  courseSection,
  onClose,
  todayAttendance,
  onCheckInSuccess,
}) {
  const { user } = useAuthStore();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const sectionId = courseSection?.id;
  const [attendanceInfo, setAttendanceInfo] = useState(
    () => (sectionId ? todayAttendance?.[sectionId] : null) || null
  );

  const fetchStudents = useCallback(async () => {
    if (!sectionId) return;
    try {
      setLoading(true);
      const res = await api.get(`/enrollments/section/${sectionId}`);
      setStudents(res.data?.data || []);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || 'Không thể tải danh sách sinh viên';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Sync attendance info from props or fetch if missing
  useEffect(() => {
    if (!sectionId) return;
    if (todayAttendance?.[sectionId]) {
      setAttendanceInfo(todayAttendance[sectionId]);
      return;
    }

    attendanceService
      .getStudentToday()
      .then((res) => {
        const found = (res.data?.data || []).find((a) => a.sectionId === sectionId);
        if (found) {
          setAttendanceInfo(found);
        }
      })
      .catch(() => {
        // Ignore background failure
      });
  }, [sectionId, todayAttendance]);

  if (!courseSection) return null;

  const subjectName = courseSection.subject?.subjectName || 'N/A';
  const sectionCode = courseSection.sectionCode || 'N/A';
  const room = courseSection.room || courseSection.schedules?.[0]?.room || 'N/A';

  const isPresent = Boolean(attendanceInfo?.isPresent);
  const isOpen = attendanceInfo?.sessionStatus === 'OPEN';

  const modalContent = (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ zIndex: 9999 }}
    >
      <div className="modal-content" style={{ maxWidth: '900px', width: '90%' }}>
        <div
          className="modal-header"
          style={{
            background: 'var(--primary-gradient)',
            color: '#fff',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.1rem',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#ffffff',
              }}
            >
              <Users size={20} />
              Học phần: {subjectName}
            </h2>
            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '4px', color: '#fef08a' }}>
              Lớp: {sectionCode} {room !== 'N/A' && `(Phòng: ${room})`}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isPresent ? (
              <span
                className="badge badge-success"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <CheckCircle2 size={16} />
                Đã có mặt hôm nay
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowCheckInModal(true)}
                className="btn btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: isOpen ? '#10b981' : '#ffffff',
                  color: isOpen ? '#ffffff' : 'var(--primary)',
                  border: isOpen ? '1px solid #059669' : '1px solid rgba(255,255,255,0.8)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  transition: 'all 0.2s ease',
                }}
                title="Nhập mã điểm danh do giảng viên cung cấp"
              >
                <KeyRound size={15} />
                {isOpen ? '⚡ Điểm danh ngay' : 'Nhập mã điểm danh'}
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
              title="Đóng (Esc)"
            >
              <X size={24} />
            </button>
          </div>
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
                  <tr style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
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
                    const isMe =
                      user?.username &&
                      (stu?.studentCode === user.username || String(stu?.id) === String(user?.studentId));
                    return (
                      <tr
                        key={enrollment.id}
                        style={{
                          backgroundColor: isMe ? 'rgba(37, 99, 235, 0.08)' : undefined,
                          fontWeight: isMe ? 600 : undefined,
                        }}
                      >
                        <td style={{ textAlign: 'center', fontWeight: 500 }}>{index + 1}</td>
                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                          {stu?.studentCode}
                          {isMe && (
                            <span
                              className="badge badge-primary"
                              style={{ marginLeft: '6px', fontSize: '0.65rem', padding: '1px 5px' }}
                            >
                              Bạn
                            </span>
                          )}
                        </td>
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

      {showCheckInModal && (
        <StudentCheckInModal
          courseSection={courseSection}
          onClose={() => setShowCheckInModal(false)}
          onSuccess={async () => {
            await fetchStudents();
            setAttendanceInfo((prev) => ({ ...prev, isPresent: true, sessionStatus: 'OPEN' }));
            if (onCheckInSuccess) onCheckInSuccess();
          }}
        />
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}
