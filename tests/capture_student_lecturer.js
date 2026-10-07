import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\minhn\\.gemini\\antigravity-ide\\brain\\927b781f-a466-4d13-8996-48b8b16cc59e';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. Student Portal
    console.log('📌 Mở Cổng Sinh viên...');
    await page.goto('http://localhost:5173/#/student/login', { waitUntil: 'networkidle2' });
    await sleep(1500);
    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');
    await sleep(2500);

    console.log('📌 Chụp Student Schedule...');
    await page.evaluate(() => { window.location.hash = '#/student/schedule'; });
    await sleep(2500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '09_student_schedule.png') });

    console.log('📌 Chụp Student Enroll...');
    await page.evaluate(() => { window.location.hash = '#/student/enroll'; });
    await sleep(2500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '10_student_enroll.png') });

    console.log('📌 Chụp Student Enrollments...');
    await page.evaluate(() => { window.location.hash = '#/student/enrollments'; });
    await sleep(2500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '11_student_enrollments.png') });

    console.log('📌 Chụp Student Transcript...');
    await page.evaluate(() => { window.location.hash = '#/student/transcript'; });
    await sleep(2500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '12_student_transcript.png') });

    // 2. Lecturer Portal
    console.log('📌 Đăng xuất & Mở Cổng Giảng viên...');
    await page.goto('http://localhost:5173/#/lecturer/login', { waitUntil: 'networkidle2' });
    await sleep(1500);
    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');
    await sleep(2500);

    console.log('📌 Chụp Lecturer Dashboard...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '13_lecturer_dashboard.png') });

    console.log('📌 Chụp Lecturer Sections...');
    await page.evaluate(() => { window.location.hash = '#/lecturer/my-sections'; });
    await sleep(2500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '14_lecturer_sections.png') });

    console.log('📌 Chụp Lecturer Grades...');
    await page.evaluate(() => { window.location.hash = '#/lecturer/grades'; });
    await sleep(2500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '15_lecturer_grades.png') });

    console.log('✅ Hoàn thành chụp tất cả màn hình còn lại!');
  } catch (err) {
    console.error('Lỗi khi chụp:', err);
  } finally {
    await browser.close();
  }
}

capture();
