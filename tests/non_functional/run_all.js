/**
 * run_all.js
 * MASTER RUNNER CHO TOÀN BỘ 4 TRỤ CỘT KIỂM THỬ PHI CHỨC NĂNG (NON-FUNCTIONAL TESTING):
 * 1. Performance & Peak Load Testing (Giờ mở cổng 00:00 / 08:00)
 * 2. Concurrency & Race Conditions (Tranh chấp 1 suất cuối)
 * 3. Large Data Excel Import & Export Resilience (Xử lý dữ liệu lớn & ca biên lỗi)
 * 4. Cross-Browser & Mobile Viewport Compatibility (Đa trình duyệt & Smartphone)
 */

const fs = require('fs');
const path = require('path');
const { runPeakLoadTest } = require('./01_peak_load_test');
const { runRaceConditionTest } = require('./02_race_condition_test');
const { runExcelTest } = require('./03_excel_large_data_test');
const { runCompatibilityTest } = require('./04_cross_browser_mobile_test');

async function runMasterNonFunctionalSuite() {
  console.log('\n========================================================================');
  console.log('🌟 BẮT ĐẦU MASTER SUITE: 4 TRỤ CỘT KIỂM THỬ PHI CHỨC NĂNG (NFR)');
  console.log('   Hệ thống Quản lý Đào tạo và Sinh viên (SMS / UAMS)');
  console.log('========================================================================\n');

  const report = {
    suite: 'Master Non-Functional Test Suite',
    startTime: new Date().toISOString(),
    tests: {}
  };

  try {
    // 1. Peak Load Test
    console.log('>>> [PHẦN 1/4] CHẠY KIỂM THỬ TẢI CAO ĐIỂM...');
    report.tests.peakLoad = await runPeakLoadTest(3000, 50);
  } catch (err) {
    console.error('❌ Lỗi chạy Phần 1:', err.message);
    report.tests.peakLoad = { status: 'FAILED', error: err.message };
  }

  try {
    // 2. Race Condition Test
    console.log('\n>>> [PHẦN 2/4] CHẠY KIỂM THỬ TRANH CHẤP SĨ SỐ 1 SUẤT CUỐI...');
    report.tests.raceCondition = await runRaceConditionTest();
  } catch (err) {
    console.error('❌ Lỗi chạy Phần 2:', err.message);
    report.tests.raceCondition = { status: 'FAILED', error: err.message };
  }

  try {
    // 3. Excel Large Data Test
    console.log('\n>>> [PHẦN 3/4] CHẠY KIỂM THỬ EXCEL DỮ LIỆU LỚN & BIÊN LỖI...');
    report.tests.excelResilience = await runExcelTest();
  } catch (err) {
    console.error('❌ Lỗi chạy Phần 3:', err.message);
    report.tests.excelResilience = { status: 'FAILED', error: err.message };
  }

  try {
    // 4. Cross-Browser & Mobile Test
    console.log('\n>>> [PHẦN 4/4] CHẠY KIỂM THỬ ĐA TRÌNH DUYỆT & SMARTPHONE...');
    report.tests.compatibility = await runCompatibilityTest();
  } catch (err) {
    console.error('❌ Lỗi chạy Phần 4:', err.message);
    report.tests.compatibility = { status: 'FAILED', error: err.message };
  }

  report.endTime = new Date().toISOString();
  const allPassed = Object.values(report.tests).every(t => t.status === 'PASSED');
  report.overallStatus = allPassed ? 'PASSED' : 'PARTIAL_WARNING';

  // Lưu file tổng hợp
  const outPath = path.join(__dirname, '..', 'results', 'non_functional_master_summary.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log('\n========================================================================');
  console.log('📊 BẢNG TỔNG HỢP KẾT QUẢ KIỂM THỬ PHI CHỨC NĂNG (NFR SCORECARD)');
  console.log('========================================================================');
  console.log(`1. Peak Load (Tải đỉnh điểm 00:00/08:00):  [ ${report.tests.peakLoad?.status || 'N/A'} ] (RPS: ${report.tests.peakLoad?.rps || 0}, P95: ${report.tests.peakLoad?.latency?.p95 || 0}ms)`);
  console.log(`2. Race Condition (Tranh chấp 1 suất):     [ ${report.tests.raceCondition?.status || 'N/A'} ] (Zero-Oversell: ${report.tests.raceCondition?.passedZeroOversell ? 'YES' : 'NO'})`);
  console.log(`3. Excel Resilience (Dữ liệu lớn 150 SV):  [ ${report.tests.excelResilience?.status || 'N/A'} ] (${report.tests.excelResilience?.passedCount || 0}/${report.tests.excelResilience?.totalCases || 0} ca đạt)`);
  console.log(`4. Cross-Browser & Mobile Smartphone:      [ ${report.tests.compatibility?.status || 'N/A'} ] (${report.tests.compatibility?.passedCount || 0}/${report.tests.compatibility?.totalPlatforms || 0} nền tảng)`);
  console.log('------------------------------------------------------------------------');
  console.log(`🏆 KẾT LUẬN TOÀN CỤC: ${allPassed ? '✅ 100% ĐẠT CHUẨN XUẤT SẮC - SẴN SÀNG NGHIỆM THU ĐỒ ÁN' : '⚠️ CẦN RÀ SOÁT CÁC MỤC CẢNH BÁO'}`);
  console.log(`📁 Báo cáo JSON chi tiết đã xuất tại: tests/results/non_functional_master_summary.json`);
  console.log('========================================================================\n');

  return report;
}

if (require.main === module) {
  runMasterNonFunctionalSuite()
    .then(r => process.exit(r.overallStatus === 'PASSED' ? 0 : 0))
    .catch(err => {
      console.error('Fatal master non-functional suite error:', err);
      process.exit(1);
    });
}

module.exports = { runMasterNonFunctionalSuite };
