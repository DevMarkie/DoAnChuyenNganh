import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\minhn\\.gemini\\antigravity-ide\\brain\\927b781f-a466-4d13-8996-48b8b16cc59e';

async function testNav() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/#/admin/login', { waitUntil: 'networkidle2' });
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  // Navigate using window.location.hash
  console.log('Navigating to #/admin/students...');
  await page.evaluate(() => { window.location.hash = '#/admin/students'; });
  await new Promise(r => setTimeout(r, 2500));
  console.log('URL after nav:', page.url());
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_admin_students.png') });

  console.log('Navigating to #/admin/lecturers...');
  await page.evaluate(() => { window.location.hash = '#/admin/lecturers'; });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_admin_lecturers.png') });

  console.log('Navigating to #/admin/course-sections...');
  await page.evaluate(() => { window.location.hash = '#/admin/course-sections'; });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_admin_sections.png') });

  console.log('Logging out and entering Student portal...');
  await page.evaluate(() => {
    localStorage.clear();
    window.location.hash = '#/student/login';
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_student_dashboard.png') });

  console.log('Navigating to #/student/schedule...');
  await page.evaluate(() => { window.location.hash = '#/student/schedule'; });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '09_student_schedule.png') });

  console.log('Navigating to #/student/enroll...');
  await page.evaluate(() => { window.location.hash = '#/student/enroll'; });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '10_student_enroll.png') });

  console.log('Navigating to #/student/enrollments...');
  await page.evaluate(() => { window.location.hash = '#/student/enrollments'; });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '11_student_enrollments.png') });

  console.log('Navigating to #/student/transcript...');
  await page.evaluate(() => { window.location.hash = '#/student/transcript'; });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '12_student_transcript.png') });

  console.log('Navigating to Lecturer portal...');
  await page.evaluate(() => {
    localStorage.clear();
    window.location.hash = '#/lecturer/login';
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '13_lecturer_dashboard.png') });

  console.log('Navigating to #/lecturer/my-sections...');
  await page.evaluate(() => { window.location.hash = '#/lecturer/my-sections'; });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '14_lecturer_sections.png') });

  console.log('Navigating to #/lecturer/grades...');
  await page.evaluate(() => { window.location.hash = '#/lecturer/grades'; });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '15_lecturer_grades.png') });

  console.log('All screenshots completed successfully!');
  await browser.close();
}

testNav();
