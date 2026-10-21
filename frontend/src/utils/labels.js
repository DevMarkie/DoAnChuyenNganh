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
};

/** Nhãn giới tính; trả về '—' khi chưa có dữ liệu, không suy đoán mặc định. */
export function genderLabel(value) {
  if (!value) return '—';
  return GENDER_LABELS[value] || value;
}

/** Nhãn trạng thái sinh viên theo enum ACTIVE/INACTIVE/GRADUATED/SUSPENDED. */
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
    default:
      return 'badge-neutral';
  }
}
