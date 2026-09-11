import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, UserX, UserCheck, X, Filter, RotateCcw } from 'lucide-react';
import { toast } from 'react-toastify';
import { studentService, classService } from '../../services/dataService';
import useDebounce from '../../hooks/useDebounce';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const debouncedSearch = useDebounce(search, 350);

  const [formData, setFormData] = useState({
    studentCode: '',
    fullName: '',
    dateOfBirth: '',
    gender: 'Nam',
    email: '',
    phone: '',
    address: '',
    classId: '',
    status: 'ACTIVE',
    password: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (debouncedSearch.trim()) {
      executeSearch(debouncedSearch);
    } else {
      loadData();
    }
  }, [debouncedSearch]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resStu, resClass] = await Promise.all([
        studentService.getAll(),
        classService.getAll(),
      ]);
      setStudents(resStu.data.data || []);
      setClasses(resClass.data.data || []);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách sinh viên');
    } finally {
      setLoading(false);
    }
  };

  const executeSearch = async (keyword) => {
    try {
      setLoading(true);
      const res = await studentService.search(keyword);
      setStudents(res.data.data || []);
    } catch {
      toast.error('Lỗi khi tìm kiếm');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      executeSearch(search.trim());
    } else {
      loadData();
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedClass('');
    loadData();
  };

  const handleOpenModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        studentCode: student.studentCode || '',
        fullName: student.fullName || '',
        dateOfBirth: student.dateOfBirth ? student.dateOfBirth.substring(0, 10) : '',
        gender: student.gender || 'Nam',
        email: student.email || '',
        phone: student.phone || '',
        address: student.address || '',
        classId: student.classEntity?.id || '',
        status: student.status || 'ACTIVE',
        password: '',
      });
    } else {
      setEditingStudent(null);
      setFormData({
        studentCode: '',
        fullName: '',
        dateOfBirth: '',
        gender: 'Nam',
        email: '',
        phone: '',
        address: '',
        classId: classes[0]?.id || '',
        status: 'ACTIVE',
        password: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await studentService.update(editingStudent.id, formData);
        toast.success('Cập nhật sinh viên thành công!');
      } else {
        await studentService.create(formData);
        toast.success('Thêm sinh viên mới thành công!');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin');
    }
  };

  const handleToggleStatus = async (student) => {
    const isCurrentlyActive = student.status === 'ACTIVE' || student.status === 'STUDYING';
    const newStatus = isCurrentlyActive ? 'SUSPENDED' : 'STUDYING';
    try {
      await studentService.updateStatus(student.id, newStatus);
      toast.success(`Đã cập nhật trạng thái sang: ${newStatus === 'STUDYING' ? 'Đang học' : 'Tạm đình chỉ'}`);
      loadData();
    } catch {
      toast.error('Cập nhật trạng thái thất bại');
    }
  };

  const filteredStudents = selectedClass
    ? students.filter((s) => s.classEntity?.id === parseInt(selectedClass))
    : students;

  const getInitials = (name) => {
    if (!name) return 'SV';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Hồ Sơ Sinh Viên</h1>
          <p>
            Quản lý cơ sở dữ liệu sinh viên chính quy, thông tin học vụ và trạng thái đào tạo
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} />
            <span>Thêm sinh viên mới</span>
          </button>
        </div>
      </div>

      {/* Toolbar Search & Filter */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '320px', flexWrap: 'wrap' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '260px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input
                  type="text"
                  placeholder="Tìm theo mã SV, họ tên, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '36px' }}
                />
              </div>
              <button type="submit" className="btn btn-secondary">
                Tìm
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
              <Filter size={15} style={{ color: 'var(--text-muted)' }} />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="form-select"
                style={{ width: 'auto', minWidth: '180px' }}
              >
                <option value="">Tất cả các lớp</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>

            {(search || selectedClass) && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleResetFilters}
                title="Xóa bộ lọc"
                style={{ padding: '8px 12px' }}
              >
                <RotateCcw size={14} />
                <span>Đặt lại</span>
              </button>
            )}
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Hiển thị <strong>{filteredStudents.length}</strong> / <strong>{students.length}</strong> sinh viên
          </div>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Sinh viên</th>
                <th>Mã sinh viên</th>
                <th>Lớp sinh hoạt</th>
                <th>Khoa / Ngành</th>
                <th>Ngày sinh</th>
                <th>Giới tính</th>
                <th>Liên hệ</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Đang tải danh sách sinh viên...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Không tìm thấy sinh viên nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const isStudying = s.status === 'STUDYING' || s.status === 'ACTIVE';
                  const isGraduated = s.status === 'GRADUATED';
                  const isSuspended = s.status === 'SUSPENDED';

                  return (
                    <tr key={s.id}>
                      {/* Avatar & Name */}
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
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(s.fullName)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.fullName}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Student Code */}
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
                          {s.studentCode}
                        </span>
                      </td>

                      {/* Class */}
                      <td style={{ fontWeight: 500 }}>
                        {s.classEntity?.name || s.classEntity?.code || '—'}
                      </td>

                      {/* Department */}
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {s.classEntity?.department?.name || '—'}
                      </td>

                      {/* DoB */}
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {s.dateOfBirth ? s.dateOfBirth.substring(0, 10) : '—'}
                      </td>

                      {/* Gender */}
                      <td>
                        <span className="badge badge-neutral">{s.gender || 'Khác'}</span>
                      </td>

                      {/* Phone */}
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {s.phone || '—'}
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`badge ${
                            isStudying ? 'badge-success'
                            : isGraduated ? 'badge-info'
                            : isSuspended ? 'badge-warning'
                            : 'badge-danger'
                          }`}
                        >
                          {isStudying ? 'Đang học'
                          : isGraduated ? 'Tốt nghiệp'
                          : isSuspended ? 'Tạm đình chỉ'
                          : 'Thôi học'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button
                            className="btn-icon"
                            title="Chỉnh sửa thông tin"
                            onClick={() => handleOpenModal(s)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn-icon"
                            title={isStudying ? 'Tạm đình chỉ' : 'Kích hoạt lại'}
                            style={{ color: isStudying ? 'var(--warning)' : 'var(--success)' }}
                            onClick={() => handleToggleStatus(s)}
                          >
                            {isStudying ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit Student */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3>{editingStudent ? 'Cập nhật Thông Tin Sinh Viên' : 'Thêm Mới Sinh Viên'}</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Mã sinh viên *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingStudent}
                    value={formData.studentCode}
                    onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                    className="form-control"
                    placeholder="VD: 21010001"
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
                    placeholder="VD: Nguyễn Văn An"
                  />
                </div>
                <div>
                  <label className="form-label">Lớp sinh hoạt *</label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="form-select"
                  >
                    <option value="">-- Chọn lớp --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Giới tính *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="form-select"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Ngày sinh *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div>
                  <label className="form-label">Email học viện *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-control"
                    placeholder="sv@sms.edu.vn"
                  />
                </div>
                <div>
                  <label className="form-label">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="form-control"
                    placeholder="0987654321"
                  />
                </div>
                <div>
                  <label className="form-label">Trạng thái học vụ</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-select"
                  >
                    <option value="STUDYING">Đang học (STUDYING)</option>
                    <option value="GRADUATED">Đã tốt nghiệp (GRADUATED)</option>
                    <option value="SUSPENDED">Tạm đình chỉ (SUSPENDED)</option>
                    <option value="DROPPED">Thôi học (DROPPED)</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">
                    {editingStudent ? 'Mật khẩu mới (Để trống nếu giữ nguyên)' : 'Mật khẩu đăng nhập (Mặc định: 123456)'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="form-control"
                    placeholder={editingStudent ? 'Nhập mật khẩu mới nếu muốn đổi' : '123456'}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Địa chỉ cư trú</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="form-control"
                    placeholder="Hà Đông, Hà Nội"
                  />
                </div>
                {!editingStudent && (
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
                    💡 <strong>Cấp quyền tự động:</strong> Tài khoản đăng nhập hệ thống sẽ được tạo tự động với Tên đăng nhập là <strong>Mã sinh viên</strong> (chữ thường) và Mật khẩu là <strong>123456</strong> (hoặc mật khẩu vừa cấu hình).
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStudent ? 'Lưu cập nhật' : 'Tạo sinh viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
