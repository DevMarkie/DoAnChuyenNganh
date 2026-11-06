import { useState, useEffect } from 'react';
import {
  Plus, Search, Edit2, CheckCircle, XCircle, X, RotateCcw,
  KeyRound, ShieldCheck, Calendar, UserCheck
} from 'lucide-react';
import { toast } from 'react-toastify';
import { staffService } from '../../services/dataService';
import TableRowSkeleton from '../../components/common/TableRowSkeleton';

export default function StaffsPage() {
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    dateOfBirth: '',
    roleName: 'ACADEMIC_AFFAIRS',
    isActive: true,
  });

  const loadStaffs = async () => {
    try {
      setLoading(true);
      const res = await staffService.getAll();
      setStaffs(res.data.data || []);
    } catch {
      toast.error('Lỗi khi tải danh sách cán bộ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffs();
  }, []);

  const handleOpenModal = (staff = null) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        username: staff.username || '',
        fullName: staff.fullName || '',
        email: staff.email || '',
        dateOfBirth: staff.dateOfBirth ? staff.dateOfBirth.substring(0, 10) : '',
        roleName: staff.role || 'ACADEMIC_AFFAIRS',
        isActive: staff.isActive !== false,
      });
    } else {
      setEditingStaff(null);
      setFormData({
        username: '',
        fullName: '',
        email: '',
        dateOfBirth: '',
        roleName: 'ACADEMIC_AFFAIRS',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.warning('Vui lòng nhập họ và tên');
      return;
    }
    if (!formData.email.trim()) {
      toast.warning('Vui lòng nhập email');
      return;
    }
    if (!formData.dateOfBirth) {
      toast.warning('Vui lòng chọn ngày tháng năm sinh');
      return;
    }

    try {
      setSubmitting(true);
      if (editingStaff) {
        await staffService.update(editingStaff.id, {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          dateOfBirth: formData.dateOfBirth,
          roleName: formData.roleName,
          isActive: formData.isActive,
        });
        toast.success('Cập nhật thông tin cán bộ thành công');
      } else {
        if (!formData.username.trim()) {
          toast.warning('Vui lòng nhập tên đăng nhập');
          setSubmitting(false);
          return;
        }
        const res = await staffService.create({
          username: formData.username.trim(),
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          dateOfBirth: formData.dateOfBirth,
          roleName: formData.roleName,
        });
        toast.success(res.data.message || 'Tạo cán bộ thành công!', { autoClose: 7000 });
      }
      handleCloseModal();
      loadStaffs();
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin cán bộ';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (staff) => {
    if (!staff.dateOfBirth) {
      toast.error(`Cán bộ ${staff.fullName || staff.username} chưa có ngày sinh. Vui lòng cập nhật ngày sinh trước!`);
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn cấp lại mật khẩu cho cán bộ "${staff.fullName || staff.username}" theo ngày sinh?`)) {
      return;
    }
    try {
      const res = await staffService.resetPassword(staff.id);
      toast.success(res.data.message || 'Đã cấp lại mật khẩu thành công!', { autoClose: 8000 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi cấp lại mật khẩu');
    }
  };

  const handleToggleActive = async (staff) => {
    const action = staff.isActive ? 'khóa' : 'kích hoạt';
    if (!window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản cán bộ "${staff.fullName || staff.username}"?`)) {
      return;
    }
    try {
      await staffService.update(staff.id, {
        fullName: staff.fullName,
        email: staff.email,
        dateOfBirth: staff.dateOfBirth ? staff.dateOfBirth.substring(0, 10) : null,
        roleName: staff.role,
        isActive: !staff.isActive,
      });
      toast.success(`Đã ${action} tài khoản thành công!`);
      loadStaffs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Chưa có</span>;
    const parts = dateStr.substring(0, 10).split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const filteredStaffs = staffs.filter((s) => {
    const matchSearch =
      !search.trim() ||
      (s.fullName && s.fullName.toLowerCase().includes(search.toLowerCase())) ||
      (s.username && s.username.toLowerCase().includes(search.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase()));

    const matchRole = !selectedRole || s.role === selectedRole;
    return matchSearch && matchRole;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="badge badge-danger">Quản trị viên</span>;
      case 'ACADEMIC_AFFAIRS':
        return <span className="badge badge-info">Cán bộ Đào tạo</span>;
      case 'EXAMINATION_OFFICER':
        return <span className="badge badge-purple">Cán bộ Khảo thí</span>;
      default:
        return <span className="badge badge-secondary">{role}</span>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>
            <ShieldCheck size={26} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px', color: 'var(--primary)' }} />
            Quản lý Cán bộ & Nhân viên
          </h1>
          <p>
            Danh sách nhân viên, cán bộ trường với chức danh và ngày sinh (mật khẩu tự động: <code>ddmmyyyya@</code>)
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} />
            <span>Thêm Cán bộ mới</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type="text"
                placeholder="Tìm theo họ tên, username, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '36px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="form-select"
                style={{ width: 'auto', minWidth: '180px' }}
              >
                <option value="">Tất cả chức danh</option>
                <option value="ADMIN">Quản trị viên (Admin)</option>
                <option value="ACADEMIC_AFFAIRS">Cán bộ Đào tạo</option>
                <option value="EXAMINATION_OFFICER">Cán bộ Khảo thí</option>
              </select>
            </div>

            {(search || selectedRole) && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => { setSearch(''); setSelectedRole(''); }}
                title="Xóa bộ lọc"
                style={{ padding: '8px 12px' }}
              >
                <RotateCcw size={14} />
                <span>Đặt lại</span>
              </button>
            )}
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Hiển thị <strong>{filteredStaffs.length}</strong> / <strong>{staffs.length}</strong> cán bộ
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Họ và Tên</th>
                <th>Tài khoản</th>
                <th>Chức danh / Vai trò</th>
                <th>Ngày sinh (DOB)</th>
                <th>Email</th>
                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <TableRowSkeleton rows={5} columns={8} />
              ) : filteredStaffs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Không tìm thấy cán bộ / nhân viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredStaffs.map((staff, idx) => (
                  <tr key={staff.id}>
                    <td style={{ color: 'var(--text-light)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserCheck size={16} style={{ color: 'var(--primary)' }} />
                        <span>{staff.fullName || staff.username}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.82rem',
                        backgroundColor: 'var(--bg-subtle)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-secondary)'
                      }}>
                        {staff.username}
                      </span>
                    </td>
                    <td>{getRoleBadge(staff.role)}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.82rem',
                        backgroundColor: 'var(--warning-bg)',
                        color: 'var(--warning-text)',
                        border: '1px solid var(--warning-border)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)'
                      }}>
                        <Calendar size={13} />
                        {formatDate(staff.dateOfBirth)}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{staff.email}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${staff.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {staff.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button
                          className="btn-icon"
                          title="Cấp lại mật khẩu theo ngày sinh (ddmmyyyya@)"
                          style={{ color: '#b45309' }}
                          onClick={() => handleResetPassword(staff)}
                        >
                          <KeyRound size={15} />
                        </button>
                        <button
                          className="btn-icon"
                          title="Chỉnh sửa cán bộ"
                          style={{ color: 'var(--primary)' }}
                          onClick={() => handleOpenModal(staff)}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn-icon"
                          title={staff.isActive ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                          style={{ color: staff.isActive ? 'var(--danger)' : 'var(--success)' }}
                          onClick={() => handleToggleActive(staff)}
                        >
                          {staff.isActive ? <XCircle size={15} /> : <CheckCircle size={15} />}
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

      {/* Modal Thêm / Sửa Cán bộ */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}>
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3>{editingStaff ? 'Cập Nhật Thông Tin Cán Bộ' : 'Thêm Cán Bộ & Nhân Viên Mới'}</h3>
              <button className="btn-icon" onClick={handleCloseModal}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {!editingStaff && (
                  <div
                    style={{
                      padding: '12px 14px',
                      backgroundColor: 'var(--primary-light)',
                      border: '1px solid var(--primary-border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      color: 'var(--text-main)',
                      lineHeight: '1.5',
                    }}
                  >
                    💡 <strong>Quy tắc bảo mật:</strong> Mật khẩu khởi tạo sẽ được tự động sinh từ ngày sinh: <code>ddmmyyyya@</code> (Ví dụ: sinh ngày 15/05/1990 ➔ mật khẩu là <code>15051990a@</code>).
                  </div>
                )}

                <div>
                  <label className="form-label">Họ và Tên cán bộ *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn Đào"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="form-label">Tên đăng nhập (Username) {!editingStaff && '*'}</label>
                  <input
                    type="text"
                    required={!editingStaff}
                    disabled={!!editingStaff}
                    placeholder="Ví dụ: daotao02"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="form-control"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">Ngày tháng năm sinh *</label>
                    <input
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div>
                    <label className="form-label">Chức danh / Vai trò *</label>
                    <select
                      value={formData.roleName}
                      onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                      className="form-select"
                    >
                      <option value="ACADEMIC_AFFAIRS">Cán bộ Đào tạo</option>
                      <option value="EXAMINATION_OFFICER">Cán bộ Khảo thí</option>
                      <option value="ADMIN">Quản trị viên (Admin)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Email liên hệ *</label>
                  <input
                    type="email"
                    required
                    placeholder="canbo@sms.edu.vn"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-control"
                  />
                </div>

                {editingStaff && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
                    <input
                      type="checkbox"
                      id="isActiveStaff"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label htmlFor="isActiveStaff" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                      Tài khoản đang hoạt động
                    </label>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal} disabled={submitting}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : editingStaff ? 'Cập nhật' : 'Tạo Cán bộ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
