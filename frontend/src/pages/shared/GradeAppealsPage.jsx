import TableRowSkeleton from '../../components/common/TableRowSkeleton';
import { useEffect, useState, useMemo } from 'react';
import {
  CheckCircle2,
  Eye,
  X,
  ClipboardCheck,
  UserCheck,
  FileSignature,
  Save,
  Search,
  Filter,
  Shield,
  Layers,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { gradeAppealService, lecturerService } from '../../services/dataService';
import useAuthStore from '../../store/authStore';

const statusLabel = {
  PENDING_ASSIGNMENT: 'Chờ phân công CB chấm 2',
  ASSIGNED: 'Đã phân công (Chờ chấm lại)',
  REJECTED_NO_CHANGE: 'Giữ nguyên điểm (Lệch < 0.5)',
  PENDING_HEAD_APPROVAL: 'Chờ Trưởng BM niêm phong',
  HEAD_APPROVED: 'Trưởng BM đã niêm phong',
  APPROVED_AND_APPLIED: 'Đã chốt điểm vào hệ thống',
  FINAL_APPLIED: 'Đã chốt điểm vào hệ thống',
  REJECTED: 'Đã từ chối',
  // Backward compatibility
  PENDING: 'Chờ xử lý',
  IN_REVIEW: 'Đang xem xét',
  PROPOSED: 'Đã đề xuất',
  APPROVED: 'Đã duyệt',
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'FINAL_APPLIED':
    case 'APPROVED':
      return 'badge-success';
    case 'HEAD_APPROVED':
      return 'badge-info';
    case 'PENDING_HEAD_APPROVAL':
      return 'badge-purple';
    case 'ASSIGNED':
    case 'IN_REVIEW':
      return 'badge-info';
    case 'PENDING_ASSIGNMENT':
    case 'PENDING':
    case 'PROPOSED':
      return 'badge-warning';
    case 'REJECTED_NO_CHANGE':
      return 'badge-neutral';
    case 'REJECTED':
      return 'badge-danger';
    default:
      return 'badge-neutral';
  }
};

export default function GradeAppealsPage() {
  const { user } = useAuthStore();
  const role = user?.role;
  const isLecturer = role === 'LECTURER';
  const isAcademic = role === 'ACADEMIC_AFFAIRS' || role === 'ACADEMIC_STAFF' || role === 'ADMIN';

  // Tabs for Lecturer
  const [activeTab, setActiveTab] = useState(isLecturer ? 'assigned' : 'all');

  // Main list
  const [appeals, setAppeals] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [headTasks, setHeadTasks] = useState([]);
  const [lecturers, setLecturers] = useState([]);

  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals state
  const [assignModalAppeal, setAssignModalAppeal] = useState(null);
  const [selectedGraderId, setSelectedGraderId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const [gradingModalAppeal, setGradingModalAppeal] = useState(null);
  const [gradingForm, setGradingForm] = useState({ newScore: '', hasMechanicalError: false, reviewNotes: '' });
  const [submittingGrading, setSubmittingGrading] = useState(false);

  const [headSignModalAppeal, setHeadSignModalAppeal] = useState(null);
  const [headSignNotes, setHeadSignNotes] = useState('');
  const [signing, setSigning] = useState(false);

  const [applyModalAppeal, setApplyModalAppeal] = useState(null);
  const [detailModalAppeal, setDetailModalAppeal] = useState(null);
  const [applyReason, setApplyReason] = useState('');
  const [applying, setApplying] = useState(false);

  // Load initial data
  const loadAllAppeals = async () => {
    try {
      setLoading(true);
      const res = await gradeAppealService.getAll(statusFilter ? { status: statusFilter } : {});
      setAppeals(res.data?.data || []);
    } catch {
      toast.error('Không thể tải danh sách đơn phúc khảo');
    } finally {
      setLoading(false);
    }
  };

  const loadLecturerTasks = async () => {
    try {
      setLoading(true);
      const [resAssigned, resHead] = await Promise.allSettled([
        gradeAppealService.getAssignedTasks(),
        gradeAppealService.getDepartmentHeadAppeals(),
      ]);
      if (resAssigned.status === 'fulfilled') {
        setAssignedTasks(resAssigned.value.data?.data || []);
      }
      if (resHead.status === 'fulfilled') {
        setHeadTasks(resHead.value.data?.data || []);
      }
    } catch {
      toast.error('Lỗi khi tải nhiệm vụ phúc khảo');
    } finally {
      setLoading(false);
    }
  };

  const loadLecturers = async () => {
    try {
      const res = await lecturerService.getAll();
      setLecturers(res.data?.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isAcademic) {
      loadAllAppeals();
      loadLecturers();
    } else if (isLecturer) {
      loadLecturerTasks();
      loadAllAppeals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Handle Assign Grader
  const handleOpenAssign = (appeal) => {
    setAssignModalAppeal(appeal);
    setSelectedGraderId('');
  };

  const handleAssignGrader = async (e) => {
    e.preventDefault();
    if (!assignModalAppeal || !selectedGraderId) {
      toast.warning('Vui lòng chọn Cán bộ chấm thi thứ 2');
      return;
    }
    try {
      setAssigning(true);
      await gradeAppealService.assignGrader(assignModalAppeal.id, parseInt(selectedGraderId));
      toast.success('Đã phân công Cán bộ chấm thi thứ 2 thành công!');
      setAssignModalAppeal(null);
      loadAllAppeals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi phân công cán bộ chấm thi');
    } finally {
      setAssigning(false);
    }
  };

  // Handle Submit Grading (Independent Examiner)
  const handleOpenGrading = (appeal) => {
    setGradingModalAppeal(appeal);
    setGradingForm({
      newScore: appeal.newScore ?? '',
      hasMechanicalError: Boolean(appeal.hasMechanicalError),
      reviewNotes: appeal.reviewNotes || '',
    });
  };

  const handleSubmitGrading = async (e) => {
    e.preventDefault();
    if (!gradingModalAppeal || gradingForm.newScore === '') {
      toast.warning('Vui lòng nhập điểm chấm lại');
      return;
    }
    const score = parseFloat(gradingForm.newScore);
    if (isNaN(score) || score < 0 || score > 10) {
      toast.warning('Điểm số phải nằm trong khoảng 0.0 - 10.0');
      return;
    }
    try {
      setSubmittingGrading(true);
      await gradeAppealService.submitGrading(gradingModalAppeal.id, {
        newScore: score,
        hasMechanicalError: gradingForm.hasMechanicalError,
        reviewNotes: gradingForm.reviewNotes,
      });
      toast.success('Đã gửi kết quả chấm phúc khảo thành công!');
      setGradingModalAppeal(null);
      loadLecturerTasks();
      loadAllAppeals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi nộp kết quả chấm lại');
    } finally {
      setSubmittingGrading(false);
    }
  };

  // Handle Head Sign (Department Head)
  const handleOpenHeadSign = (appeal) => {
    setHeadSignModalAppeal(appeal);
    setHeadSignNotes(appeal.headReviewNotes || '');
  };

  const handleHeadSign = async (e) => {
    e.preventDefault();
    if (!headSignModalAppeal) return;
    try {
      setSigning(true);
      await gradeAppealService.headSign(headSignModalAppeal.id, {
        reviewNotes: headSignNotes,
      });
      toast.success('Đã niêm phong phê duyệt điện tử cấp Bộ môn thành công!');
      setHeadSignModalAppeal(null);
      loadLecturerTasks();
      loadAllAppeals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi niêm phong phê duyệt phúc khảo');
    } finally {
      setSigning(false);
    }
  };

  // Handle Apply Final Adjustment (Academic Affairs)
  const handleOpenApply = (appeal) => {
    setApplyModalAppeal(appeal);
    setApplyReason('Cập nhật điểm theo biên bản phúc khảo có phê duyệt điện tử của Trưởng Bộ môn');
  };

  const handleApplyFinal = async (e) => {
    e.preventDefault();
    if (!applyModalAppeal || !applyReason.trim()) {
      toast.warning('Vui lòng nhập căn cứ điều chỉnh điểm');
      return;
    }
    try {
      setApplying(true);
      await gradeAppealService.applyFinalAdjustment(applyModalAppeal.id, {
        finalAdjustmentReason: applyReason.trim(),
      });
      toast.success('Đã cập nhật điểm chính thức vào hệ thống và ghi nhận Audit Log!');
      setApplyModalAppeal(null);
      loadAllAppeals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật điểm vào hệ thống');
    } finally {
      setApplying(false);
    }
  };

  // Available candidate graders for assignment (excludes section lecturer)
  const candidateGraders = useMemo(() => {
    if (!assignModalAppeal) return [];
    return lecturers.filter((l) => l.id !== assignModalAppeal.lecturerId);
  }, [assignModalAppeal, lecturers]);

  // Current list to display
  const displayedList = useMemo(() => {
    let list = [];
    if (isLecturer && activeTab === 'assigned') {
      list = assignedTasks;
    } else if (isLecturer && activeTab === 'head') {
      list = headTasks;
    } else {
      list = appeals;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.studentCode?.toLowerCase().includes(q) ||
          a.studentName?.toLowerCase().includes(q) ||
          a.subjectCode?.toLowerCase().includes(q) ||
          a.subjectName?.toLowerCase().includes(q) ||
          a.sectionCode?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [isLecturer, activeTab, assignedTasks, headTasks, appeals, searchQuery]);

  // Live threshold check inside grading modal
  const liveDiff = useMemo(() => {
    if (!gradingModalAppeal || gradingForm.newScore === '') return null;
    const cur = Number(gradingModalAppeal.currentScore || 0);
    const nw = parseFloat(gradingForm.newScore);
    if (isNaN(nw)) return null;
    return Math.abs(nw - cur);
  }, [gradingModalAppeal, gradingForm.newScore]);

  const liveThresholdExceeded = liveDiff != null && (liveDiff >= 0.5 || gradingForm.hasMechanicalError);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>
            Quản Lý & Xử Lý Phúc Khảo Điểm Thi
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '4px 0 0' }}>
            Quy trình 4 bước: Sinh viên nộp đơn (7 ngày) → P. Đào tạo phân công CB chấm 2 → Chấm độc lập & Xét ngưỡng (0.5 điểm) → Trưởng BM niêm phong phê duyệt điện tử → Cập nhật sổ điểm
          </p>
        </div>

        {/* Tab switcher for Lecturer */}
        {isLecturer && (
          <div className="page-header-actions" style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${activeTab === 'assigned' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('assigned')}
            >
              <ClipboardCheck size={16} />
              <span>Nhiệm vụ chấm lại ({assignedTasks.length})</span>
            </button>
            <button
              className={`btn ${activeTab === 'head' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('head')}
            >
              <FileSignature size={16} />
              <span>Duyệt cấp Bộ môn ({headTasks.length})</span>
            </button>
            <button
              className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('all')}
            >
              <Layers size={16} />
              <span>Tất cả hồ sơ ({appeals.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div
          className="card-body"
          style={{
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Filter size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Trạng thái:</span>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ minWidth: '220px' }}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(statusLabel).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ position: 'relative', width: '300px' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-light)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã SV, họ tên, môn học, lớp..."
              className="form-control"
              style={{ paddingLeft: '32px', fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Sinh viên</th>
                <th>Học phần</th>
                <th>Cột điểm</th>
                <th style={{ textAlign: 'center' }}>Điểm cũ (CK)</th>
                <th style={{ textAlign: 'center' }}>Điểm chấm lại</th>
                <th style={{ textAlign: 'center' }}>Chênh lệch</th>
                <th>CB Chấm độc lập</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowSkeleton columns={9} />
              ) : displayedList.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    Không có hồ sơ phúc khảo nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                displayedList.map((appeal) => {
                  const canAssign = isAcademic && (appeal.status === 'PENDING' || appeal.status === 'PENDING_ASSIGNMENT');
                  const canGrade = isLecturer && appeal.status === 'ASSIGNED';
                  const canHeadSign = (isLecturer || isAcademic) && appeal.status === 'PENDING_HEAD_APPROVAL';
                  const canApplyFinal = isAcademic && (appeal.status === 'HEAD_APPROVED' || appeal.status === 'APPROVED');

                  const diff = appeal.scoreDiff != null ? Number(appeal.scoreDiff).toFixed(2) : null;

                  return (
                    <tr key={appeal.id}>
                      <td>
                        <strong>{appeal.studentCode}</strong>
                        <br />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{appeal.studentName}</span>
                      </td>
                      <td>
                        <strong>{appeal.sectionCode}</strong>
                        <br />
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {appeal.subjectName} ({appeal.subjectCode})
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-neutral">Cuối kỳ (CK)</span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.95rem' }}>
                        {appeal.currentScore != null ? Number(appeal.currentScore).toFixed(1) : '—'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.95rem', color: appeal.newScore != null ? 'var(--primary)' : 'inherit' }}>
                        {appeal.newScore != null ? Number(appeal.newScore).toFixed(1) : '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {diff != null ? (
                          <span
                            style={{
                              fontWeight: 700,
                              color: appeal.exceedsThreshold ? '#dc2626' : '#64748b',
                            }}
                          >
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        ) : (
                          '—'
                        )}
                        {appeal.hasMechanicalError && (
                          <div style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600 }}>
                            Có lỗi cơ học
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {appeal.assignedLecturerName ? (
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {appeal.assignedLecturerName}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Chưa phân công</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(appeal.status)}`}>
                          {statusLabel[appeal.status] || appeal.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => setDetailModalAppeal(appeal)}
                            title="Xem tiến trình máy trạng thái của đơn"
                          >
                            <Eye size={14} />
                            <span>Tiến trình</span>
                          </button>
                          {canAssign && (
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleOpenAssign(appeal)}
                              title="Phân công cán bộ chấm thi thứ 2 độc lập"
                            >
                              <UserCheck size={14} />
                              <span>Phân công CB 2</span>
                            </button>
                          )}

                          {canGrade && (
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleOpenGrading(appeal)}
                              title="Nhập kết quả chấm lại bài thi"
                            >
                              <ClipboardCheck size={14} />
                              <span>Chấm lại bài thi</span>
                            </button>
                          )}

                          {canHeadSign && (
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: '4px 10px', fontSize: '0.78rem', backgroundColor: '#7c3aed', borderColor: '#7c3aed', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleOpenHeadSign(appeal)}
                              title="Trưởng bộ môn niêm phong phê duyệt điện tử"
                            >
                              <FileSignature size={14} />
                              <span>Niêm phong (Trưởng BM)</span>
                            </button>
                          )}

                          {canApplyFinal && (
                            <button
                              type="button"
                              className="btn btn-success"
                              style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleOpenApply(appeal)}
                              title="Cập nhật điểm chính thức vào sổ điểm"
                            >
                              <CheckCircle2 size={14} />
                              <span>Cập nhật điểm</span>
                            </button>
                          )}
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

      {/* ========================================================================= */}
      {/* MODAL 1: Phân công Cán bộ chấm 2 (P. Đào tạo) */}
      {/* ========================================================================= */}
      {assignModalAppeal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAssignModalAppeal(null);
          }}
        >
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Phân Công Cán Bộ Chấm Thi Thứ Hai</h3>
                <small style={{ color: 'var(--text-secondary)' }}>
                  Học phần: {assignModalAppeal.subjectName} ({assignModalAppeal.sectionCode})
                </small>
              </div>
              <button className="btn-icon" onClick={() => setAssignModalAppeal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignGrader}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.88rem' }}>
                  <div style={{ marginBottom: '4px' }}>
                    Sinh viên: <strong>{assignModalAppeal.studentName}</strong> ({assignModalAppeal.studentCode})
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    Giảng viên phụ trách lớp: <strong>{assignModalAppeal.lecturerName || '—'}</strong>
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    Điểm cuối kỳ hiện tại: <strong style={{ color: '#dc2626' }}>{assignModalAppeal.currentScore ?? '—'}</strong>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
                    Lý do của SV: <em>"{assignModalAppeal.reason}"</em>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Chọn Cán bộ chấm thi thứ 2 (Chấm độc lập) *
                  </label>
                  <select
                    className="form-select"
                    required
                    value={selectedGraderId}
                    onChange={(e) => setSelectedGraderId(e.target.value)}
                  >
                    <option value="">-- Chọn giảng viên chấm độc lập --</option>
                    {candidateGraders.map((lec) => (
                      <option key={lec.id} value={lec.id}>
                        {lec.fullName} ({lec.lecturerCode}) {lec.department?.departmentName ? `— Khoa ${lec.department.departmentName}` : ''}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                    ⚠️ Theo quy chế, hệ thống tự động loại trừ giảng viên phụ trách lớp học phần để đảm bảo tính khách quan.
                  </small>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setAssignModalAppeal(null)} disabled={assigning}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary" disabled={assigning} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={16} />
                  <span>{assigning ? 'Đang phân công...' : 'Xác nhận phân công'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Cán bộ 2 Chấm lại bài thi (Examiner) */}
      {/* ========================================================================= */}
      {gradingModalAppeal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setGradingModalAppeal(null);
          }}
        >
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Chấm Phúc Khảo Độc Lập</h3>
                <small style={{ color: 'var(--text-secondary)' }}>
                  Sinh viên: {gradingModalAppeal.studentName} ({gradingModalAppeal.studentCode}) · Lớp: {gradingModalAppeal.sectionCode}
                </small>
              </div>
              <button className="btn-icon" onClick={() => setGradingModalAppeal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitGrading}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Điểm cuối kỳ cán bộ 1 đã chấm:</span>
                    <strong style={{ fontSize: '1rem', color: '#1e293b' }}>
                      {gradingModalAppeal.currentScore != null ? Number(gradingModalAppeal.currentScore).toFixed(1) : '—'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Điểm sinh viên kỳ vọng:</span>
                    <strong style={{ color: 'var(--primary)' }}>{gradingModalAppeal.desiredScore ?? 'Không nêu'}</strong>
                  </div>
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', color: 'var(--text-secondary)' }}>
                    <strong>Ý kiến sinh viên:</strong> {gradingModalAppeal.reason}
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Điểm thi cán bộ 2 chấm lại (0.00 - 10.00) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    required
                    placeholder="Nhập điểm chấm lại chính xác..."
                    className="form-control"
                    value={gradingForm.newScore}
                    onChange={(e) => setGradingForm({ ...gradingForm, newScore: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                  <input
                    type="checkbox"
                    id="hasMechanicalError"
                    checked={gradingForm.hasMechanicalError}
                    onChange={(e) => setGradingForm({ ...gradingForm, hasMechanicalError: e.target.checked })}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <label htmlFor="hasMechanicalError" style={{ fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}>
                    Có phát hiện sai sót cơ học (cộng nhầm điểm, sót câu hỏi, ghi nhầm điểm vào phách...)
                  </label>
                </div>

                {/* Live Rule Check Banner */}
                {liveDiff != null && (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      backgroundColor: liveThresholdExceeded ? 'rgba(124, 58, 237, 0.08)' : 'rgba(100, 116, 139, 0.08)',
                      border: `1px solid ${liveThresholdExceeded ? 'rgba(124, 58, 237, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`,
                      color: liveThresholdExceeded ? '#6d28d9' : '#475569',
                      lineHeight: 1.5,
                    }}
                  >
                    {liveThresholdExceeded ? (
                      <>
                        ✓ <strong>Độ lệch điểm: {liveDiff.toFixed(2)}</strong> (≥ 0.5 điểm hoặc có lỗi cơ học). Theo quy chế, kết quả này <strong>đủ điều kiện chuyển tiếp lên Trưởng bộ môn niêm phong phê duyệt điện tử</strong>.
                      </>
                    ) : (
                      <>
                        ℹ <strong>Độ lệch điểm: {liveDiff.toFixed(2)}</strong> (&lt; 0.5 điểm và không có lỗi cơ học). Theo quy chế, hệ thống sẽ <strong>giữ nguyên điểm ban đầu</strong> của sinh viên.
                      </>
                    )}
                  </div>
                )}

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Nhận xét & Giải trình của Cán bộ chấm 2
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Ghi rõ nhận xét bài thi, các câu được điều chỉnh điểm nếu có..."
                    className="form-control"
                    value={gradingForm.reviewNotes}
                    onChange={(e) => setGradingForm({ ...gradingForm, reviewNotes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setGradingModalAppeal(null)} disabled={submittingGrading}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingGrading} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={16} />
                  <span>{submittingGrading ? 'Đang lưu...' : 'Gửi kết quả chấm lại'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Trưởng bộ môn Niêm phong phê duyệt điện tử (Head of Department) */}
      {/* ========================================================================= */}
      {headSignModalAppeal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHeadSignModalAppeal(null);
          }}
        >
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Niêm Phong Phê Duyệt Điện Tử Cấp Bộ Môn</h3>
                <small style={{ color: 'var(--text-secondary)' }}>
                  Phê duyệt kết luận phúc khảo theo Quy chế đào tạo tín chỉ
                </small>
              </div>
              <button className="btn-icon" onClick={() => setHeadSignModalAppeal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleHeadSign}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Sinh viên:</span>
                    <strong>{headSignModalAppeal.studentName} ({headSignModalAppeal.studentCode})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Học phần:</span>
                    <strong>{headSignModalAppeal.subjectName} ({headSignModalAppeal.sectionCode})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Điểm ban đầu (CB 1):</span>
                    <strong>{headSignModalAppeal.currentScore}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Điểm chấm lại (CB 2):</span>
                    <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>{headSignModalAppeal.newScore}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Độ lệch điểm:</span>
                    <strong style={{ color: '#dc2626' }}>
                      {headSignModalAppeal.scoreDiff != null ? Number(headSignModalAppeal.scoreDiff).toFixed(2) : '—'}
                    </strong>
                  </div>
                  {headSignModalAppeal.reviewNotes && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', color: 'var(--text-secondary)' }}>
                      <strong>Ý kiến CB 2:</strong> {headSignModalAppeal.reviewNotes}
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Ý kiến phê chuẩn của Trưởng Bộ Môn
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Xác nhận tính chính xác của bài thi sau khi chấm lại, đồng ý điều chỉnh điểm..."
                    className="form-control"
                    value={headSignNotes}
                    onChange={(e) => setHeadSignNotes(e.target.value)}
                  />
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(124, 58, 237, 0.08)',
                    border: '1px solid rgba(124, 58, 237, 0.3)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    fontSize: '0.82rem',
                    color: '#6d28d9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <Shield size={20} style={{ flexShrink: 0 }} />
                  <span>
                    Thao tác này sẽ áp dụng chữ ký điện tử SHA-256 xác thực chức danh Trưởng bộ môn và chuyển hồ sơ về Phòng Đào tạo để cập nhật chính thức vào sổ điểm.
                  </span>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setHeadSignModalAppeal(null)} disabled={signing}>
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={signing}
                  style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <FileSignature size={16} />
                  <span>{signing ? 'Đang niêm phong...' : 'Niêm phong phê duyệt (SHA-256)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Phòng Đào tạo Cập nhật điểm chính thức vào hệ thống */}
      {/* ========================================================================= */}
      {applyModalAppeal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setApplyModalAppeal(null);
          }}
        >
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Cập Nhật Điểm Chính Thức Vào Sổ Điểm</h3>
                <small style={{ color: 'var(--text-secondary)' }}>
                  Bước cuối cùng: Phòng Đào tạo áp dụng mức điểm được duyệt vào hệ thống
                </small>
              </div>
              <button className="btn-icon" onClick={() => setApplyModalAppeal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApplyFinal}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}>
                <div style={{ background: '#ecfdf5', padding: '14px 18px', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Sinh viên:</span>
                    <strong>{applyModalAppeal.studentName} ({applyModalAppeal.studentCode})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Học phần:</span>
                    <strong>{applyModalAppeal.subjectName} ({applyModalAppeal.sectionCode})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Điểm cũ:</span>
                    <strong style={{ color: '#64748b' }}>{applyModalAppeal.currentScore}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Điểm mới chính thức:</span>
                    <strong style={{ color: '#059669', fontSize: '1.1rem' }}>{applyModalAppeal.newScore}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Mã chữ ký điện tử Trưởng BM:</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#047857' }}>
                      {applyModalAppeal.headSignatureHash ? `${applyModalAppeal.headSignatureHash.substring(0, 16)}...` : '✓ Đã xác thực'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Căn cứ quyết định điều chỉnh điểm của Phòng Đào tạo *
                  </label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Ghi rõ căn cứ (ví dụ: Biên bản phúc khảo số ... có chữ ký phê duyệt của Trưởng bộ môn)"
                    className="form-control"
                    value={applyReason}
                    onChange={(e) => setApplyReason(e.target.value)}
                  />
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  ℹ Hệ thống sẽ tự động cập nhật bảng điểm của sinh viên, ghi nhận vết kiểm toán <strong>GradeAuditLog</strong> và gửi thông báo kết quả phúc khảo tới sinh viên.
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setApplyModalAppeal(null)} disabled={applying}>
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={applying}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckCircle2 size={16} />
                  <span>{applying ? 'Đang cập nhật...' : 'Cập nhật điểm chính thức'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: Tiến trình Máy trạng thái Đơn phúc khảo (Workflow Stepper) */}
      {/* ========================================================================= */}
      {detailModalAppeal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailModalAppeal(null);
          }}
        >
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={20} color="var(--primary)" />
                  <span>Tiến Trình Máy Trạng Thái Đơn Phúc Khảo #{detailModalAppeal.id}</span>
                </h3>
                <small style={{ color: 'var(--text-secondary)' }}>
                  Học phần: <strong>{detailModalAppeal.subjectName} ({detailModalAppeal.sectionCode})</strong> • SV: <strong>{detailModalAppeal.studentName} ({detailModalAppeal.studentCode})</strong>
                </small>
              </div>
              <button className="btn-icon" onClick={() => setDetailModalAppeal(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Stepper visual */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', textAlign: 'center' }}>
                {[
                  { step: 1, title: '1. Nộp đơn', desc: 'Sinh viên nộp CK', done: true, current: detailModalAppeal.status === 'PENDING' || detailModalAppeal.status === 'PENDING_ASSIGNMENT' },
                  { step: 2, title: '2. Phân công', desc: 'Cán bộ chấm 2', done: Boolean(detailModalAppeal.assignedLecturerName), current: detailModalAppeal.status === 'ASSIGNED' },
                  { step: 3, title: '3. Chấm lại', desc: 'Đánh giá ngưỡng', done: detailModalAppeal.newScore != null || detailModalAppeal.status === 'REJECTED_NO_CHANGE', current: detailModalAppeal.status === 'PENDING_HEAD_APPROVAL' },
                  { step: 4, title: '4. Niêm phong BM', desc: 'Mã băm SHA-256', done: Boolean(detailModalAppeal.headSignatureHash || detailModalAppeal.headApprovedAt), current: detailModalAppeal.status === 'HEAD_APPROVED' },
                  { step: 5, title: '5. Hoàn tất', desc: 'PĐT chốt & Recalc GPA', done: detailModalAppeal.status === 'APPROVED_AND_APPLIED' || detailModalAppeal.status === 'FINAL_APPLIED', current: false },
                ].map((item) => {
                  let bg = '#f1f5f9';
                  let border = '#cbd5e1';
                  let textColor = '#64748b';
                  if (item.done) {
                    bg = '#ecfdf5';
                    border = '#10b981';
                    textColor = '#059669';
                  }
                  if (item.current) {
                    bg = '#eff6ff';
                    border = '#3b82f6';
                    textColor = '#1d4ed8';
                  }
                  return (
                    <div
                      key={item.step}
                      style={{
                        padding: '10px 6px',
                        borderRadius: '8px',
                        background: bg,
                        border: '1.5px solid ' + border,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: item.done ? '#10b981' : item.current ? '#3b82f6' : '#94a3b8',
                          color: '#fff',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                        }}
                      >
                        {item.done ? '✓' : item.step}
                      </div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: textColor }}>{item.title}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.desc}</div>
                    </div>
                  );
                })}
              </div>

              {/* Status Box */}
              <div style={{ padding: '14px 18px', borderRadius: '8px', background: 'var(--bg-subtle, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Trạng thái máy quy trình:</span>
                  <span className={'badge ' + getStatusBadgeClass(detailModalAppeal.status)}>
                    {statusLabel[detailModalAppeal.status] || detailModalAppeal.status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Điểm thi kết thúc học phần cũ:</span>
                  <strong>{detailModalAppeal.currentScore != null ? Number(detailModalAppeal.currentScore).toFixed(1) : '—'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Điểm sau khi Cán bộ 2 chấm:</span>
                  <strong style={{ color: detailModalAppeal.newScore != null ? '#059669' : 'inherit' }}>
                    {detailModalAppeal.newScore != null ? Number(detailModalAppeal.newScore).toFixed(1) : 'Chưa có'}
                  </strong>
                </div>
                {detailModalAppeal.scoreDiff != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Độ chênh lệch điểm (Ngưỡng 0.5):</span>
                    <strong style={{ color: detailModalAppeal.exceedsThreshold ? '#dc2626' : '#64748b' }}>
                      {detailModalAppeal.scoreDiff} điểm {detailModalAppeal.hasMechanicalError ? '(Có lỗi cơ học)' : ''}
                    </strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Cán bộ chấm độc lập (CB2):</span>
                  <span>{detailModalAppeal.assignedLecturerName || 'Chưa phân công'}</span>
                </div>
                {detailModalAppeal.headSignatureHash && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Mã băm niêm phong Trưởng BM:</span>
                    <code style={{ fontSize: '0.75rem', color: '#7c3aed', background: '#f5f3ff', padding: '2px 6px', borderRadius: '4px' }}>
                      {detailModalAppeal.headSignatureHash}
                    </code>
                  </div>
                )}
                {detailModalAppeal.finalAdjustmentReason && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
                    <span style={{ fontWeight: 600 }}>Căn cứ phê duyệt PĐT: </span>
                    <span>{detailModalAppeal.finalAdjustmentReason}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-primary" onClick={() => setDetailModalAppeal(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
