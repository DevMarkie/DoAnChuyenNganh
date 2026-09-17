import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, CheckCircle, XCircle, X, Building2, RotateCcw } from 'lucide-react';
import { toast } from 'react-toastify';
import { departmentService } from '../../services/dataService';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const res = await departmentService.getAll();
      setDepartments(res.data.data || []);
    } catch {
      toast.error('Lỗi khi tải danh sách khoa');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) {
      loadDepartments();
      return;
    }
    try {
      setLoading(true);
      const res = await departmentService.search(search);
      setDepartments(res.data.data || []);
    } catch {
      toast.error('Lỗi khi tìm kiếm khoa');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (dept = null) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({
        code: dept.code || '',
        name: dept.name || '',
        description: dept.description || '',
      });
    } else {
      setEditingDept(null);
      setFormData({ code: '', name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await departmentService.update(editingDept.id, formData);
        toast.success('Cập nhật thông tin khoa thành công!');
      } else {
        await departmentService.create(formData);
        toast.success('Thêm khoa mới thành công!');
      }
      setIsModalOpen(false);
      loadDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleToggle = async (id) => {
    try {
      await departmentService.toggleActive(id);
      toast.success('Cập nhật trạng thái thành công!');
      loadDepartments();
    } catch {
      toast.error('Cập nhật trạng thái thất bại');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Khoa Viện & Đơn Vị Đào Tạo</h1>
          <p>
            Cơ cấu tổ chức đào tạo, quản lý chuyên ngành và học phần trực thuộc nhà trường
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} />
            <span>Thêm khoa viện</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '460px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type="text"
                placeholder="Tìm theo mã hoặc tên khoa viện..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '36px' }}
              />
            </div>
            <button type="submit" className="btn btn-secondary">Tìm kiếm</button>
            {search && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => { setSearch(''); loadDepartments(); }}
                title="Xoá tìm kiếm"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </form>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Tổng cộng: <strong>{departments.length}</strong> đơn vị khoa viện
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã Khoa</th>
                <th>Tên Khoa Đào Tạo</th>
                <th>Mô Tả / Chuyên Môn</th>
                <th>Trạng Thái</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Đang tải danh sách khoa viện...
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Không có dữ liệu khoa viện nào
                  </td>
                </tr>
              ) : (
                departments.map((d) => (
                  <tr key={d.id}>
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
                        {d.code}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--bg-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--secondary)',
                            flexShrink: 0
                          }}
                        >
                          <Building2 size={16} />
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{d.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: '380px', lineHeight: '1.4' }}>
                      {d.description || '—'}
                    </td>
                    <td>
                      <span className={`badge ${d.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {d.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button className="btn-icon" title="Sửa" onClick={() => handleOpenModal(d)}>
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn-icon"
                          title={d.isActive ? 'Vô hiệu hoá' : 'Kích hoạt'}
                          style={{ color: d.isActive ? 'var(--danger)' : 'var(--success)' }}
                          onClick={() => handleToggle(d.id)}
                        >
                          {d.isActive ? <XCircle size={15} /> : <CheckCircle size={15} />}
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
              <h3>{editingDept ? 'Cập Nhật Khoa Viện' : 'Thêm Mới Khoa Viện'}</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">Mã khoa viện *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="form-control"
                    placeholder="VD: CNTT"
                  />
                </div>
                <div>
                  <label className="form-label">Tên khoa viện *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-control"
                    placeholder="VD: Khoa Công nghệ Thông tin"
                  />
                </div>
                <div>
                  <label className="form-label">Mô tả & Chức năng</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="form-control"
                    placeholder="Mô tả ngành nghề, bộ môn và định hướng chuyên môn..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Huỷ</button>
                <button type="submit" className="btn btn-primary">{editingDept ? 'Lưu thay đổi' : 'Tạo khoa'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
