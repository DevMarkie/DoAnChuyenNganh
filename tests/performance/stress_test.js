// stress_test.js
// Kịch bản Kiểm thử Tải Đa Cấp Độ đến 5.000+ requests (Tối ưu 3 Replicas + Nginx Load Balancer)

const BASE_URL = 'http://localhost:8080';
const TARGET_SECTION_ID = 154; // Môn Giải tích 1

// 1. Đăng nhập 30 sinh viên
async function loginStudents(count = 30) {
  process.stdout.write(`[*] Đang chuẩn bị đăng nhập ${count} tài khoản sinh viên... `);
  const tokens = [];
  for (let i = 1; i <= count; i++) {
    const code = String(2300000 + i);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: code, password: '123456' }),
      });
      const data = await res.json();
      const token = data?.data?.accessToken || data?.data?.token;
      if (token) {
        tokens.push({ username: code, token });
      }
    } catch (e) {}
  }
  console.log(`Hoàn tất (${tokens.length} tài khoản sẵn sàng)`);
  return tokens;
}

// 2. Kiểm tra sức khỏe hệ thống
async function checkServerHealth() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/api-docs`, { signal: AbortSignal.timeout(6000) });
      if (res.ok) return true;
    } catch (e) {
      if (attempt === 3) return false;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return false;
}

// 3. Thực hiện 1 đợt bắn tải với hiển thị tiến trình thời gian thực
async function runWave(waveName, totalRequests, tokens) {
  console.log(`\n================================================================`);
  console.log(`>>> BẮT ĐẦU: [${waveName}] - Bắn ${totalRequests.toLocaleString()} requests đồng thời`);
  console.log(`================================================================`);

  const startTime = Date.now();
  const statusCounts = {};
  const latencies = [];
  let connectionErrors = 0;
  let completed = 0;

  // Hiển thị tiến trình realtime mỗi 800ms
  const progressTimer = setInterval(() => {
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
    const percent = Math.round((completed / totalRequests) * 100);
    const ok = statusCounts['200'] || 0;
    const spam = statusCounts['429'] || 0;
    const full = statusCounts['400'] || 0;
    const err = connectionErrors;
    process.stdout.write(`    ⏳ [+${elapsedSec}s] Tiến độ: ${completed.toLocaleString()}/${totalRequests.toLocaleString()} (${percent}%) | 200:${ok} | 429(Chặn):${spam} | 400(Đầy):${full} | Lỗi/Timeout:${err}\r`);
  }, 800);

  // Khởi tạo các promise đồng thời với Timeout 30 giây (đủ cho 5.000 requests)
  const tasks = Array.from({ length: totalRequests }, (_, idx) => {
    const userObj = tokens[idx % tokens.length];
    const reqStart = Date.now();

    return fetch(`${BASE_URL}/api/enrollments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userObj.token}`,
      },
      body: JSON.stringify({ sectionId: TARGET_SECTION_ID }),
      signal: AbortSignal.timeout(30000), // Timeout 30 giây
    })
      .then((res) => {
        const duration = Date.now() - reqStart;
        latencies.push(duration);
        statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
      })
      .catch((err) => {
        const duration = Date.now() - reqStart;
        latencies.push(duration);
        connectionErrors++;
        const errKey = err.name === 'TimeoutError' ? 'TIMEOUT (30s)' : 'CONN_DROPPED';
        statusCounts[errKey] = (statusCounts[errKey] || 0) + 1;
      })
      .finally(() => {
        completed++;
      });
  });

  await Promise.all(tasks);
  clearInterval(progressTimer);

  const totalDurationMs = Date.now() - startTime;
  const rps = Math.round((totalRequests / (totalDurationMs / 1000)));

  latencies.sort((a, b) => a - b);
  const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1));
  const minLatency = latencies[0] || 0;
  const maxLatency = latencies[latencies.length - 1] || 0;
  const p95Latency = latencies[Math.floor(latencies.length * 0.95)] || 0;

  console.log(`\n[*] KẾT THÚC ĐỢT [${waveName}]:`);
  console.log(`    - Thời gian hoàn tất : ${totalDurationMs.toLocaleString()} ms`);
  console.log(`    - Tốc độ xử lý (RPS) : ${rps.toLocaleString()} requests/giây`);
  console.log(`    - Độ trễ (Latency)   : Avg=${avgLatency}ms | Min=${minLatency}ms | Max=${maxLatency}ms | P95=${p95Latency}ms`);
  console.log(`    - Phân tích chi tiết HTTP Status:`);
  for (const [code, count] of Object.entries(statusCounts)) {
    let desc = '';
    if (code === '200') desc = '🟢 [Ghi danh thành công - Trừ slot DB & Redis]';
    else if (code === '400') desc = '🟡 [Hết chỗ / Trùng môn / Đã đăng ký - Fast Fail]';
    else if (code === '429') desc = '🛡️ [Chặn click spam dồn dập - Token Bucket Redis]';
    else if (code === '500') desc = '🔴 [Lỗi nội bộ Server]';
    else if (code === '502' || code === '504') desc = '💥 [Nginx Bad Gateway - Backend sập]';
    else if (code.includes('TIMEOUT')) desc = '⏱️ [Quá tải hàng đợi - Client Timeout 30s]';
    else if (code.includes('CONN_DROPPED')) desc = '🔌 [Tràn Socket OS - Bị ngắt kết nối]';
    else desc = `(Mã HTTP ${code})`;
    console.log(`      * HTTP ${code}: ${count.toLocaleString()} requests ${desc}`);
  }

  // Kiểm tra tình trạng server sau đợt bắn
  const serverAlive = await checkServerHealth();
  console.log(`    - Trạng thái Server  : ${serverAlive ? '🟢 VẪN SỐNG VÀ PHẢN HỒI BÌNH THƯỜNG' : '🔴 SERVER ĐÃ TÊ LIỆT / SẬP'}`);

  return {
    waveName,
    totalRequests,
    totalDurationMs,
    rps,
    avgLatency,
    p95Latency,
    statusCounts,
    connectionErrors,
    serverAlive,
  };
}

async function main() {
  console.log(`================================================================`);
  console.log(`   KIỂM THỬ TẢI CỰC ĐẠI LÊN MỐC 5.000+ REQUESTS ĐỒNG THỜI       `);
  console.log(`   Hạ tầng: 3 Backend Replicas (2.400 Threads, 15.000 Backlog)  `);
  console.log(`   Cổng vào: Nginx Load Balancer (epoll 10.240 connections)      `);
  console.log(`================================================================\n`);

  const tokens = await loginStudents(30);
  if (tokens.length === 0) {
    console.error('Không lấy được token sinh viên nào! Dừng test.');
    return;
  }

  const levels = [
    { name: 'Cấp độ 1 (Tải nhẹ)', count: 500 },
    { name: 'Cấp độ 2 (Giờ cao điểm)', count: 1500 },
    { name: 'Cấp độ 3 (Tải lớn)', count: 3000 },
    { name: 'Cấp độ 4 (MỤC TIÊU: 5.000 USERS ĐỒNG THỜI)', count: 5000 },
    { name: 'Cấp độ 5 (Cực hạn: 7.500 USERS)', count: 7500 },
  ];

  const report = [];

  for (const lvl of levels) {
    const result = await runWave(lvl.name, lvl.count, tokens);
    report.push(result);

    // Điểm sập: nếu server chết hẳn HOẶC tỷ lệ lỗi/timeout > 60%
    if (!result.serverAlive || result.connectionErrors > lvl.count * 0.6) {
      console.log(`\n💥💥💥 HỆ THỐNG ĐÃ ĐẠT ĐIỂM SẬP TẠI [${lvl.name}]!`);
      break;
    }

    console.log(`\n... Nghỉ 3 giây để hệ thống giải phóng Socket trước đợt tiếp theo ...`);
    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log(`\n================================================================`);
  console.log(`                 BẢNG TỔNG HỢP KẾT QUẢ KIỂM THỬ TẢI             `);
  console.log(`================================================================`);
  console.table(
    report.map((r) => ({
      'Cấp độ': r.waveName,
      'Số Request': r.totalRequests.toLocaleString(),
      'Thời gian (ms)': r.totalDurationMs.toLocaleString(),
      'Throughput (RPS)': r.rps.toLocaleString(),
      'Avg Latency (ms)': r.avgLatency,
      'P95 Latency (ms)': r.p95Latency,
      'Lỗi / Timeout': r.connectionErrors,
      'Server Sống?': r.serverAlive ? 'OK' : 'SẬP',
    }))
  );
}

main().catch((err) => {
  console.error("LỖI TEST:", err);
  process.exit(1);
});
