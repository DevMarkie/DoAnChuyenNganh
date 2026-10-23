/**
 * SUITE 10: KIỂM THỬ LUỒNG TRẠNG THÁI (STATE TRANSITION RULES & ACCESS CONTROL)
 * Dự án: DoAnChuyenNganh - Hệ Thống Quản Lý Đào Tạo & Sinh Viên (SMS)
 * 
 * Kiểm chứng 6 quy tắc trọng yếu:
 * 1. Lớp học phần: Luồng hợp lệ (OPEN -> CLOSED -> ACTIVE -> COMPLETED).
 * 2. Lớp học phần: Chặn nhảy cóc trạng thái (OPEN -> ACTIVE bị chặn; OPEN -> COMPLETED bị chặn).
 * 3. Chặn giảng viên nhập điểm khi Lớp học phần đang OPEN (chưa đóng đăng ký).
 * 4. Chốt điểm (Finalize): Chỉ cho phép khi lớp đang CLOSED hoặc ACTIVE; sau khi chốt, tự động chuyển lớp sang COMPLETED.
 * 5. Mở khóa điểm (Admin Unlock): Section tự động chuyển từ COMPLETED về lại ACTIVE.
 * 6. Sinh viên Bảo lưu (SUSPENDED) & Buộc thôi học (INACTIVE): Bị khóa quyền đăng ký và phúc khảo; tài khoản SUSPENDED vẫn xem điểm được (read-only), INACTIVE bị khóa hẳn.
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
};

function pass(msg) {
  console.log(`  ${colors.green}✓ PASS:${colors.reset} ${msg}`);
}

function fail(msg, err) {
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

async function login(username, password = 'password') {
  let res = await api('/auth/login', {
    method: 'POST',
    body: { username, password },
  });
  if (!res.ok) {
    res = await api('/auth/login', {
      method: 'POST',
      body: { username, password: 'password' },
    });
  }
  if (!res.ok) {
    throw new Error(`Đăng nhập thất bại: ${username} (${res.status})`);
  }
  return res.data?.data?.token || res.data?.token;
}

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    pass(testName);
    passedCount++;
  } else {
    fail(testName, detail);
    failedCount++;
  }
}

async function run() {
  console.log(`${colors.bright}${colors.cyan}================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  KIỂM THỬ LUỒNG TRẠNG THÁI & ACCESS CONTROL (STATE TRANSITIONS)  ${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}================================================================${colors.reset}`);

  try {
    const adminToken = await login('admin', '123456');
    const gvToken = await login('1000001', '123456');
    const svUsername = '2300001';
    let svToken = await login(svUsername, '123456');

    // -------------------------------------------------------------
    // Test Case 1 & 2: CourseSection State Transition & Anti-skip
    // -------------------------------------------------------------
    group('1. QUẢN LÝ TRẠNG THÁI LỚP HỌC PHẦN & CHỐNG NHẢY CÓC (ANTI-SKIP)');

    // Tạo một lớp học phần mới để thử nghiệm độc lập
    const randomCode = 'TEST_ST_' + Math.floor(Math.random() * 10000);
    const createRes = await api('/course-sections', {
      method: 'POST',
      token: adminToken,
      body: {
        sectionCode: randomCode,
        subjectId: 1,
        lecturerId: 1,
        semesterId: 1,
        maxStudents: 40,
        room: 'LAB_' + Math.floor(Math.random() * 10000),
      }
    });

    assert(createRes.ok, `Tạo lớp học phần thử nghiệm (${randomCode})`, createRes.data?.message);
    const testSection = createRes.data?.data;
    const testSectionId = testSection?.id;

    if (!testSectionId) {
      throw new Error('Không lấy được ID của lớp học phần vừa tạo');
    }

    async function updateSectionStatus(targetStatus) {
      return await api(`/course-sections/${testSectionId}`, {
        method: 'PUT',
        token: adminToken,
        body: {
          sectionCode: randomCode,
          subjectId: 1,
          lecturerId: 1,
          semesterId: 1,
          maxStudents: 40,
          room: 'B202',
          status: targetStatus
        }
      });
    }

    // Trạng thái ban đầu phải là OPEN
    assert(testSection.status === 'OPEN', `Trạng thái ban đầu của lớp là OPEN (hiện tại: ${testSection.status})`);

    // Cố tình NHẢY CÓC: OPEN -> ACTIVE (Không đóng đăng ký mà nhảy vào học) -> Phải BỊ CHẶN (HTTP 400)
    const jumpToActiveRes = await updateSectionStatus('ACTIVE');
    assert(!jumpToActiveRes.ok && jumpToActiveRes.status === 400 && jumpToActiveRes.data?.message?.includes('Vi phạm luồng trạng thái'),
      'Anti-skip: Chặn nhảy cóc trực tiếp OPEN -> ACTIVE',
      jumpToActiveRes.data?.message);

    // Cố tình NHẢY CÓC: OPEN -> COMPLETED -> Phải BỊ CHẶN (HTTP 400)
    const jumpToCompletedRes = await updateSectionStatus('COMPLETED');
    assert(!jumpToCompletedRes.ok && jumpToCompletedRes.status === 400 && jumpToCompletedRes.data?.message?.includes('Vi phạm luồng trạng thái'),
      'Anti-skip: Chặn nhảy cóc trực tiếp OPEN -> COMPLETED',
      jumpToCompletedRes.data?.message);

    // Chuyển hợp lệ: OPEN -> CLOSED (Đóng đăng ký)
    const closeRes = await updateSectionStatus('CLOSED');
    assert(closeRes.ok && closeRes.data?.data?.status === 'CLOSED',
      'Chuyển trạng thái hợp lệ: OPEN -> CLOSED');

    // Chuyển hợp lệ: CLOSED -> ACTIVE (Bắt đầu học kỳ)
    const activeRes = await updateSectionStatus('ACTIVE');
    assert(activeRes.ok && activeRes.data?.data?.status === 'ACTIVE',
      'Chuyển trạng thái hợp lệ: CLOSED -> ACTIVE');

    // -------------------------------------------------------------
    // Test Case 3: Anti-skip Grading (Chặn nhập điểm khi OPEN)
    // -------------------------------------------------------------
    group('2. CHẶN GIẢNG VIÊN NHẬP ĐIỂM KHI LỚP ĐANG OPEN');

    // Đưa lớp về lại OPEN để thử nghiệm chặn nhập điểm (ACTIVE -> CLOSED -> OPEN)
    await updateSectionStatus('CLOSED');
    await updateSectionStatus('OPEN');

    // Cho sinh viên 2500001 (studentId = 1) vào lớp bằng admin assign
    const enrollRes = await api(`/admin/enrollments/assign?studentId=1&sectionId=${testSectionId}&forceOverride=true&overrideReason=Test+state+transition`, {
      method: 'POST',
      token: adminToken
    });
    assert(enrollRes.ok, 'Gán SV001 vào lớp học phần thử nghiệm', enrollRes.data?.message);
    const enrollmentId = enrollRes.data?.data?.id;

    // Giảng viên thử nhập điểm thành phần khi lớp đang OPEN -> Phải BỊ CHẶN (HTTP 400)
    const gradeInOpenRes = await api(`/grades`, {
      method: 'PUT',
      token: gvToken,
      body: {
        enrollmentId: enrollmentId,
        cc1Score: 8.0,
        midtermScore: 7.5
      }
    });
    assert(!gradeInOpenRes.ok && gradeInOpenRes.status === 400 && gradeInOpenRes.data?.message?.includes('OPEN'),
      'Anti-skip: Chặn nhập điểm khi lớp đang OPEN (chưa đóng đăng ký)',
      gradeInOpenRes.data?.message);

    // -------------------------------------------------------------
    // Test Case 4 & 5: Grade Finalization & Auto Transition to COMPLETED
    // -------------------------------------------------------------
    group('3. CHỐT ĐIỂM VÀ TỰ ĐỘNG CHUYỂN TRẠNG THÁI SANG COMPLETED');

    // Chuyển lớp sang CLOSED rồi ACTIVE để vào giai đoạn học & nhập điểm
    await updateSectionStatus('CLOSED');
    await updateSectionStatus('ACTIVE');

    // Giảng viên nhập đủ điểm và finalize
    const finalizeRes = await api(`/grades`, {
      method: 'PUT',
      token: gvToken,
      body: {
        enrollmentId: enrollmentId,
        cc1Score: 9.0,
        cc2Score: 8.5,
        midtermScore: 8.0,
        finalScore: 8.5,
        finalize: true
      }
    });
    assert(finalizeRes.ok, 'Giảng viên nhập đủ điểm và chốt điểm thành công', finalizeRes.data?.message);

    // Kiểm tra lớp học phần xem đã tự động đổi status sang COMPLETED chưa
    const checkSectionRes = await api(`/course-sections/${testSectionId}`, {
      method: 'GET',
      token: adminToken
    });
    const finalStatus = checkSectionRes.data?.data?.status;
    assert(finalStatus === 'COMPLETED',
      `Tự động chuyển trạng thái lớp sang COMPLETED khi chốt điểm (Hiện tại: ${finalStatus})`);

    // Admin mở khóa điểm (Unfinalize) -> Section chuyển về lại ACTIVE
    const unlockRes = await api(`/grades`, {
      method: 'PUT',
      token: adminToken,
      body: {
        enrollmentId: enrollmentId,
        finalize: false
      }
    });
    assert(unlockRes.ok, 'Admin mở khóa bảng điểm (finalize = false)', unlockRes.data?.message);

    const checkUnlockedSectionRes = await api(`/course-sections/${testSectionId}`, {
      method: 'GET',
      token: adminToken
    });
    const unlockedStatus = checkUnlockedSectionRes.data?.data?.status;
    assert(unlockedStatus === 'ACTIVE',
      `Tự động chuyển trạng thái lớp từ COMPLETED về lại ACTIVE khi Admin mở khóa (Hiện tại: ${unlockedStatus})`);

    // -------------------------------------------------------------
    // Test Case 6: Student Academic Standing & Access Control
    // -------------------------------------------------------------
    group('4. SINH VIÊN BẢO LƯU (SUSPENDED) & BUỘC THÔI HỌC (INACTIVE) ACCESS CONTROL');

    const studentId = 1;
    // Chuyển SV sang SUSPENDED (Bảo lưu)
    const suspendRes = await api(`/students/${studentId}/status?status=SUSPENDED`, {
      method: 'PUT',
      token: adminToken
    });
    assert(suspendRes.ok, 'Cập nhật trạng thái SV sang SUSPENDED (Bảo lưu)', suspendRes.data?.message);

    // SV đăng nhập lại để lấy token mới (vẫn đăng nhập được vì user.isActive = true)
    let svSuspendedToken;
    try {
      svSuspendedToken = await login(svUsername, '123456');
      pass('SV Bảo lưu (SUSPENDED) vẫn đăng nhập được để tra cứu điểm/hồ sơ (Read-only)');
      passedCount++;
    } catch (err) {
      fail('SV Bảo lưu (SUSPENDED) phải đăng nhập được', err.message);
      failedCount++;
    }

    if (svSuspendedToken) {
      // SV Bảo lưu cố tình đăng ký môn học -> Phải BỊ CHẶN (HTTP 400)
      const enrollSuspendedRes = await api(`/enrollments`, {
        method: 'POST',
        token: svSuspendedToken,
        body: { sectionId: 1 }
      });
      assert(!enrollSuspendedRes.ok && enrollSuspendedRes.status === 400 && enrollSuspendedRes.data?.message?.includes('Bảo lưu'),
        'Chặn sinh viên Bảo lưu (SUSPENDED) tự đăng ký môn học',
        enrollSuspendedRes.data?.message);

      // SV Bảo lưu cố tình gửi đơn phúc khảo -> Phải BỊ CHẶN (HTTP 400)
      const appealSuspendedRes = await api(`/grade-appeals`, {
        method: 'POST',
        token: svSuspendedToken,
        body: {
          enrollmentId: enrollmentId,
          scoreComponent: 'FINAL',
          desiredScore: 9.0,
          reason: 'Em làm bài tốt và đối chiếu đáp án đạt trên 8 điểm nhưng điểm công bố chỉ được 6 điểm'
        }
      });
      assert(!appealSuspendedRes.ok && appealSuspendedRes.status === 400 && appealSuspendedRes.data?.message?.includes('Bảo lưu'),
        'Chặn sinh viên Bảo lưu (SUSPENDED) gửi đơn phúc khảo',
        appealSuspendedRes.data?.message);
    }

    // Chuyển SV sang INACTIVE (Buộc thôi học)
    const inactiveRes = await api(`/students/${studentId}/status?status=INACTIVE`, {
      method: 'PUT',
      token: adminToken
    });
    assert(inactiveRes.ok, 'Cập nhật trạng thái SV sang INACTIVE (Buộc thôi học)', inactiveRes.data?.message);

    // Thử đăng nhập bằng tài khoản SV -> Phải BỊ TỪ CHỐI (User bị disabled)
    let loginInactiveFailed = false;
    try {
      await login(svUsername, '123456');
    } catch (err) {
      loginInactiveFailed = true;
    }
    assert(loginInactiveFailed,
      'Khóa toàn bộ quyền truy cập: SV Buộc thôi học (INACTIVE) bị từ chối đăng nhập (isActive=false)');

    // Phục hồi lại trạng thái ACTIVE cho SV để không ảnh hưởng dữ liệu hệ thống
    await api(`/students/${studentId}/status?status=ACTIVE`, {
      method: 'PUT',
      token: adminToken
    });
    info('Đã phục hồi trạng thái SV về ACTIVE an toàn.');

  } catch (error) {
    console.error(`${colors.red}[FATAL ERROR]${colors.reset}`, error);
  } finally {
    console.log(`\n${colors.bright}${colors.cyan}================================================================${colors.reset}`);
    console.log(`${colors.bright}TỔNG KẾT KIỂM THỬ LUỒNG TRẠNG THÁI:${colors.reset}`);
    console.log(`  ${colors.green}Thành công (PASS): ${passedCount}${colors.reset}`);
    console.log(`  ${colors.red}Thất bại   (FAIL): ${failedCount}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}================================================================${colors.reset}\n`);
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

run();
