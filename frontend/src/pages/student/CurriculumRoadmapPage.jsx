import { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, ChevronDown, ChevronUp, Compass, GraduationCap, Layers, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { curriculumService } from '../../services/dataService';

const statusConfig = {
  PASSED: { label: 'Đã đạt', cls: 'badge-success' },
  ENROLLED: { label: 'Đang học', cls: 'badge-warning' },
  RETAKE_REQUIRED: { label: 'Cần học lại', cls: 'badge-danger' },
  FAILED: { label: 'Chưa đạt', cls: 'badge-danger' },
  NOT_ENROLLED: { label: 'Chưa học', cls: 'badge-neutral' },
};

export default function CurriculumRoadmapPage() {
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openBlocks, setOpenBlocks] = useState({});

  useEffect(() => {
    curriculumService.getMine()
      .then((response) => setCurriculum(response.data.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Không thể tải chương trình đào tạo'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card" style={{ padding: '60px', textAlign: 'center' }}><Loader2 className="spin" size={24} /> Đang tải chương trình đào tạo...</div>;
  if (!curriculum) return <div className="card" style={{ padding: '40px', textAlign: 'center' }}>Chưa có dữ liệu chương trình đào tạo.</div>;

  const { program, progress, blocks } = curriculum;
  const toggleBlock = (id) => setOpenBlocks((current) => ({ ...current, [id]: current[id] === undefined ? false : !current[id] }));

  return (
    <div>
      <div className="page-header">
        <div><h1>Chương trình đào tạo</h1><p>{program.name}</p></div>
        <div className="badge badge-info"><GraduationCap size={14} /> {program.cohort?.code} · {program.major?.name}</div>
      </div>

      <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'end', flexWrap: 'wrap' }}>
          <div><div style={{ opacity: 0.8 }}>Tiến độ hoàn thành</div><div style={{ fontSize: '2.4rem', fontWeight: 800 }}>{Number(progress.completionPercent || 0).toFixed(1)}%</div></div>
          <div style={{ textAlign: 'right' }}>{progress.completedCredits}/{progress.requiredCredits} tín chỉ đạt</div>
        </div>
        <div style={{ height: '10px', borderRadius: '99px', background: 'rgba(255,255,255,.25)', marginTop: '18px', overflow: 'hidden' }}><div style={{ width: `${Math.min(100, progress.completionPercent || 0)}%`, height: '100%', background: '#fff', borderRadius: 'inherit' }} /></div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card"><div className="stat-icon-wrapper curriculum-stat-icon curriculum-stat-icon--total"><Layers size={21} /></div><div><div className="stat-value">{progress.requiredCredits}</div><div className="stat-label">Tổng tín chỉ chương trình</div></div></div>
        <div className="stat-card"><div className="stat-icon-wrapper curriculum-stat-icon curriculum-stat-icon--completed"><CheckCircle2 size={21} /></div><div><div className="stat-value">{progress.completedCredits}</div><div className="stat-label">Đã tích lũy đạt</div></div></div>
        <div className="stat-card"><div className="stat-icon-wrapper curriculum-stat-icon curriculum-stat-icon--in-progress"><BookOpen size={21} /></div><div><div className="stat-value">{progress.inProgressCredits}</div><div className="stat-label">Đang theo học</div></div></div>
        <div className="stat-card"><div className="stat-icon-wrapper curriculum-stat-icon curriculum-stat-icon--remaining"><Compass size={21} /></div><div><div className="stat-value">{progress.remainingCredits}</div><div className="stat-label">Còn lại cần hoàn thành</div></div></div>
      </div>

      {blocks.map((block) => {
        const expanded = openBlocks[block.id] !== false;
        return <div className="card" key={block.id} style={{ marginBottom: '16px' }}>
          <button type="button" className="curriculum-block-toggle" onClick={() => toggleBlock(block.id)} aria-expanded={expanded}>
            <div><h3 style={{ margin: 0 }}>{block.name}</h3><small style={{ color: 'var(--text-muted)' }}>{block.code} · {block.type === 'COMPULSORY' ? 'Bắt buộc' : 'Tự chọn'}</small></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className={`badge ${block.completed ? 'badge-success' : 'badge-warning'}`}>{block.completedCredits}/{block.requiredCredits} TC</span>
              {expanded ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
            </div>
          </button>
          {expanded && <div className="table-container" style={{ marginTop: '16px' }}><table className="table"><thead><tr><th>Mã môn & Tên môn</th><th>TC</th><th>Tiên quyết</th><th>Trạng thái</th><th>Điểm</th></tr></thead><tbody>{block.subjects.map((subject) => {
            const status = statusConfig[subject.status] || statusConfig.NOT_ENROLLED;
            return <tr key={subject.id}><td><strong>{subject.code}</strong><br /><span style={{ color: 'var(--text-secondary)' }}>{subject.name}</span></td><td>{subject.credits}</td><td>{subject.prerequisites?.length ? subject.prerequisites.map((item) => <span key={item} className="badge badge-neutral" style={{ marginRight: '4px' }}>{item}</span>) : '—'}</td><td><span className={`badge ${status.cls}`}>{status.label}</span></td><td>{subject.grade?.letterGrade || (subject.grade?.gpaPoint != null ? Number(subject.grade.gpaPoint).toFixed(2) : '—')}</td></tr>;
          })}</tbody></table></div>}
        </div>;
      })}
    </div>
  );
}
