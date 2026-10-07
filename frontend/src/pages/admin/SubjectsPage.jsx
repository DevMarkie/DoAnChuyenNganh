import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, CheckCircle, XCircle, X, BookOpen, Filter, RotateCcw } from 'lucide-react';
import { toast } from 'react-toastify';
import { subjectService, departmentService } from '../../services/dataService';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [prerequisiteSearch, setPrerequisiteSearch] = useState('');

  const [formData, setFormData] = useState({
    subjectCode: '',
    subjectName: '',
    credits: 3,
    description: '',
    departmentId: '',
    prerequisiteIds: [],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [resSub, resDept] = await Promise.all([
        subjectService.getAll(),
        departmentService.getAll(),
      ]);
      setSubjects(resSub.data.data || []);
      setDepartments(resDept.data.data || []);
    } catch {
      toast.error('Lỗi khi tải danh sách môn học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenModal = (sub = null) => {
    if (sub) {
      setEditingSubject(sub);
      setFormData({
        subjectCode: sub.subjectCode || '',
        subjectName: sub.subjectName || '',
        credits: sub.credits || 3,
        description: sub.description || '',
        departmentId: sub.department?.id || '',
        prerequisiteIds: (sub.prerequisites || []).map((item) => item.id),
      });
    } else {
      setEditingSubject(null);
      setFormData({
        subjectCode: '',
        subjectName: '',
        credits: 3,
        description: '',
        departmentId: departments[0]?.id || '',
        prerequisiteIds: [],
      });
    }
    setPrerequisiteSearch('');
    setIsModalOpen(true);
  };

  const availablePrerequisites = subjects.filter((subject) => {
    const isCurrentSubject = editingSubject && subject.id === editingSubject.id;
    const isSelected = formData.prerequisiteIds?.includes(subject.id);
    const query = prerequisiteSearch.trim().toLowerCase();
    const matchesSearch = !query || `${subject.subjectCode} ${subject.subjectName}`.toLowerCase().includes(query);
    return !isCurrentSubject && !isSelected && matchesSearch;
  });

  const addPrerequisite = (id) => {
    setFormData((current) => ({
      ...current,
      prerequisiteIds: [...(current.prerequisiteIds || []), Number(id)],
    }));
    setPrerequisiteSearch('');
  };

  const removePrerequisite = (id) => {
    setFormData((current) => ({
      ...current,
      prerequisiteIds: (current.prerequisiteIds || []).filter((item) => item !== id),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await subjectService.update(editingSubject.id, formData);
        toast.success('Cập nhật môn học thành công!');
      } else {
        await subjectService.create(formData);
        toast.success('Thêm môn học mới thành công!');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleToggle = async (id) => {
    try {
      await subjectService.toggleActive(id);
      toast.success('Cập nhật trạng thái thành công!');
      loadData();
    } catch {
      toast.error('Cập nhật trạng thái thất bại');
    }
  };

  const filtered = subjects.filter((s) => {
    const matchDept = selectedDept ? s.department?.id === parseInt(selectedDept) : true;
    const matchSearch = search
      ? s.subjectCode?.toLowerCase().includes(search.toLowerCase()) ||
        s.subjectName?.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchDept && matchSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Danh Mục Môn Học</h1>
          <p>
            Quản lý chương trình học phần, định mức tín chỉ và bộ môn phụ trách
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} />
            <span>Thêm môn học mới</span>
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
                placeholder="Tìm theo mã hoặc tên môn học..."
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
            Hiển thị <strong>{filtered.length}</strong> / <strong>{subjects.length}</strong> môn học
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã Môn</th>
                <th>Tên Môn Học</th>
                <th>Số Tín Chỉ</th>
                <th>Khoa Phụ Trách</th>
                <th>Môn Tiên Quyết</th>
                <th>Mô Tả Học Phần</th>
                <th>Trạng Thái</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Đang tải danh sách môn học...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Không tìm thấy môn học nào phù hợp.
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
                        {s.subjectCode}
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
                          <BookOpen size={16} />
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.subjectName}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--info-bg)',
                          color: 'var(--info-text)',
                          border: '1px solid var(--info-border)'
                        }}
                      >
                        {s.credits} Tín chỉ
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.department?.name || '—'}</td>
                    <td style={{ minWidth: '150px' }}>
                      {s.prerequisites?.length ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {s.prerequisites.map((prerequisite) => (
                            <span
                              key={prerequisite.id}
                              className="badge badge-neutral"
                              title={`${prerequisite.subjectName} (${prerequisite.credits} TC)`}
                            >
                              {prerequisite.subjectCode}
                            </span>
                          ))}
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: '280px', lineHeight: '1.4' }}>
                      {s.description || '—'}
                    </td>
                    <td>
                      <span className={`badge ${s.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {s.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button className="btn-icon" title="Sửa" onClick={() => handleOpenModal(s)}>
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn-icon"
                          title={s.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                          style={{ color: s.isActive ? 'var(--danger)' : 'var(--success)' }}
                          onClick={() => handleToggle(s.id)}
                        >
                          {s.isActive ? <XCircle size={15} /> : <CheckCircle size={15} />}
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
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3>{editingSubject ? 'Cập Nhật Môn Học' : 'Thêm Môn Học Mới'}</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">Mã môn học *</label>
                  <input
                    type="text"
                    required
                    value={formData.subjectCode}
                    onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                    className="form-control"
                    placeholder="VD: CNTT101"
                  />
                </div>
                <div>
                  <label className="form-label">Tên môn học *</label>
                  <input
                    type="text"
                    required
                    value={formData.subjectName}
                    onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                    className="form-control"
                    placeholder="VD: Nhập môn Lập trình Web"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px' }}>
                  <div>
                    <label className="form-label">Số tín chỉ *</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      required
                      value={formData.credits}
                      onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                      className="form-control"
                    />
                  </div>
                  <div>
                    <label className="form-label">Khoa phụ trách *</label>
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
                </div>
                <div>
                  <label className="form-label">Mô tả học phần</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="form-control"
                    placeholder="Mô tả mục tiêu, đề cương và chuẩn đầu ra của môn học..."
                  />
                </div>
                <div>
                  <label className="form-label">Môn học tiên quyết</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {(formData.prerequisiteIds || []).map((id) => {
                      const prerequisite = subjects.find((subject) => subject.id === id);
                      return prerequisite ? (
                        <span key={id} className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          {prerequisite.subjectCode}
                          <button
                            type="button"
                            onClick={() => removePrerequisite(id)}
                            aria-label={`Xóa ${prerequisite.subjectCode}`}
                            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', color: 'inherit', lineHeight: 1 }}
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                  <input
                    type="search"
                    value={prerequisiteSearch}
                    onChange={(e) => setPrerequisiteSearch(e.target.value)}
                    className="form-control"
                    placeholder="Tìm theo mã hoặc tên môn học..."
                  />
                  {prerequisiteSearch && availablePrerequisites.length > 0 && (
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', marginTop: '4px', maxHeight: '150px', overflowY: 'auto', background: 'var(--bg-card)' }}>
                      {availablePrerequisites.map((subject) => (
                        <button
                          type="button"
                          key={subject.id}
                          onClick={() => addPrerequisite(subject.id)}
                          style={{ display: 'block', width: '100%', padding: '8px 10px', textAlign: 'left', border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--text-main)' }}
                        >
                          <strong>{subject.subjectCode}</strong> — {subject.subjectName} ({subject.credits} TC)
                        </button>
                      ))}
                    </div>
                  )}
                  {prerequisiteSearch && availablePrerequisites.length === 0 && (
                    <small style={{ display: 'block', marginTop: '6px', color: 'var(--text-muted)' }}>Không có môn phù hợp.</small>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Huỷ</button>
                <button type="submit" className="btn btn-primary">{editingSubject ? 'Lưu thay đổi' : 'Tạo môn học'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
