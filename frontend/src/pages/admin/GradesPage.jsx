import { useState, useEffect } from 'react';
import { Layers, Save, CheckCircle2, ClipboardList, Award, TrendingUp, AlertCircle, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import { courseSectionService, gradeService } from '../../services/dataService';

export default function AdminGradesPage() {
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const res = await courseSectionService.getAll();
      const secList = res.data.data || [];
      setSections(secList);
      if (secList.length > 0) {
        setSelectedSection(secList[0].id);
        loadGrades(secList[0].id);
      }
    } catch {
      toast.error('Lỗi khi tải danh sách học phần');
    }
  };

  const loadGrades = async (sectionId) => {
    try {
      setLoading(true);
      const res = await gradeService.getBySection(sectionId);
      setGrades(res.data.data || []);
    } catch {
      toast.error('Lỗi khi tải bảng điểm');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (e) => {
    const secId = e.target.value;
    setSelectedSection(secId);
    loadGrades(secId);
  };

  const handleScoreChange = (index, field, value) => {
    const val = value === '' ? '' : parseFloat(value);
    const updated = [...grades];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    setGrades(updated);
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const payload = grades.map((g) => ({
        enrollmentId: g.enrollment?.id,
        attendanceScore: g.attendanceScore != null ? g.attendanceScore : null,
        midtermScore: g.midtermScore != null ? g.midtermScore : null,
        finalScore: g.finalScore != null ? g.finalScore : null,
        finalize: false,
      }));
      await gradeService.saveBatch(payload);
      toast.success('Đã lưu bảng điểm thành công!');
      loadGrades(selectedSection);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi khi lưu bảng điểm');
    } finally {
      setSaving(false);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedSection) return;
    try {
      const res = await gradeService.exportExcel(selectedSection);
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const sec = sections.find(s => s.id === parseInt(selectedSection));
      link.href = url;
      link.download = `bang_diem_${sec?.sectionCode || selectedSection}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Đã tải xuống file Excel!');
    } catch {
      toast.error('Lỗi khi xuất file Excel');
    }
  };

  const isStudentPassed = (g) => {
    if (g.isPassed !== undefined && g.isPassed !== null) return g.isPassed;
    if (g.letterGrade) return g.letterGrade !== 'F';
    if (g.totalScore != null) return parseFloat(g.totalScore) >= 4.0;
    return null;
  };

  const activeSection = sections.find((s) => s.id === parseInt(selectedSection));
  const passedCount = grades.filter((g) => isStudentPassed(g) === true).length;
  const gradedCount = grades.filter((g) => g.totalScore != null).length;
  const passRate = gradedCount > 0 ? Math.round((passedCount / gradedCount) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bảng Điểm & Kết Quả Học Phần</h1>
          <p>
            Tra cứu kết quả học tập, nhập điểm chuyên cần, giữa kỳ và thi kết thúc môn toàn khóa
          </p>
        </div>
        {grades.length > 0 && (
          <div className="page-header-actions" style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={handleExportExcel} title="Xuất bảng điểm ra file Excel">
              <Download size={16} />
              <span>Xuất Excel</span>
            </button>
            <button className="btn btn-primary" disabled={saving} onClick={handleSaveAll}>
              <Save size={16} />
              <span>{saving ? 'Đang lưu điểm...' : 'Lưu tất cả điểm'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Section Selector Toolbar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '320px' }}>
            <Layers size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
              Chọn Lớp Học Phần:
            </span>
            <select
              value={selectedSection}
              onChange={handleSectionChange}
              className="form-select"
              style={{ flex: 1, maxWidth: '560px' }}
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sectionCode} — {s.subject?.subjectName} ({s.semester?.semesterName} • GV: {s.lecturer?.fullName || 'Chưa phân công'})
                </option>
              ))}
            </select>
          </div>

          {activeSection && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.85rem' }}>
              <span className="badge badge-info">{activeSection.subject?.credits} Tín chỉ</span>
              <span className="badge badge-neutral">Sĩ số: {grades.length} SV</span>
              {gradedCount > 0 && (
                <span className="badge badge-success">Đạt: {passRate}%</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grade Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã Sinh Viên</th>
                <th>Họ và Tên Sinh Viên</th>
                <th style={{ textAlign: 'center' }}>Chuyên Cần (10%)</th>
                <th style={{ textAlign: 'center' }}>Giữa Kỳ (30%)</th>
                <th style={{ textAlign: 'center' }}>Cuối Kỳ (60%)</th>
                <th style={{ textAlign: 'center' }}>Tổng Kết (Hệ 10)</th>
                <th style={{ textAlign: 'center' }}>Hệ 4</th>
                <th style={{ textAlign: 'center' }}>Điểm Chữ</th>
                <th style={{ textAlign: 'center' }}>Kết Quả</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Đang tải bảng điểm học phần...
                  </td>
                </tr>
              ) : grades.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Chưa có sinh viên nào đăng ký lớp học phần này.
                  </td>
                </tr>
              ) : (
                grades.map((g, idx) => (
                  <tr key={g.id || idx}>
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
                        {g.enrollment?.student?.studentCode}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {g.enrollment?.student?.fullName}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={g.attendanceScore ?? ''}
                        onChange={(e) => handleScoreChange(idx, 'attendanceScore', e.target.value)}
                        className="form-control"
                        style={{
                          width: '68px',
                          padding: '6px',
                          textAlign: 'center',
                          margin: '0 auto',
                          fontWeight: 600,
                        }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={g.midtermScore ?? ''}
                        onChange={(e) => handleScoreChange(idx, 'midtermScore', e.target.value)}
                        className="form-control"
                        style={{
                          width: '68px',
                          padding: '6px',
                          textAlign: 'center',
                          margin: '0 auto',
                          fontWeight: 600,
                        }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={g.finalScore ?? ''}
                        onChange={(e) => handleScoreChange(idx, 'finalScore', e.target.value)}
                        className="form-control"
                        style={{
                          width: '68px',
                          padding: '6px',
                          textAlign: 'center',
                          margin: '0 auto',
                          fontWeight: 600,
                        }}
                      />
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--text-main)' }}>
                      {g.totalScore != null ? Number(g.totalScore).toFixed(1) : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-info" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {(g.gpaPoint ?? g.score4) != null ? Number(g.gpaPoint ?? g.score4).toFixed(2) : '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--primary)' }}>
                      {g.letterGrade || '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isStudentPassed(g) != null ? (
                        <span className={`badge ${isStudentPassed(g) ? 'badge-success' : 'badge-danger'}`}>
                          {isStudentPassed(g) ? 'ĐẠT' : 'HỌC LẠI'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>Chưa chốt</span>
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
