import { useState, useEffect } from 'react';
import { Plus, Edit2, Layers, Filter, X, Users, Search, RotateCcw } from 'lucide-react';
import { toast } from 'react-toastify';
import { courseSectionService, subjectService, lecturerService, semesterService } from '../../services/dataService';

export default function CourseSectionsPage() {
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSec, setEditingSec] = useState(null);

  const [formData, setFormData] = useState({
    sectionCode: '',
    subjectId: '',
    lecturerId: '',
    semesterId: '',
    maxStudents: 50,
    schedule: 'Thứ 2 (07:00 - 11:30)',
    room: 'P.302-A2',
    status: 'OPEN',
  });

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    try {
      setLoading(true);
      const [resSec, resSub, resLec, resSem] = await Promise.all([
        courseSectionService.getAll(),
        subjectService.getAll(),
        lecturerService.getAll(),
        semesterService.getAll(),
      ]);
      setSections(resSec.data.data || []);
      setSubjects(resSub.data.data || []);
      setLecturers(resLec.data.data || []);
      const semList = resSem.data.data || [];
      setSemesters(semList);
      const cur = semList.find((s) => s.isCurrent);
      if (cur) setSelectedSemester(cur.id);
    } catch {
      toast.error('Lỗi khi tải dữ liệu học phần');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (sec = null) => {
    if (sec) {
      setEditingSec(sec);
      setFormData({
        sectionCode: sec.sectionCode || '',
        subjectId: sec.subject?.id || '',
        lecturerId: sec.lecturer?.id || '',
        semesterId: sec.semester?.id || '',
        maxStudents: sec.maxStudents || 50,
        schedule: sec.schedule || '',
        room: sec.room || '',
        status: sec.status || 'OPEN',
      });
    } else {
      setEditingSec(null);
      setFormData({
        sectionCode: '',
        subjectId: subjects[0]?.id || '',
        lecturerId: lecturers[0]?.id || '',
        semesterId: selectedSemester || semesters[0]?.id || '',
        maxStudents: 50,
        schedule: 'Thứ 2 (07:00 - 11:30)',
        room: 'P.302-A2',
        status: 'OPEN',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSec) {
        await courseSectionService.update(editingSec.id, formData);
        toast.success('Cập nhật lớp học phần thành công!');
      } else {
        await courseSectionService.create(formData);
        toast.success('Mở lớp học phần mới thành công!');
      }
      setIsModalOpen(false);
      const res = await courseSectionService.getAll();
      setSections(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const filtered = sections.filter((s) => {
    const matchSem = selectedSemester ? s.semester?.id === parseInt(selectedSemester) : true;
    const matchSearch = search
      ? s.sectionCode?.toLowerCase().includes(search.toLowerCase()) ||
        s.subject?.subjectName?.toLowerCase().includes(search.toLowerCase()) ||
        s.lecturer?.fullName?.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchSem && matchSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Lớp Học Phần & Kế Hoạch Giảng Dạy</h1>
          <p>
            Phân bổ môn học, phân công giảng viên, thời khóa biểu và quản lý số lượng sinh viên đăng ký
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} />
            <span>Mở lớp học phần</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type="text"
                placeholder="Tìm mã lớp HP, tên môn, giảng viên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '36px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '220px' }}>
              <Filter size={15} style={{ color: 'var(--text-muted)' }} />
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="form-select"
                style={{ width: 'auto', minWidth: '200px' }}
              >
                <option value="">Tất cả học kỳ</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.semesterName} {s.isCurrent ? '★ (Hiện tại)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {(search || selectedSemester) && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => { setSearch(''); setSelectedSemester(''); }}
                title="Xóa bộ lọc"
                style={{ padding: '8px 12px' }}
              >
                <RotateCcw size={14} />
                <span>Đặt lại</span>
              </button>
            )}
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Hiển thị <strong>{filtered.length}</strong> / <strong>{sections.length}</strong> lớp học phần
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã Lớp HP</th>
                <th>Môn Học</th>
                <th>Tín Chỉ</th>
                <th>Giảng Viên Giảng Dạy</th>
                <th>Lịch Học</th>
                <th>Phòng</th>
                <th>Sĩ Số Đăng Ký</th>
                <th>Trạng Thái</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Đang tải danh sách lớp học phần...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Không tìm thấy lớp học phần nào phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const currentCount = s.currentStudents || 0;
                  const maxCount = s.maxStudents || 50;
                  const isFull = currentCount >= maxCount;

                  return (
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
                          {s.sectionCode}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.subject?.subjectName}</td>
                      <td>
                        <span className="badge badge-info">{s.subject?.credits} TC</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{s.lecturer?.fullName || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{s.schedule || '—'}</td>
                      <td>
                        <span className="badge badge-neutral">{s.room || '—'}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontVariantNumeric: 'tabular-nums',
                              color: isFull ? 'var(--danger)' : 'var(--text-main)'
                            }}
                          >
                            {currentCount} / {maxCount}
                          </span>
                          {isFull && <span className="badge badge-danger">Đầy</span>}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            s.status === 'OPEN' ? 'badge-success'
                            : s.status === 'CLOSED' ? 'badge-warning'
                            : 'badge-info'
                          }`}
                        >
                          {s.status === 'OPEN' ? 'Mở đăng ký' : s.status === 'CLOSED' ? 'Đã khóa' : 'Đang học'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-icon" title="Sửa" onClick={() => handleOpenModal(s)}>
                          <Edit2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
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
              <h3>{editingSec ? 'Cập Nhật Lớp Học Phần' : 'Mở Lớp Học Phần Mới'}</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Mã lớp học phần *</label>
                  <input
                    type="text"
                    required
                    value={formData.sectionCode}
                    onChange={(e) => setFormData({ ...formData, sectionCode: e.target.value })}
                    className="form-control"
                    placeholder="VD: CS101-01"
                  />
                </div>
                <div>
                  <label className="form-label">Môn học *</label>
                  <select
                    required
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="form-select"
                  >
                    <option value="">-- Chọn môn học --</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.subjectName} ({sub.subjectCode})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Giảng viên giảng dạy *</label>
                  <select
                    required
                    value={formData.lecturerId}
                    onChange={(e) => setFormData({ ...formData, lecturerId: e.target.value })}
                    className="form-select"
                  >
                    <option value="">-- Chọn giảng viên --</option>
                    {lecturers.map((lec) => (
                      <option key={lec.id} value={lec.id}>{lec.fullName} ({lec.lecturerCode})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Học kỳ *</label>
                  <select
                    required
                    value={formData.semesterId}
                    onChange={(e) => setFormData({ ...formData, semesterId: e.target.value })}
                    className="form-select"
                  >
                    <option value="">-- Chọn học kỳ --</option>
                    {semesters.map((sem) => (
                      <option key={sem.id} value={sem.id}>{sem.semesterName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Sĩ số tối đa</label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    required
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) })}
                    className="form-control"
                  />
                </div>
                <div>
                  <label className="form-label">Phòng học</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="form-control"
                    placeholder="P.302-A2"
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Lịch học</label>
                  <input
                    type="text"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    className="form-control"
                    placeholder="VD: Thứ 2 (07:00 - 11:30)"
                  />
                </div>
                <div>
                  <label className="form-label">Trạng thái lớp</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-select"
                  >
                    <option value="OPEN">Mở đăng ký (OPEN)</option>
                    <option value="CLOSED">Khóa đăng ký (CLOSED)</option>
                    <option value="IN_PROGRESS">Đang học (IN_PROGRESS)</option>
                    <option value="COMPLETED">Đã hoàn thành (COMPLETED)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Huỷ</button>
                <button type="submit" className="btn btn-primary">{editingSec ? 'Lưu thay đổi' : 'Tạo lớp học phần'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
