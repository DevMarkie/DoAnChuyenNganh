/**
 * Chuẩn bị danh sách 100 sinh viên hợp lệ và sinh JWT Token
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'tokens_100.json');
const BASE_URL = process.env.API_URL || 'http://localhost:8080';

async function prepareTokens() {
  console.log('--- 1. Quét 100 sinh viên hợp lệ từ MySQL ---');
  const sql = "SELECT s.id, s.student_code, s.full_name, u.username FROM students s JOIN users u ON s.user_id = u.id JOIN classes c ON s.class_id = c.id JOIN curriculum_programs cp ON cp.major_id = c.major_id AND cp.cohort_id = c.cohort_id JOIN curriculum_blocks cb ON cb.program_id = cp.id JOIN curriculum_block_subjects cbs ON cbs.block_id = cb.id AND cbs.subject_id = 1 WHERE s.status = 'ACTIVE' AND (s.financial_hold = 0 OR s.financial_hold IS NULL) AND (s.academic_warning_level IS NULL OR s.academic_warning_level = 0) AND (SELECT COALESCE(SUM(sub.credits), 0) FROM enrollments e JOIN course_sections cs ON e.section_id = cs.id JOIN subjects sub ON sub.id = cs.subject_id WHERE e.student_id = s.id AND cs.semester_id = 5 AND e.status != 'CANCELLED') + 3 <= 24 AND NOT EXISTS (SELECT 1 FROM enrollments e JOIN course_sections cs ON e.section_id = cs.id WHERE e.student_id = s.id AND cs.semester_id = 5 AND cs.subject_id = 1 AND e.status != 'CANCELLED') ORDER BY s.id ASC LIMIT 100;";

  const cmd = `docker exec student_management_db mysql -u sms_app -psms_dev_pw student_management -N -e "${sql}"`;
  const raw = execSync(cmd, { encoding: 'utf8' });
  const lines = raw.trim().split('\n').filter(Boolean);

  const students = lines.map(line => {
    const parts = line.split('\t');
    return {
      id: Number(parts[0]),
      studentCode: parts[1],
      fullName: parts[2],
      username: parts[3]
    };
  });

  console.log(`Tìm thấy ${students.length} sinh viên đủ điều kiện. Bắt đầu lấy JWT token...`);
  const t0 = performance.now();
  const tokens = [];
  const concurrency = 20;

  let idx = 0;
  async function worker() {
    while (idx < students.length) {
      const i = idx++;
      const stu = students[i];
      try {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: stu.username, password: '123456' })
        });
        const data = await res.json();
        if (data.success && data.data?.token) {
          tokens[i] = {
            id: stu.id,
            studentCode: stu.studentCode,
            fullName: stu.fullName,
            username: stu.username,
            token: data.data.token
          };
        } else {
          console.error(`Lỗi đăng nhập ${stu.studentCode}:`, data.message);
        }
      } catch (err) {
        console.error(`Lỗi kết nối ${stu.studentCode}:`, err.message);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const validTokens = tokens.filter(Boolean);
  const duration = Math.round(performance.now() - t0);
  console.log(`✔ Hoàn tất lấy ${validTokens.length}/${students.length} tokens trong ${duration}ms!`);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(validTokens, null, 2), 'utf8');
  console.log(`Đã lưu cache token vào: ${OUTPUT_FILE}`);
  return validTokens;
}

if (require.main === module) {
  prepareTokens().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { prepareTokens, OUTPUT_FILE };

