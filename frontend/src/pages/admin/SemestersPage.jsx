import { useState, useEffect } from 'react';
import { Plus, Edit2, CheckCircle, Star, X, CalendarDays } from 'lucide-react';
import { toast } from 'react-toastify';
import { semesterService } from '../../services/dataService';

export default function SemestersPage() {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSem, setEditingSem] = useState(null);

  const [formData, setFormData] = useState({
    semesterCode: '',
    semesterName: '',
    academicYear: '2025-2026',
    semesterNumber: 1,
    startDate: '',
    endDate: '',
    registrationStart: '',
    registrationEnd: '',
    isCurrent: false,
    status: 'ACTIVE',
  });

  useEffect(() => {
    loadSemesters();
  }, []);

  const loadSemesters = async () => {
    try {
      setLoading(true);
      const res = await semesterService.getAll();
      setSemesters(res.data.data || []);
    } catch {
      toast.error('Lỗi khi tải danh sách học kỳ');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (sem = null) => {
    if (sem) {
      setEditingSem(sem);
      setFormData({
        semesterCode: sem.semesterCode || '',
        semesterName: sem.semesterName || '',
        academicYear: sem.academicYear || '2025-2026',
        semesterNumber: sem.semesterNumber || 1,
        startDate: sem.startDate ? sem.startDate.substring(0, 10) : '',
        endDate: sem.endDate ? sem.endDate.substring(0, 10) : '',
        registrationStart: sem.registrationStart ? sem.registrationStart.substring(0, 10) : '',
        registrationEnd: sem.registrationEnd ? sem.registrationEnd.substring(0, 10) : '',
        isCurrent: sem.isCurrent || false,
        status: sem.status || 'ACTIVE',
      });
    } else {
      setEditingSem(null);
      setFormData({
        semesterCode: '',
        semesterName: '',
        academicYear: '2025-2026',
        semesterNumber: 1,
        startDate: '',
        endDate: '',
        registrationStart: '',
        registrationEnd: '',
        isCurrent: false,
        status: 'ACTIVE',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSem) {
        await semesterService.update(editingSem.id, formData);
        toast.success('Cập nhật học kỳ thành công!');
      } else {
        await semesterService.create(formData);
        toast.success('Thêm học kỳ mới thành công!');
      }
      setIsModalOpen(false);
      loadSemesters();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleSetCurrent = async (id) => {
    try {
      await semesterService.setCurrent(id);
      toast.success('Đã chọn làm học kỳ hoạt động hiện tại!');
      loadSemesters();
    } catch {
      toast.error('Có lỗi xảy ra khi chuyển học kỳ');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Học Kỳ & Thời Khóa Biểu Niên Khóa</h1>
          <p>
            Cấu hình thời gian học vụ, lịch mở đăng ký môn học trực tuyến và kích hoạt kỳ học hiện hành
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} />
            <span>Thêm học kỳ</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã Học Kỳ</th>
                <th>Tên Học Kỳ</th>
                <th>Năm Học</th>
                <th>Thời Gian Học</th>
                <th>Thời Gian ĐK Học Phần</th>
                <th>Học Kỳ Hiện Tại</th>
                <th>Trạng Thái</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Đang tải dữ liệu học kỳ...
                  </td>
                </tr>
              ) : semesters.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Chưa có học kỳ nào được thiết lập.
                  </td>
                </tr>
              ) : (
                semesters.map((s) => (
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
                        {s.semesterCode}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.semesterName}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.academicYear}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CalendarDays size={14} style={{ color: 'var(--text-light)' }} />
                        <span>{s.startDate?.substring(0, 10)} ➔ {s.endDate?.substring(0, 10)}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {s.registrationStart ? (
                        <span>{s.registrationStart.substring(0, 10)} ➔ {s.registrationEnd?.substring(0, 10) || '...'}</span>
                      ) : (
                        <span style={{ color: 'var(--text-light)' }}>Chưa cấu hình</span>
                      )}
                    </td>
                    <td>
                      {s.isCurrent ? (
                        <span
                          className="badge badge-success"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            fontWeight: 700,
                          }}
                        >
                          <Star size={13} fill="currentColor" /> Hiện hành
                        </span>
                      ) : (
                        <button
                          className="btn btn-outline"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          onClick={() => handleSetCurrent(s.id)}
                        >
                          Chọn làm hiện tại
                        </button>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${s.status === 'ACTIVE' ? 'badge-info' : 'badge-warning'}`}>
                        {s.status === 'ACTIVE' ? 'Đang mở' : s.status === 'UPCOMING' ? 'Sắp mở' : 'Đã kết thúc'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-icon" title="Sửa" onClick={() => handleOpenModal(s)}>
                        <Edit2 size={15} />
                      </button>
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
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editingSem ? 'Cập Nhật Kỳ Học' : 'Thêm Mới Học Kỳ'}</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Mã học kỳ *</label>
                  <input
                    type="text"
                    required
                    value={formData.semesterCode}
                    onChange={(e) => setFormData({ ...formData, semesterCode: e.target.value })}
                    className="form-control"
                    placeholder="VD: 20251"
                  />
                </div>
                <div>
                  <label className="form-label">Tên học kỳ *</label>
                  <input
                    type="text"
                    required
                    value={formData.semesterName}
                    onChange={(e) => setFormData({ ...formData, semesterName: e.target.value })}
                    className="form-control"
                    placeholder="VD: Học kỳ 1 (2025-2026)"
                  />
                </div>
                <div>
                  <label className="form-label">Năm học *</label>
                  <input
                    type="text"
                    required
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="form-control"
                    placeholder="2025-2026"
                  />
                </div>
                <div>
                  <label className="form-label">Thứ tự kỳ trong năm *</label>
                  <input
                    type="number"
                    min="1"
                    max="3"
                    required
                    value={formData.semesterNumber}
                    onChange={(e) => setFormData({ ...formData, semesterNumber: parseInt(e.target.value) })}
                    className="form-control"
                  />
                </div>
                <div>
                  <label className="form-label">Ngày bắt đầu học *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div>
                  <label className="form-label">Ngày kết thúc học *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div>
                  <label className="form-label">Bắt đầu mở ĐK môn</label>
                  <input
                    type="date"
                    value={formData.registrationStart}
                    onChange={(e) => setFormData({ ...formData, registrationStart: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div>
                  <label className="form-label">Hạn chót ĐK môn</label>
                  <input
                    type="date"
                    value={formData.registrationEnd}
                    onChange={(e) => setFormData({ ...formData, registrationEnd: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Trạng thái học kỳ *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-select"
                  >
                    <option value="UPCOMING">Sắp mở</option>
                    <option value="ACTIVE">Đang hoạt động</option>
                    <option value="COMPLETED">Đã kết thúc</option>
                  </select>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                    Sinh viên chỉ đăng ký được khi kỳ hiện hành đang hoạt động và trong thời gian đăng ký.
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Huỷ</button>
                <button type="submit" className="btn btn-primary">{editingSem ? 'Lưu thay đổi' : 'Tạo học kỳ'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
