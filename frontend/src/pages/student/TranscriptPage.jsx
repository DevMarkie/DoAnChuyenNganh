import { useState, useEffect, useCallback } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  FileText,
  Printer,
  AlertTriangle,
  Clock,
  HelpCircle,
  X,
  Send,
} from 'lucide-react';
import { toast } from 'react-toastify';
import * as dataServices from '../../services/dataService';

export default function TranscriptPage() {
  const transcriptService = dataServices.transcriptService;
  const studentService = dataServices.studentService;
  const [transcript, setTranscript] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal Phúc khảo (Luồng 2)
  const [appealCourse, setAppealCourse] = useState(null);
  const [appealReason, setAppealReason] = useState('');
  const [appealDesiredScore, setAppealDesiredScore] = useState('');
  const [appealSubmitting, setAppealSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [resTranscript, resElig] = await Promise.allSettled([
        transcriptService?.getMyTranscript ? transcriptService.getMyTranscript() : Promise.resolve({ data: { data: null } }),
        studentService?.getMyGraduationEligibility ? studentService.getMyGraduationEligibility() : Promise.resolve({ data: { data: null } }),
      ]);
      if (resTranscript.status === 'fulfilled') setTranscript(resTranscript.value.data?.data || null);
      if (resElig.status === 'fulfilled') setEligibility(resElig.value.data?.data || null);
    } catch {
      toast.error('Lỗi khi tải bảng điểm kết quả học tập');
    } finally {
      setLoading(false);
    }
  }, [transcriptService, studentService]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAppeal = (course) => {
    setAppealCourse(course);
    setAppealReason('');
    setAppealDesiredScore('');
  };

  const handleSubmitAppeal = async (e) => {
    e.preventDefault();
    if (!appealCourse || !appealReason.trim()) {
      toast.warning('Vui lòng nhập lý do phúc khảo');
      return;
    }
    try {
      setAppealSubmitting(true);
      await dataServices.gradeAppealService.create({
        sectionId: appealCourse.sectionId,
        reason: appealReason.trim(),
        desiredScore: appealDesiredScore ? parseFloat(appealDesiredScore) : null,
        scoreComponent: 'FINAL'
      });
      toast.success('Đã gửi đơn phúc khảo thành công! Hồ sơ đã được chuyển tới Phòng Đào tạo.');
      setAppealCourse(null);
      setAppealReason('');
      setAppealDesiredScore('');
      loadData();
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

      {transcript?.isLockedDueToTuition && (
        <div
          className="card"
          style={{
            marginTop: '20px',
            marginBottom: '20px',
            border: '2px solid #ef4444',
            background: 'rgba(239, 68, 68, 0.08)',
            padding: '20px',
            borderRadius: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <AlertTriangle size={32} style={{ color: '#ef4444', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 6px', color: '#ef4444', fontSize: '1.1rem', fontWeight: 700 }}>
                [FINANCIAL HOLD] BẢNG ĐIỂM THI KẾT THÚC HỌC KỲ BỊ TẠM KHÓA
              </h3>
              <p style={{ margin: '0 0 12px', color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                {transcript.lockReason || 'Bảng điểm kết thúc học kỳ bị tạm khóa do sinh viên chưa hoàn thành nghĩa vụ học phí. Vui lòng liên hệ Phòng Kế hoạch - Tài chính để mở khóa.'}
              </p>
              <a href="/student/my-enrollments" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Kiểm tra & Thanh toán học phí
              </a>
            </div>
          </div>
        </div>
      )}

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
                  Điểm học tập của bạn đang dưới ngưỡng chuẩn ({transcript.warningNotice}). Hạn mức đăng ký tín chỉ học kỳ tiếp theo: <strong>{transcript.maxAllowedCredits != null ? (transcript.maxAllowedCredits === 0 ? 'Khóa ĐKTC (Buộc thôi học)' : `${transcript.maxAllowedCredits} tín chỉ`) : '14 tín chỉ'}</strong>. Vui lòng liên hệ Cố vấn học tập hoặc Văn phòng Khoa để được hỗ trợ kế hoạch học tập.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Graduation Eligibility Status Banner */}
      {eligibility && (
        <div
          className="card"
          style={{
            marginTop: '20px',
            marginBottom: '20px',
            border: `1px solid ${eligibility.eligible ? '#10b981' : '#f59e0b'}`,
            background: eligibility.eligible ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)',
            padding: '18px 22px',
            borderRadius: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: eligibility.eligible ? '#10b981' : '#f59e0b',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <GraduationCap size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>
                    Tiến độ & Kết quả Thẩm định Tốt nghiệp
                  </h3>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: eligibility.eligible ? '#ecfdf5' : '#fef3c7',
                    color: eligibility.eligible ? '#059669' : '#d97706',
                  }}>
                    {eligibility.eligible ? 'ĐỦ ĐIỀU KIỆN TỐT NGHIỆP' : 'ĐANG TÍCH LŨY CHUẨN ĐẦU RA'}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Chương trình đào tạo: <b>{eligibility.programName || 'Chính quy chuẩn'}</b> • Đã tích lũy: <b>{eligibility.completedCredits}/{eligibility.requiredCredits} TC</b> ({eligibility.completionPercent}%) • CPA: <b>{eligibility.cumulativeGpa}</b>
                </p>
                {!eligibility.eligible && eligibility.unsatisfiedReasons?.length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#b45309' }}>
                    <b>Nội dung cần hoàn thiện:</b> {eligibility.unsatisfiedReasons.join('; ')}
                  </div>
                )}
              </div>
            </div>
            {eligibility.eligible && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: '600', fontSize: '13px' }}>
                <CheckCircle2 size={16} /> Chờ Hội đồng ban hành quyết định
              </span>
            )}
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
          <div className="stat-icon-wrapper stat-icon--cpa">
            <GraduationCap size={24} />
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
          <div className="stat-icon-wrapper stat-icon--credits">
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
          <div className="stat-icon-wrapper stat-icon--courses">
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
          <div className="stat-icon-wrapper stat-icon--standing">
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

        {/* Bento Card 5: Debt Credits */}
        <div className="stat-card" style={{
          position: 'relative',
          overflow: 'hidden',
          background: (transcript?.debtCredits || 0) > 0 ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, var(--bg-surface) 100%)' : 'var(--bg-surface)',
          borderColor: (transcript?.debtCredits || 0) > 0 ? 'rgba(239, 68, 68, 0.25)' : 'var(--border-color)',
        }}>
          <div className="stat-icon-wrapper" style={{ background: (transcript?.debtCredits || 0) > 0 ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-muted)', color: (transcript?.debtCredits || 0) > 0 ? '#ef4444' : 'var(--text-muted)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="stat-value" style={{ color: (transcript?.debtCredits || 0) > 24 ? '#ef4444' : 'inherit' }}>
              {transcript?.debtCredits || 0} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>TC</span>
            </div>
            <div className="stat-label" style={{ marginTop: '6px' }}>Tín chỉ nợ (chưa đạt)</div>
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
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.9rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span>
                  GPA Kỳ: <strong style={{ color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {sem.semesterGpa != null ? Number(sem.semesterGpa).toFixed(2) : '—'}
                  </strong>
                </span>
                <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}>
                  <Clock size={12} /> GPA Tạm tính: {sem.semesterGpa != null ? Number(sem.semesterGpa).toFixed(2) : '—'}
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
                    <th rowSpan="2" style={{ verticalAlign: 'middle' }}>Mã môn</th>
                    <th rowSpan="2" style={{ verticalAlign: 'middle' }}>Tên môn học</th>
                    <th rowSpan="2" style={{ textAlign: 'center', verticalAlign: 'middle' }}>Số TC</th>
                    <th colSpan="3" style={{ textAlign: 'center', background: 'rgba(37, 99, 235, 0.05)', borderBottom: '1px solid var(--border-color)', fontWeight: 700 }}>
                      Điểm Quá Trình (40%)
                    </th>
                    <th colSpan="1" style={{ textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)', borderBottom: '1px solid var(--border-color)', fontWeight: 700 }}>
                      Điểm Thi (60%)
                    </th>
                    <th colSpan="3" style={{ textAlign: 'center', background: 'rgba(245, 158, 11, 0.05)', borderBottom: '1px solid var(--border-color)', fontWeight: 700 }}>
                      Tổng Kết Môn
                    </th>
                    <th rowSpan="2" style={{ textAlign: 'center', verticalAlign: 'middle', minWidth: '95px' }}>
                      Phúc khảo
                    </th>
                  </tr>
                  <tr>
                    <th style={{ textAlign: 'center', background: 'rgba(37, 99, 235, 0.02)' }}>CC1 (5%)<br/><small style={{fontSize: '0.75em', fontWeight: 'normal'}}>Chuyên cần</small></th>
                    <th style={{ textAlign: 'center', background: 'rgba(37, 99, 235, 0.02)' }}>CC2 (5%)<br/><small style={{fontSize: '0.75em', fontWeight: 'normal'}}>Bài tập</small></th>
                    <th style={{ textAlign: 'center', background: 'rgba(37, 99, 235, 0.02)' }}>Giữa kỳ (30%)</th>
                    <th style={{ textAlign: 'center', background: 'rgba(16, 185, 129, 0.02)' }}>Cuối kỳ (60%)</th>
                    <th style={{ textAlign: 'center', background: 'rgba(245, 158, 11, 0.02)' }}>Thang 10</th>
                    <th style={{ textAlign: 'center', background: 'rgba(245, 158, 11, 0.02)' }}>Hệ 4</th>
                    <th style={{ textAlign: 'center', background: 'rgba(245, 158, 11, 0.02)' }}>Điểm chữ</th>
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
                        {c.status === 'ADJUSTING' || c.letterGrade === 'Đang điều chỉnh' ? (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: '#fffbeb',
                              color: '#b45309',
                              border: '1px solid #fde68a',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              padding: '3px 8px',
                              whiteSpace: 'nowrap'
                            }}
                            title="Bảng điểm đang được Phòng Đào tạo mở khóa để giảng viên rà soát, điều chỉnh"
                          >
                            Đang điều chỉnh
                          </span>
                        ) : c.isDisqualified || c.attendanceStatus === 'DISQUALIFIED' ? (
                          <span
                            className="badge badge-danger"
                            style={{
                              backgroundColor: '#fee2e2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              padding: '3px 8px',
                              whiteSpace: 'nowrap'
                            }}
                            title="Nghỉ quá 20% số tiết học phần - Bị cấm thi theo quy chế"
                          >
                            F (CẤM THI)
                          </span>
                        ) : (
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
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {c.canAppeal && !c.isDisqualified && c.attendanceStatus !== 'DISQUALIFIED' ? (
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '3px 10px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                            onClick={() => handleOpenAppeal(c)}
                            title="Nộp đơn phúc khảo điểm thi Cuối kỳ trong thời hạn 7 ngày"
                          >
                            Phúc khảo
                          </button>
                        ) : c.isFinalized ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} title="Thời hạn phúc khảo 7 ngày đã kết thúc">
                            Hết hạn
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
      {/* Modal Nộp Đơn Phúc Khảo (Luồng 2) */}
      {appealCourse && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setAppealCourse(null);
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: 'var(--bg-surface, #ffffff)',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Đơn Phúc Khảo Điểm Thi Cuối Kỳ
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Học phần: <strong>{appealCourse.subjectCode} — {appealCourse.subjectName}</strong>
                </p>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setAppealCourse(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitAppeal}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <div
                  style={{
                    backgroundColor: 'var(--bg-subtle, #f8fafc)',
                    border: '1px solid var(--border, #e2e8f0)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '0.88rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Lớp học phần:</span>
                    <strong>{appealCourse.sectionCode}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Cột điểm phúc khảo:</span>
                    <strong style={{ color: 'var(--primary)' }}>Điểm thi Cuối kỳ (CK 60%)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Điểm hiện tại trên hệ thống:</span>
                    <strong style={{ color: '#dc2626', fontSize: '1rem' }}>
                      {appealCourse.finalScore != null ? Number(appealCourse.finalScore).toFixed(1) : '—'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Ngày công bố điểm:</span>
                    <span>
                      {appealCourse.publishedAt
                        ? new Date(appealCourse.publishedAt).toLocaleDateString('vi-VN')
                        : 'Mới công bố'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                    Mức điểm sinh viên tự đánh giá / kỳ vọng (0 - 10):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    placeholder="Ví dụ: 8.0 (không bắt buộc)"
                    className="form-control"
                    value={appealDesiredScore}
                    onChange={(e) => setAppealDesiredScore(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                    Lý do phúc khảo chi tiết *
                  </label>
                  <textarea
                    rows="4"
                    required
                    placeholder="Ghi rõ lý do bạn đề nghị chấm lại bài thi (ví dụ: nghi vấn cộng sót điểm câu 3, lệch đáp án công bố, sai sót vào điểm...)"
                    className="form-control"
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                  />
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '0.82rem',
                    color: '#b45309',
                    lineHeight: 1.5,
                  }}
                >
                  ⚠️ <strong>Quy chế phúc khảo (Luồng 2):</strong> Đơn chỉ áp dụng cho điểm thi kết thúc học phần. Bài thi sẽ được chấm độc lập bởi Cán bộ chấm thi thứ 2. Kết quả có sự thay đổi $\ge 0.5$ điểm hoặc có sai sót cơ học sẽ được chuyển Trưởng bộ môn niêm phong phê duyệt trước khi cập nhật chính thức vào bảng điểm.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setAppealCourse(null)}
                  disabled={appealSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={appealSubmitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={15} />
                  <span>{appealSubmitting ? 'Đang gửi...' : 'Nộp đơn phúc khảo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
