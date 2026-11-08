/**
 * 02_race_condition_test.js
 * Kiểm thử tranh chấp tài nguyên (Concurrency / Race Conditions):
 * Kịch bản: Khi một lớp học phần chỉ còn đúng 1 suất cuối cùng (49/50 hoặc 1/1),
 * mô phỏng 10 sinh viên cùng bấm nút "Đăng ký" tại cùng một mili-giây.
 * Xác nhận:
 * - Đúng 1 sinh viên thành công (HTTP 200)
 * - 9 sinh viên còn lại nhận thông báo "Học phần đã đầy / Lớp đã hết chỗ"
 * - Không bao giờ xảy ra vượt quá giới hạn sĩ số (ví dụ: 51/50).
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_URL || 'http://localhost:8080';
const TOKENS_FILE = path.join(__dirname, '..', 'performance', 'demo_100', 'tokens_100.json');

function runSql(sql) {
  const cmd = `docker exec -i student_management_db mysql -u sms_app -psms_dev_pw --default-character-set=utf8mb4 student_management -N -s`;
  return execSync(cmd, { input: sql, encoding: 'utf8' }).trim();
}

function runRedis(cmdStr) {
  try {
    return execSync(`docker exec student_management_redis redis-cli ${cmdStr}`, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

async function runRaceConditionTest() {
  console.log('========================================================================');
  console.log(`🔒 02. KIỂM THỬ TRANH CHẤP TÀI NGUYÊN (RACE CONDITION - 1 SUẤT CUỐI CÙNG)`);
  console.log(`   Kịch bản: 10 sinh viên đồng thời bấm Đăng ký tại cùng 1 mili-giây`);
  console.log(`   Kỳ vọng: Đúng 1 thành công (HTTP 200), 9 bị từ chối, Sĩ số không vượt trần`);
  console.log('========================================================================\n');

  if (!fs.existsSync(TOKENS_FILE)) {
    throw new Error(`Không tìm thấy tệp token: ${TOKENS_FILE}. Hãy chuẩn bị token trước!`);
  }
  const allTokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
  if (allTokens.length < 10) throw new Error('Cần tối thiểu 10 token sinh viên khác nhau!');
  const testTokens = allTokens.slice(0, 10);

  // 1. Tạo lớp học phần với sức chứa 50, nhưng đã có 49 sinh viên (chỉ còn đúng 1 suất trống)
  const codeSuffix = Date.now().toString().slice(-6);
  const sectionCode = `RACE1_${codeSuffix}`;
  const maxCapacity = 50;
  const initialEnrolled = 49; // 1 slot remaining

  const currSemesterId = Number(runSql("SELECT id FROM semesters WHERE is_current = 1 LIMIT 1") || 1);

  console.log(`[Bước 1] Khởi tạo lớp học phần thử nghiệm: ${sectionCode}`);
  console.log(`         Học kỳ ID: ${currSemesterId} | Sức chứa: ${maxCapacity} sinh viên | Sĩ số ban đầu: ${initialEnrolled}/${maxCapacity} (Còn đúng 1 suất)`);

  // Đảm bảo học kỳ mở đăng ký và có registration wave
  runSql(`
    UPDATE semesters SET registration_start = DATE_SUB(CURDATE(), INTERVAL 1 DAY), registration_end = DATE_ADD(CURDATE(), INTERVAL 30 DAY), status = 'ACTIVE', is_current = 1 WHERE id = ${currSemesterId};
    INSERT INTO registration_waves (semester_id, name, shift_name, description, start_time, end_time, is_active, cohort_id, department_id, major_id, created_at, updated_at)
    SELECT ${currSemesterId}, 'Đợt ĐKHP Thử Nghiệm', 'Ca mở rộng', 'Đăng ký toàn trường', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 30 DAY), 1, NULL, NULL, NULL, NOW(), NOW()
    FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM registration_waves WHERE semester_id = ${currSemesterId});
    UPDATE registration_waves SET is_active = 1 WHERE semester_id = ${currSemesterId};
  `);

  const insertSql = `
    INSERT INTO course_sections (section_code, subject_id, lecturer_id, semester_id, max_students, enrolled_count, schedule, room, version, status, section_type, min_students, scale_coefficient, base_tuition_rate, grade_submission_status)
    VALUES ('${sectionCode}', 1, 1, ${currSemesterId}, ${maxCapacity}, ${initialEnrolled}, 'Chủ Nhật (14:00-16:30)', 'RACE-ROOM', 0, 'OPEN', 'REGULAR', 1, 1.00, 450000.00, 'DRAFT');
    SELECT id FROM course_sections WHERE section_code = '${sectionCode}';
  `;
  const sectionId = Number(runSql(insertSql).split(/\s+/)[0]);
  if (!sectionId) throw new Error('Tạo lớp học phần test thất bại');

  // Khởi tạo Redis Atomic Slot = 1 (vì 50 - 49 = 1)
  runRedis(`SET sms:section:${sectionId}:slots 1`);
  console.log(`         ✔ Đã đồng bộ Redis Atomic Counter: sms:section:${sectionId}:slots = 1`);

  // Xóa cache và log cũ của các sinh viên tham gia nếu có
  const studentIds = testTokens.map(t => t.studentId).join(',');
  runSql(`DELETE FROM enrollments WHERE section_id = ${sectionId};`);

  console.log(`\n[Bước 2] 🚀 KÍCH HOẠT 10 SINH VIÊN ĐĂNG KÝ ĐỒNG THỜI CÙNG 1 MILI-GIÂY...`);
  const t0 = performance.now();

  const reqPromises = testTokens.map((stu, idx) => {
    return (async () => {
      const sendTime = performance.now() - t0;
      try {
        const res = await fetch(`${BASE_URL}/api/enrollments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${stu.token}`
          },
          body: JSON.stringify({ sectionId })
        });
        const elapsed = performance.now() - t0 - sendTime;
        const text = await res.text();
        let body;
        try { body = JSON.parse(text); } catch { body = { message: text }; }
        return {
          studentCode: stu.studentCode,
          studentIndex: idx + 1,
          status: res.status,
          success: res.ok,
          message: body.message || text,
          latencyMs: Number(elapsed.toFixed(2))
        };
      } catch (err) {
        return {
          studentCode: stu.studentCode,
          studentIndex: idx + 1,
          status: 'NETWORK_ERR',
          success: false,
          message: err.message,
          latencyMs: 0
        };
      }
    })();
  });

  const responses = await Promise.all(reqPromises);

  // 3. Phân tích kết quả
  const successes = responses.filter(r => r.success);
  const rejections = responses.filter(r => !r.success);

  console.log(`\n--- 📊 KẾT QUẢ ĐỐI SOÁT TRẢ VỀ CỦA 10 REQUESTS ---`);
  responses.forEach(r => {
    const icon = r.success ? '✅ [THÀNH CÔNG]' : '❌ [BỊ CHẶN]  ';
    console.log(`   ${icon} SV #${r.studentIndex} (${r.studentCode}): HTTP ${r.status} ➜ ${r.message} (${r.latencyMs}ms)`);
  });

  // 4. Kiểm tra trực tiếp cơ sở dữ liệu MySQL
  const actualDbCount = Number(runSql(`SELECT count(*) FROM enrollments WHERE section_id = ${sectionId} AND status != 'CANCELLED';`)) + initialEnrolled;
  const sectionEnrolledField = Number(runSql(`SELECT enrolled_count FROM course_sections WHERE id = ${sectionId};`));

  console.log(`\n--- 🔍 ĐỐI SOÁT TOÀN VẸN CƠ SỞ DỮ LIỆU MYSQL ---`);
  console.log(`   Sĩ số trần quy định: ${maxCapacity}`);
  console.log(`   Sĩ số thực tế trong DB: ${actualDbCount}/${maxCapacity}`);
  console.log(`   Trường enrolled_count: ${sectionEnrolledField}/${maxCapacity}`);

  const passedOneWinner = successes.length === 1;
  const passedNineBlocked = rejections.length === 9;
  const passedZeroOversell = actualDbCount <= maxCapacity && sectionEnrolledField <= maxCapacity;

  const isTestPassed = passedOneWinner && passedNineBlocked && passedZeroOversell;

  console.log(`\n--- 🏆 KẾT LUẬN KIỂM THỬ TRANH CHẤP (RACE CONDITION) ---`);
  console.log(`   1. Đúng 1 người đăng ký thành công: ${passedOneWinner ? 'ĐẠT (PASS)' : `THẤT BẠI (Có ${successes.length} người thành công)`}`);
  console.log(`   2. 9 người còn lại nhận thông báo đầy: ${passedNineBlocked ? 'ĐẠT (PASS)' : `THẤT BẠI (${rejections.length}/9)`}`);
  console.log(`   3. Ngăn chặn tuyệt đối quá tải sĩ số (Zero Oversell): ${passedZeroOversell ? 'ĐẠT (PASS - Không xảy ra 51/50)' : 'THẤT BẠI (BỊ OVERSELL)'}`);
  console.log(`   ==> ĐÁNH GIÁ TỔNG THỂ: ${isTestPassed ? '🎉 TOÀN BỘ YÊU CẦU ĐẠT CHUẨN XUẤT SẮC' : '❌ CHƯA ĐẠT CHỈ TIÊU'}\n`);

  // Dọn dẹp dữ liệu thử nghiệm
  runSql(`
    DELETE FROM student_invoices WHERE section_id = ${sectionId};
    DELETE FROM enrollments WHERE section_id = ${sectionId};
    DELETE FROM course_sections WHERE id = ${sectionId};
  `);
  runRedis(`DEL sms:section:${sectionId}:slots`);

  const summary = {
    testName: 'Concurrency & Race Condition (1-Slot Remaining)',
    timestamp: new Date().toISOString(),
    totalCompetitors: 10,
    initialSlotRemaining: 1,
    successCount: successes.length,
    rejectedCount: rejections.length,
    finalEnrolledCount: actualDbCount,
    maxCapacity,
    winner: successes[0]?.studentCode || null,
    passedOneWinner,
    passedNineBlocked,
    passedZeroOversell,
    status: isTestPassed ? 'PASSED' : 'FAILED',
    details: responses
  };

  const outDir = path.join(__dirname, '..', 'results');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'race_condition_summary.json'), JSON.stringify(summary, null, 2));

  return summary;
}

if (require.main === module) {
  runRaceConditionTest()
    .then(r => process.exit(r.status === 'PASSED' ? 0 : 1))
    .catch(err => {
      console.error('Fatal race condition error:', err);
      process.exit(1);
    });
}

module.exports = { runRaceConditionTest };
