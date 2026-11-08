// run_all_tests.mjs
// =====================================================================================
// MASTER TEST RUNNER: ĐIỀU PHỐI KIỂM THỬ TOÀN DIỆN 100% DỰ ÁN TỪ A ĐẾN Z
// Chạy qua đầy đủ 5 tầng kiến trúc Full-Stack và in Bảng Báo Cáo Tổng Hợp Scorecard
// =====================================================================================

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function runCommand(command, args, cwd = ROOT_DIR, env = process.env) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const isPowershell = command.includes('powershell');
    const safeArgs = isPowershell ? args : args.map((arg) => {
      if (typeof arg === 'string' && arg.includes(' ') && !arg.startsWith('"')) {
        return `"${arg}"`;
      }
      return arg;
    });
    const proc = spawn(command, safeArgs, {
      cwd,
      env,
      shell: !isPowershell,
      stdio: 'inherit',
    });

    proc.on('close', (code) => {
      const durationMs = Date.now() - startTime;
      resolve({
        code,
        success: code === 0,
        durationMs,
        durationSec: (durationMs / 1000).toFixed(1),
      });
    });

    proc.on('error', (err) => {
      const durationMs = Date.now() - startTime;
      resolve({
        code: 1,
        success: false,
        durationMs,
        durationSec: (durationMs / 1000).toFixed(1),
        error: err.message,
      });
    });
  });
}

const testSuites = [
  {
    tier: 'TẦNG 1: LOGIC & MÃ NGUỒN CỐT LÕI (UNIT TESTS)',
    name: '[01/15] Backend JUnit 43 Test Suites (Spring Boot)',
    cmd: process.platform === 'win32' ? '.\\mvnw.cmd' : './mvnw',
    args: ['test', '-Dtest=*Test'],
    cwd: path.join(ROOT_DIR, 'backend'),
    expected: '43 Test Suites (100% Service Logic)',
  },
  {
    tier: 'TẦNG 1: LOGIC & MÃ NGUỒN CỐT LÕI (UNIT TESTS)',
    name: '[02/15] Frontend Vitest Component Tests (React SPA)',
    cmd: process.platform === 'win32' ? 'powershell' : 'npm',
    args: process.platform === 'win32' ? ['-NoProfile', '-Command', 'npm --prefix frontend test'] : ['--prefix', 'frontend', 'test'],
    cwd: ROOT_DIR,
    expected: '105 Tests / 21 Test Files',
  },
  {
    tier: 'TẦNG 2: KIỂM TRA SỨC KHỎE API & HẠ TẦNG (SMOKE TEST)',
    name: '[03/15] Smoke Test nhanh toàn bộ Endpoint API',
    cmd: 'node',
    args: [path.join(ROOT_DIR, 'tests', 'smoke', 'smoke_test.js')],
    cwd: ROOT_DIR,
    expected: 'Xác thực toàn bộ API Cốt lõi',
  },
  {
    tier: 'TẦNG 3: NGHIỆP VỤ LIÊN THÔNG 4 PHÂN HỆ (BUSINESS FLOWS)',
    name: '[04/15] Phân hệ Quản trị viên (Admin & Thu ngân Học phí)',
    cmd: 'node',
    args: [path.join(ROOT_DIR, 'tests', 'e2e', 'test_admin_coordination_and_tuition.js')],
    cwd: ROOT_DIR,
    expected: 'Điều phối Đào tạo & Rule B Học phí',
  },
  {
    tier: 'TẦNG 3: NGHIỆP VỤ LIÊN THÔNG 4 PHÂN HỆ (BUSINESS FLOWS)',
    name: '[05/15] Phân hệ Học phí, Miễn giảm, Cổng VNPAY & Gạch nợ IPN',
    cmd: 'node',
    args: [path.join(ROOT_DIR, 'tests', 'e2e', 'test_tuition_and_payment_gateway.js')],
    cwd: ROOT_DIR,
    expected: 'Tính công nợ, Miễn giảm, VNPAY 5 mã & Gạch nợ Rule B',
  },
  {
    tier: 'TẦNG 3: NGHIỆP VỤ LIÊN THÔNG 4 PHÂN HỆ (BUSINESS FLOWS)',
    name: '[06/15] Phân hệ Đào tạo & Khảo thí (Đính chính điểm 3 cấp)',
    cmd: 'node',
    args: [path.join(ROOT_DIR, 'tests', 'e2e', 'test_grade_amendment_e2e.cjs')],
    cwd: ROOT_DIR,
    expected: 'Quy trình duyệt 3 cấp nghiêm ngặt',
  },
  {
    tier: 'TẦNG 3: NGHIỆP VỤ LIÊN THÔNG 4 PHÂN HỆ (BUSINESS FLOWS)',
    name: '[07/15] Phân hệ Giảng viên (Điểm danh PIN 6 số & Excel)',
    cmd: 'node',
    args: [path.join(ROOT_DIR, 'tests', 'integration', 'test_attendance_feature.js')],
    cwd: ROOT_DIR,
    expected: 'Check-in Realtime & Sổ điểm điện tử',
  },
  {
    tier: 'TẦNG 3: NGHIỆP VỤ LIÊN THÔNG 4 PHÂN HỆ (BUSINESS FLOWS)',
    name: '[08/15] Phân hệ Thời khóa biểu & Lịch thi (Chống trùng, iCal, Export)',
    cmd: 'node',
    args: [path.join(ROOT_DIR, 'tests', 'integration', 'test_schedule_and_exam_module.js')],
    cwd: ROOT_DIR,
    expected: 'Chống trùng lịch, tải iCal & xuất Excel',
  },
  {
    tier: 'TẦNG 3: NGHIỆP VỤ LIÊN THÔNG 4 PHÂN HỆ (BUSINESS FLOWS)',
    name: '[09/15] Phân hệ Sinh viên (Hành trình Trải nghiệm Portal)',
    cmd: 'node',
    args: [path.join(ROOT_DIR, 'tests', 'e2e', 'user_experience_journey_test.js')],
    cwd: ROOT_DIR,
    expected: 'ĐKTC, Thời khóa biểu & Tra cứu GPA',
  },
  {
    tier: 'TẦNG 3: NGHIỆP VỤ LIÊN THÔNG 4 PHÂN HỆ (BUSINESS FLOWS)',
    name: '[10/15] Hệ thống Nghiệp vụ Toàn diện Deep-Test E2E',
    cmd: 'node',
    args: [path.join(ROOT_DIR, 'tests', 'e2e', 'comprehensive_system_test.js')],
    cwd: ROOT_DIR,
    expected: '70+ Test Cases nghiệp vụ toàn trường',
  },
  {
    tier: 'TẦNG 4: AN NINH & BẢO MẬT HỆ THỐNG (SECURITY AUDIT)',
    name: '[11/15] Kiểm thử Bảo mật cơ bản (SQLi, IDOR, JWT, Brute-Force)',
    cmd: 'node',
    args: [path.join(ROOT_DIR, 'tests', 'security', 'basic_security_test.js')],
    cwd: ROOT_DIR,
    expected: 'Phòng chống các lỗ hổng OWASP Top 10',
  },
  {
    tier: 'TẦNG 4: AN NINH & BẢO MẬT HỆ THỐNG (SECURITY AUDIT)',
    name: '[12/15] Bộ Phân quyền & Bảo mật Chốt (RBAC 5 Roles, IDOR, PII, Session)',
    cmd: 'node',
    args: [path.join(ROOT_DIR, 'tests', 'security', 'final_security_authorization_test.js')],
    cwd: ROOT_DIR,
    expected: 'Ma trận RBAC, chống IDOR & che chắn PII',
  },
  {
    tier: 'TẦNG 5: HIỆU NĂNG, QUÁ TẢI & KHÓA PHÂN TÁN (STRESS & CONCURRENCY)',
    name: '[13/15] Kiểm thử Quá tải & Áp lực Hệ thống Chuyên sâu (5 Giai đoạn)',
    cmd: 'node',
    args: [path.join(ROOT_DIR, 'tests', 'performance', 'overload_stress_test.js')],
    cwd: ROOT_DIR,
    expected: '200 Luồng, BCrypt Burst, HikariCP Pool & Tự phục hồi',
  },
  {
    tier: 'TẦNG 5: HIỆU NĂNG, QUÁ TẢI & KHÓA PHÂN TÁN (STRESS & CONCURRENCY)',
    name: '[14/15] Tranh chấp Slot Đăng ký 600 Sinh viên Đồng thời',
    cmd: 'node',
    args: [path.join(ROOT_DIR, 'tests', 'performance', 'simulate_600_enrollment.js')],
    cwd: ROOT_DIR,
    expected: 'Atomic Redis Counter & Chống tràn sĩ số',
  },
  {
    tier: 'TẦNG 5: HIỆU NĂNG, QUÁ TẢI & KHÓA PHÂN TÁN (STRESS & CONCURRENCY)',
    name: '[15/15] Bộ Kiểm thử Phi chức năng (4 Trụ cột NFR: Tải, Race, Excel, Mobile)',
    cmd: 'node',
    args: [path.join(ROOT_DIR, 'tests', 'non_functional', 'run_all.js')],
    cwd: ROOT_DIR,
    expected: 'Tải đỉnh, Race 1-slot, Excel lớn & Đa nền tảng',
  },
];

async function main() {
  console.log(`\n${colors.bold}${colors.cyan}========================================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}         HỆ THỐNG QUẢN LÝ ĐÀO TẠO & SINH VIÊN (SMS / UAMS) - MASTER TEST RUNNER        ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}          KỊCH BẢN KIỂM THỬ TOÀN DIỆN 100% DỰ ÁN FULL-STACK (15 BÀI TEST CHỦ LỰC)       ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}========================================================================================${colors.reset}\n`);

  const results = [];
  const overallStart = Date.now();

  let currentTier = '';
  for (let i = 0; i < testSuites.length; i++) {
    const suite = testSuites[i];

    if (suite.tier !== currentTier) {
      currentTier = suite.tier;
      console.log(`\n${colors.bold}${colors.blue}>>> ${currentTier}${colors.reset}`);
      console.log(`${colors.gray}----------------------------------------------------------------------------------------${colors.reset}`);
    }

    console.log(`\n${colors.bold}[BẮT ĐẦU] ${suite.name}${colors.reset}`);
    console.log(`${colors.gray}Mục tiêu kiểm thử: ${suite.expected}${colors.reset}\n`);

    const res = await runCommand(suite.cmd, suite.args, suite.cwd);
    const statusIcon = res.success ? `${colors.green}✔ PASS${colors.reset}` : `${colors.red}✖ FAIL${colors.reset}`;
    console.log(`\n${colors.bold}[KẾT QUẢ] ${suite.name}: ${statusIcon} ${colors.gray}(${res.durationSec}s)${colors.reset}\n`);

    results.push({
      index: i + 1,
      name: suite.name,
      expected: suite.expected,
      durationSec: res.durationSec,
      success: res.success,
    });
  }

  const totalTimeSec = ((Date.now() - overallStart) / 1000).toFixed(1);
  const passedCount = results.filter((r) => r.success).length;
  const failedCount = results.length - passedCount;

  // BẢNG BÁO CÁO TỔNG HỢP (MASTER TEST SCORECARD)
  console.log(`\n${colors.bold}${colors.cyan}========================================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}             BẢNG TỔNG HỢP KẾT QUẢ KIỂM THỬ TOÀN BỘ DỰ ÁN (MASTER SCORECARD)            ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}========================================================================================${colors.reset}\n`);

  console.log(`${colors.bold}STT  Hạng mục kiểm thử                                 Thời gian   Kết quả    Mục tiêu${colors.reset}`);
  console.log(`${colors.gray}----------------------------------------------------------------------------------------${colors.reset}`);

  for (const r of results) {
    const idxStr = String(r.index).padStart(2, '0');
    const namePadded = r.name.padEnd(50, ' ');
    const timeStr = `${r.durationSec}s`.padStart(7, ' ');
    const statusStr = r.success ? `${colors.green}  PASS  ${colors.reset}` : `${colors.red}  FAIL  ${colors.reset}`;
    console.log(`${colors.cyan}[${idxStr}]${colors.reset} ${namePadded} ${timeStr}  ${statusStr}  ${colors.gray}${r.expected}${colors.reset}`);
  }

  console.log(`${colors.gray}----------------------------------------------------------------------------------------${colors.reset}`);
  console.log(`\n${colors.bold}📊 TỔNG KẾT TOÀN DIỆN:${colors.reset}`);
  console.log(`   - Tổng số hạng mục kiểm thử: ${results.length} bài test chủ lực (Bao gồm >250 test cases con)`);
  console.log(`   - Số bài đạt chuẩn (PASS)   : ${colors.green}${passedCount} / ${results.length}${colors.reset}`);
  if (failedCount > 0) {
    console.log(`   - Số bài không đạt (FAIL)   : ${colors.red}${failedCount}${colors.reset}`);
  } else {
    console.log(`   - Đánh giá chất lượng       : ${colors.bold}${colors.green}XUẤT SẮC - 100% CÁC TẦNG ĐẠT CHUẨN KIỂM ĐỊNH HỘI ĐỒNG!${colors.reset}`);
  }
  console.log(`   - Tổng thời gian hoàn tất   : ${totalTimeSec} giây`);
  console.log(`\n${colors.bold}${colors.cyan}========================================================================================${colors.reset}\n`);
}

main().catch((err) => {
  console.error('Lỗi thực thi Master Test Runner:', err);
  process.exit(1);
});

