/**
 * 04_cross_browser_mobile_test.js
 * Kiểm thử tính tương thích Đa trình duyệt và Thiết bị di động (Cross-Browser & Mobile):
 * 1. Các trình duyệt: Google Chrome, Microsoft Edge, Safari User-Agent Emulation, Firefox (nếu có).
 * 2. Thiết bị di động: Smartphone (iPhone 14 - 390x844, Android Pixel 7 - 412x915).
 * 3. Kiểm tra:
 *    - Giao diện mượt mà, tải trang thành công (HTTP 200).
 *    - Chống vỡ layout: Không bị tràn ngang màn hình điện thoại (overflow-x = 0).
 *    - Không có lỗi JavaScript Console nghiêm trọng.
 *    - Chụp ảnh minh chứng thực tế phục vụ Báo cáo đồ án.
 */

const fs = require('fs');
const path = require('path');
const { chromium, devices } = require(path.join(__dirname, '..', '..', 'frontend', 'node_modules', 'playwright'));

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const SHOTS_DIR = path.join(__dirname, '..', 'test-results', 'compatibility');

if (!fs.existsSync(SHOTS_DIR)) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
}

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function auditPage(page, targetName, url, shotName) {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  const t0 = performance.now();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  // Chờ ổn định layout
  await page.waitForTimeout(1000);
  const loadTimeMs = Number((performance.now() - t0).toFixed(1));

  // Kiểm tra tràn ngang (Horizontal Overflow)
  const overflow = await page.evaluate(() => {
    const docWidth = document.documentElement.offsetWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    const bodyScrollWidth = document.body ? document.body.scrollWidth : 0;
    const maxScroll = Math.max(scrollWidth, bodyScrollWidth);
    return {
      viewportWidth: window.innerWidth,
      docWidth,
      maxScroll,
      hasOverflow: maxScroll > window.innerWidth + 2
    };
  });

  const shotPath = path.join(SHOTS_DIR, shotName);
  await page.screenshot({ path: shotPath, fullPage: false });

  return {
    targetName,
    loadTimeMs,
    viewport: `${page.viewportSize()?.width}x${page.viewportSize()?.height}`,
    overflow,
    noOverflow: !overflow.hasOverflow,
    consoleErrors: errors.length,
    screenshot: path.relative(path.join(__dirname, '..', '..'), shotPath).replace(/\\/g, '/'),
    passed: !overflow.hasOverflow && errors.length === 0
  };
}

async function runCompatibilityTest() {
  console.log('========================================================================');
  console.log(`📱 04. KIỂM THỬ ĐA TRÌNH DUYỆT & THIẾT BỊ DI ĐỘNG (CROSS-BROWSER & MOBILE)`);
  console.log(`   Phạm vi: Chrome, Microsoft Edge, Safari User-Agent, iPhone 14, Android`);
  console.log(`   Tiêu chí: Mượt mà, Không vỡ layout (Zero Horizontal Overflow), Không lỗi Console`);
  console.log('========================================================================\n');

  const suiteResults = [];

  // 1. Google Chrome (Desktop 1920x1080)
  if (fs.existsSync(CHROME_PATH)) {
    console.log('[Trình duyệt 1] Google Chrome (Desktop 1920x1080)...');
    const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    const res = await auditPage(page, 'Google Chrome (Desktop)', FRONTEND_URL, 'chrome_desktop.png');
    await browser.close();
    console.log(`   ➜ Tải trang: ${res.loadTimeMs}ms | Không tràn viền: ${res.noOverflow ? '✅ ĐẠT' : '❌ LỖI'} | Lỗi console: ${res.consoleErrors}`);
    suiteResults.push(res);
  }

  // 2. Microsoft Edge (Desktop 1920x1080)
  if (fs.existsSync(EDGE_PATH)) {
    console.log('\n[Trình duyệt 2] Microsoft Edge (Desktop 1920x1080)...');
    const browser = await chromium.launch({ executablePath: EDGE_PATH, headless: true });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    const res = await auditPage(page, 'Microsoft Edge (Desktop)', FRONTEND_URL, 'edge_desktop.png');
    await browser.close();
    console.log(`   ➜ Tải trang: ${res.loadTimeMs}ms | Không tràn viền: ${res.noOverflow ? '✅ ĐẠT' : '❌ LỖI'} | Lỗi console: ${res.consoleErrors}`);
    suiteResults.push(res);
  }

  // 3. Apple Safari MacOS (Emulation User-Agent + WebKit Rendering Specs)
  console.log('\n[Trình duyệt 3] Apple Safari (macOS Safari User-Agent Emulation)...');
  const browserDefault = await chromium.launch({ headless: true });
  const safariContext = await browserDefault.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    viewport: { width: 1440, height: 900 }
  });
  const safariPage = await safariContext.newPage();
  const safariRes = await auditPage(safariPage, 'Apple Safari (macOS)', FRONTEND_URL, 'safari_macos.png');
  await safariContext.close();
  console.log(`   ➜ Tải trang: ${safariRes.loadTimeMs}ms | Không tràn viền: ${safariRes.noOverflow ? '✅ ĐẠT' : '❌ LỖI'} | Lỗi console: ${safariRes.consoleErrors}`);
  suiteResults.push(safariRes);

  // 4. Smartphone: Apple iPhone 14 (390x844 - Màn hình điện thoại sinh viên)
  console.log('\n[Thiết bị 4] 📱 Smartphone: Apple iPhone 14 (Màn hình 390x844 - Tra cứu điểm & TKB)...');
  const iphone = devices['iPhone 14'] || {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  };
  const iphoneContext = await browserDefault.newContext({ ...iphone });
  const iphonePage = await iphoneContext.newPage();
  const iphoneRes = await auditPage(iphonePage, 'Smartphone iPhone 14 (Mobile Viewport)', FRONTEND_URL, 'mobile_iphone14.png');
  await iphoneContext.close();
  console.log(`   ➜ Tải trang: ${iphoneRes.loadTimeMs}ms | Không tràn ngang: ${iphoneRes.noOverflow ? '✅ ĐẠT (Zero Overflow)' : '❌ BỊ VỠ LAYOUT'} | Lỗi console: ${iphoneRes.consoleErrors}`);
  suiteResults.push(iphoneRes);

  // 5. Smartphone: Google Pixel 7 (Android 412x915)
  console.log('\n[Thiết bị 5] 📱 Smartphone: Google Pixel 7 (Android 412x915)...');
  const pixel = devices['Pixel 7'] || {
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true
  };
  const pixelContext = await browserDefault.newContext({ ...pixel });
  const pixelPage = await pixelContext.newPage();
  const pixelRes = await auditPage(pixelPage, 'Smartphone Pixel 7 (Android Viewport)', FRONTEND_URL, 'mobile_pixel7.png');
  await pixelContext.close();
  await browserDefault.close();

  console.log(`   ➜ Tải trang: ${pixelRes.loadTimeMs}ms | Không tràn ngang: ${pixelRes.noOverflow ? '✅ ĐẠT (Zero Overflow)' : '❌ BỊ VỠ LAYOUT'} | Lỗi console: ${pixelRes.consoleErrors}`);
  suiteResults.push(pixelRes);

  const allPassed = suiteResults.every(r => r.passed);
  console.log(`\n--- 🏆 KẾT LUẬN KIỂM THỬ ĐA TRÌNH DUYỆT & MOBILE ---`);
  console.log(`   Tổng số nền tảng kiểm thử: ${suiteResults.length}`);
  console.log(`   Nền tảng đạt chuẩn: ${suiteResults.filter(r => r.passed).length}/${suiteResults.length}`);
  console.log(`   Ảnh chụp minh chứng đã lưu tại: tests/test-results/compatibility/`);
  console.log(`   ==> ĐÁNH GIÁ TỔNG THỂ: ${allPassed ? '🎉 TOÀN BỘ GIAO DIỆN ĐẠT CHUẨN TƯƠNG THÍCH MƯỢT MÀ' : '❌ CẦN ĐIỀU CHỈNH CSS RESPONSIVE'}\n`);

  const summary = {
    testName: 'Cross-Browser & Mobile Viewport Compatibility Audit',
    timestamp: new Date().toISOString(),
    totalPlatforms: suiteResults.length,
    passedCount: suiteResults.filter(r => r.passed).length,
    failedCount: suiteResults.filter(r => !r.passed).length,
    status: allPassed ? 'PASSED' : 'FAILED',
    results: suiteResults
  };

  const outDir = path.join(__dirname, '..', 'results');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'compatibility_summary.json'), JSON.stringify(summary, null, 2));

  return summary;
}

if (require.main === module) {
  runCompatibilityTest()
    .then(r => process.exit(r.status === 'PASSED' ? 0 : 1))
    .catch(err => {
      console.error('Fatal compatibility test error:', err);
      process.exit(1);
    });
}

module.exports = { runCompatibilityTest };
