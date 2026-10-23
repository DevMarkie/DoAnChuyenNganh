export const GRADE_GROUPS = {
  A: {
    key: 'A',
    label: 'A / A+ (Xuất sắc - Giỏi)',
    shortLabel: 'A / A+',
    gpaRange: '3.7 - 4.0',
    scoreRange: '8.5 - 10.0',
    color: 'var(--purple, #8b5cf6)',
    bg: 'var(--purple-bg, rgba(139, 92, 246, 0.12))',
    border: 'rgba(139, 92, 246, 0.3)',
    badgeClass: 'badge-purple',
    match: (g) => {
      if (g.letterGrade === 'A+' || g.letterGrade === 'A') return true;
      if (g.totalScore != null) return Number(g.totalScore) >= 8.5;
      return false;
    },
  },
  B: {
    key: 'B',
    label: 'B / B+ (Khá)',
    shortLabel: 'B / B+',
    gpaRange: '3.0 - 3.5',
    scoreRange: '7.0 - 8.4',
    color: 'var(--primary, #3b82f6)',
    bg: 'var(--primary-light, rgba(59, 130, 246, 0.12))',
    border: 'rgba(59, 130, 246, 0.3)',
    badgeClass: 'badge-info',
    match: (g) => {
      if (g.letterGrade === 'B+' || g.letterGrade === 'B') return true;
      if (g.totalScore != null) {
        const s = Number(g.totalScore);
        return s >= 7.0 && s < 8.5;
      }
      return false;
    },
  },
  C: {
    key: 'C',
    label: 'C / C+ (Trung bình)',
    shortLabel: 'C / C+',
    gpaRange: '2.0 - 2.5',
    scoreRange: '5.5 - 6.9',
    color: 'var(--info, #0284c7)',
    bg: 'rgba(2, 132, 199, 0.1)',
    border: 'rgba(2, 132, 199, 0.3)',
    badgeClass: 'badge-neutral',
    match: (g) => {
      if (g.letterGrade === 'C+' || g.letterGrade === 'C') return true;
      if (g.totalScore != null) {
        const s = Number(g.totalScore);
        return s >= 5.5 && s < 7.0;
      }
      return false;
    },
  },
  D_PLUS: {
    key: 'D_PLUS',
    label: 'D+ (TB Yếu - Đạt ngưỡng)',
    shortLabel: 'D+',
    gpaRange: '1.5',
    scoreRange: '5.0 - 5.4',
    color: 'var(--warning, #eab308)',
    bg: 'var(--warning-bg, rgba(234, 179, 8, 0.12))',
    border: 'rgba(234, 179, 8, 0.35)',
    badgeClass: 'badge-warning',
    match: (g) => {
      if (g.letterGrade === 'D+') return true;
      if (g.totalScore != null) {
        const s = Number(g.totalScore);
        return s >= 5.0 && s < 5.5;
      }
      return false;
    },
  },
  FAIL: {
    key: 'FAIL',
    label: 'D / F / V (Chưa đạt - Học lại)',
    shortLabel: 'D / F / V',
    gpaRange: '0.0 - 1.0',
    scoreRange: '< 5.0',
    color: 'var(--danger, #ef4444)',
    bg: 'var(--danger-bg, rgba(239, 68, 68, 0.12))',
    border: 'rgba(239, 68, 68, 0.35)',
    badgeClass: 'badge-danger',
    match: (g) => {
      if (g.specialGrade === 'V') return true;
      if (g.letterGrade === 'F' || g.letterGrade === 'D') return true;
      if (g.totalScore != null) return Number(g.totalScore) < 5.0;
      return false;
    },
  },
};
