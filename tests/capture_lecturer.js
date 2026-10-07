import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\minhn\\.gemini\\antigravity-ide\\brain\\927b781f-a466-4d13-8996-48b8b16cc59e';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureLecturer() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    console.log('📌 Mở Cổng Giảng viên...');
    await page.goto('http://localhost:5173/#/lecturer/login', { waitUntil: 'networkidle2' });
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:5173/#/lecturer/login', { waitUntil: 'networkidle2' });
    await sleep(1500);

    console.log('👉 Chụp ảnh form đăng nhập Giảng viên...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02b_lecturer_login.png') });

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

    console.log('✅ Hoàn thành chụp phân hệ Giảng viên!');
  } catch (err) {
    console.error('Lỗi khi chụp:', err);
  } finally {
    await browser.close();
  }
}

captureLecturer();
