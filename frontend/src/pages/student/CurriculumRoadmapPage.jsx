import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Award,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Compass,
  Cpu,
  GitBranch,
  GraduationCap,
  Layers,
  Link as LinkIcon,
  Loader2,
  Lock,
  Search,
  Shield,
  Sparkles,
  Unlock,
  ChevronsUpDown,
  Filter,
  Info,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { curriculumService } from '../../services/dataService';

const statusConfig = {
  PASSED: { label: 'Đã đạt', cls: 'badge-success', icon: CheckCircle2, color: 'var(--success, #10b981)', bg: 'rgba(16, 185, 129, 0.1)' },
  ENROLLED: { label: 'Đang học', cls: 'badge-warning', icon: Clock, color: 'var(--warning, #f59e0b)', bg: 'rgba(245, 158, 11, 0.1)' },
  ELIGIBLE: { label: 'Đã mở khóa (Sẵn sàng ĐK)', cls: 'badge-info', icon: Unlock, color: 'var(--info, #0284c7)', bg: 'rgba(2, 132, 199, 0.1)' },
  LOCKED: { label: 'Đang bị khóa', cls: 'badge-neutral', icon: Lock, color: 'var(--text-muted, #94a3b8)', bg: 'rgba(148, 163, 184, 0.1)' },
  RETAKE_REQUIRED: { label: 'Cần học lại', cls: 'badge-danger', icon: AlertTriangle, color: 'var(--danger, #ef4444)', bg: 'rgba(239, 68, 68, 0.1)' },
  NOT_ENROLLED: { label: 'Chưa học', cls: 'badge-neutral', icon: Circle, color: 'var(--text-muted, #94a3b8)', bg: 'rgba(148, 163, 184, 0.1)' },
};

export const fixUtf8 = (text) => {
  if (!text || typeof text !== 'string') return text;
  try {
    if (/[\u00C0-\u00FF][\u0080-\u00BF]/.test(text)) {
      const bytes = new Uint8Array([...text].map((c) => c.charCodeAt(0)));
      const decoded = new TextDecoder('utf-8').decode(bytes);
      if (decoded && !decoded.includes('')) return decoded;
    }
  } catch {}
  return text;
};

const sanitizeCurriculum = (data) => {
  if (!data) return data;
  if (data.program) {
    data.program.name = fixUtf8(data.program.name);
    if (data.program.major) data.program.major.name = fixUtf8(data.program.major.name);
    if (data.program.cohort) data.program.cohort.name = fixUtf8(data.program.cohort.name);
  }
  if (data.blocks) {
    data.blocks.forEach((b) => {
      b.name = fixUtf8(b.name);
      b.subjects?.forEach((s) => {
        s.name = fixUtf8(s.name);
      });
    });
  }
  return data;
};

const sanitizeGraph = (data) => {
  if (!data) return data;
  if (data.nodes) {
    data.nodes.forEach((n) => {
      n.name = fixUtf8(n.name);
    });
  }
  return data;
};

const sanitizeAudit = (data) => {
  if (!data) return data;
  if (data.blocks) {
    data.blocks.forEach((b) => {
      b.name = fixUtf8(b.name);
      b.subjects?.forEach((s) => {
        s.name = fixUtf8(s.name);
      });
    });
  }
  return data;
};

const getBlockIcon = (code = '', name = '') => {
  const c = String(code).toUpperCase();
  const n = String(name).toLowerCase();
  if (c.includes('GDDC') || n.includes('đại cương')) return BookOpen;
  if (c.includes('CSNG') || n.includes('cơ sở ngành')) return Layers;
  if (c.includes('CN') || n.includes('chuyên ngành')) return Cpu;
  if (c.includes('TN') || n.includes('thực tập')) return Briefcase;
  if (c.includes('TNK') || n.includes('khóa luận') || n.includes('đồ án')) return GraduationCap;
  if (n.includes('thể chất') || n.includes('thể dục')) return Activity;
  if (n.includes('quốc phòng') || n.includes('an ninh')) return Shield;
  if (n.includes('bổ trợ') || n.includes('kỹ năng')) return Compass;
  return Layers;
};

export default function CurriculumRoadmapPage() {
  const [activeTab, setActiveTab] = useState('LIST'); // 'LIST' | 'GRAPH' | 'AUDIT'
  const [curriculum, setCurriculum] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [auditData, setAuditData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const [openBlocks, setOpenBlocks] = useState({});
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Graph state
  const [selectedNode, setSelectedNode] = useState(null);
  const [graphFilterStatus, setGraphFilterStatus] = useState('ALL');
  const [graphSearch, setGraphSearch] = useState('');

  useEffect(() => {
    // Initial fetch of curriculum
    curriculumService
      .getMine()
      .then((response) => {
        const data = sanitizeCurriculum(response.data?.data);
        setCurriculum(data);
        if (data?.blocks) {
          const initial = {};
          data.blocks.forEach((b) => {
            initial[b.id] = true;
          });
          setOpenBlocks(initial);
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Không thể tải chương trình đào tạo'))
      .finally(() => setLoading(false));

    // Pre-fetch graph and audit data in background
    curriculumService
      .getMyPrerequisiteGraph()
      .then((res) => setGraphData(sanitizeGraph(res.data?.data)))
      .catch(() => {});

    curriculumService
      .getMyDegreeAudit()
      .then((res) => setAuditData(sanitizeAudit(res.data?.data)))
      .catch(() => {});
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'GRAPH' && !graphData && !loadingGraph) {
      setLoadingGraph(true);
      curriculumService
        .getMyPrerequisiteGraph()
        .then((res) => setGraphData(sanitizeGraph(res.data?.data)))
        .catch((err) => toast.error(err.response?.data?.message || 'Không thể tải đồ thị môn học'))
        .finally(() => setLoadingGraph(false));
    }
    if (tab === 'AUDIT' && !auditData && !loadingAudit) {
      setLoadingAudit(true);
      curriculumService
        .getMyDegreeAudit()
        .then((res) => setAuditData(sanitizeAudit(res.data?.data)))
        .catch((err) => toast.error(err.response?.data?.message || 'Không thể tải kiểm toán tốt nghiệp'))
        .finally(() => setLoadingAudit(false));
    }
  };

  const toggleBlock = (id) => {
    setOpenBlocks((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const toggleAll = () => {
    if (!curriculum?.blocks) return;
    const allOpen = curriculum.blocks.every((b) => openBlocks[b.id]);
    const nextState = {};
    curriculum.blocks.forEach((b) => {
      nextState[b.id] = !allOpen;
    });
    setOpenBlocks(nextState);
  };

  const filteredBlocks = useMemo(() => {
    if (!curriculum?.blocks) return [];
    return curriculum.blocks
      .filter((block) => {
        if (filterType === 'COMPULSORY') return block.type === 'COMPULSORY';
        if (filterType === 'ELECTIVE') return block.type === 'ELECTIVE';
        return true;
      })
      .filter((block) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const matchBlock =
          block.name.toLowerCase().includes(q) || block.code.toLowerCase().includes(q);
        const matchSubject = block.subjects.some(
          (s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
        );
        return matchBlock || matchSubject;
      });
  }, [curriculum, filterType, searchQuery]);

  // Group graph nodes by topological Level
  const groupedGraphNodes = useMemo(() => {
    if (!graphData?.nodes) return {};
    const groups = {};
    graphData.nodes.forEach((node) => {
      // Apply filters
      if (graphFilterStatus !== 'ALL' && node.status !== graphFilterStatus) {
        return;
      }
      if (graphSearch.trim()) {
        const q = graphSearch.toLowerCase().trim();
        const match = node.code.toLowerCase().includes(q) || node.name.toLowerCase().includes(q);
        if (!match) return;
      }
      const lvl = node.level || 1;
      if (!groups[lvl]) groups[lvl] = [];
      groups[lvl].push(node);
    });
    return groups;
  }, [graphData, graphFilterStatus, graphSearch]);

  // Connected nodes for the selected node (ancestors and descendants)
  const connectedNodeInfo = useMemo(() => {
    if (!selectedNode || !graphData) return null;
    const directPrereqCodes = new Set(selectedNode.directPrerequisites || []);
    const missingPrereqCodes = new Set(selectedNode.missingPrerequisites || []);

    // Find children: nodes that list selectedNode.code in their directPrerequisites
    const children = graphData.nodes.filter(
      (n) => n.directPrerequisites && n.directPrerequisites.includes(selectedNode.code)
    );

    return {
      directPrereqs: directPrereqCodes,
      missingPrereqs: missingPrereqCodes,
      children,
    };
  }, [selectedNode, graphData]);

  if (loading) {
    return (
      <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader2 className="spin" size={26} style={{ marginBottom: '10px', color: 'var(--primary)' }} />
        <div>Đang tải chương trình đào tạo...</div>
      </div>
    );
  }

  if (!curriculum) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Chưa có dữ liệu chương trình đào tạo.
      </div>
    );
  }

  const { program, progress, blocks } = curriculum;
  const completionPercent = Number(progress.completionPercent || 0).toFixed(1);
  const completedWidth = Math.min(100, Math.max(0, (progress.completedCredits / (progress.requiredCredits || 1)) * 100));
  const inProgressWidth = Math.min(
    100 - completedWidth,
    Math.max(0, (progress.inProgressCredits / (progress.requiredCredits || 1)) * 100)
  );

  const compulsoryCount = blocks.filter((b) => b.type === 'COMPULSORY').length;
  const electiveCount = blocks.filter((b) => b.type === 'ELECTIVE').length;
  const allOpen = blocks.length > 0 && blocks.every((b) => openBlocks[b.id]);

  return (
    <div style={{ maxWidth: '1380px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            Khung chương trình & Tiến độ đào tạo
          </h1>
          <p>{program.name}</p>
        </div>
        <div className="badge badge-info" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
          <GraduationCap size={16} /> {program.cohort?.code} · {program.major?.name}
        </div>
      </div>

      {/* Navigation View Switcher (Tabs) */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          padding: '4px',
          background: 'var(--bg-subtle, #f1f5f9)',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #e2e8f0)',
          width: 'fit-content',
        }}
      >
        <button
          type="button"
          onClick={() => handleTabChange('LIST')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            fontSize: '0.875rem',
            fontWeight: 600,
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: activeTab === 'LIST' ? 'var(--bg-surface, #ffffff)' : 'transparent',
            color: activeTab === 'LIST' ? 'var(--primary, #2563eb)' : 'var(--text-secondary, #64748b)',
            boxShadow: activeTab === 'LIST' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
          }}
        >
          <Layers size={16} /> Khung chương trình (Danh sách)
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('GRAPH')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            fontSize: '0.875rem',
            fontWeight: 600,
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: activeTab === 'GRAPH' ? 'var(--bg-surface, #ffffff)' : 'transparent',
            color: activeTab === 'GRAPH' ? 'var(--primary, #2563eb)' : 'var(--text-secondary, #64748b)',
            boxShadow: activeTab === 'GRAPH' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
          }}
        >
          <GitBranch size={16} /> Sơ đồ cây tiên quyết (DAG Graph)
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('AUDIT')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            fontSize: '0.875rem',
            fontWeight: 600,
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: activeTab === 'AUDIT' ? 'var(--bg-surface, #ffffff)' : 'transparent',
            color: activeTab === 'AUDIT' ? 'var(--primary, #2563eb)' : 'var(--text-secondary, #64748b)',
            boxShadow: activeTab === 'AUDIT' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
          }}
        >
          <Award size={16} /> Kiểm toán tốt nghiệp (Degree Audit)
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STANDARD BLOCK VIEW                                                */}
      {/* ========================================================================= */}
      {activeTab === 'LIST' && (
        <>
          {/* Hero Overview Card */}
          <div className="curriculum-hero-card" style={{ marginBottom: '24px' }}>
            <div className="curriculum-hero-header">
              <div>
                <div className="curriculum-hero-eyebrow">Tiến độ tích lũy toàn khóa</div>
                <div className="curriculum-hero-title">
                  {progress.completedCredits} / {progress.requiredCredits}{' '}
                  <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    tín chỉ tích lũy đạt
                  </span>
                </div>
              </div>
              <div className="curriculum-hero-percent">
                {completionPercent}%
                <small>hoàn thành</small>
              </div>
            </div>

            {/* Multi-segment progress bar */}
            <div className="curriculum-multi-progress" title={`Đã đạt: ${completionPercent}%`}>
              <div
                className="curriculum-progress-segment curriculum-progress-segment--completed"
                style={{ width: `${completedWidth}%` }}
              />
              <div
                className="curriculum-progress-segment curriculum-progress-segment--in-progress"
                style={{ width: `${inProgressWidth}%` }}
              />
            </div>

            {/* Legend */}
            <div className="curriculum-hero-legend">
              <div className="curriculum-legend-item">
                <span className="curriculum-legend-dot curriculum-legend-dot--completed" />
                <span>
                  Đã tích lũy: <strong>{progress.completedCredits} TC</strong> ({completionPercent}%)
                </span>
              </div>
              <div className="curriculum-legend-item">
                <span className="curriculum-legend-dot curriculum-legend-dot--in-progress" />
                <span>
                  Đang theo học: <strong>{progress.inProgressCredits} TC</strong>
                </span>
              </div>
              <div className="curriculum-legend-item">
                <span className="curriculum-legend-dot curriculum-legend-dot--remaining" />
                <span>
                  Còn lại: <strong>{progress.remainingCredits} TC</strong>
                </span>
              </div>
            </div>
          </div>

          {/* KPI Stats Grid */}
          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <div className="stat-card">
              <div className="stat-icon-wrapper curriculum-stat-icon--total">
                <Layers size={22} />
              </div>
              <div>
                <div className="stat-value">{progress.requiredCredits}</div>
                <div className="stat-label">Tổng tín chỉ yêu cầu</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper curriculum-stat-icon--completed">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div className="stat-value">{progress.completedCredits}</div>
                <div className="stat-label">Đã tích lũy đạt</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper curriculum-stat-icon--in-progress">
                <BookOpen size={22} />
              </div>
              <div>
                <div className="stat-value">{progress.inProgressCredits}</div>
                <div className="stat-label">Đang theo học</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper curriculum-stat-icon--remaining">
                <Compass size={22} />
              </div>
              <div>
                <div className="stat-value">{progress.remainingCredits}</div>
                <div className="stat-label">Còn lại cần học</div>
              </div>
            </div>
          </div>

          {/* Toolbar / Filters & Actions */}
          <div className="curriculum-toolbar">
            <div className="curriculum-filters">
              <button
                type="button"
                className={`curriculum-filter-btn ${filterType === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilterType('ALL')}
              >
                Tất cả khối ({blocks.length})
              </button>
              <button
                type="button"
                className={`curriculum-filter-btn ${filterType === 'COMPULSORY' ? 'active' : ''}`}
                onClick={() => setFilterType('COMPULSORY')}
              >
                Bắt buộc ({compulsoryCount})
              </button>
              <button
                type="button"
                className={`curriculum-filter-btn ${filterType === 'ELECTIVE' ? 'active' : ''}`}
                onClick={() => setFilterType('ELECTIVE')}
              >
                Tự chọn ({electiveCount})
              </button>
            </div>

            <div className="curriculum-actions">
              <div className="curriculum-search-wrapper">
                <Search size={14} className="curriculum-search-icon" />
                <input
                  type="text"
                  className="curriculum-search-input"
                  placeholder="Tìm môn học hoặc khối..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={toggleAll}
                title={allOpen ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
              >
                <ChevronsUpDown size={14} />
                <span>{allOpen ? 'Thu gọn' : 'Mở rộng'}</span>
              </button>
            </div>
          </div>

          {/* Blocks List */}
          {filteredBlocks.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Không tìm thấy khối kiến thức hoặc môn học phù hợp.
            </div>
          ) : (
            filteredBlocks.map((block) => {
              const isOpen = openBlocks[block.id] !== false;
              const BlockIcon = getBlockIcon(block.code, block.name);
              const isCompulsory = block.type === 'COMPULSORY';
              const isCompleted = block.completed;

              return (
                <div
                  key={block.id}
                  className={`curriculum-block-card ${isOpen ? 'is-open' : ''} ${isCompleted ? 'is-completed' : ''}`}
                >
                  <button
                    type="button"
                    className="curriculum-block-header"
                    onClick={() => toggleBlock(block.id)}
                    aria-expanded={isOpen}
                  >
                    <div className="curriculum-block-info">
                      <div className="curriculum-block-icon">
                        <BlockIcon size={18} />
                      </div>
                      <div className="curriculum-block-titles">
                        <div className="curriculum-block-name">{block.name}</div>
                        <div className="curriculum-block-badges">
                          <span className="curriculum-code-tag">{block.code}</span>
                          <span className={isCompulsory ? 'badge badge-neutral' : 'badge badge-purple'}>
                            {isCompulsory ? 'Bắt buộc' : 'Tự chọn'}
                          </span>
                          <span className="curriculum-meta-count">· {block.subjects.length} học phần</span>
                        </div>
                      </div>
                    </div>

                    <div className="curriculum-block-metrics">
                      {isCompleted ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} /> {block.completedCredits}/{block.requiredCredits} TC
                        </span>
                      ) : (
                        <span className="curriculum-credit-pill">
                          <span className="curriculum-credit-current">{block.completedCredits}</span>
                          <span className="curriculum-credit-total">/{block.requiredCredits} TC</span>
                        </span>
                      )}
                      <ChevronDown
                        size={18}
                        className={`curriculum-chevron ${isOpen ? 'curriculum-chevron--open' : ''}`}
                        aria-hidden="true"
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="table-container" style={{ margin: 0, border: 'none', borderRadius: 0 }}>
                      <table className="curriculum-table">
                        <thead>
                          <tr>
                            <th style={{ width: '130px' }}>Mã môn</th>
                            <th>Tên học phần</th>
                            <th className="text-center" style={{ width: '90px' }}>Số TC</th>
                            <th style={{ width: '170px' }}>Tiên quyết</th>
                            <th style={{ width: '150px' }}>Trạng thái</th>
                            <th className="text-center" style={{ width: '90px' }}>Điểm</th>
                          </tr>
                        </thead>
                        <tbody>
                          {block.subjects.map((subject) => {
                            const status = statusConfig[subject.status] || statusConfig.NOT_ENROLLED;
                            const StatusIcon = status.icon;
                            const gradeDisplay =
                              subject.grade?.letterGrade ||
                              (subject.grade?.gpaPoint != null
                                ? Number(subject.grade.gpaPoint).toFixed(2)
                                : null);

                            return (
                              <tr key={subject.id}>
                                <td>
                                  <span className="curriculum-subj-code">{subject.code}</span>
                                </td>
                                <td>
                                  <div className="curriculum-subj-name">{subject.name}</div>
                                </td>
                                <td className="text-center">
                                  <span className="curriculum-subj-credits">{subject.credits} TC</span>
                                </td>
                                <td>
                                  {subject.prerequisites?.length ? (
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                      {subject.prerequisites.map((item) => (
                                        <span
                                          key={item}
                                          className="badge badge-neutral"
                                          style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.72rem' }}
                                        >
                                          {item}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                                  )}
                                </td>
                                <td>
                                  <span className={`badge ${status.cls}`}>
                                    <StatusIcon size={12} />
                                    {status.label}
                                  </span>
                                </td>
                                <td className="text-center">
                                  {gradeDisplay ? (
                                    <span className="curriculum-grade-pill" style={{ color: 'var(--primary)' }}>
                                      {gradeDisplay}
                                    </span>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>—</span>
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
              );
            })
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INTERACTIVE PREREQUISITE DAG GRAPH VIEW                            */}
      {/* ========================================================================= */}
      {activeTab === 'GRAPH' && (
        <div>
          {loadingGraph ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 className="spin" size={26} style={{ marginBottom: '10px', color: 'var(--primary)' }} />
              <div>Đang mô hình hóa đồ thị cây điều kiện môn học (DAG)...</div>
            </div>
          ) : !graphData ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Chưa có dữ liệu đồ thị tiên quyết.
            </div>
          ) : (
            <div>
              {/* Graph Toolbar & Legend */}
              <div
                className="card"
                style={{
                  padding: '16px 20px',
                  marginBottom: '20px',
                  background: 'var(--bg-surface, #ffffff)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                  {/* Status Legend */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '0.825rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Trạng thái:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                      <span>Đã đạt</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                      <span>Đang học</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
                      <span>Đã mở khóa (Sẵn sàng ĐK)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#94a3b8' }} />
                      <span>Bị khóa (Nợ tiên quyết)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                      <span>Cần học lại</span>
                    </div>
                  </div>

                  {/* Filter and Search */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <select
                      className="input input-sm"
                      style={{ minWidth: '160px', padding: '6px 10px', fontSize: '0.8125rem' }}
                      value={graphFilterStatus}
                      onChange={(e) => setGraphFilterStatus(e.target.value)}
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="PASSED">Đã đạt</option>
                      <option value="ENROLLED">Đang học</option>
                      <option value="ELIGIBLE">Đã mở khóa</option>
                      <option value="LOCKED">Đang bị khóa</option>
                      <option value="RETAKE_REQUIRED">Cần học lại</option>
                    </select>

                    <div className="curriculum-search-wrapper">
                      <Search size={14} className="curriculum-search-icon" />
                      <input
                        type="text"
                        className="curriculum-search-input"
                        placeholder="Tìm mã hoặc tên môn..."
                        value={graphSearch}
                        onChange={(e) => setGraphSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Subject Detail Drawer Banner */}
              {selectedNode && (
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(14, 165, 233, 0.08) 100%)',
                    border: '1.5px solid var(--primary, #2563eb)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '16px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span className="curriculum-code-tag" style={{ fontSize: '0.9rem', padding: '2px 8px' }}>
                        {selectedNode.code}
                      </span>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>{selectedNode.name}</strong>
                      <span className="badge badge-neutral">{selectedNode.credits} Tín chỉ</span>
                      <span className={`badge ${statusConfig[selectedNode.status]?.cls}`}>
                        {statusConfig[selectedNode.status]?.label}
                      </span>
                      {selectedNode.bestGrade && (
                        <span className="badge badge-success">
                          Điểm: {selectedNode.bestGrade.letterGrade} ({selectedNode.bestGrade.gpaPoint})
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '10px', fontSize: '0.85rem' }}>
                      {/* Prerequisites info */}
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Môn tiên quyết: </span>
                        {selectedNode.directPrerequisites?.length ? (
                          <span style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', marginLeft: '6px' }}>
                            {selectedNode.directPrerequisites.map((p) => {
                              const isMissing = selectedNode.missingPrerequisites?.includes(p);
                              return (
                                <span
                                  key={p}
                                  className={isMissing ? 'badge badge-danger' : 'badge badge-success'}
                                  style={{ fontFamily: 'ui-monospace, monospace' }}
                                >
                                  {p} {isMissing ? '(Chưa đạt)' : '(Đã đạt)'}
                                </span>
                              );
                            })}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Không có (Môn mở đầu)</span>
                        )}
                      </div>

                      {/* Descendants (Unlocks next) */}
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Môn sẽ mở khóa tiếp: </span>
                        {connectedNodeInfo?.children?.length ? (
                          <span style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', marginLeft: '6px' }}>
                            {connectedNodeInfo.children.map((c) => (
                              <span
                                key={c.code}
                                className="badge badge-info"
                                style={{ fontFamily: 'ui-monospace, monospace' }}
                              >
                                {c.code} ({c.name})
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Học phần chuyên sâu cuối chuỗi</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setSelectedNode(null)}
                    style={{ padding: '4px 8px' }}
                  >
                    <X size={16} /> Đóng
                  </button>
                </div>
              )}

              {/* Topological Level Columns Layout */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.max(1, Object.keys(groupedGraphNodes).length)}, minmax(280px, 1fr))`,
                  gap: '18px',
                  overflowX: 'auto',
                  paddingBottom: '16px',
                }}
              >
                {Object.keys(groupedGraphNodes)
                  .sort((a, b) => Number(a) - Number(b))
                  .map((lvl) => {
                    const levelNodes = groupedGraphNodes[lvl] || [];
                    return (
                      <div
                        key={lvl}
                        style={{
                          background: 'var(--bg-subtle, #f8fafc)',
                          borderRadius: '14px',
                          border: '1px solid var(--border-color, #e2e8f0)',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          minWidth: '280px',
                        }}
                      >
                        {/* Level Header */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '14px',
                            paddingBottom: '10px',
                            borderBottom: '1.5px solid var(--border-color, #e2e8f0)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '8px',
                                background: 'var(--primary, #2563eb)',
                                color: '#ffffff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                              }}
                            >
                              T{lvl}
                            </span>
                            <span style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-main)' }}>
                              {lvl === '1'
                                ? 'Tầng 1: Nhập môn & Đại cương'
                                : lvl === '2'
                                ? 'Tầng 2: Cơ sở ngành'
                                : lvl === '3'
                                ? 'Tầng 3: Chuyên ngành cốt lõi'
                                : `Tầng ${lvl}: Nâng cao & Đồ án`}
                            </span>
                          </div>
                          <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                            {levelNodes.length} môn
                          </span>
                        </div>

                        {/* Subject Cards in this Level */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {levelNodes.map((node) => {
                            const isSelected = selectedNode?.id === node.id;
                            const isDirectPrereq = connectedNodeInfo?.directPrereqs?.has(node.code);
                            const isChild = connectedNodeInfo?.children?.some((c) => c.code === node.code);

                            let borderStyle = '1px solid var(--border-color, #e2e8f0)';
                            let bgCard = 'var(--bg-surface, #ffffff)';

                            if (isSelected) {
                              borderStyle = '2px solid var(--primary, #2563eb)';
                              bgCard = 'rgba(37, 99, 235, 0.05)';
                            } else if (isDirectPrereq) {
                              borderStyle = '2px dashed #10b981';
                              bgCard = 'rgba(16, 185, 129, 0.05)';
                            } else if (isChild) {
                              borderStyle = '2px dashed #0284c7';
                              bgCard = 'rgba(2, 132, 199, 0.05)';
                            }

                            const cfg = statusConfig[node.status] || statusConfig.NOT_ENROLLED;
                            const StatusIcon = cfg.icon;

                            return (
                              <div
                                key={node.id}
                                onClick={() => setSelectedNode(isSelected ? null : node)}
                                style={{
                                  background: bgCard,
                                  border: borderStyle,
                                  borderRadius: '10px',
                                  padding: '12px 14px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
                                  position: 'relative',
                                }}
                              >
                                {/* Subject Code & Credits Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                  <span
                                    className="curriculum-code-tag"
                                    style={{
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                      color: isSelected ? 'var(--primary, #2563eb)' : 'inherit',
                                    }}
                                  >
                                    {node.code}
                                  </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                      {node.credits} TC
                                    </span>
                                    <span
                                      className={node.blockType === 'COMPULSORY' ? 'badge badge-neutral' : 'badge badge-purple'}
                                      style={{ fontSize: '0.68rem', padding: '1px 5px' }}
                                    >
                                      {node.blockType === 'COMPULSORY' ? 'BB' : 'TC'}
                                    </span>
                                  </div>
                                </div>

                                {/* Subject Name */}
                                <div
                                  style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    color: 'var(--text-main)',
                                    lineHeight: 1.35,
                                    marginBottom: '8px',
                                  }}
                                >
                                  {node.name}
                                </div>

                                {/* Status & Grade Badge */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      color: cfg.color,
                                      fontWeight: 600,
                                    }}
                                  >
                                    <StatusIcon size={13} />
                                    {cfg.label}
                                  </span>

                                  {node.bestGrade && (
                                    <span
                                      style={{
                                        fontWeight: 700,
                                        color: '#10b981',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                      }}
                                    >
                                      {node.bestGrade.letterGrade} ({node.bestGrade.gpaPoint})
                                    </span>
                                  )}
                                </div>

                                {/* Direct Prerequisite Badges (if any) */}
                                {node.directPrerequisites?.length > 0 && (
                                  <div
                                    style={{
                                      marginTop: '8px',
                                      paddingTop: '6px',
                                      borderTop: '1px solid var(--border-color, #f1f5f9)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      flexWrap: 'wrap',
                                      fontSize: '0.7rem',
                                      color: 'var(--text-muted)',
                                    }}
                                  >
                                    <LinkIcon size={10} />
                                    <span>Đòi hỏi:</span>
                                    {node.directPrerequisites.map((p) => (
                                      <span
                                        key={p}
                                        style={{
                                          fontFamily: 'ui-monospace, monospace',
                                          background: node.missingPrerequisites?.includes(p) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                          color: node.missingPrerequisites?.includes(p) ? '#ef4444' : '#10b981',
                                          padding: '1px 4px',
                                          borderRadius: '3px',
                                          fontWeight: 600,
                                        }}
                                      >
                                        {p}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DEGREE AUDIT VIEW (BR-CUR-04 & GRADUATION RULES)                   */}
      {/* ========================================================================= */}
      {activeTab === 'AUDIT' && (
        <div>
          {loadingAudit ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 className="spin" size={26} style={{ marginBottom: '10px', color: 'var(--primary)' }} />
              <div>Đang chạy thuật toán kiểm toán tiến độ tốt nghiệp (Degree Audit Engine)...</div>
            </div>
          ) : !auditData ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Chưa có dữ liệu kiểm toán tốt nghiệp.
            </div>
          ) : (
            <div>
              {/* Overall Graduation Status Hero Card */}
              <div
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  marginBottom: '24px',
                  background: auditData.isGraduationEligible
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)'
                    : 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.08) 100%)',
                  border: `1.5px solid ${auditData.isGraduationEligible ? '#10b981' : '#f59e0b'}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '14px',
                        background: auditData.isGraduationEligible ? '#10b981' : '#f59e0b',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    >
                      {auditData.isGraduationEligible ? <Award size={28} /> : <AlertTriangle size={28} />}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: auditData.isGraduationEligible ? '#059669' : '#d97706' }}>
                        Tình trạng kiểm toán tốt nghiệp (BR-CUR-04)
                      </div>
                      <h2 style={{ margin: '4px 0', fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {auditData.isGraduationEligible
                          ? 'ĐỦ ĐIỀU KIỆN XÉT CÔNG NHẬN TỐT NGHIỆP'
                          : 'CHƯA ĐỦ ĐIỀU KIỆN TỐT NGHIỆP'}
                      </h2>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {auditData.isGraduationEligible
                          ? 'Sinh viên đã hoàn thành đầy đủ số tín chỉ và yêu cầu các khối kiến thức Bắt buộc & Tự chọn của CTĐT.'
                          : 'Sinh viên cần hoàn thành thêm các yêu cầu dưới đây để được Hội đồng xét cấp bằng.'}
                      </div>
                    </div>
                  </div>

                  {/* Audit CPA Pill */}
                  <div
                    style={{
                      background: 'var(--bg-surface, #ffffff)',
                      padding: '12px 20px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color, #e2e8f0)',
                      textAlign: 'right',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      CPA Kiểm toán tốt nghiệp
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary, #2563eb)' }}>
                      {Number(auditData.auditCpa || 0).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      CPA toàn khóa gốc: {Number(auditData.officialCpa || 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Unsatisfied reasons list if any */}
                {auditData.unsatisfiedReasons?.length > 0 && (
                  <div
                    style={{
                      marginTop: '18px',
                      padding: '14px 16px',
                      background: 'var(--bg-surface, #ffffff)',
                      borderRadius: '10px',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#dc2626', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertCircle size={15} /> Các điều kiện còn thiếu cần hoàn thành:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {auditData.unsatisfiedReasons.map((reason, idx) => (
                        <li key={idx} style={{ lineHeight: 1.4 }}>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 4 KPI Metrics Grid */}
              <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                  <div className="stat-icon-wrapper curriculum-stat-icon--total">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <div className="stat-value">
                      {auditData.totalCompletedCredits} / {auditData.totalRequiredCredits}
                    </div>
                    <div className="stat-label">Tổng tín chỉ tích lũy chuẩn</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrapper curriculum-stat-icon--completed">
                    <Layers size={22} />
                  </div>
                  <div>
                    <div className="stat-value">
                      {auditData.completedCompulsoryCredits} / {auditData.totalCompulsoryCredits}
                    </div>
                    <div className="stat-label">Tín chỉ Bắt buộc (Compulsory)</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrapper curriculum-stat-icon--in-progress">
                    <Cpu size={22} />
                  </div>
                  <div>
                    <div className="stat-value">
                      {auditData.completedElectiveCreditsAccepted} / {auditData.totalElectiveCreditsRequired}
                    </div>
                    <div className="stat-label">Tín chỉ Tự chọn đạt (Elective)</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrapper curriculum-stat-icon--remaining">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <div className="stat-value">
                      {auditData.excessElectiveCredits} TC
                    </div>
                    <div className="stat-label">Tự chọn ngoài khung / Thừa</div>
                  </div>
                </div>
              </div>

              {/* Excess / Replaced Electives Card (Best-Grade Optimization Highlight) */}
              {auditData.excessElectives?.length > 0 && (
                <div
                  className="card"
                  style={{
                    padding: '20px',
                    marginBottom: '24px',
                    border: '1px solid rgba(14, 165, 233, 0.3)',
                    background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.04) 0%, rgba(99, 102, 241, 0.04) 100%)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div
                      style={{
                        padding: '6px',
                        borderRadius: '8px',
                        background: 'rgba(14, 165, 233, 0.15)',
                        color: 'var(--primary, #2563eb)',
                      }}
                    >
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        Môn học Tự chọn ngoài khung & Điểm cải thiện (Tối ưu Best-Grade)
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Các môn tự chọn sinh viên tích lũy thừa hoặc môn có điểm thấp hơn môn thay thế. Được lưu trong bảng điểm chi tiết nhưng <strong>không kéo tụt CPA tốt nghiệp</strong>.
                      </div>
                    </div>
                  </div>

                  <div className="table-container" style={{ margin: 0, border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <table className="curriculum-table">
                      <thead>
                        <tr>
                          <th style={{ width: '130px' }}>Mã môn</th>
                          <th>Tên học phần tự chọn</th>
                          <th className="text-center" style={{ width: '90px' }}>Số TC</th>
                          <th className="text-center" style={{ width: '100px' }}>Điểm chữ / Hệ 4</th>
                          <th>Ghi chú kiểm toán tốt nghiệp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditData.excessElectives.map((item) => (
                          <tr key={item.subjectId}>
                            <td>
                              <span className="curriculum-code-tag">{item.subjectCode}</span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 600 }}>{item.subjectName}</span>
                            </td>
                            <td className="text-center">{item.credits} TC</td>
                            <td className="text-center">
                              <span className="badge badge-neutral">
                                {item.letterGrade} ({item.gpaPoint})
                              </span>
                            </td>
                            <td>
                              <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                                {item.auditNote}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Block Details in Degree Audit */}
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
                  Phân rã kiểm toán theo từng khối kiến thức
                </h3>

                {auditData.blocks?.map((block) => (
                  <div
                    key={block.blockId}
                    style={{
                      background: 'var(--bg-surface, #ffffff)',
                      border: '1px solid var(--border-color, #e2e8f0)',
                      borderRadius: '12px',
                      marginBottom: '14px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        padding: '14px 18px',
                        background: 'var(--bg-subtle, #f8fafc)',
                        borderBottom: '1px solid var(--border-color, #e2e8f0)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="curriculum-code-tag">{block.blockCode}</span>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{block.blockName}</strong>
                        <span className={block.blockType === 'COMPULSORY' ? 'badge badge-neutral' : 'badge badge-purple'}>
                          {block.blockType === 'COMPULSORY' ? 'Khối Bắt buộc' : 'Khối Tự chọn'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {block.isCompleted ? (
                          <span className="badge badge-success">
                            <CheckCircle2 size={13} /> Hoàn thành ({block.completedCredits}/{block.requiredCredits} TC)
                          </span>
                        ) : (
                          <span className="badge badge-danger">
                            <AlertCircle size={13} /> Chưa hoàn thành ({block.completedCredits}/{block.requiredCredits} TC)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Accepted Subjects Table */}
                    <div className="table-container" style={{ margin: 0, border: 'none', borderRadius: 0 }}>
                      <table className="curriculum-table">
                        <thead>
                          <tr>
                            <th style={{ width: '130px' }}>Mã môn</th>
                            <th>Tên môn học</th>
                            <th className="text-center" style={{ width: '80px' }}>Số TC</th>
                            <th className="text-center" style={{ width: '100px' }}>Điểm kết thúc</th>
                            <th style={{ width: '180px' }}>Trạng thái kiểm toán</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Accepted Subjects */}
                          {block.acceptedSubjects?.map((sub) => (
                            <tr key={sub.subjectId}>
                              <td>
                                <span className="curriculum-subj-code">{sub.subjectCode}</span>
                              </td>
                              <td>
                                <span className="curriculum-subj-name">{sub.subjectName}</span>
                              </td>
                              <td className="text-center">{sub.credits} TC</td>
                              <td className="text-center">
                                <span className="badge badge-success" style={{ fontWeight: 700 }}>
                                  {sub.letterGrade} ({sub.gpaPoint})
                                </span>
                              </td>
                              <td>
                                <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                                  <CheckCircle2 size={11} /> {sub.auditNote}
                                </span>
                              </td>
                            </tr>
                          ))}

                          {/* Unfulfilled / Remaining Subjects */}
                          {block.unfulfilledOrRemainingSubjects?.map((sub) => (
                            <tr key={sub.subjectId} style={{ opacity: 0.75 }}>
                              <td>
                                <span className="curriculum-code-tag">{sub.subjectCode}</span>
                              </td>
                              <td>
                                <span>{sub.subjectName}</span>
                              </td>
                              <td className="text-center">{sub.credits} TC</td>
                              <td className="text-center">
                                {sub.letterGrade ? (
                                  <span className="badge badge-danger">
                                    {sub.letterGrade} ({sub.gpaPoint})
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>—</span>
                                )}
                              </td>
                              <td>
                                <span
                                  className={block.blockType === 'COMPULSORY' ? 'badge badge-danger' : 'badge badge-neutral'}
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  {sub.auditNote}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
