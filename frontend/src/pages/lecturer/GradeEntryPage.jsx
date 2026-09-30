import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layers, Save, CheckCircle, AlertCircle, Award, CheckCircle2, Download, Lock } from 'lucide-react';
import { toast } from 'react-toastify';
import { courseSectionService, gradeService } from '../../services/dataService';

export default function GradeEntryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mySections, setMySections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(searchParams.get('sectionId') || '');
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const res = await courseSectionService.getMySections();
      const list = res.data.data || [];
      setMySections(list);
      const paramId = searchParams.get('sectionId');
      if (paramId) {
        setSelectedSection(paramId);
        loadGrades(paramId);
      } else if (list.length > 0) {
        setSelectedSection(list[0].id);
        loadGrades(list[0].id);
      }
    } catch {
      toast.error('Lỗi khi tải danh sách lớp học phần');
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
    setSearchParams({ sectionId: secId });
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

  const handleExportExcel = async () => {
    try {
      if (!selectedSection) return;
      const res = await gradeService.exportExcel(selectedSection);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BangDiem_LHP_${selectedSection}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Đã xuất bảng điểm ra file Excel thành công!');
    } catch {
      toast.error('Lỗi khi tải file Excel');
    }
  };

  const handleSave = async (finalize = false) => {
    try {
      setSaving(true);
      const payload = grades.map((g) => ({
        enrollmentId: g.enrollment?.id,
        cc1Score: g.cc1Score != null && g.cc1Score !== '' ? parseFloat(g.cc1Score) : null,
        cc2Score: g.cc2Score != null && g.cc2Score !== '' ? parseFloat(g.cc2Score) : null,
        midtermScore: g.midtermScore != null && g.midtermScore !== '' ? parseFloat(g.midtermScore) : null,
        finalScore: g.finalScore != null && g.finalScore !== '' ? parseFloat(g.finalScore) : null,
        finalize: finalize,
      }));
      await gradeService.saveBatch(payload);
      toast.success(finalize ? 'Đã hoàn tất chốt bảng điểm học phần!' : 'Đã lưu điểm thành công!');
      loadGrades(selectedSection);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi khi lưu điểm');
    } finally {
      setSaving(false);
    }
  };

  const isStudentPassed = (g) => {
    if (g.isPassed !== undefined && g.isPassed !== null) return g.isPassed;
    // Quy chế học lại: D (4.0/10) và F đều trượt; đạt tối thiểu D+ (>= 5.0).
    if (g.letterGrade) return g.letterGrade !== 'F' && g.letterGrade !== 'D';
    if (g.totalScore != null) return parseFloat(g.totalScore) >= 5.0;
    return null;
  };

  const currentSectionInfo = mySections.find((s) => s.id === parseInt(selectedSection));
  const passedCount = grades.filter((g) => isStudentPassed(g) === true).length;
  const gradedCount = grades.filter((g) => g.totalScore != null).length;
  const passRate = gradedCount > 0 ? Math.round((passedCount / gradedCount) * 100) : 0;
  const allGraded = grades.length > 0 && gradedCount === grades.length;
  // Activity #14 — cửa sổ ân hạn: sau khi chốt, GV còn 7 ngày để sửa; hết hạn mới khoá cứng.
  const isFinalized = grades.length > 0 && grades.every((g) => g.isFinalized);
  const isLocked = grades.length > 0 && grades.every((g) => g.editWindowExpired);
  // Cả lớp chốt cùng lúc nên finalizedAt gần như bằng nhau — lấy dòng đầu để tính số ngày còn lại.
  const editDaysLeft = (() => {
    const g = grades.find((x) => x.isFinalized && x.finalizedAt);
    if (!g) return null;
    const expireAt = new Date(g.finalizedAt).getTime() + 7 * 24 * 60 * 60 * 1000;
    return Math.max(0, Math.ceil((expireAt - Date.now()) / (24 * 60 * 60 * 1000)));
  })();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Sổ Điểm & Đánh Giá Học Phần</h1>
          <p>
            Quy chế tính điểm: Điểm tổng kết = (CC1 5% + CC2 5%) + GK 30% + CK 60%
          </p>
        </div>
        {grades.length > 0 && (
          <div className="page-header-actions" style={{ alignItems: 'center' }}>
            {isLocked ? (
              <span
                className="badge badge-neutral"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.85rem' }}
                title="Đã quá 7 ngày kể từ khi chốt. Liên hệ Quản trị viên để mở lại."
              >
                <Lock size={15} />
                ĐÃ KHOÁ · HẾT HẠN SỬA
              </span>
            ) : isFinalized ? (
              <span
                className="badge badge-success"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.85rem' }}
                title="Điểm đã công bố cho sinh viên. Bạn còn thời gian để chỉnh sửa trước khi khoá cứng."
              >
                <CheckCircle2 size={15} />
                ĐÃ CHỐT{editDaysLeft != null ? ` · còn ${editDaysLeft} ngày để sửa` : ''}
              </span>
            ) : null}
            <button className="btn btn-outline" onClick={handleExportExcel} title="Xuất bảng điểm ra file Excel">
              <Download size={16} />
              <span>Xuất Excel</span>
            </button>
            {!isLocked && !isFinalized && (
              <>
                <button className="btn btn-secondary" disabled={saving} onClick={() => handleSave(false)}>
                  <Save size={16} />
                  <span>{saving ? 'Đang lưu...' : 'Lưu bản nháp'}</span>
                </button>
                <button
                  className="btn btn-primary"
                  disabled={saving || !allGraded}
                  title={allGraded ? 'Chốt & công bố điểm học phần' : 'Phải nhập đủ điểm cho tất cả sinh viên trước khi chốt'}
                  onClick={() => handleSave(true)}
                >
                  <CheckCircle size={16} />
                  <span>Chốt & Công bố điểm</span>
                </button>
              </>
            )}
            {!isLocked && isFinalized && (
              <button className="btn btn-primary" disabled={saving} onClick={() => handleSave(false)}>
                <Save size={16} />
                <span>{saving ? 'Đang lưu...' : 'Lưu chỉnh sửa'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Selector Card */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '320px' }}>
            <Layers size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>Lớp học phần:</span>
            <select
              value={selectedSection}
              onChange={handleSectionChange}
              className="form-select"
              style={{ flex: 1, maxWidth: '540px' }}
            >
              {mySections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sectionCode} — {s.subject?.subjectName} ({s.semester?.semesterName})
                </option>
              ))}
            </select>
          </div>

          {currentSectionInfo && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.85rem' }}>
              <span className="badge badge-info">{currentSectionInfo.subject?.credits} Tín chỉ</span>
              <span className="badge badge-neutral">Sĩ số: {grades.length} SV</span>
              {gradedCount > 0 && (
                <span className="badge badge-success">Đạt: {passRate}%</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>STT</th>
                <th>Mã SV</th>
                <th>Họ và Tên Sinh Viên</th>
                <th>Lớp SH</th>
                <th style={{ textAlign: 'center' }}>CC1 (5%)<br/><small style={{fontSize: '0.8em', fontWeight: 'normal'}}>Chuyên cần</small></th>
                <th style={{ textAlign: 'center' }}>CC2 (5%)<br/><small style={{fontSize: '0.8em', fontWeight: 'normal'}}>Bài tập</small></th>
                <th style={{ textAlign: 'center' }}>GK (30%)</th>
                <th style={{ textAlign: 'center' }}>CK (60%)</th>
                <th style={{ textAlign: 'center' }}>Tổng Kết</th>
                <th style={{ textAlign: 'center' }}>Hệ 4</th>
                <th style={{ textAlign: 'center' }}>Điểm Chữ</th>
                <th style={{ textAlign: 'center' }}>Kết Quả</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Đang tải danh sách điểm sinh viên...
                  </td>
                </tr>
              ) : grades.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Lớp học phần này hiện chưa có sinh viên nào đăng ký.
                  </td>
                </tr>
              ) : (
                grades.map((g, idx) => (
                  <tr key={g.id || idx}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{idx + 1}</td>
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
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {g.enrollment?.student?.classEntity?.code || '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        placeholder="0.0"
                        value={g.cc1Score ?? ''}
                        onChange={(e) => handleScoreChange(idx, 'cc1Score', e.target.value)}
                        disabled={isLocked}
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
                        placeholder="0.0"
                        value={g.cc2Score ?? ''}
                        onChange={(e) => handleScoreChange(idx, 'cc2Score', e.target.value)}
                        disabled={isLocked}
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
                        placeholder="0.0"
                        value={g.midtermScore ?? ''}
                        onChange={(e) => handleScoreChange(idx, 'midtermScore', e.target.value)}
                        disabled={isLocked}
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
                        placeholder="0.0"
                        value={g.finalScore ?? ''}
                        onChange={(e) => handleScoreChange(idx, 'finalScore', e.target.value)}
                        disabled={isLocked}
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
