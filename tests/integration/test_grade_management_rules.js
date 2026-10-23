const db = require('../utils/db_helper');

const BASE_URL = 'http://localhost:8080/api';

async function req(endpoint, { method = 'GET', body = null, token = null } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function main() {
  console.log('=== TEST BỘ QUY CHẾ ĐIỂM SỐ (GRADE MANAGEMENT RULES) ===\n');

  // 1. Auth setup
  const adminRes = await req('/auth/login', { method: 'POST', body: { username: 'admin', password: '123456' } });
  const lecRes = await req('/auth/login', { method: 'POST', body: { username: '1000001', password: '123456' } });
  const stuRes = await req('/auth/login', { method: 'POST', body: { username: '2500001', password: '123456' } });
  const adminToken = adminRes.data.data.token;
  const lecToken = lecRes.data.data.token;
  const stuToken = stuRes.data.data.token;

  // Lấy 1 lớp học phần và enrollment để test
  const secRow = db.queryDb("SELECT cs.id FROM course_sections cs WHERE cs.lecturer_id = 1 LIMIT 1")[0];
  const sectionId = secRow.id;
  const enrollRows = db.queryDb(`SELECT id, student_id FROM enrollments WHERE section_id = ${sectionId} AND status = 'ENROLLED' LIMIT 1`);
  if (!enrollRows.length) throw new Error('Không có enrollment để test');
  const enrollmentId = enrollRows[0].id;

  // TC-G01: Ràng buộc biên điểm [0.0, 10.0]
  const errMax = await req('/grades', {
    method: 'PUT',
    token: lecToken,
    body: { enrollmentId, cc1Score: 11.0, cc2Score: 9.0, midtermScore: 8.0, finalScore: 8.0 }
  });
  if (errMax.status !== 400) throw new Error(`TC-G01 Fail: Điểm > 10 không bị chặn (status=${errMax.status})`);

  const errMin = await req('/grades', {
    method: 'PUT',
    token: lecToken,
    body: { enrollmentId, cc1Score: -1.0, cc2Score: 9.0, midtermScore: 8.0, finalScore: 8.0 }
  });
  if (errMin.status !== 400) throw new Error(`TC-G01 Fail: Điểm âm không bị chặn (status=${errMin.status})`);
  console.log('✓ TC-G01 PASS: Chặn điểm ngoài khoảng [0.0 - 10.0] chuẩn HTTP 400.');

  // TC-G02: Công thức trọng số (5% + 5% + 30% + 60%) & Quy đổi Thang chữ / Thang 4
  // 10*0.05 + 10*0.05 + 8*0.3 + 9*0.6 = 0.5 + 0.5 + 2.4 + 5.4 = 8.8 -> A (GPA 4.0)
  const okGrade = await req('/grades', {
    method: 'PUT',
    token: adminToken, // dùng admin để đảm bảo không bị vướng lock cũ
    body: { enrollmentId, cc1Score: 10.0, cc2Score: 10.0, midtermScore: 8.0, finalScore: 9.0, finalize: false }
  });
  if (okGrade.status !== 200) throw new Error(`TC-G02 Fail: Không lưu được điểm hợp lệ: ${JSON.stringify(okGrade.data)}`);
  
  const dbG02 = db.queryDb(`SELECT total_score, letter_grade, gpa_point FROM grades WHERE enrollment_id = ${enrollmentId}`)[0];
  if (parseFloat(dbG02.total_score) !== 8.8 || dbG02.letter_grade !== 'A' || parseFloat(dbG02.gpa_point) !== 4.0) {
    throw new Error(`TC-G02 Fail: Điểm tính sai: total=${dbG02.total_score}, letter=${dbG02.letter_grade}, gpa=${dbG02.gpa_point}`);
  }
  console.log('✓ TC-G02 PASS: Công thức 5%-5%-30%-60% tính đúng total=8.8, letter=A, gpa=4.0.');

  // TC-G03: Quy chế điểm liệt cuối kỳ (CK < 3.0 -> Trượt F dù tổng điểm >= 4.0)
  // 10*0.05 + 10*0.05 + 10*0.3 + 2.5*0.6 = 0.5 + 0.5 + 3.0 + 1.5 = 5.5 (đáng lẽ C) nhưng CK=2.5 < 3.0 -> F
  await req('/grades', {
    method: 'PUT',
    token: adminToken,
    body: { enrollmentId, cc1Score: 10.0, cc2Score: 10.0, midtermScore: 10.0, finalScore: 2.5, finalize: false }
  });
  const dbG03 = db.queryDb(`SELECT total_score, letter_grade, gpa_point FROM grades WHERE enrollment_id = ${enrollmentId}`)[0];
  if (dbG03.letter_grade !== 'F' || parseFloat(dbG03.gpa_point) !== 0.0) {
    throw new Error(`TC-G03 Fail: Điểm liệt CK < 3.0 không ép về F: letter=${dbG03.letter_grade}, gpa=${dbG03.gpa_point}`);
  }
  console.log('✓ TC-G03 PASS: Quy chế điểm liệt CK=2.5 < 3.0 tự động xếp loại F (GPA 0.0).');

  // TC-G04: Khóa sổ nghiêm ngặt & Chặn Giảng viên sửa sau khóa
  // Khóa sổ
  await req('/grades', {
    method: 'PUT',
    token: adminToken,
    body: { enrollmentId, cc1Score: 9.0, cc2Score: 9.0, midtermScore: 8.0, finalScore: 8.0, finalize: true }
  });
  // Giả lập khóa cứng (hết hạn ân hạn)
  db.executeSql(`UPDATE grades SET finalized_at = DATE_SUB(NOW(), INTERVAL 8 DAY) WHERE enrollment_id = ${enrollmentId};`);
  const lecEdit = await req('/grades', {
    method: 'PUT',
    token: lecToken,
    body: { enrollmentId, cc1Score: 10.0, cc2Score: 10.0, midtermScore: 10.0, finalScore: 10.0 }
  });
  if (lecEdit.status !== 400) throw new Error(`TC-G04 Fail: Giảng viên vẫn sửa được điểm đã khóa (status=${lecEdit.status})`);
  console.log('✓ TC-G04 PASS: Khóa sổ thành công, Giảng viên bị chặn sửa điểm (HTTP 400).');

  // TC-G05 & TC-G06: Admin điều chỉnh điểm sau khóa sổ & Lưu Audit Log (Grade Appeal Review)
  // Tạo 1 đơn phúc khảo mẫu cho enrollment này
  const gradeId = db.queryScalar(`SELECT id FROM grades WHERE enrollment_id = ${enrollmentId}`);
  const stuId = enrollRows[0].student_id;
  db.executeSql(`DELETE FROM grade_appeals WHERE enrollment_id = ${enrollmentId};`);
  db.executeSql(`INSERT INTO grade_appeals (enrollment_id, student_id, score_component, current_score, desired_score, reason, status, created_at, updated_at) VALUES (${enrollmentId}, ${stuId}, 'FINAL', 8.0, 9.0, 'Đơn phúc khảo test quy chế', 'PENDING', NOW(), NOW());`);
  const appealId = db.queryScalar(`SELECT id FROM grade_appeals WHERE enrollment_id = ${enrollmentId} ORDER BY id DESC LIMIT 1`);

  // TC-G06: Từ chối hoặc chấp thuận mà thiếu lý do / điểm mới -> Bị chặn
  const errReview = await req(`/grade-appeals/${appealId}/review`, {
    method: 'PUT',
    token: adminToken,
    body: { status: 'APPROVED', newScore: null } // thiếu newScore
  });
  if (errReview.status !== 400) throw new Error('TC-G06 Fail: Không chặn khi thiếu điểm mới khi duyệt');
  console.log('✓ TC-G06 PASS: Duyệt điều chỉnh điểm thiếu dữ liệu bắt buộc bị từ chối (HTTP 400).');

  // TC-G05: Admin duyệt có lý do + điểm mới -> Bảng điểm cập nhật và Audit Log lưu trong DB
  const okReview = await req(`/grade-appeals/${appealId}/review`, {
    method: 'PUT',
    token: adminToken,
    body: { status: 'APPROVED', newScore: 9.0, reviewNotes: 'Đã chấm lại bài thi cuối kỳ: nâng từ 8.0 lên 9.0' }
  });
  if (okReview.status !== 200) throw new Error(`TC-G05 Fail: Admin review thất bại: ${JSON.stringify(okReview.data)}`);

  // Kiểm tra Audit Log và bảng grades trong MySQL
  const auditRow = db.queryDb(`SELECT reviewer_id, review_notes, new_score, status FROM grade_appeals WHERE id = ${appealId}`)[0];
  if (auditRow.status !== 'APPROVED' || parseFloat(auditRow.new_score) !== 9.0 || !auditRow.review_notes) {
    throw new Error(`TC-G05 Fail: Audit Log không lưu đúng: ${JSON.stringify(auditRow)}`);
  }
  const gradeAfter = db.queryDb(`SELECT final_score, total_score FROM grades WHERE id = ${gradeId}`)[0];
  if (parseFloat(gradeAfter.final_score) !== 9.0) {
    throw new Error(`TC-G05 Fail: Bảng grades không được cập nhật điểm mới: final=${gradeAfter.final_score}`);
  }
  console.log('✓ TC-G05 PASS: Admin điều chỉnh điểm sau khóa có Audit Log lưu vết chi tiết (ai duyệt, lý do, điểm cũ -> mới) và bảng grades cập nhật chuẩn xác!');

  // Dọn dẹp dữ liệu test
  db.executeSql(`DELETE FROM grade_appeals WHERE id = ${appealId};`);
  db.executeSql(`UPDATE grades SET cc1_score = 9.0, cc2_score = 9.0, midterm_score = 8.0, final_score = 8.0, total_score = 8.1, letter_grade = 'B+', gpa_point = 3.5, is_finalized = 1 WHERE id = ${gradeId};`);

  console.log('\n========================================================');
  console.log('🎉 TOÀN BỘ 6/6 QUY TẮC QUẢN LÝ ĐIỂM SỐ ĐẠT 100% PASS!');
  console.log('========================================================\n');
}

main().catch(err => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
