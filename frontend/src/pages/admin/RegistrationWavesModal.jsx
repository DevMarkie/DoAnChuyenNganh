import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Edit2, AlertCircle, Clock, Calendar, CheckCircle2, ShieldAlert, Sparkles, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import { registrationWaveService, cohortService, departmentService, majorService } from '../../services/dataService';

export default function RegistrationWavesModal({ isOpen, onClose, semester }) {
  const [waves, setWaves] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Ngày được chọn để gán nhanh cho preset ca (mặc định hôm nay)
  const [presetDate, setPresetDate] = useState(() => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

  const [formData, setFormData] = useState({
    name: '',
    shiftName: '',
    cohortId: '',
    departmentId: '',
    majorId: '',
    startTime: '',
    endTime: '',
    description: '',
    isActive: true,
  });

  const loadData = async () => {
    if (!semester?.id) return;
    try {
      setLoading(true);
      const [resWaves, resCohorts, resDepts, resMajors] = await Promise.all([
        registrationWaveService.getBySemester(semester.id),
        cohortService.getAll().catch(() => ({ data: { data: [] } })),
        departmentService.getAll().catch(() => ({ data: { data: [] } })),
        majorService.getAll().catch(() => ({ data: { data: [] } })),
      ]);
      setWaves(resWaves.data.data || []);
      setCohorts(resCohorts.data.data || []);
      setDepartments(resDepts.data.data || []);
      setMajors(resMajors.data.data || []);
    } catch {
      toast.error('Lỗi khi tải dữ liệu ca/đợt đăng ký');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && semester?.id) {
      loadData();
      setIsEditing(false);
      setEditingId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, semester]);

  // Lọc danh sách Ngành theo Khoa đã chọn trong form
  const availableMajors = useMemo(() => {
    if (!formData.departmentId) return majors;
    return majors.filter((m) => String(m.department?.id || m.departmentId) === String(formData.departmentId));
  }, [majors, formData.departmentId]);

  const handleStartAdd = () => {
    setIsEditing(true);
    setEditingId(null);
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    setPresetDate(todayStr);

    setFormData({
      name: `Ca sáng - ${semester?.semesterName || ''}`,
      shiftName: 'Ca sáng (08:00 - 11:30)',
      cohortId: '',
      departmentId: '',
      majorId: '',
      startTime: `${todayStr}T08:00`,
      endTime: `${todayStr}T11:30`,
      description: '',
      isActive: true,
    });
  };

  const handleStartEdit = (w) => {
    setIsEditing(true);
    setEditingId(w.id);
    const toInputFormat = (isoStr) => {
      if (!isoStr) return '';
      return isoStr.substring(0, 16);
    };

    if (w.startTime) {
      setPresetDate(w.startTime.substring(0, 10));
    }

    setFormData({
      name: w.name || '',
      shiftName: w.shiftName || '',
      cohortId: w.cohortId || '',
      departmentId: w.departmentId || '',
      majorId: w.majorId || '',
      startTime: toInputFormat(w.startTime),
      endTime: toInputFormat(w.endTime),
      description: w.description || '',
      isActive: w.isActive ?? true,
    });
  };

  const handleCancelForm = () => {
    setIsEditing(false);
    setEditingId(null);
  };

  // Áp dụng Preset Ca thông minh
  const applyShiftPreset = (preset) => {
    const date = presetDate || new Date().toISOString().substring(0, 10);
    let startHour = '08:00';
    let endHour = '11:30';
    let shiftLabel = 'Ca sáng (08:00 - 11:30)';

    if (preset === 'AFTERNOON') {
      startHour = '13:30';
      endHour = '17:00';
      shiftLabel = 'Ca chiều (13:30 - 17:00)';
    } else if (preset === 'EVENING') {
      startHour = '18:00';
      endHour = '22:00';
      shiftLabel = 'Ca tối (18:00 - 22:00)';
    } else if (preset === 'FULL_DAY') {
      startHour = '08:00';
      endHour = '23:59';
      shiftLabel = 'Cả ngày (08:00 - 23:59)';
    }

    const startIso = `${date}T${startHour}`;
    const endIso = `${date}T${endHour}`;

    // Tự động cập nhật tên đợt theo ca và đối tượng
    const selectedCohort = cohorts.find((c) => String(c.id) === String(formData.cohortId));
    const selectedMajor = majors.find((m) => String(m.id) === String(formData.majorId));
    const selectedDept = departments.find((d) => String(d.id) === String(formData.departmentId));

    let autoName = shiftLabel.split(' ')[0] + ' ' + shiftLabel.split(' ')[1];
    if (selectedMajor) autoName += ` - Ngành ${selectedMajor.name}`;
    else if (selectedDept) autoName += ` - Khoa ${selectedDept.name}`;
    if (selectedCohort) autoName += ` (${selectedCohort.code})`;

    setFormData((prev) => ({
      ...prev,
      shiftName: shiftLabel,
      name: autoName,
      startTime: startIso,
      endTime: endIso,
    }));
    toast.info(`Đã áp dụng ${shiftLabel} cho ngày ${date}`);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.warning('Vui lòng nhập tên đợt/ca đăng ký');
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      toast.warning('Vui lòng chọn thời gian bắt đầu và kết thúc');
      return;
    }
    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      toast.warning('Thời gian kết thúc phải sau thời gian bắt đầu');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        semesterId: semester.id,
        name: formData.name.trim(),
        shiftName: formData.shiftName ? formData.shiftName.trim() : null,
        cohortId: formData.cohortId ? parseInt(formData.cohortId, 10) : null,
        departmentId: formData.departmentId ? parseInt(formData.departmentId, 10) : null,
        majorId: formData.majorId ? parseInt(formData.majorId, 10) : null,
        startTime: formData.startTime.length === 16 ? `${formData.startTime}:00` : formData.startTime,
        endTime: formData.endTime.length === 16 ? `${formData.endTime}:00` : formData.endTime,
        description: formData.description,
        isActive: formData.isActive,
      };

      if (editingId) {
        await registrationWaveService.update(editingId, payload);
        toast.success('Cập nhật ca đăng ký thành công!');
      } else {
        await registrationWaveService.create(payload);
        toast.success('Tạo mới ca đăng ký thành công!');
      }

      setIsEditing(false);
      setEditingId(null);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu ca đăng ký');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ca đăng ký "${name}"?`)) {
      return;
    }
    try {
      await registrationWaveService.delete(id);
      toast.success('Đã xóa ca đăng ký');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa ca đăng ký');
    }
  };

  const handleToggle = async (id) => {
    try {
      await registrationWaveService.toggleActive(id);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '920px', width: '95%', maxHeight: '92vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={20} style={{ color: 'var(--primary)' }} />
              Quản lý Ca & Đợt Đăng Ký Tín Chỉ (Khóa / Khoa / Ngành)
            </h2>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Học kỳ: <strong>{semester?.semesterName} ({semester?.semesterCode})</strong>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px' }}>
          {/* Note on Strict Exclusive Major Shifts */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #bfdbfe',
              fontSize: '0.85rem',
              color: '#1e40af',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
            }}
          >
            <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Cơ chế Phân ca Độc quyền (Strict Exclusive):</strong> Hệ thống hỗ trợ chia ca độc lập theo từng <strong>Khóa (Cohort)</strong>, <strong>Khoa (Department)</strong>, và <strong>Ngành (Major)</strong>. Nếu một Ngành đã được phân bổ ca riêng, sinh viên thuộc Ngành đó bắt buộc phải truy cập đúng khung giờ ca của Ngành mình để phân tải máy chủ tối đa.
            </div>
          </div>

          {/* Form Add / Edit */}
          {isEditing ? (
            <form onSubmit={handleSave} style={{ marginBottom: '24px', padding: '18px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                  {editingId ? 'Chỉnh Sửa Ca Đăng Ký' : 'Thêm Mới Ca Đăng Ký Tín Chỉ'}
                </h3>
              </div>

              {/* Preset Ca Nhanh */}
              <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Sparkles size={14} style={{ color: '#f59e0b' }} /> Chọn nhanh Ca mẫu theo ngày:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ngày áp dụng:</span>
                    <input
                      type="date"
                      className="form-control"
                      style={{ padding: '3px 8px', fontSize: '0.8rem', width: 'auto' }}
                      value={presetDate}
                      onChange={(e) => setPresetDate(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                    onClick={() => applyShiftPreset('MORNING')}
                  >
                    🌅 Ca sáng (08:00 - 11:30)
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                    onClick={() => applyShiftPreset('AFTERNOON')}
                  >
                    ☀️ Ca chiều (13:30 - 17:00)
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                    onClick={() => applyShiftPreset('EVENING')}
                  >
                    🌙 Ca tối (18:00 - 22:00)
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                    onClick={() => applyShiftPreset('FULL_DAY')}
                  >
                    📅 Cả ngày (08:00 - 23:59)
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Tên đợt/ca hiển thị *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="VD: Ca sáng - Ngành Kỹ thuật Phần mềm (K16)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Nhãn Ca đăng ký</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="VD: Ca sáng (08:00 - 11:30)"
                    value={formData.shiftName}
                    onChange={(e) => setFormData({ ...formData, shiftName: e.target.value })}
                  />
                </div>
              </div>

              {/* Bộ lọc 3 cấp: Khóa - Khoa - Ngành */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>1. Khóa sinh viên</label>
                  <select
                    className="form-control"
                    value={formData.cohortId}
                    onChange={(e) => setFormData({ ...formData, cohortId: e.target.value })}
                  >
                    <option value="">-- Tất cả các khóa --</option>
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>2. Khoa đào tạo</label>
                  <select
                    className="form-control"
                    value={formData.departmentId}
                    onChange={(e) => {
                      const newDeptId = e.target.value;
                      setFormData({
                        ...formData,
                        departmentId: newDeptId,
                        majorId: '', // Reset major when department changes
                      });
                    }}
                  >
                    <option value="">-- Tất cả các khoa --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>3. Ngành đào tạo</label>
                  <select
                    className="form-control"
                    value={formData.majorId}
                    onChange={(e) => setFormData({ ...formData, majorId: e.target.value })}
                  >
                    <option value="">-- Tất cả các ngành --</option>
                    {availableMajors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Thời gian mở ca *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Thời gian đóng ca *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Ghi chú / Hướng dẫn ca</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Thông báo về đối tượng ưu tiên ca này..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  id="isActiveWave"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <label htmlFor="isActiveWave" style={{ fontSize: '0.875rem', cursor: 'pointer', margin: 0 }}>
                  Kích hoạt ca đăng ký này
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={handleCancelForm} disabled={saving}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : editingId ? 'Cập nhật ca' : 'Tạo ca mới'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                Danh sách ca / đợt đăng ký ({waves.length})
              </div>
              <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={handleStartAdd}>
                <Plus size={15} style={{ marginRight: '4px' }} /> Thêm ca đăng ký mới
              </button>
            </div>
          )}

          {/* Waves Table */}
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Đang tải danh sách ca đăng ký...
            </div>
          ) : waves.length === 0 ? (
            <div
              style={{
                padding: '30px',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px dashed var(--border-color)',
                color: 'var(--text-muted)',
              }}
            >
              <AlertCircle size={24} style={{ margin: '0 auto 8px', color: '#94a3b8' }} />
              <div>Chưa có ca đăng ký nào được cấu hình cho học kỳ này.</div>
              <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                Bấm "Thêm ca đăng ký mới" để phân bổ khung giờ theo Khóa / Khoa / Ngành.
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table" style={{ fontSize: '0.875rem' }}>
                <thead>
                  <tr>
                    <th>Ca & Tên đợt</th>
                    <th>Phân bổ (Khóa / Khoa / Ngành)</th>
                    <th>Khung giờ</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {waves.map((w) => (
                    <tr key={w.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                          {w.shiftName && (
                            <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              {w.shiftName}
                            </span>
                          )}
                          <span style={{ fontWeight: 600 }}>{w.name}</span>
                        </div>
                        {w.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {w.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span className="badge badge-info" style={{ fontSize: '0.75rem', alignSelf: 'flex-start' }}>
                            Khóa: {w.cohortName || 'Toàn trường'}
                          </span>
                          <span className="badge badge-secondary" style={{ fontSize: '0.75rem', alignSelf: 'flex-start' }}>
                            Khoa: {w.departmentName || 'Tất cả khoa'}
                          </span>
                          {w.majorName && w.majorName !== 'Tất cả các ngành' ? (
                            <span className="badge badge-warning" style={{ fontSize: '0.75rem', alignSelf: 'flex-start', color: '#92400e', backgroundColor: '#fef3c7' }}>
                              Ngành: {w.majorName}
                            </span>
                          ) : (
                            <span className="badge" style={{ fontSize: '0.75rem', alignSelf: 'flex-start', backgroundColor: '#f1f5f9', color: '#64748b' }}>
                              Ngành: Tất cả các ngành
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#1e293b' }}>
                          <Clock size={13} style={{ color: 'var(--primary)' }} />
                          <strong>{w.startTime ? w.startTime.substring(0, 16).replace('T', ' ') : ''}</strong>
                        </div>
                        <div style={{ color: 'var(--text-muted)', paddingLeft: '17px' }}>
                          đến {w.endTime ? w.endTime.substring(0, 16).replace('T', ' ') : ''}
                        </div>
                      </td>
                      <td>
                        {w.statusText === 'ĐANG MỞ' ? (
                          <span className="badge badge-success" style={{ fontWeight: 700, fontSize: '0.75rem' }}>
                            ● ĐANG MỞ
                          </span>
                        ) : w.statusText === 'SẮP DIỄN RA' ? (
                          <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                            SẮP DIỄN RA
                          </span>
                        ) : w.statusText === 'ĐÃ KẾT THÚC' ? (
                          <span className="badge" style={{ backgroundColor: '#e2e8f0', color: '#64748b', fontSize: '0.75rem' }}>
                            ĐÃ KẾT THÚC
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>
                            TẠM KHÓA
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button
                            className="btn-icon"
                            title={w.isActive ? 'Khóa ca này' : 'Kích hoạt ca'}
                            onClick={() => handleToggle(w.id)}
                            style={{ color: w.isActive ? '#059669' : '#94a3b8' }}
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            title="Sửa ca"
                            onClick={() => handleStartEdit(w)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn-icon"
                            title="Xóa ca"
                            onClick={() => handleDelete(w.id, w.name)}
                            style={{ color: '#dc2626' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
