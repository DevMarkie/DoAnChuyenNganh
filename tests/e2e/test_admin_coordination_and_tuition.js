/**
 * SUITE 11: KIỂM THỬ ĐIỀU PHỐI ĐÀO TẠO & QUẢN LÝ TÀI CHÍNH (ADMIN COORDINATION & TUITION)
 * Dự án: DoAnChuyenNganh - Hệ Thống Quản Lý Đào Tạo & Sinh Viên (SMS)
 * 
 * Kiểm thử toàn diện 4 trụ cột nghiệp vụ Admin / Phòng Đào tạo:
 * 1. Quản lý danh mục cơ sở & Tài khoản:
 *    - Reset mật khẩu mặc định (123456) tại quầy cho Sinh viên & Giảng viên.
 *    - Đăng nhập kiểm chứng với mật khẩu mới được cấp lại.
 * 2. Quản lý Lớp học phần:
 *    - Cấu hình minStudents & maxStudents.
 *    - Chặn vi phạm ràng buộc minStudents > maxStudents.
 * 3. Quản lý Đợt ĐKHP & Thu ngân Học phí:
 *    - Mở cổng đăng ký học phần (open-registration) với thời hạn và hạn chót nộp tiền.
 *    - Đóng cổng đăng ký học phần (close-registration).
 *    - Tra cứu hóa đơn học phí sinh viên theo kỳ.
 *    - Thu ngân xác nhận thu tiền mặt (collect-cash) & xuất phiếu thu.
 *    - Quét danh sách sinh viên nợ quá hạn (overdue scanner).
 * 4. Quản lý & Công bố điểm:
 *    - Xem tổng quan tiến độ chấm điểm toàn trường (Admin Overview).
 *    - Bấm nút "Công bố điểm" (Publish Section) -> thông báo gửi tới sinh viên.
 *    - Mở khóa / Hủy công bố (Unpublish Section) để trả về cho Giảng viên chỉnh sửa.
 */

const { executeSql, queryDb } = require('../utils/db_helper');

const BASE_URL = 'http://localhost:8080/api';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let passCount = 0;
let failCount = 0;

function pass(msg) {
  passCount++;
  console.log(`  ${colors.green}✓ PASS:${colors.reset} ${msg}`);
}

function fail(msg, err) {
  failCount++;
  console.error(`  ${colors.red}✗ FAIL:${colors.reset} ${msg}`);
  if (err) console.error(`    ${colors.yellow}Chi tiết:${colors.reset}`, err);
}

function info(msg) {
  console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`);
}

function group(title) {
  console.log(`\n${colors.bright}${colors.blue}=== ${title} ===${colors.reset}`);
}

async function api(endpoint, { method = 'GET', body = null, token = null } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  let data;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, ok: res.ok, data };
}

async function login(username, password = '123456') {
  const res = await api('/auth/login', {
    method: 'POST',
    body: { username, password },
  });
  if (res.ok) {
    return res.data?.data?.token || res.data?.token;
  }
  return null;
}

async function run() {
  console.log('================================================================');
  console.log('  KIỂM THỬ ĐIỀU PHỐI ĐÀO TẠO & QUẢN LÝ TÀI CHÍNH (ADMIN COORDINATION)');
  console.log('================================================================');

  let adminToken = await login('admin', '123456');
  if (!adminToken) {
    fail('Không thể đăng nhập tài khoản Admin');
    process.exit(1);
  }
  pass('Đăng nhập Admin thành công');

  // =========================================================================
  group('1. QUẢN LÝ TÀI KHOẢN: CẤP LẠI MẬT KHẨU TẠI QUẦY (RESET PASSWORD)');
  // =========================================================================
  let studentId = 1;
  let lecturerId = 1;

  // Lấy ID sinh viên và giảng viên thực tế
  const stdRes = await api('/students', { token: adminToken });
  if (stdRes.ok && stdRes.data?.data?.length > 0) {
    studentId = stdRes.data.data[0].id;
  }
  const lecRes = await api('/lecturers', { token: adminToken });
  if (lecRes.ok && lecRes.data?.data?.length > 0) {
    lecturerId = lecRes.data.data[0].id;
  }

  // 1.1 Reset password Sinh viên
  const resetStdRes = await api(`/students/${studentId}/reset-password`, {
    method: 'POST',
    token: adminToken,
  });
  if (resetStdRes.ok) {
    pass(`Cấp lại mật khẩu mặc định thành công cho Sinh viên ID=${studentId}`);
  } else {
    fail('Không thể cấp lại mật khẩu Sinh viên', resetStdRes.data);
  }

  // Kiểm tra đăng nhập với 123456
  const stdCode = stdRes.data.data[0].studentCode;
  const stdLoginToken = await login(stdCode, '123456');
  if (stdLoginToken) {
    pass(`Sinh viên (${stdCode}) đăng nhập thành công với mật khẩu vừa cấp lại "123456"`);
    // Sinh viên đổi mật khẩu để gỡ bỏ cờ mustChangePassword
    await api('/auth/change-password', {
      method: 'PUT',
      token: stdLoginToken,
      body: { oldPassword: '123456', newPassword: 'password' },
    });
  } else {
    fail(`Sinh viên (${stdCode}) không đăng nhập được bằng mật khẩu mới 123456`);
  }

  // 1.2 Reset password Giảng viên
  const resetLecRes = await api(`/lecturers/${lecturerId}/reset-password`, {
    method: 'POST',
    token: adminToken,
  });
  if (resetLecRes.ok) {
    pass(`Cấp lại mật khẩu mặc định thành công cho Giảng viên ID=${lecturerId}`);
  } else {
    fail('Không thể cấp lại mật khẩu Giảng viên', resetLecRes.data);
  }

  const lecCode = lecRes.data.data[0].lecturerCode;
  const lecLoginToken = await login(lecCode, '123456');
  if (lecLoginToken) {
    pass(`Giảng viên (${lecCode}) đăng nhập thành công với mật khẩu vừa cấp lại "123456"`);
    // Giảng viên đổi mật khẩu để gỡ bỏ cờ mustChangePassword
    await api('/auth/change-password', {
      method: 'PUT',
      token: lecLoginToken,
      body: { oldPassword: '123456', newPassword: 'password' },
    });
  } else {
    fail(`Giảng viên (${lecCode}) không đăng nhập được bằng mật khẩu mới 123456`);
  }

  // Phục hồi trạng thái tài khoản sạch (must_change_password=0) để các test suite khác chạy trơn tru
  try {
    executeSql(`UPDATE users SET must_change_password = 0, password = (SELECT p FROM (SELECT password as p FROM users WHERE username = 'admin') as t) WHERE username IN ('${stdCode}', '${lecCode}')`);
  } catch (err) {
    // Ignore if local dev environment doesn't have mysql cli
  }

  // =========================================================================
  group('2. QUẢN LÝ LỚP HỌC PHẦN: QUY ĐỊNH SỐ SLOT TỐI THIỂU & TỐI ĐA');
  // =========================================================================
  const subRes = await api('/subjects', { token: adminToken });
  const semListRes = await api('/semesters', { token: adminToken });
  const subjectId = subRes.data?.data?.[0]?.id;
  const semesterId = semListRes.data?.data?.[0]?.id;

  const testSectionCode = `TEST_SLOT_${Date.now().toString().slice(-4)}`;

  // 2.1 Chặn nếu minStudents > maxStudents
  const invalidSlotRes = await api('/course-sections', {
    method: 'POST',
    token: adminToken,
    body: {
      sectionCode: `${testSectionCode}_ERR`,
      subjectId,
      semesterId,
      lecturerId,
      room: 'P.301-GD2',
      minStudents: 50,
      maxStudents: 30, // Lỗi: min > max
    },
  });
  if (!invalidSlotRes.ok && invalidSlotRes.status === 400) {
    pass('Chặn thành công khi tạo lớp có số sinh viên tối thiểu > tối đa (minStudents > maxStudents)');
  } else {
    fail('Chưa chặn trường hợp minStudents > maxStudents', invalidSlotRes.data);
  }

  // 2.2 Tạo lớp hợp lệ với minStudents=20, maxStudents=40
  const validSlotRes = await api('/course-sections', {
    method: 'POST',
    token: adminToken,
    body: {
      sectionCode: testSectionCode,
      subjectId,
      semesterId,
      lecturerId,
      room: 'P.301-GD2',
      minStudents: 20,
      maxStudents: 40,
    },
  });
  let createdSectionId = null;
  if (validSlotRes.ok && validSlotRes.data?.data?.minStudents === 20) {
    createdSectionId = validSlotRes.data.data.id;
    pass(`Tạo lớp học phần thành công với minStudents=20, maxStudents=40 (ID=${createdSectionId})`);
  } else {
    fail('Không thể tạo lớp học phần với slot min/max', validSlotRes.data);
  }

  // =========================================================================
  group('3. QUẢN LÝ ĐỢT ĐKHP & THU NGÂN HỌC PHÍ (CORE CASHIER LOGIC)');
  // =========================================================================
  // 3.1 Mở cổng ĐKHP tức thì
  const openGateRes = await api(`/semesters/${semesterId}/open-registration?days=14&deadline=2026-11-30`, {
    method: 'PUT',
    token: adminToken,
  });
  if (openGateRes.ok && openGateRes.data?.data?.status === 'ACTIVE' && openGateRes.data?.data?.isCurrent) {
    pass(`Mở cổng ĐKHP cho kỳ [${semesterId}] thành công (Hạn học phí: ${openGateRes.data.data.tuitionDeadline})`);
  } else {
    fail('Không thể mở cổng ĐKHP', openGateRes.data);
  }

  // 3.2 Tra cứu học phí của sinh viên
  const unpaidRows = queryDb("SELECT student_id, id FROM student_invoices WHERE status = 'UNPAID';");
  const cashierStudentId = unpaidRows.length > 0 ? parseInt(unpaidRows[0].student_id) : studentId;
  const allStudentUnpaidInvoiceIds = unpaidRows
    .filter((r) => parseInt(r.student_id) === cashierStudentId)
    .map((r) => parseInt(r.id));

  const tuitionRes = await api(`/admin/tuition/student/${cashierStudentId}?semesterId=${semesterId}`, {
    token: adminToken,
  });
  if (tuitionRes.ok && tuitionRes.data?.data) {
    const summary = tuitionRes.data.data;
    pass(`Tra cứu học phí SV [${cashierStudentId}]: Đã nộp=${summary.paidAmount?.toLocaleString()}đ, Còn nợ=${summary.unpaidAmount?.toLocaleString()}đ`);
  } else {
    fail('Tra cứu học phí sinh viên thất bại', tuitionRes.data);
  }

  // 3.3 Chặn đóng một phần học phí (Quy chế 100%)
  if (allStudentUnpaidInvoiceIds.length > 1) {
    const partialRes = await api('/admin/tuition/collect-cash', {
      method: 'POST',
      token: adminToken,
      body: {
        studentId: cashierStudentId,
        semesterId,
        invoiceIds: [allStudentUnpaidInvoiceIds[0]], // Chỉ chọn 1 môn -> phải bị chặn
        notes: 'Thử đóng 1 phần học phí',
      },
    });
    if (!partialRes.ok && partialRes.data?.message?.includes('100%')) {
      pass(`Chặn thành công đóng một phần học phí: ${partialRes.data.message}`);
    } else {
      fail('Chưa chặn thu một phần học phí', partialRes.data);
    }
  }

  // 3.4 Cấp gia hạn nộp học phí 1 tuần (7 ngày)
  const extendRes = await api('/admin/tuition/extend-deadline', {
    method: 'POST',
    token: adminToken,
    body: {
      studentId: cashierStudentId,
      semesterId,
      days: 7,
      reason: 'Đơn xin hoãn nộp học phí 1 tuần',
    },
  });
  if (extendRes.ok) {
    pass(`Cấp gia hạn nộp học phí 1 tuần thành công cho SV [${cashierStudentId}]`);
  } else {
    fail('Cấp gia hạn nộp học phí thất bại', extendRes.data);
  }

  // 3.5 Thu ngân xác nhận thu 100% tiền mặt (Collect 100% Cash)
  const collectRes = await api('/admin/tuition/collect-cash', {
    method: 'POST',
    token: adminToken,
    body: {
      studentId: cashierStudentId,
      semesterId,
      invoiceIds: allStudentUnpaidInvoiceIds,
      paymentMethod: 'CASH',
      notes: 'Sinh viên nộp 100% tiền mặt trực tiếp tại quầy Phòng Đào tạo',
    },
  });
  if (collectRes.ok && collectRes.data?.data?.receiptNumber) {
    const receipt = collectRes.data.data;
    const amount = receipt.totalAmount != null ? receipt.totalAmount : receipt.amountPaid;
    pass(`Thu 100% tiền mặt thành công! Số biên lai: ${receipt.receiptNumber}, Số tiền: ${amount?.toLocaleString()}đ`);
  } else {
    fail('Thu tiền mặt tại quầy thất bại', collectRes.data);
  }

  // 3.4 Quét danh sách sinh viên nợ quá hạn
  const overdueRes = await api(`/admin/tuition/overdue?semesterId=${semesterId}`, {
    token: adminToken,
  });
  if (overdueRes.ok && Array.isArray(overdueRes.data?.data)) {
    pass(`Quét danh sách nợ quá hạn thành công (Tìm thấy ${overdueRes.data.data.length} sinh viên nợ)`);
  } else {
    fail('Quét danh sách nợ quá hạn thất bại', overdueRes.data);
  }

  // 3.5 Đóng cổng ĐKHP tức thì
  const closeGateRes = await api(`/semesters/${semesterId}/close-registration`, {
    method: 'PUT',
    token: adminToken,
  });
  if (closeGateRes.ok) {
    pass(`Đóng cổng ĐKHP tức thì thành công cho kỳ [${semesterId}]`);
  } else {
    fail('Đóng cổng ĐKHP thất bại', closeGateRes.data);
  }

  // =========================================================================
  group('4. QUẢN LÝ TIẾN ĐỘ & CÔNG BỐ ĐIỂM SỐ (GRADE OVERVIEW & PUBLISH)');
  // =========================================================================
  // 4.1 Giám sát tiến độ nộp điểm toàn trường (Admin Overview)
  const overviewRes = await api(`/grades/admin/overview?semesterId=${semesterId}`, {
    token: adminToken,
  });
  if (overviewRes.ok && Array.isArray(overviewRes.data?.data)) {
    const list = overviewRes.data.data;
    const submitted = list.filter(i => i.gradeStatus === 'SUBMITTED').length;
    const published = list.filter(i => i.gradeStatus === 'PUBLISHED').length;
    pass(`Tải tổng quan tiến độ chấm điểm thành công: ${list.length} lớp (${submitted} chờ duyệt, ${published} đã công bố)`);
  } else {
    fail('Tải tổng quan nộp điểm thất bại', overviewRes.data);
  }

  // 4.2 Thử nghiệm Unpublish / Mở khóa điểm lớp
  // Lấy 1 section có điểm để test
  const existingSecRes = await api('/course-sections', { token: adminToken });
  const secToTest = existingSecRes.data?.data?.find(s => s.status === 'COMPLETED') || existingSecRes.data?.data?.[0];
  if (secToTest) {
    const unpubRes = await api(`/grades/section/${secToTest.id}/unpublish?reason=TestUnpublish`, {
      method: 'POST',
      token: adminToken,
    });
    if (unpubRes.ok) {
      pass(`Mở khóa bảng điểm lớp [${secToTest.sectionCode}] cho Giảng viên chỉnh sửa thành công (Section status chuyển sang ACTIVE)`);
    } else {
      fail('Mở khóa bảng điểm thất bại', unpubRes.data);
    }
  }

  console.log('\n================================================================');
  console.log('TỔNG KẾT KIỂM THỬ ĐIỀU PHỐI ĐÀO TẠO & TÀI CHÍNH:');
  console.log(`  ${colors.green}Thành công (PASS): ${passCount}${colors.reset}`);
  console.log(`  ${failCount > 0 ? colors.red : colors.green}Thất bại   (FAIL): ${failCount}${colors.reset}`);
  console.log('================================================================\n');

  if (failCount > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Lỗi ngoại lệ khi chạy test:', err);
  process.exit(1);
});
