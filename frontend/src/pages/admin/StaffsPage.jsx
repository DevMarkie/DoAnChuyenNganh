import { useState, useEffect } from 'react';
import {
  Plus, Search, Edit2, CheckCircle, XCircle, X, RotateCcw,
  KeyRound, ShieldCheck, Calendar, UserCheck, Building2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { staffService, departmentService } from '../../services/dataService';
import TableRowSkeleton from '../../components/common/TableRowSkeleton';

export default function StaffsPage() {
  const [staffs, setStaffs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'ADMIN' | 'ACADEMIC_AFFAIRS' | 'ACADEMIC_STAFF' | 'EXAMINATION_OFFICER'
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    dateOfBirth: '',
    roleName: 'ACADEMIC_STAFF',
    departmentId: '',
    isActive: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [staffRes, deptRes] = await Promise.all([
        staffService.getAll(),
        departmentService.getAll().catch(() => ({ data: { data: [] } }))
      ]);
      setStaffs(staffRes.data.data || []);
      setDepartments(deptRes.data.data || []);
    } catch {
      toast.error('Lỗi khi tải dữ liệu cán bộ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (staff = null) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        username: staff.username || '',
        fullName: staff.fullName || '',
        email: staff.email || '',
        dateOfBirth: staff.dateOfBirth ? staff.dateOfBirth.substring(0, 10) : '',
        roleName: staff.role || 'ACADEMIC_STAFF',
        departmentId: staff.departmentId ? String(staff.departmentId) : '',
        isActive: staff.isActive !== false,
      });
    } else {
      setEditingStaff(null);
      setFormData({
        username: '',
        fullName: '',
        email: '',
        dateOfBirth: '',
        roleName: 'ACADEMIC_STAFF',
        departmentId: '',
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
    if (formData.roleName === 'ACADEMIC_STAFF' && !formData.departmentId) {
      toast.warning('Giáo vụ Khoa bắt buộc phải chọn Khoa trực thuộc');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        dateOfBirth: formData.dateOfBirth,
        roleName: formData.roleName,
        departmentId: formData.departmentId ? Number(formData.departmentId) : null,
        isActive: formData.isActive,
      };

      if (editingStaff) {
        await staffService.update(editingStaff.id, payload);
        toast.success('Cập nhật thông tin cán bộ thành công');
      } else {
        if (!formData.username.trim()) {
          toast.warning('Vui lòng nhập tên đăng nhập');
          setSubmitting(false);
          return;
        }
        payload.username = formData.username.trim();
        const res = await staffService.create(payload);
        toast.success(res.data.message || 'Tạo cán bộ thành công!', { autoClose: 7000 });
      }
      handleCloseModal();
      loadData();
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
        departmentId: staff.departmentId,
        isActive: !staff.isActive,
      });
      toast.success(`Đã ${action} tài khoản thành công!`);
      loadData();
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

  const counts = {
    ALL: staffs.length,
    ADMIN: staffs.filter((s) => s.role === 'ADMIN').length,
    ACADEMIC_AFFAIRS: staffs.filter((s) => s.role === 'ACADEMIC_AFFAIRS').length,
    ACADEMIC_STAFF: staffs.filter((s) => s.role === 'ACADEMIC_STAFF').length,
    EXAMINATION_OFFICER: staffs.filter((s) => s.role === 'EXAMINATION_OFFICER').length,
  };

  const filteredStaffs = staffs.filter((s) => {
    const matchSearch =
      !search.trim() ||
      (s.fullName && s.fullName.toLowerCase().includes(search.toLowerCase())) ||
      (s.username && s.username.toLowerCase().includes(search.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase())) ||
      (s.departmentName && s.departmentName.toLowerCase().includes(search.toLowerCase()));

    const matchTab = activeTab === 'ALL' || s.role === activeTab;
    const matchDept = !selectedDeptId || String(s.departmentId) === String(selectedDeptId);

    return matchSearch && matchTab && matchDept;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="badge badge-danger">Quản trị viên</span>;
      case 'ACADEMIC_AFFAIRS':
        return <span className="badge badge-warning">Cán bộ Đào tạo (Trường)</span>;
      case 'ACADEMIC_STAFF':
        return <span className="badge badge-info">Giáo vụ Khoa</span>;
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
            Quản lý Cán bộ & Phân bổ Thẩm quyền
          </h1>
          <p>
            Phân định chức danh, đơn vị trực thuộc và phạm vi chức năng tác nghiệp theo mô hình Scoped RBAC
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} />
            <span>Thêm Cán bộ mới</span>
          </button>
        </div>
      </div>

      {/* Unit Tabs Bar */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        overflowX: 'auto',
        paddingBottom: '4px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <button
          type="button"
          className={`btn ${activeTab === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => { setActiveTab('ALL'); setSelectedDeptId(''); }}
          style={{ borderRadius: 'var(--radius-full)', padding: '6px 14px', fontSize: '0.84rem' }}
        >
          <span>Tất cả cán bộ</span>
          <span className="badge" style={{ marginLeft: '6px', backgroundColor: activeTab === 'ALL' ? 'rgba(255,255,255,0.25)' : 'var(--bg-subtle)' }}>
            {counts.ALL}
          </span>
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'ADMIN' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => { setActiveTab('ADMIN'); setSelectedDeptId(''); }}
          style={{ borderRadius: 'var(--radius-full)', padding: '6px 14px', fontSize: '0.84rem' }}
        >
          <span>Trung tâm CNTT (Admin)</span>
          <span className="badge" style={{ marginLeft: '6px', backgroundColor: activeTab === 'ADMIN' ? 'rgba(255,255,255,0.25)' : 'var(--bg-subtle)' }}>
            {counts.ADMIN}
          </span>
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'ACADEMIC_AFFAIRS' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => { setActiveTab('ACADEMIC_AFFAIRS'); setSelectedDeptId(''); }}
          style={{ borderRadius: 'var(--radius-full)', padding: '6px 14px', fontSize: '0.84rem' }}
        >
          <span>Phòng Đào tạo (Toàn trường)</span>
          <span className="badge" style={{ marginLeft: '6px', backgroundColor: activeTab === 'ACADEMIC_AFFAIRS' ? 'rgba(255,255,255,0.25)' : 'var(--bg-subtle)' }}>
            {counts.ACADEMIC_AFFAIRS}
          </span>
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'ACADEMIC_STAFF' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => { setActiveTab('ACADEMIC_STAFF'); }}
          style={{ borderRadius: 'var(--radius-full)', padding: '6px 14px', fontSize: '0.84rem' }}
        >
          <span>Giáo vụ các Khoa</span>
          <span className="badge" style={{ marginLeft: '6px', backgroundColor: activeTab === 'ACADEMIC_STAFF' ? 'rgba(255,255,255,0.25)' : 'var(--bg-subtle)' }}>
            {counts.ACADEMIC_STAFF}
          </span>
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'EXAMINATION_OFFICER' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => { setActiveTab('EXAMINATION_OFFICER'); setSelectedDeptId(''); }}
          style={{ borderRadius: 'var(--radius-full)', padding: '6px 14px', fontSize: '0.84rem' }}
        >
          <span>Phòng Khảo thí & ĐBCL</span>
          <span className="badge" style={{ marginLeft: '6px', backgroundColor: activeTab === 'EXAMINATION_OFFICER' ? 'rgba(255,255,255,0.25)' : 'var(--bg-subtle)' }}>
            {counts.EXAMINATION_OFFICER}
          </span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '14px 18px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type="text"
                placeholder="Tìm theo họ tên, username, email, Khoa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '36px' }}
              />
            </div>

            {/* Department selector when filtering all or academic staff */}
            {(activeTab === 'ALL' || activeTab === 'ACADEMIC_STAFF') && departments.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '200px' }}>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="form-select"
                  style={{ width: 'auto', minWidth: '190px' }}
                >
                  <option value="">-- Tất cả Khoa / Viện --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(search || selectedDeptId || activeTab !== 'ALL') && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => { setSearch(''); setSelectedDeptId(''); setActiveTab('ALL'); }}
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
                <th style={{ width: '36px' }}>#</th>
                <th>Họ và Tên</th>
                <th>Tài khoản</th>
                <th>Chức danh</th>
                <th>Đơn vị / Khoa</th>
                <th>Phạm vi & Thẩm quyền tác nghiệp</th>
                <th>Ngày sinh (DOB)</th>
                <th>Email</th>
                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <TableRowSkeleton rows={5} columns={10} />
              ) : filteredStaffs.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Không tìm thấy cán bộ / nhân viên nào phù hợp với bộ lọc.
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={14} style={{ color: staff.departmentName ? 'var(--primary)' : 'var(--text-light)' }} />
                        <span style={{ fontSize: '0.85rem', color: staff.departmentName ? 'var(--text-main)' : 'var(--text-secondary)' }}>
                          {staff.departmentName || (
                            staff.role === 'ACADEMIC_AFFAIRS' ? 'Phòng Đào tạo (Toàn trường)' :
                            staff.role === 'EXAMINATION_OFFICER' ? 'Phòng Khảo thí & ĐBCL' :
                            'Trung tâm CNTT / Toàn trường'
                          )}
                        </span>
                      </div>
                    </td>
                    {/* Phạm vi & Thẩm quyền tác nghiệp */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '300px' }}>
                        {staff.role === 'ADMIN' && (
                          <>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--danger)' }}>
                              🛡️ Quản trị Toàn quyền
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              <span className="badge badge-purple" style={{ fontSize: '0.74rem' }}>Hạ tầng & CSDL</span>
                              <span className="badge badge-secondary" style={{ fontSize: '0.74rem' }}>Quản lý Tài khoản</span>
                            </div>
                          </>
                        )}
                        {staff.role === 'ACADEMIC_AFFAIRS' && (
                          <>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--warning-text)' }}>
                              🏛️ Cấp Trường (Toàn diện)
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              <span className="badge badge-warning" style={{ fontSize: '0.74rem' }}>Cấu hình ĐKTC & Học kỳ</span>
                              <span className="badge badge-info" style={{ fontSize: '0.74rem' }}>Điều phối Lớp HP</span>
                              <span className="badge badge-success" style={{ fontSize: '0.74rem' }}>Xét tốt nghiệp TT08</span>
                              <span className="badge badge-purple" style={{ fontSize: '0.74rem' }}>Duyệt sửa điểm (Cấp 2)</span>
                            </div>
                          </>
                        )}
                        {staff.role === 'ACADEMIC_STAFF' && (
                          <>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)' }}>
                              🏢 Chuyên trách: {staff.departmentName || 'Khoa chuyên môn'}
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              <span className="badge badge-primary" style={{ fontSize: '0.74rem' }}>Lớp HP & TKB Khoa</span>
                              <span className="badge badge-info" style={{ fontSize: '0.74rem' }}>QL Sinh viên Khoa</span>
                              <span className="badge badge-secondary" style={{ fontSize: '0.74rem' }}>Duyệt sửa điểm (Cấp 1)</span>
                            </div>
                          </>
                        )}
                        {staff.role === 'EXAMINATION_OFFICER' && (
                          <>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#7c3aed' }}>
                              🎯 Khảo thí & Đảm bảo chất lượng
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              <span className="badge badge-purple" style={{ fontSize: '0.74rem' }}>Ca thi & Phòng thi</span>
                              <span className="badge badge-warning" style={{ fontSize: '0.74rem' }}>Phúc khảo điểm thi</span>
                              <span className="badge badge-secondary" style={{ fontSize: '0.74rem' }}>Kiểm toán sổ điểm</span>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
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
          <div className="modal-content" style={{ maxWidth: '600px' }}>
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
                    placeholder="Ví dụ: Lê Thị Thanh"
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
                    placeholder="Ví dụ: giaovu_cntt"
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
                      <option value="ACADEMIC_STAFF">Giáo vụ Khoa</option>
                      <option value="ACADEMIC_AFFAIRS">Cán bộ Đào tạo (Cấp trường)</option>
                      <option value="EXAMINATION_OFFICER">Cán bộ Khảo thí</option>
                      <option value="ADMIN">Quản trị viên (Admin)</option>
                    </select>
                  </div>
                </div>

                {formData.roleName === 'ACADEMIC_STAFF' && (
                  <div>
                    <label className="form-label">Khoa / Viện trực thuộc *</label>
                    <select
                      required
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      className="form-select"
                    >
                      <option value="">-- Chọn Khoa / Viện trực thuộc --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Xem trước Thẩm quyền & Chức năng */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  marginTop: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    <ShieldCheck size={16} style={{ color: 'var(--primary)' }} />
                    <span>Xem trước Thẩm quyền & Chức năng hệ thống:</span>
                  </div>
                  {formData.roleName === 'ADMIN' && (
                    <div style={{ fontSize: '0.81rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      • <strong>Toàn quyền Kỹ thuật:</strong> Quản trị tài khoản (SV, GV, Cán bộ), cấp lại mật khẩu tập trung, sao lưu CSDL và nhật ký kiểm toán hệ thống.
                    </div>
                  )}
                  {formData.roleName === 'ACADEMIC_AFFAIRS' && (
                    <div style={{ fontSize: '0.81rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      • <strong>Thẩm quyền Cấp Trường:</strong> Thiết lập Đợt ĐKTC, Học kỳ & Niên giám, quản lý Khoa/Viện, điều phối Lớp HP toàn trường, Hội đồng Xét tốt nghiệp TT08 và Phê duyệt Quyết định sửa điểm Cấp 2.
                    </div>
                  )}
                  {formData.roleName === 'ACADEMIC_STAFF' && (
                    <div style={{ fontSize: '0.81rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      • <strong>Thẩm quyền Cấp Khoa:</strong> Chỉ tác nghiệp dữ liệu thuộc Khoa phụ trách ({departments.find(d => String(d.id) === String(formData.departmentId))?.name || 'Vui lòng chọn Khoa ở trên'}), gồm Mở Lớp học phần Khoa, Xếp TKB, Quản lý SV/Lớp SH Khoa và Duyệt đề xuất sửa điểm Cấp 1 (Khoa).
                    </div>
                  )}
                  {formData.roleName === 'EXAMINATION_OFFICER' && (
                    <div style={{ fontSize: '0.81rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      • <strong>Thẩm quyền Khảo thí:</strong> Quản lý danh sách Ca thi & Phòng thi, tiếp nhận & xử lý đơn Phúc khảo điểm thi của sinh viên, tra cứu và kiểm toán nhật ký sửa điểm thi.
                    </div>
                  )}
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
