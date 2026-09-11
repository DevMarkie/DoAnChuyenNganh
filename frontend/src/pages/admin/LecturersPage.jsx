import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, CheckCircle, XCircle, X, UserCog, Filter, RotateCcw } from 'lucide-react';
import { toast } from 'react-toastify';
import { lecturerService, departmentService } from '../../services/dataService';

export default function LecturersPage() {
  const [lecturers, setLecturers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState(null);

  const [formData, setFormData] = useState({
    lecturerCode: '',
    fullName: '',
    gender: 'Nam',
    dateOfBirth: '',
    email: '',
    phone: '',
    departmentId: '',
    degree: 'Thạc sĩ',
    specialization: '',
    password: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resLec, resDept] = await Promise.all([
        lecturerService.getAll(),
        departmentService.getAll(),
      ]);
      setLecturers(resLec.data.data || []);
      setDepartments(resDept.data.data || []);
    } catch {
      toast.error('Lỗi khi tải danh sách giảng viên');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) {
      loadData();
      return;
    }
    try {
      setLoading(true);
      const res = await lecturerService.search(search);
      setLecturers(res.data.data || []);
    } catch {
      toast.error('Lỗi khi tìm kiếm');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (lec = null) => {
    if (lec) {
      setEditingLecturer(lec);
      setFormData({
        lecturerCode: lec.lecturerCode || '',
        fullName: lec.fullName || '',
        gender: lec.gender || 'Nam',
        dateOfBirth: lec.dateOfBirth ? lec.dateOfBirth.substring(0, 10) : '',
        email: lec.email || '',
        phone: lec.phone || '',
        departmentId: lec.department?.id || '',
        degree: lec.degree || 'Thạc sĩ',
        specialization: lec.specialization || '',
        password: '',
      });
    } else {
      setEditingLecturer(null);
      setFormData({
        lecturerCode: '',
        fullName: '',
        gender: 'Nam',
        dateOfBirth: '',
        email: '',
        phone: '',
        departmentId: departments[0]?.id || '',
        degree: 'Thạc sĩ',
        specialization: '',
        password: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLecturer) {
        await lecturerService.update(editingLecturer.id, formData);
        toast.success('Cập nhật giảng viên thành công!');
      } else {
        await lecturerService.create(formData);
        toast.success('Thêm giảng viên mới thành công!');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleToggle = async (id) => {
    try {
      await lecturerService.toggleActive(id);
      toast.success('Cập nhật trạng thái thành công!');
      loadData();
    } catch {
      toast.error('Cập nhật trạng thái thất bại');
    }
  };

  const filtered = lecturers.filter((l) => {
    const matchDept = selectedDept ? l.department?.id === parseInt(selectedDept) : true;
    const matchSearch = search
      ? l.lecturerCode?.toLowerCase().includes(search.toLowerCase()) ||
        l.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        l.email?.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchDept && matchSearch;
  });

  const getInitials = (name) => {
    if (!name) return 'GV';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Đội Ngũ Giảng Viên</h1>
          <p>
            Quản lý hồ sơ học hàm, học vị, bộ môn trực thuộc và thông tin giảng dạy của giảng viên
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} />
            <span>Thêm giảng viên</span>
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
                placeholder="Tìm mã GV, họ tên, email..."
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
            Hiển thị <strong>{filtered.length}</strong> / <strong>{lecturers.length}</strong> giảng viên
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Giảng Viên</th>
                <th>Mã GV</th>
                <th>Khoa Trực Thuộc</th>
                <th>Học Vị</th>
                <th>Chuyên Ngành</th>
                <th>Liên Hệ</th>
                <th>Trạng Thái</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Đang tải danh sách giảng viên...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Không tìm thấy giảng viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary)',
                            border: '1px solid var(--primary-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            flexShrink: 0
                          }}
                        >
                          {getInitials(l.fullName)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{l.fullName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{l.email}</div>
                        </div>
                      </div>
                    </td>
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
                        {l.lecturerCode}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{l.department?.name || '—'}</td>
                    <td>
                      <span className="badge badge-info">{l.degree || '—'}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: '240px' }}>{l.specialization || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{l.phone || '—'}</td>
                    <td>
                      <span className={`badge ${l.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {l.isActive ? 'Đang công tác' : 'Tạm nghỉ'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button className="btn-icon" title="Sửa" onClick={() => handleOpenModal(l)}>
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn-icon"
                          title={l.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                          style={{ color: l.isActive ? 'var(--danger)' : 'var(--success)' }}
                          onClick={() => handleToggle(l.id)}
                        >
                          {l.isActive ? <XCircle size={15} /> : <CheckCircle size={15} />}
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
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>{editingLecturer ? 'Cập Nhật Hồ Sơ Giảng Viên' : 'Thêm Giảng Viên Mới'}</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Mã giảng viên *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingLecturer}
                    value={formData.lecturerCode}
                    onChange={(e) => setFormData({ ...formData, lecturerCode: e.target.value })}
                    className="form-control"
                    placeholder="VD: GV010"
                  />
                </div>
                <div>
                  <label className="form-label">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="form-control"
                    placeholder="VD: TS. Nguyễn Văn B"
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
                  <label className="form-label">Học vị</label>
                  <select
                    value={formData.degree}
                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                    className="form-select"
                  >
                    <option value="Cử nhân">Cử nhân</option>
                    <option value="Thạc sĩ">Thạc sĩ</option>
                    <option value="Tiến sĩ">Tiến sĩ</option>
                    <option value="Phó Giáo sư">Phó Giáo sư</option>
                    <option value="Giáo sư">Giáo sư</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Email học viện *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-control"
                    placeholder="gv@sms.edu.vn"
                  />
                </div>
                <div>
                  <label className="form-label">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="form-control"
                    placeholder="0912345678"
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">
                    {editingLecturer ? 'Mật khẩu mới (Để trống nếu giữ nguyên)' : 'Mật khẩu đăng nhập (Mặc định: 123456)'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="form-control"
                    placeholder={editingLecturer ? 'Nhập mật khẩu mới nếu muốn đổi' : '123456'}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Chuyên môn / Lĩnh vực nghiên cứu</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="form-control"
                    placeholder="VD: Trí tuệ nhân tạo, Kỹ nghệ phần mềm, An toàn thông tin"
                  />
                </div>
                {!editingLecturer && (
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      padding: '12px 16px',
                      backgroundColor: 'var(--primary-light)',
                      border: '1px solid var(--primary-border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      color: 'var(--text-main)',
                      lineHeight: '1.5',
                    }}
                  >
                    💡 <strong>Cấp quyền tự động:</strong> Tài khoản giảng viên được tạo tự động với Tên đăng nhập là <strong>Mã GV</strong> (chữ thường, VD: <code>gv010</code>) và Mật khẩu mặc định là <strong>123456</strong>.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Huỷ</button>
                <button type="submit" className="btn btn-primary">{editingLecturer ? 'Lưu thay đổi' : 'Tạo giảng viên'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
