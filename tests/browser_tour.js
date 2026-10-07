import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\minhn\\.gemini\\antigravity-ide\\brain\\927b781f-a466-4d13-8996-48b8b16cc59e';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runRealUiTour() {
  console.log('🚀 Khởi chạy Chrome để tương tác 100% bằng UI...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. Vào trang đăng nhập Admin
    console.log('📌 1. Mở Cổng Admin...');
    await page.goto('http://localhost:5173/#/admin/login', { waitUntil: 'networkidle2' });
    await sleep(1500);

    // Click nút Đăng nhập
    console.log('👉 Click Đăng nhập Quản trị viên...');
    await page.click('button[type="submit"]');
    await sleep(2500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_admin_dashboard.png') });
    console.log('✅ Chụp 03_admin_dashboard.png');

    // 2. Click vào menu 'Sinh viên'
    console.log('👉 Click chuyển sang Sinh viên...');
    await page.waitForSelector('a[href="#/admin/students"]', { timeout: 5000 });
    await page.click('a[href="#/admin/students"]');
    await sleep(2500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_admin_students.png') });
    console.log('✅ Chụp 04_admin_students.png');

    // 3. Click vào menu 'Giảng viên'
    console.log('👉 Click chuyển sang Giảng viên...');
    await page.waitForSelector('a[href="#/admin/lecturers"]', { timeout: 5000 });
    await page.click('a[href="#/admin/lecturers"]');
    await sleep(2500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_admin_lecturers.png') });
    console.log('✅ Chụp 05_admin_lecturers.png');

    // 4. Click vào menu 'Lớp học phần'
    console.log('👉 Click chuyển sang Lớp học phần...');
    await page.waitForSelector('a[href="#/admin/course-sections"]', { timeout: 5000 });
    await page.click('a[href="#/admin/course-sections"]');
    await sleep(2500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_admin_sections.png') });
    console.log('✅ Chụp 06_admin_sections.png');

    // 5. Đăng xuất
    console.log('👉 Đăng xuất Admin...');
    await page.click('button.btn-logout');
    await sleep(1500);

    // 6. Đăng nhập Cổng Sinh viên
    console.log('📌 6. Mở Cổng Sinh viên...');
    await page.goto('http://localhost:5173/#/student/login', { waitUntil: 'networkidle2' });
    await sleep(1500);
    console.log('👉 Click Đăng nhập Sinh viên...');
    await page.click('button[type="submit"]');
    await sleep(2500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_student_dashboard.png') });
    console.log('✅ Chụp 08_student_dashboard.png');

    // 7. Click 'Thời khóa biểu'
    console.log('👉 Click Thời khóa biểu...');
    await page.waitForSelector('a[href="#/student/schedule"]', { timeout: 5000 });
    await page.click('a[href="#/student/schedule"]');
    await sleep(2500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '09_student_schedule.png') });
    console.log('✅ Chụp 09_student_schedule.png');

    // 8. Click 'Đăng ký học phần'
    console.log('👉 Click Đăng ký học phần...');
    await page.waitForSelector('a[href="#/student/enroll"]', { timeout: 5000 });
    await page.click('a[href="#/student/enroll"]');
    await sleep(2500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '10_student_enroll.png') });
    console.log('✅ Chụp 10_student_enroll.png');

    // 9. Click 'HP đã đăng ký'
    console.log('👉 Click HP đã đăng ký...');
    await page.waitForSelector('a[href="#/student/enrollments"]', { timeout: 5000 });
    await page.click('a[href="#/student/enrollments"]');
    await sleep(2500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '11_student_enrollments.png') });
    console.log('✅ Chụp 11_student_enrollments.png');

    // 10. Click 'Kết quả học tập (CPA)'
    console.log('👉 Click Bảng điểm CPA...');
    await page.waitForSelector('a[href="#/student/transcript"]', { timeout: 5000 });
    await page.click('a[href="#/student/transcript"]');
    await sleep(2500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '12_student_transcript.png') });
    console.log('✅ Chụp 12_student_transcript.png');

    // 11. Đăng xuất Sinh viên và đăng nhập Giảng viên
    console.log('👉 Đăng xuất Sinh viên...');
    await page.click('button.btn-logout');
    await sleep(1500);

    console.log('📌 11. Mở Cổng Giảng viên...');
    await page.goto('http://localhost:5173/#/lecturer/login', { waitUntil: 'networkidle2' });
    await sleep(1500);
    await page.click('button[type="submit"]');
    await sleep(2500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '13_lecturer_dashboard.png') });
    console.log('✅ Chụp 13_lecturer_dashboard.png');

    // Giảng viên - Học phần phụ trách
    console.log('👉 Click Học phần phụ trách...');
    await page.waitForSelector('a[href="#/lecturer/my-sections"]', { timeout: 5000 });
    await page.click('a[href="#/lecturer/my-sections"]');
    await sleep(2500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '14_lecturer_sections.png') });
    console.log('✅ Chụp 14_lecturer_sections.png');

    console.log('\n🎉 Hoàn thành chuyến trải nghiệm 100% bằng UI thực!');
  } catch (err) {
    console.error('Lỗi khi trải nghiệm:', err);
  } finally {
    await browser.close();
  }
}

runRealUiTour();
