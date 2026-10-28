// Ánh xạ các giá trị enum của backend sang nhãn tiếng Việt hiển thị cho người dùng.
// Dùng chung để tránh mỗi trang tự map một kiểu (BUG-12, BUG-13).

const GENDER_LABELS = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
};

const STUDENT_STATUS_LABELS = {
  ACTIVE: 'Đang học',
  INACTIVE: 'Ngừng học',
  GRADUATED: 'Đã tốt nghiệp',
  SUSPENDED: 'Đình chỉ',
  RESERVED: 'Bảo lưu',
};

const TRAINING_RANK_LABELS = {
  XUAT_SAC: 'Xuất sắc',
  TOT: 'Tốt',
  KHA: 'Khá',
  TRUNG_BINH: 'Trung bình',
  YEU: 'Yếu',
  KEM: 'Kém',
};

const CONDUCT_TYPE_LABELS = {
  REWARD: 'Khen thưởng',
  DISCIPLINE: 'Kỷ luật',
};

/** Nhãn giới tính; trả về '—' khi chưa có dữ liệu, không suy đoán mặc định. */
export function genderLabel(value) {
  if (!value) return '—';
  return GENDER_LABELS[value] || value;
}

/** Nhãn trạng thái sinh viên theo enum ACTIVE/INACTIVE/GRADUATED/SUSPENDED/RESERVED. */
export function studentStatusLabel(value) {
  if (!value) return '—';
  return STUDENT_STATUS_LABELS[value] || value;
}

/** Class badge phù hợp cho từng trạng thái sinh viên. */
export function studentStatusBadgeClass(value) {
  switch (value) {
    case 'ACTIVE':
      return 'badge-success';
    case 'GRADUATED':
      return 'badge-info';
    case 'SUSPENDED':
      return 'badge-danger';
    case 'RESERVED':
      return 'badge-warning';
    default:
      return 'badge-neutral';
  }
}

export function trainingRankLabel(value) {
  if (!value) return '—';
  return TRAINING_RANK_LABELS[value] || value;
}

export function trainingRankBadgeClass(value) {
  switch (value) {
    case 'XUAT_SAC':
      return 'badge-primary';
    case 'TOT':
      return 'badge-success';
    case 'KHA':
      return 'badge-info';
    case 'TRUNG_BINH':
      return 'badge-warning';
    case 'YEU':
    case 'KEM':
      return 'badge-danger';
    default:
      return 'badge-neutral';
  }
}

export function conductTypeLabel(value) {
  if (!value) return '—';
  return CONDUCT_TYPE_LABELS[value] || value;
}

export function conductTypeBadgeClass(value) {
  return value === 'REWARD' ? 'badge-success' : 'badge-danger';
}
