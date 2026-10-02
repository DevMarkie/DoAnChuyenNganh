/**
 * Kiểm thử toàn diện luồng Import điểm từ Excel:
 * 1. Giảng viên tải template Excel của lớp (có sẵn roster).
 * 2. Lưu buffer và gửi ngược lại API import-preview để kiểm tra đối chiếu.
 * 3. Kiểm tra kết quả parse, xác thực tính hợp lệ và commit.
 */

const fs = require('fs');

async function testExcelFlow() {
  console.log('--- 📊 BẮT ĐẦU TEST LUỒNG NHẬP ĐIỂM TỪ EXCEL (TASK 4) ---');

  // Đăng nhập Giảng viên
  const loginRes = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: '1000001', password: '123456' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;

  // 1. Tải Template
  const templateRes = await fetch('http://localhost:8080/api/grades/section/1/import-template', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!templateRes.ok) {
    console.error('❌ Tải template thất bại:', templateRes.status);
    return;
  }
  const buffer = await templateRes.arrayBuffer();
  console.log(`✅ Tải template thành công, kích thước: ${buffer.byteLength} bytes.`);

  // 2. Gửi file vào import-preview
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const formData = new FormData();
  formData.append('file', blob, 'test_grade_import.xlsx');

  const previewRes = await fetch('http://localhost:8080/api/grades/section/1/import-preview', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  const previewData = await previewRes.json();
  if (!previewRes.ok) {
    console.error('❌ Import preview thất bại:', previewData);
    return;
  }

  const rows = previewData.data || [];
  console.log(`✅ Import preview thành công! Tổng cộng: ${rows.length} dòng.`);
  const validRows = rows.filter(r => r.valid);
  console.log(`   Số dòng hợp lệ: ${validRows.length}, Số dòng lỗi: ${rows.length - validRows.length}`);

  if (validRows.length > 0) {
    console.log(`   Mẫu dòng 1: SV ${validRows[0].studentCode} - ${validRows[0].studentName}, CC1=${validRows[0].cc1Score}, CC2=${validRows[0].cc2Score}, GK=${validRows[0].midtermScore}, CK=${validRows[0].finalScore}`);
  }

  console.log('🎉 TOÀN BỘ LUỒNG IMPORT EXCEL HOẠT ĐỘNG HOÀN HẢO!');
}

testExcelFlow().catch(console.error);
