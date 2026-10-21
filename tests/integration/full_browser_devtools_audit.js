const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'test-results', 'devtools_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runDevtoolsAudit() {
  console.log('======================================================================');
  console.log('🌐 BẮT ĐẦU KIỂM THỬ TRÌNH DUYỆT TOÀN DIỆN VỚI CHROME DEVTOOLS (REAL E2E)');
  console.log('======================================================================\n');

  const consoleErrors = [];
  const consoleWarnings = [];
  const networkFailures = [];
  const auditedPages = [];

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  // DevTools event listeners
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error') {
      console.error(`🔴 [Browser Console Error]: ${text}`);
      consoleErrors.push({ url: page.url(), text });
    } else if (type === 'warning') {
      consoleWarnings.push({ url: page.url(), text });
    }
  });

  page.on('pageerror', err => {
    console.error(`💥 [Browser Page Error]: ${err.message}`);
    consoleErrors.push({ url: page.url(), text: err.message });
  });

  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    if (status >= 500) {
      console.error(`❌ [Network 5xx]: ${status} ${url}`);
      networkFailures.push({ url, status });
    }
  });

  async function clickByText(selector, textSnippet) {
    return await page.evaluate((sel, txt) => {
      const elements = Array.from(document.querySelectorAll(sel));
      const target = elements.find(el => el.textContent && el.textContent.includes(txt));
      if (target) {
        target.click();
        return true;
      }
      return false;
    }, selector, textSnippet);
  }

  async function auditPage(name, expectedSelector = null) {
    await sleep(1500);
    const currentUrl = page.url();
    let hasContent = false;
    if (expectedSelector) {
      try {
        await page.waitForSelector(expectedSelector, { timeout: 4000 });
        hasContent = true;
      } catch (e) {
        hasContent = false;
      }
    } else {
      hasContent = true;
    }

    const snapPath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: snapPath, fullPage: false });
    auditedPages.push({ name, url: currentUrl, hasContent, snapPath });
    console.log(`  ✓ Đã kiểm thử & chụp màn hình: [${name}] (URL: ${currentUrl})`);
  }

  try {
    // -------------------------------------------------------------
    // 1. SINH VIÊN (STUDENT PORTAL)
    // -------------------------------------------------------------
    console.log('\n--- 🎓 1. KIỂM THỬ CỔNG SINH VIÊN (STUDENT PORTAL) ---');
    await page.goto('http://localhost:5173/#/student/login', { waitUntil: 'networkidle2' });
    await auditPage('01_student_login', 'button[type="submit"]');

    // Đăng nhập sinh viên
    await page.click('button[type="submit"]');
    await sleep(2500);
    await auditPage('02_student_dashboard');

    // Thời khóa biểu
    await page.goto('http://localhost:5173/#/student/schedule', { waitUntil: 'networkidle2' });
    await auditPage('03_student_schedule');

    // Thử click vào một thẻ môn học trên lịch để mở Modal danh sách lớp
    const clickedScheduleCard = await page.evaluate(() => {
      const cards = document.querySelectorAll('[title*="danh sách lớp"]');
      if (cards.length > 0) {
        cards[0].click();
        return true;
      }
      return false;
    });
    if (clickedScheduleCard) {
      console.log('   👉 Mở Modal Danh Sách Sinh Viên Lớp Học Phần...');
      await sleep(1500);
      await auditPage('04_student_class_list_modal', '.modal-backdrop');
      await clickByText('button', 'Đóng');
      await sleep(500);
    }

    // Đăng ký học phần
    await page.goto('http://localhost:5173/#/student/enroll', { waitUntil: 'networkidle2' });
    await auditPage('05_student_enroll');

    // Học phần đã đăng ký
    await page.goto('http://localhost:5173/#/student/enrollments', { waitUntil: 'networkidle2' });
    await auditPage('06_student_my_enrollments');

    // Bảng điểm CPA
    await page.goto('http://localhost:5173/#/student/transcript', { waitUntil: 'networkidle2' });
    await auditPage('07_student_transcript');

    // Lộ trình đào tạo
    await page.goto('http://localhost:5173/#/student/curriculum', { waitUntil: 'networkidle2' });
    await auditPage('08_student_curriculum');

    // Hồ sơ sinh viên
    await page.goto('http://localhost:5173/#/student/profile', { waitUntil: 'networkidle2' });
    await auditPage('09_student_profile');

    // Đăng xuất sạch sẽ phiên sinh viên
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('about:blank');
    await sleep(500);

    // -------------------------------------------------------------
    // 2. GIẢNG VIÊN (LECTURER PORTAL)
    // -------------------------------------------------------------
    console.log('\n--- 👨‍🏫 2. KIỂM THỬ CỔNG GIẢNG VIÊN (LECTURER PORTAL) ---');
    await page.goto('http://localhost:5173/#/lecturer/login', { waitUntil: 'networkidle2' });
    await auditPage('10_lecturer_login', 'button[type="submit"]');

    await page.click('button[type="submit"]');
    await sleep(2500);
    await auditPage('11_lecturer_dashboard');

    // Học phần phụ trách
    await page.goto('http://localhost:5173/#/lecturer/my-sections', { waitUntil: 'networkidle2' });
    await auditPage('12_lecturer_sections');

    // Lịch giảng dạy & Điểm danh
    await page.goto('http://localhost:5173/#/lecturer/schedule', { waitUntil: 'networkidle2' });
    await auditPage('13_lecturer_schedule');

    // Thử click nút Điểm danh nếu có
    const clickedAttendance = await clickByText('button', 'Điểm danh');
    if (clickedAttendance) {
      console.log('   👉 Đã mở Modal Điểm danh...');
      await sleep(1500);
      await auditPage('14_lecturer_attendance_modal', '.modal-backdrop');
      await clickByText('button', 'Đóng');
      await sleep(500);
    }

    // Vào điểm
    await page.goto('http://localhost:5173/#/lecturer/grades', { waitUntil: 'networkidle2' });
    await auditPage('15_lecturer_grades');

    // Phúc khảo điểm
    await page.goto('http://localhost:5173/#/lecturer/grade-appeals', { waitUntil: 'networkidle2' });
    await auditPage('16_lecturer_grade_appeals');

    // Hồ sơ giảng viên
    await page.goto('http://localhost:5173/#/lecturer/profile', { waitUntil: 'networkidle2' });
    await auditPage('17_lecturer_profile');

    // Đăng xuất sạch sẽ phiên giảng viên
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('about:blank');
    await sleep(500);

    // -------------------------------------------------------------
    // 3. QUẢN TRỊ VIÊN (ADMIN PORTAL)
    // -------------------------------------------------------------
    console.log('\n--- 🏛️ 3. KIỂM THỬ CỔNG QUẢN TRỊ VIÊN (ADMIN PORTAL) ---');
    await page.goto('http://localhost:5173/#/admin/login', { waitUntil: 'networkidle2' });
    await auditPage('18_admin_login', 'button[type="submit"]');

    await page.click('button[type="submit"]');
    await sleep(2500);
    await auditPage('19_admin_dashboard');

    // Quản lý Sinh viên
    await page.goto('http://localhost:5173/#/admin/students', { waitUntil: 'networkidle2' });
    await auditPage('20_admin_students');

    // Quản lý Khoa / Viện
    await page.goto('http://localhost:5173/#/admin/departments', { waitUntil: 'networkidle2' });
    await auditPage('21_admin_departments');

    // Quản lý Lớp sinh hoạt
    await page.goto('http://localhost:5173/#/admin/classes', { waitUntil: 'networkidle2' });
    await auditPage('22_admin_classes');

    // Quản lý Môn học
    await page.goto('http://localhost:5173/#/admin/subjects', { waitUntil: 'networkidle2' });
    await auditPage('23_admin_subjects');

    // Quản lý Giảng viên
    await page.goto('http://localhost:5173/#/admin/lecturers', { waitUntil: 'networkidle2' });
    await auditPage('24_admin_lecturers');

    // Quản lý Học kỳ & Cổng ĐKHP
    await page.goto('http://localhost:5173/#/admin/semesters', { waitUntil: 'networkidle2' });
    await auditPage('25_admin_semesters');

    // Quản lý Lớp học phần
    await page.goto('http://localhost:5173/#/admin/course-sections', { waitUntil: 'networkidle2' });
    await auditPage('26_admin_course_sections');

    // Phân lớp học phần hàng loạt (Assign Enrollments)
    await page.goto('http://localhost:5173/#/admin/assign-enrollments', { waitUntil: 'networkidle2' });
    await auditPage('27_admin_assign_enrollments');

    // Quản lý Lịch học & Phòng học
    await page.goto('http://localhost:5173/#/admin/schedules', { waitUntil: 'networkidle2' });
    await auditPage('28_admin_schedules');

    // Tra cứu sổ điểm toàn trường
    await page.goto('http://localhost:5173/#/admin/grades', { waitUntil: 'networkidle2' });
    await auditPage('29_admin_grades');

    // Xử lý Quên / Cấp lại mật khẩu
    await page.goto('http://localhost:5173/#/admin/password-resets', { waitUntil: 'networkidle2' });
    await auditPage('30_admin_password_resets');

    // Cảnh báo học vụ
    await page.goto('http://localhost:5173/#/admin/academic-warnings', { waitUntil: 'networkidle2' });
    await auditPage('31_admin_academic_warnings');

    // Phúc khảo điểm
    await page.goto('http://localhost:5173/#/admin/grade-appeals', { waitUntil: 'networkidle2' });
    await auditPage('32_admin_grade_appeals');

    console.log('\n======================================================================');
    console.log('📊 KẾT QUẢ KIỂM THỬ TRÌNH DUYỆT BẰNG DEVTOOLS:');
    console.log(`  ● Tổng số trang đã kiểm thử thực tế: ${auditedPages.length} trang`);
    console.log(`  ● Lỗi Console (Error): ${consoleErrors.length}`);
    console.log(`  ● Cảnh báo Console (Warn): ${consoleWarnings.length}`);
    console.log(`  ● Lỗi mạng 5xx (Network Failures): ${networkFailures.length}`);
    console.log('======================================================================\n');

    if (consoleErrors.length > 0) {
      console.log('Chi tiết lỗi Console:');
      consoleErrors.forEach((e, idx) => console.log(`  ${idx + 1}. [${e.url}] ${e.text}`));
    }

    const reportPath = path.join(__dirname, '..', 'test-results', 'devtools_audit_summary.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      auditedPages,
      consoleErrors,
      consoleWarnings,
      networkFailures
    }, null, 2));

    console.log(`Báo cáo JSON đã lưu tại: ${reportPath}`);

  } catch (err) {
    console.error('❌ Lỗi ngoại lệ trong quá trình audit:', err);
  } finally {
    await browser.close();
  }
}

runDevtoolsAudit();
