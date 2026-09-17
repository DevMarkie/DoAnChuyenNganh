const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const collator = new Intl.Collator('vi', { sensitivity: 'base' });

// BCrypt hash for password "123456"
const BCRYPT_123456 = '$2a$10$s2ivIIT7Cjhf0iL2WrXiteC.rcBvNLSbPq2c3CwV38YrpDgh4h0wm';

// Real Vietnamese student names bank (First + Middle + Given)
const rawStudentNamesK18 = [
  // A
  { name: 'Nguyễn Văn An', gender: 'MALE', deptId: 1, classId: 1, dob: '2004-03-15' },
  { name: 'Trần Thùy An', gender: 'FEMALE', deptId: 1, classId: 1, dob: '2004-05-20' },
  { name: 'Bùi Đức Anh', gender: 'MALE', deptId: 1, classId: 1, dob: '2004-08-11' },
  { name: 'Dương Tuấn Anh', gender: 'MALE', deptId: 1, classId: 2, dob: '2004-01-25' },
  { name: 'Lê Quỳnh Anh', gender: 'FEMALE', deptId: 2, classId: 5, dob: '2004-11-09' },
  { name: 'Nguyễn Phương Anh', gender: 'FEMALE', deptId: 2, classId: 5, dob: '2004-09-14' },
  { name: 'Phạm Hoàng Anh', gender: 'MALE', deptId: 3, classId: 8, dob: '2004-07-03' },
  { name: 'Vũ Minh Anh', gender: 'MALE', deptId: 4, classId: 11, dob: '2004-04-19' },
  // B
  { name: 'Đỗ Xuân Bách', gender: 'MALE', deptId: 1, classId: 1, dob: '2004-06-30' },
  { name: 'Lê Gia Bảo', gender: 'MALE', deptId: 1, classId: 2, dob: '2004-10-12' },
  { name: 'Trần Quốc Bảo', gender: 'MALE', deptId: 3, classId: 8, dob: '2004-02-18' },
  { name: 'Nguyễn Thái Bình', gender: 'MALE', deptId: 2, classId: 5, dob: '2004-12-05' },
  // C
  { name: 'Hoàng Minh Châu', gender: 'FEMALE', deptId: 5, classId: 14, dob: '2004-07-22' },
  { name: 'Đặng Phương Chi', gender: 'FEMALE', deptId: 5, classId: 14, dob: '2004-03-29' },
  { name: 'Nguyễn Kim Chi', gender: 'FEMALE', deptId: 2, classId: 5, dob: '2004-09-08' },
  { name: 'Lê Đình Cường', gender: 'MALE', deptId: 1, classId: 1, dob: '2004-05-16' },
  { name: 'Phạm Hùng Cường', gender: 'MALE', deptId: 4, classId: 11, dob: '2004-08-24' },
  // D
  { name: 'Vũ Tiến Dũng', gender: 'MALE', deptId: 3, classId: 8, dob: '2004-04-07' },
  { name: 'Hoàng Quốc Duy', gender: 'MALE', deptId: 1, classId: 2, dob: '2004-01-08' },
  { name: 'Nguyễn Khánh Duy', gender: 'MALE', deptId: 1, classId: 2, dob: '2004-11-19' },
  { name: 'Trần Hải Dương', gender: 'MALE', deptId: 4, classId: 11, dob: '2004-06-11' },
  // Đ
  { name: 'Bùi Thành Đạt', gender: 'MALE', deptId: 1, classId: 1, dob: '2004-09-28' },
  { name: 'Lê Tuấn Đạt', gender: 'MALE', deptId: 3, classId: 8, dob: '2004-12-15' },
  { name: 'Đỗ Minh Đức', gender: 'MALE', deptId: 1, classId: 2, dob: '2004-02-03' },
  { name: 'Nguyễn Anh Đức', gender: 'MALE', deptId: 4, classId: 11, dob: '2004-10-21' },
  // G
  { name: 'Võ Hương Giang', gender: 'FEMALE', deptId: 2, classId: 5, dob: '2004-07-16' },
  { name: 'Trần Trường Giang', gender: 'MALE', deptId: 1, classId: 1, dob: '2004-04-02' },
  // H
  { name: 'Lê Thu Hà', gender: 'FEMALE', deptId: 5, classId: 14, dob: '2004-11-30' },
  { name: 'Phạm Việt Hà', gender: 'MALE', deptId: 1, classId: 2, dob: '2004-08-05' },
  { name: 'Đặng Thanh Hải', gender: 'MALE', deptId: 3, classId: 8, dob: '2004-05-14' },
  { name: 'Nguyễn Thu Hằng', gender: 'FEMALE', deptId: 2, classId: 5, dob: '2004-03-12' },
  { name: 'Trịnh Trung Hiếu', gender: 'MALE', deptId: 1, classId: 1, dob: '2004-09-02' },
  { name: 'Vũ Đức Hiệp', gender: 'MALE', deptId: 4, classId: 11, dob: '2004-01-17' },
  { name: 'Mai Thị Hoa', gender: 'FEMALE', deptId: 5, classId: 14, dob: '2004-10-25' },
  { name: 'Lê Đức Hoàng', gender: 'MALE', deptId: 1, classId: 2, dob: '2004-06-08' },
  { name: 'Bùi Quang Huy', gender: 'MALE', deptId: 3, classId: 8, dob: '2004-02-22' },
  { name: 'Nguyễn Văn Hùng', gender: 'MALE', deptId: 4, classId: 11, dob: '2004-05-14' },
  { name: 'Đỗ Thị Thu Hương', gender: 'FEMALE', deptId: 2, classId: 5, dob: '2004-08-19' },
  // K
  { name: 'Trần Duy Khánh', gender: 'MALE', deptId: 1, classId: 1, dob: '2004-12-01' },
  { name: 'Nguyễn Gia Khiêm', gender: 'MALE', deptId: 3, classId: 8, dob: '2004-07-29' },
  // L
  { name: 'Phạm Thùy Linh', gender: 'FEMALE', deptId: 5, classId: 14, dob: '2004-09-02' },
  { name: 'Đỗ Khánh Linh', gender: 'FEMALE', deptId: 2, classId: 5, dob: '2004-04-11' },
  { name: 'Vũ Bảo Long', gender: 'MALE', deptId: 1, classId: 2, dob: '2004-03-24' },
  { name: 'Nguyễn Hoàng Long', gender: 'MALE', deptId: 4, classId: 11, dob: '2004-11-06' },
  // M
  { name: 'Trần Phương Mai', gender: 'FEMALE', deptId: 5, classId: 14, dob: '2004-01-31' },
  { name: 'Lê Nhật Minh', gender: 'MALE', deptId: 1, classId: 1, dob: '2004-08-17' },
  { name: 'Phạm Quang Minh', gender: 'MALE', deptId: 3, classId: 8, dob: '2004-06-23' },
  // N
  { name: 'Trần Đức Nam', gender: 'MALE', deptId: 1, classId: 1, dob: '2004-04-18' },
  { name: 'Bùi Phương Nam', gender: 'MALE', deptId: 2, classId: 5, dob: '2004-10-09' },
  { name: 'Đặng Thanh Nga', gender: 'FEMALE', deptId: 5, classId: 14, dob: '2004-02-14' },
  { name: 'Nguyễn Thúy Ngân', gender: 'FEMALE', deptId: 2, classId: 5, dob: '2004-05-27' },
  { name: 'Vũ Minh Ngọc', gender: 'FEMALE', deptId: 5, classId: 14, dob: '2004-12-08' },
  { name: 'Lê Hồng Nhung', gender: 'FEMALE', deptId: 2, classId: 5, dob: '2004-07-04' },
  // P
  { name: 'Hoàng Vĩnh Phúc', gender: 'MALE', deptId: 1, classId: 2, dob: '2004-03-09' },
  { name: 'Đỗ Nam Phong', gender: 'MALE', deptId: 4, classId: 11, dob: '2004-09-17' },
  { name: 'Nguyễn Thu Phương', gender: 'FEMALE', deptId: 5, classId: 14, dob: '2004-06-15' },
  // Q
  { name: 'Trần Minh Quân', gender: 'MALE', deptId: 1, classId: 2, dob: '2004-01-13' },
  { name: 'Phạm Đăng Quang', gender: 'MALE', deptId: 3, classId: 8, dob: '2004-08-28' },
  // S
  { name: 'Vũ Thái Sơn', gender: 'MALE', deptId: 4, classId: 11, dob: '2004-11-22' },
  { name: 'Lê Hồng Sơn', gender: 'MALE', deptId: 1, classId: 1, dob: '2004-05-06' },
  // T
  { name: 'Bùi Thanh Tâm', gender: 'FEMALE', deptId: 2, classId: 5, dob: '2004-10-31' },
  { name: 'Đặng Phương Thảo', gender: 'FEMALE', deptId: 5, classId: 14, dob: '2004-02-09' },
  { name: 'Nguyễn Đức Thắng', gender: 'MALE', deptId: 3, classId: 8, dob: '2004-07-12' },
  { name: 'Trần Quốc Thịnh', gender: 'MALE', deptId: 4, classId: 11, dob: '2004-04-26' },
  { name: 'Phạm Huyền Trang', gender: 'FEMALE', deptId: 5, classId: 14, dob: '2004-08-14' },
  { name: 'Vũ Đức Trọng', gender: 'MALE', deptId: 1, classId: 2, dob: '2004-12-20' },
  { name: 'Lê Kiên Trung', gender: 'MALE', deptId: 3, classId: 8, dob: '2004-03-04' },
  { name: 'Hoàng Anh Tú', gender: 'MALE', deptId: 1, classId: 1, dob: '2004-09-11' },
  { name: 'Đỗ Minh Tuấn', gender: 'MALE', deptId: 4, classId: 11, dob: '2004-06-25' },
  // U, V, X, Y
  { name: 'Nguyễn Phương Uyên', gender: 'FEMALE', deptId: 2, classId: 5, dob: '2004-01-19' },
  { name: 'Trần Khánh Vân', gender: 'FEMALE', deptId: 5, classId: 14, dob: '2004-11-04' },
  { name: 'Bùi Tuấn Việt', gender: 'MALE', deptId: 1, classId: 2, dob: '2004-07-18' },
  { name: 'Đặng Quốc Vinh', gender: 'MALE', deptId: 3, classId: 8, dob: '2004-05-30' },
  { name: 'Lê Hoàng Vũ', gender: 'MALE', deptId: 4, classId: 11, dob: '2004-08-13' },
  { name: 'Phạm Thanh Xuân', gender: 'FEMALE', deptId: 2, classId: 5, dob: '2004-04-05' },
];

const rawStudentNamesK19 = [
  // A
  { name: 'Bùi Quang An', gender: 'MALE', deptId: 1, classId: 3, dob: '2005-02-14' },
  { name: 'Đỗ Bảo An', gender: 'FEMALE', deptId: 2, classId: 6, dob: '2005-05-18' },
  { name: 'Hoàng Bình An', gender: 'MALE', deptId: 3, classId: 9, dob: '2005-09-22' },
  { name: 'Nguyễn Nhật An', gender: 'MALE', deptId: 1, classId: 3, dob: '2005-11-07' },
  { name: 'Trần Diệu Anh', gender: 'FEMALE', deptId: 5, classId: 15, dob: '2005-04-29' },
  { name: 'Lê Tuấn Anh', gender: 'MALE', deptId: 1, classId: 4, dob: '2005-08-12' },
  { name: 'Phạm Mai Anh', gender: 'FEMALE', deptId: 2, classId: 7, dob: '2005-01-26' },
  { name: 'Vũ Quốc Anh', gender: 'MALE', deptId: 4, classId: 12, dob: '2005-07-03' },
  // B
  { name: 'Ngô Việt Bách', gender: 'MALE', deptId: 1, classId: 3, dob: '2005-03-10' },
  { name: 'Đặng Gia Bảo', gender: 'MALE', deptId: 3, classId: 10, dob: '2005-10-15' },
  { name: 'Nguyễn Hoài Bắc', gender: 'MALE', deptId: 4, classId: 13, dob: '2005-12-04' },
  { name: 'Trần Ngọc Bích', gender: 'FEMALE', deptId: 2, classId: 6, dob: '2005-06-21' },
  // C
  { name: 'Lê Minh Cường', gender: 'MALE', deptId: 1, classId: 4, dob: '2005-09-19' },
  { name: 'Bùi Mạnh Cường', gender: 'MALE', deptId: 3, classId: 9, dob: '2005-02-28' },
  { name: 'Vũ Bảo Châu', gender: 'FEMALE', deptId: 5, classId: 16, dob: '2005-11-14' },
  { name: 'Hoàng Linh Chi', gender: 'FEMALE', deptId: 2, classId: 7, dob: '2005-07-08' },
  // D
  { name: 'Nguyễn Tuấn Dũng', gender: 'MALE', deptId: 1, classId: 3, dob: '2005-04-16' },
  { name: 'Phạm Đức Duy', gender: 'MALE', deptId: 1, classId: 4, dob: '2005-08-01' },
  { name: 'Trần Quang Duy', gender: 'MALE', deptId: 4, classId: 12, dob: '2005-12-19' },
  { name: 'Đỗ Ánh Dương', gender: 'FEMALE', deptId: 5, classId: 15, dob: '2005-05-25' },
  // Đ
  { name: 'Lê Tấn Đạt', gender: 'MALE', deptId: 1, classId: 3, dob: '2005-01-11' },
  { name: 'Nguyễn Trọng Đạt', gender: 'MALE', deptId: 3, classId: 10, dob: '2005-06-09' },
  { name: 'Bùi Minh Đức', gender: 'MALE', deptId: 1, classId: 4, dob: '2005-10-30' },
  { name: 'Hoàng Việt Đức', gender: 'MALE', deptId: 4, classId: 13, dob: '2005-03-17' },
  // G
  { name: 'Phạm Quỳnh Giang', gender: 'FEMALE', deptId: 2, classId: 6, dob: '2005-07-23' },
  { name: 'Vũ Hoàng Giang', gender: 'MALE', deptId: 3, classId: 9, dob: '2005-09-05' },
  // H
  { name: 'Trần Thanh Hà', gender: 'FEMALE', deptId: 5, classId: 16, dob: '2005-02-06' },
  { name: 'Lê Tuấn Hải', gender: 'MALE', deptId: 1, classId: 3, dob: '2005-11-28' },
  { name: 'Nguyễn Đức Hải', gender: 'MALE', deptId: 4, classId: 12, dob: '2005-04-14' },
  { name: 'Đặng Thu Hằng', gender: 'FEMALE', deptId: 2, classId: 7, dob: '2005-08-30' },
  { name: 'Bùi Minh Hiếu', gender: 'MALE', deptId: 1, classId: 4, dob: '2005-06-02' },
  { name: 'Hoàng Lan Hoa', gender: 'FEMALE', deptId: 5, classId: 15, dob: '2005-12-12' },
  { name: 'Phạm Việt Hoàng', gender: 'MALE', deptId: 3, classId: 10, dob: '2005-03-27' },
  { name: 'Vũ Quốc Huy', gender: 'MALE', deptId: 1, classId: 3, dob: '2005-05-09' },
  { name: 'Trần Mạnh Hùng', gender: 'MALE', deptId: 4, classId: 13, dob: '2005-10-18' },
  { name: 'Lê Mai Hương', gender: 'FEMALE', deptId: 2, classId: 6, dob: '2005-01-05' },
  // K
  { name: 'Nguyễn Quốc Khánh', gender: 'MALE', deptId: 1, classId: 4, dob: '2005-09-13' },
  { name: 'Đỗ Gia Khiêm', gender: 'MALE', deptId: 3, classId: 9, dob: '2005-07-17' },
  { name: 'Phan Tuấn Kiệt', gender: 'MALE', deptId: 4, classId: 12, dob: '2005-04-03' },
  // L
  { name: 'Bùi Diệu Linh', gender: 'FEMALE', deptId: 5, classId: 15, dob: '2005-08-25' },
  { name: 'Hoàng Phương Linh', gender: 'FEMALE', deptId: 2, classId: 7, dob: '2005-11-02' },
  { name: 'Trần Đình Long', gender: 'MALE', deptId: 1, classId: 3, dob: '2005-03-31' },
  { name: 'Lê Phi Long', gender: 'MALE', deptId: 3, classId: 10, dob: '2005-06-16' },
  // M
  { name: 'Vũ Thanh Mai', gender: 'FEMALE', deptId: 5, classId: 16, dob: '2005-10-08' },
  { name: 'Nguyễn Quang Minh', gender: 'MALE', deptId: 1, classId: 4, dob: '2005-02-21' },
  { name: 'Phạm Hoàng Minh', gender: 'MALE', deptId: 2, classId: 6, dob: '2005-12-07' },
  // N
  { name: 'Đặng Hải Nam', gender: 'MALE', deptId: 1, classId: 3, dob: '2005-05-15' },
  { name: 'Trần Hoài Nam', gender: 'MALE', deptId: 4, classId: 13, dob: '2005-07-29' },
  { name: 'Lê Thúy Nga', gender: 'FEMALE', deptId: 5, classId: 15, dob: '2005-01-18' },
  { name: 'Bùi Bích Ngân', gender: 'FEMALE', deptId: 2, classId: 7, dob: '2005-09-24' },
  { name: 'Hoàng Bảo Ngọc', gender: 'FEMALE', deptId: 5, classId: 16, dob: '2005-04-07' },
  { name: 'Nguyễn Ánh Nguyệt', gender: 'FEMALE', deptId: 2, classId: 6, dob: '2005-08-14' },
  { name: 'Phạm Cẩm Nhung', gender: 'FEMALE', deptId: 2, classId: 7, dob: '2005-11-20' },
  // P
  { name: 'Vũ Thiên Phúc', gender: 'MALE', deptId: 1, classId: 4, dob: '2005-03-08' },
  { name: 'Trần Thanh Phong', gender: 'MALE', deptId: 3, classId: 9, dob: '2005-06-27' },
  { name: 'Lê Bích Phương', gender: 'FEMALE', deptId: 5, classId: 15, dob: '2005-10-11' },
  // Q
  { name: 'Đỗ Anh Quân', gender: 'MALE', deptId: 1, classId: 3, dob: '2005-01-24' },
  { name: 'Bùi Nhật Quang', gender: 'MALE', deptId: 4, classId: 12, dob: '2005-05-02' },
  // S
  { name: 'Nguyễn Trường Sơn', gender: 'MALE', deptId: 3, classId: 10, dob: '2005-09-16' },
  { name: 'Hoàng Nam Sơn', gender: 'MALE', deptId: 1, classId: 4, dob: '2005-12-25' },
  // T
  { name: 'Phạm Minh Tâm', gender: 'MALE', deptId: 2, classId: 6, dob: '2005-04-19' },
  { name: 'Vũ Thu Thảo', gender: 'FEMALE', deptId: 5, classId: 16, dob: '2005-07-11' },
  { name: 'Trần Chiến Thắng', gender: 'MALE', deptId: 1, classId: 3, dob: '2005-02-03' },
  { name: 'Lê Phúc Thịnh', gender: 'MALE', deptId: 4, classId: 13, dob: '2005-08-22' },
  { name: 'Đặng Kiều Trang', gender: 'FEMALE', deptId: 2, classId: 7, dob: '2005-11-17' },
  { name: 'Bùi Đình Trọng', gender: 'MALE', deptId: 3, classId: 9, dob: '2005-03-14' },
  { name: 'Hoàng Quang Trung', gender: 'MALE', deptId: 1, classId: 4, dob: '2005-06-05' },
  { name: 'Nguyễn Cẩm Tú', gender: 'FEMALE', deptId: 5, classId: 15, dob: '2005-10-29' },
  { name: 'Phạm Anh Tuấn', gender: 'MALE', deptId: 4, classId: 12, dob: '2005-01-09' },
  // U, V, X, Y
  { name: 'Vũ Thảo Uyên', gender: 'FEMALE', deptId: 2, classId: 6, dob: '2005-05-31' },
  { name: 'Trần Tường Vân', gender: 'FEMALE', deptId: 5, classId: 16, dob: '2005-09-08' },
  { name: 'Lê Hoàng Việt', gender: 'MALE', deptId: 1, classId: 3, dob: '2005-12-14' },
  { name: 'Đỗ Quang Vinh', gender: 'MALE', deptId: 3, classId: 10, dob: '2005-04-26' },
  { name: 'Nguyễn Đăng Vũ', gender: 'MALE', deptId: 4, classId: 13, dob: '2005-07-06' },
  { name: 'Bùi Kim Yến', gender: 'FEMALE', deptId: 5, classId: 15, dob: '2005-11-03' },
];

// Helper to get sort key by Vietnamese given name (last word) then rest of name
function getSortKey(fullName) {
  const parts = fullName.trim().split(/\s+/);
  const given = parts[parts.length - 1];
  const rest = parts.slice(0, -1).join(' ');
  return { given, rest, full: `${given} ${rest}` };
}

function sortVietnamese(list) {
  return [...list].sort((a, b) => {
    const keyA = getSortKey(a.name);
    const keyB = getSortKey(b.name);
    const cmpGiven = collator.compare(keyA.given, keyB.given);
    if (cmpGiven !== 0) return cmpGiven;
    return collator.compare(keyA.rest, keyB.rest);
  });
}

// Realistic Vietnamese Addresses
const hanoiAddresses = [
  'Số 15, Ngõ 68 Triều Khúc, Thanh Xuân, Hà Nội',
  'Số 42 Đường Quang Trung, Hà Đông, Hà Nội',
  'Số 88 Phố Chùa Láng, Đống Đa, Hà Nội',
  'Số 102 Đường Trần Phú, Hà Đông, Hà Nội',
  'Số 25 Phố Nguyễn Trãi, Thanh Xuân, Hà Nội',
  'Số 56 Đường Cầu Giấy, Cầu Giấy, Hà Nội',
  'Số 79 Đường Xuân Thủy, Cầu Giấy, Hà Nội',
  'Số 14 Phố Hoàng Diệu, Ba Đình, Hà Nội',
  'Số 33 Đường Giải Phóng, Hai Bà Trưng, Hà Nội',
  'Số 68 Đường Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
  'Số 120 Đường Lê Trọng Tấn, Hà Đông, Hà Nội',
  'Số 45 Phố Vạn Phúc, Hà Đông, Hà Nội',
  'Số 18 Đường Tố Hữu, Nam Từ Liêm, Hà Nội',
  'Số 92 Đường Hồ Tùng Mậu, Cầu Giấy, Hà Nội',
  'Số 30 Phố Tây Sơn, Đống Đa, Hà Nội',
  'Số 55 Đường Phạm Văn Đồng, Bắc Từ Liêm, Hà Nội',
  'Số 73 Đường Nguyễn Xiển, Thanh Xuân, Hà Nội',
  'Số 21 Phố Vũ Trọng Phụng, Thanh Xuân, Hà Nội',
  'Số 64 Đường Kim Mã, Ba Đình, Hà Nội',
  'Số 108 Đường Láng, Đống Đa, Hà Nội'
];

function generateSeedSql() {
  const sortedK18 = sortVietnamese(rawStudentNamesK18);
  const sortedK19 = sortVietnamese(rawStudentNamesK19);

  let sql = `-- ============================================================
-- STUDENT MANAGEMENT SYSTEM (SMS)
-- SEED DATA - Dữ liệu mẫu chuẩn UTF-8
-- ============================================================
-- Password mặc định: 123456 (BCrypt hash)
-- Quy tắc mã sinh viên theo niên khóa:
--   K19 (nhập học 2026): 2600001 -> 2600075 (xếp theo tên gọi A-Z)
--   K18 (nhập học 2025): 2500001 -> 2500075 (xếp theo tên gọi A-Z)

USE student_management;
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Tắt kiểm tra khóa ngoại khi import
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE grades;
TRUNCATE TABLE schedules;
TRUNCATE TABLE enrollments;
TRUNCATE TABLE course_sections;
TRUNCATE TABLE subjects;
TRUNCATE TABLE lecturers;
TRUNCATE TABLE students;
TRUNCATE TABLE classes;
TRUNCATE TABLE departments;
TRUNCATE TABLE semesters;
TRUNCATE TABLE users;
TRUNCATE TABLE roles;

-- ============================================================
-- 1. ROLES
-- ============================================================
INSERT INTO roles (id, name) VALUES 
(1, 'ADMIN'), 
(2, 'LECTURER'), 
(3, 'STUDENT');

-- ============================================================
-- 2. DEPARTMENTS (5 khoa)
-- ============================================================
INSERT INTO departments (id, code, name, description) VALUES
(1, 'CNTT', 'Công nghệ thông tin', 'Khoa Công nghệ thông tin - Đào tạo CNTT, KTPM, HTTT, MMT'),
(2, 'QTKD', 'Quản trị kinh doanh', 'Khoa Quản trị kinh doanh - Đào tạo QTKD, Marketing, TMĐT'),
(3, 'DIEN', 'Điện - Điện tử', 'Khoa Điện - Điện tử - Đào tạo Điện tử viễn thông, Tự động hóa'),
(4, 'COKHI', 'Cơ khí', 'Khoa Cơ khí - Đào tạo Cơ khí chế tạo, Cơ điện tử, Kỹ thuật Ô tô'),
(5, 'NGOAINGU', 'Ngoại ngữ', 'Khoa Ngoại ngữ - Đào tạo Tiếng Anh thương mại, Tiếng Nhật');

-- ============================================================
-- 3. CLASSES (16 lớp hành chính)
-- ============================================================
INSERT INTO classes (id, code, name, department_id, academic_year) VALUES
-- CNTT (Khoa 1)
(1,  'K18-SE1',  'Kỹ thuật phần mềm 1 - K18',  1, 'K18'),
(2,  'K18-SE2',  'Kỹ thuật phần mềm 2 - K18',  1, 'K18'),
(3,  'K19-SE1',  'Kỹ thuật phần mềm 1 - K19',  1, 'K19'),
(4,  'K19-SE2',  'Kỹ thuật phần mềm 2 - K19',  1, 'K19'),
-- QTKD (Khoa 2)
(5,  'K18-BA1',  'Quản trị kinh doanh 1 - K18', 2, 'K18'),
(6,  'K19-BA1',  'Quản trị kinh doanh 1 - K19', 2, 'K19'),
(7,  'K19-MKT1', 'Marketing 1 - K19',          2, 'K19'),
-- Điện (Khoa 3)
(8,  'K18-EE1',  'Điện tử viễn thông 1 - K18', 3, 'K18'),
(9,  'K19-EE1',  'Điện tử viễn thông 1 - K19', 3, 'K19'),
(10, 'K19-EE2',  'Điện tử viễn thông 2 - K19', 3, 'K19'),
-- Cơ khí (Khoa 4)
(11, 'K18-ME1',  'Cơ khí chế tạo 1 - K18',     4, 'K18'),
(12, 'K19-ME1',  'Cơ điện tử 1 - K19',         4, 'K19'),
(13, 'K19-ME2',  'Kỹ thuật ô tô 1 - K19',      4, 'K19'),
-- Ngoại ngữ (Khoa 5)
(14, 'K18-ENG1', 'Ngôn ngữ Anh 1 - K18',       5, 'K18'),
(15, 'K19-ENG1', 'Ngôn ngữ Anh 1 - K19',       5, 'K19'),
(16, 'K19-JAP1', 'Ngôn ngữ Nhật 1 - K19',      5, 'K19');

-- ============================================================
-- 4. USERS - ADMIN & LECTURERS
-- ============================================================
INSERT INTO users (id, username, password, email, role_id, is_active) VALUES
(1, 'admin', '${BCRYPT_123456}', 'admin@sms.edu.vn', 1, TRUE),
(2,  '1000001', '${BCRYPT_123456}', '1000001@sms.edu.vn', 2, TRUE),
(3,  '1000002', '${BCRYPT_123456}', '1000002@sms.edu.vn', 2, TRUE),
(4,  '1000003', '${BCRYPT_123456}', '1000003@sms.edu.vn', 2, TRUE),
(5,  '1000004', '${BCRYPT_123456}', '1000004@sms.edu.vn', 2, TRUE),
(6,  '1000005', '${BCRYPT_123456}', '1000005@sms.edu.vn', 2, TRUE),
(7,  '1000006', '${BCRYPT_123456}', '1000006@sms.edu.vn', 2, TRUE),
(8,  '1000007', '${BCRYPT_123456}', '1000007@sms.edu.vn', 2, TRUE),
(9,  '1000008', '${BCRYPT_123456}', '1000008@sms.edu.vn', 2, TRUE),
(10, '1000009', '${BCRYPT_123456}', '1000009@sms.edu.vn', 2, TRUE),
(11, '1000010', '${BCRYPT_123456}', '1000010@sms.edu.vn', 2, TRUE),
(12, '1000011', '${BCRYPT_123456}', '1000011@sms.edu.vn', 2, TRUE),
(13, '1000012', '${BCRYPT_123456}', '1000012@sms.edu.vn', 2, TRUE),
(14, '1000013', '${BCRYPT_123456}', '1000013@sms.edu.vn', 2, TRUE),
(15, '1000014', '${BCRYPT_123456}', '1000014@sms.edu.vn', 2, TRUE),
(16, '1000015', '${BCRYPT_123456}', '1000015@sms.edu.vn', 2, TRUE);

-- ============================================================
-- 5. LECTURERS (15 giảng viên với tên thật và học hàm, học vị)
-- ============================================================
INSERT INTO lecturers (id, user_id, lecturer_code, full_name, date_of_birth, gender, email, phone, department_id, degree, specialization) VALUES
(1,  2,  '1000001', 'TS. Nguyễn Hoàng Long',   '1980-04-12', 'MALE',   '1000001@sms.edu.vn', '0912345001', 1, 'TS',     'Kỹ thuật phần mềm & Kiến trúc hệ thống'),
(2,  3,  '1000002', 'ThS. Trần Thị Mai',       '1985-08-23', 'FEMALE', '1000002@sms.edu.vn', '0912345002', 1, 'ThS',    'Cơ sở dữ liệu & Phân tích dữ liệu'),
(3,  4,  '1000003', 'PGS.TS. Lê Văn Thắng',    '1975-11-15', 'MALE',   '1000003@sms.edu.vn', '0912345003', 1, 'PGS.TS', 'Trí tuệ nhân tạo & Mạng máy tính'),
(4,  5,  '1000004', 'TS. Vũ Quốc Cường',       '1982-01-20', 'MALE',   '1000004@sms.edu.vn', '0912345004', 2, 'TS',     'Quản trị chiến lược & Kinh tế số'),
(5,  6,  '1000005', 'ThS. Đỗ Thị Thu Trang',   '1988-06-14', 'FEMALE', '1000005@sms.edu.vn', '0912345005', 2, 'ThS',    'Marketing số & Thương mại điện tử'),
(6,  7,  '1000006', 'TS. Hoàng Minh Tuấn',     '1979-09-30', 'MALE',   '1000006@sms.edu.vn', '0912345006', 2, 'TS',     'Tài chính doanh nghiệp & Kế toán'),
(7,  8,  '1000007', 'PGS.TS. Phạm Đình Huy',   '1976-03-25', 'MALE',   '1000007@sms.edu.vn', '0912345007', 3, 'PGS.TS', 'Điện tử viễn thông & Xử lý tín hiệu'),
(8,  9,  '1000008', 'ThS. Bùi Thị Thu Hương',  '1987-12-05', 'FEMALE', '1000008@sms.edu.vn', '0912345008', 3, 'ThS',    'Hệ thống nhúng & IoT'),
(9,  10, '1000009', 'TS. Nguyễn Tuấn Anh',     '1983-07-19', 'MALE',   '1000009@sms.edu.vn', '0912345009', 3, 'TS',     'Điều khiển tự động & Robot học'),
(10, 11, '1000010', 'TS. Đặng Việt Hùng',      '1981-05-18', 'MALE',   '1000010@sms.edu.vn', '0912345010', 4, 'TS',     'Cơ khí chính xác & Chế tạo máy'),
(11, 12, '1000011', 'ThS. Lê Quang Hải',       '1986-10-09', 'MALE',   '1000011@sms.edu.vn', '0912345011', 4, 'ThS',    'Kỹ thuật ô tô & Động lực học'),
(12, 13, '1000012', 'ThS. Nguyễn Đức Thành',   '1989-02-27', 'MALE',   '1000012@sms.edu.vn', '0912345012', 4, 'ThS',    'Cơ điện tử & Thiết kế CAD/CAM'),
(13, 14, '1000013', 'TS. Nguyễn Quỳnh Chi',    '1984-04-03', 'FEMALE', '1000013@sms.edu.vn', '0912345013', 5, 'TS',     'Ngôn ngữ học ứng dụng & Tiếng Anh'),
(14, 15, '1000014', 'ThS. Hoàng Ngọc Ánh',     '1990-11-12', 'FEMALE', '1000014@sms.edu.vn', '0912345014', 5, 'ThS',    'Tiếng Anh thương mại & Biên phiên dịch'),
(15, 16, '1000015', 'ThS. Lê Thị Thanh Nga',   '1987-08-16', 'FEMALE', '1000015@sms.edu.vn', '0912345015', 5, 'ThS',    'Ngôn ngữ & Văn hóa Nhật Bản');

-- ============================================================
-- 6. SUBJECTS (21 môn học)
-- ============================================================
INSERT INTO subjects (id, subject_code, subject_name, credits, description, department_id) VALUES
-- CNTT (Khoa 1)
(1,  'IT101', 'Nhập môn lập trình',          3, 'Nguyên lý lập trình căn bản với C/C++', 1),
(2,  'IT201', 'Lập trình Java nâng cao',     3, 'Lập trình hướng đối tượng và phát triển ứng dụng Java', 1),
(3,  'IT202', 'Cơ sở dữ liệu',               3, 'Mô hình quan hệ, thiết kế CSDL và truy vấn SQL', 1),
(4,  'IT203', 'Cấu trúc dữ liệu & Giải thuật',3, 'Các cấu trúc dữ liệu căn bản và giải thuật tối ưu', 1),
(5,  'IT301', 'Phát triển ứng dụng Web',     3, 'Frontend ReactJS và Backend RESTful API Spring Boot', 1),
(6,  'IT302', 'Mạng máy tính',               3, 'Kiến trúc TCP/IP, định tuyến và an toàn thông tin', 1),
(7,  'IT303', 'Trí tuệ nhân tạo căn bản',    3, 'Học máy căn bản, xử lý ngôn ngữ tự nhiên và thị giác máy', 1),
(8,  'IT304', 'Kỹ thuật phần mềm',           3, 'Quy trình phát triển phần mềm, Scrum/Agile, kiểm thử và CI/CD', 1),
-- QTKD (Khoa 2)
(9,  'BA101', 'Nguyên lý quản trị',          3, 'Các chức năng quản trị trong doanh nghiệp hiện đại', 2),
(10, 'BA102', 'Kinh tế vi mô',               3, 'Cung cầu, thị trường và hành vi người tiêu dùng', 2),
(11, 'BA201', 'Quản trị Marketing',          3, 'Nghiên cứu thị trường, chiến lược 4P và Digital Marketing', 2),
(12, 'BA202', 'Kế toán tài chính',           3, 'Hạch toán kế toán, lập báo cáo tài chính doanh nghiệp', 2),
-- Điện (Khoa 3)
(13, 'EE101', 'Kỹ thuật điện đại cương',     3, 'Mạch điện một chiều, xoay chiều và máy điện', 3),
(14, 'EE201', 'Mạch điện tử và vi xử lý',    4, 'Linh kiện bán dẫn, vi điều khiển ARM và thiết kế mạch', 3),
(15, 'EE202', 'Hệ thống điều khiển tự động', 3, 'Lý thuyết điều khiển tuyến tính và bộ điều khiển PID', 3),
-- Cơ khí (Khoa 4)
(16, 'ME101', 'Cơ học kỹ thuật',             3, 'Tĩnh học, động học và động lực học cơ cấu máy', 4),
(17, 'ME201', 'Vẽ kỹ thuật và CAD cơ khí',   3, 'Tiêu chuẩn bản vẽ và thiết kế mô hình 3D trên SolidWorks', 4),
(18, 'ME202', 'Kỹ thuật động cơ ô tô',       4, 'Cấu tạo, nguyên lý hoạt động và chẩn đoán động cơ ô tô', 4),
-- Ngoại ngữ (Khoa 5)
(19, 'EN101', 'Tiếng Anh giao tiếp 1',       2, 'Kỹ năng nghe nói tiếng Anh giao tiếp chuẩn học thuật', 5),
(20, 'EN201', 'Tiếng Anh chuyên ngành',      3, 'Thuật ngữ chuyên môn và kỹ năng đọc dịch tài liệu kỹ thuật', 5),
(21, 'JA101', 'Tiếng Nhật căn bản 1',        3, 'Bảng chữ cái Hiragana, Katakana và giao tiếp sơ cấp', 5);

-- ============================================================
-- 7. SEMESTERS (3 học kỳ)
-- ============================================================
INSERT INTO semesters (id, semester_code, semester_name, academic_year, semester_number, start_date, end_date, registration_start, registration_end, is_current, status) VALUES
(1, 'HK1-2025', 'Học kỳ 1 (2025-2026)', '2025-2026', 1, '2025-09-01', '2026-01-15', '2025-08-15', '2025-08-30', FALSE, 'COMPLETED'),
(2, 'HK2-2025', 'Học kỳ 2 (2025-2026)', '2025-2026', 2, '2026-02-01', '2026-06-30', '2026-01-15', '2026-01-28', FALSE, 'COMPLETED'),
(3, 'HK1-2026', 'Học kỳ 1 (2026-2027)', '2026-2027', 1, '2026-09-01', '2027-01-15', '2026-08-15', '2026-08-31', TRUE,  'ACTIVE');

-- ============================================================
-- 8. COURSE SECTIONS (24 lớp học phần)
-- ============================================================
INSERT INTO course_sections (id, section_code, subject_id, lecturer_id, semester_id, max_students, enrolled_count, schedule, room, status) VALUES
-- HK1-2025 (Kỳ đã hoàn thành)
(1,  'IT101-01-HK1-25', 1,  1, 1, 45, 0, 'Thứ Hai (07:00-09:30)', 'A101', 'CLOSED'),
(2,  'IT201-01-HK1-25', 2,  2, 1, 45, 0, 'Thứ Tư (09:35-12:05)', 'A102', 'CLOSED'),
(3,  'IT202-01-HK1-25', 3,  3, 1, 45, 0, 'Thứ Sáu (07:00-09:30)', 'A103', 'CLOSED'),
(4,  'BA101-01-HK1-25', 9,  4, 1, 45, 0, 'Thứ Ba (13:20-15:50)', 'B201', 'CLOSED'),
(5,  'EE101-01-HK1-25', 13, 7, 1, 40, 0, 'Thứ Hai (13:20-15:50)', 'C101', 'CLOSED'),
(6,  'ME101-01-HK1-25', 16, 10, 1, 40, 0, 'Thứ Ba (07:00-09:30)', 'D101', 'CLOSED'),
(7,  'EN101-01-HK1-25', 19, 13, 1, 40, 0, 'Thứ Năm (07:00-08:35)', 'C301', 'CLOSED'),

-- HK2-2025 (Kỳ đã hoàn thành)
(8,  'IT203-01-HK2-25', 4,  1, 2, 45, 0, 'Thứ Ba (07:00-09:30)', 'A101', 'CLOSED'),
(9,  'IT302-01-HK2-25', 6,  3, 2, 45, 0, 'Thứ Năm (09:35-12:05)', 'A102', 'CLOSED'),
(10, 'BA102-01-HK2-25', 10, 5, 2, 45, 0, 'Thứ Tư (13:20-15:50)', 'B202', 'CLOSED'),
(11, 'EE201-01-HK2-25', 14, 8, 2, 40, 0, 'Thứ Sáu (07:00-10:20)', 'C102', 'CLOSED'),
(12, 'ME201-01-HK2-25', 17, 12, 2, 40, 0, 'Thứ Hai (13:20-15:50)', 'D102', 'CLOSED'),
(13, 'EN201-01-HK2-25', 20, 14, 2, 40, 0, 'Thứ Tư (07:00-09:30)', 'C302', 'CLOSED'),

-- HK1-2026 (Kỳ HIỆN TẠI - ĐANG HỌC)
(14, 'IT301-01-HK1-26', 5,  1, 3, 50, 0, 'Thứ Hai (07:00-09:30)', 'A101', 'OPEN'),
(15, 'IT304-01-HK1-26', 8,  2, 3, 50, 0, 'Thứ Tư (09:35-12:05)', 'A102', 'OPEN'),
(16, 'IT303-01-HK1-26', 7,  3, 3, 45, 0, 'Thứ Hai (13:20-15:50)', 'A103', 'OPEN'),
(17, 'IT101-01-HK1-26', 1,  1, 3, 50, 0, 'Thứ Tư (07:00-09:30)', 'A104', 'OPEN'),
(18, 'IT101-02-HK1-26', 1,  2, 3, 50, 0, 'Thứ Sáu (07:00-09:30)', 'A105', 'OPEN'),
(19, 'BA201-01-HK1-26', 11, 4, 3, 45, 0, 'Thứ Ba (07:00-09:30)', 'B201', 'OPEN'),
(20, 'BA202-01-HK1-26', 12, 6, 3, 45, 0, 'Thứ Năm (09:35-12:05)', 'B202', 'OPEN'),
(21, 'EE202-01-HK1-26', 15, 9, 3, 40, 0, 'Thứ Ba (13:20-15:50)', 'C101', 'OPEN'),
(22, 'ME202-01-HK1-26', 18, 11, 3, 40, 0, 'Thứ Tư (13:20-16:45)', 'D101', 'OPEN'),
(23, 'JA101-01-HK1-26', 21, 15, 3, 40, 0, 'Thứ Sáu (13:20-15:50)', 'C301', 'OPEN'),
(24, 'EN101-01-HK1-26', 19, 14, 3, 45, 0, 'Thứ Hai (09:35-11:15)', 'C302', 'OPEN');
\n`;

  // Generate 150 Students (75 for K18 and 75 for K19)
  sql += `-- ============================================================
-- 9. USERS CHO SINH VIÊN (150 tài khoản sinh viên)
-- ============================================================
INSERT INTO users (id, username, password, email, role_id, is_active) VALUES\n`;

  const userValues = [];
  let currentUserId = 17; // After admin (1) and 15 lecturers (2..16)

  // K18: student_code 2500001 -> 2500075
  const studentsK18Data = [];
  sortedK18.forEach((s, idx) => {
    const codeNum = String(idx + 1).padStart(5, '0');
    const studentCode = `25${codeNum}`;
    const email = `${studentCode}@sv.sms.edu.vn`;
    const userId = currentUserId++;
    userValues.push(`(${userId}, '${studentCode}', '${BCRYPT_123456}', '${email}', 3, TRUE)`);
    studentsK18Data.push({
      ...s,
      userId,
      studentCode,
      email,
      studentId: idx + 1 // 1..75
    });
  });

  // K19: student_code 2600001 -> 2600075
  const studentsK19Data = [];
  sortedK19.forEach((s, idx) => {
    const codeNum = String(idx + 1).padStart(5, '0');
    const studentCode = `26${codeNum}`;
    const email = `${studentCode}@sv.sms.edu.vn`;
    const userId = currentUserId++;
    userValues.push(`(${userId}, '${studentCode}', '${BCRYPT_123456}', '${email}', 3, TRUE)`);
    studentsK19Data.push({
      ...s,
      userId,
      studentCode,
      email,
      studentId: 75 + idx + 1 // 76..150
    });
  });

  sql += userValues.join(',\n') + ';\n\n';

  // Insert into students table
  sql += `-- ============================================================
-- 10. STUDENTS (150 sinh viên với họ tên tiếng Việt chuẩn)
-- ============================================================
INSERT INTO students (id, user_id, student_code, full_name, date_of_birth, gender, email, phone, address, class_id, status) VALUES\n`;

  const allStudents = [...studentsK18Data, ...studentsK19Data];
  const studentValues = allStudents.map((s, idx) => {
    const phoneNum = `0912${String(100000 + idx + 1).slice(1)}`;
    const address = hanoiAddresses[idx % hanoiAddresses.length];
    // Set 1-2 edge statuses for testing realism
    let status = 'ACTIVE';
    if (s.studentId === 70) status = 'SUSPENDED';
    if (s.studentId === 74) status = 'GRADUATED';
    return `(${s.studentId}, ${s.userId}, '${s.studentCode}', '${s.name}', '${s.dob}', '${s.gender}', '${s.email}', '${phoneNum}', '${address}', ${s.classId}, '${status}')`;
  });

  sql += studentValues.join(',\n') + ';\n\n';

  // Enrollments and Grades
  sql += `-- ============================================================
-- 11. ENROLLMENTS & GRADES
-- ============================================================
INSERT INTO enrollments (id, student_id, section_id, enrolled_at, status) VALUES\n`;

  const enrollmentValues = [];
  const gradeValues = [];
  let enrollmentId = 1;
  let gradeId = 1;

  // Grade helper
  function makeGrade(enrId, cc, gk, ck, isFinalized) {
    const total = +(cc * 0.1 + gk * 0.3 + ck * 0.6).toFixed(2);
    let letter = 'F';
    let gpa = 0.0;
    if (total >= 8.5) { letter = 'A'; gpa = 4.0; }
    else if (total >= 8.0) { letter = 'B+'; gpa = 3.5; }
    else if (total >= 7.0) { letter = 'B'; gpa = 3.0; }
    else if (total >= 6.5) { letter = 'C+'; gpa = 2.5; }
    else if (total >= 5.5) { letter = 'C'; gpa = 2.0; }
    else if (total >= 5.0) { letter = 'D+'; gpa = 1.5; }
    else if (total >= 4.0) { letter = 'D'; gpa = 1.0; }

    return `(${gradeId++}, ${enrId}, ${cc.toFixed(1)}, ${gk.toFixed(1)}, ${ck.toFixed(1)}, ${total.toFixed(2)}, '${letter}', ${gpa.toFixed(2)}, ${isFinalized ? 'TRUE' : 'FALSE'})`;
  }

  // 11.1: Past semester HK1-2025 for K18
  // Sections 1, 2, 3 for CNTT students (classes 1, 2)
  // Section 4 for QTKD students (class 5)
  // Section 5 for DIEN students (class 8)
  // Section 6 for COKHI students (class 11)
  // Section 7 for NGOAINGU students (class 14)
  studentsK18Data.forEach((s) => {
    let sections = [];
    if (s.deptId === 1) sections = [1, 2, 3]; // IT101, IT201, IT202
    else if (s.deptId === 2) sections = [4, 7]; // BA101, EN101
    else if (s.deptId === 3) sections = [5, 1]; // EE101, IT101
    else if (s.deptId === 4) sections = [6, 7]; // ME101, EN101
    else if (s.deptId === 5) sections = [7, 4]; // EN101, BA101

    sections.forEach(secId => {
      const eid = enrollmentId++;
      enrollmentValues.push(`(${eid}, ${s.studentId}, ${secId}, '2025-08-20 09:00:00', 'COMPLETED')`);
      const cc = 8.0 + (s.studentId * 3 % 20) / 10; // 8.0 -> 9.9
      const gk = 6.5 + (s.studentId * 7 % 30) / 10; // 6.5 -> 9.4
      const ck = 6.0 + (s.studentId * 11 % 38) / 10; // 6.0 -> 9.7
      gradeValues.push(makeGrade(eid, cc, gk, ck, true));
    });
  });

  // 11.2: Past semester HK2-2025 for K18
  studentsK18Data.forEach((s) => {
    let sections = [];
    if (s.deptId === 1) sections = [8, 9]; // IT203, IT302
    else if (s.deptId === 2) sections = [10, 13]; // BA102, EN201
    else if (s.deptId === 3) sections = [11, 13]; // EE201, EN201
    else if (s.deptId === 4) sections = [12, 13]; // ME201, EN201
    else if (s.deptId === 5) sections = [13, 10]; // EN201, BA102

    sections.forEach(secId => {
      const eid = enrollmentId++;
      enrollmentValues.push(`(${eid}, ${s.studentId}, ${secId}, '2026-01-20 09:00:00', 'COMPLETED')`);
      const cc = 8.5 + (s.studentId * 5 % 15) / 10;
      const gk = 7.0 + (s.studentId * 3 % 25) / 10;
      const ck = 6.5 + (s.studentId * 9 % 32) / 10;
      gradeValues.push(makeGrade(eid, cc, gk, ck, true));
    });
  });

  // 11.3: Active semester HK1-2026 for K18 (advanced subjects)
  studentsK18Data.forEach((s) => {
    let sections = [];
    if (s.deptId === 1) sections = [14, 15, 16]; // IT301, IT304, IT303
    else if (s.deptId === 2) sections = [19, 20]; // BA201, BA202
    else if (s.deptId === 3) sections = [21];     // EE202
    else if (s.deptId === 4) sections = [22];     // ME202
    else if (s.deptId === 5) sections = [23, 24]; // JA101, EN101

    sections.forEach(secId => {
      const eid = enrollmentId++;
      enrollmentValues.push(`(${eid}, ${s.studentId}, ${secId}, '2026-08-25 10:00:00', 'ENROLLED')`);
      // Ongoing semester: midterm available, final not yet finalized
      const cc = 9.0;
      const gk = 7.5 + (s.studentId * 4 % 25) / 10;
      gradeValues.push(`(${gradeId++}, ${eid}, ${cc.toFixed(1)}, ${gk.toFixed(1)}, NULL, NULL, NULL, NULL, FALSE)`);
    });
  });

  // 11.4: Active semester HK1-2026 for K19 (incoming new students)
  studentsK19Data.forEach((s) => {
    let sections = [];
    if (s.deptId === 1) sections = [17, 18]; // IT101-01, IT101-02
    else if (s.deptId === 2) sections = [19]; // BA201
    else if (s.deptId === 3) sections = [21]; // EE202
    else if (s.deptId === 4) sections = [22]; // ME202
    else if (s.deptId === 5) sections = [23, 24]; // JA101, EN101

    sections.forEach(secId => {
      const eid = enrollmentId++;
      enrollmentValues.push(`(${eid}, ${s.studentId}, ${secId}, '2026-08-28 14:00:00', 'ENROLLED')`);
      const cc = 9.5;
      gradeValues.push(`(${gradeId++}, ${eid}, ${cc.toFixed(1)}, NULL, NULL, NULL, NULL, NULL, FALSE)`);
    });
  });

  sql += enrollmentValues.join(',\n') + ';\n\n';

  sql += `-- ============================================================
-- 12. GRADES (Bảng điểm)
-- ============================================================
INSERT INTO grades (id, enrollment_id, attendance_score, midterm_score, final_score, total_score, letter_grade, gpa_point, is_finalized) VALUES\n`;
  sql += gradeValues.join(',\n') + ';\n\n';

  // 13. Schedules (Thời khóa biểu)
  sql += `-- ============================================================
-- 13. SCHEDULES (Thời khóa biểu đầy đủ)
-- ============================================================
INSERT INTO schedules (section_id, class_id, day_of_week, start_period, end_period, room, start_date, end_date, note) VALUES
-- HK1-2025
(1, 1, 2, 1, 3, 'A101', '2025-09-01', '2026-01-15', 'Lý thuyết & Giới thiệu ngành CNTT'),
(2, 1, 4, 4, 6, 'A102', '2025-09-01', '2026-01-15', 'Lập trình Java - Thực hành máy Lab'),
(3, 1, 6, 1, 3, 'A103', '2025-09-01', '2026-01-15', 'Cơ sở dữ liệu - Thực hành hệ quản trị SQL'),
(4, 5, 3, 7, 9, 'B201', '2025-09-01', '2026-01-15', 'Nguyên lý quản trị - Thảo luận tình huống'),
(5, 8, 2, 7, 9, 'C101', '2025-09-01', '2026-01-15', 'Kỹ thuật điện đại cương - Thí nghiệm mạch'),
(6, 11, 3, 1, 3, 'D101', '2025-09-01', '2026-01-15', 'Cơ học kỹ thuật - Bài tập động học'),
(7, 14, 5, 1, 3, 'C301', '2025-09-01', '2026-01-15', 'Tiếng Anh giao tiếp 1 - Phòng Lab Ngoại ngữ'),

-- HK2-2025
(8, 1, 3, 1, 3, 'A101', '2026-02-01', '2026-06-30', 'Cấu trúc dữ liệu & Giải thuật - Lý thuyết'),
(9, 2, 5, 4, 6, 'A102', '2026-02-01', '2026-06-30', 'Mạng máy tính - Cấu hình mô phỏng Cisco'),
(10, 5, 4, 7, 9, 'B202', '2026-02-01', '2026-06-30', 'Kinh tế vi mô - Bài tập đồ thị thị trường'),
(11, 8, 6, 1, 4, 'C102', '2026-02-01', '2026-06-30', 'Mạch điện tử & Vi xử lý - Thực hành vi điều khiển'),
(12, 11, 2, 7, 9, 'D102', '2026-02-01', '2026-06-30', 'Vẽ kỹ thuật & CAD cơ khí - Thực hành SolidWorks'),
(13, 14, 4, 1, 3, 'C302', '2026-02-01', '2026-06-30', 'Tiếng Anh chuyên ngành - Thuyết trình kỹ thuật'),

-- HK1-2026 (Kỳ ĐANG DIỄN RA)
(14, 1, 2, 1, 3, 'A101', '2026-09-01', '2027-01-15', 'Phát triển ứng dụng Web - Đồ án thực hành'),
(14, 2, 2, 4, 6, 'A101', '2026-09-01', '2027-01-15', 'Phát triển ứng dụng Web - Thực hành Lab'),
(15, 1, 4, 4, 6, 'A102', '2026-09-01', '2027-01-15', 'Kỹ thuật phần mềm - Quy trình Agile/Scrum'),
(15, 2, 4, 7, 9, 'A102', '2026-09-01', '2027-01-15', 'Kỹ thuật phần mềm - Đồ án nhóm'),
(16, 1, 2, 7, 9, 'A103', '2026-09-01', '2027-01-15', 'Trí tuệ nhân tạo - Nhập môn Machine Learning'),
(17, 3, 4, 1, 3, 'A104', '2026-09-01', '2027-01-15', 'Nhập môn lập trình C/C++ - Lớp K19-SE1'),
(18, 4, 6, 1, 3, 'A105', '2026-09-01', '2027-01-15', 'Nhập môn lập trình C/C++ - Lớp K19-SE2'),
(19, 6, 3, 1, 3, 'B201', '2026-09-01', '2027-01-15', 'Quản trị Marketing - Phân tích tình huống'),
(20, 6, 5, 4, 6, 'B202', '2026-09-01', '2027-01-15', 'Kế toán tài chính - Hạch toán doanh nghiệp'),
(21, 9, 3, 7, 9, 'C101', '2026-09-01', '2027-01-15', 'Điều khiển tự động - Thiết kế bộ PID'),
(22, 12, 4, 7, 10, 'D101', '2026-09-01', '2027-01-15', 'Động cơ ô tô - Thí nghiệm xưởng cơ khí'),
(23, 16, 6, 7, 9, 'C301', '2026-09-01', '2027-01-15', 'Tiếng Nhật căn bản 1 - Luyện phát âm & Kanji'),
(24, 15, 2, 4, 6, 'C302', '2026-09-01', '2027-01-15', 'Tiếng Anh giao tiếp 1 - Luyện hội thoại');

-- ============================================================
-- CẬP NHẬT LẠI ENROLLED_COUNT TRONG COURSE_SECTIONS
-- ============================================================
UPDATE course_sections cs
SET enrolled_count = (
    SELECT COUNT(*) FROM enrollments e
    WHERE e.section_id = cs.id AND e.status != 'CANCELLED'
);

-- Bật lại kiểm tra khóa ngoại
SET FOREIGN_KEY_CHECKS = 1;
`;

  return sql;
}

// Generate the seed.sql file with utf-8 encoding
const outputPath = path.join(__dirname, 'seed.sql');
const sqlContent = generateSeedSql();
fs.writeFileSync(outputPath, sqlContent, 'utf8');
console.log(`Generated pristine UTF-8 seed.sql at ${outputPath} (size: ${Buffer.byteLength(sqlContent, 'utf8')} bytes)`);
