import { useState, useEffect } from 'react';
import { Award, BookOpen, Layers, CheckCircle2, FileText, Printer } from 'lucide-react';
import { toast } from 'react-toastify';
import { transcriptService } from '../../services/dataService';

export default function TranscriptPage() {
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTranscript();
  }, []);

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

  const gpa = transcript?.cumulativeGpa ? Number(transcript.cumulativeGpa).toFixed(2) : '0.00';

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
                <span className="badge badge-success">
                  Đạt: {sem.semesterCredits || 0} Tín chỉ
                </span>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã Môn</th>
                    <th>Tên Môn Học</th>
                    <th>Số TC</th>
                    <th style={{ textAlign: 'center' }}>Chuyên Cần (10%)</th>
                    <th style={{ textAlign: 'center' }}>Giữa Kỳ (30%)</th>
                    <th style={{ textAlign: 'center' }}>Cuối Kỳ (60%)</th>
                    <th style={{ textAlign: 'center' }}>Tổng Kết</th>
                    <th style={{ textAlign: 'center' }}>Hệ 4</th>
                    <th style={{ textAlign: 'center' }}>Điểm Chữ</th>
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
                        {c.attendanceScore != null ? Number(c.attendanceScore).toFixed(1) : '—'}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
