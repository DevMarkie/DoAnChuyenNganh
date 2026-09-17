import { useState, useEffect } from 'react';
import {
  KeyRound, Search, CheckCircle2, XCircle, Clock,
  RefreshCw, Copy, Check, Send, AlertTriangle, ShieldCheck, User, Mail, Phone
} from 'lucide-react';
import { toast } from 'react-toastify';
import { passwordResetService } from '../../services/dataService';

export default function PasswordResetsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchActionType, setBatchActionType] = useState(null); // 'APPROVE' or 'REJECT'

  // Approve Modal State
  const [approvingItem, setApprovingItem] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveResult, setApproveResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Reject Modal State
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await passwordResetService.getAll(statusFilter);
      setRequests(res.data.data || []);
    } catch {
      toast.error('Lỗi khi tải danh sách yêu cầu cấp lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApprove = (item) => {
    setApprovingItem(item);
    // Generate an 8-character random password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let pass = 'SMS';
    for (let i = 0; i < 5; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
    setAdminNotes('Ban Quản trị đã xác minh và cấp lại mật khẩu.');
    setApproveResult(null);
    setCopied(false);
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!approvingItem) return;

    try {
      setApproveLoading(true);
      const res = await passwordResetService.approve(approvingItem.id, {
        newPassword: newPassword.trim(),
        adminNotes: adminNotes.trim(),
      });
      const data = res.data.data;
      setApproveResult(data);
      toast.success('Đã cấp lại mật khẩu thành công!');
      loadRequests();
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi cấp lại mật khẩu';
      toast.error(msg);
    } finally {
      setApproveLoading(false);
    }
  };

  const handleOpenReject = (item) => {
    setRejectingItem(item);
    setRejectReason('Thông tin xác minh không trùng khớp với hồ sơ lưu trữ.');
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingItem || !rejectReason.trim()) {
      toast.warning('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setRejectLoading(true);
      await passwordResetService.reject(rejectingItem.id, {
        rejectReason: rejectReason.trim(),
      });
      toast.info('Đã từ chối yêu cầu cấp lại mật khẩu');
      setRejectingItem(null);
      loadRequests();
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi từ chối yêu cầu';
      toast.error(msg);
    } finally {
      setRejectLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const pendingIds = filteredRequests.filter(r => r.status === 'PENDING').map(r => r.id);
      setSelectedIds(pendingIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn duyệt và cấp mật khẩu mới cho ${selectedIds.length} yêu cầu này? Mật khẩu sẽ tự động được gửi qua email.`)) return;

    try {
      setLoading(true);
      await passwordResetService.batchApprove(selectedIds);
      toast.success(`Đã cấp lại mật khẩu cho ${selectedIds.length} yêu cầu thành công!`);
      setSelectedIds([]);
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi khi duyệt hàng loạt');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchReject = async () => {
    if (selectedIds.length === 0) return;
    const reason = window.prompt(`Nhập lý do từ chối cho ${selectedIds.length} yêu cầu này:`, 'Thông tin xác minh không trùng khớp với hồ sơ lưu trữ.');
    if (reason === null) return;

    try {
      setLoading(true);
      await passwordResetService.batchReject({ requestIds: selectedIds, reason });
      toast.success(`Đã từ chối ${selectedIds.length} yêu cầu thành công!`);
      setSelectedIds([]);
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi khi từ chối hàng loạt');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Đã sao chép mật khẩu vào Clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredRequests = requests.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.username?.toLowerCase().includes(q) ||
      r.fullName?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.phone?.toLowerCase().includes(q)
    );
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <KeyRound size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Yêu Cầu Cấp Lại Mật Khẩu
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Xét duyệt và cấp lại mật khẩu tự động gửi về Gmail của Sinh viên & Giảng viên
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={loadRequests}
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
        >
          <RefreshCw size={15} />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        backgroundColor: 'var(--bg-surface)',
        padding: '16px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        marginBottom: '20px'
      }}>
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { key: 'PENDING', label: 'Chờ xử lý', badge: pendingCount },
            { key: 'APPROVED', label: 'Đã cấp lại' },
            { key: 'REJECTED', label: 'Đã từ chối' },
            { key: 'ALL', label: 'Tất cả' },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-subtle)',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : 'var(--danger)',
                    color: '#ffffff',
                    padding: '2px 6px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 240px', maxWidth: '360px' }}>
          <Search size={16} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã số, họ tên, email..."
            className="form-control"
            style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {statusFilter === 'PENDING' && selectedIds.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: 'var(--primary-light)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '20px',
          border: '1px solid var(--primary-border)'
        }}>
          <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
            Đã chọn {selectedIds.length} yêu cầu
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleBatchApprove} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
              <CheckCircle2 size={16} /> Duyệt hàng loạt
            </button>
            <button onClick={handleBatchReject} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
              <XCircle size={16} /> Từ chối hàng loạt
            </button>
          </div>
        </div>
      )}

      {/* Requests Table */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-xs)'
      }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Đang tải dữ liệu yêu cầu...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <KeyRound size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>Không có yêu cầu cấp lại mật khẩu nào</div>
            <div style={{ fontSize: '0.85rem' }}>
              {statusFilter === 'PENDING' ? 'Hiện tại không có yêu cầu nào đang chờ xử lý' : 'Không tìm thấy bản ghi phù hợp'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)' }}>
                  {statusFilter === 'PENDING' && (
                    <th style={{ padding: '12px 16px', width: '40px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        onChange={handleSelectAll} 
                        checked={selectedIds.length > 0 && selectedIds.length === filteredRequests.filter(r => r.status === 'PENDING').length} 
                      />
                    </th>
                  )}
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Người yêu cầu</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Phân hệ</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Gmail nhận mật khẩu</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>SĐT liên hệ</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Lý do gửi</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Thời gian</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>Trạng thái</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => {
                  const isPending = req.status === 'PENDING';
                  const isApproved = req.status === 'APPROVED';
                  const isStudent = req.role === 'STUDENT';

                  return (
                    <tr
                      key={req.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: isPending ? 'rgba(254, 243, 199, 0.15)' : 'transparent'
                      }}
                    >
                      {statusFilter === 'PENDING' && (
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {isPending && (
                            <input 
                              type="checkbox" 
                              checked={selectedIds.includes(req.id)}
                              onChange={() => handleSelectItem(req.id)}
                            />
                          )}
                        </td>
                      )}
                      {/* Requester Info */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{req.fullName}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          Mã số: {req.username}
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: isStudent ? 'var(--primary-light)' : '#f0fdfa',
                          color: isStudent ? 'var(--primary)' : '#0f766e',
                          border: `1px solid ${isStudent ? 'var(--primary-border)' : '#99f6e4'}`
                        }}>
                          {isStudent ? 'Sinh viên' : 'Giảng viên'}
                        </span>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                          <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                          <strong>{req.email}</strong>
                        </div>
                      </td>

                      {/* Phone */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                        {req.phone ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={13} />
                            <span>{req.phone}</span>
                          </div>
                        ) : '—'}
                      </td>

                      {/* Reason */}
                      <td style={{ padding: '14px 16px', maxWidth: '240px', color: 'var(--text-muted)' }}>
                        <div style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }} title={req.reason}>
                          {req.reason || 'Quên mật khẩu'}
                        </div>
                        {req.adminNotes && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', marginTop: '4px' }}>
                            💬 Admin: {req.adminNotes}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {req.createdAt ? new Date(req.createdAt).toLocaleString('vi-VN') : '—'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {isPending && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: 'var(--warning-bg)',
                            color: 'var(--warning-text)',
                            border: '1px solid var(--warning-border)'
                          }}>
                            <Clock size={12} />
                            <span>Chờ xử lý</span>
                          </span>
                        )}
                        {isApproved && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: 'var(--success-bg)',
                            color: 'var(--success-text)',
                            border: '1px solid var(--success-border)'
                          }}>
                            <CheckCircle2 size={12} />
                            <span>Đã cấp lại</span>
                          </span>
                        )}
                        {!isPending && !isApproved && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: 'var(--danger-bg)',
                            color: 'var(--danger-text)',
                            border: '1px solid var(--danger-border)'
                          }}>
                            <XCircle size={12} />
                            <span>Đã từ chối</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {isPending ? (
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenApprove(req)}
                              className="btn btn-primary"
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.8rem',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <KeyRound size={14} />
                              <span>Cấp lại MK</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenReject(req)}
                              className="btn btn-outline"
                              style={{
                                padding: '6px 10px',
                                fontSize: '0.8rem',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--danger)',
                                borderColor: 'var(--danger-border)'
                              }}
                            >
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {req.processedAt ? `Xử lý lúc ${new Date(req.processedAt).toLocaleDateString('vi-VN')}` : 'Hoàn tất'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* APPROVE MODAL */}
      {approvingItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border-color)',
              overflow: 'hidden'
            }}
          >
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    Cấp Lại Mật Khẩu
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Người nhận: {approvingItem.fullName} ({approvingItem.username})
                  </div>
                </div>
              </div>
              {!approveLoading && (
                <button
                  type="button"
                  onClick={() => setApprovingItem(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ padding: '24px' }}>
              {approveResult ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--success-bg)',
                    color: 'var(--success)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px'
                  }}>
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                    Cấp Lại Mật Khẩu Thành Công!
                  </h4>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
                    {approveResult.message}
                  </p>

                  {/* Password box */}
                  <div style={{
                    backgroundColor: 'var(--bg-subtle)',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'left' }}>
                        Mật khẩu mới vừa cấp:
                      </div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px', fontFamily: 'monospace' }}>
                        {approveResult.generatedPassword}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyPassword(approveResult.generatedPassword)}
                      className="btn btn-outline"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
                    >
                      {copied ? <Check size={14} color="green" /> : <Copy size={14} />}
                      <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setApprovingItem(null)}
                    className="btn btn-primary"
                    style={{ padding: '10px 24px', borderRadius: 'var(--radius-md)' }}
                  >
                    Hoàn tất & Đóng
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApproveSubmit}>
                  {/* Recipient Details Box */}
                  <div style={{
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    marginBottom: '18px',
                    fontSize: '0.82rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Mã tài khoản:</span>
                      <strong style={{ fontFamily: 'monospace' }}>{approvingItem.username}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Họ và tên:</span>
                      <strong>{approvingItem.fullName}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Gmail nhận thông báo:</span>
                      <strong style={{ color: 'var(--primary)' }}>{approvingItem.email}</strong>
                    </div>
                  </div>

                  {/* New Password field */}
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 0 }}>
                        Mật khẩu mới cấp lại *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
                          let pass = 'SMS';
                          for (let i = 0; i < 5; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
                          setNewPassword(pass);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        ⚡ Tự động sinh ngẫu nhiên
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="form-control"
                      style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '1px' }}
                    />
                  </div>

                  {/* Admin notes */}
                  <div className="form-group" style={{ marginBottom: '22px' }}>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      Ghi chú của Quản trị viên
                    </label>
                    <textarea
                      rows="2"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="form-control"
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      disabled={approveLoading}
                      onClick={() => setApprovingItem(null)}
                      className="btn btn-outline"
                      style={{ borderRadius: 'var(--radius-md)' }}
                    >
                      Huỷ bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={approveLoading}
                      className="btn btn-primary"
                      style={{
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {approveLoading ? (
                        <span>Đang cập nhật CSDL & Gửi Gmail...</span>
                      ) : (
                        <>
                          <Send size={15} />
                          <span>Xác nhận đổi & Gửi Gmail</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectingItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border-color)',
              overflow: 'hidden'
            }}
          >
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--danger-bg)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertTriangle size={22} style={{ color: 'var(--danger)' }} />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--danger-text)' }}>
                  Từ Chối Cấp Lại Mật Khẩu
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--danger-text)', opacity: 0.85 }}>
                  Tài khoản: {rejectingItem.fullName} ({rejectingItem.username})
                </div>
              </div>
            </div>

            <form onSubmit={handleRejectSubmit} style={{ padding: '24px' }}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Lý do từ chối * (Sẽ được thông báo qua email)
                </label>
                <textarea
                  rows="3"
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do từ chối yêu cầu..."
                  className="form-control"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  disabled={rejectLoading}
                  onClick={() => setRejectingItem(null)}
                  className="btn btn-outline"
                  style={{ borderRadius: 'var(--radius-md)' }}
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  disabled={rejectLoading}
                  className="btn btn-primary"
                  style={{
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--danger)',
                    borderColor: 'var(--danger)'
                  }}
                >
                  {rejectLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
