import TableRowSkeleton from '../../components/common/TableRowSkeleton';
import { useState, useEffect } from 'react';
import { Plus, Edit2, CheckCircle, XCircle, X, Filter, Search, RotateCcw, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';
import { classService, departmentService } from '../../services/dataService';

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchData, setBatchData] = useState({ cohort: 'K17', academicYear: '2025-2026', classesPerDepartment: 2 });
  const [generatingBatch, setGeneratingBatch] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    departmentId: '',
    academicYear: 'K18',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [resCls, resDept] = await Promise.all([
        classService.getAll(),
        departmentService.getAll(),
      ]);
      setClasses(resCls.data.data || []);
      setDepartments(resDept.data.data || []);
    } catch {
      toast.error('Lỗi khi tải dữ liệu lớp học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenModal = (cls = null) => {
    if (cls) {
      setEditingClass(cls);
      setFormData({
        code: cls.code || '',
        name: cls.name || '',
        departmentId: cls.department?.id || '',
        academicYear: cls.academicYear || 'K18',
      });
    } else {
      setEditingClass(null);
      setFormData({
        code: '',
        name: '',
        departmentId: departments[0]?.id || '',
        academicYear: 'K18',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await classService.update(editingClass.id, formData);
        toast.success('Cập nhật lớp thành công!');
      } else {
        await classService.create(formData);
        toast.success('Thêm lớp mới thành công!');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleToggle = async (id) => {
    try {
      await classService.toggleActive(id);
      toast.success('Cập nhật trạng thái thành công!');
      loadData();
    } catch {
      toast.error('Cập nhật trạng thái thất bại');
    }
  };

  const handleBatchGenerate = async (e) => {
    e.preventDefault();
    try {
      setGeneratingBatch(true);
      const res = await classService.batchGenerate(batchData);
      toast.success(res.data?.message || 'Đã tự động khởi tạo danh sách lớp sinh hoạt thành công!');
      setIsBatchModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi khi tự động tạo lớp');
    } finally {
      setGeneratingBatch(false);
    }
  };

  const filtered = classes.filter((c) => {
    const matchDept = selectedDept ? c.department?.id === parseInt(selectedDept) : true;
    const matchSearch = search
      ? c.code?.toLowerCase().includes(search.toLowerCase()) ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.department?.name?.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchDept && matchSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Lớp Học Sinh Hoạt</h1>
          <p>
            Quản lý danh sách các lớp sinh hoạt hành chính theo từng niên khóa và khoa chuyên ngành
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={() => setIsBatchModalOpen(true)} title="Tự động sinh lớp cho Khóa mới">
            <Sparkles size={16} />
            <span>Khởi tạo theo Khóa</span>
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} />
            <span>Thêm lớp mới</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type="text"
                placeholder="Tìm mã hoặc tên lớp..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '36px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '220px' }}>
              <Filter size={15} style={{ color: 'var(--text-muted)' }} />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="form-select"
                style={{ width: 'auto', minWidth: '190px' }}
              >
                <option value="">Tất cả khoa viện</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            {(search || selectedDept) && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => { setSearch(''); setSelectedDept(''); }}
                title="Xóa bộ lọc"
                style={{ padding: '8px 12px' }}
              >
                <RotateCcw size={14} />
                <span>Đặt lại</span>
              </button>
            )}
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Hiển thị <strong>{filtered.length}</strong> / <strong>{classes.length}</strong> lớp
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã lớp</th>
                <th>Tên lớp sinh hoạt</th>
                <th>Khoa trực thuộc</th>
                <th>Niên khóa</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowSkeleton columns={6} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Không tìm thấy lớp học nào phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id}>
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
                        {c.code}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.department?.name || '—'}</td>
                    <td>
                      <span className="badge badge-info">{c.academicYear}</span>
                    </td>
                    <td>
                      <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {c.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button className="btn-icon" title="Sửa" onClick={() => handleOpenModal(c)}>
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn-icon"
                          title={c.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                          style={{ color: c.isActive ? 'var(--danger)' : 'var(--success)' }}
                          onClick={() => handleToggle(c.id)}
                        >
                          {c.isActive ? <XCircle size={15} /> : <CheckCircle size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>{editingClass ? 'Cập Nhật Lớp Sinh Hoạt' : 'Thêm Lớp Sinh Hoạt Mới'}</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">Mã lớp *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="form-control"
                    placeholder="VD: K18-CNTT1"
                  />
                </div>
                <div>
                  <label className="form-label">Tên lớp *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-control"
                    placeholder="VD: Công nghệ thông tin 1 - K18"
                  />
                </div>
                <div>
                  <label className="form-label">Khoa trực thuộc *</label>
                  <select
                    required
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="form-select"
                  >
                    <option value="">-- Chọn khoa --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Khoá học (Niên khoá) *</label>
                  <input
                    type="text"
                    required
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="form-control"
                    placeholder="VD: K18"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Huỷ</button>
                <button type="submit" className="btn btn-primary">{editingClass ? 'Lưu thay đổi' : 'Tạo lớp'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Generate Modal */}
      {isBatchModalOpen && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Khởi Tạo Nhanh Lớp Theo Khóa</h3>
              <button type="button" className="btn btn-outline" style={{ padding: '6px' }} onClick={() => setIsBatchModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleBatchGenerate}>
              <div className="modal-body" style={{ display: 'grid', gap: '16px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Hệ thống sẽ tự động quét toàn bộ các Khoa đang hoạt động ({departments.length} khoa) và sinh mã lớp theo quy tắc:
                  <code style={{ display: 'block', margin: '6px 0', padding: '6px 10px', background: 'var(--bg-hover)', borderRadius: '4px', color: 'var(--primary)', fontWeight: 600 }}>
                    [MÃ_KHOA][STT]-[KHÓA] (VD: CNTT01-{batchData.cohort || 'K17'})
                  </code>
                </p>
                <div>
                  <label className="form-label">Tên Khóa sinh viên *</label>
                  <input
                    type="text"
                    required
                    value={batchData.cohort}
                    onChange={(e) => setBatchData({ ...batchData, cohort: e.target.value })}
                    className="form-control"
                    placeholder="VD: K17"
                  />
                </div>
                <div>
                  <label className="form-label">Niên khóa / Năm học *</label>
                  <input
                    type="text"
                    required
                    value={batchData.academicYear}
                    onChange={(e) => setBatchData({ ...batchData, academicYear: e.target.value })}
                    className="form-control"
                    placeholder="VD: 2025-2026"
                  />
                </div>
                <div>
                  <label className="form-label">Số lớp cần tạo cho mỗi Khoa *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={batchData.classesPerDepartment}
                    onChange={(e) => setBatchData({ ...batchData, classesPerDepartment: parseInt(e.target.value) || 1 })}
                    className="form-control"
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                    Dự kiến sinh tối đa: {departments.length * (batchData.classesPerDepartment || 1)} lớp (bỏ qua nếu mã đã tồn tại).
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsBatchModalOpen(false)} disabled={generatingBatch}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={generatingBatch}>
                  {generatingBatch ? 'Đang tạo...' : 'Tự động tạo lớp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
