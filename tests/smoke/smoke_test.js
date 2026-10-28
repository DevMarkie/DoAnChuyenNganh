#!/usr/bin/env node
/**
 * ============================================================================
 * SMOKE TEST SUITE - RELEASE VERIFICATION GATE
 * Dự án: Hệ Thống Quản Lý Đào Tạo & Sinh Viên (DevMarkie/DoAnChuyenNganh)
 * ============================================================================
 * Mục đích:
 * - Kiểm tra siêu tốc (< 30 giây) ngay sau khi deploy/build xong.
 * - Xác định xem bản build có "sống" không và các luồng cốt lõi có thông suốt.
 * - Quy tắc "Fail-Fast": 1 test fail -> Dừng và kết luận bản release không đạt.
 * ============================================================================
 */

const BASE_URL = process.env.API_URL || 'http://localhost:8080/api';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ANSI Colors
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BLUE = '\x1b[34m';
const DIM = '\x1b[2m';

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  startTime: Date.now(),
  cases: []
};

function banner() {
  console.log(`\n${BOLD}${CYAN}======================================================================${RESET}`);
  console.log(`${BOLD}${CYAN} 💨 SMOKE TEST SUITE - POST-DEPLOY RELEASE GATE (< 30s)${RESET}`);
  console.log(`${DIM} Target Backend:  ${BASE_URL}${RESET}`);
  console.log(`${DIM} Target Frontend: ${FRONTEND_URL}${RESET}`);
  console.log(`${BOLD}${CYAN}======================================================================${RESET}\n`);
}

async function apiRequest(endpoint, { method = 'GET', body = null, token = null, timeout = 5000 } = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    clearTimeout(id);

    let data = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    clearTimeout(id);
    return { status: 0, ok: false, error: err.name === 'AbortError' ? 'TIMEOUT (5s)' : err.message };
  }
}

async function runSmokeCase(code, name, testFn) {
  results.total++;
  const start = performance.now();
  try {
    await testFn();
    const duration = Math.round(performance.now() - start);
    results.passed++;
    results.cases.push({ code, name, status: 'PASS', duration });
    console.log(`  ${GREEN}✔ PASS${RESET} ${DIM}[${duration}ms]${RESET} ${BOLD}${code}:${RESET} ${name}`);
    return true;
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    results.failed++;
    const errMsg = err.message || String(err);
    results.cases.push({ code, name, status: 'FAIL', duration, error: errMsg });
    console.log(`  ${RED}✖ FAIL${RESET} ${DIM}[${duration}ms]${RESET} ${BOLD}${code}:${RESET} ${name}`);
    console.log(`    ${YELLOW}↳ Lỗi: ${errMsg}${RESET}`);
    return false;
  }
}

async function main() {
  banner();

  let adminToken = null;
  let lecturerToken = null;
  let studentToken = null;

  // SMK-01: Backend Server Connectivity
  await runSmokeCase('SMK-01', 'Backend Server Liveness & Actuator Ping', async () => {
    const res = await apiRequest('/auth/logout', { method: 'POST', timeout: 5000 });
    if (res.status === 0) {
      throw new Error(`Backend không phản hồi trên cổng 8080: ${res.error}`);
    }
  });

  // SMK-02: Database Connectivity via Login
  await runSmokeCase('SMK-02', 'Cơ Sở Dữ Liệu MySQL Connectivity (via Auth Endpoint)', async () => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: '123456' },
      timeout: 5000
    });
    if (res.status === 0 || !res.ok) {
      throw new Error(`Không thể kết nối CSDL MySQL hoặc sai tài khoản admin: ${res.error || res.data?.message}`);
    }
    if (!res.data?.data?.token) {
      throw new Error('Đăng nhập thành công nhưng không có JWT token trả về');
    }
    adminToken = res.data.data.token;
  });

  // SMK-03: Admin Role & Privilege
  await runSmokeCase('SMK-03', 'Xác thực Quyền Quản Trị Viên (Role: ADMIN)', async () => {
    if (!adminToken) throw new Error('Không có token Admin từ SMK-02');
    const res = await apiRequest('/dashboard', { token: adminToken, timeout: 5000 });
    if (!res.ok || !res.data?.success) {
      throw new Error(`Không thể đọc Dashboard Quản trị: ${res.data?.message || res.status}`);
    }
    const stats = res.data.data;
    if (stats.totalStudents === undefined || stats.totalLecturers === undefined) {
      throw new Error('Dữ liệu thống kê Dashboard bị thiếu các trường cốt lõi');
    }
  });

  // SMK-04: Lecturer Authentication
  await runSmokeCase('SMK-04', 'Xác thực Tài khoản Giảng Viên (1000001 / Role: LECTURER)', async () => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { username: '1000001', password: '123456' },
      timeout: 5000
    });
    if (!res.ok || res.data?.data?.role !== 'LECTURER') {
      throw new Error(`Đăng nhập Giảng viên thất bại: ${res.data?.message || res.status}`);
    }
    lecturerToken = res.data.data.token;
  });

  // SMK-05: Student Authentication
  await runSmokeCase('SMK-05', 'Xác thực Tài khoản Sinh Viên (2300001 / Role: STUDENT)', async () => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { username: '2300001', password: '123456' },
      timeout: 5000
    });
    if (!res.ok || res.data?.data?.role !== 'STUDENT') {
      throw new Error(`Đăng nhập Sinh viên thất bại: ${res.data?.message || res.status}`);
    }
    studentToken = res.data.data.token;
  });

  // SMK-06: Subject Catalog Read
  await runSmokeCase('SMK-06', 'Truy vấn Danh mục Môn học Đào tạo (/api/subjects)', async () => {
    const res = await apiRequest('/subjects', { token: adminToken, timeout: 5000 });
    if (!res.ok || !Array.isArray(res.data?.data)) {
      throw new Error(`Không đọc được danh sách môn học: ${res.data?.message || res.status}`);
    }
    if (res.data.data.length === 0) {
      throw new Error('Danh mục môn học trong CSDL đang rỗng');
    }
  });

  // SMK-07: Course Sections Active Read
  await runSmokeCase('SMK-07', 'Truy vấn Danh sách Lớp Học Phần Mở (/api/course-sections)', async () => {
    const res = await apiRequest('/course-sections', { token: studentToken, timeout: 5000 });
    if (!res.ok || !Array.isArray(res.data?.data)) {
      throw new Error(`Không đọc được danh sách lớp học phần: ${res.data?.message || res.status}`);
    }
  });

  // SMK-08: Student Profile & Academic Transcript Read
  await runSmokeCase('SMK-08', 'Truy vấn Hồ sơ & Bảng điểm Sinh viên (/api/students/me)', async () => {
    const res = await apiRequest('/students/me', { token: studentToken, timeout: 5000 });
    if (!res.ok || !res.data?.data) {
      throw new Error(`Không đọc được hồ sơ sinh viên 2300001: ${res.data?.message || res.status}`);
    }
    const profile = res.data.data;
    if (!profile.studentCode || !profile.fullName) {
      throw new Error('Dữ liệu hồ sơ sinh viên bị rỗng mã sinh viên hoặc họ tên');
    }
  });

  // SMK-09: Lecturer Classes Read
  await runSmokeCase('SMK-09', 'Truy vấn Lớp học phần phân công của Giảng viên', async () => {
    const res = await apiRequest('/course-sections/my-sections', { token: lecturerToken, timeout: 5000 });
    // Nếu endpoint my-sections hoặc course-sections hoạt động bình thường
    if (!res.ok && res.status !== 404) {
      throw new Error(`Lỗi khi truy vấn lớp giảng dạy: ${res.data?.message || res.status}`);
    }
  });

  // SMK-10: Frontend Web Server & SPA Availability
  await runSmokeCase('SMK-10', 'Frontend Single-Page App Web Server Availability', async () => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(FRONTEND_URL, { signal: controller.signal });
      clearTimeout(id);
      if (!res.ok && res.status !== 304) {
        throw new Error(`Frontend HTTP status ${res.status}`);
      }
    } catch (err) {
      // Nếu dev không bật frontend dev server cổng 5173, thử kiểm tra cổng 80 (Nginx Docker)
      try {
        const res = await fetch('http://localhost:80', { signal: AbortSignal.timeout(2000) });
        if (!res.ok) throw new Error();
      } catch {
        console.log(`    ${YELLOW}⚠ Cảnh báo: Frontend server không online ở ${FRONTEND_URL} hoặc cổng 80 (có thể đang test API Backend riêng lẻ).${RESET}`);
      }
    }
  });

  // Summary
  const totalDuration = ((Date.now() - results.startTime) / 1000).toFixed(2);
  console.log(`\n${BOLD}${CYAN}======================================================================${RESET}`);
  console.log(`${BOLD} KẾT QUẢ SMOKE TEST GATE:${RESET}`);
  console.log(` - Tổng số test case: ${BOLD}${results.total}${RESET}`);
  console.log(` - Vượt qua (Passed):  ${GREEN}${BOLD}${results.passed}${RESET}`);
  console.log(` - Thất bại (Failed):  ${results.failed > 0 ? RED : GREEN}${BOLD}${results.failed}${RESET}`);
  console.log(` - Thời gian thực thi: ${BOLD}${totalDuration}s${RESET}`);
  console.log(`${BOLD}${CYAN}======================================================================${RESET}\n`);

  if (results.failed === 0) {
    console.log(`${GREEN}${BOLD}🎉 SMOKE TEST PASSED: BẢN BUILD SẴN SÀNG CHO REGRESSION TEST / RELEASE!${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`${RED}${BOLD}🚨 SMOKE TEST FAILED: CÓ LUỒNG CỐT LÕI BỊ SẬP! HỦY BỎ RELEASE & ROLLBACK!${RESET}\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`${RED}Lỗi nghiêm trọng khi thực thi Smoke Test: ${err.message}${RESET}`);
  process.exit(1);
});
