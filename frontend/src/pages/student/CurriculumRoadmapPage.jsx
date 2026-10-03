import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Compass,
  Cpu,
  GraduationCap,
  Layers,
  Loader2,
  Search,
  Shield,
  ChevronsUpDown,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { curriculumService } from '../../services/dataService';

const statusConfig = {
  PASSED: { label: 'Đã đạt', cls: 'badge-success', icon: CheckCircle2 },
  ENROLLED: { label: 'Đang học', cls: 'badge-warning', icon: Clock },
  RETAKE_REQUIRED: { label: 'Cần học lại', cls: 'badge-danger', icon: AlertCircle },
  FAILED: { label: 'Chưa đạt', cls: 'badge-danger', icon: AlertCircle },
  NOT_ENROLLED: { label: 'Chưa học', cls: 'badge-neutral', icon: Circle },
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
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openBlocks, setOpenBlocks] = useState({});
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    curriculumService
      .getMine()
      .then((response) => {
        const data = response.data.data;
        setCurriculum(data);
        // Default: all blocks open
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
  }, []);

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
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Chương trình đào tạo</h1>
          <p>{program.name}</p>
        </div>
        <div className="badge badge-info" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          <GraduationCap size={15} /> {program.cohort?.code} · {program.major?.name}
        </div>
      </div>

      {/* Hero Overview Card */}
      <div className="curriculum-hero-card">
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
              {/* Accordion Header */}
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

              {/* Table Body */}
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
    </div>
  );
}
