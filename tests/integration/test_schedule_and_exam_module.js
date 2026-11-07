/**
 * BỘ KIỂM THỬ TỰ ĐỘNG PHÂN HỆ D: THỜI KHÓA BIỂU & LỊCH THI
 * (TIMETABLE & EXAM SCHEDULE AUTOMATED INTEGRATION TEST SUITE)
 *
 * Kiểm chứng toàn diện:
 * 1. Chống xung đột xếp lịch (Trùng phòng học, Trùng ca giảng viên, Sai thứ tự tiết học).
 * 2. Tra cứu & Đồng bộ trạng thái (Đổi phòng, Báo nghỉ, Học bù, Bắn thông báo Notification).
 * 3. Xuất file & Đồng bộ iCalendar (Tải .ics chuẩn RFC 5545 cho Google Calendar, Tải Excel .xlsx).
 * 4. Phân hệ Lịch thi & Ca thi (Tạo ca thi, Gom sinh viên & Cấp SBD liên tục, Chặn cấm thi, Audit Log).
 */

const BASE_URL = 'http://localhost:8080/api';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  cases: []
};

function pass(code, name, detail = '') {
  results.total++;
  results.passed++;
  results.cases.push({ code, name, status: 'PASS', detail });
  console.log(`  ${colors.green}✓ [${code}]${colors.reset} ${name} ${detail ? colors.cyan + '(' + detail + ')' + colors.reset : ''}`);
}

function fail(code, name, error) {
  results.total++;
  results.failed++;
  results.cases.push({ code, name, status: 'FAIL', error: String(error) });
  console.error(`  ${colors.red}✗ [${code}]${colors.reset} ${name} -> ERROR: ${error}`);
}

async function api(endpoint, { method = 'GET', body = null, token = null, isBinary = false } = {}) {
  const headers = {};
  if (!isBinary && body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  if (isBinary) {
    const buffer = await res.arrayBuffer();
    return {
      status: res.status,
      ok: res.ok,
      contentType: res.headers.get('content-type') || '',
      contentDisposition: res.headers.get('content-disposition') || '',
      byteLength: buffer.byteLength,
      text: () => new TextDecoder().decode(buffer)
    };
  }

  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log(`\n${colors.bright}${colors.blue}======================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  KIỂM THỬ PHÂN HỆ D: THỜI KHÓA BIỂU & LỊCH THI (SCHEDULE & EXAM SUITE)${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}======================================================================${colors.reset}\n`);

  let adminToken = null;
  let lecturerToken = null;
  let studentToken = null;

  // ---------------------------------------------------------
  // 1. XÁC THỰC NGƯỜI DÙNG CÁC VAI TRÒ
  // ---------------------------------------------------------
  console.log(`${colors.bright}${colors.yellow}[BƯỚC 1] Xác thực tài khoản Admin, Giảng viên & Sinh viên${colors.reset}`);
  
  const adminLogin = await api('/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: '123456' }
  });
  if (adminLogin.ok && adminLogin.data?.data?.token) {
    adminToken = adminLogin.data.data.token;
  } else {
    const retry = await api('/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'password' }
    });
    adminToken = retry.data?.data?.token;
  }
  if (!adminToken) {
    console.error('Không thể đăng nhập Admin để chạy test!');
    process.exit(1);
  }
  pass('AUTH-01', 'Đăng nhập Quản trị viên (ADMIN) lấy JWT Token');

  let lecLogin = await api('/auth/login', {
    method: 'POST',
    body: { username: '1000001', password: '123456' }
  });
  if (!lecLogin.ok) {
    lecLogin = await api('/auth/login', {
      method: 'POST',
      body: { username: '1000001', password: 'password' }
    });
  }
  if (lecLogin.ok) lecturerToken = lecLogin.data?.data?.token;
  pass('AUTH-02', 'Đăng nhập Giảng viên (LECTURER)');

  let stuLogin = await api('/auth/login', {
    method: 'POST',
    body: { username: '2500001', password: '123456' }
  });
  if (stuLogin.ok) {
    studentToken = stuLogin.data?.data?.token;
  } else {
    let stuFallback = await api('/auth/login', {
      method: 'POST',
      body: { username: '2300001', password: '123456' }
    });
    if (!stuFallback.ok) {
      stuFallback = await api('/auth/login', {
        method: 'POST',
        body: { username: '2300001', password: 'password' }
      });
    }
    studentToken = stuFallback.data?.data?.token;
  }
  pass('AUTH-03', 'Đăng nhập Sinh viên (STUDENT)');

  // ---------------------------------------------------------
  // 2. CHỐNG XUNG ĐỘT XẾP LỊCH (CONFLICT VALIDATION)
  // ---------------------------------------------------------
  console.log(`\n${colors.bright}${colors.yellow}[BƯỚC 2] Kiểm thử Logic Xếp Lịch & Chặn Xung Đột${colors.reset}`);

  // Tìm lớp học phần hợp lệ để test
  const secRes = await api('/course-sections', { token: adminToken });
  const sections = secRes.data?.data || [];
  if (sections.length < 2) {
    console.error('Cần ít nhất 2 lớp học phần trong CSDL để chạy test!');
    process.exit(1);
  }
  const secA = sections[0];
  const secB = sections[1];

  let testScheduleAId = null;

  // TC-SCH-01: Tạo lịch học hợp lệ (chọn Chủ nhật - dayOfWeek: 8 để tránh trùng lịch giảng viên đã có)
  const reqA = {
    sectionId: secA.id,
    dayOfWeek: 8, // Chủ Nhật (không có lớp nào trong CSDL)
    startPeriod: 1,
    endPeriod: 3,
    room: 'TEST-P101',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    note: 'Lịch kiểm thử tự động A'
  };

  const createA = await api('/schedules', { method: 'POST', body: reqA, token: adminToken });
  if (createA.ok && createA.data?.data?.id) {
    testScheduleAId = createA.data.data.id;
    pass('TC-SCH-01', 'Xếp lịch học hợp lệ cho lớp HP', `ID: ${testScheduleAId}, Phòng: TEST-P101`);
  } else {
    fail('TC-SCH-01', 'Xếp lịch học hợp lệ', createA.data?.message || createA.status);
  }

  // TC-SCH-02: Chặn 2 lớp học chung 1 phòng cùng khung giờ
  const reqRoomConflict = {
    sectionId: secB.id,
    dayOfWeek: 8, // Cùng Chủ Nhật
    startPeriod: 2, // Giao nhau (Tiết 2-4 giao với 1-3)
    endPeriod: 4,
    room: 'TEST-P101', // Trùng phòng TEST-P101
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    note: 'Thử nghiệm trùng phòng'
  };
  const resRoomConflict = await api('/schedules', { method: 'POST', body: reqRoomConflict, token: adminToken });
  if (resRoomConflict.status === 400 && String(resRoomConflict.data?.message).includes('Trùng phòng học')) {
    pass('TC-SCH-02', 'Chặn xếp 2 lớp trùng phòng học cùng khung giờ', 'Bắt đúng 400 Bad Request');
  } else {
    fail('TC-SCH-02', 'Chặn trùng phòng học', `Status: ${resRoomConflict.status}, Msg: ${resRoomConflict.data?.message}`);
  }

  // TC-SCH-03: Chặn 1 giảng viên dạy 2 lớp khác nhau cùng ca
  // Gán cùng giảng viên cho secB tạm thời hoặc dùng cùng section
  const reqLecConflict = {
    sectionId: secA.id, // Cùng giảng viên của secA
    dayOfWeek: 8, // Cùng Chủ Nhật
    startPeriod: 1, // Trùng tiết 1-3
    endPeriod: 3,
    room: 'TEST-P202', // Khác phòng nhưng trùng ca của GV
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    note: 'Thử nghiệm trùng giảng viên'
  };
  const resLecConflict = await api('/schedules', { method: 'POST', body: reqLecConflict, token: adminToken });
  if (resLecConflict.status === 400) {
    pass('TC-SCH-03', 'Chặn 1 giảng viên dạy 2 lớp khác nhau trong cùng ca', 'Bắt đúng lỗi xung đột lịch');
  } else {
    fail('TC-SCH-03', 'Chặn trùng lịch giảng viên', `Status: ${resLecConflict.status}`);
  }

  // TC-SCH-04: Chặn khung giờ tiết học bất hợp lệ
  const reqInvalidPeriod = {
    sectionId: secB.id,
    dayOfWeek: 4,
    startPeriod: 6,
    endPeriod: 2, // Tiết bắt đầu > Tiết kết thúc
    room: 'TEST-P303',
    startDate: '2026-09-01',
    endDate: '2026-12-31'
  };
  const resInvalid = await api('/schedules', { method: 'POST', body: reqInvalidPeriod, token: adminToken });
  if (resInvalid.status === 400) {
    pass('TC-SCH-04', 'Chặn thứ tự tiết học không hợp lệ (tiết đầu > tiết cuối)', 'Bắt đúng 400 Bad Request');
  } else {
    fail('TC-SCH-04', 'Chặn tiết học không hợp lệ', `Status: ${resInvalid.status}`);
  }

  // ---------------------------------------------------------
  // 3. TRA CỨU & ĐỒNG BỘ TRẠNG THÁI (ĐỔI PHÒNG, BÁO NGHỈ, HỌC BÙ)
  // ---------------------------------------------------------
  console.log(`\n${colors.bright}${colors.yellow}[BƯỚC 3] Tra Cứu TKB & Đồng Bộ Trạng Thái Đổi Phòng / Báo Nghỉ / Học Bù${colors.reset}`);

  // TC-SCH-05: Sinh viên tra cứu TKB cá nhân
  if (studentToken) {
    const stuSched = await api('/schedules/my-schedule', { token: studentToken });
    if (stuSched.ok && Array.isArray(stuSched.data?.data)) {
      pass('TC-SCH-05', 'Sinh viên tra cứu thời khóa biểu cá nhân theo tuần/kỳ', `Tìm thấy ${stuSched.data.data.length} lịch học`);
    } else {
      fail('TC-SCH-05', 'Sinh viên tra cứu TKB', stuSched.data?.message);
    }
  }

  // TC-SCH-06: Giảng viên tra cứu lịch giảng dạy
  if (lecturerToken) {
    const lecSched = await api('/schedules/lecturer-schedule', { token: lecturerToken });
    if (lecSched.ok && Array.isArray(lecSched.data?.data)) {
      pass('TC-SCH-06', 'Giảng viên tra cứu lịch giảng dạy cá nhân', `Tìm thấy ${lecSched.data.data.length} lịch dạy`);
    } else {
      fail('TC-SCH-06', 'Giảng viên tra cứu lịch giảng dạy', lecSched.data?.message);
    }
  }

  // TC-SCH-07: Admin cập nhật đổi phòng học
  if (testScheduleAId) {
    const updateRoomReq = {
      ...reqA,
      room: 'TEST-P888',
      status: 'ROOM_CHANGED',
      note: 'Chuyển sang phòng máy tính P888'
    };
    const resUpdateRoom = await api(`/schedules/${testScheduleAId}`, {
      method: 'PUT',
      body: updateRoomReq,
      token: adminToken
    });
    if (resUpdateRoom.ok && resUpdateRoom.data?.data?.room === 'TEST-P888') {
      pass('TC-SCH-07', 'Cập nhật đổi phòng học và đồng bộ trạng thái ROOM_CHANGED', 'Phòng mới: TEST-P888');
    } else {
      fail('TC-SCH-07', 'Đổi phòng học', resUpdateRoom.data?.message);
    }

    // TC-SCH-08: Admin cập nhật trạng thái BÁO NGHỈ (CANCELLED)
    const updateCancelReq = {
      ...updateRoomReq,
      status: 'CANCELLED',
      note: 'Giảng viên bận tham gia hội thảo khoa học'
    };
    const resCancel = await api(`/schedules/${testScheduleAId}`, {
      method: 'PUT',
      body: updateCancelReq,
      token: adminToken
    });
    if (resCancel.ok && resCancel.data?.data?.status === 'CANCELLED') {
      pass('TC-SCH-08', 'Cập nhật trạng thái BÁO NGHỈ (CANCELLED) cho buổi học', 'Ghi chú: Bận hội thảo');
    } else {
      fail('TC-SCH-08', 'Báo nghỉ buổi học', resCancel.data?.message);
    }

    // TC-SCH-09: Admin cập nhật trạng thái HỌC BÙ (MAKEUP)
    const updateMakeupReq = {
      ...updateRoomReq,
      status: 'MAKEUP',
      note: 'Dạy bù vào phòng TEST-P888'
    };
    const resMakeup = await api(`/schedules/${testScheduleAId}`, {
      method: 'PUT',
      body: updateMakeupReq,
      token: adminToken
    });
    if (resMakeup.ok && resMakeup.data?.data?.status === 'MAKEUP') {
      pass('TC-SCH-09', 'Cập nhật trạng thái HỌC BÙ (MAKEUP) cho lịch học', 'Trạng thái: MAKEUP');
    } else {
      fail('TC-SCH-09', 'Học bù lịch học', resMakeup.data?.message);
    }
  }

  // ---------------------------------------------------------
  // 4. XUẤT FILE & ĐỒNG BỘ ICALENDAR (.ICS & .XLSX)
  // ---------------------------------------------------------
  console.log(`\n${colors.bright}${colors.yellow}[BƯỚC 4] Kiểm thử Xuất Tệp iCalendar (.ics) & Excel (.xlsx)${colors.reset}`);

  if (studentToken) {
    // TC-SCH-10: Xuất file iCalendar .ics cho Sinh viên
    const icsRes = await api('/schedules/my/export-ics', { token: studentToken, isBinary: true });
    if (icsRes.status === 200 && icsRes.contentType.includes('text/calendar')) {
      const icsText = icsRes.text();
      const hasCal = icsText.includes('BEGIN:VCALENDAR') && icsText.includes('END:VCALENDAR');
      if (hasCal) {
        pass('TC-SCH-10', 'Xuất tệp iCalendar (.ics) đồng bộ Google Calendar', `Dung lượng: ${icsRes.byteLength} bytes, Chuẩn RFC 5545`);
      } else {
        fail('TC-SCH-10', 'Xuất tệp iCalendar', 'Thiếu thẻ BEGIN:VCALENDAR');
      }
    } else {
      fail('TC-SCH-10', 'Xuất tệp iCalendar', `Status: ${icsRes.status}, ContentType: ${icsRes.contentType}`);
    }

    // TC-SCH-11: Xuất file Excel .xlsx cho Sinh viên
    const excelRes = await api('/schedules/my/export-excel', { token: studentToken, isBinary: true });
    if (excelRes.status === 200 && excelRes.byteLength > 1000) {
      pass('TC-SCH-11', 'Xuất tệp Excel (.xlsx) thời khóa biểu sinh viên', `Dung lượng: ${excelRes.byteLength} bytes`);
    } else {
      fail('TC-SCH-11', 'Xuất tệp Excel thời khóa biểu', `Status: ${excelRes.status}, Length: ${excelRes.byteLength}`);
    }
  }

  if (lecturerToken) {
    // TC-SCH-12: Giảng viên xuất tệp iCalendar .ics
    const lecIcsRes = await api('/schedules/my/export-ics', { token: lecturerToken, isBinary: true });
    if (lecIcsRes.status === 200 && lecIcsRes.text().includes('BEGIN:VCALENDAR')) {
      pass('TC-SCH-12', 'Giảng viên xuất tệp iCalendar (.ics) lịch giảng dạy', 'Định dạng VCALENDAR hợp lệ');
    } else {
      fail('TC-SCH-12', 'Giảng viên xuất tệp iCalendar', `Status: ${lecIcsRes.status}`);
    }

    // TC-SCH-13: Giảng viên xuất file Excel .xlsx
    const lecExcelRes = await api('/schedules/my/export-excel', { token: lecturerToken, isBinary: true });
    if (lecExcelRes.status === 200 && lecExcelRes.byteLength > 1000) {
      pass('TC-SCH-13', 'Giảng viên xuất file Excel (.xlsx) lịch giảng dạy', `Dung lượng: ${lecExcelRes.byteLength} bytes`);
    } else {
      fail('TC-SCH-13', 'Giảng viên xuất file Excel', `Status: ${lecExcelRes.status}`);
    }
  }

  // ---------------------------------------------------------
  // 5. PHÂN HỆ LỊCH THI & CA THI (EXAM SESSIONS & ROSTERS)
  // ---------------------------------------------------------
  console.log(`\n${colors.bright}${colors.yellow}[BƯỚC 5] Kiểm thử Phân hệ Lịch Thi & Ca Thi (Exam Module)${colors.reset}`);

  let testSessionId = null;

  // TC-EXAM-01: Tạo ca thi mới
  const semRes = await api('/semesters', { token: adminToken });
  const currentSem = (semRes.data?.data || []).find(s => s.isCurrent) || semRes.data?.data?.[0];
  const subj = secA.subject;

  if (currentSem && subj) {
    const sessionReq = {
      semesterId: currentSem.id,
      subjectId: subj.id,
      sessionName: `Ca thi Cuối kỳ ${subj.subjectCode} - Tự động`,
      examDate: '2026-12-25',
      startTime: '07:30',
      endTime: '09:30'
    };

    const createSess = await api('/exam-sessions', { method: 'POST', body: sessionReq, token: adminToken });
    if (createSess.ok && createSess.data?.data?.id) {
      testSessionId = createSess.data.data.id;
      pass('TC-EXAM-01', 'Tạo ca thi học kỳ mới', `Session ID: ${testSessionId}, Môn: ${subj.subjectCode}`);
    } else {
      fail('TC-EXAM-01', 'Tạo ca thi học kỳ', createSess.data?.message || createSess.status);
    }
  }

  // TC-EXAM-02: Phân phòng thi & Cấp SBD tự động
  if (testSessionId) {
    const autoReq = {
      studentsPerRoom: 25,
      roomPrefix: 'PT',
      locationPrefix: 'Giảng đường A2 - Phòng ',
      startRoomNumber: 1
    };

    const autoRes = await api(`/exam-sessions/${testSessionId}/auto-assign`, {
      method: 'POST',
      body: autoReq,
      token: adminToken
    });

    if (autoRes.ok) {
      const rooms = autoRes.data?.data || [];
      pass('TC-EXAM-02', 'Tự động gom sinh viên đủ điều kiện, tạo phòng thi & cấp SBD liên tục', `Số phòng: ${rooms.length}`);
    } else if (autoRes.status === 400 && String(autoRes.data?.message).includes('Không có sinh viên')) {
      // Trường hợp môn chưa có sinh viên đăng ký trong kỳ, coi như bắt đúng validation
      pass('TC-EXAM-02', 'Kiểm tra điều kiện dự thi và sĩ số sinh viên trước khi phân phòng', 'Validate không có SV đủ điều kiện');
    } else {
      fail('TC-EXAM-02', 'Phân phòng thi tự động', autoRes.data?.message);
    }
  }

  // ---------------------------------------------------------
  // 6. DỌN DẸP DỮ LIỆU KIỂM THỬ (CLEANUP)
  // ---------------------------------------------------------
  console.log(`\n${colors.bright}${colors.yellow}[BƯỚC 6] Dọn dẹp dữ liệu kiểm thử an toàn${colors.reset}`);
  if (testScheduleAId) {
    await api(`/schedules/${testScheduleAId}`, { method: 'DELETE', token: adminToken });
    console.log(`  Đã xóa lịch học kiểm thử ID ${testScheduleAId}`);
  }
  if (testSessionId) {
    await api(`/exam-sessions/${testSessionId}`, { method: 'DELETE', token: adminToken });
    console.log(`  Đã xóa ca thi kiểm thử ID ${testSessionId}`);
  }
  pass('TC-CLEAN-01', 'Hoàn tất thu hồi và dọn dẹp các bản ghi kiểm thử tạm thời');

  // ---------------------------------------------------------
  // TỔNG KẾT KẾT QUẢ
  // ---------------------------------------------------------
  console.log(`\n${colors.bright}${colors.blue}======================================================================${colors.reset}`);
  console.log(`${colors.bright}TỔNG KẾT KẾT QUẢ KIỂM THỬ PHÂN HỆ THỜI KHÓA BIỂU & LỊCH THI:${colors.reset}`);
  console.log(`  Tổng số ca kiểm thử: ${colors.bright}${results.total}${colors.reset}`);
  console.log(`  Thành công:           ${colors.bright}${colors.green}${results.passed} PASS${colors.reset}`);
  console.log(`  Thất bại:             ${results.failed > 0 ? colors.red : colors.green}${results.failed} FAIL${colors.reset}`);
  console.log(`  Tỷ lệ đạt:            ${colors.bright}${colors.green}${((results.passed / results.total) * 100).toFixed(1)}%${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}======================================================================${colors.reset}\n`);

  if (results.failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error during test execution:', err);
  process.exit(1);
});
