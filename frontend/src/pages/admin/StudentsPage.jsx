import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit2, UserX, UserCheck, X, Filter, RotateCcw, Building2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { studentService, classService, departmentService } from '../../services/dataService';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Đang học' },
  { value: 'GRADUATED', label: 'Tốt nghiệp' },
  { value: 'SUSPENDED', label: 'Tạm đình chỉ' },
  { value: 'INACTIVE', label: 'Thôi học' },
];

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

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

  // Load all students, classes, and departments
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resStu, resClass, resDept] = await Promise.all([
        studentService.getAll(),
        classService.getAll(),
        departmentService.getAll(),
      ]);
      setStudents(resStu.data?.data || []);
      setClasses(resClass.data?.data || []);
      setDepartments(resDept.data?.data || []);
    } catch {
      toast.error('Lỗi khi tải dữ liệu sinh viên');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedClass('');
    setSelectedDepartment('');
    setSelectedStatus('');
  };

  // When changing department, filter class dropdown
  const filteredClasses = selectedDepartment
    ? classes.filter((c) => c.department?.id === parseInt(selectedDepartment))
    : classes;

  // Reset class filter if current selection is invalid after dept change
  useEffect(() => {
    if (selectedDepartment && selectedClass) {
      const isValid = filteredClasses.some((c) => c.id === parseInt(selectedClass));
      if (!isValid) setSelectedClass('');
    }
  }, [selectedDepartment]);

  // Real-time instant filtering of all students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // 1. Search keyword
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = s.fullName?.toLowerCase().includes(q);
        const matchCode = s.studentCode?.toLowerCase().includes(q);
        const matchEmail = s.email?.toLowerCase().includes(q);
        const matchPhone = s.phone?.includes(q);
        if (!matchName && !matchCode && !matchEmail && !matchPhone) return false;
      }
      // 2. Department
      if (selectedDepartment && s.classEntity?.department?.id !== parseInt(selectedDepartment)) {
        return false;
      }
      // 3. Class
      if (selectedClass && s.classEntity?.id !== parseInt(selectedClass)) {
        return false;
      }
      // 4. Status
      if (selectedStatus) {
        if (selectedStatus === 'ACTIVE') {
          if (s.status !== 'ACTIVE' && s.status !== 'STUDYING') return false;
        } else if (s.status !== selectedStatus) {
          return false;
        }
      }
      return true;
    });
  }, [students, search, selectedDepartment, selectedClass, selectedStatus]);

  const handleOpenModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      const mappedGender = (student.gender === 'FEMALE' || student.gender === 'Nữ') ? 'Nữ'
        : (student.gender === 'OTHER' || student.gender === 'Khác') ? 'Khác' : 'Nam';
      const mappedStatus = (student.status === 'STUDYING' || student.status === 'ACTIVE') ? 'ACTIVE'
        : (student.status || 'ACTIVE');

      setFormData({
        studentCode: student.studentCode || '',
        fullName: student.fullName || '',
        dateOfBirth: student.dateOfBirth ? student.dateOfBirth.substring(0, 10) : '',
        gender: mappedGender,
        email: student.email || '',
        phone: student.phone || '',
        address: student.address || '',
        classId: student.classEntity?.id || (classes[0]?.id || ''),
        status: mappedStatus,
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

  const handleDirectStatusChange = async (student, newStatus) => {
    if (!newStatus || newStatus === student.status) return;
    const statusLabels = {
      ACTIVE: 'Đang học',
      GRADUATED: 'Tốt nghiệp',
      SUSPENDED: 'Tạm đình chỉ',
      INACTIVE: 'Thôi học'
    };
    try {
      await studentService.updateStatus(student.id, newStatus);
      toast.success(`Đã đổi trạng thái SV ${student.fullName} sang: ${statusLabels[newStatus] || newStatus}`);
      // Optimistically update local state for instant UI update
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, status: newStatus } : s));
    } catch {
      toast.error('Cập nhật trạng thái thất bại');
      loadData();
    }
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
    const newStatus = isCurrentlyActive ? 'SUSPENDED' : 'ACTIVE';
    try {
      await studentService.updateStatus(student.id, newStatus);
      toast.success(`Đã cập nhật trạng thái sang: ${newStatus === 'ACTIVE' ? 'Đang học' : 'Tạm đình chỉ'}`);
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, status: newStatus } : s));
    } catch {
      toast.error('Cập nhật trạng thái thất bại');
      loadData();
    }
  };

  const getInitials = (name) => {
    if (!name) return 'SV';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const hasActiveFilters = search || selectedClass || selectedDepartment || selectedStatus;

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

      {/* Toolbar Search & Multi-Filter */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          {/* Row 1: Search */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type="text"
                placeholder="Tìm theo mã SV, họ tên, email, SĐT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '36px' }}
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleResetFilters}
                title="Xóa bộ lọc"
                style={{ padding: '8px 14px', height: '38px' }}
              >
                <RotateCcw size={14} />
                <span>Đặt lại lọc</span>
              </button>
            )}
          </div>

          {/* Row 2: Filter dropdowns */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              <Filter size={14} />
              <span>Bộ lọc:</span>
            </div>

            {/* Department Filter */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="form-select"
              style={{ width: 'auto', minWidth: '180px', fontSize: '0.85rem', padding: '6px 10px' }}
            >
              <option value="">Tất cả Khoa/Viện</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>

            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="form-select"
              style={{ width: 'auto', minWidth: '170px', fontSize: '0.85rem', padding: '6px 10px' }}
            >
              <option value="">Tất cả các lớp</option>
              {filteredClasses.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-select"
              style={{ width: 'auto', minWidth: '150px', fontSize: '0.85rem', padding: '6px 10px' }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Total Indicator */}
            <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Hiển thị: <strong>{filteredStudents.length}</strong> / <strong>{students.length}</strong> sinh viên
            </div>
          </div>
        </div>
      </div>

      {/* Students Data Table - Continuous Scroll */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div
          className="table-container"
          style={{
            maxHeight: 'calc(100vh - 290px)',
            minHeight: '350px',
            overflowY: 'auto',
            overflowX: 'auto',
            position: 'relative',
          }}
        >
          <table className="table" style={{ margin: 0, borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-subtle)', boxShadow: 'inset 0 -1px 0 var(--border-color)' }}>
                  Sinh viên
                </th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-subtle)', boxShadow: 'inset 0 -1px 0 var(--border-color)' }}>
                  Mã sinh viên
                </th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-subtle)', boxShadow: 'inset 0 -1px 0 var(--border-color)' }}>
                  Lớp sinh hoạt
                </th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-subtle)', boxShadow: 'inset 0 -1px 0 var(--border-color)' }}>
                  Khoa / Ngành
                </th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-subtle)', boxShadow: 'inset 0 -1px 0 var(--border-color)' }}>
                  Ngày sinh
                </th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-subtle)', boxShadow: 'inset 0 -1px 0 var(--border-color)' }}>
                  Giới tính
                </th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-subtle)', boxShadow: 'inset 0 -1px 0 var(--border-color)' }}>
                  Liên hệ
                </th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-subtle)', boxShadow: 'inset 0 -1px 0 var(--border-color)' }}>
                  Trạng thái
                </th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-subtle)', boxShadow: 'inset 0 -1px 0 var(--border-color)', textAlign: 'right' }}>
                  Thao tác
                </th>
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

                      {/* Status - Interactive Direct Changer */}
                      <td>
                        <select
                          value={s.status === 'STUDYING' ? 'ACTIVE' : s.status}
                          onChange={(e) => handleDirectStatusChange(s, e.target.value)}
                          className={`badge ${
                            isStudying ? 'badge-success'
                            : isGraduated ? 'badge-info'
                            : isSuspended ? 'badge-warning'
                            : 'badge-danger'
                          }`}
                          style={{
                            cursor: 'pointer',
                            border: '1px solid transparent',
                            fontWeight: 600,
                            padding: '4px 10px',
                            fontSize: '0.8rem',
                            borderRadius: '6px',
                            outline: 'none',
                            appearance: 'auto',
                            transition: 'all 0.15s ease'
                          }}
                          title="Nhấp vào để đổi trạng thái sinh viên ngay lập tức"
                        >
                          <option value="ACTIVE" style={{ background: '#fff', color: '#10b981' }}>🟢 Đang học</option>
                          <option value="GRADUATED" style={{ background: '#fff', color: '#3b82f6' }}>🎓 Tốt nghiệp</option>
                          <option value="SUSPENDED" style={{ background: '#fff', color: '#f59e0b' }}>🟡 Tạm đình chỉ</option>
                          <option value="INACTIVE" style={{ background: '#fff', color: '#ef4444' }}>🔴 Thôi học</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            className="btn-icon"
                            title="Chỉnh sửa toàn bộ hồ sơ sinh viên"
                            onClick={() => handleOpenModal(s)}
                            style={{
                              backgroundColor: 'var(--bg-subtle)',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn-icon"
                            title={isStudying ? 'Chuyển nhanh sang Tạm đình chỉ' : 'Kích hoạt lại trạng thái Đang học'}
                            style={{
                              color: isStudying ? 'var(--warning)' : 'var(--success)',
                              backgroundColor: 'var(--bg-subtle)',
                              border: '1px solid var(--border-color)',
                            }}
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

        {/* Scroll Info Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 20px', borderTop: '1px solid var(--border-color)',
          fontSize: '0.85rem', color: 'var(--text-muted)',
          backgroundColor: 'var(--bg-subtle)'
        }}>
          <span>
            Đang hiển thị <strong>{filteredStudents.length}</strong> / <strong>{students.length}</strong> sinh viên
            {filteredStudents.length < students.length && ' (đã áp dụng bộ lọc)'}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>↕️</span> Cuộn chuột để xem tất cả sinh viên (không chia trang)
          </span>
        </div>
      </div>

      {/* Modal Create/Edit */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>{editingStudent ? 'Cập Nhật Thông Tin Sinh Viên' : 'Thêm Sinh Viên Mới'}</h3>
              <button
                className="btn-icon"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Mã SV */}
                  <div className="form-group">
                    <label className="form-label">Mã Sinh Viên *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: 2500001"
                      value={formData.studentCode}
                      onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                      disabled={!!editingStudent}
                      className="form-control"
                    />
                  </div>

                  {/* Họ tên */}
                  <div className="form-group">
                    <label className="form-label">Họ và Tên *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  {/* Ngày sinh */}
                  <div className="form-group">
                    <label className="form-label">Ngày Sinh</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  {/* Giới tính */}
                  <div className="form-group">
                    <label className="form-label">Giới Tính</label>
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

                  {/* Email */}
                  <div className="form-group">
                    <label className="form-label">Email Học Vụ *</label>
                    <input
                      type="email"
                      required
                      placeholder="student@sv.sms.edu.vn"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  {/* SĐT */}
                  <div className="form-group">
                    <label className="form-label">Số Điện Thoại</label>
                    <input
                      type="tel"
                      placeholder="0912345678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  {/* Lớp sinh hoạt */}
                  <div className="form-group">
                    <label className="form-label">Lớp Sinh Hoạt *</label>
                    <select
                      required
                      value={formData.classId}
                      onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                      className="form-select"
                    >
                      <option value="">-- Chọn lớp sinh hoạt --</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code}) - {c.department?.name || ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Trạng thái */}
                  <div className="form-group">
                    <label className="form-label">Trạng Thái Đào Tạo</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="form-select"
                    >
                      <option value="ACTIVE">Đang học</option>
                      <option value="GRADUATED">Tốt nghiệp</option>
                      <option value="SUSPENDED">Tạm đình chỉ</option>
                      <option value="INACTIVE">Thôi học</option>
                    </select>
                  </div>

                  {/* Mật khẩu khởi tạo */}
                  {!editingStudent && (
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Mật Khẩu Khởi Tạo (Để trống sẽ mặc định 123456)</label>
                      <input
                        type="password"
                        placeholder="Mặc định: 123456"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="form-control"
                      />
                    </div>
                  )}

                  {/* Địa chỉ */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Địa Chỉ Thường Trú</label>
                    <textarea
                      rows="2"
                      placeholder="Nhập địa chỉ sinh viên..."
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="form-control"
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
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStudent ? 'Lưu Thay Đổi' : 'Tạo Sinh Viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
