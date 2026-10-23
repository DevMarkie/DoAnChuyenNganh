import { useState, useEffect, useMemo } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  FileText,
  Printer,
  AlertTriangle,
  X,
  PhoneCall,
  Mail,
  UserCheck,
  Building2,
  Calendar,
  MapPin,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { gradeAppealService, transcriptService } from '../../services/dataService';

export default function TranscriptPage() {
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appeals, setAppeals] = useState([]);
  const [appealCourse, setAppealCourse] = useState(null);
  const [appealForm, setAppealForm] = useState({ scoreComponent: 'FINAL', desiredScore: '', reason: '' });
  const [appealSubmitting, setAppealSubmitting] = useState(false);
  const [showAdvisorModal, setShowAdvisorModal] = useState(false);

  const loadTranscript = async () => {
    try {
      setLoading(true);
      const res = await transcriptService.getMyTranscript();
      setTranscript(res.data.data);
    } catch {
      toast.error('Lỗi khi tải bảng điểm kết quả học tập');
    } finally {
      setLoading(false);
    }
  };

  const loadAppeals = async () => {
    try {
      const res = await gradeAppealService.getMine();
      setAppeals(res.data.data || []);
    } catch {
      // Appeal history is supplementary; do not block the transcript if unavailable.
    }
  };

  useEffect(() => {
    loadTranscript();
    loadAppeals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nowTime = useMemo(() => Date.now(), []);

  const canAppeal = (course) => {
    if (!course?.finalizedAt) return false;
    return new Date(course.finalizedAt).getTime() + (7 * 24 * 60 * 60 * 1000) >= nowTime;
  };

  const openAppeal = (course) => {
    setAppealCourse(course);
    setAppealForm({ scoreComponent: 'FINAL', desiredScore: '', reason: '' });
  };

  const appealScoreFields = { CC2: 'cc2Score', MIDTERM: 'midtermScore', FINAL: 'finalScore', ALL: 'totalScore' };
  const appealScoreLabels = { CC2: 'Bài tập / Tiểu luận', MIDTERM: 'Giữa kỳ', FINAL: 'Cuối kỳ', ALL: 'Toàn bộ' };
  const currentAppealScore = appealCourse?.[appealScoreFields[appealForm.scoreComponent]];

  const submitAppeal = async (event) => {
    event.preventDefault();
    if (!appealCourse || appealForm.reason.trim().length < 20) return;
    try {
      setAppealSubmitting(true);
      await gradeAppealService.create({
        enrollmentId: appealCourse.enrollmentId,
        scoreComponent: appealForm.scoreComponent,
        desiredScore: appealForm.desiredScore === '' ? null : Number(appealForm.desiredScore),
        reason: appealForm.reason.trim(),
      });
      toast.success('Đã gửi đơn phúc khảo');
      setAppealCourse(null);
      loadAppeals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi đơn phúc khảo');
    } finally {
      setAppealSubmitting(false);
    }
  };

  const gpa = transcript?.cumulativeGpa ? Number(transcript.cumulativeGpa).toFixed(2) : '0.00';
  const standingBadge = {
    'Xuất sắc': 'badge-purple',
    'Giỏi': 'badge-success',
    'Khá': 'badge-info',
    'Trung bình': 'badge-warning',
    'Yếu': 'badge-secondary',
    'Kém': 'badge-danger',
  }[transcript?.academicStanding] || 'badge-neutral';

  const advisor = transcript?.advisorContact || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bảng Điểm & Kết Quả Học Tập</h1>
          <p>
            Sinh viên: <strong>{transcript?.studentName}</strong> ({transcript?.studentCode}) • Lớp sinh hoạt: <strong>{transcript?.className}</strong>
          </p>
        </div>
        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setShowAdvisorModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <UserCheck size={16} />
            <span>Cố vấn học tập</span>
          </button>
          <button className="btn btn-outline" onClick={() => window.print()}>
            <Printer size={16} />
            <span>In bảng điểm</span>
          </button>
        </div>
      </div>

      {transcript?.warningLevel > 0 && (
        <div
          className="card"
          style={{
            marginTop: '20px',
            border: `1px solid ${transcript.warningLevel >= 3 ? 'var(--danger)' : 'var(--warning)'}`,
            background: transcript.warningLevel >= 3 ? 'var(--danger-bg)' : 'var(--warning-bg)',
            padding: '16px 20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: '1 1 320px' }}>
              <AlertTriangle
                size={24}
                style={{
                  color: transcript.warningLevel >= 3 ? 'var(--danger)' : 'var(--warning)',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              />
              <div>
                <strong style={{ color: 'var(--text-main)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>CẢNH BÁO KẾT QUẢ HỌC TẬP (MỨC {transcript.warningLevel})</span>
                  <span
                    className={`badge ${transcript.warningLevel >= 3 ? 'badge-danger' : 'badge-warning'}`}
                    style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                  >
                    Mức {transcript.warningLevel}
                  </span>
                </strong>
                <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.45' }}>
                  Điểm học tập của bạn đang dưới ngưỡng chuẩn ({transcript.warningNotice}). Vui lòng liên hệ Cố vấn học tập để lên kế hoạch cải thiện điểm số kịp thời.
                </p>
              </div>
            </div>

            <button
              type="button"
              className={transcript.warningLevel >= 3 ? 'btn btn-danger' : 'btn btn-warning'}
              onClick={() => setShowAdvisorModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600,
                fontSize: '0.88rem',
                padding: '9px 16px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                cursor: 'pointer',
              }}
            >
              <PhoneCall size={16} />
              <span>Liên hệ Cố vấn học tập</span>
            </button>
          </div>
        </div>
      )}

      {/* Bento Box Glassmorphic Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '18px',
        marginBottom: '24px'
      }}>
        {/* Bento Card 1: CPA Hero */}
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
            <Award size={24} />
          </div>
          <div>
            <div className="stat-value" style={{
              background: 'linear-gradient(135deg, var(--text-main) 60%, var(--primary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '1.9rem',
              fontWeight: 800,
            }}>
              {gpa} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', WebkitTextFillColor: 'var(--text-muted)' }}>/ 4.0</span>
            </div>
            <div className="stat-label">Điểm TB tích lũy (CPA)</div>
          </div>
        </div>

        {/* Bento Card 2: Earned Credits */}
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
            <BookOpen size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="stat-value">{transcript?.totalCredits || 0} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>TC đạt</span></div>
            <div className="stat-label">Tín chỉ tích lũy đạt</div>
          </div>
        </div>

        {/* Bento Card 3: Completed Courses */}
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
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-value">{transcript?.completedCourses || 0}</div>
            <div className="stat-label">Học phần đã hoàn thành</div>
          </div>
        </div>

        {/* Bento Card 4: Academic Standing */}
        <div className="stat-card" style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, var(--bg-surface) 100%)',
          borderColor: 'rgba(245, 158, 11, 0.25)',
        }}>
          <div
            className="stat-icon-wrapper"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 14px 0 rgba(245, 158, 11, 0.4)',
            }}
          >
            <Award size={24} />
          </div>
          <div>
            <div className="stat-value" style={{ fontSize: '1.25rem', paddingTop: '2px' }}>
              <span className={`badge ${standingBadge}`} style={{ fontSize: '0.82rem', padding: '4px 12px' }}>
                {transcript?.academicStanding || 'Chưa xếp loại'}
              </span>
            </div>
            <div className="stat-label" style={{ marginTop: '6px' }}>Xếp loại học lực tích lũy</div>
          </div>
        </div>
      </div>

      {/* Semester Breakdown */}
      {loading ? (
        <div className="card" style={{ padding: '48px 20px', textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)' }}>
          Đang tải bảng điểm học tập...
        </div>
      ) : !transcript?.semesters || transcript.semesters.length === 0 ? (
        <div className="card" style={{ padding: '48px 20px', textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)' }}>
          Chưa có dữ liệu điểm học kỳ nào được ghi nhận trong hệ thống.
        </div>
      ) : (
        transcript.semesters.map((sem, sIdx) => (
          <div key={sem.semesterId || sIdx} className="card" style={{ marginTop: '24px' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                  {sem.semesterName} ({sem.academicYear})
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', alignItems: 'center' }}>
                <span>
                  GPA Kỳ: <strong style={{ color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {sem.semesterGpa != null ? Number(sem.semesterGpa).toFixed(2) : '—'}
                  </strong>
                </span>
                <span className={`badge ${sem.semesterClassification === 'Kém' ? 'badge-danger' : sem.semesterClassification === 'Yếu' ? 'badge-warning' : 'badge-info'}`}>
                  Xếp loại: {sem.semesterClassification || 'Chưa xếp loại'}
                </span>
                {sem.isSemesterWarning && <span className="badge badge-danger">Cảnh báo GPA</span>}
                <span className="badge badge-success">
                  Đạt: {sem.semesterCredits || 0} Tín chỉ
                </span>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã môn</th>
                    <th>Tên môn học</th>
                    <th>Số TC</th>
                    <th style={{ textAlign: 'center' }}>CC1 (5%)<br/><small style={{fontSize: '0.8em', fontWeight: 'normal'}}>Chuyên cần</small></th>
                    <th style={{ textAlign: 'center' }}>CC2 (5%)<br/><small style={{fontSize: '0.8em', fontWeight: 'normal'}}>Bài tập</small></th>
                    <th style={{ textAlign: 'center' }}>Giữa kỳ (30%)</th>
                    <th style={{ textAlign: 'center' }}>Cuối kỳ (60%)</th>
                    <th style={{ textAlign: 'center' }}>Tổng kết</th>
                    <th style={{ textAlign: 'center' }}>Hệ 4</th>
                    <th style={{ textAlign: 'center' }}>Điểm chữ</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {sem.courses?.map((c, cIdx) => (
                    <tr key={cIdx}>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            fontFamily: 'var(--font-mono, monospace)',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            color: 'var(--primary)',
                            backgroundColor: 'var(--primary-light)',
                            padding: '3px 9px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--primary-border)',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {c.subjectCode}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.subjectName}</td>
                      <td><span className="badge badge-info">{c.credits} TC</span></td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono, monospace)', fontVariantNumeric: 'tabular-nums' }}>
                        {c.cc1Score != null ? Number(c.cc1Score).toFixed(1) : '—'}
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono, monospace)', fontVariantNumeric: 'tabular-nums' }}>
                        {c.cc2Score != null ? Number(c.cc2Score).toFixed(1) : '—'}
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono, monospace)', fontVariantNumeric: 'tabular-nums' }}>
                        {c.midtermScore != null ? Number(c.midtermScore).toFixed(1) : '—'}
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono, monospace)', fontVariantNumeric: 'tabular-nums' }}>
                        {c.finalScore != null ? Number(c.finalScore).toFixed(1) : '—'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', fontVariantNumeric: 'tabular-nums', color: 'var(--primary)' }}>
                        {c.totalScore != null ? Number(c.totalScore).toFixed(1) : '—'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', fontVariantNumeric: 'tabular-nums' }}>
                        {c.gpaPoint != null ? Number(c.gpaPoint).toFixed(2) : '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`badge ${
                            c.letterGrade === 'F' ? 'badge-danger'
                            : c.letterGrade === 'A' || c.letterGrade === 'A+' || c.letterGrade === 'B+' ? 'badge-success'
                            : 'badge-info'
                          }`}
                          style={{ fontWeight: 800, minWidth: '34px', justifyContent: 'center' }}
                        >
                          {c.letterGrade || '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {appeals.some((appeal) => appeal.enrollmentId === c.enrollmentId && ['PENDING', 'IN_REVIEW'].includes(appeal.status)) ? (
                          <span className="badge badge-warning">Đang phúc khảo</span>
                        ) : canAppeal(c) ? (
                          <button type="button" className="btn btn-outline btn-sm" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => openAppeal(c)}>
                            Phúc khảo
                          </button>
                        ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {appealCourse && (
        <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setAppealCourse(null); }}>
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div>
                <h3>Gửi đơn phúc khảo</h3>
                <small style={{ color: 'var(--text-secondary)' }}>{appealCourse.subjectCode} — {appealCourse.subjectName} · {appealScoreLabels[appealForm.scoreComponent]}: {currentAppealScore ?? '—'}</small>
              </div>
              <button className="btn-icon" onClick={() => setAppealCourse(null)}><X size={18} /></button>
            </div>
            <form onSubmit={submitAppeal}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label">Cột điểm muốn phúc khảo *</label>
                  <select className="form-select" value={appealForm.scoreComponent} onChange={(event) => setAppealForm({ ...appealForm, scoreComponent: event.target.value })}>
                    <option value="CC2">Bài tập / Tiểu luận</option>
                    <option value="MIDTERM">Giữa kỳ</option>
                    <option value="FINAL">Cuối kỳ</option>
                    <option value="ALL">Toàn bộ</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Điểm mong muốn (không bắt buộc)</label>
                  <input className="form-control" type="number" min="0" max="10" step="0.01" value={appealForm.desiredScore} onChange={(event) => setAppealForm({ ...appealForm, desiredScore: event.target.value })} />
                </div>
                <div>
                  <label className="form-label">Lý do phúc khảo * (tối thiểu 20 ký tự)</label>
                  <textarea className="form-control" rows="5" required minLength="20" value={appealForm.reason} onChange={(event) => setAppealForm({ ...appealForm, reason: event.target.value })} placeholder="Nêu rõ nội dung cần được kiểm tra lại..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setAppealCourse(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={appealSubmitting || appealForm.reason.trim().length < 20}>{appealSubmitting ? 'Đang gửi...' : 'Gửi đơn'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdvisorModal && (
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) setShowAdvisorModal(false);
          }}
        >
          <div className="modal-content" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: transcript?.warningLevel > 0
                      ? (transcript.warningLevel >= 3 ? 'var(--danger-bg)' : 'var(--warning-bg)')
                      : 'var(--primary-light)',
                    color: transcript?.warningLevel > 0
                      ? (transcript.warningLevel >= 3 ? 'var(--danger)' : 'var(--warning)')
                      : 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {transcript?.warningLevel > 0 ? <PhoneCall size={20} /> : <UserCheck size={20} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Hỗ Trợ Học Vụ & Cố Vấn Học Tập</h3>
                  <small style={{ color: 'var(--text-secondary)' }}>
                    {transcript?.warningLevel > 0
                      ? `Thông tin hỗ trợ dành cho sinh viên diện Cảnh báo Mức ${transcript.warningLevel}`
                      : `Thông tin liên hệ & lịch làm việc Cố vấn học tập lớp ${transcript?.className || ''}`}
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowAdvisorModal(false)}
                title="Đóng"
                aria-label="Đóng popup"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Alert notice box (only for warning students) */}
              {transcript?.warningLevel > 0 && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: transcript.warningLevel >= 3 ? 'var(--danger-bg)' : 'var(--warning-bg)',
                    border: `1px solid ${transcript.warningLevel >= 3 ? 'var(--danger)' : 'var(--warning)'}`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <ShieldAlert
                    size={20}
                    style={{
                      color: transcript.warningLevel >= 3 ? 'var(--danger)' : 'var(--warning)',
                      marginTop: '2px',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.45' }}>
                    <strong>Lưu ý quan trọng:</strong> {advisor.studentSupportNotes || `Sinh viên thuộc diện Cảnh báo học vụ Mức ${transcript.warningLevel}. Hãy chủ động gặp Thầy/Cô Cố vấn học tập sớm nhất để lập kế hoạch học tập cá nhân hóa.`}
                  </div>
                </div>
              )}

              {/* Section 1: Academic Advisor */}
              <div
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '16px',
                  background: 'var(--card-bg)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <UserCheck size={18} style={{ color: 'var(--primary)' }} />
                  <strong style={{ fontSize: '0.98rem', color: 'var(--text-main)' }}>
                    Cố Vấn Học Tập Phụ Trách Lớp {transcript?.className || ''}
                  </strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Họ và tên giảng viên</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                      {advisor.advisorName || 'TS. Nguyễn Hoàng Long'}
                    </div>
                    {advisor.advisorDegree && (
                      <span className="badge badge-info" style={{ marginTop: '4px', fontSize: '0.75rem' }}>
                        Học vị: {advisor.advisorDegree}
                      </span>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mã giảng viên & Chuyên môn</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      Mã GV: <strong>{advisor.advisorCode || '1000001'}</strong>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {advisor.specialization || 'Khoa Công nghệ Thông tin & Máy tính'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email liên hệ</div>
                    <a
                      href={`mailto:${advisor.advisorEmail || '1000001@sms.edu.vn'}?subject=[SMS - Hỗ trợ học vụ] Sinh viên ${transcript?.studentName || ''} (${transcript?.studentCode || ''})`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--primary)',
                        fontWeight: 500,
                        fontSize: '0.9rem',
                        textDecoration: 'none',
                      }}
                    >
                      <Mail size={14} />
                      <span>{advisor.advisorEmail || '1000001@sms.edu.vn'}</span>
                    </a>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Điện thoại / Hotline</div>
                    <a
                      href={`tel:${advisor.advisorPhone || '0912345001'}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--success)',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        textDecoration: 'none',
                      }}
                    >
                      <PhoneCall size={14} />
                      <span>{advisor.advisorPhone || '0912345001'}</span>
                    </a>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phòng làm việc</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>{advisor.advisorOffice || 'Phòng 402 - Tòa nhà A1'}</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lịch tiếp sinh viên</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>{advisor.consultationHours || 'Thứ 2 & Thứ 4 (14h00 - 16h30)'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Department Office & Assistant */}
              <div
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '16px',
                  background: 'var(--card-bg)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <Building2 size={18} style={{ color: 'var(--info)' }} />
                  <strong style={{ fontSize: '0.98rem', color: 'var(--text-main)' }}>
                    Văn Phòng Khoa & Trợ Lý Giáo Vụ Phụ Trách
                  </strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Đơn vị Khoa</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                      {advisor.departmentName || 'Khoa Công nghệ Thông tin & Máy tính'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Trợ lý giáo vụ Khoa</div>
                    <div style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                      {advisor.assistantName || 'ThS. Hoàng Văn Nam (Trợ lý Giáo vụ)'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email Văn phòng Khoa</div>
                    <a
                      href={`mailto:${advisor.assistantEmail || 'vpk.cntt@sms.edu.vn'}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--primary)',
                        fontSize: '0.88rem',
                        textDecoration: 'none',
                      }}
                    >
                      <Mail size={14} />
                      <span>{advisor.assistantEmail || 'vpk.cntt@sms.edu.vn'}</span>
                    </a>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hotline / Số điện thoại VP Khoa</div>
                    <a
                      href={`tel:${advisor.assistantPhone || '(024) 3754 7501'}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--text-main)',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        textDecoration: 'none',
                      }}
                    >
                      <PhoneCall size={14} />
                      <span>{advisor.assistantPhone || '(024) 3754 7501'}</span>
                    </a>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Địa chỉ Văn phòng Khoa</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>{advisor.departmentOffice || 'Văn phòng Khoa CNTT - P.302 Tòa nhà A1'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Action steps & Guidance */}
              <div
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: 'var(--neutral-bg, rgba(0,0,0,0.02))',
                }}
              >
                {transcript?.warningLevel > 0 ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <Calendar size={18} style={{ color: 'var(--warning)' }} />
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        4 Bước sinh viên cần thực hiện ngay để gỡ cảnh báo:
                      </strong>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span className="badge badge-primary" style={{ padding: '2px 6px', fontSize: '0.75rem', marginTop: '1px' }}>1</span>
                        <span><strong>Gặp Cố vấn học tập:</strong> Phân tích nguyên nhân điểm thấp và lập Kế hoạch học tập cá nhân (Personal Study Plan).</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span className="badge badge-warning" style={{ padding: '2px 6px', fontSize: '0.75rem', marginTop: '1px' }}>2</span>
                        <span><strong>Đăng ký học lại / cải thiện:</strong> Ưu tiên đăng ký học lại các học phần bị điểm F hoặc cải thiện điểm D ở học kỳ kế tiếp để nâng CPA.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span className="badge badge-info" style={{ padding: '2px 6px', fontSize: '0.75rem', marginTop: '1px' }}>3</span>
                        <span><strong>Khống chế khối lượng tín chỉ:</strong> Đăng ký khối lượng vừa sức (khuyến nghị 12 - 14 tín chỉ, không vượt quá 16 tín chỉ) để đảm bảo kết quả.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span className="badge badge-purple" style={{ padding: '2px 6px', fontSize: '0.75rem', marginTop: '1px' }}>4</span>
                        <span><strong>Hỗ trợ thủ tục từ Khoa:</strong> Liên hệ Trợ lý giáo vụ Khoa nếu cần tư vấn về thủ tục bảo lưu, gia hạn tiến độ hoặc hoàn cảnh đặc biệt.</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <BookOpen size={18} style={{ color: 'var(--primary)' }} />
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        Hướng dẫn liên hệ & làm việc với Cố vấn học tập:
                      </strong>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span className="badge badge-primary" style={{ padding: '2px 6px', fontSize: '0.75rem', marginTop: '1px' }}>1</span>
                        <span><strong>Tư vấn lộ trình học tập:</strong> Trao đổi về định hướng chuyên ngành, đăng ký môn học tự chọn và điều kiện xét tốt nghiệp đúng hạn.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span className="badge badge-info" style={{ padding: '2px 6px', fontSize: '0.75rem', marginTop: '1px' }}>2</span>
                        <span><strong>Lịch hẹn trước:</strong> Vui lòng gửi email hoặc gọi điện thoại trước 24h để đặt lịch hẹn tiếp sinh viên tại Văn phòng.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span className="badge badge-success" style={{ padding: '2px 6px', fontSize: '0.75rem', marginTop: '1px' }}>3</span>
                        <span><strong>Kênh trao đổi chính thức:</strong> Ưu tiên sử dụng email sinh viên do Nhà trường cấp để đảm bảo tính xác thực khi trao đổi hồ sơ.</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowAdvisorModal(false)}
              >
                Đóng
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  className="btn btn-primary"
                  href={`mailto:${advisor.advisorEmail || '1000001@sms.edu.vn'}?subject=[SMS - Hỗ trợ học vụ] Sinh viên ${transcript?.studentName || ''} (${transcript?.studentCode || ''}) - Lớp ${transcript?.className || ''}`}
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Mail size={16} />
                  <span>Gửi Email cho CVHT</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
