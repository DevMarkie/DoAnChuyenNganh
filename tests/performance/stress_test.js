// stress_test.js
// =====================================================================================
// KỊCH BẢN KIỂM THỬ LEO THANG TẢI VÔ HẠN ĐẾN KHI SERVER SẬP (STRESS TEST TO COLLAPSE)
// Tự động nâng cấp bậc tải lũy tiến: 1.000 -> 2.500 -> 5.000 -> 10.000 -> 18.000 -> 30.000...
// Nghỉ 3 giây giữa các đợt để đo chính xác giới hạn chịu đựng cực hạn.
// Chỉ dừng lại khi Server hoàn toàn tê liệt / sập kết nối (CRASH).
// =====================================================================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const TARGET_SECTION_ID = Number(process.env.SECTION_ID) || 154; // Học phần Giải tích 1

// 1. Đăng nhập danh sách tài khoản sinh viên mẫu
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
        signal: AbortSignal.timeout(6000),
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
// Thử 3 lần liên tiếp, nếu không kết nối được hoặc trả về 502/503/504 -> Server đã sập
async function checkServerHealth() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/api-docs`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        return { alive: true, status: res.status };
      }
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        return { alive: false, status: res.status, error: `HTTP ${res.status} Bad Gateway / Gateway Unavailable` };
      }
    } catch (e) {
      if (attempt === 3) {
        return { alive: false, error: e.message || 'Connection Refused / Timed Out' };
      }
      await new Promise((r) => setTimeout(r, 1200));
    }
  }
  return { alive: false, error: 'Health check failed after 3 retries' };
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

  // Real-time progress ticker hiển thị trên console mỗi 600ms
  const progressTimer = setInterval(() => {
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
    const percent = Math.round((completed / requestCount) * 100);
    const ok = statusCounts['200'] || 0;
    const spam = statusCounts['429'] || 0;
    const full = statusCounts['400'] || 0;
    const err = connectionErrors;
    process.stdout.write(`    ⏳ [+${elapsedSec}s] Tiến độ: ${completed.toLocaleString()}/${requestCount.toLocaleString()} (${percent}%) | 200:${ok} | 429(Chặn):${spam} | 400(Đầy):${full} | Lỗi/Timeout:${err}\r`);
  }, 600);

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
      signal: AbortSignal.timeout(30000), // Timeout 30 giây cho mỗi request tải nặng
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
  const rps = Math.round(requestCount / ((totalDurationMs || 1) / 1000));

  latencies.sort((a, b) => a - b);
  const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1));
  const minLatency = latencies[0] || 0;
  const maxLatency = latencies[latencies.length - 1] || 0;
  const p95Latency = latencies[Math.floor(latencies.length * 0.95)] || 0;

  console.log(`\n[*] KẾT THÚC [${waveName}]:`);
  console.log(`    - Thời gian xử lý   : ${totalDurationMs.toLocaleString()} ms`);
  console.log(`    - Tốc độ (RPS)      : ${rps.toLocaleString()} reqs/giây`);
  console.log(`    - Độ trễ (Latency)  : Avg=${avgLatency}ms | Min=${minLatency}ms | Max=${maxLatency}ms | P95=${p95Latency}ms`);
  console.log(`    - Phân tích chi tiết HTTP Status:`);
  for (const [code, count] of Object.entries(statusCounts)) {
    let desc = '';
    if (code === '200') desc = '🟢 [Ghi danh thành công - Trừ slot DB & Redis]';
    else if (code === '400') desc = '🟡 [Hết chỗ / Trùng môn / Đã đăng ký - Fast Fail]';
    else if (code === '429') desc = '🛡️ [Chặn click spam dồn dập - Token Bucket Redis]';
    else if (code === '500') desc = '🔴 [Lỗi nội bộ Server 500]';
    else if (code === '502' || code === '504') desc = '💥 [Nginx Bad Gateway - Backend sập]';
    else if (code.includes('TIMEOUT')) desc = '⏱️ [Quá tải hàng đợi - Client Timeout 30s]';
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

// 4. Chương trình chính: Vòng lặp leo thang tải vô hạn
async function main() {
  console.log(`================================================================`);
  console.log(`   KỊCH BẢN KIỂM THỬ TẢI VÔ HẠN: LEO THANG ĐẾN KHI SERVER SẬP   `);
  console.log(`   Nghiệp vụ: POST /api/enrollments (JWT + Redis Lock + DB)     `);
  console.log(`   Quy tắc: Tăng tải liên tục qua từng đợt, nghỉ 3s giữa đợt    `);
  console.log(`   Chỉ dừng lại khi Server hoàn toàn không còn phản hồi (CRASH) `);
  console.log(`================================================================\n`);

  const tokens = await loginStudents(30);
  if (tokens.length === 0) {
    console.error('Lỗi: Không đăng nhập được tài khoản sinh viên nào! Dừng test.');
    return;
  }

  // Khởi đầu ở mức 1.000 requests, sau đó tăng dần: 2.500, 5.000, 10.000, 18.000, 30.000, 48.000...
  let currentLoad = 1000;
  let waveIndex = 1;
  const history = [];
  let deadWave = null;

  while (true) {
    const result = await runWave(waveIndex, currentLoad, tokens);
    history.push(result);

    // TIÊU CHÍ KẾT LUẬN SERVER SẬP:
    // 1. Healthcheck ping thất bại liên tiếp hoặc Nginx trả về 502/504 Bad Gateway
    // 2. HOẶC tỷ lệ lỗi kết nối/timeout vượt quá 80%
    const errorRate = result.connectionErrors / result.requestCount;
    if (!result.serverAlive || errorRate >= 0.8) {
      deadWave = result;
      console.log(`\n💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥`);
      console.log(`   HỆ THỐNG ĐÃ CHÍNH THỨC ĐẠT ĐIỂM SẬP CỰC HẠN TẠI [${result.waveName}]!`);
      console.log(`   Nguyên nhân: ${result.serverError || `Tỷ lệ lỗi kết nối và timeout vượt quá ${(errorRate * 100).toFixed(1)}%`}`);
      console.log(`   Server không còn khả năng tiếp nhận bất kỳ kết nối mới nào.`);
      console.log(`💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥\n`);
      break;
    }

    // Tăng tải đợt tiếp theo theo cấp số nhân
    if (currentLoad === 1000) currentLoad = 2500;
    else if (currentLoad === 2500) currentLoad = 5000;
    else if (currentLoad === 5000) currentLoad = 10000;
    else currentLoad = Math.round(currentLoad * 1.6);

    waveIndex++;

    console.log(`\n... Nghỉ 3 giây để Server và Hệ điều hành giải phóng Socket trước đợt tiếp theo ...`);
    await new Promise((r) => setTimeout(r, 3000));
  }

  // TỔNG KẾT & PHÂN TÍCH KHẢ NĂNG CHỊU TẢI
  console.log(`================================================================`);
  console.log(`                 BẢNG TỔNG HỢP LỊCH SỬ LEO THANG TẢI            `);
  console.log(`================================================================`);
  console.table(
    history.map((r) => ({
      'Đợt': `Đợt ${r.waveIndex}`,
      'Số Request': r.requestCount.toLocaleString(),
      'Thời gian (ms)': r.totalDurationMs.toLocaleString(),
      'Throughput (RPS)': r.rps.toLocaleString(),
      'Avg Latency (ms)': r.avgLatency,
      'P95 Latency (ms)': r.p95Latency,
      'Lỗi / Timeout': r.connectionErrors.toLocaleString(),
      'Trạng thái': r.serverAlive ? '🟢 SỐNG' : '🔴 SẬP',
    }))
  );

  const safeWave = history.length > 1 ? history[history.length - 2] : null;
  const peakRps = Math.max(...history.map((r) => r.rps));

  console.log(`\n================================================================`);
  console.log(`                 ĐÁNH GIÁ NĂNG LỰC HỆ THỐNG (BREAKING POINT)    `);
  console.log(`================================================================`);
  console.log(` ⭐ Throughput Đỉnh (Peak RPS)     : ${peakRps.toLocaleString()} requests/giây`);
  if (safeWave) {
    console.log(` 🛡️ Ngưỡng An toàn Tối đa (Safe Load): ${safeWave.requestCount.toLocaleString()} requests đồng thời (P95: ${safeWave.p95Latency}ms, RPS: ${safeWave.rps})`);
  }
  if (deadWave) {
    console.log(` 💥 Ngưỡng Sụp đổ (Collapse Load)   : ${deadWave.requestCount.toLocaleString()} requests đồng thời`);
    console.log(` ⚠️ Nguyên nhân sập chính xác      : ${deadWave.serverError || 'Tràn bộ đệm kết nối TCP / Timeout'}`);
  }
  console.log(`================================================================\n`);
}

main().catch((err) => {
  console.error('LỖI TEST:', err);
  process.exit(1);
});
