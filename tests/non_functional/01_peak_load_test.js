/**
 * 01_peak_load_test.js
 * Mô phỏng kịch bản cao điểm: Hàng ngàn/hàng chục ngàn sinh viên đồng loạt truy cập
 * vào đúng 00:00 hoặc 08:00 sáng ngày mở cổng ĐKTC.
 * Kiểm tra: Máy chủ sập (502/504 Bad Gateway), Database Deadlock, và độ trễ phản hồi.
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_URL || 'http://localhost:8080';
const TOKENS_FILE = path.join(__dirname, '..', 'performance', 'demo_100', 'tokens_100.json');

function percentile(arr, p) {
  if (!arr.length) return 0;
  const idx = Math.min(Math.floor((p / 100) * arr.length), arr.length - 1);
  return arr[idx];
}

async function runPeakLoadTest(totalRequests = 5000, concurrency = 100) {
  console.log('========================================================================');
  console.log(`⚡ 01. KIỂM THỬ TẢI CAO ĐIỂM (00:00 / 08:00 REGISTRATION RUSH HOUR)`);
  console.log(`   Mục tiêu: Mô phỏng đợt sóng truy cập đỉnh điểm`);
  console.log(`   Tổng requests: ${totalRequests} | Concurrency: ${concurrency} luồng đồng thời`);
  console.log(`   Endpoint đích: Tra cứu danh mục học phần & Thời khóa biểu cổng SV`);
  console.log('========================================================================\n');

  let tokens = [];
  if (fs.existsSync(TOKENS_FILE)) {
    tokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
  }
  const defaultAuth = tokens.length ? `Bearer ${tokens[0].token}` : '';

  const endpoints = [
    { name: 'Tra cứu danh mục môn', url: `${BASE_URL}/api/courses/sections?page=0&size=20` },
    { name: 'Kiểm tra đợt ĐKHP', url: `${BASE_URL}/api/registration-waves/active` },
    { name: 'Xem học kỳ hiện tại', url: `${BASE_URL}/api/semesters/current` }
  ];

  const latencies = [];
  const statusCounts = {};
  let deadlocks = 0;
  let serverCrashes = 0; // 502, 503, 504

  const startTime = Date.now();
  let completed = 0;

  async function worker(queue) {
    for (const item of queue) {
      const ep = endpoints[item.reqId % endpoints.length];
      const token = tokens.length ? `Bearer ${tokens[item.reqId % tokens.length].token}` : defaultAuth;
      const t0 = performance.now();
      try {
        const res = await fetch(ep.url, {
          method: 'GET',
          headers: {
            'Authorization': token,
            'Accept': 'application/json'
          }
        });
        const elapsed = performance.now() - t0;
        latencies.push(elapsed);
        statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;

        if ([502, 503, 504].includes(res.status)) serverCrashes++;
        if (res.status === 500) {
          const body = await res.text().catch(() => '');
          if (body.toLowerCase().includes('deadlock')) deadlocks++;
        }
      } catch (err) {
        statusCounts['NETWORK_ERR'] = (statusCounts['NETWORK_ERR'] || 0) + 1;
        serverCrashes++;
      }
      completed++;
      if (completed % 1000 === 0 || completed === totalRequests) {
        process.stdout.write(`   ➜ Đã hoàn thành: ${completed}/${totalRequests} reqs (${Math.round((completed / totalRequests) * 100)}%)\r`);
      }
    }
  }

  // Chia đều requests cho số lượng worker luồng concurrency
  const queues = Array.from({ length: concurrency }, () => []);
  for (let i = 0; i < totalRequests; i++) {
    queues[i % concurrency].push({ reqId: i });
  }

  await Promise.all(queues.map(q => worker(q)));
  const totalDurationMs = Date.now() - startTime;
  const durationSec = totalDurationMs / 1000;
  latencies.sort((a, b) => a - b);

  const rps = (totalRequests / durationSec).toFixed(1);
  const avg = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1);
  const p50 = percentile(latencies, 50).toFixed(1);
  const p95 = percentile(latencies, 95).toFixed(1);
  const p99 = percentile(latencies, 99).toFixed(1);

  console.log('\n\n--- 📊 KẾT QUẢ KIỂM THỬ TẢI CAO ĐIỂM ---');
  console.log(`⏱  Tổng thời gian: ${(durationSec).toFixed(2)}s | Thông lượng: ${rps} reqs/giây`);
  console.log(`📈 Phân bố mã HTTP: ${JSON.stringify(statusCounts)}`);
  console.log(`⚡ Độ trễ (ms): Min = ${latencies[0]?.toFixed(1)}ms | Trung bình = ${avg}ms`);
  console.log(`🎯 Phân vị: P50 = ${p50}ms | P95 = ${p95}ms | P99 = ${p99}ms`);
  console.log(`🛡  Sự cố máy chủ sập (502/503/504): ${serverCrashes} (${serverCrashes === 0 ? 'AN TOÀN TUYỆT ĐỐI' : 'CÓ NGHẼN CỔNG'})`);
  console.log(`🔒 Nghẽn CSDL (Database Deadlock): ${deadlocks} (${deadlocks === 0 ? 'KHÔNG XẢY RA DEADLOCK' : 'CẦN TỐI ƯU INDEX/LOCK'})`);

  const summary = {
    testName: 'Peak Load & High Concurrency Stress Test',
    timestamp: new Date().toISOString(),
    totalRequests,
    concurrency,
    durationSec: Number(durationSec.toFixed(2)),
    rps: Number(rps),
    statusCounts,
    latency: {
      avg: Number(avg),
      p50: Number(p50),
      p95: Number(p95),
      p99: Number(p99)
    },
    serverCrashes,
    deadlocks,
    status: serverCrashes === 0 && deadlocks === 0 ? 'PASSED' : 'WARNING'
  };

  const outDir = path.join(__dirname, '..', 'results');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'load_test_summary.json'), JSON.stringify(summary, null, 2));

  return summary;
}

if (require.main === module) {
  const reqs = process.argv[2] ? parseInt(process.argv[2], 10) : 5000;
  const conc = process.argv[3] ? parseInt(process.argv[3], 10) : 100;
  runPeakLoadTest(reqs, conc)
    .then(r => process.exit(r.status === 'PASSED' ? 0 : 1))
    .catch(err => {
      console.error('Fatal load test error:', err);
      process.exit(1);
    });
}

module.exports = { runPeakLoadTest };
