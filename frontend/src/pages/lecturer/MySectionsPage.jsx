import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Calendar, Users, ArrowUpRight, Search, BookOpen } from 'lucide-react';
import { toast } from 'react-toastify';
import { courseSectionService } from '../../services/dataService';

export default function MySectionsPage() {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoading(true);
      const res = await courseSectionService.getMySections();
      setSections(res.data.data || []);
    } catch {
      toast.error('Lỗi khi tải danh sách lớp học phần');
    } finally {
      setLoading(false);
    }
  };

  const filtered = sections.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.sectionCode?.toLowerCase().includes(q) ||
      s.subject?.subjectName?.toLowerCase().includes(q) ||
      s.semester?.semesterName?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Lớp Học Phần Giảng Dạy</h1>
          <p>
            Danh sách tất cả các lớp học phần được phân công giảng dạy theo các học kỳ đào tạo
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            <input
              type="text"
              placeholder="Tìm theo mã lớp, tên môn học..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Tổng số: <strong>{filtered.length}</strong> lớp học phần
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã Lớp HP</th>
                <th>Tên Môn Học</th>
                <th>Tín Chỉ</th>
                <th>Học Kỳ</th>
                <th>Lịch Học</th>
                <th>Phòng Học</th>
                <th>Sĩ Số Sinh Viên</th>
                <th>Trạng Thái</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Đang tải danh sách lớp học phần...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Không tìm thấy lớp học phần nào phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id}>
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
                        {s.sectionCode}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.subject?.subjectName}</td>
                    <td><span className="badge badge-info">{s.subject?.credits} TC</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.semester?.semesterName}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.schedule || '—'}</td>
                    <td><span className="badge badge-neutral">{s.room || '—'}</span></td>
                    <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {s.currentStudents || 0} / {s.maxStudents}
                    </td>
                    <td>
                      <span className={`badge ${s.status === 'OPEN' ? 'badge-success' : 'badge-info'}`}>
                        {s.status === 'OPEN' ? 'Đang mở ĐK' : 'Đang giảng dạy'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/lecturer/grades?sectionId=${s.id}`)}
                      >
                        <span>Vào sổ điểm</span>
                        <ArrowUpRight size={14} />
                      </button>
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
