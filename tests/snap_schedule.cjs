const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function test() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1600,1000']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  await page.goto('http://localhost:5173/#/student/login', { waitUntil: 'networkidle2' });
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  await page.goto('http://localhost:5173/#/student/schedule', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // Select semester 3 (HK1-2025)
  await page.select('select', '3');
  await new Promise(r => setTimeout(r, 1500));

  const count = await page.evaluate(() => document.querySelectorAll('.stat-value')[0]?.textContent);
  console.log('HK1-2025 schedule count:', count);

  const outPath = path.join(__dirname, '..', 'test-results', 'hk1_2025_student_schedule.png');
  await page.screenshot({ path: outPath });
  console.log('Saved HK1-2025 screenshot to:', outPath);

  await browser.close();
}

test().catch(console.error);
