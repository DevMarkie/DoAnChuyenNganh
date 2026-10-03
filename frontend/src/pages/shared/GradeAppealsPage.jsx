import { useEffect, useState } from 'react';
import { CheckCircle2, X, ClipboardCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { gradeAppealService } from '../../services/dataService';

const statusLabel = { PENDING: 'Chờ xử lý', IN_REVIEW: 'Đang xem xét', APPROVED: 'Đã chấp thuận', REJECTED: 'Đã từ chối' };

export default function GradeAppealsPage() {
  const [appeals, setAppeals] = useState([]);
  const [status, setStatus] = useState('PENDING');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ status: 'APPROVED', newScore: '', reviewNotes: '' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await gradeAppealService.getAll(status ? { status } : {});
      setAppeals(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tải đơn phúc khảo');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [status]);

  const openReview = (appeal) => {
    setSelected(appeal);
    setForm({ status: 'APPROVED', newScore: appeal.desiredScore ?? '', reviewNotes: '' });
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!selected) return;
    if (form.status === 'REJECTED' && !form.reviewNotes.trim()) {
      toast.warning('Vui lòng nhập lý do từ chối đơn phúc khảo');
      return;
    }
    if (form.status === 'APPROVED' && form.newScore === '') {
      toast.warning('Vui lòng nhập điểm mới khi chấp thuận đơn phúc khảo');
      return;
    }
    try {
      await gradeAppealService.review(selected.id, { ...form, newScore: form.newScore === '' ? null : Number(form.newScore) });
      toast.success('Đã xử lý đơn phúc khảo');
      setSelected(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Không thể xử lý đơn'); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Đơn phúc khảo điểm</h1><p>Tiếp nhận, xem xét và cập nhật kết quả phúc khảo.</p></div>
        <div className="page-header-actions"><select className="form-select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(statusLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
      </div>
      <div className="card">
        <div className="table-container"><table className="table"><thead><tr><th>Sinh viên</th><th>Học phần</th><th>Cột điểm</th><th>Điểm cũ</th><th>Lý do</th><th>Trạng thái</th><th /></tr></thead>
          <tbody>{loading ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Đang tải...</td></tr> : appeals.length === 0 ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Không có đơn phúc khảo.</td></tr> : appeals.map((appeal) => <tr key={appeal.id}>
            <td><strong>{appeal.studentCode}</strong><br />{appeal.studentName}</td>
            <td><strong>{appeal.subjectCode}</strong><br />{appeal.subjectName}</td>
            <td>{appeal.scoreComponent}</td><td>{appeal.currentScore ?? '—'}</td>
            <td style={{ maxWidth: '280px' }}>{appeal.reason}</td>
            <td><span className={`badge ${appeal.status === 'REJECTED' ? 'badge-danger' : appeal.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}`}>{statusLabel[appeal.status]}</span></td>
            <td>{['PENDING', 'IN_REVIEW'].includes(appeal.status) && <button className="btn btn-primary" style={{ padding: '6px 9px' }} onClick={() => openReview(appeal)}><ClipboardCheck size={14} /> Xử lý</button>}</td>
          </tr>)}</tbody>
        </table></div>
      </div>
      {selected && <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><div className="modal-content" style={{ maxWidth: '560px' }}>
        <div className="modal-header"><div><h3>Xử lý đơn phúc khảo</h3><small>{selected.studentCode} · {selected.subjectCode} · Điểm cũ: {selected.currentScore ?? '—'}</small></div><button className="btn-icon" onClick={() => setSelected(null)}><X size={18} /></button></div>
        <form onSubmit={submitReview}><div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div><label className="form-label">Kết quả xử lý *</label><select className="form-select" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="APPROVED">Chấp thuận</option><option value="REJECTED">Từ chối</option></select></div>
          {form.status === 'APPROVED' && <div><label className="form-label">Điểm mới *</label><input className="form-control" type="number" min="0" max="10" step="0.01" required value={form.newScore} onChange={(event) => setForm({ ...form, newScore: event.target.value })} /></div>}
          <div><label className="form-label">Nhận xét {form.status === 'REJECTED' ? '*' : ''}</label><textarea className="form-control" rows="5" required={form.status === 'REJECTED'} value={form.reviewNotes} onChange={(event) => setForm({ ...form, reviewNotes: event.target.value })} /></div>
        </div><div className="modal-footer"><button type="button" className="btn btn-outline" onClick={() => setSelected(null)}>Hủy</button><button type="submit" className="btn btn-primary"><CheckCircle2 size={15} /> Xác nhận</button></div></form>
      </div></div>}
    </div>
  );
}
