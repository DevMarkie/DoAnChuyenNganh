import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Trash2, Edit2, X, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import { studentConductService, studentService, semesterService } from '../../services/dataService';
import { conductTypeLabel, conductTypeBadgeClass } from '../../utils/labels';

export default function StudentConductPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [semesters, setSemesters] = useState([]);

  // Data
  const [achievements, setAchievements] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedType, setSelectedType] = useState(''); // '' | 'REWARD' | 'DISCIPLINE'

  // Modals
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState(null);
  const [achievementForm, setAchievementForm] = useState({
    studentId: '',
    semesterId: '',
    type: 'REWARD',
    decisionNumber: '',
    issueDate: new Date().toISOString().substring(0, 10),
    title: '',
    description: '',
    level: 'TRUONG',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [resStu, resSem, resAch] = await Promise.all([
        studentService.getAll(),
        semesterService.getAll(),
        studentConductService.getAchievements({}),
      ]);
      setStudents(resStu.data?.data || []);
      const semList = resSem.data?.data || [];
      setSemesters(semList);
      const currentSem = semList.find((s) => s.isCurrent);
      if (currentSem && !selectedSemester) {
        setSelectedSemester(currentSem.id.toString());
      }
      setAchievements(resAch.data?.data || []);
    } catch {
      toast.error('Lỗi khi tải dữ liệu khen thưởng và kỷ luật');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtered Achievements
  const filteredAchievements = useMemo(() => {
    return achievements.filter((a) => {
      if (selectedType && a.type !== selectedType) return false;
      if (selectedSemester && a.semester && a.semester.id !== parseInt(selectedSemester)) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = a.student?.fullName?.toLowerCase().includes(q);
        const matchCode = a.student?.studentCode?.toLowerCase().includes(q);
        const matchTitle = a.title?.toLowerCase().includes(q);
        const matchDecision = a.decisionNumber?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchTitle && !matchDecision) return false;
      }
      return true;
    });
  }, [achievements, selectedType, selectedSemester, search]);

  // Handle Achievement Save
  const handleOpenAchievementModal = (record = null) => {
    if (record) {
      setEditingAchievement(record);
      setAchievementForm({
        studentId: record.student?.id || '',
        semesterId: record.semester?.id || '',
        type: record.type || 'REWARD',
        decisionNumber: record.decisionNumber || '',
        issueDate: record.issueDate ? record.issueDate.substring(0, 10) : new Date().toISOString().substring(0, 10),
        title: record.title || '',
        description: record.description || '',
        level: record.level || 'TRUONG',
      });
    } else {
      setEditingAchievement(null);
      setAchievementForm({
        studentId: students[0]?.id || '',
        semesterId: selectedSemester || semesters[0]?.id || '',
        type: 'REWARD',
        decisionNumber: '',
        issueDate: new Date().toISOString().substring(0, 10),
        title: '',
        description: '',
        level: 'TRUONG',
      });
    }
    setIsAchievementModalOpen(true);
  };

  const handleSaveAchievement = async (e) => {
    e.preventDefault();
    try {
      if (editingAchievement) {
        await studentConductService.updateAchievement(editingAchievement.id, achievementForm);
        toast.success('Cập nhật hồ sơ khen thưởng/kỷ luật thành công!');
      } else {
        await studentConductService.createAchievement(achievementForm);
        toast.success('Thêm hồ sơ khen thưởng/kỷ luật thành công!');
      }
      setIsAchievementModalOpen(false);
      const res = await studentConductService.getAchievements({});
      setAchievements(res.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu hồ sơ');
    }
  };

  const handleDeleteAchievement = async (id, title) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bản ghi "${title}"?`)) return;
    try {
      await studentConductService.deleteAchievement(id);
      toast.success('Đã xóa bản ghi thành công!');
      setAchievements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa bản ghi thất bại');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Quản Lý Hồ Sơ Khen Thưởng & Kỷ Luật</h1>
          <p>
            Theo dõi thành tích khen thưởng và các quyết định xử lý kỷ luật của sinh viên
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => handleOpenAchievementModal()}>
            <Plus size={16} />
            <span>Thêm Khen Thưởng / Kỷ Luật</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            <input
              type="text"
              placeholder="Tìm theo mã SV, họ tên, số quyết định..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="form-select"
              style={{ width: 'auto', minWidth: '180px' }}
            >
              <option value="">Tất cả học kỳ</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.semesterName} ({s.academicYear})
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="form-select"
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option value="">Tất cả phân loại</option>
            <option value="REWARD">🏅 Khen thưởng</option>
            <option value="DISCIPLINE">⚠️ Kỷ luật</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Sinh viên</th>
                <th>Phân loại</th>
                <th>Số quyết định</th>
                <th>Ngày ban hành</th>
                <th>Tiêu đề & Nội dung</th>
                <th>Cấp quyết định</th>
                <th>Học kỳ</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>Đang tải dữ liệu...</td>
                </tr>
              ) : filteredAchievements.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    Chưa có bản ghi khen thưởng hoặc kỷ luật nào.
                  </td>
                </tr>
              ) : (
                filteredAchievements.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.student?.fullName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {item.student?.studentCode} • {item.student?.classEntity?.name || '—'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${conductTypeBadgeClass(item.type)}`}>
                        {conductTypeLabel(item.type)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.decisionNumber}</span>
                    </td>
                    <td>{item.issueDate}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.title}</div>
                      {item.description && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-neutral">{item.level || 'TRUONG'}</span>
                    </td>
                    <td>{item.semester?.semesterName || 'Toàn khóa'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          className="btn-icon"
                          title="Sửa"
                          onClick={() => handleOpenAchievementModal(item)}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn-icon text-danger"
                          title="Xóa"
                          onClick={() => handleDeleteAchievement(item.id, item.title)}
                        >
                          <Trash2 size={15} />
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

      {/* Modal Achievement */}
      {isAchievementModalOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setIsAchievementModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editingAchievement ? 'Cập Nhật Hồ Sơ' : 'Thêm Khen Thưởng / Kỷ Luật'}</h3>
              <button className="btn-icon" onClick={() => setIsAchievementModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveAchievement}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Sinh Viên *</label>
                  <select
                    required
                    value={achievementForm.studentId}
                    onChange={(e) => setAchievementForm({ ...achievementForm, studentId: e.target.value })}
                    className="form-select"
                    disabled={!!editingAchievement}
                  >
                    <option value="">-- Chọn sinh viên --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.studentCode} - {s.fullName} ({s.classEntity?.name || ''})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Phân Loại *</label>
                    <select
                      value={achievementForm.type}
                      onChange={(e) => setAchievementForm({ ...achievementForm, type: e.target.value })}
                      className="form-select"
                    >
                      <option value="REWARD">🏅 Khen thưởng</option>
                      <option value="DISCIPLINE">⚠️ Kỷ luật</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Học Kỳ</label>
                    <select
                      value={achievementForm.semesterId}
                      onChange={(e) => setAchievementForm({ ...achievementForm, semesterId: e.target.value })}
                      className="form-select"
                    >
                      <option value="">Toàn khóa / Không xác định</option>
                      {semesters.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.semesterName} ({s.academicYear})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Số Quyết Định *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: 125/QĐ-ĐHPK"
                      value={achievementForm.decisionNumber}
                      onChange={(e) => setAchievementForm({ ...achievementForm, decisionNumber: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ngày Ban Hành *</label>
                    <input
                      type="date"
                      required
                      value={achievementForm.issueDate}
                      onChange={(e) => setAchievementForm({ ...achievementForm, issueDate: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Tiêu Đề Quyết Định *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Đạt giải Nhất SV Nghiên cứu khoa học"
                      value={achievementForm.title}
                      onChange={(e) => setAchievementForm({ ...achievementForm, title: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cấp Quyết Định</label>
                    <select
                      value={achievementForm.level}
                      onChange={(e) => setAchievementForm({ ...achievementForm, level: e.target.value })}
                      className="form-select"
                    >
                      <option value="KHOA">Cấp Khoa</option>
                      <option value="TRUONG">Cấp Trường</option>
                      <option value="BOGD">Bộ GD&ĐT</option>
                      <option value="QUOCGIA">Quốc gia</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nội Dung Chi Tiết</label>
                  <textarea
                    rows="3"
                    placeholder="Mô tả cụ thể căn cứ quyết định, hình thức thưởng/phạt..."
                    value={achievementForm.description}
                    onChange={(e) => setAchievementForm({ ...achievementForm, description: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsAchievementModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAchievement ? 'Lưu Thay Đổi' : 'Thêm Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
