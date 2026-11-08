import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://localhost:8080/api';
const DEFAULT_PASSWORD = '123456';
const CONCURRENCY = 25;
const TSV_PATH = path.resolve('tests/all_users.tsv');
const OUTPUT_JSON_PATH = path.resolve('tests/results/full_system_user_matrix_report.json');

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

async function testSingleUser(user) {
  const startTime = performance.now();
  const resRecord = {
    id: user.id,
    username: user.username,
    role: user.role,
    passed: false,
    authLatencyMs: 0,
    apiLatencyMs: 0,
    error: null,
  };

  try {
    // 1. Authenticate
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, password: DEFAULT_PASSWORD }),
    });

    resRecord.authLatencyMs = Math.round(performance.now() - startTime);

    if (!loginRes.ok) {
      resRecord.error = `HTTP ${loginRes.status}: ${loginRes.statusText}`;
      return resRecord;
    }

    const loginData = await loginRes.json();
    if (!loginData.success || !loginData.data?.token) {
      resRecord.error = loginData.message || 'Login failed (no token)';
      return resRecord;
    }

    if (loginData.data.role !== user.role) {
      resRecord.error = `Role mismatch: expected ${user.role}, got ${loginData.data.role}`;
      return resRecord;
    }

    const token = loginData.data.token;

    // 2. Role-specific Deep-Check API
    const apiStartTime = performance.now();
    let apiEndpoint = '/departments';
    if (user.role === 'STUDENT') {
      apiEndpoint = '/students/me';
    } else if (user.role === 'LECTURER') {
      apiEndpoint = '/lecturers/me';
    }

    const apiRes = await fetch(`${BASE_URL}${apiEndpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    resRecord.apiLatencyMs = Math.round(performance.now() - apiStartTime);

    if (!apiRes.ok) {
      resRecord.error = `Deep Check ${apiEndpoint} failed: HTTP ${apiRes.status}`;
      return resRecord;
    }

    const apiBody = await apiRes.json();
    if (!apiBody.success) {
      resRecord.error = `Deep Check ${apiEndpoint} returned success=false`;
      return resRecord;
    }

    resRecord.passed = true;
    return resRecord;
  } catch (err) {
    resRecord.error = err.message || String(err);
    return resRecord;
  }
}

async function run() {
  console.log(`\n${c.bold}${c.cyan}========================================================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}    KIỂM THỬ MA TRẬN 100% TÀI KHOẢN HỆ THỐNG (FULL USER MATRIX TEST SUITE)             ${c.reset}`);
  console.log(`${c.bold}${c.cyan}    Target: ${BASE_URL} | Concurrency: ${CONCURRENCY} workers | Password: ${DEFAULT_PASSWORD}              ${c.reset}`);
  console.log(`${c.bold}${c.cyan}========================================================================================${c.reset}\n`);

  if (!fs.existsSync(TSV_PATH)) {
    console.error(`Không tìm thấy file danh sách: ${TSV_PATH}`);
    process.exit(1);
  }

  const lines = fs.readFileSync(TSV_PATH, 'utf-8').trim().split('\n');
  const users = lines.map(line => {
    const [id, username, role] = line.trim().split('\t');
    return { id: Number(id), username, role };
  }).filter(u => u.username && u.role);

  console.log(`Đã nạp thành công ${c.bold}${users.length}${c.reset} tài khoản vào hàng đợi kiểm thử.\n`);

  const results = [];
  let completed = 0;
  let passedCount = 0;
  let failedCount = 0;
  const globalStartTime = performance.now();

  let queueIndex = 0;

  async function worker() {
    while (queueIndex < users.length) {
      const idx = queueIndex++;
      const user = users[idx];
      const res = await testSingleUser(user);
      results.push(res);
      completed++;
      if (res.passed) passedCount++;
      else failedCount++;
    }
  }

  // Progress reporter interval
  const interval = setInterval(() => {
    const elapsedSec = (performance.now() - globalStartTime) / 1000;
    const percent = ((completed / users.length) * 100).toFixed(1);
    const rate = Math.round(completed / elapsedSec);
    process.stdout.write(`\r${c.bold}[Tiến độ: ${completed}/${users.length} (${percent}%)]${c.reset} | ${c.green}Passed: ${passedCount}${c.reset} | ${c.red}Failed: ${failedCount}${c.reset} | Tốc độ: ~${rate} req/s   `);
  }, 100);

  // Launch concurrency workers
  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);
  clearInterval(interval);

  const totalDurationSec = ((performance.now() - globalStartTime) / 1000).toFixed(2);
  process.stdout.write(`\r${c.bold}[Tiến độ: ${users.length}/${users.length} (100.0%)]${c.reset} | ${c.green}Passed: ${passedCount}${c.reset} | ${c.red}Failed: ${failedCount}${c.reset} | Hoàn tất trong ${totalDurationSec}s!        \n\n`);

  // Aggregate stats by role
  const roleStats = {};
  const latencies = [];

  for (const r of results) {
    if (!roleStats[r.role]) {
      roleStats[r.role] = { total: 0, passed: 0, failed: 0, authLatencies: [] };
    }
    roleStats[r.role].total++;
    if (r.passed) roleStats[r.role].passed++;
    else roleStats[r.role].failed++;
    roleStats[r.role].authLatencies.push(r.authLatencyMs);
    latencies.push(r.authLatencyMs);
  }

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

  console.log(`${c.bold}${c.blue}----------------------------------------------------------------------------------------${c.reset}`);
  console.log(`${c.bold}  VAI TRÒ (ROLE)           TỔNG      PASSED      FAILED      TỶ LỆ PASS    AVG LATENCY${c.reset}`);
  console.log(`${c.bold}${c.blue}----------------------------------------------------------------------------------------${c.reset}`);

  for (const [role, s] of Object.entries(roleStats)) {
    const avgLat = Math.round(s.authLatencies.reduce((a, b) => a + b, 0) / s.authLatencies.length);
    const passRate = ((s.passed / s.total) * 100).toFixed(1) + '%';
    const rolePadded = role.padEnd(23);
    const totalPadded = String(s.total).padStart(6);
    const passedPadded = String(s.passed).padStart(10);
    const failedPadded = String(s.failed).padStart(10);
    const ratePadded = passRate.padStart(13);
    const latPadded = (avgLat + ' ms').padStart(14);

    const color = s.failed === 0 ? c.green : c.red;
    console.log(`${color}  ${rolePadded} ${totalPadded}  ${passedPadded}  ${failedPadded}  ${ratePadded}  ${latPadded}${c.reset}`);
  }

  console.log(`${c.bold}${c.blue}----------------------------------------------------------------------------------------${c.reset}`);
  console.log(`  ${c.bold}TỔNG CỘNG:${c.reset}               ${String(users.length).padStart(6)}  ${c.green}${String(passedCount).padStart(10)}${c.reset}  ${failedCount === 0 ? c.green : c.red}${String(failedCount).padStart(10)}${c.reset}  ${(((passedCount / users.length) * 100).toFixed(1) + '%').padStart(13)}`);
  console.log(`\n  * Thời gian phản hồi: p50 = ${p50}ms | p95 = ${p95}ms | p99 = ${p99}ms`);
  console.log(`  * Tổng thời gian thực thi: ${totalDurationSec} giây (~${Math.round(users.length / totalDurationSec)} tài khoản/giây)`);

  // Failures check
  const failures = results.filter(r => !r.passed);
  if (failures.length > 0) {
    console.log(`\n${c.bold}${c.red}DANH SÁCH ${failures.length} TÀI KHOẢN GẶP LỖI:${c.reset}`);
    for (const f of failures.slice(0, 10)) {
      console.log(`  - [${f.role}] ${f.username}: ${f.error}`);
    }
    if (failures.length > 10) {
      console.log(`  ... và ${failures.length - 10} tài khoản khác xem trong file JSON.`);
    }
  } else {
    console.log(`\n${c.bold}${c.green}🎉 XUẤT SẮC! TOÀN BỘ 3.087 TÀI KHOẢN ĐỀU VƯỢT QUA KIỂM THỬ THÀNH CÔNG 100%!${c.reset}`);
  }

  // Save report
  fs.mkdirSync(path.dirname(OUTPUT_JSON_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalUsers: users.length,
    passed: passedCount,
    failed: failedCount,
    passRate: ((passedCount / users.length) * 100).toFixed(2) + '%',
    durationSec: Number(totalDurationSec),
    latencyMetrics: { p50, p95, p99 },
    roleBreakdown: roleStats,
    failures: failures,
  }, null, 2));

  console.log(`\n${c.bold}File báo cáo chi tiết đã lưu tại:${c.reset} ${OUTPUT_JSON_PATH}\n`);
}

run();
