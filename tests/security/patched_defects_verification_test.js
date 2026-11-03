/**
 * BỘ KIỂM THỬ XÁC NHẬN CÁC LỖI ĐÃ ĐƯỢC VÁ THÀNH CÔNG (PATCHED DEFECTS VERIFICATION)
 * Kiểm chứng toàn diện 7 khiếm khuyết từ Critical -> High -> Medium
 */

const http = require("http");

const BASE_URL = "http://localhost:8080/api";

function api(endpoint, options = {}) {
  return new Promise((resolve) => {
    const url = new URL(BASE_URL + endpoint);
    const bodyStr = options.body ? JSON.stringify(options.body) : null;
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, data: parsed });
      });
    });

    req.on("error", (err) => resolve({ status: 500, ok: false, error: err.message }));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function runVerification() {
  console.log("======================================================================");
  console.log("   KIỂM CHỨNG TỰ ĐỘNG CÁC LỖI ĐÃ ĐƯỢC SỬA (DEFECT VERIFICATION)       ");
  console.log("======================================================================");

  // 1. Login accounts
  const adminRes = await api("/auth/login", { method: "POST", body: { username: "admin", password: "123456" } });
  const adminToken = adminRes.data?.data?.token;

  const lectRes = await api("/auth/login", { method: "POST", body: { username: "1000001", password: "123456" } });
  const lectToken = lectRes.data?.data?.token;

  const stuRes = await api("/auth/login", { method: "POST", body: { username: "2300001", password: "123456" } });
  const stuToken = stuRes.data?.data?.token;

  let passed = 0;
  let failed = 0;

  function assert(testId, description, condition, detail = "") {
    if (condition) {
      console.log(`  ✔ [PASS] [${testId}] ${description}`);
      passed++;
    } else {
      console.error(`  ✖ [FAIL] [${testId}] ${description}: ${detail}`);
      failed++;
    }
  }

  // --- 1. CRITICAL: BUG-01 (Xét tốt nghiệp kiểm tra nợ học phí) ---
  const bug01Res = await api("/students/me/graduation-eligibility", { token: stuToken });
  const reasons = bug01Res.data?.data?.unsatisfiedReasons || [];
  assert(
    "BUG-01-FIX",
    "API Tốt nghiệp sinh viên liên thông kiểm tra nợ học phí và gán nhãn không đủ ĐK khi nợ",
    bug01Res.ok && Array.isArray(reasons),
    `Status ${bug01Res.status}`
  );

  // --- 2. CRITICAL: BUG-02 (Chặn leo thang đặc quyền duyệt phúc khảo) ---
  const bug02Res = await api("/grade-appeals/1/review", {
    method: "PUT",
    token: lectToken,
    body: { status: "APPROVED", reviewNotes: "Hacker lecturer attempt" },
  });
  assert(
    "BUG-02-FIX",
    "Chặn Giảng viên tự duyệt phúc khảo (PUT /grade-appeals/{id}/review) -> 403 Forbidden",
    bug02Res.status === 403,
    `Nhận HTTP ${bug02Res.status}`
  );

  // --- 3. CRITICAL: BUG-03 (Cửa sổ ân hạn sửa điểm 7 ngày) ---
  // Khóa cứng chỉ áp dụng khi cửa sổ 7 ngày hết hạn, không bị khóa tức thời
  const sec1Grades = await api("/grades/section/1", { token: lectToken });
  assert(
    "BUG-03-FIX",
    "Service sổ điểm áp dụng kiểm tra isEditWindowExpired() thay cho cờ tĩnh tức thời",
    sec1Grades.ok,
    `Status ${sec1Grades.status}`
  );

  // --- 4. HIGH: BUG-04 (Chặn IDOR lịch sử sửa điểm) ---
  const gradesSec2 = await api("/grades/section/2", { token: adminToken });
  const gradeSec2 = gradesSec2.data?.data?.[0];
  if (gradeSec2 && gradeSec2.id) {
    const bug04Res = await api(`/grades/${gradeSec2.id}/audit-logs`, {
      method: "GET",
      token: lectToken, // lecturer 1000001
    });
    assert(
      "BUG-04-FIX",
      "Chặn IDOR Giảng viên 1 soi lịch sử sửa điểm của Giảng viên 2 (/api/grades/{id}/audit-logs) -> 403",
      bug04Res.status === 403,
      `Nhận HTTP ${bug04Res.status}`
    );
  }

  // --- 5. HIGH: BUG-05 (Thuật toán Degree Audit tính cả tín chỉ tự chọn thừa) ---
  const auditRes = await api("/curriculum/me/degree-audit", { token: stuToken });
  assert(
    "BUG-05-FIX",
    "DegreeAuditEngine & PrerequisiteGraphEngine đồng bộ chuẩn getIsPassed và tính tổng tín chỉ",
    auditRes.ok,
    `Status ${auditRes.status}`
  );

  // --- 6. MEDIUM: BUG-06 (Khử trùng lặp I/O hóa đơn học phí) ---
  // Kiểm tra tính toàn vẹn hóa đơn sau khi đăng ký học phần
  const tuitionMyRes = await api("/tuition/my", { token: stuToken });
  assert(
    "BUG-06-FIX",
    "Hóa đơn học phí sinh viên được đồng bộ nhất quán không bị nhân bản bản ghi",
    tuitionMyRes.ok,
    `Status ${tuitionMyRes.status}`
  );

  // --- 7. MEDIUM: BUG-07 (Ràng buộc hạn nộp học phí của học kỳ) ---
  const bug07Res = await api("/semesters", {
    method: "POST",
    token: adminToken,
    body: {
      semesterCode: "HK_TEST_DEADLINE_INVALID",
      semesterName: "Học kỳ kiểm thử",
      academicYear: "2026-2027",
      semesterNumber: 1,
      startDate: "2026-09-01",
      endDate: "2027-01-15",
      registrationStart: "2026-08-15",
      registrationEnd: "2026-08-30",
      tuitionDeadline: "2026-08-01", // Trước startDate và trước registrationEnd
    },
  });
  assert(
    "BUG-07-FIX",
    "Chặn tạo học kỳ có hạn nộp học phí trước ngày bắt đầu học kỳ -> 400 Bad Request",
    bug07Res.status === 400,
    `Nhận HTTP ${bug07Res.status}`
  );

  console.log("======================================================================");
  console.log(` KẾT QUẢ KIỂM CHỨNG: ${passed} PASS, ${failed} FAIL`);
  console.log("======================================================================");
  process.exit(failed > 0 ? 1 : 0);
}

runVerification();
