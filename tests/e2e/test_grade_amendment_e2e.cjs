const fs = require('fs');
const http = require('http');

const BASE_URL = 'http://localhost:8080/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = options.headers || {};
  let body = options.body;

  if (body && typeof body === 'object' && !(body instanceof Buffer) && !headers['Content-Type']?.includes('multipart/form-data')) {
    body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.method === 'GET' ? undefined : body,
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  if (!res.ok) {
    throw new Error(`[${res.status}] ${typeof json === 'object' ? JSON.stringify(json) : json}`);
  }
  return json;
}

async function login(username, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: { username, password },
  });
  return data.data?.accessToken || data.accessToken || data.data?.token || data.token;
}

async function run() {
  console.log('=== BẮT ĐẦU KIỂM THỬ E2E LUỒNG 1: SỬA ĐIỂM SAU KHÓA SỔ & NHẬT KÝ VẾT ===\n');

  // 1. Đăng nhập Giảng viên phụ trách lớp (1000002)
  console.log('1. Đăng nhập tài khoản Giảng viên đứng lớp: 1000002...');
  const lecturerToken = await login('1000002', '123456');
  console.log('   ✓ Đăng nhập Giảng viên thành công.');

  // 2. Tải lên tệp minh chứng
  console.log('\n2. Tải lên tệp minh chứng (ảnh bài thi/biên bản)...');
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const fileContent = 'FAKED_PNG_BINARY_CONTENT_EXAM_EVIDENCE_2026';
  const multipartBody = 
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="bai_thi_sv2300001_phuc_khao.png"\r\n` +
    `Content-Type: image/png\r\n\r\n` +
    `${fileContent}\r\n` +
    `--${boundary}--\r\n`;

  const uploadRes = await request('/uploads/evidence', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${lecturerToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: multipartBody,
  });
  const evidenceUrl = uploadRes.data?.url;
  console.log('   ✓ Tải lên minh chứng thành công! URL:', evidenceUrl);

  // 3. Giảng viên tạo đơn sửa điểm (Bước 1)
  console.log('\n3. Giảng viên tạo đơn sửa điểm sau khóa sổ (Bước 1: Ticket Creation)...');
  const createRes = await request('/grade-amendments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${lecturerToken}` },
    body: {
      classSectionId: 2,
      studentId: 95,
      componentType: 'FINAL',
      newScore: 9.0,
      reason: 'Cộng sót câu 4 tự luận trong bài thi cuối kỳ (chấm lại sau phúc khảo)',
      evidenceUrl,
    },
  });

  const ticket = createRes.data;
  console.log('   ✓ Tạo Ticket thành công! Ticket ID:', ticket.id);
  console.log('   ✓ Trạng thái ban đầu:', ticket.status, '(Kỳ vọng: PENDING_DEPT)');
  console.log('   ✓ Điểm cũ:', ticket.oldScore, '➔ Điểm mới đề xuất:', ticket.newScore);

  if (ticket.status !== 'PENDING_DEPT') {
    throw new Error(`Trạng thái ticket không đúng: ${ticket.status}`);
  }

  // 4. Đăng nhập Trưởng bộ môn CNTT (1000001)
  console.log('\n4. Đăng nhập tài khoản Trưởng bộ môn CNTT: 1000001...');
  const headToken = await login('1000001', '123456');
  console.log('   ✓ Đăng nhập Trưởng bộ môn thành công.');

  // 5. Trưởng bộ môn thẩm định minh chứng (Bước 2: Department Review)
  console.log('\n5. Trưởng bộ môn thực hiện thẩm định minh chứng (Bước 2: Đồng thuận)...');
  const reviewRes = await request(`/grade-amendments/${ticket.id}/dept-review`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${headToken}` },
    body: {
      approved: true,
      notes: 'Đã đối chiếu bài thi gốc có chữ ký 2 cán bộ chấm thi. Đủ căn cứ điều chỉnh điểm.',
    },
  });

  const reviewedTicket = reviewRes.data;
  console.log('   ✓ Thẩm định cấp Khoa thành công! Trạng thái:', reviewedTicket.status, '(Kỳ vọng: PENDING_ACADEMIC)');
  console.log('   ✓ Trưởng bộ môn duyệt:', reviewedTicket.deptReviewerName, 'vào lúc:', reviewedTicket.deptReviewedAt);

  if (reviewedTicket.status !== 'PENDING_ACADEMIC') {
    throw new Error(`Trạng thái sau khi Khoa duyệt không đúng: ${reviewedTicket.status}`);
  }

  // 6. Đăng nhập Phòng Đào tạo (Admin học vụ: admin)
  console.log('\n6. Đăng nhập tài khoản Phòng Đào tạo (Admin học vụ: admin)...');
  const adminToken = await login('admin', '123456');
  console.log('   ✓ Đăng nhập Phòng Đào tạo thành công.');

  // 7. Phòng Đào tạo phê duyệt quyết định cuối & Ghi đè điểm (Bước 3)
  console.log('\n7. Phòng Đào tạo phê duyệt quyết định cuối (Bước 3: Final Approval & DB Transaction)...');
  const approveRes = await request(`/grade-amendments/${ticket.id}/academic-approval`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      approved: true,
    },
  });

  const finalTicket = approveRes.data;
  console.log('   ✓ Phê duyệt Phòng Đào tạo thành công! Trạng thái:', finalTicket.status, '(Kỳ vọng: APPROVED)');
  console.log('   ✓ Cán bộ duyệt cuối:', finalTicket.approvedByName, 'vào lúc:', finalTicket.approvedAt);

  if (finalTicket.status !== 'APPROVED') {
    throw new Error(`Trạng thái cuối cùng không phải APPROVED: ${finalTicket.status}`);
  }

  console.log('\n=== TẤT CẢ CÁC BƯỚC E2E ĐÃ CHẠY HOÀN HẢO! ===');
}

run().catch((err) => {
  console.error('\n❌ E2E TEST THẤT BẠI:', err.message);
  process.exit(1);
});
