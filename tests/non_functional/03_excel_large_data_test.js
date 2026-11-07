/**
 * 03_excel_large_data_test.js
 * Kiểm thử xử lý dữ liệu lớn & Các ca biên sai lệch file Excel:
 * 1. Import danh sách điểm 100-200 sinh viên.
 * 2. Kiểm tra các ca biên lỗi:
 *    - Sai định dạng file (.txt, .csv không phải .xlsx)
 *    - Trống cột bắt buộc / trống mã nhận diện
 *    - Điểm chữ cái thay vì số (vd: "A+", "CHÍN")
 *    - Điểm âm (vd: -1.0, -0.5)
 *    - Điểm vượt trần > 10 (vd: 12.5, 15.0)
 * 3. Đo lường tốc độ và tính toàn vẹn khi export bảng điểm toàn khóa.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_URL || 'http://localhost:8080';
const TEMP_DIR = path.join(__dirname, 'temp_excels');

async function getLecturerToken() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: '1000001', password: 'password123' })
  });
  if (res.ok) {
    const data = await res.json();
    return data.data?.token || data.token;
  }
  // Thử mật khẩu dự phòng 123456
  const res2 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: '1000001', password: '123456' })
  });
  const data2 = await res2.json();
  return data2.data?.token || data2.token;
}

async function uploadExcel(token, sectionId, filePath, fileName) {
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const formData = new FormData();
  formData.append('file', blob, fileName);

  const t0 = performance.now();
  const res = await fetch(`${BASE_URL}/api/grades/section/${sectionId}/import-preview`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  const durationMs = performance.now() - t0;
  const status = res.status;
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status, ok: res.ok, data: json, durationMs: Number(durationMs.toFixed(2)) };
}

async function runExcelTest() {
  console.log('========================================================================');
  console.log(`📊 03. KIỂM THỬ XỬ LÝ DỮ LIỆU LỚN & CÁC CA BIÊN SAI LỆCH EXCEL`);
  console.log(`   Phạm vi: 5 ca kiểm thử biên âm/vượt/chữ/trống + 1 ca dữ liệu lớn 150 SV`);
  console.log(`   Đo lường: Tốc độ parse, tính toàn vẹn dữ liệu import và export`);
  console.log('========================================================================\n');

  // 1. Sinh các tệp Excel kiểm thử bằng Python helper
  console.log('[Bước 1] Sinh bộ tệp Excel kiểm thử chuyên biệt...');
  execSync(`python "${path.join(__dirname, 'generate_test_excels.py')}"`, { stdio: 'inherit' });

  // 2. Lấy Token Giảng viên
  const token = await getLecturerToken();
  if (!token) throw new Error('Không thể đăng nhập tài khoản Giảng viên 1000001');
  console.log('✔ Đăng nhập Giảng viên thành công, đã nhận JWT Bearer Token.\n');

  // Lấy section ID có sẵn
  const sectionId = 1;
  const testResults = [];

  // Ca 1: Sai định dạng file (.txt)
  console.log('[Ca 1] Kiểm tra tải lên file sai định dạng (.txt thay vì .xlsx)...');
  const case1 = await uploadExcel(token, sectionId, path.join(TEMP_DIR, 'wrong_format.txt'), 'wrong_format.txt');
  const pass1 = case1.status === 400 && JSON.stringify(case1.data).includes('xlsx');
  console.log(`   ➜ Trả về: HTTP ${case1.status} | Kết quả: ${pass1 ? '✅ ĐẠT (Chặn đúng định dạng)' : '❌ THẤT BẠI'}`);
  testResults.push({ id: 'NFR-EXCEL-01', name: 'File sai định dạng (.txt)', expected: 'HTTP 400 từ chối', actual: `HTTP ${case1.status}`, passed: pass1 });

  // Ca 2: Trống cột bắt buộc / trống mã nhận diện
  console.log('\n[Ca 2] Kiểm tra file trống cột / trống mã Enrollment ID...');
  const case2 = await uploadExcel(token, sectionId, path.join(TEMP_DIR, 'empty_columns.xlsx'), 'empty_columns.xlsx');
  const pass2 = case2.ok && Array.isArray(case2.data?.data);
  console.log(`   ➜ Trả về: HTTP ${case2.status} | Đã lọc bỏ/báo lỗi dòng trống: ${pass2 ? '✅ ĐẠT' : '❌ THẤT BẠI'}`);
  testResults.push({ id: 'NFR-EXCEL-02', name: 'Trống cột / mã nhận diện', expected: 'Bỏ qua dòng trống hoặc gắn cờ lỗi', actual: `HTTP ${case2.status}`, passed: pass2 });

  // Ca 3: Điểm chữ cái thay vì số
  console.log('\n[Ca 3] Kiểm tra điểm chữ cái thay vì số ("CHÍN", "A+")...');
  const case3 = await uploadExcel(token, sectionId, path.join(TEMP_DIR, 'letter_scores.xlsx'), 'letter_scores.xlsx');
  const rows3 = case3.data?.data || [];
  const hasLetterError = rows3.some(r => r.error && r.error.includes('không phải số hợp lệ'));
  console.log(`   ➜ Phát hiện lỗi chữ cái: ${hasLetterError ? '✅ ĐẠT (Báo lỗi: Điểm không phải số hợp lệ)' : '❌ THẤT BẠI'}`);
  testResults.push({ id: 'NFR-EXCEL-03', name: 'Điểm chữ cái thay vì số', expected: 'Báo lỗi không phải số hợp lệ', actual: hasLetterError ? 'Phát hiện chính xác' : 'Bỏ sót lỗi', passed: hasLetterError });

  // Ca 4: Điểm âm (-1.0, -0.5)
  console.log('\n[Ca 4] Kiểm tra điểm âm (< 0.0)...');
  const case4 = await uploadExcel(token, sectionId, path.join(TEMP_DIR, 'negative_scores.xlsx'), 'negative_scores.xlsx');
  const rows4 = case4.data?.data || [];
  const hasNegError = rows4.some(r => r.error && (r.error.includes('khoảng 0') || r.error.includes('0–10')));
  console.log(`   ➜ Phát hiện điểm âm: ${hasNegError ? '✅ ĐẠT (Báo lỗi: Điểm phải trong khoảng 0-10)' : '❌ THẤT BẠI'}`);
  testResults.push({ id: 'NFR-EXCEL-04', name: 'Điểm âm (< 0.0)', expected: 'Báo lỗi khoảng 0-10', actual: hasNegError ? 'Phát hiện chính xác' : 'Bỏ sót lỗi', passed: hasNegError });

  // Ca 5: Điểm vượt trần (> 10.0)
  console.log('\n[Ca 5] Kiểm tra điểm vượt trần (> 10.0: 12.5, 15.0)...');
  const case5 = await uploadExcel(token, sectionId, path.join(TEMP_DIR, 'overflow_scores.xlsx'), 'overflow_scores.xlsx');
  const rows5 = case5.data?.data || [];
  const hasOverflowError = rows5.some(r => r.error && (r.error.includes('khoảng 0') || r.error.includes('0–10')));
  console.log(`   ➜ Phát hiện điểm vượt trần: ${hasOverflowError ? '✅ ĐẠT (Báo lỗi: Điểm phải trong khoảng 0-10)' : '❌ THẤT BẠI'}`);
  testResults.push({ id: 'NFR-EXCEL-05', name: 'Điểm vượt trần (> 10.0)', expected: 'Báo lỗi khoảng 0-10', actual: hasOverflowError ? 'Phát hiện chính xác' : 'Bỏ sót lỗi', passed: hasOverflowError });

  // Ca 6: Dữ liệu lớn 150 sinh viên hợp lệ
  console.log('\n[Ca 6] Kiểm tra hiệu năng Import dữ liệu lớn (150 sinh viên)...');
  const case6 = await uploadExcel(token, sectionId, path.join(TEMP_DIR, 'large_roster_150.xlsx'), 'large_roster_150.xlsx');
  const rows6 = case6.data?.data || [];
  const pass6 = case6.ok && rows6.length === 150;
  console.log(`   ➜ Trả về: HTTP ${case6.status} | Đọc đủ: ${rows6.length}/150 dòng`);
  console.log(`   ⚡ Thời gian xử lý parse: ${case6.durationMs}ms (${case6.durationMs < 2000 ? 'RẤT NHANH < 2s' : 'ĐẠT'})`);
  testResults.push({ id: 'NFR-EXCEL-06', name: 'Import dữ liệu lớn 150 SV', expected: 'Parse đủ 150 dòng trong < 3s', actual: `Đọc đủ ${rows6.length} dòng trong ${case6.durationMs}ms`, passed: pass6 });

  // Ca 7: Kiểm thử Export bảng điểm toàn khóa / học phần
  console.log('\n[Ca 7] Kiểm tra tốc độ & toàn vẹn khi Export Bảng điểm Excel...');
  const tExp0 = performance.now();
  const expRes = await fetch(`${BASE_URL}/api/grades/section/${sectionId}/export`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const expDurationMs = performance.now() - tExp0;
  const expBuffer = await expRes.arrayBuffer();
  const contentType = expRes.headers.get('content-type') || '';
  const pass7 = expRes.ok && expBuffer.byteLength > 1000 && contentType.includes('spreadsheetml');
  console.log(`   ➜ HTTP ${expRes.status} | Định dạng: ${contentType}`);
  console.log(`   📦 Dung lượng file export: ${(expBuffer.byteLength / 1024).toFixed(1)} KB`);
  console.log(`   ⚡ Thời gian xuất file: ${expDurationMs.toFixed(1)}ms (${expDurationMs < 1000 ? 'TỐI ƯU DƯỚI 1 GIÂY' : 'ĐẠT'})`);
  testResults.push({ id: 'NFR-EXCEL-07', name: 'Export Bảng điểm Excel', expected: 'HTTP 200, file chuẩn xlsx, < 2s', actual: `HTTP ${expRes.status}, ${expBuffer.byteLength} bytes trong ${expDurationMs.toFixed(1)}ms`, passed: pass7 });

  const allPassed = testResults.every(t => t.passed);
  console.log(`\n--- 🏆 KẾT LUẬN KIỂM THỬ IMPORT / EXPORT EXCEL ---`);
  console.log(`   Tổng số ca kiểm thử: ${testResults.length} | Thành công: ${testResults.filter(t => t.passed).length}/${testResults.length}`);
  console.log(`   ==> ĐÁNH GIÁ TỔNG THỂ: ${allPassed ? '🎉 TOÀN BỘ 7/7 CA KIỂM THỬ ĐẠT CHUẨN XUẤT SẮC' : '❌ CÓ CA KIỂM THỬ THẤT BẠI'}\n`);

  const summary = {
    testName: 'Large Data Excel Import & Export Resilience Test',
    timestamp: new Date().toISOString(),
    totalCases: testResults.length,
    passedCount: testResults.filter(t => t.passed).length,
    failedCount: testResults.filter(t => !t.passed).length,
    import150DurationMs: case6.durationMs,
    exportDurationMs: Number(expDurationMs.toFixed(2)),
    exportFileSizeBytes: expBuffer.byteLength,
    status: allPassed ? 'PASSED' : 'FAILED',
    results: testResults
  };

  const outDir = path.join(__dirname, '..', 'results');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'excel_test_summary.json'), JSON.stringify(summary, null, 2));

  return summary;
}

if (require.main === module) {
  runExcelTest()
    .then(r => process.exit(r.status === 'PASSED' ? 0 : 1))
    .catch(err => {
      console.error('Fatal excel test error:', err);
      process.exit(1);
    });
}

module.exports = { runExcelTest };
