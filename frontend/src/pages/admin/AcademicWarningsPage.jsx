import TableRowSkeleton from '../../components/common/TableRowSkeleton';
import { useEffect, useState } from 'react';
import { AlertTriangle, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { academicWarningService, semesterService } from '../../services/dataService';
import { exportToCsv } from '../../utils/export';

export default function AcademicWarningsPage() {
  const [warnings, setWarnings] = useState([]);
  const [level, setLevel] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination states
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    semesterService.getAll()
      .then((response) => setSemesters(response.data.data || []))
      .catch(() => toast.error('Không thể tải danh sách học kỳ'));
  }, []);



  useEffect(() => {
    const loadWarnings = async () => {
      try {
        setLoading(true);
        const params = { page, size: pageSize };
        if (level) params.level = level;
        if (semesterId) params.semesterId = semesterId;
        const response = await academicWarningService.getAll(params);
        
        // Use standard paginated response
        setWarnings(response.data?.data || response.data?.content || []);
        setTotalPages(response.data?.totalPages || 1);
      } catch {
        toast.error('Lỗi khi tải danh sách cảnh báo học vụ');
      } finally {
        setLoading(false);
      }
    };
    loadWarnings();
  }, [level, semesterId, page]);

  const handleExportCsv = () => {
    const headers = ['Mã SV', 'Họ tên', 'Lớp', 'CPA', 'Xếp loại', 'Học kỳ gần nhất', 'GPA kỳ', 'Mức cảnh báo', 'Nội dung'];
    const mapper = (item) => [
      item.studentCode, item.studentName, item.className, item.cumulativeGpa,
      item.academicStanding, item.semesterName, item.semesterGpa,
      item.warningLevel, item.warningNotice,
    ];
    exportToCsv('danh-sach-canh-bao-hoc-vu.csv', headers, warnings, mapper);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Cảnh báo học vụ</h1>
          <p>Tra cứu sinh viên có kết quả học tập dưới ngưỡng quy định.</p>
        </div>
        <button className="btn btn-outline" onClick={handleExportCsv} disabled={!warnings.length}>
          <Download size={16} /> Xuất danh sách (Excel)
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body d-flex gap-3 flex-wrap align-items-center">
          <select 
            className="form-select form-select-sm w-auto min-w-200" 
            value={semesterId} 
            onChange={(e) => { setSemesterId(e.target.value); setPage(0); }}
          >
            <option value="">Tất cả học kỳ</option>
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.semesterName || semester.semesterCode} ({semester.academicYear})
              </option>
            ))}
          </select>
          <select 
            className="form-select form-select-sm w-auto min-w-150" 
            value={level} 
            onChange={(e) => { setLevel(e.target.value); setPage(0); }}
          >
            <option value="">Tất cả mức</option>
            <option value="1">Mức 1</option>
            <option value="2">Mức 2</option>
            <option value="3">Mức 3</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-container overflow-x-auto" style={{ borderTop: '1px solid #eee' }}>
          <table className="table table-hover table-sm" style={{ fontSize: '13px', margin: 0 }}>
            <thead>
              <tr>
                <th>Sinh viên</th>
                <th>Lớp</th>
                <th>CPA</th>
                <th>Học lực</th>
                <th>Học kỳ gần nhất</th>
                <th>Mức</th>
                <th>Thông báo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowSkeleton columns={7} />
              ) : warnings.length === 0 ? (
                <tr><td colSpan="7" className="text-center p-5 text-muted">Không có sinh viên bị cảnh báo.</td></tr>
              ) : (
                warnings.map((item) => (
                  <tr key={item.studentId} className="align-middle">
                    <td className="py-2">
                      <div style={{ fontWeight: 600 }}>{item.studentCode}</div>
                      <div className="text-secondary" style={{ fontSize: '11px' }}>{item.studentName}</div>
                    </td>
                    <td>{item.className}</td>
                    <td>{Number(item.cumulativeGpa || 0).toFixed(2)}</td>
                    <td>{item.academicStanding}</td>
                    <td>
                      {item.semesterName || '—'}<br />
                      GPA: {item.semesterGpa == null ? '—' : Number(item.semesterGpa).toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge ${item.warningLevel >= 3 ? 'badge-danger' : 'badge-warning'}`}>
                        <AlertTriangle size={13} /> Mức {item.warningLevel}
                      </span>
                    </td>
                    <td className="max-w-300">{item.warningNotice}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="card-footer d-flex justify-content-end align-items-center gap-3 p-3">
            <span className="text-muted text-sm">
              Trang {page + 1} / {totalPages}
            </span>
            <div className="btn-group">
              <button 
                className="btn btn-outline-secondary btn-sm" 
                disabled={page === 0 || loading} 
                onClick={() => setPage(p => Math.max(0, p - 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                className="btn btn-outline-secondary btn-sm" 
                disabled={page >= totalPages - 1 || loading} 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
