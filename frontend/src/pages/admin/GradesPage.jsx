import TableRowSkeleton from '../../components/common/TableRowSkeleton';
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Layers,
  Save,
  Download,
  Filter,
  RotateCcw,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Search,
  Eye,
  RefreshCw,
  Send,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { toast } from "react-toastify";
import { courseSectionService, gradeService, semesterService } from "../../services/dataService";
import GradeAnalyticsCard from "../../components/grades/GradeAnalyticsCard";
import { GRADE_GROUPS } from "../../components/grades/gradeConstants";

export default function AdminGradesPage() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'detail'
  const [semesters, setSemesters] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  
  // Overview Dashboard State
  const [overviewList, setOverviewList] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewFilter, setOverviewFilter] = useState('ALL'); // 'ALL' | 'SUBMITTED' | 'PUBLISHED' | 'UNFINISHED'
  const [overviewSearch, setOverviewSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Detail Grade Sheet State
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [grades, setGrades] = useState([]);
  const [groupFilter, setGroupFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveInFlight = useRef(false);

  // Load Semesters on mount
  useEffect(() => {
    const init = async () => {
      try {
        const semRes = await semesterService.getAll();
        const semList = semRes.data.data || [];
        setSemesters(semList);
        const curr = semList.find(s => s.isCurrent) || semList[0];
        if (curr) {
          setSelectedSemesterId(curr.id);
        }
      } catch {
        toast.error('Lỗi khi tải danh sách học kỳ');
      }
    };
    init();
  }, []);

  // Load Overview whenever selectedSemesterId changes
  const loadOverview = async (semId) => {
    try {
      setOverviewLoading(true);
      const res = await gradeService.getAdminOverview(semId || undefined);
      setOverviewList(res.data.data || []);
    } catch {
      toast.error('Lỗi khi tải tổng quan tiến độ nộp điểm');
    } finally {
      setOverviewLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSemesterId) {
      loadOverview(selectedSemesterId);
    }
  }, [selectedSemesterId]);

  // Load Sections for Detail Tab
  const loadSections = async () => {
    try {
      const res = await courseSectionService.getAll();
      const secList = res.data.data || [];
      setSections(secList);
      if (secList.length > 0 && !selectedSection) {
        setSelectedSection(secList[0].id);
        loadGrades(secList[0].id);
      }
    } catch {
      toast.error("Lỗi khi tải danh sách học phần");
    }
  };

  useEffect(() => {
    loadSections();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGrades = async (sectionId) => {
    try {
      setLoading(true);
      const res = await gradeService.getBySection(sectionId);
      setGrades(res.data.data || []);
      setGroupFilter(null);
    } catch {
      toast.error("Lỗi khi tải bảng điểm");
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (e) => {
    const secId = e.target.value;
    setSelectedSection(secId);
    setGroupFilter(null);
    loadGrades(secId);
  };

  const handleScoreChange = (enrollmentId, field, value) => {
    const val = value === "" ? "" : parseFloat(value);
    setGrades((prev) =>
      prev.map((g) =>
        g.enrollment?.id === enrollmentId ? { ...g, [field]: val } : g
      )
    );
  };

  const displayedGrades = useMemo(() => {
    if (!groupFilter || !GRADE_GROUPS[groupFilter]) return grades;
    return grades.filter((g) => GRADE_GROUPS[groupFilter].match(g));
  }, [grades, groupFilter]);

  // 1-Click Publish Section
  const handlePublishSection = async (sectionId, sectionCode) => {
    if (!window.confirm(`Xác nhận CÔNG BỐ ĐIỂM cho lớp [${sectionCode}]? Sau khi công bố, toàn bộ sinh viên trong lớp sẽ xem được điểm trên Bảng điểm cá nhân và hệ thống sẽ gửi thông báo đến các bạn.`)) {
      return;
    }
    try {
      setActionLoadingId(sectionId);
      await gradeService.publishSection(sectionId);
      toast.success(`Đã chính thức công bố bảng điểm lớp [${sectionCode}]!`);
      if (selectedSemesterId) loadOverview(selectedSemesterId);
      if (selectedSection && selectedSection.toString() === sectionId.toString()) {
        loadGrades(sectionId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi công bố điểm');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Unpublish Section (Unlock for lecturer)
  const handleUnpublishSection = async (sectionId, sectionCode) => {
    const reason = window.prompt(`Nhập lý do mở khóa / trả lại bảng điểm cho Giảng viên lớp [${sectionCode}]:`, 'Phòng Đào tạo mở khóa để giảng viên rà soát, điều chỉnh điểm');
    if (reason === null) return;
    try {
      setActionLoadingId(sectionId);
      await gradeService.unpublishSection(sectionId, reason);
      toast.info(`Đã mở khóa bảng điểm lớp [${sectionCode}] cho Giảng viên.`);
      if (selectedSemesterId) loadOverview(selectedSemesterId);
      if (selectedSection && selectedSection.toString() === sectionId.toString()) {
        loadGrades(sectionId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi mở khóa bảng điểm');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Return Section to Lecturer (Luong 2)
  const handleReturnSection = async (sectionId, sectionCode) => {
    const reason = window.prompt(
      `Nhập lý do trả về bảng điểm lớp [${sectionCode}] cho Giảng viên yêu cầu rà soát, chỉnh sửa:`,
      'Phòng Đào tạo phát hiện sai sót / yêu cầu giảng viên rà soát, điều chỉnh điểm'
    );
    if (!reason || !reason.trim()) return;
    try {
      setActionLoadingId(sectionId);
      await gradeService.returnSection(sectionId, reason.trim());
      toast.warning(`Đã trả về bảng điểm lớp [${sectionCode}] cho Giảng viên.`);
      if (selectedSemesterId) loadOverview(selectedSemesterId);
      if (selectedSection && selectedSection.toString() === sectionId.toString()) {
        loadGrades(sectionId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi trả về bảng điểm');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleViewSectionDetail = (secId) => {
    setSelectedSection(secId);
    loadGrades(secId);
    setActiveTab('detail');
  };

  const handleSaveAll = async () => {
    if (saveInFlight.current) return;
    saveInFlight.current = true;
    try {
      setSaving(true);
      const payload = grades.map((g) => ({
        enrollmentId: g.enrollment?.id,
        cc1Score: g.cc1Score != null ? g.cc1Score : null,
        cc2Score: g.cc2Score != null ? g.cc2Score : null,
        midtermScore: g.midtermScore != null ? g.midtermScore : null,
        finalScore: g.finalScore != null ? g.finalScore : null,
        finalize: false,
      }));
      await gradeService.saveBatch(payload);
      toast.success("Đã lưu bảng điểm thành công!");
      loadGrades(selectedSection);
      if (selectedSemesterId) loadOverview(selectedSemesterId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi khi lưu bảng điểm");
    } finally {
      setSaving(false);
      saveInFlight.current = false;
    }
  };

  const handleExportExcel = async () => {
    if (!selectedSection) return;
    try {
      const res = await gradeService.exportExcel(selectedSection);
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const sec = sections.find((s) => s.id === parseInt(selectedSection));
      link.href = url;
      link.download = `bang_diem_${sec?.sectionCode || selectedSection}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Đã tải xuống file Excel!");
    } catch {
      toast.error("Lỗi khi xuất file Excel");
    }
  };

  const isStudentPassed = (g) => {
    if (g.isPassed !== undefined && g.isPassed !== null) return g.isPassed;
    if (g.letterGrade) return g.letterGrade !== "F" && g.letterGrade !== "D";
    if (g.totalScore != null) return parseFloat(g.totalScore) >= 5.0;
    return null;
  };

  const activeSection = sections.find((s) => s.id === parseInt(selectedSection));
  const activeOverviewItem = overviewList.find((item) => item.sectionId === parseInt(selectedSection));
  const isSectionPublished = activeOverviewItem ? activeOverviewItem.isPublished : (grades.length > 0 && grades.every(g => g.isFinalized));
  const isSectionFullyGraded = grades.length > 0 && grades.every(g => g.totalScore != null || (g.specialGrade && g.specialGrade !== 'NONE'));

  const passedCount = grades.filter((g) => isStudentPassed(g) === true).length;
  const gradedCount = grades.filter((g) => g.totalScore != null).length;
  const passRate = gradedCount > 0 ? Math.round((passedCount / gradedCount) * 100) : 0;

  // Filter Overview List
  const filteredOverview = useMemo(() => {
    return overviewList.filter((item) => {
      // Filter by status tab
      if (overviewFilter === 'SUBMITTED' && item.gradeStatus !== 'SUBMITTED') return false;
      if (overviewFilter === 'PUBLISHED' && item.gradeStatus !== 'PUBLISHED') return false;
      if (overviewFilter === 'UNFINISHED' && (item.gradeStatus === 'PUBLISHED' || item.gradeStatus === 'SUBMITTED')) return false;

      // Filter by search text
      if (overviewSearch.trim()) {
        const q = overviewSearch.toLowerCase().trim();
        const matchCode = item.sectionCode?.toLowerCase().includes(q);
        const matchSubj = item.subjectName?.toLowerCase().includes(q) || item.subjectCode?.toLowerCase().includes(q);
        const matchLect = item.lecturerName?.toLowerCase().includes(q);
        if (!matchCode && !matchSubj && !matchLect) return false;
      }
      return true;
    });
  }, [overviewList, overviewFilter, overviewSearch]);

  // Metric counts for Overview
  const countTotal = overviewList.length;
  const countSubmitted = overviewList.filter(i => i.gradeStatus === 'SUBMITTED').length;
  const countPublished = overviewList.filter(i => i.gradeStatus === 'PUBLISHED').length;
  const countUnfinished = overviewList.filter(i => i.gradeStatus === 'NOT_GRADED' || i.gradeStatus === 'IN_PROGRESS').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Điều Phối Điểm Số & Công Bố Toàn Trường</h1>
          <p>
            Giám sát tiến độ nộp điểm của Giảng viên, xét duyệt và bấm nút công bố kết quả học tập cho sinh viên
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('overview')}
          >
            <TrendingUp size={16} />
            <span>Tiến độ & Công bố ({countSubmitted} chờ duyệt)</span>
          </button>
          <button
            className={`btn ${activeTab === 'detail' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('detail')}
          >
            <Layers size={16} />
            <span>Chi tiết bảng điểm lớp</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & PUBLISH DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <>
          {/* Top Bar: Semester Selector & Metrics */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-body" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calendar size={18} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Học kỳ giám sát:</span>
                <select
                  value={selectedSemesterId}
                  onChange={(e) => setSelectedSemesterId(e.target.value)}
                  className="form-select"
                  style={{ minWidth: '240px' }}
                >
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.semesterName} ({s.semesterCode}) {s.isCurrent ? '★ Hiện hành' : ''}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-outline"
                  style={{ padding: '6px 10px' }}
                  onClick={() => loadOverview(selectedSemesterId)}
                  title="Làm mới dữ liệu"
                >
                  <RefreshCw size={14} className={overviewLoading ? 'spin' : ''} />
                </button>
              </div>

              {/* Stat Badges */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ padding: '6px 14px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Tổng số lớp</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{countTotal}</div>
                </div>
                <div style={{ padding: '6px 14px', borderRadius: '8px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>Chờ công bố</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#d97706' }}>{countSubmitted}</div>
                </div>
                <div style={{ padding: '6px 14px', borderRadius: '8px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>Đã công bố</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>{countPublished}</div>
                </div>
                <div style={{ padding: '6px 14px', borderRadius: '8px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#1e40af' }}>Chưa hoàn tất</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2563eb' }}>{countUnfinished}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-body" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className={`btn ${overviewFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                  onClick={() => setOverviewFilter('ALL')}
                >
                  Tất cả ({countTotal})
                </button>
                <button
                  className={`btn ${overviewFilter === 'SUBMITTED' ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.82rem',
                    backgroundColor: overviewFilter === 'SUBMITTED' ? '#d97706' : undefined,
                    borderColor: '#f59e0b',
                    color: overviewFilter === 'SUBMITTED' ? '#ffffff' : '#b45309'
                  }}
                  onClick={() => setOverviewFilter('SUBMITTED')}
                >
                  ⚡ Chờ công bố ({countSubmitted})
                </button>
                <button
                  className={`btn ${overviewFilter === 'PUBLISHED' ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.82rem',
                    backgroundColor: overviewFilter === 'PUBLISHED' ? '#059669' : undefined,
                    borderColor: '#10b981',
                    color: overviewFilter === 'PUBLISHED' ? '#ffffff' : '#047857'
                  }}
                  onClick={() => setOverviewFilter('PUBLISHED')}
                >
                  ✓ Đã công bố ({countPublished})
                </button>
                <button
                  className={`btn ${overviewFilter === 'UNFINISHED' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                  onClick={() => setOverviewFilter('UNFINISHED')}
                >
                  Đang / Chưa nộp ({countUnfinished})
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '280px' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-light)' }} />
                  <input
                    type="text"
                    value={overviewSearch}
                    onChange={(e) => setOverviewSearch(e.target.value)}
                    placeholder="Tìm mã lớp, tên môn, giảng viên..."
                    className="form-control"
                    style={{ paddingLeft: '32px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Overview Table */}
          <div className="card">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã LHP</th>
                    <th>Học phần</th>
                    <th>Số TC</th>
                    <th>Giảng viên</th>
                    <th>Tiến độ chấm điểm</th>
                    <th>Trạng thái nộp điểm</th>
                    <th style={{ textAlign: 'right' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {overviewLoading ? (
                    <TableRowSkeleton columns={7} />
                  ) : filteredOverview.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                        Không có lớp học phần nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredOverview.map((item) => {
                      const isActioning = actionLoadingId === item.sectionId;
                      return (
                        <tr key={item.sectionId}>
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
                              {item.sectionCode}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.subjectName}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{item.subjectCode}</div>
                          </td>
                          <td>
                            <span className="badge badge-info">{item.credits} TC</span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                            {item.lecturerName}
                          </td>
                          <td style={{ minWidth: '160px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 600 }}>{item.gradedCount} / {item.enrolledCount} SV</span>
                              <span style={{ color: item.completionRate === 100 ? '#059669' : '#64748b', fontWeight: 600 }}>
                                {item.completionRate}%
                              </span>
                            </div>
                            <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${item.completionRate}%`,
                                  height: '100%',
                                  backgroundColor: item.gradeStatus === 'PUBLISHED' ? '#10b981' : item.gradeStatus === 'SUBMITTED' ? '#f59e0b' : '#3b82f6',
                                  transition: 'width 0.3s'
                                }}
                              />
                            </div>
                          </td>
                          <td>
                            {item.gradeStatus === 'PUBLISHED' ? (
                              <span
                                className="badge badge-success"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 8px', fontWeight: 700 }}
                              >
                                <Lock size={12} /> ĐÃ CÔNG BỐ
                              </span>
                            ) : item.gradeStatus === 'SUBMITTED' ? (
                              <span
                                className="badge"
                                style={{
                                  backgroundColor: '#fef3c7',
                                  color: '#b45309',
                                  border: '1px solid #fde68a',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '4px 8px',
                                  fontWeight: 700
                                }}
                              >
                                <AlertCircle size={12} /> CHỜ CÔNG BỐ
                              </span>
                            ) : item.gradeStatus === 'RETURNED' ? (
                              <span
                                className="badge badge-danger"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '4px 8px',
                                  fontWeight: 700
                                }}
                                title={item.gradeReturnReason ? `Lý do: ${item.gradeReturnReason}` : 'Bị trả về'}
                              >
                                <AlertCircle size={12} /> BỊ TRẢ VỀ
                              </span>
                            ) : item.gradeStatus === 'IN_PROGRESS' ? (
                              <span className="badge badge-info" style={{ padding: '4px 8px' }}>
                                Đang chấm điểm
                              </span>
                            ) : (
                              <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '4px 8px' }}>
                                Chưa nhập điểm
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                className="btn btn-outline"
                                style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                                onClick={() => handleViewSectionDetail(item.sectionId)}
                                title="Xem chi tiết bảng điểm"
                              >
                                <Eye size={13} style={{ marginRight: '4px' }} /> Xem điểm
                              </button>

                              {item.gradeStatus === 'SUBMITTED' && (
                                <>
                                  <button
                                    className="btn btn-primary"
                                    style={{
                                      padding: '4px 10px',
                                      fontSize: '0.78rem',
                                      backgroundColor: '#059669',
                                      borderColor: '#059669',
                                      fontWeight: 700
                                    }}
                                    disabled={isActioning}
                                    onClick={() => handlePublishSection(item.sectionId, item.sectionCode)}
                                    title="Công bố kết quả học tập cho toàn bộ sinh viên xem"
                                  >
                                    <Send size={13} style={{ marginRight: '4px' }} /> CÔNG BỐ ĐIỂM
                                  </button>
                                  <button
                                    className="btn btn-outline"
                                    style={{
                                      padding: '4px 8px',
                                      fontSize: '0.75rem',
                                      color: '#dc2626',
                                      borderColor: 'rgba(239, 68, 68, 0.4)'
                                    }}
                                    disabled={isActioning}
                                    onClick={() => handleReturnSection(item.sectionId, item.sectionCode)}
                                    title="Trả về yêu cầu giảng viên rà soát, chỉnh sửa"
                                  >
                                    <RotateCcw size={12} style={{ marginRight: '4px' }} /> Trả về
                                  </button>
                                </>
                              )}

                              {item.gradeStatus === 'PUBLISHED' && (
                                <button
                                  className="btn btn-outline"
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#b45309', borderColor: '#fde68a' }}
                                  disabled={isActioning}
                                  onClick={() => handleUnpublishSection(item.sectionId, item.sectionCode)}
                                  title="Mở khóa để trả lại cho Giảng viên chỉnh sửa"
                                >
                                  <Unlock size={12} style={{ marginRight: '4px' }} /> Mở khóa
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
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DETAILED GRADE SHEET */}
      {/* ========================================================================= */}
      {activeTab === 'detail' && (
        <>
          {/* Status Alert Banner */}
          {activeSection && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 18px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: isSectionPublished ? '#ecfdf5' : isSectionFullyGraded ? '#fffbeb' : '#f8fafc',
                border: `1px solid ${isSectionPublished ? '#a7f3d0' : isSectionFullyGraded ? '#fde68a' : '#e2e8f0'}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isSectionPublished ? (
                  <CheckCircle size={20} style={{ color: '#059669' }} />
                ) : isSectionFullyGraded ? (
                  <AlertCircle size={20} style={{ color: '#d97706' }} />
                ) : (
                  <Layers size={20} style={{ color: '#64748b' }} />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: isSectionPublished ? '#065f46' : isSectionFullyGraded ? '#92400e' : '#334155' }}>
                    {isSectionPublished
                      ? 'BẢNG ĐIỂM ĐÃ ĐƯỢC CÔNG BỐ CHÍNH THỨC TOÀN TRƯỜNG'
                      : isSectionFullyGraded
                      ? 'GIẢNG VIÊN ĐÃ HOÀN TẤT NHẬP ĐIỂM — SẴN SÀNG CÔNG BỐ'
                      : 'ĐANG TRONG TIẾN ĐỘ NHẬP ĐIỂM CỦA GIẢNG VIÊN'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: isSectionPublished ? '#047857' : isSectionFullyGraded ? '#b45309' : '#64748b' }}>
                    {isSectionPublished
                      ? 'Sinh viên trong lớp đã có thể tra cứu điểm trên Bảng điểm cá nhân và xem xét nộp đơn phúc khảo nếu cần.'
                      : isSectionFullyGraded
                      ? 'Phòng Đào tạo có thể kiểm tra rà soát và bấm "CÔNG BỐ ĐIỂM" để sinh viên xem được kết quả.'
                      : 'Giảng viên đang tiếp tục chấm điểm chuyên cần, giữa kỳ hoặc cuối kỳ.'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {!isSectionPublished && isSectionFullyGraded && (
                  <button
                    className="btn btn-primary"
                    style={{ backgroundColor: '#059669', borderColor: '#059669', fontWeight: 700 }}
                    onClick={() => handlePublishSection(activeSection.id, activeSection.sectionCode)}
                  >
                    <Send size={15} style={{ marginRight: '6px' }} /> CÔNG BỐ ĐIỂM NGAY
                  </button>
                )}

                {isSectionPublished && (
                  <button
                    className="btn btn-outline"
                    style={{ color: '#b45309', borderColor: '#fde68a', fontWeight: 600 }}
                    onClick={() => handleUnpublishSection(activeSection.id, activeSection.sectionCode)}
                  >
                    <Unlock size={15} style={{ marginRight: '6px' }} /> Mở khóa sửa điểm
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section Selector Toolbar */}
          <div className="card" style={{ marginBottom: "20px" }}>
            <div
              className="card-body"
              style={{
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                flexWrap: "wrap",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flex: 1,
                  minWidth: "320px",
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => setActiveTab('overview')}
                  title="Quay lại danh sách tổng quan"
                >
                  <ArrowLeft size={14} /> Danh sách lớp
                </button>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    color: "var(--text-main)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Lớp học phần:
                </span>
                <select
                  value={selectedSection}
                  onChange={handleSectionChange}
                  className="form-select"
                  style={{ flex: 1, maxWidth: "560px" }}
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.sectionCode} — {s.subject?.subjectName} (
                      {s.semester?.semesterName} • GV:{" "}
                      {s.lecturer?.fullName || "Chưa phân công"})
                    </option>
                  ))}
                </select>
              </div>

              {activeSection && (
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    fontSize: "0.85rem",
                  }}
                >
                  <span className="badge badge-info">
                    {activeSection.subject?.credits} Tín chỉ
                  </span>
                  <span className="badge badge-neutral">
                    Sĩ số: {grades.length} SV
                  </span>
                  {gradedCount > 0 && (
                    <span className="badge badge-success">Đạt: {passRate}%</span>
                  )}
                  <button
                    className="btn btn-secondary"
                    onClick={handleExportExcel}
                    title="Xuất bảng điểm ra file Excel"
                  >
                    <Download size={15} />
                    <span>Xuất Excel</span>
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={saving}
                    onClick={handleSaveAll}
                  >
                    <Save size={15} />
                    <span>{saving ? "Đang lưu..." : "Lưu tất cả"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Grade Analytics & Distribution Card */}
          {grades.length > 0 && (
            <GradeAnalyticsCard
              grades={grades}
              selectedGroupFilter={groupFilter}
              onSelectGroupFilter={setGroupFilter}
              sectionTitle={activeSection ? `${activeSection.sectionCode} — ${activeSection.subject?.subjectName}` : ''}
              initialExpanded={true}
            />
          )}

          {/* Grade Table */}
          <div className="card">
            {groupFilter && GRADE_GROUPS[groupFilter] && (
              <div
                style={{
                  padding: '10px 16px',
                  backgroundColor: GRADE_GROUPS[groupFilter].bg,
                  borderBottom: `1px solid ${GRADE_GROUPS[groupFilter].border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  fontSize: '0.88rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Filter size={14} style={{ color: GRADE_GROUPS[groupFilter].color }} />
                  <span>
                    Đang lọc nhóm: <strong style={{ color: GRADE_GROUPS[groupFilter].color }}>{GRADE_GROUPS[groupFilter].label}</strong> (Hiển thị <strong>{displayedGrades.length}</strong> / {grades.length} SV)
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: '3px 8px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => setGroupFilter(null)}
                >
                  <RotateCcw size={12} />
                  <span>Bỏ lọc</span>
                </button>
              </div>
            )}

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã sinh viên</th>
                    <th>Họ và tên sinh viên</th>
                    <th style={{ textAlign: "center" }}>
                      CC1 (5%)
                      <br />
                      <small style={{ fontSize: "0.8em", fontWeight: "normal" }}>
                        Chuyên cần
                      </small>
                    </th>
                    <th style={{ textAlign: "center" }}>
                      CC2 (5%)
                      <br />
                      <small style={{ fontSize: "0.8em", fontWeight: "normal" }}>
                        Bài tập
                      </small>
                    </th>
                    <th style={{ textAlign: "center" }}>Giữa kỳ (30%)</th>
                    <th style={{ textAlign: "center" }}>Cuối kỳ (60%)</th>
                    <th style={{ textAlign: "center" }}>Tổng kết (hệ 10)</th>
                    <th style={{ textAlign: "center" }}>Hệ 4</th>
                    <th style={{ textAlign: "center" }}>Điểm chữ</th>
                    <th style={{ textAlign: "center" }}>Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableRowSkeleton columns={10} />
                  ) : grades.length === 0 ? (
                    <tr>
                      <td
                        colSpan="10"
                        style={{
                          textAlign: "center",
                          padding: "48px 20px",
                          color: "var(--text-muted)",
                        }}
                      >
                        Chưa có sinh viên nào đăng ký lớp học phần này.
                      </td>
                    </tr>
                  ) : displayedGrades.length === 0 ? (
                    <tr>
                      <td
                        colSpan="10"
                        style={{
                          textAlign: "center",
                          padding: "36px 20px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <p style={{ margin: "0 0 10px" }}>
                          Không có sinh viên nào thuộc nhóm điểm này.
                        </p>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => setGroupFilter(null)}
                        >
                          Xem toàn bộ danh sách
                        </button>
                      </td>
                    </tr>
                  ) : (
                    displayedGrades.map((g, idx) => {
                      const enrollmentId = g.enrollment?.id;
                      return (
                        <tr key={g.id || idx}>
                          <td>
                            <span
                              style={{
                                display: "inline-block",
                                fontFamily: "monospace",
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                color: "var(--primary)",
                                backgroundColor: "var(--primary-light)",
                                padding: "3px 8px",
                                borderRadius: "4px",
                                border: "1px solid var(--primary-border)",
                              }}
                            >
                              {g.enrollment?.student?.studentCode}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: "var(--text-main)" }}>
                            {g.enrollment?.student?.fullName}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={g.cc1Score ?? ""}
                              onChange={(e) =>
                                handleScoreChange(enrollmentId, "cc1Score", e.target.value)
                              }
                              className="form-control"
                              style={{
                                width: "68px",
                                padding: "6px",
                                textAlign: "center",
                                margin: "0 auto",
                                fontWeight: 600,
                              }}
                            />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={g.cc2Score ?? ""}
                              onChange={(e) =>
                                handleScoreChange(enrollmentId, "cc2Score", e.target.value)
                              }
                              className="form-control"
                              style={{
                                width: "68px",
                                padding: "6px",
                                textAlign: "center",
                                margin: "0 auto",
                                fontWeight: 600,
                              }}
                            />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={g.midtermScore ?? ""}
                              onChange={(e) =>
                                handleScoreChange(enrollmentId, "midtermScore", e.target.value)
                              }
                              className="form-control"
                              style={{
                                width: "68px",
                                padding: "6px",
                                textAlign: "center",
                                margin: "0 auto",
                                fontWeight: 600,
                              }}
                            />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={g.finalScore ?? ""}
                              onChange={(e) =>
                                handleScoreChange(enrollmentId, "finalScore", e.target.value)
                              }
                              className="form-control"
                              style={{
                                width: "68px",
                                padding: "6px",
                                textAlign: "center",
                                margin: "0 auto",
                                fontWeight: 600,
                              }}
                            />
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              fontWeight: 700,
                              fontVariantNumeric: "tabular-nums",
                              color: "var(--text-main)",
                            }}
                          >
                            {g.totalScore != null
                              ? Number(g.totalScore).toFixed(1)
                              : "—"}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span
                              className="badge badge-info"
                              style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                              {(g.gpaPoint ?? g.score4) != null
                                ? Number(g.gpaPoint ?? g.score4).toFixed(2)
                                : "—"}
                            </span>
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              fontWeight: 800,
                              color: "var(--primary)",
                            }}
                          >
                            {g.letterGrade || "—"}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {isStudentPassed(g) != null ? (
                              <span
                                className={`badge ${isStudentPassed(g) ? "badge-success" : "badge-danger"}`}
                              >
                                {isStudentPassed(g) ? "ĐẠT" : "HỌC LẠI"}
                              </span>
                            ) : (
                              <span
                                style={{
                                  color: "var(--text-light)",
                                  fontSize: "0.8rem",
                                }}
                              >
                                Chưa chốt
                              </span>
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
        </>
      )}
    </div>
  );
}

