import { useEffect, useState } from 'react';
import { AlertTriangle, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import { academicWarningService, semesterService } from '../../services/dataService';

export default function AcademicWarningsPage() {
  const [warnings, setWarnings] = useState([]);
  const [level, setLevel] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadWarnings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (level) params.level = level;
      if (semesterId) params.semesterId = semesterId;
      const response = await academicWarningService.getAll(params);
      setWarnings(response.data.data || []);
    } catch {
      toast.error('Lỗi khi tải danh sách cảnh báo học vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    semesterService.getAll()
      .then((response) => setSemesters(response.data.data || []))
      .catch(() => toast.error('Không thể tải danh sách học kỳ'));
  }, []);

  useEffect(() => { loadWarnings(); }, [level, semesterId]);

  const exportCsv = () => {
    const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = [
      ['Mã SV', 'Họ tên', 'Lớp', 'CPA', 'Xếp loại', 'Học kỳ gần nhất', 'GPA kỳ', 'Mức cảnh báo', 'Nội dung'],
      ...warnings.map((item) => [
        item.studentCode, item.studentName, item.className, item.cumulativeGpa,
        item.academicStanding, item.semesterName, item.semesterGpa,
        item.warningLevel, item.warningNotice,
      ]),
    ];
    const csv = '\uFEFF' + rows.map((row) => row.map(escape).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'danh-sach-canh-bao-hoc-vu.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Cảnh báo học vụ</h1>
          <p>Tra cứu sinh viên có kết quả học tập dưới ngưỡng quy định.</p>
        </div>
        <button className="btn btn-outline" onClick={exportCsv} disabled={!warnings.length}>
          <Download size={16} /> Xuất danh sách (Excel)
        </button>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="form-select" style={{ width: '260px' }} value={semesterId} onChange={(e) => setSemesterId(e.target.value)}>
            <option value="">Tất cả học kỳ</option>
            {semesters.map((semester) => <option key={semester.id} value={semester.id}>
              {semester.semesterName || semester.semesterCode} ({semester.academicYear})
            </option>)}
          </select>
          <select className="form-select" style={{ width: '180px' }} value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">Tất cả mức</option>
            <option value="1">Mức 1</option>
            <option value="2">Mức 2</option>
            <option value="3">Mức 3</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Sinh viên</th><th>Lớp</th><th>CPA</th><th>Học lực</th><th>Học kỳ gần nhất</th><th>Mức</th><th>Thông báo</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Đang tải...</td></tr>
                : warnings.length === 0 ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Không có sinh viên bị cảnh báo.</td></tr>
                : warnings.map((item) => (
                  <tr key={item.studentId}>
                    <td><strong>{item.studentCode}</strong><br /><span style={{ color: 'var(--text-secondary)' }}>{item.studentName}</span></td>
                    <td>{item.className}</td>
                    <td>{Number(item.cumulativeGpa || 0).toFixed(2)}</td>
                    <td>{item.academicStanding}</td>
                    <td>{item.semesterName || '—'}<br />GPA: {item.semesterGpa == null ? '—' : Number(item.semesterGpa).toFixed(2)}</td>
                    <td><span className={`badge ${item.warningLevel >= 3 ? 'badge-danger' : 'badge-warning'}`}><AlertTriangle size={13} /> Mức {item.warningLevel}</span></td>
                    <td style={{ maxWidth: '300px' }}>{item.warningNotice}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
