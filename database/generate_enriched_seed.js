const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const BCRYPT_123456 = '$2a$10$s2ivIIT7Cjhf0iL2WrXiteC.rcBvNLSbPq2c3CwV38YrpDgh4h0wm';

// Vietnamese name generation pools
const hoPool = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Phan', 'Bùi', 'Đặng', 'Đỗ', 'Ngô', 'Dương', 'Đinh', 'Đoàn', 'Trịnh'];
const demMale = ['Văn', 'Đức', 'Hoàng', 'Minh', 'Tuấn', 'Quang', 'Quốc', 'Đình', 'Thành', 'Tiến', 'Hữu', 'Công', 'Mạnh', 'Trọng'];
const demFemale = ['Thị', 'Thu', 'Phương', 'Thanh', 'Ngọc', 'Hải', 'Mai', 'Bích', 'Quỳnh', 'Thùy', 'Hương', 'Diệu', 'Khánh', 'Kim'];
const tenMale = [
  'An', 'Anh', 'Bách', 'Bảo', 'Bình', 'Cường', 'Dũng', 'Duy', 'Dương', 'Đạt',
  'Đức', 'Giang', 'Hải', 'Hiếu', 'Hiệp', 'Hoàng', 'Huy', 'Hùng', 'Khánh', 'Khiêm',
  'Kiên', 'Kiệt', 'Long', 'Minh', 'Nam', 'Nghĩa', 'Phong', 'Phúc', 'Quân', 'Quang',
  'Sơn', 'Tài', 'Thắng', 'Thịnh', 'Trọng', 'Trung', 'Tú', 'Tuấn', 'Việt', 'Vinh', 'Vũ'
];
const tenFemale = [
  'An', 'Anh', 'Châu', 'Chi', 'Dương', 'Giang', 'Hà', 'Hằng', 'Hoa', 'Hương',
  'Lam', 'Lan', 'Linh', 'Ly', 'Mai', 'My', 'Nga', 'Ngân', 'Ngọc', 'Nhung',
  'Oanh', 'Phương', 'Quỳnh', 'Tâm', 'Thảo', 'Thu', 'Trang', 'Trâm', 'Tuyết', 'Uyên', 'Vân', 'Xuân', 'Yến'
];

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
  'Số 108 Đường Láng, Đống Đa, Hà Nội',
  'Số 86 Đường Hoàng Quốc Việt, Cầu Giấy, Hà Nội',
  'Số 12 Phố Lê Văn Lương, Thanh Xuân, Hà Nội',
  'Số 49 Đường Xã Đàn, Đống Đa, Hà Nội',
  'Số 203 Đường Nguyễn Lương Bằng, Đống Đa, Hà Nội'
];

// Helper to generate unique realistic student names
function generateStudentNames(count, genderRatio = 0.6) {
  const result = [];
  const used = new Set();
  let attempts = 0;

  while (result.length < count && attempts < count * 20) {
    attempts++;
    const isMale = Math.random() < genderRatio;
    const gender = isMale ? 'MALE' : 'FEMALE';
    const ho = hoPool[Math.floor(Math.random() * hoPool.length)];
    const dem = isMale ? demMale[Math.floor(Math.random() * demMale.length)] : demFemale[Math.floor(Math.random() * demFemale.length)];
    const ten = isMale ? tenMale[Math.floor(Math.random() * tenMale.length)] : tenFemale[Math.floor(Math.random() * tenFemale.length)];
    const fullName = `${ho} ${dem} ${ten}`;

    if (!used.has(fullName)) {
      used.add(fullName);
      result.push({ fullName, gender });
    }
  }

  // Vietnamese collator sort by given name then middle/first
  const collator = new Intl.Collator('vi', { sensitivity: 'base' });
  result.sort((a, b) => {
    const partsA = a.fullName.trim().split(/\s+/);
    const partsB = b.fullName.trim().split(/\s+/);
    const givenA = partsA[partsA.length - 1];
    const givenB = partsB[partsB.length - 1];
    const cmp = collator.compare(givenA, givenB);
    if (cmp !== 0) return cmp;
    return collator.compare(a.fullName, b.fullName);
  });

  return result;
}

// Generate realistic Gaussian grade
function generateGaussScores() {
  // Generate bell curve: mean around 7.0, std dev 1.4
  // Using Box-Muller transform
  const u1 = Math.random() || 0.0001;
  const u2 = Math.random() || 0.0001;
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  
  let ck = 7.0 + z * 1.5;
  ck = Math.max(2.0, Math.min(10.0, ck)); // Clamp 2.0 -> 10.0
  
  let cc = Math.min(10.0, Math.max(5.0, 8.5 + (Math.random() * 2 - 0.5)));
  let gk = Math.min(10.0, Math.max(3.0, ck + (Math.random() * 1.6 - 0.8)));

  cc = +(Math.round(cc * 2) / 2).toFixed(1); // round to 0.5
  gk = +(Math.round(gk * 2) / 2).toFixed(1);
  ck = +(Math.round(ck * 2) / 2).toFixed(1);

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

  return { cc, gk, ck, total, letter, gpa };
}

function buildSql() {
  console.log('Generating Enriched Big Dataset for SMS...');

  let sql = `-- ============================================================
-- STUDENT MANAGEMENT SYSTEM (SMS)
-- ENRICHED DATASET FOR ACADEMIC CAPSTONE (600 SV, 25 GV, 35 MÔN, 50 LHP, 4 HỌC KỲ)
-- ============================================================
USE student_management;
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE password_reset_requests;
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

-- 1. ROLES
INSERT INTO roles (id, name) VALUES (1, 'ADMIN'), (2, 'LECTURER'), (3, 'STUDENT');

-- 2. DEPARTMENTS (5 khoa viện)
INSERT INTO departments (id, code, name, description) VALUES
(1, 'CNTT', 'Công nghệ thông tin', 'Khoa Công nghệ thông tin - Đào tạo Kỹ thuật phần mềm, Trí tuệ nhân tạo, An toàn thông tin, Mạng máy tính'),
(2, 'QTKD', 'Quản trị kinh doanh', 'Khoa Quản trị kinh doanh - Đào tạo Quản trị doanh nghiệp, Marketing số, Thương mại điện tử, Tài chính'),
(3, 'DIEN', 'Điện - Điện tử', 'Khoa Điện - Điện tử - Đào tạo Kỹ thuật điều khiển & Tự động hóa, Điện tử viễn thông, Hệ thống nhúng & IoT'),
(4, 'COKHI', 'Cơ khí', 'Khoa Cơ khí - Đào tạo Kỹ thuật Cơ điện tử, Kỹ thuật Ô tô, Công nghệ chế tạo máy, Robot học'),
(5, 'NGOAINGU', 'Ngoại ngữ', 'Khoa Ngoại ngữ - Đào tạo Ngôn ngữ Anh thương mại, Ngôn ngữ Nhật ứng dụng');

-- 3. CLASSES (15 lớp sinh hoạt chuẩn khóa K16 -> K19)
INSERT INTO classes (id, code, name, department_id, academic_year) VALUES
-- Khóa K16 (Năm 4 - Chuẩn bị tốt nghiệp)
(1,  'K16-SE1',  'Kỹ thuật phần mềm 1 - K16',  1, 'K16'),
(2,  'K16-BA1',  'Quản trị kinh doanh 1 - K16', 2, 'K16'),
(3,  'K16-EE1',  'Điện tử viễn thông 1 - K16', 3, 'K16'),
-- Khóa K17 (Năm 3)
(4,  'K17-SE1',  'Kỹ thuật phần mềm 1 - K17',  1, 'K17'),
(5,  'K17-SE2',  'Kỹ thuật phần mềm 2 - K17',  1, 'K17'),
(6,  'K17-BA1',  'Quản trị kinh doanh 1 - K17', 2, 'K17'),
(7,  'K17-EE1',  'Tự động hóa 1 - K17',        3, 'K17'),
(8,  'K17-ME1',  'Cơ điện tử 1 - K17',         4, 'K17'),
-- Khóa K18 (Năm 2)
(9,  'K18-SE1',  'Kỹ thuật phần mềm 1 - K18',  1, 'K18'),
(10, 'K18-SE2',  'Kỹ thuật phần mềm 2 - K18',  1, 'K18'),
(11, 'K18-BA1',  'Quản trị kinh doanh 1 - K18', 2, 'K18'),
(12, 'K18-EE1',  'Điện tử viễn thông 1 - K18', 3, 'K18'),
(13, 'K18-ME1',  'Kỹ thuật ô tô 1 - K18',      4, 'K18'),
-- Khóa K19 (Năm 1 - Tân sinh viên)
(14, 'K19-SE1',  'Kỹ thuật phần mềm 1 - K19',  1, 'K19'),
(15, 'K19-ENG1', 'Ngôn ngữ Anh 1 - K19',       5, 'K19');
\n`;

  // 4. USERS - ADMIN & 25 LECTURERS
  sql += `-- 4. USERS - ADMIN & 25 LECTURERS\nINSERT INTO users (id, username, password, email, role_id, is_active) VALUES\n`;
  const adminAndLecUsers = [];
  adminAndLecUsers.push(`(1, 'admin', '${BCRYPT_123456}', 'admin@sms.edu.vn', 1, TRUE)`);

  for (let i = 1; i <= 25; i++) {
    const code = `10000${String(i).padStart(2, '0')}`;
    adminAndLecUsers.push(`(${i + 1}, '${code}', '${BCRYPT_123456}', '${code}@sms.edu.vn', 2, TRUE)`);
  }
  sql += adminAndLecUsers.join(',\n') + ';\n\n';

  // 5. LECTURERS (25 giảng viên chất lượng cao)
  sql += `-- 5. LECTURERS (25 giảng viên chia đều 5 khoa)\nINSERT INTO lecturers (id, user_id, lecturer_code, full_name, date_of_birth, gender, email, phone, department_id, degree, specialization) VALUES\n`;
  const lecturersData = [
    // Khoa 1: CNTT (5 GV)
    { id: 1,  uid: 2,  code: '1000001', name: 'TS. Nguyễn Hoàng Long',   dob: '1980-04-12', gender: 'MALE',   dept: 1, degree: 'TS',     spec: 'Kỹ thuật phần mềm & Kiến trúc hệ thống phân tán' },
    { id: 2,  uid: 3,  code: '1000002', name: 'ThS. Trần Thị Mai',       dob: '1985-08-23', gender: 'FEMALE', dept: 1, degree: 'ThS',    spec: 'Cơ sở dữ liệu & Phân tích dữ liệu lớn' },
    { id: 3,  uid: 4,  code: '1000003', name: 'PGS.TS. Lê Văn Thắng',    dob: '1975-11-15', gender: 'MALE',   dept: 1, degree: 'PGS.TS', spec: 'Trí tuệ nhân tạo, Deep Learning & Mạng nơ-ron' },
    { id: 4,  uid: 5,  code: '1000004', name: 'TS. Phạm Minh Tuấn',      dob: '1983-02-18', gender: 'MALE',   dept: 1, degree: 'TS',     spec: 'An toàn thông tin, Mạng máy tính & Mật mã học' },
    { id: 5,  uid: 6,  code: '1000005', name: 'ThS. Đỗ Quang Huy',       dob: '1988-09-05', gender: 'MALE',   dept: 1, degree: 'ThS',    spec: 'Phát triển ứng dụng Web Fullstack & Cloud' },
    // Khoa 2: QTKD (5 GV)
    { id: 6,  uid: 7,  code: '1000006', name: 'TS. Vũ Quốc Cường',       dob: '1982-01-20', gender: 'MALE',   dept: 2, degree: 'TS',     spec: 'Quản trị chiến lược & Kinh tế số' },
    { id: 7,  uid: 8,  code: '1000007', name: 'ThS. Đỗ Thị Thu Trang',   dob: '1988-06-14', gender: 'FEMALE', dept: 2, degree: 'ThS',    spec: 'Marketing số & Thương mại điện tử' },
    { id: 8,  uid: 9,  code: '1000008', name: 'TS. Hoàng Minh Tuấn',     dob: '1979-09-30', gender: 'MALE',   dept: 2, degree: 'TS',     spec: 'Tài chính doanh nghiệp & Quản trị rủi ro' },
    { id: 9,  uid: 10, code: '1000009', name: 'ThS. Nguyễn Thu Hằng',    dob: '1987-03-22', gender: 'FEMALE', dept: 2, degree: 'ThS',    spec: 'Kế toán tài chính & Kiểm toán' },
    { id: 10, uid: 11, code: '1000010', name: 'TS. Bùi Văn Hải',         dob: '1981-12-11', gender: 'MALE',   dept: 2, degree: 'TS',     spec: 'Kinh tế học vĩ mô & Chuỗi cung ứng' },
    // Khoa 3: Điện (5 GV)
    { id: 11, uid: 12, code: '1000011', name: 'PGS.TS. Phạm Đình Huy',   dob: '1976-03-25', gender: 'MALE',   dept: 3, degree: 'PGS.TS', spec: 'Điện tử viễn thông & Xử lý tín hiệu số' },
    { id: 12, uid: 13, code: '1000012', name: 'ThS. Bùi Thị Thu Hương',  dob: '1987-12-05', gender: 'FEMALE', dept: 3, degree: 'ThS',    spec: 'Hệ thống nhúng, IoT & Thiết kế FPGA' },
    { id: 13, uid: 14, code: '1000013', name: 'TS. Nguyễn Tuấn Anh',     dob: '1983-07-19', gender: 'MALE',   dept: 3, degree: 'TS',     spec: 'Điều khiển tự động, SCADA & Robot công nghiệp' },
    { id: 14, uid: 15, code: '1000014', name: 'ThS. Lê Hoàng Nam',      dob: '1989-05-14', gender: 'MALE',   dept: 3, degree: 'ThS',    spec: 'Kỹ thuật điện cao áp & Năng lượng tái tạo' },
    { id: 15, uid: 16, code: '1000015', name: 'TS. Đặng Quốc Thịnh',    dob: '1982-10-28', gender: 'MALE',   dept: 3, degree: 'TS',     spec: 'Cảm biến thông minh & Mạng cảm biến không dây' },
    // Khoa 4: Cơ khí (5 GV)
    { id: 16, uid: 17, code: '1000016', name: 'TS. Đặng Việt Hùng',      dob: '1981-05-18', gender: 'MALE',   dept: 4, degree: 'TS',     spec: 'Cơ khí chính xác & Công nghệ CNC/CAM' },
    { id: 17, uid: 18, code: '1000017', name: 'ThS. Lê Quang Hải',       dob: '1986-10-09', gender: 'MALE',   dept: 4, degree: 'ThS',    spec: 'Kỹ thuật ô tô, Khung gầm & Hệ thống truyền lực' },
    { id: 18, uid: 19, code: '1000018', name: 'ThS. Nguyễn Đức Thành',   dob: '1989-02-27', gender: 'MALE',   dept: 4, degree: 'ThS',    spec: 'Cơ điện tử & Mô phỏng cơ cấu máy SolidWorks' },
    { id: 19, uid: 20, code: '1000019', name: 'TS. Vũ Đình Trọng',      dob: '1978-08-16', gender: 'MALE',   dept: 4, degree: 'TS',     spec: 'Động cơ đốt trong & Xe điện EV thế hệ mới' },
    { id: 20, uid: 21, code: '1000020', name: 'ThS. Hoàng Văn Bách',     dob: '1985-04-03', gender: 'MALE',   dept: 4, degree: 'ThS',    spec: 'Vật liệu cơ khí & Công nghệ hàn nâng cao' },
    // Khoa 5: Ngoại ngữ (5 GV)
    { id: 21, uid: 22, code: '1000021', name: 'TS. Nguyễn Quỳnh Chi',    dob: '1984-04-03', gender: 'FEMALE', dept: 5, degree: 'TS',     spec: 'Ngôn ngữ học ứng dụng & Phương pháp giảng dạy TESOL' },
    { id: 22, uid: 23, code: '1000022', name: 'ThS. Hoàng Ngọc Ánh',     dob: '1990-11-12', gender: 'FEMALE', dept: 5, degree: 'ThS',    spec: 'Tiếng Anh thương mại & Biên phiên dịch hợp đồng' },
    { id: 23, uid: 24, code: '1000023', name: 'ThS. Lê Thị Thanh Nga',   dob: '1987-08-16', gender: 'FEMALE', dept: 5, degree: 'ThS',    spec: 'Ngôn ngữ & Giao tiếp văn hóa Nhật Bản JLPT N1' },
    { id: 24, uid: 25, code: '1000024', name: 'ThS. Phạm Thùy Linh',     dob: '1991-01-25', gender: 'FEMALE', dept: 5, degree: 'ThS',    spec: 'Tiếng Anh chuyên ngành Công nghệ thông tin & Kỹ thuật' },
    { id: 25, uid: 26, code: '1000025', name: 'TS. Trần Minh Đức',       dob: '1983-09-19', gender: 'MALE',   dept: 5, degree: 'TS',     spec: 'Văn hóa học so sánh & Ngôn ngữ học đối chiếu' }
  ];

  const lecSqlRows = lecturersData.map(l => {
    const phone = `0912345${String(l.id).padStart(3, '0')}`;
    return `(${l.id}, ${l.uid}, '${l.code}', '${l.name}', '${l.dob}', '${l.gender}', '${l.code}@sms.edu.vn', '${phone}', ${l.dept}, '${l.degree}', '${l.spec}')`;
  });
  sql += lecSqlRows.join(',\n') + ';\n\n';

  // 6. SUBJECTS (35 môn học đa ngành)
  sql += `-- 6. SUBJECTS (35 môn học đại cương & chuyên ngành)\nINSERT INTO subjects (id, subject_code, subject_name, credits, description, department_id) VALUES\n`;
  const subjectsData = [
    // Đại cương chung (thuộc Khoa CNTT hoặc Ngoại ngữ quản lý)
    { id: 1,  code: 'BS101', name: 'Giải tích 1',                   credits: 3, dept: 1, desc: 'Giới hạn, đạo hàm, vi phân và tích phân hàm một biến' },
    { id: 2,  code: 'BS102', name: 'Đại số tuyến tính',             credits: 3, dept: 1, desc: 'Ma trận, định thức, hệ phương trình tuyến tính và không gian vector' },
    { id: 3,  code: 'BS103', name: 'Vật lý đại cương 1',            credits: 3, dept: 3, desc: 'Cơ học chất điểm, nhiệt học và trường tĩnh điện' },
    { id: 4,  code: 'BS104', name: 'Triết học Mác - Lênin',         credits: 3, dept: 2, desc: 'Chủ nghĩa duy vật biện chứng và chủ nghĩa duy vật lịch sử' },
    { id: 5,  code: 'BS105', name: 'Pháp luật đại cương',           credits: 2, dept: 2, desc: 'Những vấn đề cơ bản về nhà nước và pháp luật Việt Nam' },
    // CNTT (Khoa 1)
    { id: 6,  code: 'IT101', name: 'Nhập môn lập trình',            credits: 3, dept: 1, desc: 'Nguyên lý tư duy lập trình căn bản với ngôn ngữ C/C++' },
    { id: 7,  code: 'IT201', name: 'Lập trình Java nâng cao',       credits: 3, dept: 1, desc: 'Lập trình hướng đối tượng, Collections, Generics và Stream API' },
    { id: 8,  code: 'IT202', name: 'Cơ sở dữ liệu',                 credits: 3, dept: 1, desc: 'Mô hình quan hệ thực thể ERD, chuẩn hóa 3NF và truy vấn SQL' },
    { id: 9,  code: 'IT203', name: 'Cấu trúc dữ liệu & Giải thuật', credits: 3, dept: 1, desc: 'Danh sách liên kết, Cây nhị phân, Đồ thị và giải thuật quy hoạch động' },
    { id: 10, code: 'IT301', name: 'Phát triển ứng dụng Web',       credits: 3, dept: 1, desc: 'Fullstack Web: ReactJS, Vite, Spring Boot REST API và JWT' },
    { id: 11, code: 'IT302', name: 'Mạng máy tính',                 credits: 3, dept: 1, desc: 'Mô hình OSI, giao thức TCP/UDP, địa chỉ IP và định tuyến Router' },
    { id: 12, code: 'IT303', name: 'Trí tuệ nhân tạo căn bản',      credits: 3, dept: 1, desc: 'Học máy Machine Learning, mạng nơ-ron và Computer Vision' },
    { id: 13, code: 'IT304', name: 'Kỹ thuật phần mềm',             credits: 3, dept: 1, desc: 'Quy trình Agile/Scrum, thiết kế mẫu Design Patterns và CI/CD' },
    { id: 14, code: 'IT305', name: 'Kiểm thử phần mềm',             credits: 3, dept: 1, desc: 'Kiểm thử hộp trắng, hộp đen, tự động hóa Selenium và JUnit' },
    { id: 15, code: 'IT401', name: 'An toàn thông tin',             credits: 3, dept: 1, desc: 'Mã hóa RSA, chữ ký điện tử, an ninh mạng và chống tấn công web' },
    // QTKD (Khoa 2)
    { id: 16, code: 'BA101', name: 'Nguyên lý quản trị',            credits: 3, dept: 2, desc: 'Hoạch định, tổ chức, lãnh đạo và kiểm soát trong tổ chức' },
    { id: 17, code: 'BA102', name: 'Kinh tế vi mô',                 credits: 3, dept: 2, desc: 'Quy luật cung cầu, co giãn giá cả và phân tích thị trường cạnh tranh' },
    { id: 18, code: 'BA103', name: 'Kinh tế vĩ mô',                 credits: 3, dept: 2, desc: 'Lạm phát, thất nghiệp, tăng trưởng GDP và chính sách tài khóa' },
    { id: 19, code: 'BA201', name: 'Quản trị Marketing',            credits: 3, dept: 2, desc: 'Hành vi người tiêu dùng, chiến lược sản phẩm, định giá và xúc tiến' },
    { id: 20, code: 'BA202', name: 'Kế toán tài chính',             credits: 3, dept: 2, desc: 'Hệ thống tài khoản kế toán, bảng cân đối kế toán và báo cáo lưu chuyển' },
    { id: 21, code: 'BA301', name: 'Quản trị tài chính doanh nghiệp',credits: 3,dept: 2, desc: 'Định giá dòng tiền, chi phí vốn WACC và quản lý rủi ro đầu tư' },
    { id: 22, code: 'BA302', name: 'Quản trị nhân lực',             credits: 3, dept: 2, desc: 'Tuyển dụng, đào tạo, đãi ngộ và văn hóa doanh nghiệp' },
    // Điện (Khoa 3)
    { id: 23, code: 'EE101', name: 'Kỹ thuật điện đại cương',       credits: 3, dept: 3, desc: 'Mạch điện một chiều, xoay chiều 3 pha và máy biến áp' },
    { id: 24, code: 'EE201', name: 'Mạch điện tử và vi xử lý',      credits: 4, dept: 3, desc: 'Transistor, khuếch đại thuật toán Op-Amp và vi điều khiển STM32' },
    { id: 25, code: 'EE202', name: 'Hệ thống điều khiển tự động',   credits: 3, dept: 3, desc: 'Lý thuyết điều khiển tự động, hàm truyền đạt và bộ điều khiển PID' },
    { id: 26, code: 'EE301', name: 'Cảm biến và đo lường điện',     credits: 3, dept: 3, desc: 'Các loại cảm biến công nghiệp và mạch chuyển đổi tín hiệu đo' },
    { id: 27, code: 'EE302', name: 'Hệ thống nhúng và IoT',         credits: 3, dept: 3, desc: 'Lập trình ESP32, giao thức MQTT và kết nối Cloud IoT' },
    // Cơ khí (Khoa 4)
    { id: 28, code: 'ME101', name: 'Cơ học kỹ thuật',               credits: 3, dept: 4, desc: 'Tĩnh học vật rắn, động học và động lực học cơ hệ' },
    { id: 29, code: 'ME201', name: 'Vẽ kỹ thuật & CAD 3D',          credits: 3, dept: 4, desc: 'Tiêu chuẩn ISO bản vẽ kỹ thuật và thiết kế 3D SolidWorks' },
    { id: 30, code: 'ME202', name: 'Kỹ thuật động cơ ô tô',         credits: 4, dept: 4, desc: 'Chu trình nhiệt, hệ thống phun xăng điện tử EFI và chẩn đoán OBD' },
    { id: 31, code: 'ME301', name: 'Sức bền vật liệu',              credits: 3, dept: 4, desc: 'Kéo nén đúng tâm, uốn phẳng và tính toán độ bền kết cấu' },
    { id: 32, code: 'ME302', name: 'Công nghệ chế tạo máy CNC',     credits: 3, dept: 4, desc: 'Phương pháp gia công tiện, phay CNC và lập trình G-Code' },
    // Ngoại ngữ (Khoa 5)
    { id: 33, code: 'EN101', name: 'Tiếng Anh giao tiếp học thuật', credits: 2, dept: 5, desc: 'Kỹ năng nghe nói, phản xạ và thuyết trình tiếng Anh tự tin' },
    { id: 34, code: 'EN201', name: 'Tiếng Anh chuyên ngành CNTT',   credits: 3, dept: 5, desc: 'Thuật ngữ tin học, dịch tài liệu API và viết tài liệu kỹ thuật' },
    { id: 35, code: 'JA101', name: 'Tiếng Nhật sơ cấp 1',           credits: 3, dept: 5, desc: 'Bảng chữ cái Hiragana, Katakana, ngữ pháp căn bản Minna no Nihongo' }
  ];

  const subSqlRows = subjectsData.map(s => `(${s.id}, '${s.code}', '${s.name}', ${s.credits}, '${s.desc}', ${s.dept})`);
  sql += subSqlRows.join(',\n') + ';\n\n';

  // 7. SEMESTERS (4 học kỳ)
  sql += `-- 7. SEMESTERS (4 học kỳ: 3 kỳ quá khứ + 1 kỳ hiện tại)\nINSERT INTO semesters (id, semester_code, semester_name, academic_year, semester_number, start_date, end_date, registration_start, registration_end, is_current, status) VALUES
(1, 'HK1-2024', 'Học kỳ 1 (2024-2025)', '2024-2025', 1, '2024-09-01', '2025-01-15', '2024-08-15', '2024-08-30', FALSE, 'COMPLETED'),
(2, 'HK2-2024', 'Học kỳ 2 (2024-2025)', '2024-2025', 2, '2025-02-01', '2025-06-30', '2025-01-15', '2025-01-28', FALSE, 'COMPLETED'),
(3, 'HK1-2025', 'Học kỳ 1 (2025-2026)', '2025-2026', 1, '2025-09-01', '2026-01-15', '2025-08-15', '2025-08-30', FALSE, 'COMPLETED'),
(4, 'HK1-2026', 'Học kỳ 1 (2026-2027)', '2026-2027', 1, '2026-09-01', '2027-01-15', '2026-08-15', '2026-08-31', TRUE,  'ACTIVE');\n\n`;

  // 8. COURSE SECTIONS (50 lớp học phần)
  sql += `-- 8. COURSE SECTIONS (50 lớp học phần phân bổ 4 học kỳ)\nINSERT INTO course_sections (id, section_code, subject_id, lecturer_id, semester_id, max_students, enrolled_count, schedule, room, status) VALUES\n`;
  const sectionsData = [
    // HK1-2024 (Semester 1) - 10 sections
    { id: 1,  code: 'BS101-01-HK1-24', sub: 1,  lec: 1,  sem: 1, max: 60, sched: 'Thứ Hai (07:00-09:30)', room: 'A101', st: 'CLOSED' },
    { id: 2,  code: 'BS102-01-HK1-24', sub: 2,  lec: 2,  sem: 1, max: 60, sched: 'Thứ Tư (09:35-12:05)', room: 'A102', st: 'CLOSED' },
    { id: 3,  code: 'IT101-01-HK1-24', sub: 6,  lec: 5,  sem: 1, max: 50, sched: 'Thứ Sáu (07:00-09:30)', room: 'A201', st: 'CLOSED' },
    { id: 4,  code: 'BA101-01-HK1-24', sub: 16, lec: 6,  sem: 1, max: 55, sched: 'Thứ Ba (13:20-15:50)', room: 'B101', st: 'CLOSED' },
    { id: 5,  code: 'BA102-01-HK1-24', sub: 17, lec: 10, sem: 1, max: 55, sched: 'Thứ Năm (07:00-09:30)', room: 'B102', st: 'CLOSED' },
    { id: 6,  code: 'EE101-01-HK1-24', sub: 23, lec: 11, sem: 1, max: 50, sched: 'Thứ Hai (13:20-15:50)', room: 'C101', st: 'CLOSED' },
    { id: 7,  code: 'ME101-01-HK1-24', sub: 28, lec: 16, sem: 1, max: 50, sched: 'Thứ Ba (07:00-09:30)', room: 'D101', st: 'CLOSED' },
    { id: 8,  code: 'EN101-01-HK1-24', sub: 33, lec: 21, sem: 1, max: 45, sched: 'Thứ Năm (13:20-14:55)', room: 'C201', st: 'CLOSED' },
    { id: 9,  code: 'BS104-01-HK1-24', sub: 4,  lec: 7,  sem: 1, max: 60, sched: 'Thứ Bảy (07:00-09:30)', room: 'B201', st: 'CLOSED' },
    { id: 10, code: 'BS105-01-HK1-24', sub: 5,  lec: 8,  sem: 1, max: 60, sched: 'Thứ Bảy (09:35-11:15)', room: 'B202', st: 'CLOSED' },

    // HK2-2024 (Semester 2) - 12 sections
    { id: 11, code: 'IT201-01-HK2-24', sub: 7,  lec: 1,  sem: 2, max: 50, sched: 'Thứ Hai (07:00-09:30)', room: 'A103', st: 'CLOSED' },
    { id: 12, code: 'IT202-01-HK2-24', sub: 8,  lec: 2,  sem: 2, max: 50, sched: 'Thứ Ba (09:35-12:05)', room: 'A104', st: 'CLOSED' },
    { id: 13, code: 'IT203-01-HK2-24', sub: 9,  lec: 3,  sem: 2, max: 50, sched: 'Thứ Năm (07:00-09:30)', room: 'A202', st: 'CLOSED' },
    { id: 14, code: 'BA103-01-HK2-24', sub: 18, lec: 6,  sem: 2, max: 55, sched: 'Thứ Tư (13:20-15:50)', room: 'B103', st: 'CLOSED' },
    { id: 15, code: 'BA201-01-HK2-24', sub: 19, lec: 7,  sem: 2, max: 55, sched: 'Thứ Sáu (07:00-09:30)', room: 'B104', st: 'CLOSED' },
    { id: 16, code: 'EE201-01-HK2-24', sub: 24, lec: 12, sem: 2, max: 45, sched: 'Thứ Tư (07:00-10:20)', room: 'C102', st: 'CLOSED' },
    { id: 17, code: 'EE202-01-HK2-24', sub: 25, lec: 13, sem: 2, max: 45, sched: 'Thứ Sáu (13:20-15:50)', room: 'C103', st: 'CLOSED' },
    { id: 18, code: 'ME201-01-HK2-24', sub: 29, lec: 18, sem: 2, max: 45, sched: 'Thứ Hai (13:20-15:50)', room: 'D102', st: 'CLOSED' },
    { id: 19, code: 'ME301-01-HK2-24', sub: 31, lec: 20, sem: 2, max: 45, sched: 'Thứ Năm (13:20-15:50)', room: 'D103', st: 'CLOSED' },
    { id: 20, code: 'EN201-01-HK2-24', sub: 34, lec: 22, sem: 2, max: 45, sched: 'Thứ Ba (13:20-15:50)', room: 'C202', st: 'CLOSED' },
    { id: 21, code: 'JA101-01-HK2-24', sub: 35, lec: 23, sem: 2, max: 40, sched: 'Thứ Bảy (07:00-09:30)', room: 'C203', st: 'CLOSED' },
    { id: 22, code: 'BS103-01-HK2-24', sub: 3,  lec: 15, sem: 2, max: 55, sched: 'Thứ Bảy (13:20-15:50)', room: 'A203', st: 'CLOSED' },

    // HK1-2025 (Semester 3) - 14 sections
    { id: 23, code: 'IT301-01-HK1-25', sub: 10, lec: 5,  sem: 3, max: 50, sched: 'Thứ Hai (07:00-09:30)', room: 'A101', st: 'CLOSED' },
    { id: 24, code: 'IT302-01-HK1-25', sub: 11, lec: 4,  sem: 3, max: 50, sched: 'Thứ Tư (09:35-12:05)', room: 'A102', st: 'CLOSED' },
    { id: 25, code: 'IT303-01-HK1-25', sub: 12, lec: 3,  sem: 3, max: 50, sched: 'Thứ Sáu (07:00-09:30)', room: 'A103', st: 'CLOSED' },
    { id: 26, code: 'IT304-01-HK1-25', sub: 13, lec: 1,  sem: 3, max: 50, sched: 'Thứ Ba (13:20-15:50)', room: 'A201', st: 'CLOSED' },
    { id: 27, code: 'BA202-01-HK1-25', sub: 20, lec: 9,  sem: 3, max: 55, sched: 'Thứ Hai (13:20-15:50)', room: 'B101', st: 'CLOSED' },
    { id: 28, code: 'BA301-01-HK1-25', sub: 21, lec: 8,  sem: 3, max: 55, sched: 'Thứ Năm (07:00-09:30)', room: 'B102', st: 'CLOSED' },
    { id: 29, code: 'EE301-01-HK1-25', sub: 26, lec: 15, sem: 3, max: 45, sched: 'Thứ Tư (13:20-15:50)', room: 'C101', st: 'CLOSED' },
    { id: 30, code: 'EE302-01-HK1-25', sub: 27, lec: 12, sem: 3, max: 45, sched: 'Thứ Sáu (13:20-15:50)', room: 'C102', st: 'CLOSED' },
    { id: 31, code: 'ME202-01-HK1-25', sub: 30, lec: 17, sem: 3, max: 45, sched: 'Thứ Ba (07:00-10:20)', room: 'D101', st: 'CLOSED' },
    { id: 32, code: 'ME302-01-HK1-25', sub: 32, lec: 16, sem: 3, max: 45, sched: 'Thứ Năm (13:20-15:50)', room: 'D102', st: 'CLOSED' },
    { id: 33, code: 'IT101-02-HK1-25', sub: 6,  lec: 2,  sem: 3, max: 50, sched: 'Thứ Tư (07:00-09:30)', room: 'A104', st: 'CLOSED' },
    { id: 34, code: 'BA101-02-HK1-25', sub: 16, lec: 6,  sem: 3, max: 55, sched: 'Thứ Sáu (09:35-12:05)', room: 'B103', st: 'CLOSED' },
    { id: 35, code: 'EE101-02-HK1-25', sub: 23, lec: 14, sem: 3, max: 50, sched: 'Thứ Hai (09:35-12:05)', room: 'C103', st: 'CLOSED' },
    { id: 36, code: 'EN101-02-HK1-25', sub: 33, lec: 24, sem: 3, max: 45, sched: 'Thứ Bảy (07:00-08:35)', room: 'C201', st: 'CLOSED' },

    // HK1-2026 (Semester 4 - ACTIVE / ĐANG MỞ ĐĂNG KÝ & ĐANG HỌC) - 14 sections
    { id: 37, code: 'IT301-01-HK1-26', sub: 10, lec: 1,  sem: 4, max: 50, sched: 'Thứ Hai (07:00-09:30)', room: 'A101', st: 'OPEN' },
    { id: 38, code: 'IT304-01-HK1-26', sub: 13, lec: 1,  sem: 4, max: 50, sched: 'Thứ Tư (09:35-12:05)', room: 'A102', st: 'OPEN' },
    { id: 39, code: 'IT305-01-HK1-26', sub: 14, lec: 2,  sem: 4, max: 50, sched: 'Thứ Sáu (07:00-09:30)', room: 'A103', st: 'OPEN' },
    { id: 40, code: 'IT401-01-HK1-26', sub: 15, lec: 4,  sem: 4, max: 50, sched: 'Thứ Ba (07:00-09:30)', room: 'A201', st: 'OPEN' },
    { id: 41, code: 'IT303-01-HK1-26', sub: 12, lec: 3,  sem: 4, max: 50, sched: 'Thứ Hai (13:20-15:50)', room: 'A202', st: 'OPEN' },
    { id: 42, code: 'BA301-01-HK1-26', sub: 21, lec: 8,  sem: 4, max: 55, sched: 'Thứ Ba (13:20-15:50)', room: 'B101', st: 'OPEN' },
    { id: 43, code: 'BA302-01-HK1-26', sub: 22, lec: 7,  sem: 4, max: 55, sched: 'Thứ Năm (09:35-12:05)', room: 'B102', st: 'OPEN' },
    { id: 44, code: 'EE301-01-HK1-26', sub: 26, lec: 15, sem: 4, max: 45, sched: 'Thứ Tư (13:20-15:50)', room: 'C101', st: 'OPEN' },
    { id: 45, code: 'EE302-01-HK1-26', sub: 27, lec: 13, sem: 4, max: 45, sched: 'Thứ Sáu (13:20-15:50)', room: 'C102', st: 'OPEN' },
    { id: 46, code: 'ME202-01-HK1-26', sub: 30, lec: 19, sem: 4, max: 45, sched: 'Thứ Tư (07:00-10:20)', room: 'D101', st: 'OPEN' },
    { id: 47, code: 'ME302-01-HK1-26', sub: 32, lec: 16, sem: 4, max: 45, sched: 'Thứ Năm (13:20-15:50)', room: 'D102', st: 'OPEN' },
    { id: 48, code: 'IT101-01-HK1-26', sub: 6,  lec: 5,  sem: 4, max: 50, sched: 'Thứ Hai (09:35-12:05)', room: 'A104', st: 'OPEN' },
    { id: 49, code: 'BA101-01-HK1-26', sub: 16, lec: 6,  sem: 4, max: 55, sched: 'Thứ Tư (07:00-09:30)', room: 'B103', st: 'OPEN' },
    { id: 50, code: 'EN101-01-HK1-26', sub: 33, lec: 21, sem: 4, max: 45, sched: 'Thứ Sáu (09:35-11:15)', room: 'C201', st: 'OPEN' }
  ];

  const secSqlRows = sectionsData.map(s => `(${s.id}, '${s.code}', ${s.sub}, ${s.lec}, ${s.sem}, ${s.max}, 0, '${s.sched}', '${s.room}', '${s.st}')`);
  sql += secSqlRows.join(',\n') + ';\n\n';

  // 9 & 10. GENERATE 600 STUDENTS ACROSS 15 CLASSES
  // 40 students per class:
  // Classes 1..3 (K16, 120 SV): 2300001 -> 2300120 (GRADUATED)
  // Classes 4..8 (K17, 200 SV): 2400001 -> 2400200 (ACTIVE, vài bạn SUSPENDED)
  // Classes 9..13 (K18, 200 SV): 2500001 -> 2500200 (ACTIVE)
  // Classes 14..15 (K19, 80 SV): 2600001 -> 2600080 (ACTIVE - tân sinh viên)
  
  const classConfigs = [
    // K16 (classes 1..3, 120 SV, sinh năm 2002)
    { classId: 1, codePrefix: '23', year: 2002, count: 40, status: 'GRADUATED', deptId: 1 },
    { classId: 2, codePrefix: '23', year: 2002, count: 40, status: 'GRADUATED', deptId: 2 },
    { classId: 3, codePrefix: '23', year: 2002, count: 40, status: 'GRADUATED', deptId: 3 },
    // K17 (classes 4..8, 200 SV, sinh năm 2003)
    { classId: 4, codePrefix: '24', year: 2003, count: 40, status: 'ACTIVE', deptId: 1 },
    { classId: 5, codePrefix: '24', year: 2003, count: 40, status: 'ACTIVE', deptId: 1 },
    { classId: 6, codePrefix: '24', year: 2003, count: 40, status: 'ACTIVE', deptId: 2 },
    { classId: 7, codePrefix: '24', year: 2003, count: 40, status: 'ACTIVE', deptId: 3 },
    { classId: 8, codePrefix: '24', year: 2003, count: 40, status: 'ACTIVE', deptId: 4 },
    // K18 (classes 9..13, 200 SV, sinh năm 2004)
    { classId: 9,  codePrefix: '25', year: 2004, count: 40, status: 'ACTIVE', deptId: 1 },
    { classId: 10, codePrefix: '25', year: 2004, count: 40, status: 'ACTIVE', deptId: 1 },
    { classId: 11, codePrefix: '25', year: 2004, count: 40, status: 'ACTIVE', deptId: 2 },
    { classId: 12, codePrefix: '25', year: 2004, count: 40, status: 'ACTIVE', deptId: 3 },
    { classId: 13, codePrefix: '25', year: 2004, count: 40, status: 'ACTIVE', deptId: 4 },
    // K19 (classes 14..15, 80 SV, sinh năm 2005)
    { classId: 14, codePrefix: '26', year: 2005, count: 40, status: 'ACTIVE', deptId: 1 },
    { classId: 15, codePrefix: '26', year: 2005, count: 40, status: 'ACTIVE', deptId: 5 },
  ];

  let currentStudentId = 1;
  let currentUserId = 27; // after admin (1) + 25 lecturers (2..26)
  const allStudents = [];
  const studentUserRows = [];
  const studentRows = [];

  // Track code counter per prefix
  const prefixCounter = { '23': 1, '24': 1, '25': 1, '26': 1 };

  classConfigs.forEach(cfg => {
    const rawNames = generateStudentNames(cfg.count);
    rawNames.forEach((item, idx) => {
      const studentId = currentStudentId++;
      const userId = currentUserId++;
      const codeSeq = prefixCounter[cfg.codePrefix]++;
      const studentCode = `${cfg.codePrefix}${String(codeSeq).padStart(5, '0')}`;
      const email = `${studentCode}@sv.sms.edu.vn`;
      const phone = `0912${String(100000 + studentId).slice(1)}`;
      const address = hanoiAddresses[studentId % hanoiAddresses.length];
      
      const month = String((studentId % 12) + 1).padStart(2, '0');
      const day = String((studentId % 28) + 1).padStart(2, '0');
      const dob = `${cfg.year}-${month}-${day}`;

      let status = cfg.status;
      // Edge cases for testing: 3 suspended students, 2 inactive
      if (studentId === 150 || studentId === 280 || studentId === 410) status = 'SUSPENDED';
      if (studentId === 200 || studentId === 350) status = 'INACTIVE';

      studentUserRows.push(`(${userId}, '${studentCode}', '${BCRYPT_123456}', '${email}', 3, TRUE)`);
      studentRows.push(`(${studentId}, ${userId}, '${studentCode}', '${item.fullName}', '${dob}', '${item.gender}', '${email}', '${phone}', '${address}', ${cfg.classId}, '${status}')`);

      allStudents.push({
        studentId,
        userId,
        studentCode,
        fullName: item.fullName,
        deptId: cfg.deptId,
        classId: cfg.classId,
        cohort: cfg.codePrefix, // '23', '24', '25', '26'
        status
      });
    });
  });

  sql += `-- 9. USERS CHO 600 SINH VIÊN\nINSERT INTO users (id, username, password, email, role_id, is_active) VALUES\n`;
  sql += studentUserRows.join(',\n') + ';\n\n';

  sql += `-- 10. STUDENTS (600 sinh viên chuẩn tiếng Việt)\nINSERT INTO students (id, user_id, student_code, full_name, date_of_birth, gender, email, phone, address, class_id, status) VALUES\n`;
  sql += studentRows.join(',\n') + ';\n\n';

  // 11. ENROLLMENTS & GRADES
  sql += `-- 11 & 12. ENROLLMENTS & GRADES (Dữ liệu điểm phân bố chuẩn Gauss)\nINSERT INTO enrollments (id, student_id, section_id, enrolled_at, status) VALUES\n`;
  const enrollmentRows = [];
  const gradeRows = [];
  let currentEnrollmentId = 1;
  let currentGradeId = 1;

  // Cohort semester mappings:
  // K16 (cohort '23'): Took HK1-2024 (sem 1), HK2-2024 (sem 2), HK1-2025 (sem 3). All COMPLETED.
  // K17 (cohort '24'): Took HK2-2024 (sem 2), HK1-2025 (sem 3), HK1-2026 (sem 4).
  // K18 (cohort '25'): Took HK1-2025 (sem 3), HK1-2026 (sem 4).
  // K19 (cohort '26'): Just started HK1-2026 (sem 4).

  function addEnrollmentAndGrade(student, sectionId, enrolledAt, isCompleted, isOngoing) {
    const eid = currentEnrollmentId++;
    const status = isCompleted ? 'COMPLETED' : 'ENROLLED';
    enrollmentRows.push(`(${eid}, ${student.studentId}, ${sectionId}, '${enrolledAt}', '${status}')`);

    if (isCompleted) {
      const g = generateGaussScores();
      gradeRows.push(`(${currentGradeId++}, ${eid}, ${g.cc}, ${g.gk}, ${g.ck}, ${g.total}, '${g.letter}', ${g.gpa}, TRUE)`);
    } else if (isOngoing) {
      // Ongoing semester HK1-2026: Attendance + Midterm available, final exam pending
      const cc = Math.min(10.0, +(7.5 + Math.random() * 2.5).toFixed(1));
      const gk = Math.min(10.0, +(6.0 + Math.random() * 3.5).toFixed(1));
      gradeRows.push(`(${currentGradeId++}, ${eid}, ${cc}, ${gk}, NULL, NULL, NULL, NULL, FALSE)`);
    }
  }

  allStudents.forEach(s => {
    // Determine which sections this student takes based on cohort and department
    if (s.cohort === '23') { // K16
      // Sem 1 (HK1-2024)
      if (s.deptId === 1) [1, 2, 3, 9].forEach(sec => addEnrollmentAndGrade(s, sec, '2024-08-20 08:30:00', true, false));
      else if (s.deptId === 2) [4, 5, 8, 10].forEach(sec => addEnrollmentAndGrade(s, sec, '2024-08-20 08:30:00', true, false));
      else if (s.deptId === 3) [6, 1, 8, 9].forEach(sec => addEnrollmentAndGrade(s, sec, '2024-08-20 08:30:00', true, false));
      // Sem 2 (HK2-2024)
      if (s.deptId === 1) [11, 12, 13, 20].forEach(sec => addEnrollmentAndGrade(s, sec, '2025-01-20 09:00:00', true, false));
      else if (s.deptId === 2) [14, 15, 20, 21].forEach(sec => addEnrollmentAndGrade(s, sec, '2025-01-20 09:00:00', true, false));
      else if (s.deptId === 3) [16, 17, 20, 22].forEach(sec => addEnrollmentAndGrade(s, sec, '2025-01-20 09:00:00', true, false));
      // Sem 3 (HK1-2025)
      if (s.deptId === 1) [23, 24, 25, 26].forEach(sec => addEnrollmentAndGrade(s, sec, '2025-08-22 10:00:00', true, false));
      else if (s.deptId === 2) [27, 28, 34].forEach(sec => addEnrollmentAndGrade(s, sec, '2025-08-22 10:00:00', true, false));
      else if (s.deptId === 3) [29, 30, 35].forEach(sec => addEnrollmentAndGrade(s, sec, '2025-08-22 10:00:00', true, false));
    } else if (s.cohort === '24') { // K17
      // Sem 2 (HK2-2024)
      if (s.deptId === 1) [11, 12, 22].forEach(sec => addEnrollmentAndGrade(s, sec, '2025-01-22 09:15:00', true, false));
      else if (s.deptId === 2) [14, 15].forEach(sec => addEnrollmentAndGrade(s, sec, '2025-01-22 09:15:00', true, false));
      else if (s.deptId === 3) [16, 17].forEach(sec => addEnrollmentAndGrade(s, sec, '2025-01-22 09:15:00', true, false));
      else if (s.deptId === 4) [18, 19].forEach(sec => addEnrollmentAndGrade(s, sec, '2025-01-22 09:15:00', true, false));
      // Sem 3 (HK1-2025)
      if (s.deptId === 1) [23, 24, 26].forEach(sec => addEnrollmentAndGrade(s, sec, '2025-08-24 09:30:00', true, false));
      else if (s.deptId === 2) [27, 28].forEach(sec => addEnrollmentAndGrade(s, sec, '2025-08-24 09:30:00', true, false));
      else if (s.deptId === 3) [29, 30].forEach(sec => addEnrollmentAndGrade(s, sec, '2025-08-24 09:30:00', true, false));
      else if (s.deptId === 4) [31, 32].forEach(sec => addEnrollmentAndGrade(s, sec, '2025-08-24 09:30:00', true, false));
      // Sem 4 (HK1-2026 - Ongoing)
      if (s.deptId === 1) [37, 38, 39, 40].forEach(sec => addEnrollmentAndGrade(s, sec, '2026-08-26 14:00:00', false, true));
      else if (s.deptId === 2) [42, 43].forEach(sec => addEnrollmentAndGrade(s, sec, '2026-08-26 14:00:00', false, true));
      else if (s.deptId === 3) [44, 45].forEach(sec => addEnrollmentAndGrade(s, sec, '2026-08-26 14:00:00', false, true));
      else if (s.deptId === 4) [46, 47].forEach(sec => addEnrollmentAndGrade(s, sec, '2026-08-26 14:00:00', false, true));
    } else if (s.cohort === '25') { // K18
      // Sem 3 (HK1-2025)
      if (s.deptId === 1) [33, 2].forEach(sec => addEnrollmentAndGrade(s, sec, '2025-08-25 11:00:00', true, false));
      else if (s.deptId === 2) [34, 5].forEach(sec => addEnrollmentAndGrade(s, sec, '2025-08-25 11:00:00', true, false));
      else if (s.deptId === 3) [35, 6].forEach(sec => addEnrollmentAndGrade(s, sec, '2025-08-25 11:00:00', true, false));
      else if (s.deptId === 4) [7, 8].forEach(sec => addEnrollmentAndGrade(s, sec, '2025-08-25 11:00:00', true, false));
      // Sem 4 (HK1-2026 - Ongoing)
      if (s.deptId === 1) [37, 41].forEach(sec => addEnrollmentAndGrade(s, sec, '2026-08-27 10:00:00', false, true));
      else if (s.deptId === 2) [42, 49].forEach(sec => addEnrollmentAndGrade(s, sec, '2026-08-27 10:00:00', false, true));
      else if (s.deptId === 3) [44].forEach(sec => addEnrollmentAndGrade(s, sec, '2026-08-27 10:00:00', false, true));
      else if (s.deptId === 4) [46].forEach(sec => addEnrollmentAndGrade(s, sec, '2026-08-27 10:00:00', false, true));
    } else if (s.cohort === '26') { // K19
      // Sem 4 (HK1-2026 - Ongoing)
      if (s.deptId === 1) [48, 50].forEach(sec => addEnrollmentAndGrade(s, sec, '2026-08-28 15:30:00', false, true));
      else if (s.deptId === 5) [50].forEach(sec => addEnrollmentAndGrade(s, sec, '2026-08-28 15:30:00', false, true));
    }
  });

  sql += enrollmentRows.join(',\n') + ';\n\n';

  sql += `-- 12. GRADES\nINSERT INTO grades (id, enrollment_id, attendance_score, midterm_score, final_score, total_score, letter_grade, gpa_point, is_finalized) VALUES\n`;
  sql += gradeRows.join(',\n') + ';\n\n';

  // 13. SCHEDULES (Thời khóa biểu chi tiết cho 50 lớp học phần)
  sql += `-- 13. SCHEDULES (Thời khóa biểu không trùng phòng)\nINSERT INTO schedules (section_id, class_id, day_of_week, start_period, end_period, room, start_date, end_date, note) VALUES\n`;
  const scheduleRows = [
    // Sem 1
    `(1, 1, 2, 1, 3, 'A101', '2024-09-01', '2025-01-15', 'Giải tích 1 - Giảng đường A')`,
    `(2, 1, 4, 4, 6, 'A102', '2024-09-01', '2025-01-15', 'Đại số tuyến tính')`,
    `(3, 1, 6, 1, 3, 'A201', '2024-09-01', '2025-01-15', 'Nhập môn lập trình C/C++')`,
    `(4, 2, 3, 7, 9, 'B101', '2024-09-01', '2025-01-15', 'Nguyên lý quản trị')`,
    `(5, 2, 5, 1, 3, 'B102', '2024-09-01', '2025-01-15', 'Kinh tế vi mô')`,
    `(6, 3, 2, 7, 9, 'C101', '2024-09-01', '2025-01-15', 'Kỹ thuật điện đại cương')`,
    `(7, 8, 3, 1, 3, 'D101', '2024-09-01', '2025-01-15', 'Cơ học kỹ thuật')`,
    `(8, 15, 5, 7, 9, 'C201', '2024-09-01', '2025-01-15', 'Tiếng Anh giao tiếp học thuật')`,
    `(9, 1, 7, 1, 3, 'B201', '2024-09-01', '2025-01-15', 'Triết học Mác - Lênin')`,
    `(10, 2, 7, 4, 5, 'B202', '2024-09-01', '2025-01-15', 'Pháp luật đại cương')`,

    // Sem 2
    `(11, 4, 2, 1, 3, 'A103', '2025-02-01', '2025-06-30', 'Lập trình Java nâng cao')`,
    `(12, 4, 3, 4, 6, 'A104', '2025-02-01', '2025-06-30', 'Cơ sở dữ liệu')`,
    `(13, 5, 5, 1, 3, 'A202', '2025-02-01', '2025-06-30', 'Cấu trúc dữ liệu & Giải thuật')`,
    `(14, 6, 4, 7, 9, 'B103', '2025-02-01', '2025-06-30', 'Kinh tế vĩ mô')`,
    `(15, 6, 6, 1, 3, 'B104', '2025-02-01', '2025-06-30', 'Quản trị Marketing')`,
    `(16, 7, 4, 1, 4, 'C102', '2025-02-01', '2025-06-30', 'Mạch điện tử và vi xử lý')`,
    `(17, 7, 6, 7, 9, 'C103', '2025-02-01', '2025-06-30', 'Hệ thống điều khiển tự động')`,
    `(18, 8, 2, 7, 9, 'D102', '2025-02-01', '2025-06-30', 'Vẽ kỹ thuật & CAD 3D')`,
    `(19, 8, 5, 7, 9, 'D103', '2025-02-01', '2025-06-30', 'Sức bền vật liệu')`,
    `(20, 15, 3, 7, 9, 'C202', '2025-02-01', '2025-06-30', 'Tiếng Anh chuyên ngành')`,
    `(21, 15, 7, 1, 3, 'C203', '2025-02-01', '2025-06-30', 'Tiếng Nhật sơ cấp 1')`,
    `(22, 4, 7, 7, 9, 'A203', '2025-02-01', '2025-06-30', 'Vật lý đại cương 1')`,

    // Sem 3
    `(23, 9, 2, 1, 3, 'A101', '2025-09-01', '2026-01-15', 'Phát triển ứng dụng Web')`,
    `(24, 9, 4, 4, 6, 'A102', '2025-09-01', '2026-01-15', 'Mạng máy tính')`,
    `(25, 10, 6, 1, 3, 'A103', '2025-09-01', '2026-01-15', 'Trí tuệ nhân tạo căn bản')`,
    `(26, 10, 3, 7, 9, 'A201', '2025-09-01', '2026-01-15', 'Kỹ thuật phần mềm')`,
    `(27, 11, 2, 7, 9, 'B101', '2025-09-01', '2026-01-15', 'Kế toán tài chính')`,
    `(28, 11, 5, 1, 3, 'B102', '2025-09-01', '2026-01-15', 'Quản trị tài chính doanh nghiệp')`,
    `(29, 12, 4, 7, 9, 'C101', '2025-09-01', '2026-01-15', 'Cảm biến và đo lường điện')`,
    `(30, 12, 6, 7, 9, 'C102', '2025-09-01', '2026-01-15', 'Hệ thống nhúng và IoT')`,
    `(31, 13, 3, 1, 4, 'D101', '2025-09-01', '2026-01-15', 'Kỹ thuật động cơ ô tô')`,
    `(32, 13, 5, 7, 9, 'D102', '2025-09-01', '2026-01-15', 'Công nghệ chế tạo máy CNC')`,
    `(33, 9, 4, 1, 3, 'A104', '2025-09-01', '2026-01-15', 'Nhập môn lập trình (Lớp bổ sung)')`,
    `(34, 11, 6, 4, 6, 'B103', '2025-09-01', '2026-01-15', 'Nguyên lý quản trị (Lớp bổ sung)')`,
    `(35, 12, 2, 4, 6, 'C103', '2025-09-01', '2026-01-15', 'Kỹ thuật điện đại cương (Lớp bổ sung)')`,
    `(36, 15, 7, 1, 3, 'C201', '2025-09-01', '2026-01-15', 'Tiếng Anh giao tiếp học thuật')`,

    // Sem 4 (Ongoing Semester)
    `(37, 4, 2, 1, 3, 'A101', '2026-09-01', '2027-01-15', 'Phát triển ứng dụng Web - Đồ án thực hành')`,
    `(38, 4, 4, 4, 6, 'A102', '2026-09-01', '2027-01-15', 'Kỹ thuật phần mềm - Quy trình Agile/Scrum')`,
    `(39, 5, 6, 1, 3, 'A103', '2026-09-01', '2027-01-15', 'Kiểm thử phần mềm tự động hóa')`,
    `(40, 5, 3, 1, 3, 'A201', '2026-09-01', '2027-01-15', 'An toàn thông tin & Mật mã học')`,
    `(41, 9, 2, 7, 9, 'A202', '2026-09-01', '2027-01-15', 'Trí tuệ nhân tạo - Machine Learning')`,
    `(42, 6, 3, 7, 9, 'B101', '2026-09-01', '2027-01-15', 'Quản trị tài chính nâng cao')`,
    `(43, 6, 5, 4, 6, 'B102', '2026-09-01', '2027-01-15', 'Quản trị nhân lực hiện đại')`,
    `(44, 7, 4, 7, 9, 'C101', '2026-09-01', '2027-01-15', 'Cảm biến & Xử lý tín hiệu số')`,
    `(45, 7, 6, 7, 9, 'C102', '2026-09-01', '2027-01-15', 'Hệ thống nhúng IoT thực tế')`,
    `(46, 8, 4, 1, 4, 'D101', '2026-09-01', '2027-01-15', 'Động cơ ô tô & Chẩn đoán xe điện')`,
    `(47, 8, 5, 7, 9, 'D102', '2026-09-01', '2027-01-15', 'Gia công CNC & CAD/CAM')`,
    `(48, 14, 2, 4, 6, 'A104', '2026-09-01', '2027-01-15', 'Nhập môn lập trình cho tân sinh viên K19')`,
    `(49, 11, 4, 1, 3, 'B103', '2026-09-01', '2027-01-15', 'Nguyên lý quản trị doanh nghiệp K18')`,
    `(50, 15, 6, 4, 6, 'C201', '2026-09-01', '2027-01-15', 'Tiếng Anh giao tiếp đại cương K19')`
  ];

  sql += scheduleRows.join(',\n') + ';\n\n';

  // 14. UPDATE ENROLLED_COUNT IN COURSE_SECTIONS
  sql += `-- 14. UPDATE ENROLLED_COUNT
UPDATE course_sections cs
SET enrolled_count = (
    SELECT COUNT(*) FROM enrollments e
    WHERE e.section_id = cs.id AND e.status != 'CANCELLED'
);

SET FOREIGN_KEY_CHECKS = 1;
`;

  return { sql, stats: { students: allStudents.length, lecturers: lecturersData.length, subjects: subjectsData.length, sections: sectionsData.length, enrollments: enrollmentRows.length, grades: gradeRows.length } };
}

const res = buildSql();
const outputPath = path.join(__dirname, 'seed.sql');
fs.writeFileSync(outputPath, res.sql, 'utf8');
console.log(`Generated enriched seed.sql with:`);
console.log(`- Students: ${res.stats.students}`);
console.log(`- Lecturers: ${res.stats.lecturers}`);
console.log(`- Subjects: ${res.stats.subjects}`);
console.log(`- Course Sections: ${res.stats.sections}`);
console.log(`- Enrollments: ${res.stats.enrollments}`);
console.log(`- Grades: ${res.stats.grades}`);
console.log(`File written to: ${outputPath} (${(Buffer.byteLength(res.sql, 'utf8') / 1024).toFixed(1)} KB)`);
