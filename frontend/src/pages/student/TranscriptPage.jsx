import { useState, useEffect, useMemo } from 'react';
import { Award, BookOpen, CheckCircle2, FileText, Printer, AlertTriangle, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { gradeAppealService, transcriptService } from '../../services/dataService';

export default function TranscriptPage() {
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appeals, setAppeals] = useState([]);
  const [appealCourse, setAppealCourse] = useState(null);
  const [appealForm, setAppealForm] = useState({ scoreComponent: 'FINAL', desiredScore: '', reason: '' });
  const [appealSubmitting, setAppealSubmitting] = useState(false);

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
          <button className="btn btn-outline" onClick={() => window.print()}>
            <Printer size={16} />
            <span>In bảng điểm</span>
          </button>
        </div>
      </div>

      {transcript?.warningLevel > 0 && (
        <div className="card" style={{ marginTop: '20px', border: `1px solid ${transcript.warningLevel >= 3 ? 'var(--danger)' : 'var(--warning)'}`, background: transcript.warningLevel >= 3 ? 'var(--danger-bg)' : 'var(--warning-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <AlertTriangle size={22} style={{ color: transcript.warningLevel >= 3 ? 'var(--danger)' : 'var(--warning)', flexShrink: 0 }} />
            <div>
              <strong style={{ color: 'var(--text-main)' }}>CẢNH BÁO KẾT QUẢ HỌC TẬP (MỨC {transcript.warningLevel})</strong>
              <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)' }}>
                Điểm học tập của bạn đang dưới ngưỡng chuẩn ({transcript.warningNotice}). Vui lòng liên hệ Cố vấn học tập để lên kế hoạch cải thiện điểm số.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
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
            <div className="stat-label">Điểm TB tích lũy (CPA)</div>
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
            <div className="stat-label">Số tín chỉ tích lũy đạt</div>
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
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="stat-value">{transcript?.completedCourses || 0}</div>
            <div className="stat-label">Học phần đã hoàn thành</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <Award size={22} />
          </div>
          <div>
            <div className="stat-value" style={{ fontSize: '1.2rem' }}>
              <span className={`badge ${standingBadge}`}>{transcript?.academicStanding || 'Chưa xếp loại'}</span>
            </div>
            <div className="stat-label">Xếp loại học lực tích lũy</div>
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
                          {c.subjectCode}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.subjectName}</td>
                      <td><span className="badge badge-info">{c.credits} TC</span></td>
                      <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                        {c.cc1Score != null ? Number(c.cc1Score).toFixed(1) : '—'}
                      </td>
                      <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                        {c.cc2Score != null ? Number(c.cc2Score).toFixed(1) : '—'}
                      </td>
                      <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                        {c.midtermScore != null ? Number(c.midtermScore).toFixed(1) : '—'}
                      </td>
                      <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                        {c.finalScore != null ? Number(c.finalScore).toFixed(1) : '—'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--text-main)' }}>
                        {c.totalScore != null ? Number(c.totalScore).toFixed(1) : '—'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {c.gpaPoint != null ? Number(c.gpaPoint).toFixed(2) : '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`badge ${
                            c.letterGrade === 'F' ? 'badge-danger'
                            : c.letterGrade === 'A' || c.letterGrade === 'A+' || c.letterGrade === 'B+' ? 'badge-success'
                            : 'badge-info'
                          }`}
                          style={{ fontWeight: 800, minWidth: '32px', justifyContent: 'center' }}
                        >
                          {c.letterGrade || '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {appeals.some((appeal) => appeal.enrollmentId === c.enrollmentId && ['PENDING', 'IN_REVIEW'].includes(appeal.status)) ? (
                          <span className="badge badge-warning">Đang phúc khảo</span>
                        ) : canAppeal(c) ? (
                          <button type="button" className="btn btn-outline" style={{ padding: '5px 8px', fontSize: '0.75rem' }} onClick={() => openAppeal(c)}>
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
    </div>
  );
}
