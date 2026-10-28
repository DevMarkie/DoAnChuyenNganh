import { useState, useEffect, useMemo } from 'react';
import { graduationService, classService } from '../../services/dataService';
import { toast } from 'react-toastify';
import { 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Download, 
  Search, 
  CheckCheck, 
  FileText,
  RefreshCw,
  Users,
  GraduationCap
} from 'lucide-react';

const COHORTS = [
  { id: 1, name: 'Khóa 16 (2020 - 2024)' },
  { id: 2, name: 'Khóa 17 (2021 - 2025)' },
  { id: 3, name: 'Khóa 18 (2022 - 2026)' },
  { id: 4, name: 'Khóa 19 (2023 - 2027)' },
];

export default function GraduationPage() {
  const [selectedCohort, setSelectedCohort] = useState(1);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, QUALIFIED, DISQUALIFIED, APPROVED
  const [decisionNo, setDecisionNo] = useState(`QD-TN-${new Date().getFullYear()}/QĐ-ĐH`);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [selectedRecordForApproval, setSelectedRecordForApproval] = useState(null);

  useEffect(() => {
    loadRecords();
  }, [selectedCohort]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const res = await graduationService.getRecords({ cohortId: selectedCohort, size: 200 });
      setRecords(res.data?.data?.content || []);
    } catch (err) {
      console.error('Lỗi tải danh sách hồ sơ tốt nghiệp:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunEvaluation = async () => {
    if (!selectedCohort) {
      toast.warning('Vui lòng chọn khóa tuyển sinh');
      return;
    }
    try {
      setEvaluating(true);
      const res = await graduationService.evaluateCohort(selectedCohort);
      toast.success(res.data?.message || 'Đã thực thi thuật toán xét tốt nghiệp thành công!');
      await loadRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể chạy thuật toán xét tốt nghiệp');
    } finally {
      setEvaluating(false);
    }
  };

  const handleApproveSingle = async (record) => {
    try {
      await graduationService.approveRecord(record.id, { decisionNo });
      toast.success(`Đã công nhận tốt nghiệp cho SV: ${record.student?.fullName}`);
      await loadRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi phê duyệt tốt nghiệp');
    }
  };

  const handleBatchApprove = async () => {
    try {
      const res = await graduationService.batchApprove(selectedCohort, { decisionNo });
      toast.success(res.data?.message || 'Phê duyệt hàng loạt thành công!');
      setIsDecisionModalOpen(false);
      await loadRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi phê duyệt hàng loạt');
    }
  };

  const handleExportCSV = () => {
    if (!filteredRecords.length) {
      toast.warning('Không có dữ liệu để xuất file');
      return;
    }
    const headers = ['STT', 'MSSV', 'Ho ten', 'Lop', 'Tin chi tich luy', 'CPA', 'Tham dinh he thong', 'Trang thai cong nhan', 'So QD', 'Ngay ky'];
    const rows = filteredRecords.map((r, index) => [
      index + 1,
      r.student?.studentCode || '',
      r.student?.fullName || '',
      r.student?.classEntity?.name || '',
      r.totalCreditsAccumulated || 0,
      r.cumulativeGpa || 0,
      r.systemRecommendation === 'QUALIFIED' ? 'DU DIEU KIEN' : 'CHUA DU CHUAN',
      r.officialStatus === 'APPROVED' ? 'DA TOT NGHIEP' : 'CHO CONG NHAN',
      r.graduationDecisionNo || '',
      r.decisionDate || '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Quyet_Dinh_Xet_Tot_Nghiep_K${selectedCohort}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã xuất danh sách quyết định tốt nghiệp thành công!');
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch = !search ||
        r.student?.studentCode?.toLowerCase().includes(search.toLowerCase()) ||
        r.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        r.student?.classEntity?.name?.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === 'QUALIFIED') return r.systemRecommendation === 'QUALIFIED';
      if (statusFilter === 'DISQUALIFIED') return r.systemRecommendation === 'DISQUALIFIED';
      if (statusFilter === 'APPROVED') return r.officialStatus === 'APPROVED';
      if (statusFilter === 'PENDING') return r.officialStatus === 'PENDING' && r.systemRecommendation === 'QUALIFIED';
      return true;
    });
  }, [records, search, statusFilter]);

  const stats = useMemo(() => {
    const total = records.length;
    const qualified = records.filter(r => r.systemRecommendation === 'QUALIFIED').length;
    const approved = records.filter(r => r.officialStatus === 'APPROVED').length;
    const disqualified = total - qualified;
    return { total, qualified, approved, disqualified };
  }, [records]);

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main, #0f172a)', margin: 0 }}>
                Hội đồng & Thuật toán Xét tốt nghiệp
              </h1>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '14px' }}>
                Phân hệ nghiệp vụ Cán bộ Đào tạo — Thẩm định chuẩn đầu ra, công nhận tốt nghiệp & xuất quyết định
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={loadRecords}
            disabled={loading}
            className="btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer', background: '#fff' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!filteredRecords.length}
            className="btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer', background: '#fff' }}
          >
            <Download size={16} />
            <span>Xuất quyết định (CSV)</span>
          </button>

          <button
            onClick={handleRunEvaluation}
            disabled={evaluating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              background: '#7c3aed',
              color: '#fff',
              fontWeight: '600',
              cursor: evaluating ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(124, 58, 237, 0.2)'
            }}
          >
            <Play size={16} fill="currentColor" />
            <span>{evaluating ? 'Đang chạy thuật toán...' : 'Chạy xét tốt nghiệp'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Cohort Selector Banner */}
      <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontWeight: '600', fontSize: '14px', color: '#334155' }}>Chọn Khóa xét duyệt:</label>
          <select
            value={selectedCohort}
            onChange={(e) => setSelectedCohort(Number(e.target.value))}
            style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '500', outline: 'none' }}
          >
            {COHORTS.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Search & Status Filter */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Tìm theo MSSV, Họ tên, Lớp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          >
            <option value="ALL">Tất cả kết quả ({records.length})</option>
            <option value="QUALIFIED">Đủ điều kiện ({stats.qualified})</option>
            <option value="DISQUALIFIED">Chưa đạt chuẩn ({stats.disqualified})</option>
            <option value="APPROVED">Đã công nhận tốt nghiệp ({stats.approved})</option>
          </select>

          {stats.qualified > stats.approved && (
            <button
              onClick={() => setIsDecisionModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: '#10b981',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <CheckCheck size={16} />
              <span>Phê duyệt tốt nghiệp hàng loạt ({stats.qualified - stats.approved})</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Tổng số hồ sơ thẩm định</div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>{stats.total}</div>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Đủ chuẩn tốt nghiệp (Hệ thống)</div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#059669' }}>{stats.qualified}</div>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Đã cấp quyết định công nhận</div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#7c3aed' }}>{stats.approved}</div>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Chưa đạt điều kiện đầu ra</div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#dc2626' }}>{stats.disqualified}</div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw className="animate-spin" size={28} style={{ margin: '0 auto 12px' }} />
            <div>Đang tải kết quả thẩm định tốt nghiệp...</div>
          </div>
        ) : !records.length ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <GraduationCap size={44} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#334155', margin: '0 0 6px' }}>Chưa có dữ liệu xét tốt nghiệp cho khóa này</h3>
            <p style={{ margin: '0 0 16px', fontSize: '14px' }}>Bấm nút "Chạy xét tốt nghiệp" phía trên để hệ thống quét toàn bộ điểm và chuẩn đầu ra.</p>
            <button
              onClick={handleRunEvaluation}
              style={{ padding: '8px 18px', background: '#7c3aed', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer' }}
            >
              Chạy thuật toán xét tốt nghiệp ngay
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>STT</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Sinh viên</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Lớp sinh hoạt</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Tín chỉ tích lũy</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>CPA</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Hệ thống thẩm định</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Quyết định tốt nghiệp</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r, index) => {
                  const isQualified = r.systemRecommendation === 'QUALIFIED';
                  const isApproved = r.officialStatus === 'APPROVED';

                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>{index + 1}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{r.student?.fullName}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{r.student?.studentCode}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        {r.student?.classEntity?.name || '---'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600' }}>
                        <span style={{ color: isQualified ? '#059669' : '#dc2626' }}>
                          {r.totalCreditsAccumulated} TC
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600' }}>
                        <span style={{ color: Number(r.cumulativeGpa) >= 2.0 ? '#059669' : '#dc2626' }}>
                          {r.cumulativeGpa ? Number(r.cumulativeGpa).toFixed(2) : '0.00'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {isQualified ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', color: '#059669', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                            <CheckCircle2 size={13} /> Đủ chuẩn
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef2f2', color: '#dc2626', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                            <AlertTriangle size={13} /> Chưa đạt
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {isApproved ? (
                          <div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f5f3ff', color: '#7c3aed', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                              <Award size={13} /> Đã công nhận
                            </span>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{r.graduationDecisionNo}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>Chờ quyết định</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {isApproved ? (
                          <span style={{ color: '#10b981', fontSize: '12px', fontWeight: '500' }}>Đã hoàn tất</span>
                        ) : isQualified ? (
                          <button
                            onClick={() => handleApproveSingle(r)}
                            style={{
                              padding: '6px 12px',
                              background: '#7c3aed',
                              color: '#fff',
                              borderRadius: '6px',
                              border: 'none',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Công nhận
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>Không khả dụng</span>
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

      {/* Batch Decision Modal */}
      {isDecisionModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
              Ban hành Quyết định tốt nghiệp hàng loạt
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
              Thao tác này sẽ chính thức công nhận tốt nghiệp và cập nhật trạng thái học vụ sang <b>GRADUATED</b> cho toàn bộ <b>{stats.qualified - stats.approved}</b> sinh viên đã đạt chuẩn trong khóa xét duyệt.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Số Quyết định tốt nghiệp:
              </label>
              <input
                type="text"
                value={decisionNo}
                onChange={(e) => setDecisionNo(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setIsDecisionModalOpen(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleBatchApprove}
                style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#10b981', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
              >
                Ký duyệt & Ban hành
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
