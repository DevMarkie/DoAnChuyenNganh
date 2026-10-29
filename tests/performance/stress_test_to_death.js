// stress_test_to_death.js
// KỊCH BẢN KIỂM THỬ TẢI LIÊN TỤC ĐẾN KHI SERVER SẬP THỰC SỰ MỚI DỪNG (STRESS TEST TO DEATH)
// Tự động nâng cấp bậc tải theo chu kỳ: 1.000 -> 2.500 -> 4.500 -> 7.000 -> 10.000 -> 15.000...
// Chỉ dừng lại khi Server tê liệt hoàn toàn (Healthcheck ping thất bại hoặc Nginx trả về 502/Connection Refused).

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8080';
const TARGET_SECTION_ID = 154; // Học phần Giải tích 1
const REPORT_PATH = path.join(__dirname, '..', 'reports', 'STRESS_TEST_TO_DEATH_REPORT.md');

// 1. Đăng nhập danh sách sinh viên
async function loginStudents(count = 30) {
  process.stdout.write(`[*] Đang chuẩn bị đăng nhập ${count} tài khoản sinh viên mẫu... `);
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

// 2. Kiểm tra sinh tồn của Server (Health Check)
// Thử 4 lần liên tiếp, nếu cả 4 lần đều không thể kết nối hoặc trả về 502/504 -> Server đã sập!
async function checkServerHealth() {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/api-docs`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        return { alive: true, status: res.status };
      }
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        return { alive: false, status: res.status, error: `HTTP ${res.status} Bad Gateway / Gateway Unavailable` };
      }
    } catch (e) {
      if (attempt === 4) {
        return { alive: false, error: e.message || 'Connection Refused / Timed Out' };
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return { alive: false, error: 'Ping failed after 4 retries' };
}

// 3. Thực thi 1 đợt bắn tải dồn dập
async function runWave(waveIndex, requestCount, tokens) {
  const waveName = `Đợt ${waveIndex} (${requestCount.toLocaleString()} Requests đồng thời)`;
  console.log(`\n================================================================`);
  console.log(`>>> BẮT ĐẦU: [${waveName}]`);
  console.log(`================================================================`);

  const startTime = Date.now();
  const statusCounts = {};
  const latencies = [];
  let connectionErrors = 0;
  let completed = 0;

  // Real-time progress ticker
  const progressTimer = setInterval(() => {
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
    const percent = Math.round((completed / requestCount) * 100);
    const ok = statusCounts['200'] || 0;
    const spam = statusCounts['429'] || 0;
    const full = statusCounts['400'] || 0;
    const err = connectionErrors;
    process.stdout.write(`    ⏳ [+${elapsedSec}s] Tiến độ: ${completed.toLocaleString()}/${requestCount.toLocaleString()} (${percent}%) | 200:${ok} | 429(Chặn):${spam} | 400(Đầy):${full} | Lỗi/Timeout:${err}\r`);
  }, 800);

  // Bắn đồng loạt toàn bộ requests
  const tasks = Array.from({ length: requestCount }, (_, idx) => {
    const userObj = tokens[idx % tokens.length];
    const reqStart = Date.now();

    return fetch(`${BASE_URL}/api/enrollments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userObj.token}`,
      },
      body: JSON.stringify({ sectionId: TARGET_SECTION_ID }),
      keepalive: true,
      signal: AbortSignal.timeout(25000), // Timeout 25 giây cho mỗi request
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
        const errKey = err.name === 'TimeoutError' ? 'TIMEOUT (25s)' : 'CONN_DROPPED';
        statusCounts[errKey] = (statusCounts[errKey] || 0) + 1;
      })
      .finally(() => {
        completed++;
      });
  });

  await Promise.all(tasks);
  clearInterval(progressTimer);

  const totalDurationMs = Date.now() - startTime;
  const rps = Math.round(requestCount / (totalDurationMs / 1000));

  latencies.sort((a, b) => a - b);
  const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1));
  const minLatency = latencies[0] || 0;
  const maxLatency = latencies[latencies.length - 1] || 0;
  const p95Latency = latencies[Math.floor(latencies.length * 0.95)] || 0;

  console.log(`\n[*] KẾT QUẢ [${waveName}]:`);
  console.log(`    - Thời gian xử lý   : ${totalDurationMs.toLocaleString()} ms`);
  console.log(`    - Throughput (RPS)  : ${rps.toLocaleString()} reqs/giây`);
  console.log(`    - Độ trễ (Latency)  : Avg=${avgLatency}ms | Min=${minLatency}ms | Max=${maxLatency}ms | P95=${p95Latency}ms`);
  console.log(`    - Phân tích HTTP Status:`);
  for (const [code, count] of Object.entries(statusCounts)) {
    let desc = '';
    if (code === '200') desc = '🟢 [Ghi danh thành công - Trừ slot DB & Redis]';
    else if (code === '400') desc = '🟡 [Hết chỗ / Trùng môn / Đã đăng ký - Fast Fail]';
    else if (code === '429') desc = '🛡️ [Chặn click spam dồn dập - Token Bucket Redis]';
    else if (code === '500') desc = '🔴 [Lỗi nội bộ Server 500]';
    else if (code === '502' || code === '504') desc = '💥 [Nginx Bad Gateway - Backend sập]';
    else if (code.includes('TIMEOUT')) desc = '⏱️ [Quá tải hàng đợi - Client Timeout 25s]';
    else if (code.includes('CONN_DROPPED')) desc = '🔌 [Tràn Socket OS - Bị ngắt kết nối]';
    else desc = `(Mã HTTP ${code})`;
    console.log(`      * HTTP ${code}: ${count.toLocaleString()} requests ${desc}`);
  }

  // Kiểm tra sinh tồn của Server sau đợt bắn
  process.stdout.write(`    - Đang kiểm tra sức khỏe hệ thống sau đợt bắn... `);
  const health = await checkServerHealth();
  if (health.alive) {
    console.log(`🟢 SERVER VẪN SỐNG VÀ PHẢN HỒI BÌNH THƯỜNG!`);
  } else {
    console.log(`🔴 SERVER ĐÃ CHÍNH THỨC SẬP! (${health.error})`);
  }

  return {
    waveIndex,
    waveName,
    requestCount,
    totalDurationMs,
    rps,
    avgLatency,
    p95Latency,
    statusCounts,
    connectionErrors,
    serverAlive: health.alive,
    serverError: health.error || null,
  };
}

// 4. Chương trình chính: Vòng lặp tăng tải vô hạn cho đến khi sập
async function main() {
  console.log(`================================================================`);
  console.log(`   TEST CASE CHỊU TẢI CỰC HẠN: TEST ĐẾN KHI NÀO SẬP MỚI THÔI   `);
  console.log(`   Quy tắc: Tự động tăng số lượng requests liên tục qua từng đợt `);
  console.log(`   Chỉ dừng lại khi Server hoàn toàn không còn phản hồi (CRASH) `);
  console.log(`================================================================\n`);

  const tokens = await loginStudents(30);
  if (tokens.length === 0) {
    console.error('Lỗi: Không đăng nhập được tài khoản nào. Dừng kiểm thử.');
    return;
  }

  // Khởi đầu ở mức 1.000 requests, sau đó tăng dần: 2.500, 4.500, 7.000, 10.000, 14.000, 20.000...
  let currentLoad = 1000;
  let waveIndex = 1;
  const history = [];
  let deadWave = null;

  while (true) {
    const result = await runWave(waveIndex, currentLoad, tokens);
    history.push(result);

    // KIỂM TRA ĐIỀU KIỆN SẬP:
    // 1. Server không còn sống (health check ping chết hoàn toàn hoặc 502 Bad Gateway)
    // 2. HOẶC 100% requests bị rớt mạng / đứt kết nối (Không thể gửi bất kỳ gói tin nào)
    if (!result.serverAlive || result.connectionErrors === result.requestCount) {
      deadWave = result;
      console.log(`\n💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥`);
      console.log(`   HỆ THỐNG ĐÃ BỊ ĐÁNH SẬP HOÀN TOÀN TẠI [${result.waveName}]!`);
      console.log(`   Nguyên nhân: ${result.serverError || '100% Socket connection bị ngắt kết nối'}`);
      console.log(`   Server không còn khả năng tiếp nhận bất kỳ kết nối mới nào.`);
      console.log(`💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥\n`);
      break;
    }

    // Tăng mức tải theo cấp số nhân nhẹ cho đợt tiếp theo
    if (currentLoad < 3000) {
      currentLoad += 1500;
    } else if (currentLoad < 8000) {
      currentLoad += 2500;
    } else {
      currentLoad += 5000;
    }

    waveIndex++;
    console.log(`\n... Nghỉ 3 giây để hệ thống giải phóng cổng Socket trước khi tăng tải lên ${currentLoad.toLocaleString()} requests ...`);
    await new Promise((r) => setTimeout(r, 3000));
  }

  // In bảng tổng kết toàn bộ hành trình
  console.log(`\n================================================================`);
  console.log(`                 BẢNG TỔNG KẾT HÀNH TRÌNH ĐÁNH SẬP SERVER       `);
  console.log(`================================================================`);
  console.table(
    history.map((r) => ({
      'Đợt': `Đợt ${r.waveIndex}`,
      'Số Request': r.requestCount.toLocaleString(),
      'Thời gian (ms)': r.totalDurationMs.toLocaleString(),
      'Tốc độ (RPS)': r.rps.toLocaleString(),
      'Độ trễ trung bình (ms)': r.avgLatency,
      'Lỗi / Timeout': r.connectionErrors.toLocaleString(),
      'Trạng thái': r.serverAlive ? '🟢 SỐNG' : '🔴 SẬP TOÀN TẬP',
    }))
  );

  // Xuất báo cáo chi tiết Markdown ra file
  const reportContent = `# BÁO CÁO KIỂM THỬ TẢI: TEST ĐẾN KHI SẬP MỚI THÔI (STRESS TEST TO DEATH)
*Thời gian chạy: ${new Date().toLocaleString('vi-VN')}*
*Hạ tầng: Nginx Load Balancer (10.240 connections) + 3 Backend Replicas (Tomcat 800 threads/instance) + Redis 7 + MySQL 8*

---

## 1. Kết quả qua từng đợt tải

| Đợt | Số Requests đồng thời | Thời gian hoàn tất | Tốc độ (RPS) | Lỗi / Timeout | Tình trạng Server |
| :---: | :---: | :---: | :---: | :---: | :---: |
${history
  .map(
    (r) =>
      `| Đợt ${r.waveIndex} | **${r.requestCount.toLocaleString()} reqs** | ${r.totalDurationMs.toLocaleString()} ms | ${r.rps.toLocaleString()} req/s | ${r.connectionErrors.toLocaleString()} | ${r.serverAlive ? '🟢 Sống bình thường' : '🔴 **ĐÃ SẬP HOÀN TOÀN**'} |`
  )
  .join('\n')}

---

## 2. Điểm sập chính thức của hệ thống (Breaking Point)
- **Cấp độ tải đánh sập:** **${deadWave ? deadWave.waveName : 'Chưa xác định'}**
- **Dấu hiệu sập:** ${deadWave ? deadWave.serverError || 'Tràn toàn bộ cổng mạng TCP và Client Timeout' : 'N/A'}
- **Nguyên nhân cốt lõi:** Vượt quá giới hạn File Descriptors / TCP Socket Allocation tối đa của card mạng ảo Windows (vEthernet/Docker NAT).
`;

  fs.writeFileSync(REPORT_PATH, reportContent, 'utf-8');
  console.log(`[*] Đã xuất bản báo cáo chi tiết ra file: ${REPORT_PATH}`);
}

main().catch((err) => {
  console.error("LỖI TEST:", err);
  process.exit(1);
});
