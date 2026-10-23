import { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { GRADE_GROUPS } from './gradeConstants';

export default function GradeAnalyticsCard({
  grades = [],
  selectedGroupFilter = null,
  onSelectGroupFilter = () => {},
  sectionTitle = '',
  initialExpanded = true,
}) {
  const [expanded, setExpanded] = useState(initialExpanded);

  const stats = useMemo(() => {
    const totalStudents = grades.length;
    const gradedList = grades.filter(
      (g) => g.totalScore != null || (g.specialGrade && g.specialGrade !== 'NONE')
    );
    const gradedCount = gradedList.length;

    // Numerical scores for descriptive statistics
    const numericScores = grades
      .map((g) => (g.totalScore != null ? Number(g.totalScore) : null))
      .filter((s) => s != null && !isNaN(s));

    const gpaScores = grades
      .map((g) => (g.gpaPoint ?? g.score4 != null ? Number(g.gpaPoint ?? g.score4) : null))
      .filter((s) => s != null && !isNaN(s));

    const avgScore = numericScores.length > 0
      ? (numericScores.reduce((a, b) => a + b, 0) / numericScores.length).toFixed(2)
      : '—';

    const avgGpa = gpaScores.length > 0
      ? (gpaScores.reduce((a, b) => a + b, 0) / gpaScores.length).toFixed(2)
      : '—';

    const maxScore = numericScores.length > 0 ? Math.max(...numericScores).toFixed(1) : '—';
    const minScore = numericScores.length > 0 ? Math.min(...numericScores).toFixed(1) : '—';

    // Grouping
    const groups = {
      A: { ...GRADE_GROUPS.A, count: 0, students: [] },
      B: { ...GRADE_GROUPS.B, count: 0, students: [] },
      C: { ...GRADE_GROUPS.C, count: 0, students: [] },
      D_PLUS: { ...GRADE_GROUPS.D_PLUS, count: 0, students: [] },
      FAIL: { ...GRADE_GROUPS.FAIL, count: 0, students: [] },
    };

    gradedList.forEach((g) => {
      if (GRADE_GROUPS.A.match(g)) {
        groups.A.count++;
        groups.A.students.push(g);
      } else if (GRADE_GROUPS.B.match(g)) {
        groups.B.count++;
        groups.B.students.push(g);
      } else if (GRADE_GROUPS.C.match(g)) {
        groups.C.count++;
        groups.C.students.push(g);
      } else if (GRADE_GROUPS.D_PLUS.match(g)) {
        groups.D_PLUS.count++;
        groups.D_PLUS.students.push(g);
      } else if (GRADE_GROUPS.FAIL.match(g)) {
        groups.FAIL.count++;
        groups.FAIL.students.push(g);
      }
    });

    const passedCount = groups.A.count + groups.B.count + groups.C.count + groups.D_PLUS.count;
    const failCount = groups.FAIL.count;

    const passRate = gradedCount > 0 ? Math.round((passedCount / gradedCount) * 100) : 0;
    const failRate = gradedCount > 0 ? Math.round((failCount / gradedCount) * 100) : 0;

    // Highest group count for relative visual bar height
    const maxGroupCount = Math.max(
      groups.A.count,
      groups.B.count,
      groups.C.count,
      groups.D_PLUS.count,
      groups.FAIL.count,
      1
    );

    return {
      totalStudents,
      gradedCount,
      avgScore,
      avgGpa,
      maxScore,
      minScore,
      passedCount,
      failCount,
      passRate,
      failRate,
      groups,
      maxGroupCount,
    };
  }, [grades]);

  if (!grades || grades.length === 0) return null;

  return (
    <div
      className="card"
      style={{
        marginBottom: '20px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          padding: '14px 20px',
          background: 'var(--card-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: expanded ? '1px solid var(--border-color)' : 'none',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <BarChart3 size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '0.98rem', color: 'var(--text-main)' }}>
                Phân Tích Phổ Điểm & Kiểm Định Chất Lượng
              </strong>
              {sectionTitle && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  • {sectionTitle}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Sĩ số: <strong>{stats.totalStudents}</strong> SV • Đã nhập điểm: <strong>{stats.gradedCount}</strong>/{stats.totalStudents} • Đạt: <strong style={{ color: 'var(--success)' }}>{stats.passRate}%</strong> • Học lại: <strong style={{ color: stats.failRate > 25 ? 'var(--danger)' : 'var(--text-secondary)' }}>{stats.failRate}%</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {selectedGroupFilter && (
            <span
              className="badge badge-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '0.8rem' }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectGroupFilter(null);
              }}
              title="Nhấn để bỏ lọc"
            >
              <Filter size={12} />
              Đang lọc: {GRADE_GROUPS[selectedGroupFilter]?.shortLabel}
              <RotateCcw size={12} style={{ marginLeft: '4px' }} />
            </span>
          )}
          <button
            type="button"
            className="btn-icon"
            style={{ padding: '6px' }}
            aria-label={expanded ? 'Thu gọn thống kê' : 'Mở rộng thống kê'}
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Expanded analytics body */}
      {expanded && (
        <div style={{ padding: '20px' }}>
          {/* Quality Audit Warning when failRate > 25% */}
          {stats.failRate > 25 && stats.gradedCount >= 5 && (
            <div
              style={{
                marginBottom: '18px',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'var(--danger-bg)',
                border: '1px solid var(--danger)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <AlertTriangle size={20} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.45' }}>
                <strong style={{ color: 'var(--danger)' }}>Cảnh báo Kiểm định Chất lượng Học phần:</strong> Tỷ lệ sinh viên chưa đạt / phải học lại (D, F, V) đang ở mức <strong>{stats.failRate}%</strong> ({stats.failCount}/{stats.gradedCount} SV), vượt quá ngưỡng kiểm định an toàn (25%). Khuyến nghị Giảng viên & Bộ môn rà soát lại ma trận đề thi hoặc tổ chức phụ đạo cho sinh viên trước kỳ thi lại.
              </div>
            </div>
          )}

          {/* Quick Metrics Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Điểm TB (Hệ 10)
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                {stats.avgScore}
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                GPA TB (Hệ 4)
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--purple, #8b5cf6)', marginTop: '4px' }}>
                {stats.avgGpa}
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Cao nhất (Max)
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                {stats.maxScore}
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Thấp nhất (Min)
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: stats.minScore !== '—' && Number(stats.minScore) < 5 ? 'var(--danger)' : 'var(--text-main)', marginTop: '4px' }}>
                {stats.minScore}
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Tỷ lệ Đạt
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                {stats.passRate}%
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Học lại (D/F/V)
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: stats.failRate > 25 ? 'var(--danger)' : 'var(--text-secondary)', marginTop: '4px' }}>
                {stats.failRate}%
              </div>
            </div>
          </div>

          {/* Visual Distribution Bars */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
                <span>Biểu đồ Phân Bố Phổ Điểm (Click vào cột để lọc sinh viên)</span>
              </div>
              {selectedGroupFilter && (
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: '3px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => onSelectGroupFilter(null)}
                >
                  <RotateCcw size={12} />
                  <span>Xem toàn bộ sinh viên</span>
                </button>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '12px',
                alignItems: 'flex-end',
                minHeight: '140px',
                padding: '16px 12px 8px',
                background: 'var(--neutral-bg, rgba(0,0,0,0.02))',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}
            >
              {Object.keys(stats.groups).map((key) => {
                const grp = stats.groups[key];
                const isSelected = selectedGroupFilter === key;
                const pct = stats.gradedCount > 0 ? Math.round((grp.count / stats.gradedCount) * 100) : 0;
                const barHeight = stats.maxGroupCount > 0
                  ? Math.max(16, Math.round((grp.count / stats.maxGroupCount) * 80))
                  : 16;

                return (
                  <div
                    key={key}
                    onClick={() => {
                      if (isSelected) {
                        onSelectGroupFilter(null);
                      } else {
                        onSelectGroupFilter(key);
                      }
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: '8px 4px',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                      backgroundColor: isSelected ? grp.bg : 'transparent',
                      border: isSelected ? `2px solid ${grp.color}` : '2px solid transparent',
                      transform: isSelected ? 'scale(1.02)' : 'none',
                    }}
                    title={`Nhấn để ${isSelected ? 'bỏ lọc' : 'lọc'} nhóm ${grp.label}`}
                  >
                    {/* Count & Pct */}
                    <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '1rem', color: grp.color }}>
                        {grp.count}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '2px' }}>
                        ({pct}%)
                      </span>
                    </div>

                    {/* Bar visualization */}
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '48px',
                        height: `${barHeight}px`,
                        backgroundColor: grp.color,
                        borderRadius: '6px 6px 2px 2px',
                        opacity: isSelected ? 1 : 0.85,
                        transition: 'height 0.3s ease',
                      }}
                    />

                    {/* Group Label */}
                    <div style={{ marginTop: '8px', textAlign: 'center' }}>
                      <span className={`badge ${grp.badgeClass}`} style={{ fontSize: '0.75rem', padding: '2px 6px' }}>
                        {grp.shortLabel}
                      </span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                        {grp.scoreRange}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
