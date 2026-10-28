import { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Filter,
  Search,
  ExternalLink,
  ShieldCheck,
  Building,
  RotateCcw,
  AlertTriangle,
  Loader2,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { gradeAmendmentService } from '../../services/dataService';
import useAuthStore from '../../store/authStore';

const statusBadge = {
  PENDING_DEPT: { label: 'Chờ Bộ môn thẩm định', cls: 'badge-warning', icon: Clock },
  PENDING_ACADEMIC: { label: 'Chờ Đào tạo duyệt cuối', cls: 'badge-info', icon: Building },
  APPROVED: { label: 'Đã duyệt & Cập nhật điểm', cls: 'badge-success', icon: CheckCircle2 },
  REJECTED: { label: 'Đã từ chối', cls: 'badge-danger', icon: XCircle },
};

const compLabels = {
  CC1: 'Chuyên cần 1 (5%)',
  CC2: 'Chuyên cần 2 / BT (5%)',
  MIDTERM: 'Giữa kỳ (30%)',
  FINAL: 'Cuối kỳ (60%)',
};

export default function GradeAmendmentsPage() {
  const { user } = useAuthStore();
  const role = user?.role;
  const isLecturer = role === 'LECTURER';
  const isAcademic = role === 'ACADEMIC_AFFAIRS' || role === 'ACADEMIC_STAFF' || role === 'ADMIN';

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Preview Modal
  const [previewEvidenceUrl, setPreviewEvidenceUrl] = useState(null);

  // Review / Approval Modal
  const [actionTicket, setActionTicket] = useState(null);
  const [actionType, setActionType] = useState(''); // 'DEPT_APPROVE', 'DEPT_REJECT', 'ACADEMIC_APPROVE', 'ACADEMIC_REJECT'
  const [actionNote, setActionNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await gradeAmendmentService.getAll();
      const list = res.data?.data || res.data || [];
      setTickets(list);
    } catch (err) {
      console.error('Lỗi tải danh sách yêu cầu sửa điểm:', err);
      toast.error('Không thể tải danh sách đơn sửa điểm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Status filter
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchStudent =
          t.studentCode?.toLowerCase().includes(q) || t.studentName?.toLowerCase().includes(q);
        const matchSection =
          t.sectionCode?.toLowerCase().includes(q) || t.subjectName?.toLowerCase().includes(q);
        const matchReason = t.reason?.toLowerCase().includes(q);
        return matchStudent || matchSection || matchReason;
      }
      return true;
    });
  }, [tickets, statusFilter, searchTerm]);

  const handleOpenAction = (ticket, type) => {
    setActionTicket(ticket);
    setActionType(type);
    setActionNote('');
  };

  const handleCloseAction = () => {
    setActionTicket(null);
    setActionType('');
    setActionNote('');
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    if (!actionTicket) return;

    // Validate reason if rejecting
    if (
      (actionType === 'DEPT_REJECT' || actionType === 'ACADEMIC_REJECT') &&
      !actionNote.trim()
    ) {
      toast.error('Vui lòng cung cấp lý do từ chối/bác bỏ');
      return;
    }

    setSubmittingAction(true);
    try {
      if (actionType === 'DEPT_APPROVE') {
        await gradeAmendmentService.deptReview(actionTicket.id, {
          approved: true,
          notes: actionNote.trim() || 'Đồng thuận thẩm định chuyên môn',
        });
        toast.success('Đã đồng thuận thẩm định! Đơn chuyển tới Phòng Đào tạo duyệt cuối.');
      } else if (actionType === 'DEPT_REJECT') {
        await gradeAmendmentService.deptReview(actionTicket.id, {
          approved: false,
          rejectionReason: actionNote.trim(),
        });
        toast.info('Đã từ chối đơn sửa điểm cấp Bộ môn/Khoa');
      } else if (actionType === 'ACADEMIC_APPROVE') {
        await gradeAmendmentService.academicApproval(actionTicket.id, {
          approved: true,
        });
        toast.success('Phê duyệt thành công! Điểm số và GPA của sinh viên đã được cập nhật.');
      } else if (actionType === 'ACADEMIC_REJECT') {
        await gradeAmendmentService.academicApproval(actionTicket.id, {
          approved: false,
          rejectionReason: actionNote.trim(),
        });
        toast.info('Đã bác bỏ yêu cầu sửa điểm');
      }

      handleCloseAction();
      fetchTickets();
    } catch (err) {
      console.error('Lỗi xử lý đơn sửa điểm:', err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xử lý đơn');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={28} color="#3b82f6" />
            Quản Lý Sửa Điểm Sau Khóa Sổ & Nhật Ký Vết
          </h1>
          <p>
            Quy trình 2 cấp thẩm định và phê duyệt điều chỉnh điểm học phần sau khi đã công bố chính thức toàn trường.
          </p>
        </div>
        <button
          onClick={fetchTickets}
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RotateCcw size={16} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Filter and Metrics Card */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', flex: 1 }}>
          {/* Search */}
          <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              placeholder="Tìm theo Mã SV, Tên SV, Mã lớp, Môn học, Lý do..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '38px', borderRadius: '8px', width: '100%' }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={18} color="#64748b" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ padding: '8px 12px', borderRadius: '8px' }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING_DEPT">Chờ Bộ môn thẩm định</option>
              <option value="PENDING_ACADEMIC">Chờ Đào tạo duyệt cuối</option>
              <option value="APPROVED">Đã duyệt & Cập nhật</option>
              <option value="REJECTED">Đã từ chối</option>
            </select>
          </div>
        </div>

        {/* Quick count pills */}
        <div style={{ display: 'flex', gap: '8px', fontSize: '0.85rem' }}>
          <span
            className="badge badge-warning"
            style={{ padding: '6px 12px', cursor: 'pointer' }}
            onClick={() => setStatusFilter('PENDING_DEPT')}
          >
            Chờ Khoa: {tickets.filter((t) => t.status === 'PENDING_DEPT').length}
          </span>
          <span
            className="badge badge-info"
            style={{ padding: '6px 12px', cursor: 'pointer' }}
            onClick={() => setStatusFilter('PENDING_ACADEMIC')}
          >
            Chờ PĐT: {tickets.filter((t) => t.status === 'PENDING_ACADEMIC').length}
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>#ID</th>
                <th>Sinh viên</th>
                <th>Lớp học phần & Môn</th>
                <th>Cột điểm & Điều chỉnh</th>
                <th>Lý do & Minh chứng</th>
                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                <th>Lịch sử duyệt vết</th>
                <th style={{ textAlign: 'center', width: '140px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                      <Loader2 size={24} className="animate-spin" color="#3b82f6" />
                      <span>Đang tải danh sách đơn sửa điểm...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                    <FileText size={40} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>
                      Không tìm thấy đơn yêu cầu sửa điểm nào
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => {
                  const sInfo = statusBadge[t.status] || {
                    label: t.status,
                    cls: 'badge-neutral',
                    icon: Clock,
                  };
                  const StatusIcon = sInfo.icon;
                  const diff = Number(t.newScore) - Number(t.oldScore);
                  const diffColor = diff > 0 ? '#059669' : diff < 0 ? '#dc2626' : '#64748b';

                  return (
                    <tr key={t.id}>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748b' }}>
                        #{t.id}
                      </td>

                      {/* Sinh viên */}
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{t.studentName}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          Mã SV: <strong>{t.studentCode}</strong>
                          {t.className ? ` · ${t.className}` : ''}
                        </div>
                      </td>

                      {/* Lớp & Môn */}
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                          {t.subjectName}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          Lớp: <code>{t.sectionCode}</code>
                          {t.departmentName ? ` · ${t.departmentName}` : ''}
                        </div>
                      </td>

                      {/* Cột điểm & Điều chỉnh */}
                      <td>
                        <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          {compLabels[t.componentType] || t.componentType}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                          <span style={{ color: '#64748b', textDecoration: 'line-through' }}>
                            {Number(t.oldScore).toFixed(1)}
                          </span>
                          <ArrowRight size={14} color="#94a3b8" />
                          <span style={{ fontWeight: 700, color: '#047857' }}>
                            {Number(t.newScore).toFixed(1)}
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: diffColor,
                              backgroundColor: `${diffColor}15`,
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                          </span>
                        </div>
                      </td>

                      {/* Lý do & Minh chứng */}
                      <td>
                        <div
                          style={{
                            fontSize: '0.85rem',
                            color: '#334155',
                            maxWidth: '260px',
                            whiteSpace: 'pre-wrap',
                            marginBottom: '6px',
                          }}
                        >
                          {t.reason}
                        </div>
                        {t.evidenceUrl && (
                          <button
                            onClick={() => setPreviewEvidenceUrl(t.evidenceUrl)}
                            className="btn btn-sm btn-secondary"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              padding: '3px 8px',
                            }}
                          >
                            <Eye size={12} />
                            <span>Xem minh chứng</span>
                          </button>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`badge ${sInfo.cls}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            fontSize: '0.78rem',
                          }}
                        >
                          <StatusIcon size={14} />
                          <span>{sInfo.label}</span>
                        </span>
                      </td>

                      {/* Lịch sử vết */}
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        <div>
                          <strong>GV tạo:</strong> {t.createdByName}
                        </div>
                        {t.deptReviewerName && (
                          <div style={{ marginTop: '2px' }}>
                            <strong>Khoa duyệt:</strong> {t.deptReviewerName}
                          </div>
                        )}
                        {t.approvedByName && (
                          <div style={{ marginTop: '2px' }}>
                            <strong>PĐT duyệt:</strong> {t.approvedByName}
                          </div>
                        )}
                        {t.rejectionReason && (
                          <div style={{ color: '#dc2626', marginTop: '2px', fontStyle: 'italic' }}>
                            Lý do từ chối: {t.rejectionReason}
                          </div>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td style={{ textAlign: 'center' }}>
                        {t.status === 'PENDING_DEPT' && (isLecturer || isAcademic) && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <button
                              onClick={() => handleOpenAction(t, 'DEPT_APPROVE')}
                              className="btn btn-sm btn-primary"
                              style={{ width: '100%', fontSize: '0.78rem', padding: '5px 8px' }}
                            >
                              Khoa đồng thuận
                            </button>
                            <button
                              onClick={() => handleOpenAction(t, 'DEPT_REJECT')}
                              className="btn btn-sm btn-outline-danger"
                              style={{ width: '100%', fontSize: '0.78rem', padding: '5px 8px' }}
                            >
                              Từ chối
                            </button>
                          </div>
                        )}

                        {t.status === 'PENDING_ACADEMIC' && isAcademic && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <button
                              onClick={() => handleOpenAction(t, 'ACADEMIC_APPROVE')}
                              className="btn btn-sm btn-success"
                              style={{ width: '100%', fontSize: '0.78rem', padding: '5px 8px' }}
                            >
                              PĐT Phê duyệt
                            </button>
                            <button
                              onClick={() => handleOpenAction(t, 'ACADEMIC_REJECT')}
                              className="btn btn-sm btn-outline-danger"
                              style={{ width: '100%', fontSize: '0.78rem', padding: '5px 8px' }}
                            >
                              Bác bỏ
                            </button>
                          </div>
                        )}

                        {(t.status === 'APPROVED' || t.status === 'REJECTED') && (
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Đã hoàn tất</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Xem trước minh chứng (Preview Evidence) */}
      {previewEvidenceUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewEvidenceUrl(null);
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Tệp Minh Chứng Sửa Điểm</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <a
                  href={previewEvidenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <ExternalLink size={14} />
                  <span>Mở tab mới</span>
                </a>
                <button
                  onClick={() => setPreviewEvidenceUrl(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', textAlign: 'center', minHeight: '300px' }}>
              {previewEvidenceUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewEvidenceUrl}
                  title="PDF Evidence"
                  style={{ width: '100%', height: '65vh', border: 'none', borderRadius: '8px' }}
                />
              ) : (
                <img
                  src={previewEvidenceUrl}
                  alt="Minh chứng bài thi"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = `<div style="padding: 40px; color: #ef4444;">Không thể tải trước hình ảnh. <a href="${previewEvidenceUrl}" target="_blank">Nhấp vào đây để xem trực tiếp</a></div>`;
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Thẩm định / Phê duyệt / Bác bỏ */}
      {actionTicket && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseAction();
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                background:
                  actionType.includes('APPROVE')
                    ? 'linear-gradient(to right, #ecfdf5, #f0fdf4)'
                    : 'linear-gradient(to right, #fef2f2, #fff1f2)',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: actionType.includes('APPROVE') ? '#065f46' : '#991b1b',
                }}
              >
                {actionType === 'DEPT_APPROVE' && 'Khoa Đồng Thuận Thẩm Định Chuyên Môn'}
                {actionType === 'DEPT_REJECT' && 'Từ Chối Yêu Cầu Sửa Điểm Cấp Bộ Môn/Khoa'}
                {actionType === 'ACADEMIC_APPROVE' && 'Phòng Đào Tạo Duyệt Quyết Định Cuối'}
                {actionType === 'ACADEMIC_REJECT' && 'Bác Bỏ Yêu Cầu Sửa Điểm Cấp Đào Tạo'}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Đơn #{actionTicket.id} · SV: {actionTicket.studentCode} ({actionTicket.studentName})
              </p>
            </div>

            <form onSubmit={handleConfirmAction} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Thông tin tóm tắt */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                  }}
                >
                  <p style={{ margin: '0 0 6px 0' }}>
                    <strong>Môn học:</strong> {actionTicket.subjectName} ({actionTicket.sectionCode})
                  </p>
                  <p style={{ margin: '0 0 6px 0' }}>
                    <strong>Cột điểm:</strong> {compLabels[actionTicket.componentType] || actionTicket.componentType}:{' '}
                    <span style={{ textDecoration: 'line-through', color: '#64748b' }}>
                      {actionTicket.oldScore}
                    </span>{' '}
                    ➔ <strong style={{ color: '#059669' }}>{actionTicket.newScore}</strong>
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Lý do của GV:</strong> {actionTicket.reason}
                  </p>
                </div>

                {actionType === 'ACADEMIC_APPROVE' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      color: '#047857',
                      fontSize: '0.85rem',
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <span>
                      Hệ thống sẽ thực hiện <strong>Database Transaction</strong>: Cập nhật trực tiếp vào sổ điểm,
                      tự động tính lại GPA/CPA và gửi thông báo cho sinh viên.
                    </span>
                  </div>
                )}

                {/* Ghi chú hoặc Lý do từ chối */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '6px',
                    }}
                  >
                    {actionType.includes('REJECT') ? (
                      <span>
                        Lý do từ chối <span style={{ color: '#ef4444' }}>*</span>
                      </span>
                    ) : (
                      'Ý kiến thẩm định / Ghi chú lưu vết'
                    )}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={
                      actionType.includes('REJECT')
                        ? 'Nhập lý do từ chối yêu cầu điều chỉnh điểm...'
                        : 'Ý kiến thẩm định chuyên môn (tùy chọn)...'
                    }
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    className="form-control"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px' }}
                    required={actionType.includes('REJECT')}
                  />
                </div>
              </div>

              <div
                style={{
                  marginTop: '24px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                }}
              >
                <button
                  type="button"
                  onClick={handleCloseAction}
                  disabled={submittingAction}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', borderRadius: '8px' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className={`btn ${actionType.includes('APPROVE') ? 'btn-success' : 'btn-danger'}`}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 600,
                  }}
                >
                  {submittingAction && <Loader2 size={16} className="animate-spin" />}
                  <span>{actionType.includes('APPROVE') ? 'Xác nhận Duyệt' : 'Xác nhận Từ chối'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
