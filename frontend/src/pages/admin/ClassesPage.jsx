import { useState, useEffect } from 'react';
import { Plus, Edit2, CheckCircle, XCircle, X, School, Filter, Search, RotateCcw } from 'lucide-react';
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

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    departmentId: '',
    academicYear: 'K18',
  });

  useEffect(() => {
    loadData();
  }, []);

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
        <div className="page-header-actions">
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
                <th>Mã Lớp</th>
                <th>Tên Lớp Sinh Hoạt</th>
                <th>Khoa Trực Thuộc</th>
                <th>Niên Khóa</th>
                <th>Trạng Thái</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Đang tải danh sách lớp học...
                  </td>
                </tr>
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
        <div className="modal-backdrop">
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
    </div>
  );
}
