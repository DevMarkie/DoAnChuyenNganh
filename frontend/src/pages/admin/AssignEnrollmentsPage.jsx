import { useState, useEffect, useMemo } from 'react';
import { UserPlus, Users, Search, AlertTriangle, X, RotateCcw } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  courseSectionService,
  studentService,
  classService,
  semesterService,
  enrollmentService,
} from '../../services/dataService';

const ENROLLMENT_TYPE = {
  FIRST_TIME: { label: 'Học lần đầu', cls: 'badge-neutral' },
  RETAKE: { label: 'Học lại', cls: 'badge-warning' },
  IMPROVE: { label: 'Cải thiện', cls: 'badge-info' },
};

export default function AssignEnrollmentsPage() {
  const [semesters, setSemesters] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnroll, setLoadingEnroll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [autoExpandCapacity, setAutoExpandCapacity] = useState(false);
  const [batchAssigning, setBatchAssigning] = useState(false);
  const [override, setOverride] = useState(null);

  useEffect(() => {
    let alive = true;
    const loadInitial = async () => {
      try {
        const [resSec, resStu, resClass, resSem] = await Promise.all([
          courseSectionService.getAll(),
          studentService.getAll(),
          classService.getAll(),
          semesterService.getAll(),
        ]);
        if (!alive) return;
        setSections(resSec.data?.data || []);
        setStudents(resStu.data?.data || []);
        setClasses(resClass.data?.data || []);
        const semList = resSem.data?.data || [];
        setSemesters(semList);
        const cur = semList.find((s) => s.isCurrent);
        if (cur) setSelectedSemester(String(cur.id));
      } catch {
        if (alive) toast.error('Lỗi khi tải dữ liệu xếp lớp');
      } finally {
        if (alive) setLoading(false);
      }
    };
    loadInitial();
    return () => { alive = false; };
  }, []);

  const filteredSections = useMemo(() => (
    selectedSemester
      ? sections.filter((s) => String(s.semester?.id) === String(selectedSemester))
      : sections
  ), [sections, selectedSemester]);

  const selectedSection = useMemo(() => (
    sections.find((s) => String(s.id) === String(selectedSectionId)) || null
  ), [sections, selectedSectionId]);

  // Nạp danh sách SV đang có trong lớp học phần mỗi khi đổi lớp.
  useEffect(() => {
    if (!selectedSectionId) return;
    let alive = true;
    (async () => {
      try {
        setLoadingEnroll(true);
        const res = await enrollmentService.getBySection(selectedSectionId);
        if (alive) setEnrollments(res.data?.data || []);
      } catch {
        if (alive) { setEnrollments([]); toast.error('Không tải được danh sách sinh viên của lớp'); }
      } finally {
        if (alive) setLoadingEnroll(false);
      }
    })();
    return () => { alive = false; };
  }, [selectedSectionId]);

  const enrolledIds = useMemo(() => (
    new Set(enrollments.filter((e) => e.status === 'ENROLLED').map((e) => e.student?.id))
  ), [enrollments]);

  const activeCount = enrolledIds.size;
  const maxCount = selectedSection?.maxStudents || 0;
  const isFull = selectedSection ? activeCount >= maxCount : false;

  const studentOptions = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    const list = q
      ? students.filter((s) => s.fullName?.toLowerCase().includes(q) || s.studentCode?.toLowerCase().includes(q))
      : students;
    return { items: list.slice(0, 100), total: list.length };
  }, [students, studentSearch]);

  const refreshSection = async () => {
    try {
      const [resSec, resEnr] = await Promise.all([
        courseSectionService.getAll(),
        enrollmentService.getBySection(selectedSectionId),
      ]);
      setSections(resSec.data?.data || []);
      setEnrollments(resEnr.data?.data || []);
    } catch {
      // giữ nguyên dữ liệu cũ nếu làm mới lỗi
    }
  };

  const handleAssignSingle = async () => {
    if (!selectedSectionId || !selectedStudentId) return;
    const stu = students.find((s) => String(s.id) === String(selectedStudentId));
    setAssigning(true);
    try {
      await enrollmentService.adminAssign(selectedStudentId, selectedSectionId);
      toast.success(`Đã xếp ${stu?.fullName || 'sinh viên'} vào lớp ${selectedSection?.sectionCode || ''}`);
      setSelectedStudentId('');
      await refreshSection();
    } catch (err) {
      const msg = err.response?.data?.message || 'Xếp lớp thất bại';
      // BR-05: lớp đầy → mở luồng cưỡng chế vượt sĩ số (bắt buộc nhập lý do).
      if (msg.includes('đầy')) {
        setOverride({
          studentId: selectedStudentId,
          label: stu ? `${stu.fullName} (${stu.studentCode})` : `SV #${selectedStudentId}`,
          message: msg,
          reason: '',
          submitting: false,
        });
      } else {
        toast.error(msg);
      }
    } finally {
      setAssigning(false);
    }
  };

  const handleConfirmOverride = async () => {
    if (!override) return;
    if (!override.reason.trim()) { toast.error('Vui lòng nhập lý do cưỡng chế vượt sĩ số'); return; }
    setOverride((o) => ({ ...o, submitting: true }));
    try {
      await enrollmentService.adminAssign(override.studentId, selectedSectionId, {
        forceOverride: true,
        overrideReason: override.reason.trim(),
      });
      toast.success('Đã cưỡng chế xếp lớp (vượt sĩ số) thành công');
      setOverride(null);
      setSelectedStudentId('');
      await refreshSection();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cưỡng chế xếp lớp thất bại');
      setOverride((o) => ({ ...o, submitting: false }));
    }
  };

  const handleBatchAssign = async () => {
    if (!selectedSectionId || !selectedClassId) return;
    const cls = classes.find((c) => String(c.id) === String(selectedClassId));
    const ok = window.confirm(
      `Xếp toàn bộ sinh viên lớp ${cls?.name || ''} vào lớp học phần ${selectedSection?.sectionCode || ''}?\n\n` +
      'Sinh viên đã có trong lớp sẽ được bỏ qua. Nếu không đủ chỗ, toàn bộ thao tác sẽ bị hủy.'
    );
    if (!ok) return;
    setBatchAssigning(true);
    try {
      const res = await enrollmentService.adminBatchAssignClass(selectedClassId, selectedSectionId, autoExpandCapacity);
      const count = res.data?.data?.length ?? 0;
      toast.success(`Đã xếp ${count} sinh viên của lớp ${cls?.name || ''} vào lớp học phần`);
      setSelectedClassId('');
      await refreshSection();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xếp lớp theo lớp sinh hoạt thất bại');
    } finally {
      setBatchAssigning(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Xếp Lớp Học Phần (Admin)</h1>
          <p>
            Giao trực tiếp sinh viên vào lớp học phần — theo từng sinh viên hoặc cả lớp sinh hoạt.
            Admin có thể xếp lớp kể cả khi lớp đã khóa đăng ký; trường hợp vượt sĩ số phải nhập lý do cưỡng chế (BR-05).
          </p>
        </div>
      </div>

      {/* Chọn lớp học phần */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ minWidth: '220px' }}>
            <label className="form-label">Học kỳ</label>
            <select
              value={selectedSemester}
              onChange={(e) => { 
                setSelectedSemester(e.target.value); 
                setSelectedSectionId(''); 
                setEnrollments([]); 
                setSelectedStudentId('');
              }}
              className="form-select"
            >
              <option value="">Tất cả học kỳ</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>{s.semesterName}{s.isCurrent ? ' ★ (Hiện tại)' : ''}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '320px' }}>
            <label className="form-label">Lớp học phần *</label>
            <select
              value={selectedSectionId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedSectionId(val);
                if (!val) setEnrollments([]);
                setSelectedStudentId('');
              }}
              className="form-select"
            >
              <option value="">-- Chọn lớp học phần cần xếp --</option>
              {filteredSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sectionCode} · {s.subject?.subjectName} · {s.lecturer?.fullName || 'Chưa phân công'}
                </option>
              ))}
            </select>
          </div>
          {selectedSemester && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => { 
                setSelectedSemester(''); 
                setSelectedSectionId(''); 
                setEnrollments([]); 
                setSelectedStudentId('');
              }}
              title="Bỏ lọc học kỳ"
              style={{ height: '38px' }}
            >
              <RotateCcw size={14} />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="card"><div className="card-body" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải dữ liệu...</div></div>
      ) : !selectedSection ? (
        <div className="card"><div className="card-body" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Chọn một lớp học phần ở trên để bắt đầu xếp sinh viên.
        </div></div>
      ) : (
        <>
          {/* Tóm tắt lớp học phần đang chọn */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-body" style={{ padding: '16px 20px', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <div className="form-label" style={{ marginBottom: 4 }}>Mã lớp HP</div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>{selectedSection.sectionCode}</span>
              </div>
              <div>
                <div className="form-label" style={{ marginBottom: 4 }}>Môn học</div>
                <strong>{selectedSection.subject?.subjectName}</strong>{' '}
                <span className="badge badge-info">{selectedSection.subject?.credits} TC</span>
              </div>
              <div>
                <div className="form-label" style={{ marginBottom: 4 }}>Giảng viên</div>
                <span style={{ color: 'var(--text-secondary)' }}>{selectedSection.lecturer?.fullName || '—'}</span>
              </div>
              <div>
                <div className="form-label" style={{ marginBottom: 4 }}>Sĩ số đang xếp</div>
                <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: isFull ? 'var(--danger)' : 'var(--text-main)' }}>
                  {activeCount} / {maxCount}
                </span>
                {isFull && <span className="badge badge-danger" style={{ marginLeft: 8 }}>Đã đầy</span>}
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <div className="form-label" style={{ marginBottom: 4 }}>Trạng thái lớp</div>
                <span className={`badge ${selectedSection.status === 'OPEN' ? 'badge-success' : selectedSection.status === 'CLOSED' ? 'badge-warning' : 'badge-danger'}`}>
                  {selectedSection.status === 'OPEN' ? 'Mở đăng ký' : selectedSection.status === 'CLOSED' ? 'Đã khóa' : 'Đã hủy'}
                </span>
              </div>
            </div>
          </div>

          {/* Hai cách xếp lớp */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {/* Xếp từng sinh viên */}
            <div className="card">
              <div className="card-body" style={{ padding: '18px 20px' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserPlus size={17} /> Xếp một sinh viên
                </h3>
                <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Tìm theo mã SV hoặc họ tên, chọn và xếp trực tiếp vào lớp học phần.
                </p>
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input
                    type="text"
                    placeholder="Tìm mã SV, họ tên..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="form-control"
                    style={{ paddingLeft: '34px' }}
                  />
                </div>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="form-select"
                  size={6}
                  style={{ marginBottom: '6px' }}
                >
                  {studentOptions.items.map((s) => {
                    const already = enrolledIds.has(s.id);
                    return (
                      <option key={s.id} value={s.id} disabled={already}>
                        {s.studentCode} — {s.fullName}{s.classEntity?.name ? ` · ${s.classEntity.name}` : ''}{already ? ' (đã có trong lớp)' : ''}
                      </option>
                    );
                  })}
                </select>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {studentOptions.total > studentOptions.items.length
                    ? `Hiển thị 100/${studentOptions.total} kết quả — hãy nhập từ khóa để thu hẹp.`
                    : `${studentOptions.total} sinh viên khớp.`}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleAssignSingle}
                  disabled={!selectedStudentId || assigning}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <UserPlus size={16} />
                  <span>{assigning ? 'Đang xếp...' : 'Xếp vào lớp'}</span>
                </button>
              </div>
            </div>

            {/* Xếp cả lớp sinh hoạt */}
            <div className="card">
              <div className="card-body" style={{ padding: '18px 20px' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={17} /> Xếp cả lớp sinh hoạt
                </h3>
                <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Xếp toàn bộ sinh viên của một lớp sinh hoạt vào lớp học phần. SV đã có sẽ được bỏ qua;
                  nếu không đủ chỗ, cả lô sẽ bị hủy trừ khi bật tự mở rộng sĩ số.
                </p>
                <label className="form-label">Lớp sinh hoạt</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="form-select"
                  style={{ marginBottom: '12px' }}
                >
                  <option value="">-- Chọn lớp sinh hoạt --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}){c.department?.name ? ` · ${c.department.name}` : ''}
                    </option>
                  ))}
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={autoExpandCapacity}
                    onChange={(e) => setAutoExpandCapacity(e.target.checked)}
                  />
                  Tự động mở rộng sĩ số nếu không đủ chỗ
                </label>
                <button
                  className="btn btn-outline"
                  onClick={handleBatchAssign}
                  disabled={!selectedClassId || batchAssigning}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Users size={16} />
                  <span>{batchAssigning ? 'Đang xếp...' : 'Xếp cả lớp'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Danh sách SV đang có trong lớp */}
          <div className="card">
            <div className="card-body" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <strong>Sinh viên trong lớp học phần</strong>
              <span style={{ marginLeft: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>({activeCount} đang học)</span>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã SV</th>
                    <th>Họ và tên</th>
                    <th>Lớp sinh hoạt</th>
                    <th>Hình thức học</th>
                    <th>Ngày xếp</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingEnroll ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>Đang tải...</td></tr>
                  ) : enrollments.filter((e) => e.status === 'ENROLLED').length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>Lớp học phần chưa có sinh viên nào.</td></tr>
                  ) : (
                    enrollments.filter((e) => e.status === 'ENROLLED').map((e) => {
                      const t = ENROLLMENT_TYPE[e.enrollmentType] || ENROLLMENT_TYPE.FIRST_TIME;
                      return (
                        <tr key={e.id}>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>
                              {e.student?.studentCode}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{e.student?.fullName}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{e.student?.classEntity?.name || '—'}</td>
                          <td><span className={`badge ${t.cls}`}>{t.label}</span></td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString('vi-VN') : '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal cưỡng chế vượt sĩ số (BR-05) */}
      {override && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget && !override.submitting) setOverride(null); }}>
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} style={{ color: 'var(--warning)' }} /> Cưỡng chế vượt sĩ số
              </h3>
              <button className="btn-icon" onClick={() => setOverride(null)} disabled={override.submitting}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{
                padding: '12px 14px', marginBottom: '14px',
                backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5,
              }}>
                {override.message}
              </div>
              <p style={{ fontSize: '0.88rem', margin: '0 0 14px' }}>
                Xếp <strong>{override.label}</strong> vào lớp <strong>{selectedSection?.sectionCode}</strong> vượt sĩ số tối đa.
                Thao tác được ghi nhật ký. Vui lòng nêu rõ lý do.
              </p>
              <label className="form-label">Lý do cưỡng chế *</label>
              <textarea
                rows="3"
                className="form-control"
                placeholder="VD: Sinh viên học lại theo quyết định của Phòng Đào tạo..."
                value={override.reason}
                onChange={(e) => setOverride((o) => ({ ...o, reason: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setOverride(null)} disabled={override.submitting}>Hủy</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmOverride}
                disabled={override.submitting || !override.reason.trim()}
              >
                {override.submitting ? 'Đang xử lý...' : 'Xác nhận cưỡng chế'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
