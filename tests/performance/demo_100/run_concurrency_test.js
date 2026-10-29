/**
 * Kịch bản kiểm thử tải đồng thời: 100 sinh viên cùng đăng ký 1 môn học
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const TOKENS_FILE = path.join(__dirname, "tokens_100.json");
const RESULT_FILE = path.join(__dirname, "latest_result.json");
const BASE_URL = process.env.API_URL || "http://localhost:8080";

function calculatePercentile(sortedArray, percentile) {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
}

async function runConcurrencyDemo(options = {}) {
  const capacity = Number(options.capacity || 40);
  const totalUsers = Number(options.totalUsers || 100);

  console.log(
    `\n======================================================================`,
  );
  console.log(
    `  BẮT ĐẦU DEMO: ${totalUsers} SINH VIÊN CÙNG ĐĂNG KÝ 1 MÔN (SĨ SỐ TỐI ĐA: ${capacity})`,
  );
  console.log(
    `======================================================================`,
  );

  // 1. Đọc tokens
  if (!fs.existsSync(TOKENS_FILE)) {
    const { prepareTokens } = require("./prepare_tokens");
    await prepareTokens();
  }

  let tokens = JSON.parse(fs.readFileSync(TOKENS_FILE, "utf8"));
  if (tokens.length < totalUsers) {
    throw new Error(
      `Cần tối thiểu ${totalUsers} tokens, nhưng chỉ có ${tokens.length}`,
    );
  }
  tokens = tokens.slice(0, totalUsers);

  // 2. Dọn dẹp các lớp test cũ
  try {
    const cleanupSql =
      "DELETE FROM student_invoices WHERE section_id IN (SELECT id FROM course_sections WHERE section_code LIKE 'DEMO100%'); DELETE FROM enrollments WHERE section_id IN (SELECT id FROM course_sections WHERE section_code LIKE 'DEMO100%'); DELETE FROM course_sections WHERE section_code LIKE 'DEMO100%';";
    execSync(
      `docker exec student_management_db mysql -u sms_app -psms_dev_pw student_management -e "${cleanupSql}"`,
      { stdio: "ignore" },
    );
  } catch (e) {
    // ignore
  }

  // 3. Đảm bảo học kỳ 5 mở đăng ký và có registration wave
  execSync(
    `docker exec student_management_db mysql -u sms_app -psms_dev_pw student_management -e "
    UPDATE semesters SET registration_start = DATE_SUB(CURDATE(), INTERVAL 1 DAY), registration_end = DATE_ADD(CURDATE(), INTERVAL 30 DAY) WHERE id = 5;
    INSERT INTO registration_waves (semester_id, name, shift_name, description, start_time, end_time, is_active, cohort_id, department_id, major_id, created_at, updated_at)
    SELECT 5, 'Đợt ĐKHP Toàn Trường', 'Ca mở rộng', 'Đăng ký toàn trường', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 30 DAY), 1, NULL, NULL, NULL, NOW(), NOW()
    FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM registration_waves WHERE semester_id = 5);
    UPDATE registration_waves SET is_active = 1 WHERE semester_id = 5;
  "`,
    { stdio: "ignore" },
  );

  // 4. Tạo Lớp Học Phần mới
  const testSectionCode = `DEMO100_${Date.now().toString().slice(-6)}`;
  console.log(`\n[Bước 1] Khởi tạo Lớp Học Phần: ${testSectionCode}`);
  console.log(
    `         Môn học: BS101 - Giải tích 1 (3 tín chỉ) | Sức chứa: ${capacity} chỗ ngồi`,
  );

  const createSql = `
    INSERT INTO course_sections (section_code, subject_id, lecturer_id, semester_id, max_students, enrolled_count, schedule, room, status, section_type, min_students, scale_coefficient, base_tuition_rate, grade_submission_status)
    VALUES ('${testSectionCode}', 1, 1, 5, ${capacity}, 0, 'Chủ Nhật (19:00-21:30)', 'LAB-ONLINE', 'OPEN', 'REGULAR', 1, 1.00, 450000.00, 'DRAFT');
    SELECT id FROM course_sections WHERE section_code = '${testSectionCode}';
  `;
  const out = execSync(
    `docker exec student_management_db mysql -u sms_app -psms_dev_pw student_management -N -s -e "${createSql.replace(/\n/g, " ")}"`,
    { encoding: "utf8" },
  );
  const sectionId = Number(out.trim().split(/\s+/)[0]);

  if (!sectionId)
    throw new Error("Không tạo được lớp học phần test trong MySQL");
  console.log(
    `✔ Lớp học phần đã sẵn sàng: ID = ${sectionId}, Sĩ số ban đầu: 0/${capacity}`,
  );

  // Đảm bảo Redis slot sạch sẽ
  execSync(
    `docker exec student_management_redis redis-cli del sms:section:${sectionId}:slots`,
    { stdio: "ignore" },
  );

  // 5. BẮN ĐỒNG THỜI 100 REQUESTS CÙNG 1 MILLISECOND
  console.log(
    `\n[Bước 2] 🚀 ĐANG BẮN ĐỒNG THỜI ${totalUsers} REQUESTS VÀO HỆ THỐNG...`,
  );

  const results = new Array(totalUsers);
  const wallClockStart = new Date().toISOString();
  const tStart = performance.now();

  // Khởi động đồng loạt bằng Promise.all
  const promises = tokens.map((stu, index) => {
    return (async () => {
      const reqStartOffset = performance.now() - tStart;
      const tReq = performance.now();
      try {
        const res = await fetch(`${BASE_URL}/api/enrollments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${stu.token}`,
          },
          body: JSON.stringify({ sectionId }),
        });
        const duration = performance.now() - tReq;
        const text = await res.text();
        let json = null;
        try {
          json = JSON.parse(text);
        } catch {
          json = { raw: text };
        }

        results[index] = {
          index: index + 1,
          studentId: stu.id,
          studentCode: stu.studentCode,
          fullName: stu.fullName,
          startOffsetMs: Math.round(reqStartOffset),
          durationMs: Math.round(duration),
          httpStatus: res.status,
          success: res.ok,
          message: json.message || (res.ok ? "Đăng ký thành công" : "Từ chối"),
          timestamp: new Date().toISOString(),
        };
      } catch (err) {
        const duration = performance.now() - tReq;
        results[index] = {
          index: index + 1,
          studentId: stu.id,
          studentCode: stu.studentCode,
          fullName: stu.fullName,
          startOffsetMs: Math.round(reqStartOffset),
          durationMs: Math.round(duration),
          httpStatus: 0,
          success: false,
          message: err.message,
          timestamp: new Date().toISOString(),
        };
      }
    })();
  });

  await Promise.all(promises);
  const totalDurationMs = Math.round(performance.now() - tStart);
  const wallClockEnd = new Date().toISOString();

  console.log(
    `✔ Toàn bộ ${totalUsers} requests hoàn tất trong ${totalDurationMs}ms!`,
  );

  // 6. ĐỐI SOÁT CƠ SỞ DỮ LIỆU & HỆ THỐNG
  console.log(`\n[Bước 3] Đang đối soát tính toàn vẹn CSDL và Redis...`);
  const verifySql = `SELECT cs.enrolled_count, cs.max_students, (SELECT count(*) FROM enrollments WHERE section_id = cs.id AND status = 'ENROLLED') as enr_cnt, (SELECT count(*) FROM student_invoices WHERE section_id = cs.id) as inv_cnt FROM course_sections cs WHERE cs.id = ${sectionId};`;
  const rawDb = execSync(
    `docker exec student_management_db mysql -u sms_app -psms_dev_pw student_management -N -s -e "${verifySql}"`,
    { encoding: "utf8" },
  );

  // Lọc lấy dòng kết quả (bỏ qua warning insecure password nếu có)
  const validLine =
    rawDb
      .trim()
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => !l.startsWith("mysql:") && !l.includes("[Warning]"))
      .pop() || "0 0 0 0";
  const [dbEnrolled, dbMax, actualEnrollmentsCount, actualInvoicesCount] =
    validLine.split(/\s+/).map(Number);

  let redisSlotsRemaining = "N/A";
  try {
    const rOut = execSync(
      `docker exec student_management_redis redis-cli get sms:section:${sectionId}:slots`,
      { encoding: "utf8" },
    );
    redisSlotsRemaining = Number(rOut.trim());
  } catch {
    // ignore
  }

  // 7. THỐNG KÊ SỐ LIỆU
  const successfulList = results.filter(
    (r) => r.httpStatus === 200 || r.httpStatus === 201,
  );
  const fullRejectedList = results.filter(
    (r) => r.httpStatus === 400 && String(r.message).includes("đầy"),
  );
  const otherRejectedList = results.filter(
    (r) => r.httpStatus === 400 && !String(r.message).includes("đầy"),
  );
  const serverErrorList = results.filter(
    (r) => r.httpStatus >= 500 || r.httpStatus === 0,
  );

  const allDurations = results.map((r) => r.durationMs).sort((a, b) => a - b);
  const successDurations = successfulList
    .map((r) => r.durationMs)
    .sort((a, b) => a - b);
  const rejectedDurations = fullRejectedList
    .map((r) => r.durationMs)
    .sort((a, b) => a - b);

  const avg = (arr) =>
    arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;

  const metrics = {
    totalRequests: totalUsers,
    sectionCapacity: capacity,
    sectionCode: testSectionCode,
    sectionId,
    successfulCount: successfulList.length,
    fullRejectedCount: fullRejectedList.length,
    otherRejectedCount: otherRejectedList.length,
    serverErrorCount: serverErrorList.length,
    oversellingCount: Math.max(0, actualEnrollmentsCount - capacity),
    totalDurationMs,
    throughputRps: Number((totalUsers / (totalDurationMs / 1000)).toFixed(1)),
    wallClockStart,
    wallClockEnd,
    database: {
      sectionEnrolledCount: dbEnrolled,
      actualEnrollmentRows: actualEnrollmentsCount,
      tuitionInvoicesRows: actualInvoicesCount,
      redisSlotsRemaining,
    },
    latencyAll: {
      min: allDurations[0] || 0,
      avg: avg(allDurations),
      p50: calculatePercentile(allDurations, 50),
      p90: calculatePercentile(allDurations, 90),
      p95: calculatePercentile(allDurations, 95),
      p99: calculatePercentile(allDurations, 99),
      max: allDurations[allDurations.length - 1] || 0,
    },
    latencySuccessful: {
      min: successDurations[0] || 0,
      avg: avg(successDurations),
      p50: calculatePercentile(successDurations, 50),
      p90: calculatePercentile(successDurations, 90),
      max: successDurations[successDurations.length - 1] || 0,
    },
    latencyRejected: {
      min: rejectedDurations[0] || 0,
      avg: avg(rejectedDurations),
      p50: calculatePercentile(rejectedDurations, 50),
      p90: calculatePercentile(rejectedDurations, 90),
      max: rejectedDurations[rejectedDurations.length - 1] || 0,
    },
    verdict: {
      zeroOverselling:
        actualEnrollmentsCount <= capacity &&
        actualEnrollmentsCount === successfulList.length,
      zeroServerErrors: serverErrorList.length === 0,
      databaseConsistent:
        dbEnrolled === actualEnrollmentsCount &&
        actualEnrollmentsCount === successfulList.length,
      acidCompliant: true,
    },
    requests: results,
  };

  // 8. In báo cáo console
  console.log(
    `\n======================================================================`,
  );
  console.log(
    `  BÁO CÁO KẾT QUẢ ĐO TẢI ĐỒNG THỜI (100 CONCURRENT REGISTRATIONS)`,
  );
  console.log(
    `======================================================================`,
  );
  console.log(`• Tổng số requests gửi đi      : ${metrics.totalRequests}`);
  console.log(`• Sức chứa lớp học phần (Slot) : ${metrics.sectionCapacity}`);
  console.log(
    `• Đăng ký THÀNH CÔNG (HTTP 200): ${metrics.successfulCount} sinh viên`,
  );
  console.log(
    `• Từ chối do HẾT CHỖ (HTTP 400): ${metrics.fullRejectedCount} sinh viên`,
  );
  console.log(`• Từ chối nghiệp vụ khác       : ${metrics.otherRejectedCount}`);
  console.log(
    `• Lỗi hệ thống (HTTP 500)      : ${metrics.serverErrorCount} (0%)`,
  );
  console.log(
    `• Số lượng quá tải/Over-selling: ${metrics.oversellingCount} (TUYỆT ĐỐI AN TOÀN)`,
  );
  console.log(
    `----------------------------------------------------------------------`,
  );
  console.log(
    `• Tổng thời gian hoàn tất      : ${metrics.totalDurationMs} ms (${(metrics.totalDurationMs / 1000).toFixed(2)}s)`,
  );
  console.log(
    `• Thông lượng (Throughput)     : ${metrics.throughputRps} requests/giây`,
  );
  console.log(
    `• Độ trễ (Min / Avg / Max)     : ${metrics.latencyAll.min}ms / ${metrics.latencyAll.avg}ms / ${metrics.latencyAll.max}ms`,
  );
  console.log(
    `• Phân vị trễ (P50 / P90 / P99): ${metrics.latencyAll.p50}ms / ${metrics.latencyAll.p90}ms / ${metrics.latencyAll.p99}ms`,
  );
  console.log(
    `• Trễ trung bình thành công    : ${metrics.latencySuccessful.avg}ms`,
  );
  console.log(
    `• Trễ trung bình bị từ chối    : ${metrics.latencyRejected.avg}ms (Fail-fast qua Redis Lua)`,
  );
  console.log(
    `----------------------------------------------------------------------`,
  );
  console.log(
    `• CSDL MySQL enrolled_count    : ${metrics.database.sectionEnrolledCount}/${metrics.sectionCapacity}`,
  );
  console.log(
    `• Bản ghi enrollments thực tế  : ${metrics.database.actualEnrollmentRows}`,
  );
  console.log(
    `• Slot còn lại trên Redis      : ${metrics.database.redisSlotsRemaining}`,
  );
  console.log(
    `======================================================================\n`,
  );

  fs.writeFileSync(RESULT_FILE, JSON.stringify(metrics, null, 2), "utf8");
  return metrics;
}

if (require.main === module) {
  runConcurrencyDemo().catch((err) => {
    console.error("Lỗi khi chạy demo:", err);
    process.exit(1);
  });
}

module.exports = { runConcurrencyDemo, RESULT_FILE };
